# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native with Expo mobile application for managing payments at Islamic religious schools (TPQ). The system integrates with ESP32 firmware for RFID-based student identification and payment tracking.

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

# Testing and utilities
npm run test          # Run ESP32 simulator for hardware testing
npm run cleanup       # Clean up Firebase data using interactive CLI

# No lint/typecheck commands - project uses minimal linting setup
```

## Architecture

### Multi-Role System
- **Admin**: Complete management access via `app/(admin)/` routes
- **User (Wali)**: Parent/guardian access via `app/(tabs)/` routes
- Authentication handled through `contexts/AuthContext.jsx`

### Key Technologies
- **React Native + Expo SDK 53**
- **Firebase** (Authentication + Firestore)
- **Expo Router** for file-based navigation
- **ESP32 Arduino firmware** with RFID integration

### Service Layer
All business logic is separated into service files:
- `authService.js` - Authentication operations
- `userService.js` - Student/parent management
- `*paymentService.js` - Payment processing (admin/wali specific)
- `timelineService.js` - Payment schedule management
- `pairingService.js` - RFID card-to-student mapping

### State Management
Layered React Context architecture:
```javascript
<ErrorBoundary>
  <SettingsProvider>      // Theme, language, app settings
    <AuthProvider>        // Authentication state, user profiles  
      <NotificationProvider> // Toast notifications
        <App />
      </NotificationProvider>
    </AuthProvider>
  </SettingsProvider>
</ErrorBoundary>
```

## Hardware Integration

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **RFID reading** for student identification
- **KNN algorithm** for payment pattern analysis
- **WiFi connectivity** for real-time data sync
- **Menu system** for device configuration

### Key Firmware Components
- `KNN.ino` - Machine learning for payment predictions
- `WiFi.ino` - Network connectivity and Firebase sync
- `Menu.ino` - LCD interface and button controls
- `USBComs.ino` - Serial communication

## Important Implementation Details

### Authentication
- Special admin account: `admin@gmail.com` (accepts any password)
- Regular users authenticate with email/password via Firebase
- Role-based routing enforced in `_layout.jsx` files

### Payment System
- Timeline-based payment schedules configurable by admin
- Real-time status updates via Firebase listeners
- Payment status managed through `paymentStatusManager.js`
- Complex validation logic in `utils/paymentStatusUtils.js`

### RFID Integration
- Students paired with RFID cards via `pairingService.js`
- Card scans trigger payment processing
- Hardware communicates with app via Firebase real-time database

### Database Structure
Firebase Firestore collections:
- `users` - Student and parent accounts
- `payments` - Payment records and history  
- `timelines` - Payment schedule templates
- `settings` - System configuration
- `rfid_pairing` - Real-time RFID pairing sessions (Firebase Realtime DB)

## Development Notes

### Firebase Configuration
- Configuration hardcoded in `services/firebase.js` (security concern)
- Uses `.env.example` template for environment variables
- Environment variables follow `EXPO_PUBLIC_` prefix pattern

### Language Support
- Primary language: Indonesian (Bahasa Indonesia)  
- UI text and validation messages in Indonesian
- No formal i18n system - hardcoded Indonesian strings throughout

### Testing ESP32 Integration
- Run `npm run test` to use ESP32 simulator for development
- Physical hardware: ESP32 + RFID reader + LCD display needed for full functionality
- WiFi credentials configured via device menu system
- Hardware communicates via Firebase real-time database

### Performance Considerations
- `paymentStatusManager.js` implements sophisticated caching and throttling
- Real-time Firebase listeners for hardware state synchronization
- Background state management for app resume scenarios

### Common File Patterns
- Screen components in `app/` follow Expo Router conventions
- Reusable UI components in `components/ui/`
- Business logic abstracted to `services/`
- Form validation centralized in `utils/validation.js`
- Complex payment status logic in `utils/paymentStatusUtils.js`