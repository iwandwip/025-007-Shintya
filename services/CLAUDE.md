# Services Directory - Business Logic Layer

## Overview
The `services/` directory contains the business logic layer for the React Native + Expo application. This layer manages Firebase integration, hardware communication, package management, and real-time data synchronization.

## Directory Structure
```
services/
├── firebase.js                 # Firebase configuration and initialization
├── authService.js              # User authentication and session management
├── userService.js              # User profile and RFID management
├── encryptionService.js        # QR code encryption and scanner mode
├── resiService.js              # Package receipt CRUD operations
├── userPackageService.js       # Timeline-based package management
├── packageStatusManager.js     # Smart caching and performance optimization
├── timelineService.js          # Delivery timeline and period management
├── capacityService.js          # Ultrasonic sensor integration
├── pairingService.js           # RFID card pairing with ESP32
├── lokerControlService.js      # Remote loker control
├── scannerModeService.js       # ESP32 scanner mode management
├── activityService.js          # User activity logging and audit trail
├── sequenceService.js          # Sequential ID management for ESP32
└── seederService.js            # Test data generation for development
```

## Core Infrastructure Services

### firebase.js
- **Purpose**: Firebase configuration and initialization
- **Key Features**:
  - Singleton pattern for app initialization
  - AsyncStorage persistence for authentication
  - Separate Firestore and Realtime Database instances
  - Error handling with graceful fallbacks
- **Exports**: `app`, `auth`, `db`, `realtimeDb`
- **Key Functions**:
  - `initializeApp()` - Firebase app initialization
  - `initializeAuth()` - Authentication with persistence
  - `getFirestore()` - Firestore database instance
  - `getDatabase()` - Realtime database instance

### authService.js
- **Purpose**: User authentication and session management
- **Key Features**:
  - Email/password authentication
  - Profile validation with soft delete checking
  - Special admin account handling
  - Password reset functionality
  - Session persistence
- **Key Functions**:
  - `signInWithEmail(email, password)` - User login
  - `signUpWithEmail(email, password, userProfile)` - User registration
  - `signOut()` - Secure logout
  - `sendPasswordResetEmail(email)` - Password reset
  - `getCurrentUser()` - Get current user state
  - `handleAuthError(error)` - Comprehensive error handling

### userService.js
- **Purpose**: User profile and RFID management with dual RTDB mirroring
- **Key Features**:
  - User profile CRUD operations
  - RFID code management
  - Role-based access control
  - Soft delete system
  - **Dual RTDB Data Mirroring** (Firestore primary, RTDB dual paths)
  - **Write operations sync** to Firestore + original RTDB path + sequence path
  - Sequential ID management for ESP32 compatibility
  - Activity tracking integration
- **Key Functions**:
  - `createUserProfile(uid, profileData)` - Create user profile (writes to both databases + sequence)
  - `getUserProfile(userId)` - Get user profile from Firestore
  - `updateUserProfile(userId, profileData)` - Update profile (syncs all three paths)
  - `updateUserRFID(userId, rfidCode)` - RFID code assignment (syncs all three paths)
  - `deleteUserRFID(userId)` - Remove RFID code (syncs all three paths)
  - `deleteUser(userId)` - Delete user (removes from all three paths)
  - `restoreUser(userId)` - Restore user (syncs all three paths)
  - `getAllUsers()` - Admin function for user management from Firestore
  - `getDeletedUsers()` - Get soft-deleted users from Firestore

### encryptionService.js
- **Purpose**: QR code encryption and scanner mode management
- **Key Features**:
  - Dynamic QR code generation with timestamps
  - XOR + Caesar Cipher encryption
  - Multiple encryption instances
  - Replay attack prevention
  - ESP32 scanner mode integration
- **Key Functions**:
  - `generateDynamicQRCode(userProfile)` - Create encrypted QR
  - `encryptForQR(data)` - QR data encryption
  - `decryptFromQR(encryptedData)` - QR data decryption
  - `setScannerMode(mode, userId)` - ESP32 scanner control
  - `clearScannerMode()` - Reset scanner state

## Package Management Services

### resiService.js
- **Purpose**: Package receipt CRUD operations and COD management with dual RTDB mirroring
- **Key Features**:
  - Package lifecycle management
  - COD support with automatic loker assignment
  - Status tracking (Sedang Dikirim → Telah Tiba → Sudah Diambil)
  - **Dual RTDB Data Mirroring** (Firestore primary, RTDB dual paths)
  - **Firestore remains primary** for all read operations
  - **Write operations sync** to Firestore + original RTDB path + sequence path
  - Sequential ID management for ESP32 compatibility
  - Real-time data synchronization from Firestore
  - Activity logging for all operations
