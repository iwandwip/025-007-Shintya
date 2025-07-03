/**
 * ShintyaEncryption Library - Arduino C++ Implementation
 * Custom encryption library untuk ESP32
 * Compatible dengan JavaScript version
 */

#include "ShintyaEncryption.h"

// Constructor
ShintyaEncryption::ShintyaEncryption(String key, int shift) {
  secretKey = key;
  caesarShift = shift;
  version = "1.0.0";
  algorithmName = "XOR + Caesar + Base64";
}

/**
 * Encrypt data (untuk testing purposes - main encryption dilakukan di mobile)
 */
String ShintyaEncryption::encrypt(String jsonData) {
  try {
    // Step 1: XOR Encryption
    String xorResult = _xorEncrypt(jsonData);
    
    // Step 2: Caesar Cipher
    String caesarResult = _caesarEncrypt(xorResult);
    
    // Step 3: Base64 Encoding
    String base64Result = _base64Encode(caesarResult);
    
    return base64Result;
    
  } catch (...) {
    Serial.println("Encryption failed");
    return "";
  }
}

/**
 * Decrypt encrypted data dari mobile app
 */
String ShintyaEncryption::decrypt(String encryptedData) {
  try {
    // Step 1: Base64 Decode
    String caesarResult = _base64Decode(encryptedData);
    if (caesarResult.length() == 0) {
      Serial.println("Base64 decode failed");
      return "";
    }
    
    // Step 2: Reverse Caesar Cipher
    String xorResult = _caesarDecrypt(caesarResult);
    
    // Step 3: Reverse XOR
    String jsonString = _xorDecrypt(xorResult);
    
    // Validate JSON format
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, jsonString);
    
    if (error) {
      Serial.println("JSON parsing failed: " + String(error.c_str()));
      return "";
    }
    
    // Validate payload
    if (!_validatePayload(doc)) {
      Serial.println("Payload validation failed");
      return "";
    }
    
    return jsonString;
    
  } catch (...) {
    Serial.println("Decryption failed");
    return "";
  }
}

/**
 * Generate random nonce
 */
String ShintyaEncryption::generateNonce(int length) {
  const String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  String result = "";
  
  for (int i = 0; i < length; i++) {
    result += chars.charAt(random(0, chars.length()));
  }
  
  return result;
}

/**
 * Generate checksum dari string
 */
int ShintyaEncryption::generateChecksum(String input) {
  int sum = 0;
  for (int i = 0; i < input.length(); i++) {
    sum += (int)input.charAt(i);
  }
  return sum % 999999; // 6 digit checksum
}

/**
 * Validate timestamp
 */
bool ShintyaEncryption::validateTimestamp(unsigned long timestamp, unsigned long maxAge) {
  unsigned long currentTime = millis(); // Atau gunakan NTP time
  unsigned long age = currentTime - timestamp;
  return age <= maxAge;
}

/**
 * Generate session ID
 */
String ShintyaEncryption::generateSessionId() {
  return String(millis()) + String(random(100000, 999999));
}

/**
 * Extract field dari JSON string
 */
String ShintyaEncryption::extractField(String jsonString, String fieldName) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    return "";
  }
  
  if (doc.containsKey(fieldName)) {
    return doc[fieldName].as<String>();
  }
  
  return "";
}

/**
 * Extract email dari decrypted JSON
 */
String ShintyaEncryption::extractEmail(String decryptedJson) {
  return extractField(decryptedJson, "email");
}

/**
 * Extract user ID dari decrypted JSON
 */
String ShintyaEncryption::extractUserId(String decryptedJson) {
  return extractField(decryptedJson, "userId");
}

/**
 * Check if data is valid encrypted format
 */
