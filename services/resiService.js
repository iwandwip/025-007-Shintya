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
};