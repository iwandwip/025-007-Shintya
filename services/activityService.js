import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  where,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";

const COLLECTION_NAME = "globalActivities";

export const activityService = {
  async addActivity(activityData) {
    try {
      // Add new activity to global collection
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...activityData,
        createdAt: serverTimestamp(),
      });

      // Clean up old activities (keep only 3 most recent per user)
      await this.cleanupOldActivities(activityData.userId);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding activity:", error);
      return { success: false, error: error.message };
    }
  },

  async cleanupOldActivities(userId) {
    try {
      // Get all activities for this user without orderBy to avoid index requirement
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });

      // Sort in memory by creation time (newest first)
      const sortedActivities = activities.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime - aTime;
      });

      // Delete activities beyond the 3 most recent
      if (sortedActivities.length > 3) {
        const activitiesToDelete = sortedActivities.slice(3);
        const deletePromises = activitiesToDelete.map(activity => 
          deleteDoc(doc(db, COLLECTION_NAME, activity.id))
        );
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error("Error cleaning up old activities:", error);
    }
  },

  async getUserActivities(userId) {
    try {
      // Simple query without composite index - get all user activities first
      const userActivitiesQuery = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(userActivitiesQuery);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort in memory and take only the latest 3
      const sortedActivities = activities
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime - aTime;
        })
        .slice(0, 3);
      
      return { success: true, data: sortedActivities };
    } catch (error) {
      console.error("Error getting user activities:", error);
      return { success: false, error: error.message };
    }
  },

  subscribeToUserActivities(userId, callback) {
    // Use simple query to avoid index requirement
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const activities = [];
        snapshot.forEach((doc) => {
          activities.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in memory and take only the latest 3
        const sortedActivities = activities
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bTime - aTime;
          })
          .slice(0, 3);
        
        callback({ success: true, data: sortedActivities });
      },
      (error) => {
        console.error("Error listening to user activities:", error);
        callback({ success: false, error: error.message });
      }
    );
  },

  async trackStatusChange(userId, resiNumber, oldStatus, newStatus, packageName) {
    const statusMessages = {
      "Sedang Dikirim": "sedang dalam perjalanan",
      "Telah Tiba": "telah tiba di tujuan", 
      "Telah Diambil": "telah diambil"
    };

    const activity = {
      userId,
      type: "status_change",
      resiNumber: resiNumber || "N/A",
      message: `Paket ${packageName || resiNumber || "Unknown"} ${statusMessages[newStatus] || newStatus.toLowerCase()}`,
      status: newStatus,
      icon: newStatus === "Telah Tiba" ? "📦" : newStatus === "Telah Diambil" ? "✅" : "🚚"
    };

    return await this.addActivity(activity);
  },

  async trackPackageAdded(userId, resiNumber, packageName) {
    const activity = {
      userId,
      type: "package_added",
      resiNumber: resiNumber || "N/A",
      message: `Paket baru ditambahkan: ${packageName || resiNumber || "Unknown"}`,
      status: "Sedang Dikirim",
      icon: "📦"
    };

    return await this.addActivity(activity);
  }
};