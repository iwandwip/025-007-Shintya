# ESP32 Firebase Integration Documentation

## 📋 Overview

Dokumentasi lengkap untuk integrasi Firebase antara aplikasi React Native dan ESP32 firmware untuk sistem manajemen paket berbasis RFID dan monitoring IoT.

## 🏗️ Arsitektur Firebase

### **Konfigurasi Firebase**
```javascript
// services/firebase.js
const firebaseConfig = {
  projectId: "alien-outrider-453003-g8",
  databaseURL: "https://alien-outrider-453003-g8.firebaseio.com",
  apiKey: "AIzaSyBT3BlbkjEJ2n2nPgfU5r0fU0yqyFjEgvg",
  authDomain: "alien-outrider-453003-g8.firebaseapp.com",
  storageBucket: "alien-outrider-453003-g8.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### **Strategi Database Ganda**
```
📊 Firestore (Database Utama Aplikasi)
├── users/                    # Profil pengguna & autentikasi
├── active_timeline/          # Jadwal pengiriman
├── packages/{timelineId}/    # Record paket (nested)
├── rfid_pairing/            # Sesi pairing kartu RFID
├── capacity/                # Data sensor IoT
├── receipts/                # Tracking paket
└── globalActivities/        # Log aktivitas pengguna

🔄 Realtime Database (Komunikasi ESP32)
└── systemStatus/
    └── hardware/
        ├── isInUse: boolean
        ├── sessionType: "rfid" | "weighing"
        ├── rfid: string
        ├── userRfid: string
        ├── weight: number
        ├── height: number
        ├── measurementComplete: boolean
        └── lastActivity: timestamp
```

## 🔄 Alur Data (Data Flow)

### **1. Proses Pairing Kartu RFID**

```mermaid
sequenceDiagram
    participant App as React Native App
    participant FS as Firestore
    participant RDB as Realtime Database
    participant ESP as ESP32 Hardware
    participant RFID as RFID Reader
    
    Note over App,ESP: Fase 1: Inisiasi Pairing
    App->>FS: startPairing(userId)
    FS->>FS: Buat sesi pairing di rfid_pairing/current_session
    
    Note over ESP,RDB: Fase 2: ESP32 Polling
    ESP->>RDB: Poll systemStatus/hardware setiap 2 detik
    ESP->>ESP: Deteksi sesi pairing aktif
    
    Note over ESP,RFID: Fase 3: Generate RFID
    ESP->>ESP: Generate random RFID (8 karakter hex)
    ESP->>RDB: Update field rfid dengan kode baru
    
    Note over App,FS: Fase 4: Sinkronisasi Real-time
    RDB->>App: Real-time listener menangkap perubahan
    App->>App: Tampilkan kode RFID yang digenerate
    
    Note over App,FS: Fase 5: Konfirmasi Pairing
    App->>FS: updateUserRFID(userId, rfidCode)
    App->>FS: cancelPairing() // Akhiri sesi
```

**Implementasi Kode:**
```javascript
// services/pairingService.js
export const startPairing = async (userId) => {
  const pairingRef = doc(db, 'rfid_pairing', 'current_session');
  await setDoc(pairingRef, {
    isActive: true,
    userId: userId,
    startTime: new Date().toISOString(),
    rfidCode: null,
    status: 'waiting'
  });
};