- **Key Functions**:
  - `addResi(resiData)` - Create new package (writes to both databases + sequence)
  - `getResiList()` - Get all packages from Firestore
  - `updateResi(resiId, updateData)` - Update package details (syncs all three paths)
  - `deleteResi(resiId)` - Delete package (removes from all three paths)
  - `subscribeToResiList(callback)` - Real-time package subscription from Firestore
  - `getOccupiedLokers()` - Check occupied loker numbers from Firestore
  - `getUserResiCount(userId)` - Get user package count from Firestore
  - `getUserPackageStats(userId)` - Get user statistics from Firestore
  - `subscribeToUserPackageStats(userId, callback)` - Real-time stats from Firestore
  - `subscribeToOccupiedLokers(callback)` - Real-time loker monitoring from Firestore

### userPackageService.js
- **Purpose**: Timeline-based package management with caching
- **Key Features**:
  - Timeline-based delivery system
  - User-specific package filtering
  - Smart caching with TTL
  - Package status management
  - Performance optimization
- **Key Functions**:
  - `getUserPackages(userId, timelineId, periodKey)` - Get user packages
  - `addUserPackage(packageData)` - Add package to timeline
  - `updatePackageStatus(packageId, status)` - Update package status
  - `getUserPackagesByTimeline(userId, timelineId)` - Timeline filtering
  - `clearUserPackagesCache()` - Cache management

### packageStatusManager.js
- **Purpose**: Smart caching and performance optimization
- **Key Features**:
  - Map-based caching for O(1) access
  - TTL validation (30 seconds for packages)
  - Request throttling to prevent spam
  - Background sync optimization
  - Memory management
- **Key Functions**:
  - `getCachedPackages(userId)` - Get cached packages
  - `updateCachedPackages(userId, packages)` - Update cache
  - `invalidateCache(userId)` - Clear user cache
  - `shouldThrottleRequest(userId, context)` - Request throttling
  - `cleanupExpiredCache()` - Memory cleanup

### timelineService.js
- **Purpose**: Delivery timeline and period management
- **Key Features**:
  - Timeline creation and management
  - Period-based package organization
  - Date range calculations
  - Indonesian date formatting
  - Timeline statistics
- **Key Functions**:
  - `createTimeline(timelineData)` - Create delivery timeline
  - `getTimelinesByUser(userId)` - Get user timelines
  - `updateTimeline(timelineId, updateData)` - Update timeline
  - `deleteTimeline(timelineId)` - Delete timeline
  - `getTimelinePeriods(timelineId)` - Get timeline periods
  - `calculateTimelineStats(timelineId)` - Timeline statistics

## Hardware Integration Services

### capacityService.js
- **Purpose**: Ultrasonic sensor integration for capacity monitoring
- **Key Features**:
  - Real-time capacity monitoring
  - Ultrasonic sensor data processing (0-30cm range)
  - Status calculation (Kosong → Terisi Sebagian → Hampir Penuh → Penuh)
  - Firebase Realtime Database integration
  - Automatic updates and notifications
- **Key Functions**:
  - `getCapacityData()` - Get current capacity
  - `subscribeToCapacityUpdates(callback)` - Real-time capacity updates
  - `updateCapacityData(height, maxHeight)` - Update capacity data
  - `calculateCapacityStatus(height, maxHeight)` - Calculate status
  - `getCapacityPercentage()` - Get capacity percentage

### pairingService.js
- **Purpose**: RFID card pairing with ESP32 hardware
- **Key Features**:
  - 30-second timeout sessions
  - Random 8-character hex code generation
  - RC522 module integration
  - Real-time sync between app and hardware
  - Session management and cleanup
- **Key Functions**:
  - `startPairingSession(userId)` - Initialize pairing
  - `generateRfidCode()` - Generate random RFID code
  - `subscribeToPairingStatus(callback)` - Monitor pairing status
  - `cancelPairingSession()` - Cancel active session
  - `completePairing(rfidCode)` - Complete pairing process

### lokerControlService.js
- **Purpose**: Remote loker control (open/close commands) with dual RTDB mirroring
- **Key Features**:
  - Remote loker commands (buka/tutup)
  - 10-second auto-reset functionality
  - 5 loker system (maximum 5 COD packages)
  - **Dual RTDB Data Mirroring** (Firestore primary, RTDB dual paths)
  - **Write operations sync** to Firestore + original RTDB path + sequence path
  - Sequential ID management for ESP32 compatibility
  - Real-time status monitoring from Firestore
  - Conflict resolution and priority management
- **Key Functions**:
  - `sendLokerCommand(nomorLoker, command)` - Send command (writes to both databases + sequence)
  - `openLoker(nomorLoker)` - Send open command
  - `closeLoker(nomorLoker)` - Send close command
  - `subscribeToLokerStatus(nomorLoker, callback)` - Monitor loker status from Firestore
  - `subscribeToAllLokers(callback)` - Monitor all lokers from Firestore

### scannerModeService.js
- **Purpose**: ESP32 scanner mode management
- **Key Features**:
  - Scanner mode switching (resi/user_qr/idle)
  - Session timeout management (5 minutes)
  - Real-time mode synchronization
  - Conflict resolution
  - Activity logging
- **Key Functions**:
  - `setScannerMode(mode, userId)` - Set scanner mode
  - `getScannerMode()` - Get current scanner mode
  - `clearScannerMode()` - Reset to idle mode
  - `subscribeToScannerMode(callback)` - Monitor mode changes
  - `extendScannerSession()` - Extend session timeout