bool ShintyaEncryption::isValidEncryptedData(String data) {
  // Basic validation: should be Base64 dan reasonable length
  if (data.length() < 20 || data.length() > 2048) {
    return false;
  }
  
  // Check Base64 characters
  for (int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if (!isAlphaNumeric(c) && c != '+' && c != '/' && c != '=') {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if payload is expired
 */
bool ShintyaEncryption::isPayloadExpired(String decryptedJson) {
  String timestampStr = extractField(decryptedJson, "timestamp");
  if (timestampStr.length() == 0) {
    return true;
  }
  
  unsigned long timestamp = timestampStr.toInt();
  return !validateTimestamp(timestamp);
}

/**
 * Get library version
 */
String ShintyaEncryption::getVersion() {
  return version;
}

/**
 * Get algorithm info
 */
String ShintyaEncryption::getAlgorithmInfo() {
  return algorithmName;
}

/**
 * Print debug information
 */
void ShintyaEncryption::printDebugInfo(String message) {
  Serial.println("[ShintyaEncryption] " + message);
}

/**
 * Test encrypt-decrypt cycle
 */
bool ShintyaEncryption::testEncryptDecrypt(String testData) {
  String encrypted = encrypt(testData);
  if (encrypted.length() == 0) {
    return false;
  }
  
  String decrypted = decrypt(encrypted);
  return decrypted.equals(testData);
}

// ===== PRIVATE METHODS =====

/**
 * XOR Encryption/Decryption
 */
String ShintyaEncryption::_xorEncrypt(String input) {
  String result = "";
  for (int i = 0; i < input.length(); i++) {
    char inputChar = input.charAt(i);
    char keyChar = secretKey.charAt(i % secretKey.length());
    result += (char)(inputChar ^ keyChar);
  }
  return result;
}

String ShintyaEncryption::_xorDecrypt(String input) {
  return _xorEncrypt(input); // XOR is symmetric
}

/**
 * Caesar Cipher Encryption
 */
String ShintyaEncryption::_caesarEncrypt(String input) {
  String result = "";
  for (int i = 0; i < input.length(); i++) {
    int charCode = (int)input.charAt(i) + caesarShift;
    if (charCode > 255) charCode -= 256;
    result += (char)charCode;
  }
  return result;
}

/**
 * Caesar Cipher Decryption
 */
String ShintyaEncryption::_caesarDecrypt(String input) {
  String result = "";
  for (int i = 0; i < input.length(); i++) {
    int charCode = (int)input.charAt(i) - caesarShift;
    if (charCode < 0) charCode += 256;
    result += (char)charCode;
  }
  return result;
}

/**
 * Base64 Encode
 */
String ShintyaEncryption::_base64Encode(String input) {
  // Simple Base64 encoding implementation
  const String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String result = "";
  
  int i = 0;
  while (i < input.length()) {
    int a = (int)input.charAt(i++);
    int b = (i < input.length()) ? (int)input.charAt(i++) : 0;
    int c = (i < input.length()) ? (int)input.charAt(i++) : 0;
    
    int bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += (i - 2 < input.length()) ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += (i - 1 < input.length()) ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

/**
 * Base64 Decode
 */
String ShintyaEncryption::_base64Decode(String input) {
  // Simple Base64 decoding implementation
  const String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String result = "";
  
  // Remove padding
  while (input.endsWith("=")) {
    input = input.substring(0, input.length() - 1);
  }
  
  for (int i = 0; i < input.length(); i += 4) {
    int a = chars.indexOf(input.charAt(i));
    int b = (i + 1 < input.length()) ? chars.indexOf(input.charAt(i + 1)) : 0;
    int c = (i + 2 < input.length()) ? chars.indexOf(input.charAt(i + 2)) : 0;
    int d = (i + 3 < input.length()) ? chars.indexOf(input.charAt(i + 3)) : 0;
    
    if (a == -1 || b == -1) continue;
    
    int bitmap = (a << 18) | (b << 12) | (c << 6) | d;
    
    result += (char)((bitmap >> 16) & 255);
    if (c != 0) result += (char)((bitmap >> 8) & 255);
    if (d != 0) result += (char)(bitmap & 255);
  }
  
  return result;
}

/**
 * Validate decrypted payload
 */
bool ShintyaEncryption::_validatePayload(DynamicJsonDocument& payload) {
  // Check required fields
  if (!payload.containsKey("timestamp") || 
      !payload.containsKey("nonce") || 
      !payload.containsKey("checksum")) {
    return false;
  }
  
  // Check timestamp
  unsigned long timestamp = payload["timestamp"];
  if (!validateTimestamp(timestamp)) {
    Serial.println("Timestamp validation failed");
    return false;
  }
  
  // Validate checksum
  String checksumField = "";
  if (payload.containsKey("email")) {
    checksumField = payload["email"].as<String>();
  } else if (payload.containsKey("userId")) {
    checksumField = payload["userId"].as<String>();
  } else if (payload.containsKey("data")) {
    checksumField = payload["data"].as<String>();
  }
  
  if (checksumField.length() > 0) {
    int expectedChecksum = generateChecksum(checksumField);
    int actualChecksum = payload["checksum"];
    
    if (expectedChecksum != actualChecksum) {
      Serial.println("Checksum validation failed");
      return false;
    }
  }
  
  return true;
}