// Real-time listener untuk menerima RFID
export const listenToPairingData = (callback) => {
  const pairingRef = doc(db, 'rfid_pairing', 'current_session');
  return onSnapshot(pairingRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};
```

### **2. Proses Akses Paket via RFID**

```mermaid
sequenceDiagram
    participant RFID as RFID Reader
    participant ESP as ESP32
    participant RDB as Realtime DB
    participant FS as Firestore
    participant App as React Native
    
    Note over RFID,ESP: Fase 1: Pembacaan Kartu
    RFID->>ESP: Kartu RFID di-tap
    ESP->>ESP: Baca kode RFID
    
    Note over ESP,RDB: Fase 2: Validasi Sesi
    ESP->>RDB: Cek apakah systemStatus/hardware aktif
    ESP->>ESP: Validasi tidak ada sesi lain berjalan
    
    Note over ESP,FS: Fase 3: Lookup Pengguna
    ESP->>FS: Query collection users dengan filter rfidCode
    FS->>ESP: Return data user (jika ditemukan)
    
    Note over ESP,FS: Fase 4: Proses Akses Paket
    ESP->>FS: Ambil data paket dari packages/{timelineId}
    ESP->>ESP: Validasi status paket
    ESP->>FS: Update status paket menjadi "diambil"
    
    Note over FS,App: Fase 5: Notifikasi Real-time
    FS->>App: Real-time listener package status
    App->>App: Update UI dengan status terbaru
    App->>App: Tampilkan notifikasi paket berhasil diambil
```

**Struktur Data Paket:**
```javascript
// Firestore: packages/{timelineId}/periods/{periodKey}/user_packages/{userId}
{
  userId: "user123",
  period: "period_1",
  packageId: "PKG001",
  status: "pending" | "delivered" | "picked_up" | "returned",
  deliveryDate: "2024-01-01T10:00:00Z",
  accessMethod: "rfid",
  weight: 2.5,
  dimensions: "20x15x10",
  metadata: {
    processedBy: "ESP32_RFID",
    deviceId: "ESP32_001",
    rfidCode: "A1B2C3D4"
  }
}
```

### **3. Monitoring Sensor IoT (Kapasitas Box)**

```mermaid
sequenceDiagram
    participant Sensor as Ultrasonic Sensor
    participant ESP as ESP32
    participant FS as Firestore
    participant App as React Native App
    
    Note over Sensor,ESP: Fase 1: Pembacaan Sensor
    Sensor->>ESP: Baca jarak ultrasonic
    ESP->>ESP: Konversi ke tinggi box
    
    Note over ESP,FS: Fase 2: Update Database
    ESP->>FS: Update capacity/box_sensor
    FS->>FS: Simpan data sensor dengan timestamp
    
    Note over FS,App: Fase 3: Real-time Monitoring
    FS->>App: Real-time listener kapasitas
    App->>App: Hitung persentase (height/maxHeight * 100)
    App->>App: Update UI dengan data terbaru
```

**Implementasi Monitoring:**
```javascript
// services/capacityService.js
export const subscribeToCapacityUpdates = (callback) => {
  const capacityRef = doc(db, 'capacity', 'box_sensor');
  return onSnapshot(capacityRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const percentage = (data.height / data.maxHeight) * 100;
      callback({
        ...data,
        percentage: Math.min(100, Math.max(0, percentage))
      });
    }
  });
};

