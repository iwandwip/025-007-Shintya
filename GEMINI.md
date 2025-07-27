# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native + Expo mobile application for a comprehensive package delivery and tracking system. The system integrates with ESP32 hardware featuring real-time ultrasonic capacity monitoring, and secure multi-loker package access management with COD support.

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

# Testing and utilities
npm run test                # Run ESP32 simulator
npm run test-encryption     # Run encryption tests
npm run clean              # Clean and reinstall node_modules
npm run reinstall          # Clean and reinstall dependencies

# Build commands (see BUILD_APK.md for details)
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform android --profile production
```

## Architecture

### Multi-Role System
- **Admin**: Complete management access via `app/(admin)/` routes (referenced but not implemented)
- **User**: Customer access via `app/(tabs)/` routes with full package management
- Authentication handled through `contexts/AuthContext.jsx`
- Role-based routing enforced in `_layout.jsx` files
- Special development admin account: `admin@gmail.com` (accepts any password)

### Key Technologies
- **React Native + Expo SDK 53** with React 19.0.0
- **Firebase** (Authentication + Firestore + Realtime Database)
- **Expo Router** for file-based navigation with nested route groups
- **ESP32 Arduino firmware** with ultrasonic sensor and LCD display
- **React Native SVG** for custom vector illustrations
- **Async Storage** for local data persistence and caching
- **EAS (Expo Application Services)** for cloud builds and distribution
- **Additional Libraries**: Lucide icons, QR code generation, PDF export, Excel support

## Application Structure

### Navigation Flow
```
app/
├── index.jsx                 # Root entry point with auth routing logic
├── _layout.jsx              # Main app layout with context providers
├── (auth)/                  # Authentication screens (public access)
│   ├── _layout.jsx         # Auth layout wrapper with background
│   ├── login.jsx           # Login screen
│   ├── register.jsx        # Registration screen with form validation
│   └── forgot-password.jsx # Password recovery with email reset
└── (tabs)/                  # Main app screens (authenticated users only)
    ├── _layout.jsx         # Tab navigation setup with 4 visible tabs
    ├── index.jsx           # Home/Dashboard with capacity and recent packages
    ├── list-resi.jsx       # Complete package list management with CRUD
    ├── kapasitas-paket.jsx # Real-time capacity monitoring with visual indicators
    ├── edit-profile.jsx    # User profile editing (hidden tab, accessed via profile)
    └── profile.jsx         # User profile display
```

### Service Layer Architecture
Comprehensive service layer with specialized services providing clear separation of concerns:

#### Core Services
- `firebase.js` - Firebase initialization, configuration, and connection management
- `authService.js` - Complete authentication operations (login, register, password reset, session management)
- `userService.js` - User profile management and account settings

#### Package Management Services
- `resiService.js` - Package receipt CRUD operations, COD support, automatic loker assignment (1-5)
- `userPackageService.js` - User-specific package history, timeline-based tracking, and status management
- `packageStatusManager.js` - Smart caching system with TTL, request throttling, and background sync optimization

#### Hardware Integration Services
- `capacityService.js` - Ultrasonic sensor data processing for real-time box capacity monitoring (0-30cm range)
- `lokerControlService.js` - Remote loker control (buka/tutup) with automatic reset after 10 seconds

#### Supporting Services
- `activityService.js` - Comprehensive user activity logging and audit trail system
- `timelineService.js` - Delivery timeline and period management for package scheduling
- `seederService.js` - Comprehensive test data generation for development and testing

### State Management
Global state management via React Context with optimized performance:
- `AuthContext` - User authentication, profile data, and session persistence
- `SettingsContext` - App settings, configuration, and user preferences
- `NotificationContext` - Toast notifications, alerts, and user feedback system
- `ThemeContext` - Theme management (light/dark mode support)

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
  noResi: string,          // Receipt/tracking number (unique)
  nama: string,            // Recipient name
  alamat: string,          // Delivery address
  noHp: string,            // Phone number
  jenisBarang: string,     // Package type
  beratBarang: number,     // Weight (kg)
  biayaKirim: number,      // Shipping cost (IDR)
  isCod: boolean,          // Cash on delivery flag
  nominalCod: number,      // COD amount (IDR)
  tipePaket: string,       // Package type classification
  nomorLoker: number,      // Assigned loker number (1-5 for COD, null for regular)
  status: string,          // Package status (Sedang Dikirim → Telah Tiba → Sudah Diambil)
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
    ├── sessionType: "weighing"
    ├── weight: number
    ├── height: number
    ├── measurementComplete: boolean
    └── lastActivity: timestamp
```

## Hardware Integration

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **Ultrasonic Sensor** - Real-time capacity measurement
- **LCD Display** - User interface and status display
- **WiFi Module** - Firebase connectivity
- **Button Interface** - Menu navigation

