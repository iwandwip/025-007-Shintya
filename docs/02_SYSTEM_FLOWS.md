# SHINTYA APP - SYSTEM FLOWS & HARDWARE INTEGRATION

**Sistem Data Flow dan Hardware Integration** untuk Shintya App - Real-time package delivery tracking dengan ESP32 hardware integration, RFID-based package identification, dan intelligent multi-loker COD management system.

```
   +=============================================================================+
                      🔄 SHINTYA SYSTEM FLOWS                             |
                                                                           |
   |  📦 Package Flow  <->  🏷️ RFID System  <->  📏 Capacity  <->  💰 COD Control  |
                                                                           |
   |    Tracking System   |   Pairing Flow   |   Monitoring   |   Loker System  |
   |    Status Updates    |   Authentication |   Real-time    |   Remote Control|
   |    Timeline Mgmt     |   Card Access    |   Sensors      |   Payment Flow  |
   +=============================================================================+
```

---

# 📋 TABLE OF CONTENTS

- [2.1 Package Delivery Flow](#21-package-delivery-flow)
- [2.2 RFID Integration Flow](#22-rfid-integration-flow)
- [2.3 Real-time Capacity Monitoring Flow](#23-real-time-capacity-monitoring-flow)
- [2.4 COD Loker Control Flow](#24-cod-loker-control-flow)
- [2.5 User Authentication & Role Management Flow](#25-user-authentication-role-management-flow)
- [2.6 Hardware Communication Flow](#26-hardware-communication-flow)

---

## 2.1 Package Delivery Flow

### **End-to-End Package Management Pipeline**
```
  ----------------------------------------------------------------------------+
                    COMPLETE PACKAGE DELIVERY FLOW                         |
  ----------------------------------------------------------------------------+
                                                                          |
|  👤 USER INPUT      📱 MOBILE APP      ☁️  FIREBASE      📦 PHYSICAL DELIVERY  |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Admin/User  |--->| Add Package |--->| Firestore   |--->| Package     |  |
|  | Creates     |    | Form        |    | Storage     |    | Processing  |  |
|  | New Package |    | Validation  |    | receipts/   |    | Center      |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Auto-generate|<---| COD Logic   |<---| Smart Loker |<---| Package     |  |
|  | Tracking #   |    | Assignment  |    | Assignment  |    | Arrives     |  |
|  | SH240001234  |    | Rp 150,000  |    | Loker 1-5   |    | at Center   |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Status:      |--->| Real-time   |--->| Firebase    |--->| Customer    |  |
|  | Sedang       |    | Updates     |    | Sync        |    | Notification|  |
|  | Dikirim      |    | Push        |    | All Devices |    | & QR Code   |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  🔄 PACKAGE STATUS LIFECYCLE:                                              |
|  1. "Sedang Dikirim" → Package created, in transit                        |
|  2. "Telah Tiba" → Package arrived at delivery center                     |
|  3. "Sudah Diambil" → Package picked up by customer                       |
  ----------------------------------------------------------------------------+
```

### **Smart Package Assignment Logic**
```
  ----------------------------------------------------------------------------+
                     INTELLIGENT PACKAGE ASSIGNMENT                        |
  ----------------------------------------------------------------------------+
                                                                          |
|  📝 PACKAGE INPUT     💰 COD DETECTION     🏷️ LOKER ASSIGNMENT              |
                                                                          |
|    ------------+       ------------+       ------------+                   |
|  | User creates |---->| Check COD   |---->| COD = TRUE  |                   |
|  | new package  |     | flag        |     | Assign      |                   |
|  | with details |     | isCod       |     | Loker 1-5   |                   |
|    ------------+       ------------+     | Max 5 COD   |                   |
|           |                            | Active       |                   |
|           |                              ------------+                   |
|           v                                     |                        |
|    ------------+                               v                        |
|  | COD = FALSE  |                      ------------+                      |
|  | Regular      |                    | Check        |                      |
|  | Package      |                    | Available    |                      |
|  | No Loker     |                    | Lokers       |                      |
|    ------------+                      ------------+                      |
|                                              |                           |
|                                              v                           |
|                                       ------------+                      |
|                                     | Assign to    |                      |
|                                     | Lowest #     |                      |
|                                     | Available    |                      |
|                                       ------------+                      |
|                                                                          |
|  ✅ ASSIGNMENT RULES:                                                       |
|  • COD packages MUST have loker assignment (1-5)                          |
|  • Maximum 5 COD packages active system-wide                              |
|  • Regular packages do not use lokers                                     |
|  • Loker assignment is automatic and sequential                           |
|  • Failed assignment shows "Loker penuh" error                            |
  ----------------------------------------------------------------------------+
```

### **Package Status Management**
```javascript
// Package status flow dengan comprehensive validation
const packageStatusFlow = {
  "Sedang Dikirim": {
    next: "Telah Tiba",
    allowedActions: ["edit", "cancel"],
    userCanChange: false,  // Only admin can update
    description: "Package in transit to delivery center"
  },
  "Telah Tiba": {
    next: "Sudah Diambil", 
    allowedActions: ["pickup", "return", "edit"],
    userCanChange: true,   // Customer can mark as picked up
    description: "Package arrived, waiting for pickup"
  },
  "Sudah Diambil": {
    next: null,
    allowedActions: ["view_history"],
    userCanChange: false,  // Final status
    description: "Package successfully picked up"
  }
};

// Real-time status update workflow
const updatePackageStatus = async (packageId, newStatus, userId, userRole) => {
  // Validate status transition
  const currentPackage = await getPackage(packageId);
  const allowedNext = packageStatusFlow[currentPackage.status]?.next;
  
  if (newStatus !== allowedNext) {
    throw new Error(`Invalid status transition: ${currentPackage.status} → ${newStatus}`);
  }
  
  // Update Firestore
  await updateDoc(doc(db, 'receipts', packageId), {
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: userId
  });
  
  // Log activity
  await logActivity({
    userId,
    type: 'status_changed',
    message: `Status paket ${packageId} diubah ke ${newStatus}`,
    packageId,
    metadata: {
      previousStatus: currentPackage.status,
      newStatus,
      userRole
    }
  });
  
  // Release loker if package picked up
  if (newStatus === 'Sudah Diambil' && currentPackage.nomorLoker) {
    await releaseLoker(currentPackage.nomorLoker);
  }
};
```

## 2.2 RFID Integration Flow

### **Complete RFID Pairing System**
```
  ----------------------------------------------------------------------------+
                        RFID PAIRING & AUTHENTICATION                      |
  ----------------------------------------------------------------------------+
                                                                          |
|  📱 MOBILE APP      ☁️  FIREBASE       🔌 ESP32        🏷️ RFID CARD        |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | User starts |--->| Create      |--->| ESP32       |--->| Generate    |  |
|  | RFID pairing|    | pairing     |    | receives    |    | 8-char hex  |  |
|  | from profile|    | session     |    | command     |    | code        |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|         ⏱️ 30-second timeout starts                              v         |
|                                                         ------------+     |
|    ------------+      ------------+      ------------+  | Write code  |     |
|  | Display     |<---| Real-time   |<---| ESP32 waits |-| to RFID     |     |
|  | "Tempelkan  |    | session     |    | for card    |  | card        |     |
|  | kartu..."   |    | monitoring  |    | presence    |    ------------+     |
|    ------------+      ------------+      ------------+              |     |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Show success|--->| Update user |--->| Firebase    |--->| Card now    |  |
|  | message     |    | profile     |    | Realtime    |    | paired to   |  |
|  | "Berhasil!" |    | rfidCode    |    | DB update   |    | user        |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  ❌ FAILURE SCENARIOS:                                                      |
|  • Timeout (30s): "Waktu habis, coba lagi"                                |
|  • Hardware offline: "ESP32 tidak terhubung"                              |
|  • Card read error: "Gagal baca kartu"                                    |
|  • Code write error: "Gagal tulis kartu"                                  |
  ----------------------------------------------------------------------------+
```

### **RFID Authentication Flow**
```
  ----------------------------------------------------------------------------+
                        RFID PACKAGE ACCESS SYSTEM                        |
  ----------------------------------------------------------------------------+
                                                                          |
|  🏷️ RFID SCAN       🔌 ESP32          ☁️  FIREBASE       📦 PACKAGE ACCESS    |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Customer    |--->| ESP32 reads |--->| Query user  |--->| Find user's |  |
|  | taps RFID   |    | card hex    |    | by rfidCode |    | packages    |  |
|  | on reader   |    | code        |    | in Firestore|    | list        |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | LCD shows   |<---| Process     |<---| Validate    |<---| Check       |  |
|  | available   |    | access      |    | user auth   |    | package     |  |
|  | packages    |    | results     |    | permissions |    | status      |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Allow       |--->| Log access  |--->| Update      |--->| Mark as     |  |
|  | loker       |    | activity    |    | package     |    | "Sudah      |  |
|  | access      |    | timestamp   |    | status      |    | Diambil"    |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  🔒 ACCESS CONTROL LOGIC:                                                  |
|  • Only authenticated users with paired RFID can access                   |
|  • Only packages with status "Telah Tiba" can be picked up                |
|  • COD packages require additional loker control                          |
|  • All access attempts are logged dengan comprehensive audit trail        |
  ----------------------------------------------------------------------------+
```

### **RFID Session Management**
```javascript
// RFID pairing session dengan timeout management
const startRfidPairing = async (userId) => {
  const sessionId = generateSessionId();
  const rfidCode = generateHexCode(8); // 8-character hex
  
  // Create pairing session
  await setDoc(doc(db, 'rfid_pairing', sessionId), {
    isActive: true,
    userId,
    rfidCode,
    status: 'waiting',
    startTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30000) // 30 seconds
  });
  
  // Send command to ESP32
  await update(ref(realtimeDb, 'rfidPairing'), {
    sessionId,
    rfidCode,
    isActive: true,
    command: 'start_pairing'
  });
  
  // Start timeout monitoring
  setTimeout(async () => {
    const session = await getDoc(doc(db, 'rfid_pairing', sessionId));
    if (session.exists() && session.data().status === 'waiting') {
      await cancelPairingSession(sessionId, 'timeout');
    }
  }, 30000);
  
  return { sessionId, rfidCode };
};

// RFID access validation
const validateRfidAccess = async (rfidCode) => {
  // Find user by RFID code
  const userQuery = query(
    collection(db, 'users'),
    where('rfidCode', '==', rfidCode),
    where('deleted', '==', false)
  );
  
  const userSnapshot = await getDocs(userQuery);
  if (userSnapshot.empty) {
    return { success: false, error: 'RFID tidak terdaftar' };
  }
  
  const user = userSnapshot.docs[0];
  
  // Find user's available packages
  const packagesQuery = query(
    collection(db, 'receipts'),
    where('userId', '==', user.id),
    where('status', '==', 'Telah Tiba')
  );
  
  const packagesSnapshot = await getDocs(packagesQuery);
  const availablePackages = packagesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return {
    success: true,
    user: user.data(),
    packages: availablePackages
  };
};
```

## 2.3 Real-time Capacity Monitoring Flow

### **Ultrasonic Sensor Data Pipeline**
```
  ----------------------------------------------------------------------------+
                    REAL-TIME CAPACITY MONITORING SYSTEM                  |
  ----------------------------------------------------------------------------+
                                                                          |
|  📦 PACKAGE BOX     🔌 ESP32         ☁️  FIREBASE        📱 MOBILE APP     |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Physical    |--->| HC-SR04     |--->| Realtime    |--->| Dashboard   |  |
|  | packages    |    | Ultrasonic  |    | Database    |    | Real-time   |  |
|  | 0-30cm      |    | readings    |    | /monitoring |    | Charts      |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|         📏 Continuous 1-second readings                          v         |
|                                                         ------------+     |
|    ------------+      ------------+      ------------+  | Visual      |     |
|  | Status      |<---| Calculate   |<---| Process     |-| Indicators  |     |
|  | indicators: |    | percentage  |    | sensor data |  | & Alerts    |     |
|  | Kosong →    |    | height/30cm |    | smoothing   |    ------------+     |
|  | Hampir Penuh|    | * 100       |    | algorithm   |                     |
|    ------------+      ------------+      ------------+                     |
|                                                                          |
|  📊 CAPACITY STATUS MAPPING:                                              |
|  • 0-10%   (0-3cm):    "Kosong" 🔘                                        |
|  • 11-50%  (3-15cm):   "Terisi Sebagian" 🔵                              |
|  • 51-80%  (15-24cm):  "Hampir Penuh" 🟡                                 |
|  • 81-100% (24-30cm):  "Penuh" 🔴                                         |
  ----------------------------------------------------------------------------+
```

### **Smart Data Processing & Caching**
```
  ----------------------------------------------------------------------------+
                        OPTIMIZED DATA PROCESSING                          |
  ----------------------------------------------------------------------------+
                                                                          |
|  📊 RAW SENSOR       🧠 PROCESSING      💾 CACHING        📱 UI UPDATE      |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | ESP32 sends |--->| Data        |--->| Smart       |--->| Real-time   |  |
|  | height: 22cm|    | validation  |    | caching     |    | UI update   |  |
|  | every 1s    |    | & smoothing |    | TTL: 5s     |    | max 1s lag  |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Filter      |--->| Calculate   |--->| Update      |--->| Trigger     |  |
|  | invalid     |    | percentage  |    | Firestore   |    | alerts if   |  |
|  | readings    |    | & status    |    | capacity/   |    | threshold   |  |
|  | (0-30cm)    |    | mapping     |    | collection  |    | exceeded    |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  ⚡ PERFORMANCE OPTIMIZATIONS:                                             |
|  • Client-side caching dengan TTL untuk reduce Firebase reads             |
|  • Data smoothing algorithm untuk eliminate sensor noise                  |
|  • Threshold-based updates untuk prevent unnecessary writes               |
|  • Background sync dengan connectivity detection                          |
  ----------------------------------------------------------------------------+
```

### **Capacity Service Implementation**
```javascript
// Real-time capacity monitoring dengan smart caching
class CapacityService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
    this.maxHeight = 30; // cm
    this.listeners = new Set();
  }

  async getCurrentCapacity() {
    // Check cache first
    const cached = this.cache.get('capacity');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Fetch from Realtime DB
    const snapshot = await get(ref(realtimeDb, 'monitoring/capacity'));
    const rawData = snapshot.val();
    
    if (!rawData) {
      throw new Error('No capacity data available');
    }

    // Process and validate data
    const processedData = this.processCapacityData(rawData);
    
    // Update cache
    this.cache.set('capacity', {
      data: processedData,
      timestamp: Date.now()
    });

    return processedData;
  }

  processCapacityData(rawData) {
    const height = Math.max(0, Math.min(this.maxHeight, rawData.height || 0));
    const percentage = Math.round((height / this.maxHeight) * 100);
    
    let status;
    if (percentage <= 10) status = 'Kosong';
    else if (percentage <= 50) status = 'Terisi Sebagian';
    else if (percentage <= 80) status = 'Hampir Penuh';
    else status = 'Penuh';

    return {
      height,
      maxHeight: this.maxHeight,
      percentage,
      status,
      statusColor: this.getStatusColor(status),
      lastUpdated: new Date(rawData.lastUpdated || Date.now()),
      deviceId: rawData.deviceId || 'ESP32_001'
    };
  }

  getStatusColor(status) {
    const colorMap = {
      'Kosong': '#9CA3AF',         // Gray-400
      'Terisi Sebagian': '#3B82F6', // Blue-500
      'Hampir Penuh': '#F59E0B',    // Amber-500
      'Penuh': '#EF4444'            // Red-500
    };
    return colorMap[status] || '#9CA3AF';
  }

  // Real-time listener untuk UI updates
  startRealtimeMonitoring(callback) {
    const listener = onValue(ref(realtimeDb, 'monitoring/capacity'), 
      (snapshot) => {
        const data = this.processCapacityData(snapshot.val() || {});
        callback(data);
        
        // Update cache
        this.cache.set('capacity', {
          data,
          timestamp: Date.now()
        });
      }
    );
    
    this.listeners.add(listener);
    return listener;
  }

  stopRealtimeMonitoring(listener) {
    if (listener) {
      off(ref(realtimeDb, 'monitoring/capacity'), 'value', listener);
      this.listeners.delete(listener);
    }
  }
}
```

## 2.4 COD Loker Control Flow

### **Complete COD Management System**
```
  ----------------------------------------------------------------------------+
                        COD LOKER CONTROL SYSTEM                          |
  ----------------------------------------------------------------------------+
                                                                          |
|  💰 COD PACKAGE     🏷️ LOKER ASSIGN    📱 QR CONTROL     🔐 HARDWARE ACTION |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | User creates|--->| Check       |--->| Generate    |--->| Customer    |  |
|  | COD package |    | available   |    | QR code     |    | scans QR    |  |
|  | Rp 150,000  |    | lokers 1-5  |    | with loker  |    | code        |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|         💳 COD flag = true                                       v         |
|                                                         ------------+     |
|    ------------+      ------------+      ------------+  | QR Modal    |     |
|  | Auto-assign |<---| Maximum 5   |<---| Smart       |-| opens with  |     |
|  | loker (1-5) |    | COD packages|    | assignment  |  | Buka/Tutup  |     |
|  | sequential  |    | system-wide |    | algorithm   |    ------------+     |
|    ------------+      ------------+      ------------+              |     |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | ESP32       |<---| Firebase    |<---| User taps   |<---| Mobile app  |  |
|  | receives    |    | lokerControl|    | Buka/Tutup  |    | sends       |  |
|  | command     |    | collection  |    | button      |    | command     |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Hardware    |--->| Auto-reset  |--->| Update      |--->| Log         |  |
|  | opens/closes|    | after 10s   |    | loker       |    | activity    |  |
|  | loker       |    | timeout     |    | status      |    | audit trail |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  🔒 LOKER CONTROL RULES:                                                   |
|  • Only COD packages get loker assignment                                 |
|  • Maximum 5 active COD packages system-wide                              |
|  • Remote control via QR code modal (buka/tutup commands)                 |
|  • Automatic reset after 10 seconds untuk security                        |
|  • Complete audit trail untuk all loker operations                        |
  ----------------------------------------------------------------------------+
```

### **Loker Assignment Algorithm**
```javascript
// Smart loker assignment dengan validation
const assignLokerToCodPackage = async (packageData) => {
  if (!packageData.isCod) {
    return { ...packageData, nomorLoker: null };
  }

  // Count current active COD packages
  const activeCodQuery = query(
    collection(db, 'receipts'),
    where('isCod', '==', true),
    where('status', 'in', ['Sedang Dikirim', 'Telah Tiba']),
    where('nomorLoker', '!=', null)
  );
  
  const activeCodSnapshot = await getDocs(activeCodQuery);
  
  if (activeCodSnapshot.size >= 5) {
    throw new Error('Loker penuh! Maksimal 5 paket COD aktif.');
  }

  // Find occupied lokers
  const occupiedLokers = new Set();
  activeCodSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.nomorLoker) {
      occupiedLokers.add(data.nomorLoker);
    }
  });

  // Find first available loker (1-5)
  let assignedLoker = null;
  for (let i = 1; i <= 5; i++) {
    if (!occupiedLokers.has(i)) {
      assignedLoker = i;
      break;
    }
  }

  if (!assignedLoker) {
    throw new Error('Tidak ada loker tersedia.');
  }

  // Update loker control status
  await setDoc(doc(db, 'lokerControl', `loker_${assignedLoker}`), {
    buka: 0,
    tutup: 0,
    timestamp: new Date(),
    lastCommand: 'assigned',
    nomorLoker: assignedLoker,
    isActive: true,
    assignedPackage: packageData.id,
    autoResetTime: null
  });

  return { ...packageData, nomorLoker: assignedLoker };
};

// Remote loker control dengan safety features
const controlLoker = async (lokerNumber, action, userId) => {
  if (![1, 2, 3, 4, 5].includes(lokerNumber)) {
    throw new Error('Nomor loker tidak valid (1-5)');
  }

  if (!['buka', 'tutup'].includes(action)) {
    throw new Error('Aksi tidak valid (buka/tutup)');
  }

  const lokerRef = doc(db, 'lokerControl', `loker_${lokerNumber}`);
  const lokerSnapshot = await getDoc(lokerRef);
  
  if (!lokerSnapshot.exists()) {
    throw new Error('Loker tidak ditemukan');
  }

  const lokerData = lokerSnapshot.data();
  if (!lokerData.isActive) {
    throw new Error('Loker tidak aktif');
  }

  // Send command to hardware
  await updateDoc(lokerRef, {
    [action]: 1,
    timestamp: new Date(),
    lastCommand: action,
    autoResetTime: new Date(Date.now() + 10000) // 10 seconds
  });

  // Auto-reset after 10 seconds
  setTimeout(async () => {
    await updateDoc(lokerRef, {
      buka: 0,
      tutup: 0,
      lastCommand: 'reset'
    });
  }, 10000);

  // Log activity
  await logActivity({
    userId,
    type: 'loker_control',
    message: `${action.charAt(0).toUpperCase() + action.slice(1)} loker ${lokerNumber}`,
    metadata: {
      lokerNumber,
      action,
      timestamp: new Date()
    }
  });

  return { success: true, action, lokerNumber };
};
```

## 2.5 User Authentication & Role Management Flow

### **Multi-Role Authentication System**
```
  ----------------------------------------------------------------------------+
                        AUTHENTICATION & AUTHORIZATION                     |
  ----------------------------------------------------------------------------+
                                                                          |
|  👤 USER LOGIN      🔐 FIREBASE AUTH   🎭 ROLE CHECK     📱 APP ACCESS      |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Email/Pass  |--->| Firebase    |--->| Query user  |--->| Route to    |  |
|  | Input       |    | signIn      |    | collection  |    | appropriate |  |
|  | Validation  |    | Attempt     |    | check role  |    | dashboard   |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|         🔍 Special dev account: admin@gmail.com                  v         |
|                                                         ------------+     |
|    ------------+      ------------+      ------------+  | Admin       |     |
|  | Role: admin |<---| AuthContext |<---| User data   |-| gets full   |     |
|  | Full access |    | stores role |    | from        |  | access      |     |
|  | All features|    | & profile   |    | Firestore   |    ------------+     |
|    ------------+      ------------+      ------------+              |     |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Role: user  |--->| Limited     |--->| Customer    |--->| Package     |  |
|  | Customer    |    | access      |    | dashboard   |    | tracking    |  |
|  | features    |    | package     |    | interface   |    | only        |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  🔒 ACCESS CONTROL MATRIX:                                                 |
|  • Admin: Full CRUD, user management, system settings                     |
|  • User: Package tracking, profile management, RFID pairing               |
|  • Guest: Login/register screens only                                     |
|  • Special dev account bypasses normal validation                         |
  ----------------------------------------------------------------------------+
```

### **Session Management & Security**
```javascript
// AuthContext dengan role-based access control
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Special handling untuk dev account
        if (firebaseUser.email === 'admin@gmail.com') {
          setUser(firebaseUser);
          setUserProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            nama: 'Administrator',
            role: 'admin',
            noTelp: '+628123456789',
            rfidCode: 'DEV_ADMIN'
          });
        } else {
          // Query user profile dari Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            if (!profileData.deleted) {
              setUser(firebaseUser);
              setUserProfile(profileData);
            } else {
              // Account deleted
              await signOut(auth);
            }
          } else {
            // Profile not found
            await signOut(auth);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Log login activity
      await logActivity({
        userId: result.user.uid,
        type: 'login',
        message: `User login dari ${email}`,
        metadata: {
          loginTime: new Date(),
          userAgent: navigator.userAgent
        }
      });

      return result;
    } catch (error) {
      throw new Error(getIndonesianErrorMessage(error.code));
    }
  };

  const logout = async () => {
    if (user) {
      await logActivity({
        userId: user.uid,
        type: 'logout',
        message: 'User logout',
        metadata: { logoutTime: new Date() }
      });
    }
    await signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    logout,
    isAdmin: userProfile?.role === 'admin',
    isUser: userProfile?.role === 'user'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Route protection dengan role checking
const AuthGuard = ({ children, requireAdmin = false }) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (requireAdmin && userProfile?.role !== 'admin') {
        router.replace('/unauthorized');
      }
    }
  }, [user, userProfile, loading, requireAdmin]);

  if (loading) {
    return <LoadingSpinner message="Memuat..." />;
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Text>Akses ditolak</Text>;
  }

  return children;
};
```

## 2.6 Hardware Communication Flow

### **ESP32 ↔ Firebase ↔ Mobile App Communication**
```
  ----------------------------------------------------------------------------+
                        HARDWARE COMMUNICATION PIPELINE                   |
  ----------------------------------------------------------------------------+
                                                                          |
|  🔌 ESP32 DEVICE    ☁️  FIREBASE       📱 MOBILE APP     👤 USER ACTION     |
                                                                          |
|    ------------+      ------------+      ------------+      ------------+  |
|  | WiFi        |--->| Realtime    |--->| Real-time   |--->| User sees   |  |
|  | Connected   |    | Database    |    | Listeners   |    | instant     |  |
|  | ESP32       |    | Updates     |    | Subscribe   |    | feedback    |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                 |         |
|         📡 Continuous data stream                                v         |
|                                                         ------------+     |
|    ------------+      ------------+      ------------+  | Command     |     |
|  | RFID reader |<---| Mobile app  |<---| User        |-| Processing  |     |
|  | Ultrasonic  |    | sends       |    | triggers    |  | & Response  |     |
|  | LCD display |    | commands    |    | action      |    ------------+     |
|    ------------+      ------------+      ------------+              |     |
|                                                                 |         |
|                         v                  v                  v         |
|    ------------+      ------------+      ------------+      ------------+  |
|  | Hardware    |--->| Status      |--->| Real-time   |--->| UI updates  |  |
|  | executes    |    | updates     |    | sync across |    | immediately |  |
|  | command     |    | logged      |    | all devices |    | reflect     |  |
|    ------------+      ------------+      ------------+      ------------+  |
|                                                                          |
|  🔄 COMMUNICATION PROTOCOLS:                                               |
|  • ESP32 → Firebase: HTTP/HTTPS REST API calls                            |
|  • Firebase → Mobile: WebSocket real-time listeners                       |
|  • Mobile → Firebase: HTTP/HTTPS Firestore SDK                            |
|  • Bi-directional real-time sync dengan automatic reconnection            |
  ----------------------------------------------------------------------------+
```

### **Hardware State Management**
```javascript
// Real-time hardware monitoring service
class HardwareMonitoringService {
  constructor() {
    this.listeners = new Map();
    this.systemStatus = {
      isOnline: false,
      lastSeen: null,
      deviceId: 'ESP32_001',
      firmwareVersion: '1.0.0'
    };
  }

  // Monitor overall system health
  startSystemMonitoring() {
    const systemRef = ref(realtimeDb, 'monitoring/systemStatus/hardware');
    
    const listener = onValue(systemRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.systemStatus = {
          ...this.systemStatus,
          isOnline: true,
          lastSeen: new Date(),
          ...data
        };
        
        // Notify all listeners
        this.notifyListeners('system_status', this.systemStatus);
      }
    });

    this.listeners.set('system', listener);
  }

  // Monitor RFID reader status
  startRfidMonitoring() {
    const rfidRef = ref(realtimeDb, 'control/rfidReader');
    
    const listener = onValue(rfidRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.notifyListeners('rfid_status', data);
      }
    });

    this.listeners.set('rfid', listener);
  }

  // Monitor loker status
  startLokerMonitoring() {
    for (let i = 1; i <= 5; i++) {
      const lokerRef = ref(realtimeDb, `control/lokers/loker_${i}`);
      
      const listener = onValue(lokerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.notifyListeners(`loker_${i}_status`, data);
        }
      });

      this.listeners.set(`loker_${i}`, listener);
    }
  }

  // Send command to hardware
  async sendHardwareCommand(command, parameters = {}) {
    const commandRef = ref(realtimeDb, 'hardware/commands');
    const commandId = Date.now().toString();
    
    await set(child(commandRef, commandId), {
      command,
      parameters,
      timestamp: new Date().toISOString(),
      status: 'pending',
      id: commandId
    });

    // Wait for command execution (max 10 seconds)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 10000);

      const listener = onValue(child(commandRef, commandId), (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === 'completed') {
          clearTimeout(timeout);
          off(child(commandRef, commandId), 'value', listener);
          resolve(data.result);
        } else if (data && data.status === 'failed') {
          clearTimeout(timeout);
          off(child(commandRef, commandId), 'value', listener);
          reject(new Error(data.error || 'Command failed'));
        }
      });
    });
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach((listener, key) => {
      // Remove specific listeners based on key
      if (key === 'system') {
        off(ref(realtimeDb, 'monitoring/systemStatus/hardware'), 'value', listener);
      } else if (key === 'rfid') {
        off(ref(realtimeDb, 'control/rfidReader'), 'value', listener);
      } else if (key.startsWith('loker_')) {
        off(ref(realtimeDb, `control/lokers/${key}`), 'value', listener);
      }
    });
    this.listeners.clear();
  }

  notifyListeners(event, data) {
    // Implement event notification system
    console.log(`Hardware event: ${event}`, data);
  }
}

// Hardware command interface
const HardwareCommands = {
  RFID_START_PAIRING: 'rfid_start_pairing',
  RFID_STOP_PAIRING: 'rfid_stop_pairing',
  LOKER_OPEN: 'loker_open',
  LOKER_CLOSE: 'loker_close',
  CAPACITY_CALIBRATE: 'capacity_calibrate',
  SYSTEM_RESTART: 'system_restart',
  LCD_DISPLAY_MESSAGE: 'lcd_display_message'
};
```

---

**📋 Next Documents:**
- **[01_PROJECT_STRUCTURE.md](./01_PROJECT_STRUCTURE.md)** - Complete architecture dan database schema
- **[03_VERSION_HISTORY.md](./03_VERSION_HISTORY.md)** - Version history dan development changelog