// Struktur data sensor
{
  height: 25.5,           // cm
  maxHeight: 30,          // cm
  deviceId: "ESP32_001",
  lastUpdated: "2024-01-01T10:00:00Z",
  status: "active",
  battery: 85             // %
}
```

## 🔐 Sistem Autentikasi & Keamanan

### **Multi-Role Authentication**
```javascript
// services/authService.js
export const loginUser = async (email, password) => {
  // Bypass khusus untuk admin
  if (email === 'admin@gmail.com') {
    return {
      success: true,
      user: {
        uid: 'admin-bypass',
        email: 'admin@gmail.com',
        role: 'admin'
      }
    };
  }
  
  // Autentikasi Firebase normal
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### **Keamanan ESP32**
- ESP32 menggunakan Service Account untuk autentikasi
- Hardware beroperasi dengan privilese tinggi
- Tidak ada autentikasi level pengguna di ESP32
- Keamanan melalui isolasi jaringan

## 📊 Arsitektur Sistem Pembayaran

### **Timeline-Based Payment Architecture**
```javascript
// Struktur hierarki pembayaran
payments/
├── {timelineId}/
│   ├── metadata/
│   │   ├── name: "SPP Bulanan 2024"
│   │   ├── amount: 50000
│   │   ├── startDate: "2024-01-01"
│   │   └── endDate: "2024-12-31"
│   └── periods/
│       ├── period_1/
│       │   ├── month: "Januari"
│       │   ├── dueDate: "2024-01-31"
│       │   └── santri_payments/
│       │       ├── {santriId}/
│       │       │   ├── status: "belum_bayar"
│       │       │   ├── amount: 50000
│       │       │   └── paymentDate: null
│       │       └── ...
│       └── ...
```

### **Payment Status Manager**
```javascript
// services/paymentStatusManager.js
class PaymentStatusManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 2 * 60 * 1000; // 2 menit
    this.userThrottleMap = new Map();
    this.pageThrottleMap = new Map();
  }
  
  async getPaymentStatus(santriId, timelineId) {
    // Cek cache terlebih dahulu
    const cacheKey = `${santriId}_${timelineId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }
    
    // Fetch dari Firestore
    const paymentData = await this.fetchFromFirestore(santriId, timelineId);
    
    // Simpan ke cache
    this.cache.set(cacheKey, {
      data: paymentData,
      timestamp: Date.now()
    });
    
    return paymentData;
  }
  
  // Throttling untuk mencegah spam request
  canMakeRequest(key, type) {
    const throttleMap = type === 'user' ? this.userThrottleMap : this.pageThrottleMap;
    const throttleTime = type === 'user' ? 5 * 60 * 1000 : 2 * 60 * 1000;
    
    const lastRequest = throttleMap.get(key);
    if (lastRequest && (Date.now() - lastRequest) < throttleTime) {
      return false;
    }
    
    throttleMap.set(key, Date.now());
    return true;
  }
}
```

## 🎯 Komunikasi Hardware ESP32

### **ESP32 Firmware Implementation**
```cpp
// Konfigurasi Firebase di ESP32
#include <WiFi.h>
#include <FirebaseESP32.h>

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  // Inisiasi WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Konfigurasi Firebase
  config.database_url = "https://alien-outrider-453003-g8.firebaseio.com";
  config.api_key = "AIzaSyBT3BlbkjEJ2n2nPgfU5r0fU0yqyFjEgvg";
  
  // Inisiasi Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // Poll status hardware setiap 2 detik
  if (Firebase.RTDB.getJSON(&fbdo, "/systemStatus/hardware")) {
    FirebaseJson json = fbdo.jsonObject();
    
    // Proses RFID pairing
    if (json.get(result, "isInUse") && result.boolValue) {
      handleRFIDPairing();
    }
    
    // Update sensor data
    updateSensorData();
  }
  
  delay(2000);
}

void handleRFIDPairing() {
  // Generate random RFID
  String randomRfid = "";
  for (int i = 0; i < 8; i++) {
    randomRfid += String(random(0, 16), HEX);
  }
  
  // Update ke Realtime Database
  Firebase.RTDB.setString(&fbdo, "/systemStatus/hardware/rfid", randomRfid);
}

void updateSensorData() {
  // Baca sensor ultrasonic
  float distance = readUltrasonicSensor();
  float height = MAX_HEIGHT - distance;
  
  // Update ke Firestore
  FirebaseJson json;
  json.set("height", height);
  json.set("maxHeight", MAX_HEIGHT);
  json.set("deviceId", "ESP32_001");
  json.set("lastUpdated", getCurrentTimestamp());
  
  Firebase.Firestore.patchDocument(&fbdo, "capacity", "box_sensor", json.raw());
}
```

### **Protokol Komunikasi Hardware**
```javascript
// Format data yang diharapkan dari ESP32
const hardwareStatus = {
  sessionType: "rfid" | "weighing",
  isInUse: boolean,
  userRfid: "expected_rfid_code",
  measurementComplete: boolean,
  weight: 45.5,                    // kg
  height: 160,                     // cm
  nutritionStatus: "sehat" | "tidak sehat" | "obesitas",
  deviceId: "ESP32_001",
  lastActivity: "2024-01-01T10:00:00Z"
};
```

### **Simulator ESP32 untuk Testing**
```javascript
// testing/esp32-simulator.js
class ESP32Simulator {
  constructor() {
    this.isRunning = false;
    this.sessionType = null;
    this.pollingInterval = null;
  }
  
  startRFIDSession() {
    this.sessionType = "rfid";
    this.isRunning = true;
    
    // Simulate RFID generation
    setTimeout(() => {
      const randomRfid = this.generateRandomRFID();
      this.updateFirebaseStatus({
        rfid: randomRfid,
        isInUse: true,
        sessionType: "rfid",
        lastActivity: new Date().toISOString()
      });
    }, 2000);
  }
  
