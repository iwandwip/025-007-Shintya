import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU",
  authDomain: "alien-outrider-453003-g8.firebaseapp.com",
  projectId: "alien-outrider-453003-g8",
  storageBucket: "alien-outrider-453003-g8.firebasestorage.app",
  messagingSenderId: "398044917472",
  appId: "1:398044917472:web:4ec00f19fafe5523442a85",
  measurementId: "G-J6BPHF1V0Z"
};

let app;
let auth;
let db;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      console.warn('Auth initialization error:', error);
      auth = getAuth(app);
    }
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.error('Firestore initialization error:', error);
    db = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null;
  auth = null;
  db = null;
}

export { auth, db, app };