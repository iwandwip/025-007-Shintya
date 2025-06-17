import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getActiveTimeline, calculatePackageStatus } from './timelineService';
import { toISOString } from '../utils/dateUtils';

let cachedPackages = new Map();
let cachedTimeline = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000;

const isCacheValid = () => {
  return cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

export const getUserPackageHistory = async (userId) => {
  try {
    if (!db) {
      return { success: true, packages: [], timeline: null };
    }

    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan', packages: [], timeline: null };
    }

    let timeline;
    const cacheKey = userId;

    if (isCacheValid() && cachedTimeline && cachedPackages.has(cacheKey)) {
      return {
        success: true,
        packages: cachedPackages.get(cacheKey),
        timeline: cachedTimeline
      };
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      return { 
        success: false, 
        error: 'Timeline aktif tidak ditemukan', 
        packages: [], 
        timeline: null 
      };
    }

    timeline = timelineResult.timeline;
    const activePeriods = Object.keys(timeline.periods).filter(
      periodKey => timeline.periods[periodKey].active
    );

    const packagePromises = activePeriods.map(async (periodKey) => {
      try {
        const packagesRef = collection(
          db, 
          'packages', 
          timeline.id, 
          'periods', 
          periodKey, 
          'user_packages'
        );
        
        const q = query(packagesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const period = timeline.periods[periodKey];
        
        if (querySnapshot.empty) {
          const packageData = {
            id: `${userId}_${periodKey}`,
            userId: userId,
            period: periodKey,
            periodLabel: period.label,
            packageId: `PKG${Date.now()}`,
            deliveryDate: period.dueDate,
            status: 'pending',
            pickupDate: null,
            accessMethod: null,
            notes: '',
            periodData: period,
            periodKey: periodKey,
            weight: 0,
            dimensions: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          packageData.status = calculatePackageStatus(packageData, timeline);
          return packageData;
        } else {
          const packageInfo = querySnapshot.docs[0].data();
          const packageData = {
            id: querySnapshot.docs[0].id,
            ...packageInfo,
            periodData: period,
            periodKey: periodKey
          };
          
          packageData.status = calculatePackageStatus(packageData, timeline);
          return packageData;
        }
      } catch (periodError) {
        console.warn(`Error loading period ${periodKey}:`, periodError);
        const period = timeline.periods[periodKey];
        const packageData = {
          id: `${userId}_${periodKey}`,
          userId: userId,
          period: periodKey,
          periodLabel: period.label,
          packageId: `PKG${Date.now()}`,
          deliveryDate: period.dueDate,
          status: 'pending',
          pickupDate: null,
          accessMethod: null,
          notes: '',
          periodData: period,
          periodKey: periodKey,
          weight: 0,
          dimensions: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        packageData.status = calculatePackageStatus(packageData, timeline);
        return packageData;
      }
    });

    const allPackages = await Promise.all(packagePromises);

    allPackages.sort((a, b) => {
      const periodA = parseInt(a.periodKey.replace('period_', ''));
      const periodB = parseInt(b.periodKey.replace('period_', ''));
      return periodA - periodB;
    });

    cachedPackages.set(cacheKey, allPackages);
    cachedTimeline = timeline;
    cacheTimestamp = Date.now();

    return { success: true, packages: allPackages, timeline };
  } catch (error) {
    console.error('Error getting user package history:', error);
    return { success: false, error: error.message, packages: [], timeline: null };
  }
};

export const updateUserPackageStatus = async (timelineId, periodKey, userId, updateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    if (!timelineId || !periodKey || !userId) {
      throw new Error('Parameter tidak lengkap untuk update package');
    }

    const packageRef = doc(
      db, 
      'packages', 
      timelineId, 
      'periods', 
      periodKey, 
      'user_packages', 
      userId
    );

    const updatePayload = {
      ...updateData,
      updatedAt: new Date()
    };

    try {
      await updateDoc(packageRef, updatePayload);
    } catch (updateError) {
      if (updateError.code === 'not-found') {
        const timeline = cachedTimeline || (await getActiveTimeline()).timeline;
        if (timeline) {
          const period = timeline.periods[periodKey];
          
          if (period) {
            const newPackageData = {
              id: `${userId}_${periodKey}`,
              userId: userId,
              period: periodKey,
              periodLabel: period.label,
              packageId: `PKG${Date.now()}`,
              deliveryDate: period.dueDate,
              ...updatePayload,
              createdAt: new Date()
            };

            await setDoc(packageRef, newPackageData);
          } else {
            throw new Error('Period tidak ditemukan dalam timeline');
          }
        } else {
          throw new Error('Timeline aktif tidak ditemukan');
        }
      } else {
        throw updateError;
      }
    }

    cachedPackages.delete(userId);
    cacheTimestamp = null;

    return { success: true };
  } catch (error) {
    console.error('Error updating user package status:', error);
    return { success: false, error: error.message };
  }
};

export const getPackageSummary = (packages) => {
  const total = packages.length;
  const delivered = packages.filter(p => p.status === 'delivered').length;
  const pending = packages.filter(p => p.status === 'pending').length;
  const pickedUp = packages.filter(p => p.status === 'picked_up').length;
  const returned = packages.filter(p => p.status === 'returned').length;
  
  const totalWeight = packages.reduce((sum, p) => sum + (p.weight || 0), 0);
  const deliveredWeight = packages
    .filter(p => p.status === 'delivered')
    .reduce((sum, p) => sum + (p.weight || 0), 0);
  const pendingWeight = totalWeight - deliveredWeight;

  const progressPercentage = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return {
    total,
    delivered,
    pending,
    pickedUp,
    returned,
    totalWeight,
    deliveredWeight,
    pendingWeight,
    progressPercentage
  };
};

export const getUserPriority = async (userId) => {
  try {
    if (!db || !userId) {
      return { success: false, priority: 'normal' };
    }

    const userDoc = await doc(db, 'users', userId);
    const userData = await getDoc(userDoc);
    
    if (userData.exists()) {
      const data = userData.data();
      return {
        success: true,
        priority: data.priority || 'normal'
      };
    }
    
    return { success: true, priority: 'normal' };
  } catch (error) {
    console.error('Error getting user priority:', error);
    return { success: false, priority: 'normal', error: error.message };
  }
};

export const updateUserPriority = async (userId, newPriority) => {
  try {
    if (!db || !userId) {
      throw new Error('Parameter tidak lengkap');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      priority: newPriority,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user priority:', error);
    return { success: false, error: error.message };
  }
};

export const applyPriorityToPackages = (packages, userPriority) => {
  const updatedPackages = [...packages];

  for (let i = 0; i < updatedPackages.length; i++) {
    const packageData = updatedPackages[i];
    
    if (packageData.status === 'pending' && userPriority === 'high') {
      updatedPackages[i] = {
        ...packageData,
        priority: 'high',
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
      };
    } else if (packageData.status === 'pending') {
      updatedPackages[i] = {
        ...packageData,
        priority: 'normal',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      };
    }
  }

  return {
    packages: updatedPackages
  };
};

export const processPackagePickup = async (timelineId, periodKey, userId, accessMethod) => {
  try {
    if (!db || !timelineId || !periodKey || !userId) {
      throw new Error('Parameter tidak lengkap');
    }

    const priorityResult = await getUserPriority(userId);
    if (!priorityResult.success) {
      throw new Error('Gagal mengambil prioritas user');
    }

    const userPriority = priorityResult.priority;
    const packageHistory = await getUserPackageHistory(userId);
    
    if (!packageHistory.success) {
      throw new Error('Gagal mengambil riwayat paket');
    }

    const targetPackage = packageHistory.packages.find(p => p.periodKey === periodKey);
    if (!targetPackage) {
      throw new Error('Paket tidak ditemukan');
    }

    // Update status package
    const updateData = {
      status: 'picked_up',
      pickupDate: toISOString(),
      accessMethod: accessMethod,
      priority: userPriority,
      notes: `Paket diambil via ${accessMethod}`
    };

    const packageResult = await updateUserPackageStatus(timelineId, periodKey, userId, updateData);
    if (!packageResult.success) {
      throw new Error('Gagal update status paket');
    }

    return {
      success: true,
      packageStatus: 'picked_up',
      pickupDate: updateData.pickupDate,
      accessMethod: accessMethod
    };
  } catch (error) {
    console.error('Error processing package pickup:', error);
    return { success: false, error: error.message };
  }
};

export const clearUserCache = () => {
  cachedPackages.clear();
  cachedTimeline = null;
  cacheTimestamp = null;
};