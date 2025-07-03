/**
 * SHINTYA ENCRYPTION LIBRARY - Arduino C++ Header
 * 
 * Custom encryption library untuk ESP32 dalam Shintya Package Delivery System.
 * Library ini compatible dengan JavaScript version untuk cross-platform encryption.
 * 
 * Features:
 * - XOR + Caesar Cipher decryption algorithm
 * - Lightweight implementation untuk ESP32 memory constraints
 * - Cross-platform compatibility dengan JavaScript version
 * - Built-in validation dan checksum verification
 * - No external library dependencies
 * 
 * Usage:
 * ```cpp
 * #include "ShintyaEncryption.h"
 * 
 * ShintyaEncryption encryption;
 * String qrData = getScannedQRData();
 * String decrypted = encryption.decrypt(qrData);
 * String email = encryption.extractField(decrypted, "email");
 * ```
 * 
 * @author Shintya Package Delivery System
 * @version 1.0.0
 * @platform ESP32, Arduino
 */

#ifndef SHINTYA_ENCRYPTION_H
#define SHINTYA_ENCRYPTION_H

#include <Arduino.h>

// Forward declarations
class ShintyaEncryption {
private:
  String secretKey;
  int caesarShift;
  String version;
  String algorithmInfo;
  
  // Private helper methods
  String _reverseXOR(String input);
  String _reverseCaesar(String input);
  String _base64Decode(String input);
  bool _validatePayload(String jsonString);
  String _extractJsonField(String jsonString, String fieldName);
  int _indexOf(String source, char target, int startIndex = 0);
  int _indexOf(String source, String target, int startIndex = 0);
  String _substring(String source, int startIndex, int endIndex = -1);
  String _trim(String input);
  bool _isHexString(String input);
  
public:
  // Constructor
  ShintyaEncryption(String key = "SHINTYA_2024_SECRET", int shift = 7);
  
  // Main decryption method (encryption tidak diperlukan di ESP32)
  String decrypt(String encryptedData);
  
  // Utility methods untuk data extraction
  String extractField(String decryptedJson, String fieldName);
  String extractEmail(String decryptedJson);
  String extractTimestamp(String decryptedJson);
  String extractNonce(String decryptedJson);
  String extractSessionId(String decryptedJson);
  
  // Validation methods
  bool validateTimestamp(unsigned long timestamp, unsigned long maxAge = 300000);
  bool validateUser(String email);
  bool isValidEncryptedData(String data);
  bool isValidJsonData(String jsonData);
  
  // Checksum operations
  int generateChecksum(String input);
  bool verifyChecksum(String jsonData, int expectedChecksum);
  
  // Library info methods
  String getVersion();
  String getAlgorithmInfo();
  
  // Debug helpers
  void printDecryptionSteps(String encryptedData);
  String getLastError();
  
private:
  String lastError;
  bool debugMode;
  
public:
  // Debug control
  void setDebugMode(bool enabled);
  bool isDebugMode();
  
  // Error handling
  bool hasError();
  void clearError();
  
  // Static utility methods (bisa dipanggil tanpa instance)
  static String generateRandomNonce(int length = 8);
  static bool isValidBase64(String data);
  static String getCurrentTimeString();
  
  // Constants
  static const int MAX_TIMESTAMP_AGE = 300000; // 5 minutes in milliseconds
  static const int MIN_SECRET_KEY_LENGTH = 8;
  static const int MAX_CAESAR_SHIFT = 25;
  static const int MIN_CAESAR_SHIFT = 1;
  
  // Version constants
  static const String VERSION;
  static const String ALGORITHM_INFO;
  
  // Base64 character set
  static const String BASE64_CHARS;
};

// Static constants initialization
extern const String ShintyaEncryption::VERSION;
extern const String ShintyaEncryption::ALGORITHM_INFO;
extern const String ShintyaEncryption::BASE64_CHARS;

#endif // SHINTYA_ENCRYPTION_H