# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Packet Box COD** is an IoT system for automated package reception with Cash on Delivery transactions. The system integrates **React Native + Expo** (mobile app), **Firebase Realtime Database** (cloud storage), and **ESP32** (hardware controller).

The mobile app uses **React Native Paper** for professional UI, featuring **QR Code scanning** (expo-barcode-scanner), **real-time box capacity monitoring**, **push notifications**, and **navigation system** for managing COD/non-COD packages. 

ESP32 communicates with Firebase to synchronize sensor data (GM67 barcode scanner, ultrasonic, servo motor, solenoid lock) with the mobile application. This enables users to register package tracking numbers, insert COD payment, receive package arrival notifications, and retrieve packages using QR code verification - all within one secure and efficient integrated system that solves package delivery issues when recipients are not available.

**Tech Stack:** React Native + Expo + React Native Paper + Firebase + ESP32 + IoT Sensors

Currently implements user authentication functionality using Firebase Auth and Firestore for user data storage.

## Common Commands

```bash
# Start the development server
npm start

# Run on specific platforms
npm run android   # Android device/emulator
npm run ios       # iOS simulator
npm run web       # Web browser
```

## Architecture

### Authentication Flow
- App entry point (`App.js`) wraps the application with necessary providers
- `AppNavigator.js` handles the main navigation logic and authentication state management
- When user is not authenticated, `AuthNavigator.js` manages authentication screens (Login, Register, ForgotPassword)
- Firebase authentication state is monitored via `onAuthChange` listener

### Key Components Structure
- `/src/config/` - Firebase configuration and app theme
- `/src/navigation/` - Navigation setup (main app and auth flows)
- `/src/screens/` - Authentication screens (Login, Register, ForgotPassword)
- `/src/services/` - Authentication service functions

### Firebase Integration
- Authentication handled through `src/services/auth.js` with async functions that return `{success, user/error}` format
- User data stored in Firestore with automatic document creation on registration
- Firebase config contains production credentials in `src/config/firebase.js`

### Styling
- Uses React Native Paper with Material Design 3
- Custom theme configured in `src/config/theme.js` with amber/orange primary colors
- SafeAreaProvider for proper screen boundaries

### Navigation Pattern
- Stack navigation for authentication screens
- Main app navigation placeholder (currently shows loading indicator for authenticated users)
- Authentication state determines which navigator is active