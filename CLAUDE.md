# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native + Expo mobile application for a comprehensive package delivery and tracking system. The system integrates with ESP32 hardware for RFID-based package identification, real-time capacity monitoring, and secure package access management.

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development  
npm run android
npm run ios
npm run web

# Clear cache when needed
npm run clear
npm run reset

# Clean up Firebase data
npm run cleanup

# Generate test data
npm run seed
```

## Architecture

### Multi-Role System
- **Admin**: Complete management access via `app/(admin)/` routes (not yet implemented)
- **User**: Customer access via `app/(tabs)/` routes
- Authentication handled through `contexts/AuthContext.jsx`
- Role-based routing enforced in `_layout.jsx` files

### Key Technologies
- **React Native + Expo SDK 53**
- **Firebase** (Authentication + Firestore + Realtime Database)
- **Expo Router** for file-based navigation
- **ESP32 Arduino firmware** with RFID and ultrasonic sensor integration
- **React Native SVG** for custom illustrations
- **Async Storage** for local data persistence

## Application Structure

### Navigation Flow
```
app/
├── index.jsx                 # Root redirect logic
├── _layout.jsx              # Main app layout with providers
├── (auth)/                  # Authentication screens
│   ├── _layout.jsx         # Auth layout wrapper
│   ├── login.jsx           # Login screen
│   ├── register.jsx        # Registration screen
│   └── forgot-password.jsx # Password recovery
└── (tabs)/                  # Main app screens (authenticated users)
    ├── _layout.jsx         # Tab navigation setup
    ├── index.jsx           # Home/Dashboard
    ├── list-resi.jsx       # Package list management
    ├── kapasitas-paket.jsx # Real-time capacity monitoring
    ├── edit-profile.jsx    # User profile editing
    └── profile.jsx         # User profile display