### Hardware Communication Flow
1. **Capacity Monitoring**: Ultrasonic sensor readings (0-30cm) → Firebase update → Real-time UI with percentage and visual indicators
2. **Loker Control**: App sends buka/tutup command → Firebase lokerControl collection → ESP32 reads → Hardware action → Auto-reset after 10 seconds
3. **System Status**: ESP32 reports hardware status → Firebase Realtime Database → App displays system health

## Important Implementation Details

### Authentication System
- Special admin account: `admin@gmail.com` (accepts any password for development)
- Regular users authenticate with email/password via Firebase Auth
- Email verification not required for faster testing
- Session persistence with automatic re-authentication

### Package Management Features
- **Receipt Tracking**: Auto-generated unique tracking numbers with search functionality
- **Status Management**: Real-time status updates (Sedang Dikirim → Telah Tiba → Sudah Diambil)
- **COD Support**: Cash-on-delivery with amount tracking, automatic loker assignment, and payment validation
- **Loker Management**: Smart loker assignment system (1-5) with maximum 5 active COD packages system-wide
- **Loker Control**: Remote buka/tutup functionality via QR code modal (COD packages only) with 10-second auto-reset
- **Capacity Monitoring**: Real-time ultrasonic sensor data with visual indicators (Kosong → Terisi Sebagian → Hampir Penuh → Penuh)
- **QR Code Generation**: Dynamic QR codes for each package with embedded package information
- **Activity Logging**: Comprehensive audit trail with user actions, timestamps, and metadata tracking
- **Package Types**: Categorization system with weight and dimension tracking
- **Real-time Sync**: Live updates across all screens with optimized data fetching

### User Experience Features
- **Pull-to-Refresh**: All list views support refresh
- **Offline Support**: Graceful degradation when offline
- **Real-time Updates**: Live data sync across all screens
- **Toast Notifications**: Non-intrusive status messages
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

### Performance Optimizations
- **Smart Caching**: TTL-based caching system with automatic invalidation and memory management
- **Request Throttling**: API call throttling to prevent spam and reduce Firebase costs
- **Lazy Loading**: On-demand component loading and code splitting
- **Image Optimization**: Custom SVG illustrations for minimal bundle size and crisp display
- **Background Sync**: Intelligent data refresh on app resume with connectivity detection
- **Real-time Optimization**: Selective Firebase listeners to reduce bandwidth usage
- **Data Pagination**: Efficient data loading for large package lists
- **Memory Management**: Proper cleanup of listeners and subscriptions

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
- Check offline functionality
- Validate real-time updates

### Common Issues & Solutions
1. **Capacity Not Updating**: Verify sensor connections
2. **Login Issues**: Clear AsyncStorage cache
3. **Real-time Sync Delays**: Check Firebase quotas

## Language & Localization
- Primary language: Indonesian (Bahasa Indonesia)
- All UI text in Indonesian
- Date/time in Indonesian format
- Currency in IDR format

## Development Tools & Testing

### Built-in Development Tools
- **ESP32 Simulator** (`testing/esp32-simulator.js`) - Node.js based hardware simulator for development
- **Seeder Service** - Comprehensive test data generation with realistic package data
- **Firebase Cleanup Tool** (`firebase-cleanup/cleanup.js`) - Automated data cleanup utility
- **Build System** - EAS build configuration with multiple profiles (dev, preview, production)

### Testing Approach
- Test with multiple user accounts and roles
- Validate real-time capacity monitoring and visual updates
- Test COD loker assignment and control functionality
- Check offline functionality and graceful degradation
- Validate cross-device real-time synchronization
- Test hardware communication via ESP32 simulator

## Current Limitations & Known Issues

### Implemented but Limited
1. **COD Loker System**: Maximum 5 active COD packages (hardware constraint)
2. **Single Box Support**: Currently supports one main package box only
3. **Payment Processing**: PaymentModal UI exists but no actual payment gateway integration
4. **Admin Dashboard**: Routes referenced but implementation not complete

### Development Account
- Special admin account: `admin@gmail.com` (accepts any password for testing)
- Email verification disabled for faster development iteration
- Comprehensive logging for debugging hardware communication

## Future Enhancements Roadmap
- [ ] Complete admin dashboard implementation (`app/(admin)/` routes)
- [ ] Push notification system integration
- [ ] Barcode scanning capability addition
- [ ] Multiple box support with individual capacity monitoring
- [ ] Delivery route optimization algorithms
- [ ] Comprehensive analytics dashboard with usage metrics
- [ ] Data export functionality (CSV, Excel formats)
- [ ] Multi-language support (English, other languages)
- [ ] Payment gateway integration (Midtrans, DANA, etc.)
- [ ] Machine learning delivery prediction (KNN.ino expansion)