  generateRandomRFID() {
    return Array.from({length: 8}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('').toUpperCase();
  }
  
  updateFirebaseStatus(data) {
    // Update Realtime Database
    const updates = {};
    Object.keys(data).forEach(key => {
      updates[`/systemStatus/hardware/${key}`] = data[key];
    });
    
    firebase.database().ref().update(updates);
  }
}
```

## 🚀 Optimasi Performa

### **Strategi Caching & Throttling**
```javascript
// Multi-layer caching system
const CacheConfig = {
  PAYMENT_CACHE_TTL: 30 * 1000,      // 30 detik
  USER_THROTTLE_TIME: 5 * 60 * 1000, // 5 menit
  PAGE_THROTTLE_TIME: 2 * 60 * 1000, // 2 menit
  BACKGROUND_RESUME_THRESHOLD: 30 * 60 * 1000 // 30 menit
};

// Selective real-time subscriptions
const subscriptions = {
  pairingListener: null,      // Hanya saat pairing aktif
  capacityListener: null,     // Monitoring kontinyu
  paymentListener: null       // User-specific
};
```

### **Background Sync Pattern**
```javascript
// contexts/AuthContext.jsx
useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active' && appState === 'background') {
      const backgroundTime = Date.now() - lastBackgroundTime;
      if (backgroundTime > BACKGROUND_RESUME_THRESHOLD) {
        // Refresh payment data setelah 30 menit background
        refreshPaymentData();
      }
    }
    setAppState(nextAppState);
  };
  
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, [appState]);
```

## 🔍 Pola Sinkronisasi Data

### **Resolusi Konflik**
```javascript
// Last-write-wins untuk operasi umum
const updateWithTimestamp = async (docRef, data) => {
  const updateData = {
    ...data,
    lastModified: new Date().toISOString(),
    modifiedBy: auth.currentUser?.uid
  };
  
  await setDoc(docRef, updateData, { merge: true });
};

// Atomic transactions untuk pembayaran
const processPayment = async (santriId, timelineId, period) => {
  const batch = writeBatch(db);
  
  // Update payment status
  const paymentRef = doc(db, 'payments', timelineId, 'periods', period, 'santri_payments', santriId);
  batch.update(paymentRef, {
    status: 'lunas',
    paymentDate: new Date().toISOString(),
    paymentMethod: 'rfid'
  });
  
  // Log activity
  const activityRef = doc(db, 'globalActivities', `activity_${Date.now()}`);
  batch.set(activityRef, {
    userId: santriId,
    type: 'payment_completed',
    message: `Pembayaran ${period} berhasil melalui RFID`,
    createdAt: new Date().toISOString()
  });
  
  await batch.commit();
};
```

### **Error Recovery & Fallback**
```javascript
// Graceful degradation patterns
const safeFirestoreOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    console.warn('Firestore operation failed:', error);
    
    if (fallback) {
      return fallback;
    }
    
    return {
      success: false,
      error: 'Koneksi database bermasalah',
      offline: true
    };
  }
};

// Offline support
const offlineQueue = [];
const processOfflineQueue = async () => {
  while (offlineQueue.length > 0) {
    const operation = offlineQueue.shift();
    try {
      await operation();
    } catch (error) {
      // Re-queue jika masih gagal
      offlineQueue.push(operation);
      break;
    }
  }
};
```

## 🎛️ Manajemen Konfigurasi

### **Environment Configuration**
```javascript
// Konfigurasi untuk berbagai environment
const getFirebaseConfig = () => {
  if (__DEV__) {
    return {
      // Development config (hardcoded saat ini)
      projectId: "alien-outrider-453003-g8",
      // ... config lainnya
    };
  }
  
  // Production should use environment variables
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    apiKey: process.env.FIREBASE_API_KEY,
    // ... secure config
  };
};
```

### **Database Security Rules**
```javascript
// Firestore Security Rules (recommended)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin can access all payment data
    match /payments/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Hardware can update capacity data
    match /capacity/{document} {
      allow write: if request.auth != null && 
        request.auth.token.role == 'hardware';
    }
  }
}
```

## 📈 Monitoring & Analytics

### **Activity Tracking System**
```javascript
// services/activityService.js
export const logActivity = async (userId, type, message) => {
  const activityRef = doc(db, 'globalActivities', `activity_${Date.now()}_${userId}`);
  await setDoc(activityRef, {
    userId,
    type,
    message,
    createdAt: new Date().toISOString(),
    deviceInfo: {
      platform: Platform.OS,
      version: Platform.Version
    }
  });
};

