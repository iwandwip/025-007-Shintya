import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

export const createUserProfile = async (uid, profileData) => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, skip pembuatan profil');
      return { 
        success: true, 
        profile: { 
          id: uid, 
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      };
    }

    const userProfile = {
      id: uid,
      email: profileData.email,
      role: profileData.role,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (profileData.role === 'user') {
      userProfile.nama = profileData.nama;
      userProfile.noTelp = profileData.noTelp;
      userProfile.rfidCode = profileData.rfidCode || "";
    }

    await setDoc(doc(db, 'users', uid), userProfile);
    console.log('Profil user berhasil dibuat');
    return { success: true, profile: userProfile };
  } catch (error) {
    console.error('Error membuat profil user:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, return fallback profil');
      return { 
        success: false, 
        error: 'Firestore tidak tersedia' 
      };
    }

    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const profile = docSnap.data();
      
      if (profile.deleted) {
        return { success: false, error: 'User telah dihapus' };
      }
      
      return { success: true, profile };
    } else {
      return { success: false, error: 'Profil user tidak ditemukan' };
    }
  } catch (error) {
    console.error('Error mengambil profil user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const updateData = { 
      ...updates,
      updatedAt: new Date()
    };

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updateData);

    console.log('Profil user berhasil diupdate');
    return { success: true };
  } catch (error) {
    console.error('Error update profil user:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, return empty array');
      return { success: true, data: [] };
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'user'),
      where('deleted', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const userList = [];
    querySnapshot.forEach((doc) => {
      userList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    userList.sort((a, b) => a.nama.localeCompare(b.nama));

    return { success: true, data: userList };
  } catch (error) {
    console.error('Error mengambil data user:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateUserRFID = async (userId, rfidCode) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      rfidCode: rfidCode,
      updatedAt: new Date()
    });

    console.log('RFID user berhasil diupdate');
    return { success: true };
  } catch (error) {
    console.error('Error update RFID user:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUserRFID = async (userId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      rfidCode: null,
      updatedAt: new Date()
    });

    console.log('RFID user berhasil dihapus');
    return { success: true };
  } catch (error) {
    console.error('Error menghapus RFID user:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Data user tidak ditemukan');
    }

    const userData = userDoc.data();
    
    if (userData.deleted) {
      throw new Error('User sudah dihapus sebelumnya');
    }

    await deleteDoc(userRef);

    console.log('Data user berhasil dihapus dari Firestore');

    return { 
      success: true, 
      message: 'Data user berhasil dihapus dari Firestore. Akun login tetap ada di sistem tapi tidak bisa digunakan.'
    };
  } catch (error) {
    console.error('Error menghapus user:', error);
    return { success: false, error: error.message };
  }
};

export const restoreUser = async (userId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Data user tidak ditemukan');
    }

    await updateDoc(userRef, {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      restoredAt: new Date(),
      restoredBy: 'admin',
      updatedAt: new Date()
    });

    console.log('Data user berhasil dipulihkan');
    return { success: true };
  } catch (error) {
    console.error('Error memulihkan user:', error);
    return { success: false, error: error.message };
  }
};

export const getDeletedUsers = async () => {
  try {
    if (!db) {
      return { success: true, data: [] };
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'user'),
      where('deleted', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const deletedUserList = [];
    querySnapshot.forEach((doc) => {
      deletedUserList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    deletedUserList.sort((a, b) => 
      new Date(b.deletedAt) - new Date(a.deletedAt)
    );

    return { success: true, data: deletedUserList };
  } catch (error) {
    console.error('Error mengambil data user terhapus:', error);
    return { success: false, error: error.message, data: [] };
  }
};