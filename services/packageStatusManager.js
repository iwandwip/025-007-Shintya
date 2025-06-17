import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserPackageHistory } from './userPackageService';
import { getActiveTimeline } from './timelineService';

class PackageStatusManager {
  constructor() {
    this.cache = new Map();
    this.lastUpdateTimes = new Map();
    this.isUpdating = new Set();
    this.throttleSettings = {
      perUser: 5 * 60 * 1000,
      perPage: 2 * 60 * 1000,
      backgroundResume: 30 * 60 * 1000
    };
    this.backgroundTime = null;
    this.listeners = new Set();
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  getCacheKey(type, userId = null) {
    return userId ? `${type}_${userId}` : type;
  }

  async getFromCache(key) {
    try {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.throttleSettings.perPage) {
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  setCache(key, data) {
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  shouldSkipUpdate(type, userId = null) {
    const key = this.getCacheKey(type, userId);
    const lastUpdate = this.lastUpdateTimes.get(key);
    
    if (!lastUpdate) return false;
    
    const timeSinceUpdate = Date.now() - lastUpdate;
    return timeSinceUpdate < this.throttleSettings.perUser;
  }

  markUpdateTime(type, userId = null) {
    const key = this.getCacheKey(type, userId);
    this.lastUpdateTimes.set(key, Date.now());
  }

  async updateUserPackageStatus(userId, forceUpdate = false, source = 'manual') {
    if (!userId) return { success: false, error: 'User ID required' };

    const key = this.getCacheKey('user_packages', userId);
    
    if (!forceUpdate && this.shouldSkipUpdate('user_packages', userId)) {
      console.log(`Skipping user package update for ${userId} due to throttling`);
      const cached = await this.getFromCache(key);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    if (this.isUpdating.has(key)) {
      console.log(`Update already in progress for ${userId}`);
      return { success: false, error: 'Update in progress' };
    }

    try {
      this.isUpdating.add(key);
      console.log(`Updating package status for user ${userId} (source: ${source})`);

      const result = await getUserPackageHistory(userId);
      
      if (result.success) {
        this.setCache(key, result);
        this.markUpdateTime('user_packages', userId);
        
        this.notifyListeners('user_package_updated', {
          userId,
          data: result,
          source
        });

        const overduePackages = this.checkForOverduePackages(result.packages || []);
        const upcomingPackages = this.checkForUpcomingPackages(result.packages || []);
        
        if (overduePackages.length > 0) {
          this.notifyListeners('packages_overdue', {
            userId,
            packages: overduePackages,
            count: overduePackages.length
          });
        }

        if (upcomingPackages.length > 0) {
          this.notifyListeners('packages_upcoming', {
            userId,
            packages: upcomingPackages,
            count: upcomingPackages.length
          });
        }

        return { success: true, data: result, source };
      }

      return result;
    } catch (error) {
      console.error('Error updating user package status:', error);
      return { success: false, error: error.message };
    } finally {
      this.isUpdating.delete(key);
    }
  }

  // Admin functionality removed - this method is no longer available
  async updateAllUsersPackageStatus() {
    return { success: false, error: 'Admin functionality has been removed' };
  }

  checkForOverduePackages(packages) {
    return packages.filter(packageData => packageData.status === 'returned');
  }

  checkForUpcomingPackages(packages) {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return packages.filter(packageData => {
      if (packageData.status !== 'pending') return false;
      
      const deliveryDate = new Date(packageData.deliveryDate);
      return deliveryDate <= threeDaysFromNow && deliveryDate > now;
    });
  }

  async handleAppStateChange(nextAppState, userId = null) {
    if (nextAppState === 'active') {
      const now = Date.now();
      const timeSinceBackground = this.backgroundTime ? now - this.backgroundTime : 0;
      
      if (timeSinceBackground > this.throttleSettings.backgroundResume) {
        console.log('App resumed after long background, updating package status');
        
        if (userId) {
          await this.updateUserPackageStatus(userId, false, 'app_resume');
        } else {
          await this.updateAllUsersPackageStatus(false, 'app_resume');
        }
      }
    } else if (nextAppState === 'background') {
      this.backgroundTime = Date.now();
    }
  }

  async handleUserLogin(userId) {
    console.log('User logged in, updating package status');
    return await this.updateUserPackageStatus(userId, true, 'login');
  }

  async handlePageNavigation(page, userId = null) {
    const isPackagePage = page.includes('package') || page.includes('resi') || page.includes('status');
    
    if (isPackagePage) {
      console.log(`Navigated to package page: ${page}`);
      
      if (userId) {
        return await this.updateUserPackageStatus(userId, false, 'page_navigation');
      } else {
        return await this.updateAllUsersPackageStatus(false, 'page_navigation');
      }
    }
    
    return { success: true, skipped: true };
  }

  async clearUserCache(userId) {
    if (userId) {
      const userKey = this.getCacheKey('user_packages', userId);
      this.cache.delete(userKey);
      this.lastUpdateTimes.delete(userKey);
    }
  }

  clearAllCache() {
    this.cache.clear();
    this.lastUpdateTimes.clear();
    this.isUpdating.clear();
  }

  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      lastUpdateTimes: Object.fromEntries(this.lastUpdateTimes),
      isUpdating: Array.from(this.isUpdating),
      throttleSettings: this.throttleSettings
    };
  }
}

export const packageStatusManager = new PackageStatusManager();