```

### Service Layer
All business logic is separated into service files:

#### Core Services
- `authService.js` - Authentication operations (login, register, password reset)
- `userService.js` - User profile management and RFID operations
- `firebase.js` - Firebase initialization and configuration

#### Package Management
- `resiService.js` - Package receipt (resi) CRUD operations
- `userPackageService.js` - User-specific package history and status
- `packageStatusManager.js` - Real-time package status monitoring and caching

#### Hardware Integration
- `capacityService.js` - Box capacity monitoring via ultrasonic sensor
- `pairingService.js` - RFID card pairing for packages
- `timelineService.js` - Delivery timeline management

#### Supporting Services
- `activityService.js` - User activity logging and tracking
- `seederService.js` - Test data generation for development
- `lokerControlService.js` - Hardware loker control (buka/tutup)

### State Management
Global state via React Context:
- `AuthContext` - User authentication, profile, and session management
- `SettingsContext` - App settings and configuration
- `NotificationContext` - Toast notifications and alerts
- `ThemeContext` - Theme management (light/dark mode)

### UI Components

#### Core Components
- `AuthGuard` - Route protection for authenticated users
- `ErrorBoundary` - Global error handling

#### Form Components
- `AuthForm` - Reusable authentication form
- `Input` - Custom text input with validation
- `Button` - Themed button component
- `DatePicker` - Date selection component
- `TimelinePicker` - Timeline selection for packages

#### Modal Components
- `AddResiModal` - Add new package receipt
- `EditResiModal` - Edit existing package
- `PaymentModal` - Package payment interface
- `QRCodeModal` - QR code display for packages
- `HelpModal` - User assistance

#### Display Components
- `DataTable` - Tabular data display
- `LoadingSpinner` - Loading states
- `ToastNotification` - Alert messages
- `CreditBalance` - User priority display
- `IllustrationContainer` - SVG illustration wrapper

#### Custom Illustrations
- `LoginIllustration` - Login screen graphic
- `RegisterIllustration` - Registration screen graphic
- `ForgotPasswordIllustration` - Password recovery graphic

## Database Structure

### Firestore Collections

#### users
```javascript
{
  id: string,              // User UID
  email: string,           // User email
  nama: string,            // Full name
  noTelp: string,          // Phone number
  role: 'user' | 'admin',  // User role
  rfidCode: string,        // Associated RFID code
  priority: 'normal' | 'high', // User priority level
  deleted: boolean,        // Soft delete flag
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### receipts (Package Records)
```javascript
{
  id: string,              // Auto-generated ID
  noResi: string,          // Receipt/tracking number
  nama: string,            // Recipient name
  alamat: string,          // Delivery address
  noHp: string,            // Phone number
  jenisBarang: string,     // Package type
  beratBarang: number,     // Weight (kg)
  biayaKirim: number,      // Shipping cost
  isCod: boolean,          // Cash on delivery flag
  nominalCod: number,      // COD amount
  status: string,          // Package status
  userId: string,          // Owner user ID
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### capacity
```javascript
{
  height: number,          // Current height (cm)
  maxHeight: number,       // Maximum capacity (cm)
  lastUpdated: timestamp,  // Last sensor reading
  deviceId: string         // ESP32 device ID
}
```

#### rfid_pairing
```javascript
{
  isActive: boolean,       // Pairing session active
  userId: string,          // User requesting pairing
  rfidCode: string,        // Generated RFID code
  status: string,          // Session status
  startTime: string,       // Session start
  cancelledTime: string,   // Session end
  receivedTime: string     // RFID received time
}
```

#### packages (Timeline-based)
```javascript
packages/{timelineId}/periods/{periodKey}/user_packages/{userId}
{
  userId: string,
  packageId: string,
  deliveryDate: string,
  status: 'pending' | 'delivered' | 'picked_up' | 'returned',
  pickupDate: string,
  accessMethod: string,
  weight: number,
  dimensions: string,
  priority: string,
  notes: string
}
```

#### globalActivities
```javascript
{
  userId: string,
  type: string,            // Activity type
  message: string,         // Activity description
  createdAt: timestamp,
  metadata: object         // Additional data
}
```

#### lokerControl (Hardware Control)
```javascript
lokerControl/{loker_1 to loker_5}
{
  buka: number,            // 1 = open command, 0 = no command
  tutup: number,           // 1 = close command, 0 = no command
  timestamp: timestamp,    // Last command timestamp
  lastCommand: string,     // "buka", "tutup", "reset", "none"
  nomorLoker: number       // Loker number (1-5)
}
```

### Realtime Database Structure
```
systemStatus/
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

## Hardware Integration

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **RFID Module (RC522)** - Package identification and access control
- **Ultrasonic Sensor** - Real-time capacity measurement
- **LCD Display** - User interface and status display
- **WiFi Module** - Firebase connectivity
- **Button Interface** - Menu navigation

### Key Firmware Components
- `KNN.ino` - Machine learning for delivery pattern predictions
- `WiFi.ino` - Network connectivity and Firebase sync
- `Menu.ino` - LCD interface and button controls
- `USBComs.ino` - Serial communication for debugging
- `RFID.ino` - RFID card reading and writing

### Hardware Communication Flow
1. **RFID Pairing**: App initiates → ESP32 generates code → User confirms
2. **Package Access**: RFID scan → Firebase lookup → Access granted/denied
3. **Capacity Monitoring**: Ultrasonic readings → Firebase update → Real-time UI
4. **Loker Control**: App sends command → Firebase → ESP32 reads → Hardware action → Auto-reset

## Important Implementation Details

### Authentication System
- Special admin account: `admin@gmail.com` (accepts any password for development)
- Regular users authenticate with email/password via Firebase Auth
- Email verification not required for faster testing
- Session persistence with automatic re-authentication

### Package Management Features
- **Receipt Tracking**: Unique tracking numbers for each package
- **Status Management**: Real-time status updates (pending, delivered, picked up, returned)
- **COD Support**: Cash-on-delivery option with amount tracking and loker assignment
- **Loker Management**: Automatic loker assignment for COD packages (1-5)
- **Loker Control**: Remote buka/tutup loker via QR code modal (COD only)
- **Capacity Monitoring**: Real-time box fill level with visual indicators
- **QR Code Generation**: Unique QR codes for each package
- **Activity Logging**: Complete audit trail of all package operations

### RFID Integration Features
- **Secure Pairing**: 30-second timeout for pairing sessions
- **Random Code Generation**: 8-character hexadecimal codes
- **Multi-Package Access**: One RFID can access multiple packages
- **Real-time Sync**: Immediate updates between hardware and app

### User Experience Features
- **Pull-to-Refresh**: All list views support refresh
- **Offline Support**: Graceful degradation when offline
- **Real-time Updates**: Live data sync across all screens
- **Toast Notifications**: Non-intrusive status messages
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

### Performance Optimizations
- **Data Caching**: Smart caching with TTL management
- **Throttling**: Request throttling to prevent API spam
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: SVG illustrations for small size
- **Background Sync**: Intelligent data refresh on app resume

## Development Guidelines

### Code Style
- Use functional components with hooks
- Implement proper error boundaries
- Follow React Native best practices
- Use TypeScript-ready structure (for future migration)

### Firebase Security
- Implement proper security rules
- Use service accounts for ESP32
- Rate limit API calls
- Validate all user inputs

### Testing Approach
- Test with multiple user accounts
- Verify RFID pairing flow
- Check offline functionality
- Validate real-time updates

### Common Issues & Solutions
1. **RFID Not Pairing**: Check ESP32 WiFi connection
2. **Capacity Not Updating**: Verify sensor connections
3. **Login Issues**: Clear AsyncStorage cache
4. **Real-time Sync Delays**: Check Firebase quotas

## Language & Localization
- Primary language: Indonesian (Bahasa Indonesia)
- All UI text in Indonesian
- Date/time in Indonesian format
- Currency in IDR format

## Future Enhancements
- [ ] Admin dashboard implementation
- [ ] Push notifications
- [ ] Barcode scanning
- [ ] Multiple box support
- [ ] Delivery route optimization
- [ ] Analytics dashboard
- [ ] Export functionality
- [ ] Multi-language support