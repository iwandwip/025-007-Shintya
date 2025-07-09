# Components Directory - Reusable UI Components

## Overview
The `components/` directory contains a comprehensive collection of reusable UI components organized into logical categories. These components form the foundation of the React Native + Expo application's user interface.

## Directory Structure
```
components/
├── AuthGuard.jsx                    # Route protection wrapper
├── ErrorBoundary.jsx                # Global error handling
├── auth/
│   └── AuthForm.jsx                 # Multi-step authentication form
├── ui/
│   ├── AddResiModal.jsx             # Add package modal
│   ├── Button.jsx                   # Standardized button component
│   ├── CreditBalance.jsx            # Credit/balance display
│   ├── DataTable.jsx                # Responsive data table
│   ├── DatePicker.jsx               # Cross-platform date picker
│   ├── EditResiModal.jsx            # Edit package modal
│   ├── HelpModal.jsx                # User assistance modal
│   ├── IllustrationContainer.jsx    # SVG illustration wrapper
│   ├── Input.jsx                    # Enhanced text input
│   ├── LoadingSpinner.jsx           # Loading state components
│   ├── PaymentModal.jsx             # Payment interface
│   ├── QRCodeModal.jsx              # QR code display with controls
│   ├── TimelinePicker.jsx           # Timeline-based date selection
│   ├── ToastNotification.jsx        # Animated toast notifications
│   ├── UserQRModal.jsx              # Dynamic encrypted QR generation
│   ├── UserQRModalDebug.jsx         # Debug version of UserQRModal
│   ├── UserQRModalSimple.jsx        # Simple version of UserQRModal
│   ├── UserQRModalTest.jsx          # Test version of UserQRModal
│   └── UserQRModalWorking.jsx       # Working version of UserQRModal
└── illustrations/
    ├── ForgotPasswordIllustration.jsx
    ├── LoginIllustration.jsx
    ├── RegisterIllustration.jsx
    └── index.js                     # Centralized exports
```

## Core Application Components

### AuthGuard.jsx
- **Purpose**: Route protection wrapper component
- **Key Features**:
  - Conditional rendering based on authentication state
  - Loading state management during auth initialization
  - Access control with Indonesian text messages
  - Integration with `AuthContext` for user state
- **Props**: `children`, `requireAuth` (boolean)
- **Usage**: Wraps protected routes and components

### ErrorBoundary.jsx
- **Purpose**: Global error handling with fallback UI
- **Key Features**:
  - React class component with error boundary lifecycle
  - Retry functionality with state reset
  - Indonesian error messages
  - Styled fallback UI with retry button
- **Props**: `children`
- **Usage**: Wraps main app components for error catching

## Authentication Components

### AuthForm.jsx
- **Purpose**: Multi-step authentication form with validation
- **Key Features**:
  - Multi-step registration process (2 steps)
  - Special admin handling for `admin@gmail.com`
  - Form validation (email, password, profile)
  - Dynamic UI based on authentication type
  - GluestackUI integration
- **Props**: `type` (login/register/forgot-password), `onSubmit`, `loading`
- **Dependencies**: `GluestackUI`, `Input`, `Button`, `DatePicker`

## UI Components

### Form & Input Components

#### Input.jsx
- **Purpose**: Enhanced text input with validation states
- **Key Features**:
  - Password toggle with eye icon
  - Validation states and error display
  - Accessibility support
  - Multiple variants and sizes
- **Props**: `label`, `placeholder`, `value`, `onChangeText`, `secureTextEntry`, `error`
- **Dependencies**: `GluestackUI`, `Lucide React Native`

#### Button.jsx
- **Purpose**: Standardized button component wrapper
- **Key Features**:
  - GluestackUI wrapper for consistency
  - Multiple variants (`solid`, `outline`)
  - Size options (`sm`, `md`, `lg`)
  - Action types (`primary`, `secondary`)
- **Props**: `title`, `onPress`, `variant`, `disabled`, `size`, `action`
- **Dependencies**: `GluestackUI`

#### DatePicker.jsx
- **Purpose**: Cross-platform date selection
- **Key Features**:
  - Platform-specific behavior (iOS/Android)
  - Date constraints (min/max)
  - Indonesian date formatting
  - Keyboard management
- **Props**: `label`, `value`, `onChange`, `error`, `maximumDate`, `minimumDate`
- **Dependencies**: `@react-native-community/datetimepicker`

#### TimelinePicker.jsx
- **Purpose**: Timeline-based date/time selection
- **Key Features**:
  - Multiple granularities (yearly, monthly, weekly, daily, hourly, minute)
  - Indonesian localization
  - Dynamic configuration based on timeline type
  - Custom week calculations
- **Props**: `label`, `value`, `onChange`, `timelineType`, `error`, `minDate`, `maxDate`
- **Dependencies**: `Colors`

### Display Components

#### LoadingSpinner.jsx
- **Purpose**: Comprehensive loading state management
- **Key Features**:
  - Multiple variants (`LoadingSpinner`, `LoadingCard`, `LoadingOverlay`)
  - Animated transitions (fade, scale, progress)
  - Progress tracking with step indicators
  - Indonesian loading messages
- **Props**: `size`, `color`, `text`, `subText`, `showProgress`, `progressSteps`, `currentStep`
- **Dependencies**: `Colors`, React Native Animated API

#### DataTable.jsx
- **Purpose**: Responsive tabular data display
- **Key Features**:
  - Dynamic cell rendering (status colors, date formatting)
  - Action buttons (edit, delete)
  - Status indicators with color coding
  - Responsive design with horizontal scrolling
- **Props**: `headers`, `data`, `onEdit`, `onDelete`, `keyExtractor`
- **Dependencies**: `Colors`

