# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native with Expo mobile application for managing package delivery and tracking system. The system integrates with ESP32 firmware for RFID-based package identification and tracking.

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
```

## Architecture

### Multi-Role System
- **Admin**: Complete management access via `app/(admin)/` routes
- **User**: Customer access via `app/(tabs)/` routes
- Authentication handled through `contexts/AuthContext.jsx`

### Key Technologies
- **React Native + Expo SDK 53**
- **Firebase** (Authentication + Firestore)
- **Expo Router** for file-based navigation
- **ESP32 Arduino firmware** with RFID integration

### Service Layer
All business logic is separated into service files:
- `authService.js` - Authentication operations
- `userService.js` - User management
- `resiService.js` - Package receipt processing
- `capacityService.js` - Package capacity management
- `pairingService.js` - RFID card-to-package mapping

### State Management
Global state via React Context:
- `AuthContext` - User authentication and role
- `SettingsContext` - App configuration
- `NotificationContext` - Toast notifications

## Hardware Integration

### ESP32 Firmware
Located in `firmware/` with two versions (R0/R1):
- **RFID reading** for package identification
- **KNN algorithm** for delivery pattern analysis
- **WiFi connectivity** for real-time data sync
- **Menu system** for device configuration

### Key Firmware Components
- `KNN.ino` - Machine learning for delivery predictions
- `WiFi.ino` - Network connectivity and Firebase sync
- `Menu.ino` - LCD interface and button controls
- `USBComs.ino` - Serial communication

## Important Implementation Details

### Authentication
- Special admin account: `admin@gmail.com` (accepts any password)
- Regular users authenticate with email/password via Firebase
- Role-based routing enforced in `_layout.jsx` files

### Package System
- Timeline-based delivery schedules configurable by admin
- Real-time status updates via Firebase listeners
- Package status managed through package tracking system
- Complex validation logic in `utils/validation.js`

### RFID Integration
- Packages paired with RFID cards via `pairingService.js`
- Card scans trigger package processing
- Hardware communicates with app via Firebase real-time database

### Database Structure
Firebase Firestore collections:
- `users` - User accounts
- `packages` - Package records and history  
- `timelines` - Delivery schedule templates
- `settings` - System configuration

## Development Notes

### Firebase Configuration
- Configuration hardcoded in `services/firebase.js`
- Consider moving to environment variables for security

### Language Support
- Primary language: Indonesian (Bahasa Indonesia)
- UI text and validation messages in Indonesian

### Testing ESP32 Integration
- Requires physical ESP32 hardware setup
- RFID reader and LCD display needed for full functionality
- WiFi credentials configured via device menu system

### Common File Patterns
- Screen components in `app/` follow Expo Router conventions
- Reusable UI components in `components/ui/`
- Business logic abstracted to `services/`
- Form validation centralized in `utils/validation.js`