// Tipe aktivitas yang dilacak
const ActivityTypes = {
  PAYMENT_COMPLETED: 'payment_completed',
  RFID_PAIRED: 'rfid_paired',
  PACKAGE_ADDED: 'package_added',
  STATUS_CHANGED: 'status_changed',
  LOGIN: 'login',
  LOGOUT: 'logout'
};
```

### **Real-time Monitoring Dashboard**
```javascript
// Monitoring untuk admin
export const subscribeToSystemHealth = (callback) => {
  const queries = [
    // Hardware status
    onSnapshot(doc(db, 'systemStatus', 'hardware'), (doc) => {
      callback('hardware', doc.data());
    }),
    
    // Recent activities
    onSnapshot(
      query(
        collection(db, 'globalActivities'),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback('activities', activities);
      }
    ),
    
    // Capacity monitoring
    onSnapshot(doc(db, 'capacity', 'box_sensor'), (doc) => {
      callback('capacity', doc.data());
    })
  ];
  
  return () => queries.forEach(unsubscribe => unsubscribe());
};
```

## 🚨 Troubleshooting & Debugging

### **Common Issues & Solutions**

#### **1. ESP32 Tidak Terhubung ke Firebase**
```bash
# Cek koneksi WiFi
ping google.com

# Cek Firebase connectivity
curl -X GET "https://alien-outrider-453003-g8.firebaseio.com/.json"

# Debug ESP32 Serial Output
screen /dev/ttyUSB0 115200
```

#### **2. Real-time Listener Tidak Bekerja**
```javascript
// Debug listener connection
const debugListener = (error) => {
  if (error) {
    console.error('Listener error:', error);
    // Implement reconnection logic
    setTimeout(() => {
      setupListener();
    }, 5000);
  }
};

const setupListener = () => {
  return onSnapshot(
    doc(db, 'rfid_pairing', 'current_session'),
    (doc) => {
      console.log('Listener triggered:', doc.data());
    },
    debugListener
  );
};
```

#### **3. Payment Status Tidak Terupdate**
```javascript
// Clear cache dan force refresh
const forceRefreshPaymentStatus = async (santriId, timelineId) => {
  // Clear cache
  paymentStatusManager.clearCache(`${santriId}_${timelineId}`);
  
  // Force fetch from Firestore
  const freshData = await paymentStatusManager.getPaymentStatus(
    santriId, 
    timelineId, 
    { bypassCache: true }
  );
  
  return freshData;
};
```

### **Logging & Monitoring**
```javascript
// Comprehensive logging system
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data);
    // Send to analytics service
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send error report
  },
  
  firebase: (operation, data) => {
    console.log(`[FIREBASE] ${operation}`, data);
    // Track Firebase operations
  }
};
```

## 🎯 Best Practices

### **1. Firebase Operations**
- Selalu gunakan try-catch untuk operasi Firebase
- Implement timeout untuk operasi yang lama
- Gunakan batch operations untuk multiple writes
- Optimize query dengan proper indexing

### **2. Real-time Subscriptions**
- Unsubscribe listener saat komponen unmount
- Implement reconnection logic untuk koneksi yang putus
- Gunakan selective subscriptions (hanya data yang diperlukan)

### **3. Caching Strategy**
- Implement TTL (Time To Live) untuk cache
- Clear cache saat data berubah
- Gunakan compression untuk data besar

### **4. Error Handling**
- Graceful degradation untuk offline mode
- User-friendly error messages
- Automatic retry dengan exponential backoff

### **5. Security**
- Jangan expose Firebase config di production
- Gunakan Firebase Security Rules
- Implement rate limiting untuk API calls
- Validate data di server-side

## 📚 Referensi & Resources

### **Firebase Documentation**
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

### **ESP32 Integration**
- [FirebaseESP32 Library](https://github.com/mobizt/Firebase-ESP32)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)

### **React Native Firebase**
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)

---

**Catatan:** Dokumentasi ini akan terus diperbarui seiring dengan pengembangan sistem. Pastikan untuk selalu merujuk ke versi terbaru untuk informasi yang akurat.