#### CreditBalance.jsx
- **Purpose**: Credit/balance display component
- **Key Features**:
  - Indonesian currency (IDR) formatting
  - Conditional rendering (only shows if balance > 0)
  - Theme integration with role-based theming
  - Visual indicators with emoji
- **Props**: `creditBalance`, `style`
- **Dependencies**: `AuthContext`, `SettingsContext`, `Colors`

### Notification Components

#### ToastNotification.jsx
- **Purpose**: Animated toast notification system
- **Key Features**:
  - Animated transitions (slide, fade, scale)
  - Gesture support (swipe to dismiss)
  - Multiple types (success, error, warning, info)
  - Safe area handling for iOS notch
  - Auto-dismiss with configurable timeout
- **Props**: Uses `NotificationContext` for state
- **Dependencies**: `NotificationContext`, `SettingsContext`, `Colors`

### Modal Components

#### AddResiModal.jsx
- **Purpose**: Add new package/receipt modal
- **Key Features**:
  - Package types (COD vs regular)
  - Real-time occupied loker tracking
  - Required field validation
  - Capacity awareness (COD limit enforcement)
- **Props**: `visible`, `onClose`, `onSubmit`, `loading`, `codResiCount`, `capacityPercentage`
- **Dependencies**: `resiService`, `Colors`

#### EditResiModal.jsx
- **Purpose**: Edit existing package modal
- **Key Features**:
  - Pre-populated data loading
  - Real-time loker status tracking
  - Form validation with error handling
  - Dynamic updates
- **Props**: `visible`, `onClose`, `onSubmit`, `resiData`, `loading`
- **Dependencies**: `resiService`, `Colors`

#### QRCodeModal.jsx
- **Purpose**: QR code display with loker control
- **Key Features**:
  - Dual mode (user identification vs COD package control)
  - Remote loker control (open/close)
  - Real-time status monitoring
  - Countdown timer with auto-reset
  - Dynamic QR content generation
- **Props**: `visible`, `onClose`, `userEmail`, `isAdmin`, `resiData`
- **Dependencies**: `react-native-qrcode-svg`, `lokerControlService`

#### UserQRModal.jsx (Multiple Variants)
- **Purpose**: Dynamic encrypted QR code generation
- **Key Features**:
  - Security (XOR + Caesar Cipher encryption)
  - Dynamic generation (timestamp + nonce)
  - Scanner mode integration
  - Auto-refresh functionality
  - Multiple variants (Working, Debug, Test, Simple)
- **Props**: `visible`, `onClose`, `userProfile`
- **Dependencies**: `encryptionService`, `scannerModeService`

#### PaymentModal.jsx
- **Purpose**: Payment interface (UI structure exists)
- **Key Features**:
  - Payment gateway ready structure
  - COD support
  - Visual feedback for payment status
- **Props**: `visible`, `onClose`, `paymentData`
- **Dependencies**: `Colors`

#### HelpModal.jsx
- **Purpose**: User assistance and documentation
- **Key Features**:
  - Status explanations
  - Feature guides
  - Troubleshooting information
  - Indonesian content
- **Props**: `visible`, `onClose`
- **Dependencies**: `SettingsContext`, `Colors`

### Utility Components

#### IllustrationContainer.jsx
- **Purpose**: Wrapper for SVG illustrations
- **Key Features**:
  - Shadow effects for consistency
  - Responsive design
  - Unified illustration presentation
- **Props**: `children`, `style`
- **Dependencies**: `Colors`

## Custom Illustrations

### SVG Illustration Components
- **LoginIllustration.jsx**: Login screen vector graphic
- **RegisterIllustration.jsx**: Registration screen vector graphic  
- **ForgotPasswordIllustration.jsx**: Password recovery vector graphic
- **index.js**: Centralized exports for all illustrations

### Common Features
- Responsive sizing with configurable props
- Direct SVG file imports
- Consistent styling with centered containers
- Optimized vector graphics for performance

## Integration Patterns

### Context Integration
- **AuthContext**: User authentication state
- **SettingsContext**: App settings and preferences
- **NotificationContext**: Toast notification system
- **ThemeContext**: Theme management

### Service Integration
- **resiService**: Package management operations
- **lokerControlService**: Hardware loker control
- **encryptionService**: Security and encryption
- **scannerModeService**: ESP32 scanner integration

### Design System
- **Colors**: Centralized color theming with role-based themes
- **GluestackUI**: Modern component library integration
- **Responsive Design**: Screen size awareness
- **Indonesian Localization**: Consistent language support

## Component Hierarchy
```
AuthGuard (Route Protection)
├── ErrorBoundary (Error Handling)
    ├── AuthForm (Multi-step Authentication)
    │   ├── Input (Form Fields)
    │   ├── Button (Actions)
    │   └── DatePicker (Date Selection)
    │
    ├── Modal Components
    │   ├── AddResiModal, EditResiModal
    │   ├── QRCodeModal, UserQRModal
    │   ├── PaymentModal, HelpModal
    │
    ├── Display Components
    │   ├── DataTable, LoadingSpinner
    │   ├── CreditBalance, ToastNotification
    │
    ├── Utility Components
    │   ├── IllustrationContainer
    │   └── TimelinePicker
    │
    └── Illustrations
        ├── LoginIllustration
        ├── RegisterIllustration
        └── ForgotPasswordIllustration
```

## Development Notes
- Components follow React Native best practices
- Comprehensive prop validation and error handling
- Consistent styling with centralized theming
- Performance optimizations with proper lifecycle management
- Accessibility considerations for mobile users
- Indonesian localization throughout