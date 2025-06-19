import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "lokerControl";

export const lokerControlService = {
  async sendLokerCommand(nomorLoker, command) {
    try {
      const docRef = doc(db, COLLECTION_NAME, `loker_${nomorLoker}`);
      
      const commandData = {
        buka: command === "buka" ? 1 : 0,
        tutup: command === "tutup" ? 1 : 0,
        timestamp: serverTimestamp(),
        lastCommand: command,
        nomorLoker: nomorLoker,
      };
      
      await setDoc(docRef, commandData, { merge: true });
      
      // Auto-reset after 10 seconds
      setTimeout(async () => {
        try {
          const resetData = {
            buka: 0,
            tutup: 0,
            timestamp: serverTimestamp(),
            lastCommand: "reset",
          };
          await setDoc(docRef, resetData, { merge: true });
        } catch (error) {
          console.error("Error resetting loker command:", error);
        }
      }, 10000);
      
      return { success: true };
    } catch (error) {
      console.error("Error sending loker command:", error);
      return { success: false, error: error.message };
    }
  },

  async openLoker(nomorLoker) {
    return this.sendLokerCommand(nomorLoker, "buka");
  },

  async closeLoker(nomorLoker) {
    return this.sendLokerCommand(nomorLoker, "tutup");
  },

  subscribeToLokerStatus(nomorLoker, callback) {
    const docRef = doc(db, COLLECTION_NAME, `loker_${nomorLoker}`);
    
    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ success: true, data: doc.data() });
        } else {
          callback({ 
            success: true, 
            data: { 
              buka: 0, 
              tutup: 0, 
              nomorLoker: nomorLoker,
              lastCommand: "none" 
            } 
          });
        }
      },
      (error) => {
        console.error("Error listening to loker status:", error);
        callback({ success: false, error: error.message });
      }
    );
  },

  subscribeToAllLokers(callback) {
    const promises = [];
    const lokerData = {};
    
    for (let i = 1; i <= 5; i++) {
      const docRef = doc(db, COLLECTION_NAME, `loker_${i}`);
      const unsubscribe = onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            lokerData[i] = doc.data();
          } else {
            lokerData[i] = { 
              buka: 0, 
              tutup: 0, 
              nomorLoker: i,
              lastCommand: "none" 
            };
          }
          callback({ success: true, data: lokerData });
        },
        (error) => {
          console.error(`Error listening to loker ${i}:`, error);
          callback({ success: false, error: error.message });
        }
      );
      promises.push(unsubscribe);
    }
    
    // Return function to unsubscribe all listeners
    return () => {
      promises.forEach(unsubscribe => unsubscribe());
    };
  },
};