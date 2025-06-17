import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export const createTimelineTemplate = async (templateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const templateId = `template_${Date.now()}`;
    const template = {
      id: templateId,
      name: templateData.name,
      type: templateData.type,
      duration: templateData.duration,
      baseWeight: templateData.baseWeight,
      deliveryDays: templateData.deliveryDays || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'timeline_templates', templateId), template);
    return { success: true, template };
  } catch (error) {
    console.error('Error creating timeline template:', error);
    return { success: false, error: error.message };
  }
};

export const getTimelineTemplates = async () => {
  try {
    if (!db) {
      return { success: true, templates: [] };
    }

    const templatesRef = collection(db, 'timeline_templates');
    const querySnapshot = await getDocs(templatesRef);
    
    const templates = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Error getting timeline templates:', error);
    return { success: false, error: error.message, templates: [] };
  }
};

export const createActiveTimeline = async (timelineData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const periods = generatePeriods(timelineData);
    const activeTimeline = {
      id: timelineData.id,
      name: timelineData.name,
      type: timelineData.type,
      duration: timelineData.duration,
      baseAmount: timelineData.baseAmount,
      totalAmount: timelineData.totalAmount,
      amountPerPeriod: timelineData.amountPerPeriod,
      startDate: timelineData.startDate,
      mode: timelineData.mode,
      simulationDate: timelineData.mode === 'manual' ? timelineData.simulationDate : null,
      holidays: timelineData.holidays || [],
      periods: periods,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'active_timeline', 'current'), activeTimeline);
    return { success: true, timeline: activeTimeline };
  } catch (error) {
    console.error('Error creating active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const getActiveTimeline = async () => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore tidak tersedia' };
    }

    const docRef = doc(db, 'active_timeline', 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, timeline: docSnap.data() };
    } else {
      return { success: false, error: 'Timeline aktif tidak ditemukan' };
    }
  } catch (error) {
    console.error('Error getting active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentDate = (timeline) => {
  if (timeline && timeline.mode === 'manual' && timeline.simulationDate) {
    return new Date(timeline.simulationDate);
  }
  return new Date();
};

export const updateTimelineSimulationDate = async (simulationDateTime) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineRef = doc(db, 'active_timeline', 'current');
    
    let simulationDate;
    if (typeof simulationDateTime === 'string') {
      if (simulationDateTime.includes('T')) {
        simulationDate = simulationDateTime;
      } else {
        simulationDate = simulationDateTime;
      }
    } else {
      simulationDate = new Date(simulationDateTime).toISOString();
    }

    await updateDoc(timelineRef, {
      simulationDate: simulationDate,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating simulation date:', error);
    return { success: false, error: error.message };
  }
};

export const deleteActiveTimeline = async (deletePackageData = false) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const batch = writeBatch(db);

    if (deletePackageData) {
      // Delete all package data for this timeline including user packages
      for (const periodKey of Object.keys(timeline.periods)) {
        // Get all user packages for this period
        const userPackagesRef = collection(db, 'packages', timeline.id, 'periods', periodKey, 'user_packages');
        const userSnapshot = await getDocs(userPackagesRef);
        
        // Delete each user package
        userSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Delete the period document
        const periodRef = doc(db, 'packages', timeline.id, 'periods', periodKey);
        batch.delete(periodRef);
      }

      // Delete the main packages collection document
      const packagesRef = doc(db, 'packages', timeline.id);
      batch.delete(packagesRef);

      // Optional: Reset priority for all users
      // Get all users to reset their priority
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.priority && userData.priority !== 'normal') {
          // Reset priority to normal
          batch.update(userDoc.ref, { 
            priority: 'normal',
            updatedAt: new Date()
          });
        }
      });
    }

    // Always delete the timeline itself
    const timelineRef = doc(db, 'active_timeline', 'current');
    batch.delete(timelineRef);

    await batch.commit();
    
    return { 
      success: true, 
      message: deletePackageData 
        ? 'Timeline dan data paket berhasil dihapus'
        : 'Timeline berhasil dihapus, data paket dipertahankan'
    };
  } catch (error) {
    console.error('Error deleting active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const generatePackagesForTimeline = async (timelineId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const userResult = await getAllUsers();
    if (!userResult.success) {
      throw new Error('Gagal mengambil data user');
    }

    const batch = writeBatch(db);
    const userList = userResult.data;

    Object.keys(timeline.periods).forEach(periodKey => {
      const period = timeline.periods[periodKey];
      if (period.active) {
        userList.forEach(user => {
          const packageId = `${user.id}_${periodKey}`;
          const packageRef = doc(db, 'packages', timelineId, 'periods', periodKey, 'user_packages', user.id);
          
          const packageData = {
            id: packageId,
            userId: user.id,
            userName: user.nama,
            period: periodKey,
            periodLabel: period.label,
            packageId: `PKG${Date.now()}_${user.id}`,
            deliveryDate: period.dueDate,
            status: 'pending',
            pickupDate: null,
            accessMethod: null,
            notes: '',
            weight: 0,
            dimensions: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          batch.set(packageRef, packageData);
        });
      }
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error generating packages:', error);
    return { success: false, error: error.message };
  }
};

export const getPackagesByPeriod = async (timelineId, periodKey) => {
  try {
    if (!db) {
      return { success: true, packages: [] };
    }

    const packagesRef = collection(db, 'packages', timelineId, 'periods', periodKey, 'user_packages');
    const querySnapshot = await getDocs(packagesRef);
    
    const packages = [];
    querySnapshot.forEach((doc) => {
      packages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, packages };
  } catch (error) {
    console.error('Error getting packages by period:', error);
    return { success: false, error: error.message, packages: [] };
  }
};

export const updatePackageStatus = async (timelineId, periodKey, userId, updateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const packageRef = doc(db, 'packages', timelineId, 'periods', periodKey, 'user_packages', userId);
    const updatePayload = {
      ...updateData,
      updatedAt: new Date()
    };

    await updateDoc(packageRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error('Error updating package status:', error);
    return { success: false, error: error.message };
  }
};

export const resetTimelinePackages = async (timelineId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const batch = writeBatch(db);

    Object.keys(timeline.periods).forEach(periodKey => {
      const periodRef = doc(db, 'packages', timelineId, 'periods', periodKey);
      batch.delete(periodRef);
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error resetting timeline packages:', error);
    return { success: false, error: error.message };
  }
};

export const calculatePackageStatus = (packageData, timeline) => {
  if (!packageData || !timeline) return packageData?.status || 'pending';
  
  if (packageData.status === 'delivered') return 'delivered';
  if (packageData.status === 'picked_up') return 'picked_up';
  if (packageData.status === 'returned') return 'returned';
  
  const currentDate = getCurrentDate(timeline);
  const dueDate = new Date(packageData.deliveryDate);
  
  if (currentDate > dueDate && packageData.status === 'pending') {
    return 'overdue';
  }
  
  return 'pending';
};

const generatePeriods = (timelineData) => {
  const periods = {};
  const activePeriods = timelineData.duration - (timelineData.holidays?.length || 0);
  const amountPerPeriod = Math.ceil(timelineData.totalAmount / activePeriods);

  for (let i = 1; i <= timelineData.duration; i++) {
    const isHoliday = timelineData.holidays?.includes(i) || false;
    const periodKey = `period_${i}`;
    
    periods[periodKey] = {
      number: i,
      label: getPeriodLabel(timelineData.type, i, timelineData.startDate),
      dueDate: calculateDueDate(timelineData.type, i, timelineData.startDate),
      active: !isHoliday,
      amount: isHoliday ? 0 : amountPerPeriod,
      isHoliday: isHoliday
    };
  }

  return periods;
};

const getPeriodLabel = (type, number, startDate) => {
  const typeLabels = {
    yearly: 'Tahun',
    monthly: 'Bulan', 
    weekly: 'Minggu',
    daily: 'Hari',
    hourly: 'Jam',
    minute: 'Menit'
  };
  
  return `${typeLabels[type]} ${number}`;
};

const calculateDueDate = (type, periodNumber, startDate) => {
  const start = new Date(startDate);
  let dueDate = new Date(start);

  switch (type) {
    case 'yearly':
      dueDate.setFullYear(start.getFullYear() + periodNumber);
      break;
    case 'monthly':
      dueDate.setMonth(start.getMonth() + periodNumber);
      break;
    case 'weekly':
      dueDate.setDate(start.getDate() + (periodNumber * 7));
      break;
    case 'daily':
      dueDate.setDate(start.getDate() + periodNumber);
      break;
    case 'hourly':
      dueDate.setHours(start.getHours() + periodNumber);
      break;
    case 'minute':
      dueDate.setMinutes(start.getMinutes() + periodNumber);
      break;
    default:
      dueDate.setDate(start.getDate() + periodNumber);
  }

  return dueDate.toISOString();
};

const getAllUsers = async () => {
  try {
    if (!db) {
      return { success: true, data: [] };
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'));
    const querySnapshot = await getDocs(q);
    
    const userList = [];
    querySnapshot.forEach((doc) => {
      userList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, data: userList };
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error: error.message, data: [] };
  }
};