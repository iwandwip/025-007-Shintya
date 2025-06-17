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
      });
      
      return { 
        success: true, 
        stats: {
          total: totalPackages,
          cod: codPackages,
          pending: pendingPackages
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
      await updateDoc(resiRef, {
        ...resiData,
        updatedAt: serverTimestamp(),
      });
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
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalPackages++;
          
          if (data.tipePaket === "COD") {
            codPackages++;
          }
          
          if (data.status === "Sedang Dikirim" || data.status === "Telah Tiba") {
            pendingPackages++;
          }
        });
        
        callback({ 
          success: true, 
          stats: {
            total: totalPackages,
            cod: codPackages,
            pending: pendingPackages
          }
        });
      },
      (error) => {
        console.error("Error listening to user package stats:", error);
        callback({ success: false, error: error.message });
      }
    );
  },
};