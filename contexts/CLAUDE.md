# Contexts Directory - Global State Management

## Overview
The `contexts/` directory contains React Context providers for global state management. These contexts provide centralized state management for authentication, settings, notifications, and theming throughout the application.

## Directory Structure
```
contexts/
├── AuthContext.jsx         # User authentication and profile management
├── NotificationContext.jsx # Toast notifications and alerts
├── SettingsContext.jsx     # App settings and preferences
└── ThemeContext.jsx        # Theme management and styling
```

## Context Providers

### AuthContext.jsx
- **Purpose**: User authentication state and profile management
- **Key Features**:
  - Firebase authentication integration
  - User profile management
  - Session persistence
  - Auto-login functionality
- **State**:
  - `user` - Current user object
  - `userProfile` - User profile data
  - `isAuthenticated` - Authentication status
  - `isLoading` - Loading state
  - `error` - Error state
- **Key Functions**:
  - `login(email, password)` - User login
  - `register(userData)` - User registration
  - `logout()` - Secure logout
  - `updateProfile(data)` - Update user profile
- **Dependencies**: `authService`, `userService`, `AsyncStorage`

### NotificationContext.jsx
- **Purpose**: Toast notification system
- **Key Features**:
  - Toast notification management
  - Multiple notification types (success, error, warning, info)
  - Auto-dismiss functionality
  - Queue management
  - Animation support
- **State**:
  - `notifications` - Array of active notifications
  - `isVisible` - Notification visibility state
- **Key Functions**:
  - `showNotification(type, message, duration)` - Show notification
  - `hideNotification(id)` - Hide specific notification
  - `clearAllNotifications()` - Clear all notifications
- **Dependencies**: `SettingsContext` for theme integration

### SettingsContext.jsx
- **Purpose**: App settings and preferences management
- **Key Features**:
  - Theme management (light/dark mode)
  - User preferences storage
  - Language settings
  - App configuration
  - Persistent settings storage
- **State**:
  - `theme` - Current theme (light/dark)
  - `language` - Selected language
  - `preferences` - User preferences object
  - `isInitialized` - Settings initialization state
- **Key Functions**:
  - `setTheme(theme)` - Change app theme
  - `setLanguage(language)` - Change app language
  - `updatePreferences(preferences)` - Update user preferences
  - `resetSettings()` - Reset to default settings
- **Dependencies**: `AsyncStorage` for persistence

### ThemeContext.jsx
- **Purpose**: Theme management and styling
- **Key Features**:
  - Dynamic theme switching
  - Color scheme management
  - Component theming support
  - Role-based theming (admin vs user)
  - Consistent styling across app
- **State**:
  - `currentTheme` - Active theme object
  - `themeColors` - Color palette
  - `isDarkMode` - Dark mode status
- **Key Functions**:
  - `toggleTheme()` - Switch between light/dark
  - `getThemeColors()` - Get current color palette
  - `applyRoleTheme(role)` - Apply role-based theme
- **Dependencies**: `SettingsContext`, `Colors` constants

## Integration Patterns

### Provider Hierarchy
The contexts are organized in a specific hierarchy in the main app layout:
```jsx
<SettingsProvider>
  <AuthProvider>
    <NotificationProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </NotificationProvider>
  </AuthProvider>
</SettingsProvider>
```

### Cross-Context Communication
- **Settings → Theme**: Theme changes trigger color updates
- **Auth → Notifications**: Authentication events trigger notifications
- **Theme → All Components**: Theme changes propagate throughout app
- **Settings → Auth**: User preferences affect authentication behavior

## Usage Patterns

### Authentication Context Usage
```jsx
const { user, isAuthenticated, login, logout } = useAuth();

// Login example
const handleLogin = async () => {
  try {
    await login(email, password);
    // User automatically redirected on success
  } catch (error) {
    // Error handling
  }
};
```

### Notification Context Usage
```jsx
const { showNotification } = useNotification();

// Show success notification
showNotification('success', 'Package berhasil ditambahkan!', 3000);

// Show error notification
showNotification('error', 'Terjadi kesalahan saat memuat data', 5000);
```

### Settings Context Usage
```jsx
const { theme, setTheme, preferences } = useSettings();

// Toggle theme
const toggleTheme = () => {
  setTheme(theme === 'light' ? 'dark' : 'light');
};
```

### Theme Context Usage
```jsx
const { currentTheme, themeColors } = useTheme();

// Apply theme colors
const styles = StyleSheet.create({
  container: {
    backgroundColor: themeColors.background,
    color: themeColors.text
  }
});
```

## State Management Features

### Persistence
- **AsyncStorage Integration**: Settings and preferences persist across app sessions
- **Auto-restoration**: Contexts automatically restore state on app launch
- **Cleanup**: Proper cleanup on logout and app termination

### Performance Optimization
- **Memoization**: Context values are memoized to prevent unnecessary re-renders
- **Selective Updates**: Only relevant components re-render on state changes
- **Efficient Subscriptions**: Contexts use efficient subscription patterns

### Error Handling
- **Graceful Degradation**: Contexts handle errors gracefully with fallbacks
- **Error Boundaries**: Integration with ErrorBoundary for error catching
- **User Feedback**: Errors are communicated to users through notifications

## Security Considerations

### Authentication Security
- **Token Management**: Secure handling of authentication tokens
- **Session Timeout**: Automatic logout on session expiration
- **Profile Validation**: User profile validation and sanitization

### Data Protection
- **Sensitive Data**: Proper handling of sensitive user information
- **Encryption**: Local storage encryption for sensitive data
- **Access Control**: Role-based access control through context state

## Development Notes

### Context Best Practices
- **Single Responsibility**: Each context has a single, well-defined purpose
- **Provider Pattern**: Follows React's provider pattern consistently
- **Hook Abstraction**: Custom hooks (useAuth, useNotification, etc.) abstract context usage
- **TypeScript Ready**: Structure supports TypeScript migration

### Testing Support
- **Mock Providers**: Test-friendly provider implementations
- **State Inspection**: Easy state inspection for debugging
- **Isolated Testing**: Contexts can be tested independently

### Performance Considerations
- **Lazy Loading**: Contexts load only when needed
- **Memory Management**: Proper cleanup of subscriptions and listeners
- **Batch Updates**: State updates are batched for performance

The contexts directory provides a robust foundation for global state management, ensuring consistent data flow and user experience throughout the application.