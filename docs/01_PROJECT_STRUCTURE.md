# SHINTYA APP - PROJECT STRUCTURE & DATABASE SCHEMA

**Shintya App** - React Native mobile application untuk comprehensive package delivery tracking system dengan ESP32 hardware integration. Sistem menggunakan real-time ultrasonic capacity monitoring dan secure multi-loker package access management dengan COD support.

```
   +=============================================================================+
                        📦 SHINTYA DELIVERY SYSTEM                          |
                                                                           |
   |  📱 React Native App  <->  ☁️  Firebase  <->  🔌 ESP32  <->  📦 Package Box    |
                                                                           |
   |     Package Tracking   |    Real-time DB    |   Sensors  |   5 Lokers    |
   |     COD Management     |    Firestore       |   LCD      |   Delivery     |
   |     Loker Control      |    Authentication  |   Control  |   Management   |
   +=============================================================================+
```

---

# 📋 TABLE OF CONTENTS

- [1.1 Application Architecture](#11-application-architecture)
- [1.2 Technology Stack](#12-technology-stack)
- [1.3 Navigation Structure](#13-navigation-structure)
- [1.4 Service Layer Organization](#14-service-layer-organization)
- [1.5 Database Schema](#15-database-schema)
- [1.6 Complete Project File Structure](#16-complete-project-file-structure)
- [1.7 UI Interface Design & Mockups](#17-ui-interface-design-mockups)

---

## 1.1 Application Architecture

### **Multi-Role System Architecture**
Shintya App menggunakan multi-role architecture dengan dua level akses: **Admin** (complete management access) dan **User** (customer access). Sistem menggunakan role-based routing dan authentication untuk secure access control.

```
  ----------------------------------------------------------------------------+
                        SHINTYA APP ARCHITECTURE                           |
  ----------------------------------------------------------------------------+
                                                                          |
|    ----------------+      ----------------+      ----------------+        |
|  |  📱 MOBILE APP   |    |  ☁️  FIREBASE    |    |  🔌 ESP32 HW     |        |
|                    |    |                 |    |                 |        |
|  | • React Native  |<-->| • Realtime DB   |<-->| • Ultrasonic    |        |
|  | • Expo SDK 53   |    | • Firestore     |    | • LCD Display   |        |
|  | • Multi-Role    |    | • Authentication|    | • WiFi Module   |        |
|  | • COD System    |    | • Cloud Storage |    | • Button Ctrl   |        |
|  | • Loker Control |    | • Admin SDK     |    | • Servo Control |        |
|    ----------------+      ----------------+      ----------------+        |
|                                                                          |
|    --------------------------------------------------------------------+   |
|                   CORE FEATURES                                          |
|  |  📦 Package Tracking System  📊 Real-time Capacity Monitor          |  |
|  |  🔒 Multi-Loker Control      💰 COD Payment Management              |  |
|  |  ⚡ Smart Caching System     🛠️  Developer Testing Tools          |  |
|  |  📱 Professional UI/UX       🎛️  Hardware Integration             |  |
|    --------------------------------------------------------------------+   |
  ----------------------------------------------------------------------------+
```

### **Key Architectural Principles**
- **Real-time Communication**: Firebase Realtime DB untuk instant hardware sync
- **Smart Caching**: TTL-based caching dengan automatic invalidation
- **Service Layer Separation**: Business logic terpisah dari UI components
- **Context-based State Management**: Global state via React Context
- **Role-based Security**: Admin dan User roles dengan protected routes
- **Hardware Integration**: Seamless ESP32 communication via Firebase

## 1.2 Technology Stack

### **Frontend (React Native + Expo)**
```
  ----------------------------------------------------------------------------+
                         TECHNOLOGY STACK                                 |
  ----------------------------------------------------------------------------+
                                                                          |
|  📱 FRONTEND                    ☁️  BACKEND                  🔌 HARDWARE     |
|    ----------------+             ----------------+           ------------+  |
|  | React Native 0.79.3       | Firebase 10.14.0     | ESP32       |  |
|  | Expo SDK 53             | • Realtime DB         | • Dual Core |  |
|  | React 19.0.0            | • Firestore           | • RTOS      |  |
|  | Expo Router 5.1.0       | • Authentication      | • WiFi      |  |
|  | AsyncStorage            | • Cloud Storage       | • UART      |  |
|  |                         |                       |             |  |
|  | UI Framework:           | Development:          | Sensors:    |  |
|  | • React Native SVG      | • Firebase Admin      | • RFID RC522|  |
|  | • Lucide Icons          | • EAS Build System    | • HC-SR04   |  |
|  | • Custom Components     | • Testing Framework   | • LCD 16x2  |  |
|  | • Indonesian Locale     | • Cleanup Tools       | • Buttons   |  |
|    ----------------+             ----------------+           ------------+  |
  ----------------------------------------------------------------------------+
```

### **Core Dependencies**
```json
{
  "react-native": "0.79.3",
  "expo": "~53.0.11",
  "firebase": "^10.14.0",
  "@react-navigation/native": "^6.0.0",
  "expo-router": "5.1.0",
  "react-native-svg": "15.11.2",
  "@async-storage/async-storage": "1.23.1",
  "lucide-react-native": "^0.294.0"
}
```

### **Development & Testing Tools**
```
  ----------------------------------------------------------------------------+
                      DEVELOPMENT ECOSYSTEM                               |
  ----------------------------------------------------------------------------+
|  🧪 TESTING TOOLS               🛠️  UTILITIES                  📊 BUILD TOOLS  |
|    ----------------+             ----------------+           ------------+  |
|  | ESP32 Simulator         | Firebase Cleanup      | EAS Build      |  |
|  | • Interactive CLI       | • Database Reset      | • Development  |  |
|  | • Hardware Sim          | • User Management     | • Preview      |  |
|  | • Sensor Testing        | • Activity Cleanup    | • Production   |  |
|  | • Loker Simulation      | • Test Data Seeder    |                |  |
|  |                         |                       |                |  |
|  | Package Management      | Performance Tools     | Debug Tools    |  |
|  | • CRUD Operations       | • Smart Caching       | • Error Bounds |  |
|  | • COD Testing           | • TTL Management      | • Activity Log |  |
|  | • Loker Simulation      | • Background Sync     | • Toast System |  |
|    ----------------+             ----------------+           ------------+  |
  ----------------------------------------------------------------------------+
```

## 1.3 Navigation Structure

### **File-based Navigation (Expo Router)**
```
  ----------------------------------------------------------------------------+
                          NAVIGATION ARCHITECTURE                          |
  ----------------------------------------------------------------------------+
                                                                          |
|  🧭 EXPO ROUTER STRUCTURE                                                 |
                                                                          |
|    app/                                                                   |
|      ├── _layout.jsx              ← Root layout dengan context providers  |
|      ├── index.jsx                ← Root redirect logic                  |
|      ├── (auth)/                  ← Authentication group (public)        |
|      │   ├── _layout.jsx          ← Auth layout wrapper                  |
|      │   ├── login.jsx            ← Login screen with authentication     |
|      │   ├── register.jsx         ← Registration screen                  |
|      │   └── forgot-password.jsx  ← Password recovery                    |
|      └── (tabs)/                  ← Main app tabs group (authenticated)   |
|          ├── _layout.jsx          ← Tab navigation setup                 |
|          ├── index.jsx            ← Dashboard dengan stats & recent      |
|          ├── list-resi.jsx        ← Package management CRUD              |
|          ├── kapasitas-paket.jsx  ← Real-time capacity monitoring        |
|          ├── profile.jsx          ← User profile management              |
|          └── edit-profile.jsx     ← Profile editing (hidden tab)         |
|                                                                          |
|  🔒 ROUTE PROTECTION                                                      |
|    AuthGuard.jsx → Protects authenticated routes dengan role checking     |
|    Multi-role system: Admin access + User access dengan proper isolation |
|    Special dev account: admin@gmail.com (accepts any password)           |
  ----------------------------------------------------------------------------+
```

### **Tab Navigation System (4 Main Tabs)**
```
  ----------------------------------------------------------------------------+
                           4-TAB NAVIGATION SYSTEM                         |
  ----------------------------------------------------------------------------+
                                                                          |
|  📊 TAB 1: DASHBOARD        📦 TAB 2: PACKAGE LIST                        |
|    ----------------+         ----------------+                            |
|  | • Package statistics   | • Complete package CRUD    |                   |
|  | • Recent deliveries    | • COD management system    |                   |
|  | • Capacity indicators  | • Status tracking          |                   |
|  | • Quick actions menu   | • Search & filter          |                   |
|  | • Real-time updates    | • QR code generation       |                   |
|    ----------------+         ----------------+                            |
                                                                          |
|  📏 TAB 3: CAPACITY         👤 TAB 4: PROFILE                             |
|    ----------------+         ----------------+                            |
|  | • Real-time monitoring | • User profile info        |                   |
|  | • Visual indicators    | • Settings & preferences   |                   |
|  | • Capacity percentage  | • Activity history         |                   |
|  | • Box status display   | • Account settings         |                   |
|  | • Sensor data charts   | • Theme management         |                   |
|    ----------------+         ----------------+                            |
  ----------------------------------------------------------------------------+
```

## 1.4 Service Layer Organization

### **Core Business Services (12 Specialized Services)**
```
  ----------------------------------------------------------------------------+
                        SERVICE LAYER ARCHITECTURE                        |
  ----------------------------------------------------------------------------+
                                                                          |
|  💼 CORE SERVICES                                                         |
|    ----------------+                                                      |
|  | authService.js           ← Authentication operations                   |
|  | • login, register, logout dengan role checking                        |
|  | • password reset dengan email verification                            |
|  | • session management dengan automatic re-auth                         |
|  |                                                                       |
|  | userService.js           ← User profile management                     |
|  | • profile CRUD operations dengan validation                           |
|  | • user account management dan settings                                |
|  | • activity tracking dengan comprehensive logging                      |
|  |                                                                       |
|  | firebase.js              ← Firebase configuration                     |
|  | • database initialization dengan admin SDK                            |
|  | • realtime DB setup untuk hardware communication                      |
|  | • authentication config dengan role-based access                      |
|    ----------------+                                                      |
                                                                          |
|  📦 PACKAGE MANAGEMENT SERVICES                                           |
|    ----------------+                                                      |
|  | resiService.js           ← Package CRUD operations                     |
|  | • Complete receipt management dengan unique tracking numbers           |
|  | • COD support dengan automatic loker assignment (1-5)                 |
|  | • Status lifecycle management (Sedang Dikirim → Telah Tiba →          |
|  |   Sudah Diambil) dengan real-time updates                            |
|  | • Smart loker management dengan maximum 5 active COD packages         |
|  |                                                                       |
|  | userPackageService.js    ← User-specific package operations            |
|  | • User package history dengan timeline-based tracking                 |
|  | • Package filtering dan search functionality                          |
|  | • Personal activity tracking dengan audit trail                       |
|  |                                                                       |
|  | packageStatusManager.js  ← Smart caching system                       |
|  | • TTL-based caching dengan automatic invalidation                     |
|  | • Request throttling untuk prevent spam                               |
|  | • Background sync optimization dengan connectivity detection           |
|  | • Memory management dengan proper cleanup                             |
|    ----------------+                                                      |
                                                                          |
|  🔌 HARDWARE INTEGRATION SERVICES                                         |
|    ----------------+                                                      |
|  | capacityService.js       ← Ultrasonic sensor data processing           |
|  | • Real-time monitoring dengan 0-30cm range detection                  |
|  | • Visual status indicators (Kosong → Terisi Sebagian →                |
|  |   Hampir Penuh → Penuh) dengan percentage calculation                 |
|  | • Historical data tracking dengan trend analysis                      |
|  |                                                                       |
|  | lokerControlService.js   ← Remote loker control system                |
|  | • Remote buka/tutup functionality dengan Firebase commands            |
|  | • Automatic reset after 10 seconds untuk security                     |
|  | • Command queuing dan status tracking                                 |
|  | • Safety mechanisms dengan timeout protection                         |
|    ----------------+                                                      |
                                                                          |
|  🛠️ SUPPORTING SERVICES                                                   |
|    ----------------+                                                      |
|  | activityService.js       ← User activity logging                      |
|  | • Comprehensive audit trail dengan timestamps                         |
|  | • Activity categorization (login, package_action, loker_control)      |
|  | • Real-time activity feed dengan pagination                           |
|  |                                                                       |
|  | timelineService.js       ← Delivery timeline management               |
|  | • Timeline-based package tracking                                     |
|  | • Period management untuk delivery scheduling                         |
|  | • Historical timeline analysis                                        |
|  |                                                                       |
|  | seederService.js         ← Test data generation                       |
|  | • Comprehensive test data dengan realistic package information        |
|  | • User generation dengan various roles                                |
|  | • Activity seeding dengan historical timestamps                       |
|    ----------------+                                                      |
  ----------------------------------------------------------------------------+
```

### **Utility Services & Helpers**
```javascript
// utils/dateUtils.js - Indonesian date formatting
const dateUtils = {
  formatIndonesian: (date) => date.toLocaleDateString('id-ID'),
  formatTime: (date) => date.toLocaleTimeString('id-ID'),
  parseTimestamp: (timestamp) => new Date(timestamp),
  getRelativeTime: (date) => 'X menit yang lalu' // Indonesian relative time
};

// utils/validation.js - Input validation helpers
const validation = {
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePhone: (phone) => /^08[0-9]{8,11}$/.test(phone),
  validateResi: (resi) => /^[A-Z0-9]{8,12}$/.test(resi),
  validateWeight: (weight) => weight > 0 && weight <= 50 // kg
};

// utils/packageStatusUtils.js - Package status utilities
const packageStatusUtils = {
  getStatusColor: (status) => status === 'Sudah Diambil' ? 'green' : 'orange',
  getNextStatus: (currentStatus) => statusFlow[currentStatus],
  isStatusChangeable: (status, userRole) => userRole === 'admin' || status !== 'Sudah Diambil'
};
```

## 1.5 Database Schema

### **Firebase Firestore Collections**

#### **Collection: `users`**
```javascript
{
  id: string,              // User UID from Firebase Auth
  email: string,           // User email address
  nama: string,            // Full name (Indonesian)
  noTelp: string,          // Phone number (Indonesian format: 08xxxxxxxxx)
  role: 'user' | 'admin',  // User role untuk access control
  priority: 'normal' | 'high', // User priority level
  deleted: boolean,        // Soft delete flag
  createdAt: timestamp,    // Account creation time
  updatedAt: timestamp     // Last profile update time
}
```

#### **Collection: `receipts` (Package Records)**
```javascript
{
  id: string,              // Auto-generated document ID
  noResi: string,          // Unique tracking number (format: SH240001234)
  nama: string,            // Recipient name
  alamat: string,          // Delivery address
  noHp: string,            // Recipient phone number
  jenisBarang: string,     // Package type (Dokumen, Pakaian, Elektronik, etc.)
  beratBarang: number,     // Package weight in kg
  biayaKirim: number,      // Shipping cost in IDR
  isCod: boolean,          // Cash on delivery flag
  nominalCod: number,      // COD amount in IDR (0 if not COD)
  tipePaket: string,       // Package classification
  nomorLoker: number,      // Assigned loker number (1-5 for COD, null for regular)
  status: string,          // Package status:
                          // "Sedang Dikirim" → "Telah Tiba" → "Sudah Diambil"
  userId: string,          // Owner user ID reference
  createdAt: timestamp,    // Package creation time
  updatedAt: timestamp     // Last status update time
}
```

#### **Collection: `capacity`**
```javascript
{
  height: number,          // Current box height in cm (0-30 range)
  maxHeight: number,       // Maximum capacity in cm (default: 30)
  percentage: number,      // Capacity percentage (calculated: height/maxHeight * 100)
  status: string,          // Status: "Kosong", "Terisi Sebagian", "Hampir Penuh", "Penuh"
  lastUpdated: timestamp,  // Last sensor reading timestamp
  deviceId: string         // ESP32 device identifier
}
```


#### **Collection: `packages` (Timeline-based Structure)**
```javascript
// Structure: packages/{timelineId}/periods/{periodKey}/user_packages/{userId}
{
  userId: string,          // User reference
  packageId: string,       // Package reference to receipts collection
  deliveryDate: string,    // Scheduled delivery date
  status: string,          // Status: 'pending', 'delivered', 'picked_up', 'returned'
  pickupDate: string,      // Actual pickup date
  accessMethod: string,    // Access method: 'qr_code', 'manual', 'remote'
  weight: number,          // Package weight
  dimensions: string,      // Package dimensions
  priority: string,        // Delivery priority
  notes: string           // Additional notes
}
```

#### **Collection: `globalActivities`**
```javascript
{
  id: string,              // Auto-generated activity ID
  userId: string,          // User who performed the activity
  type: string,            // Activity type: "package_created", "status_changed", 
                          // "loker_accessed", "login", "profile_updated", etc.
  message: string,         // Human-readable description in Indonesian
  packageId: string,       // Related package ID (optional)
  metadata: {              // Additional activity data
    previousStatus: string,  // For status changes
    newStatus: string,      // For status changes
    lokerNumber: number,    // For loker operations
    deviceInfo: string      // Device information
  },
  createdAt: timestamp     // Activity timestamp
}
```

#### **Collection: `lokerControl` (Hardware Control)**
```javascript
// Structure: lokerControl/{loker_1 to loker_5}
{
  buka: number,            // Open command: 1 = open, 0 = no command
  tutup: number,           // Close command: 1 = close, 0 = no command
  timestamp: timestamp,    // Last command timestamp
  lastCommand: string,     // Last command type: "buka", "tutup", "reset", "none"
  nomorLoker: number,      // Loker number (1-5)
  isActive: boolean,       // Whether loker is currently active/assigned
  assignedPackage: string, // Package ID currently assigned to this loker
  autoResetTime: timestamp // Time when auto-reset will occur (10 seconds)
}
```

### **Firebase Realtime Database Structure**
```
monitoring/
└── systemStatus/
    └── hardware/
        ├── isInUse: boolean           // Hardware busy status
        ├── sessionType: string        // "monitoring" | "weighing" | "idle"
        ├── weight: number            // Current weight reading
        ├── height: number            // Current height reading (0-30cm)
        ├── measurementComplete: boolean // Measurement completion flag
        ├── lastActivity: timestamp    // Last hardware activity
        ├── deviceStatus: string      // "online" | "offline" | "error"
        └── errorMessage: string      // Error details if status is "error"

control/
├── capacity/
│   ├── currentHeight: number         // Real-time height data
│   ├── maxHeight: number             // Maximum capacity (30cm)
│   ├── percentage: number            // Calculated percentage
│   └── lastReading: timestamp        // Last sensor reading
└── lokers/
    ├── loker_1/
    │   ├── isOpen: boolean           // Physical loker open status
    │   ├── hasPackage: boolean       // Package present status
    │   └── lastAccessed: timestamp   // Last access time
    ├── loker_2/ ... loker_5/         // Similar structure for all 5 lokers
```

## 1.6 Complete Project File Structure

```
025-007-Shintya/

📱 MOBILE APPLICATION (React Native + Expo)
├── app/                                    # 🧭 Expo Router Navigation
│   ├── index.jsx                          # Root entry point dengan auth routing logic
│   ├── _layout.jsx                        # Main app layout dengan context providers
│   ├── (auth)/                            # Authentication screens (public access)
│   │   ├── _layout.jsx                    # Auth layout wrapper dengan background
│   │   ├── login.jsx                      # Login screen with authentication
│   │   ├── register.jsx                   # Registration screen dengan form validation
│   │   └── forgot-password.jsx            # Password recovery dengan email reset
│   └── (tabs)/                            # Main app screens (authenticated users only)
│       ├── _layout.jsx                    # Tab navigation setup dengan 4 visible tabs
│       ├── index.jsx                      # Home/Dashboard dengan capacity dan recent packages
│       ├── list-resi.jsx                  # Complete package list management dengan CRUD
│       ├── kapasitas-paket.jsx            # Real-time capacity monitoring dengan visual indicators
│       ├── edit-profile.jsx               # User profile editing (hidden tab, accessed via profile)
│       └── profile.jsx                    # User profile display and management

├── components/                             # 🧩 Reusable UI Components (25+ Components)
│   ├── AuthGuard.jsx                      # Route protection dengan redirect logic
│   ├── ErrorBoundary.jsx                  # Global error handling dengan fallback UI
│   ├── auth/
│   │   └── AuthForm.jsx                   # Reusable authentication form dengan validation
│   ├── illustrations/                     # Custom SVG illustration components
│   │   ├── index.js                       # Export index untuk all illustrations
│   │   ├── LoginIllustration.jsx          # Custom vector graphic untuk login screen
│   │   ├── RegisterIllustration.jsx       # Custom vector graphic untuk registration screen
│   │   └── ForgotPasswordIllustration.jsx # Custom vector graphic untuk password recovery
│   └── ui/                                # Core UI components dengan feature-rich functionality
│       ├── Button.jsx                     # Themed button dengan loading states dan multiple variants
│       ├── Input.jsx                      # Custom text input dengan validation states dan theming
│       ├── LoadingSpinner.jsx             # Loading states dengan customizable text dan theming
│       ├── DataTable.jsx                  # Responsive tabular data display dengan sorting dan filtering
│       ├── DatePicker.jsx                 # Native date selection dengan Indonesian locale
│       ├── TimelinePicker.jsx             # Timeline selection untuk package delivery scheduling
│       ├── ToastNotification.jsx          # Non-intrusive alert messages dengan auto-dismiss
│       ├── CreditBalance.jsx              # User priority/credit display dengan visual indicators
│       ├── IllustrationContainer.jsx      # SVG illustration wrapper dengan responsive sizing
│       ├── AddResiModal.jsx               # Add new package dengan COD support dan validation
│       ├── EditResiModal.jsx              # Edit existing package details dengan real-time updates
│       ├── PaymentModal.jsx               # Package payment interface (structure exists, payment gateway not implemented)
│       ├── QRCodeModal.jsx                # QR code display dengan integrated loker control untuk COD packages
│       └── HelpModal.jsx                  # User assistance dengan documentation dan troubleshooting

├── contexts/                               # 🌐 Global State Management (Optimized Performance)
│   ├── AuthContext.jsx                    # User authentication, profile data, session persistence
│   ├── SettingsContext.jsx                # App settings, configuration, dan user preferences
│   ├── NotificationContext.jsx            # Toast notifications, alerts, dan user feedback system
│   └── ThemeContext.jsx                   # Theme management (light/dark mode support)

├── services/                               # 💼 Business Logic Layer (12 Specialized Services)
│   ├── firebase.js                        # Firebase initialization, configuration, dan connection management
│   ├── authService.js                     # Complete authentication operations (login, register, password reset, session management)
│   ├── userService.js                     # User profile management, account settings
│   ├── resiService.js                     # Package receipt CRUD operations, COD support, automatic loker assignment (1-5)
│   ├── userPackageService.js              # User-specific package history, timeline-based tracking, dan status management
│   ├── packageStatusManager.js            # Smart caching system dengan TTL, request throttling, dan background sync optimization
│   ├── capacityService.js                 # Ultrasonic sensor data processing untuk real-time box capacity monitoring (0-30cm range)
│   ├── lokerControlService.js             # Remote loker control (buka/tutup) dengan automatic reset after 10 seconds
│   ├── activityService.js                 # Comprehensive user activity logging dan audit trail system
│   ├── timelineService.js                 # Delivery timeline dan period management untuk package scheduling
│   └── seederService.js                   # Comprehensive test data generation untuk development dan testing

├── utils/                                  # 🛠️ Utility Functions
│   ├── dateUtils.js                       # Date formatting & manipulation dengan Indonesian locale
│   ├── validation.js                      # Input validation helpers untuk forms dan data entry
│   └── packageStatusUtils.js              # Package status utilities dengan status flow management

├── constants/                              # 📐 App Constants
│   └── Colors.js                          # Color scheme & theme definitions

├── assets/                                 # 🖼️ Static Assets
│   ├── icon.png                           # App icon
│   ├── splash.png                         # Splash screen
│   ├── adaptive-icon.png                  # Android adaptive icon
│   ├── favicon.png                        # Web favicon
│   ├── splash-icon.png                    # Splash screen icon
│   └── images/                            # SVG illustrations
│       ├── login-illustration.svg         # Login screen SVG
│       ├── register-illustration.svg      # Register screen SVG
│       └── forgot-password-illustration.svg # Password recovery SVG

├── types/                                  # 📝 Type Definitions
│   └── svg.d.ts                           # SVG TypeScript declarations

├── 🧪 TESTING & DEVELOPMENT TOOLS
├── testing/
│   └── esp32-simulator.js                 # Interactive ESP32 hardware simulator (Node.js based)
├── firebase-cleanup/
│   ├── cleanup.js                         # Interactive database cleanup tool dengan user safety
│   └── .gitignore                         # Cleanup tool gitignore

├── 📚 DOCUMENTATION (Comprehensive)
├── docs/                                  # Complete documentation system
│   ├── README.md                          # Documentation index dan overview
│   ├── 01_PROJECT_STRUCTURE.md            # Project architecture dan database schema
│   ├── 02_SYSTEM_FLOWS.md                 # System flows dan hardware integration
│   └── 03_VERSION_HISTORY.md              # Version history dan changelog
├── README.md                              # Main project documentation
├── CLAUDE.md                              # Claude Code development guide
├── ESP32_DOCS.md                          # ESP32 hardware documentation
├── BUILD_APK.md                           # APK build instructions
└── SETUPGUIDE.md                          # Project setup guide

└── 📋 Configuration Files
    ├── package.json                           # Dependencies & scripts
    ├── app.json                               # Expo configuration
    ├── eas.json                               # EAS Build configuration
    ├── metro.config.js                        # Metro bundler configuration
    └── node_modules/                          # Installed dependencies
```

## 1.7 UI Interface Design & Mockups

### **Design System & Theme**
```
  ----------------------------------------------------------------------------+
                            DESIGN SYSTEM                                  |
  ----------------------------------------------------------------------------+
                                                                          |
|  🎨 COLOR SCHEME (Professional Blue Theme)                               |
|    ----------------+                                                      |
|  | Primary: #3b82f6      ← Blue-500 untuk buttons & highlights           |
|  | Secondary: #1d4ed8    ← Blue-700 untuk active states                  |
|  | Success: #10b981      ← Emerald-500 untuk success states              |
|  | Warning: #f59e0b      ← Amber-500 untuk warning states                |
|  | Danger: #ef4444       ← Red-500 untuk danger states                   |
|  | Background: #f8fafc   ← Slate-50 untuk light theme                    |
|  | Surface: #ffffff      ← White untuk cards & surfaces                  |
|  | Text: #1e293b         ← Slate-800 untuk primary text                  |
|  | Indonesian: #059669   ← Emerald-600 untuk Indonesian elements         |
|    ----------------+                                                      |
                                                                          |
|  📱 RESPONSIVE LAYOUT PRINCIPLES                                          |
|    ----------------+                                                      |
|  | Mobile-First Design   ← Optimized untuk mobile screens                |
|  | Indonesian Locale     ← Indonesian date/currency formatting           |
|  | Touch-Friendly UI     ← 44px minimum touch targets                    |
|  | Accessibility Ready   ← Screen reader support                         |
|  | Dark Mode Support     ← Light/dark theme switching                    |
|  | Visual Indicators     ← Special status indicators for operations      |
|    ----------------+                                                      |
  ----------------------------------------------------------------------------+
```

### **Screen Layout Mockups**

#### **Dashboard Screen (Tab 1)**
```
┌─────────────────────────────────────────────┐
│  📦 Dashboard Shintya                      │
├─────────────────────────────────────────────┤
│  📊 Ringkasan Paket                        │
│  ┌─────────┬─────────┬─────────┬─────────┐  │
│  │ Total   │ COD     │ Diambil │ Kapasitas│  │
│  │ 125     │ 8       │ 98      │ 75%      │  │
│  └─────────┴─────────┴─────────┴─────────┘  │
├─────────────────────────────────────────────┤
│  📦 Paket Terbaru                          │
│  • SH240001 - Ahmad (COD) [Loker 3]       │
│  • SH240002 - Siti (Regular)              │
│  • SH240003 - Budi (COD) [Loker 1]        │
├─────────────────────────────────────────────┤
│  🚀 [Tambah Paket]  📊 [Lihat Semua]      │
└─────────────────────────────────────────────┘
```

#### **Package List Screen (Tab 2)**
```
┌─────────────────────────────────────────────┐
│  📦 Daftar Resi                            │
├─────────────────────────────────────────────┤
│  🔍 [Cari resi...]        🎛️ [Filter]      │
├─────────────────────────────────────────────┤
│  📋 SH240001 - Ahmad Suryadi               │
│  💰 COD: Rp 150,000  🏷️ Loker: 3          │
│  📍 Jl. Merdeka No. 45                     │
│  🟡 Status: Telah Tiba                     │
│  [QR] [Edit] [Detail]                      │
│  ─────────────────────────────────────────   │
│  📋 SH240002 - Siti Aminah                 │
│  📦 Regular Package                        │
│  📍 Jl. Sudirman No. 12                    │
│  🟢 Status: Sudah Diambil                  │
│  [Detail] [Riwayat]                        │
└─────────────────────────────────────────────┘
```

#### **Capacity Monitoring Screen (Tab 3)**
```
┌─────────────────────────────────────────────┐
│  📏 Kapasitas Paket                        │
├─────────────────────────────────────────────┤
│  📊 Status Kotak Utama                     │
│  ┌─────────────────────────────────────────┐│
│  │ ████████████████████████████░░░░░░░░░░ ││
│  │             75% Terisi                 ││
│  │         22.5 cm / 30 cm                ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  🚦 Status: Hampir Penuh                   │
│  📶 Sensor: Online                         │
│  🕐 Update: 2 detik yang lalu              │
│  📈 Trend: Stabil                          │
├─────────────────────────────────────────────┤
│  🏷️ Loker COD Status                       │
│  Loker 1: 🟢 Terisi  | Loker 2: ⚪ Kosong │
│  Loker 3: 🟢 Terisi  | Loker 4: ⚪ Kosong │
│  Loker 5: 🟢 Terisi                       │
└─────────────────────────────────────────────┘
```

#### **Profile Screen (Tab 4)**
```
┌─────────────────────────────────────────────┐
│  👤 Profil Pengguna                        │
├─────────────────────────────────────────────┤
│  📧 admin@gmail.com                        │
│  👤 Administrator                          │
│  📱 +628123456789                          │
│  🎭 Role: Admin                            │
│  [Edit Profil]                             │
├─────────────────────────────────────────────┤
│  ⚙️ Settings & Preferences                 │
│  🔧 Package Notifications: Aktif           │
│  📊 Display Stats: Ya                      │
│  [Manage Settings]                         │
├─────────────────────────────────────────────┤
│  ⚙️ Pengaturan                             │
│  🎨 Tema: Terang                           │
│  🔔 Notifikasi: Aktif                      │
│  📊 Tampilkan Info Status: Ya              │
├─────────────────────────────────────────────┤
│  📊 Aktivitas Terbaru                      │
│  • Login - 5 menit lalu                    │
│  • Tambah paket SH240001 - 1 jam lalu     │
│  • Update profile - 2 jam lalu            │
├─────────────────────────────────────────────┤
│  🚪 [Keluar]                               │
└─────────────────────────────────────────────┘
```

### **Modal Components**

#### **QR Code Modal (COD Packages)**
```
┌─────────────────────────────────────────────┐
│  📱 QR Code Paket                          │
├─────────────────────────────────────────────┤
│  📦 SH240001 - Ahmad Suryadi               │
│  💰 COD: Rp 150,000                        │
│  🏷️ Loker: 3                              │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐│
│  │ ████ ██   ██ ████   ██████ ██   ██████ ││
│  │ ████ ██   ██ ████   ██████ ██   ██████ ││
│  │ ████ ██   ██ ████   ██████ ██   ██████ ││
│  │ ████ ██   ██ ████   ██████ ██   ██████ ││
│  │ ████ ██   ██ ████   ██████ ██   ██████ ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  🔓 [Buka Loker]    🔒 [Tutup Loker]       │
│  ⏰ Auto-reset dalam 10 detik              │
├─────────────────────────────────────────────┤
│  [📱 Bagikan QR]    [❌ Tutup]             │
└─────────────────────────────────────────────┘
```

### **Visual Hierarchy & Indonesian UX Elements**

#### **Package Status Indicators**
```
🟢 Sudah Diambil    - Green backgrounds, checkmark icons
🟡 Telah Tiba       - Yellow backgrounds, package icons  
🔵 Sedang Dikirim   - Blue backgrounds, truck icons
🔴 Bermasalah       - Red backgrounds, warning icons
```

#### **COD & Loker Indicators**
```
💰 COD Package      - Special gold accent dengan rupiah symbol
🏷️ Loker Assignment - Numbered badges (1-5) dengan color coding
🔓 Loker Control    - Action buttons dengan countdown timers
📦 Regular Package  - Standard blue accent untuk non-COD
```

#### **Capacity Status (Indonesian)**
```
⚪ Kosong          - Empty/white indicators
🔵 Terisi Sebagian - Partially filled/blue indicators
🟡 Hampir Penuh    - Nearly full/yellow indicators
🔴 Penuh           - Full/red indicators dengan overflow warning
```

#### **Hardware Integration Elements**
```
🔧 System Status    - Hardware connection status indicators
⏱️ Auto-reset Timer - 10-second countdown untuk loker operations
✅ Operation Success - Green confirmation dengan feedback
❌ Operation Failed  - Red error dengan retry options
```

---

**📋 Next Documents:**
- **[02_SYSTEM_FLOWS.md](./02_SYSTEM_FLOWS.md)** - System flows dan hardware integration
- **[03_VERSION_HISTORY.md](./03_VERSION_HISTORY.md)** - Version history dan development changelog