# Utils Directory - Utility Functions

## Overview
The `utils/` directory contains utility functions and helper modules that provide common functionality across the application. These utilities handle date formatting, package status management, and form validation.

## Directory Structure
```
utils/
├── dateUtils.js            # Date formatting and manipulation
├── packageStatusUtils.js   # Package status management and formatting
└── validation.js           # Form validation and input sanitization
```

## Utility Modules

### dateUtils.js
- **Purpose**: Date formatting and manipulation utilities
- **Key Features**:
  - Indonesian date formatting
  - Timezone handling
  - Date calculations
  - Relative time formatting
  - Calendar utilities
- **Key Functions**:
  - `formatDate(date, format)` - Format date with specified format
  - `formatIndonesianDate(date)` - Format date in Indonesian locale
  - `getRelativeTime(date)` - Get relative time (e.g., "2 jam yang lalu")
  - `isToday(date)` - Check if date is today
  - `isThisWeek(date)` - Check if date is in current week
  - `calculateDaysDifference(date1, date2)` - Calculate days between dates
  - `getMonthName(monthIndex)` - Get Indonesian month name
  - `parseDateString(dateString)` - Parse date string to Date object
- **Dependencies**: None (pure JavaScript Date API)

### packageStatusUtils.js
- **Purpose**: Package status management and formatting
- **Key Features**:
  - Status lifecycle management
  - Status color coding
  - Status validation
  - Status transition logic
  - Indonesian status labels
- **Key Functions**:
  - `getStatusColor(status)` - Get color for package status
  - `getStatusLabel(status)` - Get Indonesian label for status
  - `getStatusIcon(status)` - Get icon for package status
  - `isValidStatusTransition(fromStatus, toStatus)` - Validate status transitions
  - `getNextValidStatuses(currentStatus)` - Get possible next statuses
  - `formatPackageType(type)` - Format package type display
  - `calculatePackageAge(createdAt)` - Calculate package age
  - `getStatusProgress(status)` - Get progress percentage for status
- **Status Flow**: "Sedang Dikirim" → "Telah Tiba" → "Sudah Diambil"
- **Dependencies**: `dateUtils` for date calculations

### validation.js
- **Purpose**: Form validation and input sanitization
- **Key Features**:
  - Email validation
  - Phone number validation
  - Password strength validation
  - Input sanitization
  - Indonesian-specific validation
- **Key Functions**:
  - `validateEmail(email)` - Validate email format
  - `validatePhone(phone)` - Validate Indonesian phone number
  - `validatePassword(password)` - Validate password strength
  - `validateName(name)` - Validate name format
  - `validateResiNumber(resiNumber)` - Validate receipt number
  - `sanitizeInput(input)` - Sanitize user input
  - `validateRequired(value, fieldName)` - Required field validation
  - `validateLength(value, min, max, fieldName)` - Length validation
  - `validateNumeric(value, fieldName)` - Numeric validation
  - `validateCurrency(value, fieldName)` - Currency validation
- **Dependencies**: None (pure JavaScript validation)

## Utility Functions Details

### Date Utilities

#### Indonesian Date Formatting
```javascript
const formatIndonesianDate = (date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};
```

#### Relative Time Formatting
```javascript
const getRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  
  return formatIndonesianDate(date);
};
```

### Package Status Utilities

#### Status Color Mapping
```javascript
const getStatusColor = (status) => {
  const statusColors = {
    'Sedang Dikirim': '#FFA500',    // Orange
    'Telah Tiba': '#4CAF50',        // Green
    'Sudah Diambil': '#2196F3',     // Blue
    'Dikembalikan': '#FF5722'       // Red
  };
  
  return statusColors[status] || '#757575'; // Default gray
};
```

#### Status Validation
```javascript
const isValidStatusTransition = (fromStatus, toStatus) => {
  const validTransitions = {
    'Sedang Dikirim': ['Telah Tiba', 'Dikembalikan'],
    'Telah Tiba': ['Sudah Diambil', 'Dikembalikan'],
    'Sudah Diambil': [], // Final state
    'Dikembalikan': []   // Final state
  };
  
  return validTransitions[fromStatus]?.includes(toStatus) || false;
};
```

### Validation Utilities

#### Email Validation
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) return { isValid: false, message: 'Email wajib diisi' };
  if (!emailRegex.test(email)) return { isValid: false, message: 'Format email tidak valid' };
  
  return { isValid: true, message: null };
};
```

#### Indonesian Phone Number Validation
```javascript
const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  
  if (!phone) return { isValid: false, message: 'Nomor telepon wajib diisi' };
  if (!phoneRegex.test(phone)) return { isValid: false, message: 'Format nomor telepon tidak valid' };
  
  return { isValid: true, message: null };
};
```

#### Password Strength Validation
```javascript
const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password wajib diisi' };
  if (password.length < 6) return { isValid: false, message: 'Password minimal 6 karakter' };
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      isValid: false, 
      message: 'Password harus mengandung huruf besar, huruf kecil, dan angka' 
    };
  }
  
  return { isValid: true, message: null };
};
```

## Integration Patterns

### Usage in Components
```javascript
import { formatIndonesianDate, getRelativeTime } from '../utils/dateUtils';
import { getStatusColor, getStatusLabel } from '../utils/packageStatusUtils';
import { validateEmail, validatePhone } from '../utils/validation';

// In component
const formattedDate = formatIndonesianDate(package.createdAt);
const statusColor = getStatusColor(package.status);
const emailValidation = validateEmail(userInput.email);
```

### Error Handling
- **Graceful Fallbacks**: Utilities provide fallback values for invalid inputs
- **Consistent Error Messages**: Standardized error messages in Indonesian
- **Type Safety**: Input validation and type checking

### Performance Optimization
- **Pure Functions**: All utilities are pure functions for predictable behavior
- **Memoization**: Expensive calculations are memoized where appropriate
- **Minimal Dependencies**: Utilities have minimal external dependencies

## Common Usage Patterns

### Form Validation Flow
```javascript
const validateForm = (formData) => {
  const errors = {};
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) errors.email = emailValidation.message;
  
  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) errors.phone = phoneValidation.message;
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) errors.password = passwordValidation.message;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### Date Display
```javascript
const formatPackageDate = (package) => {
  const createdDate = formatIndonesianDate(package.createdAt);
  const relativeTime = getRelativeTime(package.createdAt);
  
  return {
    absolute: createdDate,
    relative: relativeTime,
    age: calculatePackageAge(package.createdAt)
  };
};
```

### Status Management
```javascript
const getPackageStatusInfo = (package) => {
  return {
    color: getStatusColor(package.status),
    label: getStatusLabel(package.status),
    icon: getStatusIcon(package.status),
    progress: getStatusProgress(package.status),
    nextStatuses: getNextValidStatuses(package.status)
  };
};
```

## Development Notes

### Indonesian Localization
- All user-facing messages are in Indonesian
- Date formatting follows Indonesian conventions
- Phone number validation supports Indonesian formats
- Currency formatting uses IDR standards

### Testing Support
- Pure functions are easily testable
- Comprehensive test coverage for validation rules
- Mock-friendly utility functions
- Edge case handling

### Extensibility
- Easy to add new validation rules
- Modular design allows for easy extension
- Consistent patterns across all utilities
- TypeScript-ready structure

The utils directory provides essential utility functions that ensure consistent behavior, proper validation, and Indonesian localization throughout the application.