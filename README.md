# 🚀 Smart Packet Box COD

IoT system for automated package reception with Cash on Delivery transactions that integrates **React Native + Expo** (mobile app), **Firebase Realtime Database** (cloud storage), and **ESP32** (hardware controller).

## 📱 Tech Stack

- **Frontend**: React Native + Expo Router
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Icons & Illustrations**: SVG illustrations
- **Hardware**: ESP32 + IoT Sensors

## 📁 Project Structure

```
app/
├── _layout.jsx                    # Root layout with navigation
├── index.jsx                      # Entry point with auth redirect
├── login.jsx                      # Login screen
├── register.jsx                   # Register screen
├── forgot-password.jsx            # Forgot password screen
├── (main)/                        # Authenticated app routes
│   ├── _layout.jsx               # Main app layout
│   └── index.jsx                 # Dashboard/home screen
├── components/                    # Reusable UI components
│   ├── AuthCard.jsx              # Authentication card wrapper
│   ├── AuthInput.jsx             # Input component for auth
│   └── index.js                  # Component exports
├── config/                        # Configuration files
│   ├── firebase.js               # Firebase configuration
│   └── theme.js                  # App theme configuration
├── services/                      # Business logic & API calls
│   └── auth.js                   # Authentication services
├── lib/                          # Utility functions
│   ├── validation.js             # Form validation helpers
│   └── index.js                  # Lib exports
└── constants/                     # App constants
    ├── illustrations.js          # SVG illustrations
    └── index.js                  # Constants exports
```

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npx expo start --clear
   ```

3. **Run on device**:
   - Scan QR code with Expo Go app
   - Or use: `npm run android` / `npm run ios`

## 🔧 Features

### ✅ Currently Implemented
- **Authentication System**: Login, Register, Forgot Password
- **Modern UI**: Material Design 3 with React Native Paper
- **File-based Routing**: Expo Router for navigation
- **Form Validation**: Input validation with helpers
- **Responsive Design**: Works on all screen sizes

### 🔄 Coming Soon
- **QR Code Scanning**: Package verification
- **Real-time Monitoring**: Box capacity tracking
- **Push Notifications**: Package arrival alerts
- **COD Payment**: Cash on delivery processing
- **ESP32 Integration**: IoT sensor communication

## 🏗️ Architecture

The app follows modern React Native and Expo Router conventions:

- **File-based routing** with Expo Router
- **Component-based architecture** with reusable UI components
- **Service layer** for business logic and API calls
- **Utility functions** for validation and helpers
- **Centralized configuration** for theme and Firebase
- **Constants management** for static data like illustrations

## 🔐 Authentication Flow

1. **Entry Point** (`index.jsx`): Checks authentication state
2. **Auth Screens**: Login, Register, Forgot Password
3. **Auto Redirect**: Based on Firebase Auth state
4. **Protected Routes**: Main app routes in `(main)` folder

## 🎨 Design System

Using **Material Design 3** with custom theme:
- **Primary Color**: `#f59e0b` (Amber)
- **Typography**: Material Design typography scale
- **Components**: React Native Paper components
- **Icons**: Material Design icons

## 📦 Dependencies

### Core
- `expo` - Expo framework
- `expo-router` - File-based navigation
- `react-native-paper` - Material Design UI components

### Authentication & Database
- `firebase` - Firebase SDK for auth and Firestore

### UI & Graphics
- `react-native-svg` - SVG support
- `react-native-safe-area-context` - Safe area handling

### Development
- `babel-preset-expo` - Babel configuration for Expo