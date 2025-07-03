# 🔐 ShintyaEncryption Library Documentation

**Dynamic Encrypted QR Code System** untuk Shintya Package Delivery System dengan cross-platform compatibility (JavaScript ↔ Arduino C++).

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Cross-Platform Usage](#cross-platform-usage)
- [Testing](#testing)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## Overview

ShintyaEncryption library menyediakan dynamic QR code generation dengan enhanced security features:

- **Always Different QR Content**: Setiap generate menghasilkan QR yang unik meskipun data sama
- **XOR + Caesar Cipher**: Lightweight encryption algorithm tanpa external dependencies
- **Cross-Platform**: Compatible antara JavaScript (Mobile) dan Arduino C++ (ESP32)
- **Security Validation**: Timestamp, nonce, dan checksum validation
- **ESP32 Optimized**: Memory-efficient implementation untuk hardware constraints

### Architecture

```
┌─────────────────┐    Encrypt    ┌─────────────────┐    Scan & Decrypt    ┌─────────────────┐
│   Mobile App    │ ─────────────▶ │   QR Code       │ ─────────────────────▶ │     ESP32       │
│   JavaScript    │               │   Dynamic       │                      │   Arduino C++   │
└─────────────────┘               └─────────────────┘                      └─────────────────┘
```

## Installation

### JavaScript (Mobile App)

```javascript
// Import library
import ShintyaEncryption from '../libraries/javascript/ShintyaEncryption';

// Initialize dengan default settings
const encryption = new ShintyaEncryption();

// Initialize dengan custom settings
const encryption = new ShintyaEncryption("CUSTOM_SECRET_KEY", 7);
```

### Arduino C++ (ESP32)

```cpp
// Include library
#include "libraries/arduino/ShintyaEncryption.h"

// Initialize dengan default settings
ShintyaEncryption encryption;

// Initialize dengan custom settings
ShintyaEncryption encryption("CUSTOM_SECRET_KEY", 7);
```

## Quick Start

### Mobile App - Generate Dynamic QR

```javascript
import ShintyaEncryption from '../libraries/javascript/ShintyaEncryption';

const encryption = new ShintyaEncryption();

// Prepare user data
const userData = {
  email: "user@shintya.com",
  nama: "John Doe",
  type: "user_profile"
};

// Encrypt untuk QR Code
const encryptedQR = encryption.encrypt(userData);

// Use in QR Component
<QRCode value={encryptedQR} size={200} />

// Verify (optional)
const decrypted = encryption.decrypt(encryptedQR);
console.log(decrypted.data.email); // "user@shintya.com"
```

### ESP32 - Decrypt Scanned QR

```cpp
#include "ShintyaEncryption.h"

ShintyaEncryption encryption;

void processScannedQR(String qrData) {
  // Decrypt QR data
  String decryptedJson = encryption.decrypt(qrData);
  
  if (decryptedJson.length() > 0) {
    // Extract user email
    String email = encryption.extractEmail(decryptedJson);
    
    // Display welcome message
    lcd.display("Welcome: " + email);
    
    // Log access
    Serial.println("User access: " + email);
  } else {
    lcd.display("Invalid QR Code");
    Serial.println("QR decrypt failed: " + encryption.getLastError());
  }
}
```

## API Reference

### JavaScript API

#### Constructor

```javascript
new ShintyaEncryption(secretKey, caesarShift)
```

- `secretKey` (string): Secret key untuk XOR encryption (min 8 chars, default: "SHINTYA_2024_SECRET")
- `caesarShift` (number): Caesar cipher shift value (1-25, default: 7)

#### Methods

##### `encrypt(data)`

Encrypts data object menjadi QR-ready string.

```javascript
const encrypted = encryption.encrypt({
  email: "user@email.com",
  nama: "User Name",
  type: "user_profile"
});
```

**Returns**: Encrypted Base64 string

##### `decrypt(encryptedData)`

Decrypts encrypted string kembali ke original data.

```javascript
const result = encryption.decrypt(encryptedString);
console.log(result.data);     // Original data
console.log(result.metadata); // Encryption metadata
```

**Returns**: Object dengan `data` dan `metadata`

##### `validateTimestamp(timestamp, maxAge)`

Validates timestamp untuk prevent old QR usage.

```javascript
const isValid = encryption.validateTimestamp(Date.now(), 300000); // 5 minutes
```

##### `isValidEncryptedData(data)`

Quick validation tanpa full decryption.

```javascript
const isValid = encryption.isValidEncryptedData(qrString);
```

##### `generateNonce(length)`

Generate random hex nonce.

```javascript
const nonce = encryption.generateNonce(8); // "a1b2c3d4"
```

##### `generateChecksum(input)`

Generate checksum untuk data integrity.

```javascript
const checksum = encryption.generateChecksum("test data");
```

### Arduino C++ API

#### Constructor

```cpp
ShintyaEncryption(String secretKey, int caesarShift)
```

#### Methods

##### `String decrypt(String encryptedData)`

Main decryption method untuk ESP32.

```cpp
String decryptedJson = encryption.decrypt(qrData);
```

##### `String extractField(String jsonString, String fieldName)`

Extract specific field dari decrypted JSON.

```cpp
String email = encryption.extractField(jsonString, "email");
```

##### Helper Methods

```cpp
String extractEmail(String jsonString);        // Extract email field
String extractTimestamp(String jsonString);    // Extract timestamp
String extractNonce(String jsonString);        // Extract nonce
String extractSessionId(String jsonString);    // Extract session ID
```

##### Validation Methods

```cpp
bool validateTimestamp(unsigned long timestamp, unsigned long maxAge);
bool validateUser(String email);
bool isValidEncryptedData(String data);
bool isValidJsonData(String jsonData);
```

##### Debug Methods

```cpp
void setDebugMode(bool enabled);               // Enable/disable debug output
void printDecryptionSteps(String encryptedData); // Debug decryption process
String getLastError();                         // Get last error message
```

## Security Features

### 1. Dynamic Content Generation

Setiap QR generation menghasilkan content yang berbeda:

```javascript
const userData = { email: "user@email.com" };

const qr1 = encryption.encrypt(userData); // "eyJlbWFpbCI6..."
const qr2 = encryption.encrypt(userData); // "eyJkYXRhIj0..." (different!)

// But both decrypt to same original data
```

### 2. Timestamp Validation

Prevents replay attacks dengan timestamp checking:

```javascript
// Automatic timestamp validation
const result = encryption.decrypt(qrData);
// Akan throw error jika QR terlalu lama (default: 5 minutes)
```

### 3. Nonce System

Guarantees uniqueness dengan random nonce:

```javascript
// Each encryption includes 8-character random hex nonce
{
  "email": "user@email.com",
  "timestamp": 1704067200000,
  "nonce": "a1b2c3d4",        // Always different
  "sessionId": "sess_xyz123",
  "checksum": 123456
}
```

### 4. Data Integrity

Checksum validation untuk detect corruption:

```javascript
// Automatic checksum validation during decrypt
// Akan throw error jika data corrupted
```

### 5. Algorithm Security

- **XOR Encryption**: Fast dan secure untuk short data
- **Caesar Cipher**: Additional obfuscation layer
- **Base64 Encoding**: QR-compatible format
- **No External Dependencies**: Reduced attack surface

## Cross-Platform Usage

### Mobile App Integration

```javascript
// services/encryptionService.js
import ShintyaEncryption from '../libraries/javascript/ShintyaEncryption';

// Different instances untuk different purposes
export const userQREncryption = new ShintyaEncryption("USER_QR_KEY", 7);
export const packageEncryption = new ShintyaEncryption("PACKAGE_KEY", 5);

// Usage in components
export const generateUserQR = async (userProfile) => {
  const encrypted = userQREncryption.encrypt({
    email: userProfile.email,
    type: "user_profile"
  });
  
  return encrypted;
};
```

### ESP32 Integration

```cpp
// ESP32 main sketch
#include "ShintyaEncryption.h"

// Multiple instances untuk different QR types
ShintyaEncryption userQRDecryption("USER_QR_KEY", 7);
ShintyaEncryption packageDecryption("PACKAGE_KEY", 5);

void processQRCode(String qrData) {
  // Try user QR first
  String userJson = userQRDecryption.decrypt(qrData);
  if (userJson.length() > 0) {
    processUserQR(userJson);
    return;
  }
  
  // Try package QR
  String packageJson = packageDecryption.decrypt(qrData);
  if (packageJson.length() > 0) {
    processPackageQR(packageJson);
    return;
  }
  
  // Invalid QR
  lcd.display("Invalid QR Code");
}
```

## Testing

### Run Tests

```bash
# Run encryption library tests
npm run test-encryption

# Run ESP32 simulator tests
npm run test
```

### Test Categories

1. **Basic Functionality**: Encrypt/decrypt operations
2. **Dynamic Content**: Uniqueness verification
3. **Security Validation**: Timestamp, nonce, checksum tests
4. **Error Handling**: Invalid input handling
5. **Performance**: Speed benchmarks
6. **Cross-Platform**: Compatibility tests

### Example Test

```javascript
// Test dynamic content generation
test('should generate different QR codes for same data', () => {
  const encryption = new ShintyaEncryption();
  const data = { email: "test@email.com" };
  
  const qr1 = encryption.encrypt(data);
  const qr2 = encryption.encrypt(data);
  
  expect(qr1).not.toBe(qr2); // Different QR codes
  
  const decrypted1 = encryption.decrypt(qr1);
  const decrypted2 = encryption.decrypt(qr2);
  
  expect(decrypted1.data.email).toBe(decrypted2.data.email); // Same data
});
```

## Performance

### Benchmarks

- **Encryption Time**: < 100ms (typical: 10-50ms)
- **Decryption Time**: < 100ms (typical: 10-50ms)
- **QR Generation**: < 200ms total (including rendering)
- **Memory Usage**: < 1KB per operation
- **ESP32 Performance**: < 500ms decryption

### Optimization Tips

1. **Reuse Instances**: Create encryption instances once, reuse multiple times
2. **Batch Operations**: Process multiple QR codes together
3. **Error Handling**: Use `isValidEncryptedData()` untuk quick validation
4. **Debug Mode**: Disable debug mode in production

```javascript
// Good: Reuse instance
const encryption = new ShintyaEncryption();
const qr1 = encryption.encrypt(data1);
const qr2 = encryption.encrypt(data2);

// Avoid: Creating new instances
const qr1 = new ShintyaEncryption().encrypt(data1);
const qr2 = new ShintyaEncryption().encrypt(data2);
```

## Troubleshooting

### Common Issues

#### 1. "Invalid Base64 format" Error

**Cause**: QR data corrupted atau tidak dari ShintyaEncryption
**Solution**: Validate QR data sebelum decrypt

```javascript
if (!encryption.isValidEncryptedData(qrData)) {
  console.log("Invalid QR data format");
  return;
}
```

#### 2. "Timestamp is too old" Error

**Cause**: QR code terlalu lama (> 5 minutes default)
**Solution**: Generate QR baru atau increase maxAge

```javascript
// Increase validation window
const result = encryption.decrypt(qrData);
// Or validate manually
if (!encryption.validateTimestamp(timestamp, 600000)) { // 10 minutes
  console.log("QR code expired");
}
```

#### 3. "Checksum validation failed" Error

**Cause**: Data corruption during transmission
**Solution**: Re-generate QR code

#### 4. ESP32 Memory Issues

**Cause**: Large JSON strings atau multiple instances
**Solution**: 
- Use `setDebugMode(false)` in production
- Process QR codes one at a time
- Free memory after processing

```cpp
// Good memory management
void processQR(String qrData) {
  String result = encryption.decrypt(qrData);
  
  if (result.length() > 0) {
    String email = encryption.extractEmail(result);
    // Use email immediately
    handleUser(email);
    
    // result akan auto-freed saat function ends
  }
}
```

### Debug Mode

Enable debug mode untuk detailed error information:

```javascript
// JavaScript debug
console.log("Encryption info:", encryption.getAlgorithmInfo());
```

```cpp
// Arduino debug
encryption.setDebugMode(true);
encryption.printDecryptionSteps(qrData);
Serial.println("Last error: " + encryption.getLastError());
```

### Version Compatibility

Always check version compatibility between platforms:

```javascript
// JavaScript
console.log("Version:", encryption.getVersion()); // "1.0.0"
```

```cpp
// Arduino
Serial.println("Version: " + encryption.getVersion()); // "1.0.0"
```

## Contributing

1. **Test Coverage**: Maintain 90%+ test coverage
2. **Documentation**: Update docs untuk new features
3. **Compatibility**: Test both JavaScript dan Arduino versions
4. **Performance**: Benchmark changes
5. **Security**: Review security implications

---

## License

Part of Shintya Package Delivery System.  
© 2024 Shintya Development Team.

For technical support: [Create an issue](https://github.com/shintya-delivery/issues)