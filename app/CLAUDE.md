# App Directory - Main Application Structure

## Overview
The `app/` directory implements the main application using Expo Router with file-based routing. This is the core navigation and screen structure for the React Native + Expo mobile application.

## Directory Structure
```
app/
├── index.jsx                 # Root entry point with auth routing logic
├── _layout.jsx              # Main app layout with context providers
├── (auth)/                  # Authentication screens (public access)
│   ├── _layout.jsx         # Auth layout wrapper
│   ├── login.jsx           # Login screen with RFID pairing
│   ├── register.jsx        # Registration screen with validation
│   └── forgot-password.jsx # Password recovery with email reset
└── (tabs)/                  # Main app screens (authenticated users only)
    ├── _layout.jsx         # Tab navigation setup with 4 visible tabs
    ├── index.jsx           # Home/Dashboard with capacity and recent packages
    ├── list-resi.jsx       # Package management with CRUD operations
    ├── kapasitas-paket.jsx # Real-time capacity monitoring
    ├── profile.jsx         # User profile display with RFID management
    └── edit-profile.jsx    # Profile editing (hidden tab)
```

## Key Components and Functions

### Root Files

#### `index.jsx` - Authentication Router
- **Purpose**: Entry point for authentication-based routing
- **Key Functions**:
  - `useAuth()` - Authentication state management
  - Auto-routing based on user authentication status
  - Loading state management during initialization
- **Navigation Logic**: Authenticated users → `/(tabs)`, Unauthenticated → `/(auth)/login`

#### `_layout.jsx` - Main App Layout
- **Purpose**: Global layout with context providers
- **Provider Hierarchy**:
  1. `GluestackUIProvider` - UI library theming
  2. `ErrorBoundary` - Global error handling
  3. `SettingsProvider` - App settings and theme
  4. `AuthProvider` - Authentication and user management
  5. `NotificationProvider` - Toast notifications
- **Features**: Global toast notifications, stack navigation

### Authentication Group `(auth)/`

#### `_layout.jsx` - Auth Layout
- **Purpose**: Layout wrapper for authentication screens
- **Features**: Simple stack navigator without headers

#### `login.jsx` - Login Screen
- **Key Functions**:
  - `handleLogin()` - Firebase authentication
  - `handleAdminLogin()` - Special admin account handling
  - Form validation with real-time error display
- **Special Features**: 
  - Admin account support (`admin@gmail.com`)
  - Custom illustrations for branding
  - Keyboard avoiding view for mobile UX

#### `register.jsx` - Registration Screen
- **Key Functions**:
  - `handleRegister()` - User registration with Firebase
  - Real-time form validation
  - 5-field form validation (name, email, phone, password, confirm)
- **Features**: Success navigation to login after registration

#### `forgot-password.jsx` - Password Recovery
- **Key Functions**:
  - `handleForgotPassword()` - Firebase password reset
  - Email validation and format checking
- **Features**: Specific error handling for Firebase auth errors

### Main Application Group `(tabs)/`

#### `_layout.jsx` - Tab Navigation
- **Purpose**: Main tab navigation structure
- **Tabs Configuration**:
  - **Beranda** (Home): Dashboard and overview
  - **List Resi**: Package management
  - **Kapasitas**: Capacity monitoring
  - **Profil**: User profile
  - **Edit Profile**: Hidden tab (accessed programmatically)
- **Features**: Dynamic theming, emoji icons

#### `index.jsx` - Home/Dashboard
- **Key Functions**:
  - `fetchUserStats()` - Real-time statistics
  - `fetchRecentActivities()` - Activity feed
  - `handleRefresh()` - Pull-to-refresh functionality
- **Features**:
  - Personal greeting with user name
  - Package statistics cards (total, COD, ready for pickup)
  - Real-time activity notifications
  - Quick action menu navigation

#### `list-resi.jsx` - Package Management
- **Key Functions**:
  - `fetchPackages()` - Real-time package list
  - `handleAddPackage()` - Add new package with modal
  - `handleEditPackage()` - Edit package details
  - `handleDeletePackage()` - Remove package
  - `generateQRCode()` - QR code for locker control
- **Features**:
  - COD/Non-COD system support
  - Active/History filtering
  - CRUD operations with modal interfaces
  - Real-time Firebase subscriptions

#### `kapasitas-paket.jsx` - Capacity Monitoring
- **Key Functions**:
  - `fetchCapacityData()` - ESP32 sensor data
  - `calculateStatus()` - Status calculation from sensor data
  - `getStatusColor()` - Visual indicators
- **Features**:
  - Real-time ultrasonic sensor data (0-30cm range)
  - Visual progress indicators with color coding
  - Status levels: Empty → Partial → Almost Full → Full
  - Auto-refresh on screen focus

#### `profile.jsx` - User Profile
- **Key Functions**:
  - `handleLogout()` - Secure logout with confirmation
  - `navigateToEditProfile()` - Profile editing navigation
- **Features**:
  - User profile information display
  - Role-based theming (admin vs user)
  - QR code modal for user identification
  - RFID code display for hardware pairing

#### `edit-profile.jsx` - Profile Editing
- **Key Functions**:
  - `handleSaveProfile()` - Update user profile
  - `validateForm()` - Real-time validation
- **Features**:
  - Form for editing user information
  - Keyboard avoiding for mobile UX
  - Loading states and success feedback

## Architecture Patterns

### Navigation Flow
```
index.jsx → Auth Check → (auth)/* OR (tabs)/*
(auth)/* → login → register/forgot-password
(tabs)/* → Tab navigation between main screens
profile → edit-profile (hidden navigation)
```

### State Management
- **Context Usage**: `useAuth`, `useSettings`, `useNotification`
- **Local State**: Form management, loading states, modal visibility
- **Real-time Data**: Firebase listeners for live updates

### Authentication & Security
- **Protected Routes**: Authentication check at root level
- **Role-based Access**: Admin vs user theming and features
- **Secure Logout**: Confirmation and state cleanup
- **Form Validation**: Real-time validation with error handling

### Integration Points
- **Firebase**: Authentication, Firestore, Real-time Database
- **Hardware**: ESP32 sensor integration, RFID pairing
- **UI Components**: Reusable components from `/components`
- **Services**: Business logic from `/services`

## Performance Optimizations
- **Real-time Updates**: Firebase listeners with proper cleanup
- **Loading States**: Skeleton screens and spinners
- **Pull-to-refresh**: User-initiated data refresh
- **Context Optimization**: Proper provider hierarchy

## Development Notes
- Uses Expo Router for file-based routing
- Follows React Native best practices
- Implements proper error boundaries
- Supports offline functionality
- Includes comprehensive error handling