## Supporting Services

### activityService.js
- **Purpose**: User activity logging and audit trail
- **Key Features**:
  - Comprehensive activity tracking
  - User action logging
  - Audit trail maintenance
  - Activity categorization
  - Real-time activity feed
- **Key Functions**:
  - `logActivity(userId, type, message, metadata)` - Log user activity
  - `getUserActivities(userId)` - Get user activity history
  - `getGlobalActivities()` - Get system-wide activities
  - `subscribeToActivities(callback)` - Real-time activity updates
  - `deleteOldActivities()` - Cleanup old activities

### sequenceService.js
- **Purpose**: Sequential ID management for ESP32 compatibility
- **Key Features**:
  - Sequential ID generation (1, 2, 3) for predictable ESP32 access
  - Atomic ID increment using Firebase transactions
  - Mapping between Firebase IDs and sequential IDs
  - Meta information tracking (count, lastId)
  - ESP32-optimized utility functions
- **Key Functions**:
  - `generateSequentialId(collectionName)` - Generate new sequential ID
  - `addWithSequentialId(collection, firebaseId, data)` - Add with sequence ID
  - `updateByFirebaseId(collection, firebaseId, updates)` - Update by Firebase ID
  - `deleteByFirebaseId(collection, firebaseId)` - Delete by Firebase ID
  - `getSequentialIdByFirebaseId(collection, firebaseId)` - Get sequence ID
  - `getFirebaseIdBySequentialId(collection, sequenceId)` - Get Firebase ID
  - `findUserByRfid(rfidCode)` - ESP32 utility: find user by RFID
  - `getPackagesByLoker(lokerNumber)` - ESP32 utility: get packages by loker

### seederService.js
- **Purpose**: Test data generation for development
- **Key Features**:
  - Realistic test data with Indonesian names
  - Email pattern: userXXX@gmail.com
  - RFID code generation (8-char hex)
  - Collision detection and retry logic
  - Comprehensive test scenarios
- **Key Functions**:
  - `generateTestUsers(count)` - Generate test users
  - `generateTestResi(count)` - Generate test packages
  - `generateTestActivities(count)` - Generate test activities
  - `seedDatabase()` - Full database seeding
  - `clearTestData()` - Cleanup test data

## Integration Patterns

### Firebase Integration
- **Firestore**: Primary database for all structured data and read operations
- **Realtime Database**: Hardware communication, real-time updates, and dual path mirroring
- **Dual RTDB Mirroring Architecture**: 
  - Original paths: `original/receipts/`, `original/users/`, `original/lokerControl/` (app compatibility)
  - Sequence paths: `sequence/receipts/1,2,3`, `sequence/users/1,2,3`, etc. (ESP32 compatibility)
  - Mapping paths: `mapping/collection/firebaseId → sequentialId`
- **Firestore Primary**: All read operations performed on Firestore only
- **Triple Write Synchronization**: All write operations performed on Firestore + 2 RTDB paths
- **Sequential ID Management**: Atomic increment for collision-free ESP32 IDs
- **Authentication**: User management with AsyncStorage persistence
- **Batch Operations**: Atomic transactions for data consistency

### Hardware Communication
- **ESP32 Integration**: Real-time communication via Firebase
- **RFID System**: RC522 module with pairing protocols
- **Sensors**: Ultrasonic sensor for capacity monitoring
- **Loker Control**: Remote hardware control with feedback

### Error Handling
- **Comprehensive Error Mapping**: User-friendly error messages
- **Graceful Fallbacks**: Offline support and cached data
- **Network Resilience**: Retry mechanisms and timeout handling
- **Audit Logging**: Error tracking and debugging support

## Performance Optimizations

### Caching Strategy
- **Map-based Caching**: O(1) data access
- **TTL Validation**: 30-second cache expiration
- **Smart Invalidation**: Automatic cache updates
- **Memory Management**: Cleanup of expired cache entries

### Request Optimization
- **Throttling**: Prevent excessive API calls
- **Batch Operations**: Reduce Firebase costs
- **Background Sync**: Efficient data synchronization
- **In-memory Sorting**: Reduce server-side operations

## Security Measures

### Data Protection
- **Soft Delete System**: Prevent accidental data loss
- **Role-based Access**: Admin vs user permissions
- **Audit Trails**: Complete action logging
- **RFID Security**: Secure pairing and validation

### QR Code Security
- **Dynamic Generation**: Timestamps and nonces
- **Encryption**: XOR + Caesar Cipher
- **Replay Prevention**: TTL validation
- **Multiple Instances**: Context-specific encryption

## Development Tools
- **ESP32 Simulator**: Hardware testing support
- **Firebase Cleanup**: Development utilities
- **Comprehensive Logging**: Debug information
- **Test Data Generation**: Realistic test scenarios

The services directory demonstrates a well-architected system with clear separation of concerns, comprehensive error handling, real-time synchronization, and robust hardware integration capabilities.