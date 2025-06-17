import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const CAPACITY_COLLECTION = 'capacity';
const CAPACITY_DOC_ID = 'box_sensor';

export const getCapacityData = async () => {
  try {
    const docRef = doc(db, CAPACITY_COLLECTION, CAPACITY_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: docSnap.data()
      };
    } else {
      const defaultData = {
        height: 0,
        maxHeight: 30,
        lastUpdated: serverTimestamp(),
        deviceId: 'ESP32_001'
      };
      
      await setDoc(docRef, defaultData);
      return {
        success: true,
        data: defaultData
      };
    }
  } catch (error) {
    console.error('Error getting capacity data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const updateCapacityHeight = async (height, deviceId = 'ESP32_001') => {
  try {
    const docRef = doc(db, CAPACITY_COLLECTION, CAPACITY_DOC_ID);
    await updateDoc(docRef, {
      height: height,
      lastUpdated: serverTimestamp(),
      deviceId: deviceId
    });
    
    return {
      success: true,
      message: 'Height updated successfully'
    };
  } catch (error) {
    console.error('Error updating capacity height:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const subscribeToCapacityUpdates = (callback) => {
  const docRef = doc(db, CAPACITY_COLLECTION, CAPACITY_DOC_ID);
  
  return onSnapshot(
    docRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback({
          success: true,
          data: docSnapshot.data()
        });
      } else {
        callback({
          success: false,
          error: 'Document does not exist'
        });
      }
    },
    (error) => {
      console.error('Error in capacity subscription:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  );
};

export const calculateCapacityStatus = (height, maxHeight = 30) => {
  const percentage = (height / maxHeight) * 100;
  
  let status, message, color;
  
  if (percentage >= 90) {
    status = 'Penuh';
    message = 'Box hampir penuh, segera kosongkan';
    color = '#EF4444';
  } else if (percentage >= 70) {
    status = 'Hampir Penuh';
    message = 'Box mulai terisi, perhatikan kapasitas';
    color = '#F59E0B';
  } else if (percentage >= 30) {
    status = 'Terisi Sebagian';
    message = 'Box tersedia untuk paket';
    color = '#3B82F6';
  } else {
    status = 'Kosong';
    message = 'Box kosong, siap menerima paket';
    color = '#22C55E';
  }
  
  return {
    percentage: Math.min(percentage, 100),
    status,
    message,
    color
  };
};