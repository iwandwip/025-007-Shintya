import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  where,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { activityService } from "./activityService";

const COLLECTION_NAME = "receipts";

export const resiService = {
  async addResi(resiData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...resiData,
        status: "Sedang Dikirim", // Default status untuk paket baru
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Track activity for new package
      await activityService.trackPackageAdded(
        resiData.userId,
        resiData.noResi,
        resiData.nama
      );
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding resi:", error);
      return { success: false, error: error.message };
    }
  },

  async getResiList() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const resiList = [];
      querySnapshot.forEach((doc) => {
        resiList.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: resiList };
    } catch (error) {
      console.error("Error getting resi list:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserResiCount(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      return { success: true, count: querySnapshot.size };
    } catch (error) {
      console.error("Error getting user resi count:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserPackageStats(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      let totalPackages = 0;
      let codPackages = 0;
      let pendingPackages = 0;
      let arrivedPackages = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalPackages++;
        
        if (data.tipePaket === "COD") {
          codPackages++;
        }
        
        // Count packages that are still in transit or arrived but not picked up
        if (data.status === "Sedang Dikirim" || data.status === "Telah Tiba") {
          pendingPackages++;
        }
        
        // Count packages that have arrived but not picked up
        if (data.status === "Telah Tiba") {
          arrivedPackages++;
        }
      });
      
      return { 
        success: true, 
        stats: {
          total: totalPackages,
          cod: codPackages,
          pending: pendingPackages,
          arrived: arrivedPackages
        }
      };
    } catch (error) {
      console.error("Error getting user package stats:", error);
      return { success: false, error: error.message };
    }
  },

  async updateResi(resiId, resiData) {
    try {
      const resiRef = doc(db, COLLECTION_NAME, resiId);
      
      // Get current data to check for status changes
      const currentDoc = await getDoc(resiRef);
      const currentData = currentDoc.data();
      
      await updateDoc(resiRef, {
        ...resiData,
        updatedAt: serverTimestamp(),
      });
      
      // Track status change if status was updated
      if (resiData.status && currentData.status !== resiData.status) {
        await activityService.trackStatusChange(
          currentData.userId,
          currentData.noResi,
          currentData.status,
          resiData.status,
          currentData.nama
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating resi:", error);
      return { success: false, error: error.message };
    }
  },

  async deleteResi(resiId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, resiId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting resi:", error);
      return { success: false, error: error.message };
    }
  },

  subscribeToResiList(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const resiList = [];
        snapshot.forEach((doc) => {
          resiList.push({ id: doc.id, ...doc.data() });
        });
        callback({ success: true, data: resiList });
      },
      (error) => {
        console.error("Error listening to resi changes:", error);
        callback({ success: false, error: error.message });
      }
    );
  },

  subscribeToUserPackageStats(userId, callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        let totalPackages = 0;
        let codPackages = 0;
        let pendingPackages = 0;
        let arrivedPackages = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalPackages++;
          
          if (data.tipePaket === "COD") {
            codPackages++;
          }
          
          if (data.status === "Sedang Dikirim" || data.status === "Telah Tiba") {
            pendingPackages++;
          }
          
          if (data.status === "Telah Tiba") {
            arrivedPackages++;
          }
        });
        
        callback({ 
          success: true, 
          stats: {
            total: totalPackages,
            cod: codPackages,
            pending: pendingPackages,
            arrived: arrivedPackages
          }
        });
      },
      (error) => {
        console.error("Error listening to user package stats:", error);
        callback({ success: false, error: error.message });
      }
    );
  },

  async getOccupiedLokers() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("tipePaket", "==", "COD"),
        where("status", "in", ["Sedang Dikirim", "Telah Tiba"])
      );
      const querySnapshot = await getDocs(q);
      
      const occupiedLokers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.nomorLoker) {
          occupiedLokers.push(data.nomorLoker);
        }
      });
      
      return { success: true, data: occupiedLokers };
    } catch (error) {
      console.error("Error getting occupied lokers:", error);
      return { success: false, error: error.message };
    }
  },

  subscribeToOccupiedLokers(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("tipePaket", "==", "COD"),
      where("status", "in", ["Sedang Dikirim", "Telah Tiba"])
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const occupiedLokers = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nomorLoker) {
            occupiedLokers.push(data.nomorLoker);
          }
        });
        
        callback({ success: true, data: occupiedLokers });
      },
      (error) => {
        console.error("Error listening to occupied lokers:", error);
        callback({ success: false, error: error.message });
      }
    );
  },
};