/**
 * SHINTYA ENCRYPTION LIBRARY - Arduino C++ Implementation
 * 
 * Implementation file untuk ShintyaEncryption library.
 * Menyediakan decryption capabilities untuk ESP32 dalam Shintya Package Delivery System.
 * 
 * @author Shintya Package Delivery System
 * @version 1.0.0
 * @platform ESP32, Arduino
 */

#include "ShintyaEncryption.h"

// Static constants definitions
const String ShintyaEncryption::VERSION = "1.0.0";
const String ShintyaEncryption::ALGORITHM_INFO = "XOR + Caesar + Base64";
const String ShintyaEncryption::BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Constructor
 * 
 * @param key Secret key untuk XOR decryption
 * @param shift Caesar cipher shift value
 */
ShintyaEncryption::ShintyaEncryption(String key, int shift) {
  // Validation
  if (key.length() < MIN_SECRET_KEY_LENGTH) {
    lastError = "Secret key must be at least " + String(MIN_SECRET_KEY_LENGTH) + " characters";
    return;
  }
  
  if (shift < MIN_CAESAR_SHIFT || shift > MAX_CAESAR_SHIFT) {
    lastError = "Caesar shift must be between " + String(MIN_CAESAR_SHIFT) + " and " + String(MAX_CAESAR_SHIFT);
    return;
  }
  
  secretKey = key;
  caesarShift = shift;
  version = VERSION;
  algorithmInfo = ALGORITHM_INFO;
  debugMode = false;
  lastError = "";
}

/**
 * Main decryption method
 * 
 * @param encryptedData Base64 encoded encrypted string
 * @return Decrypted JSON string, atau empty string jika gagal
 */
String ShintyaEncryption::decrypt(String encryptedData) {
  clearError();
  
  if (debugMode) {
    Serial.println("[ShintyaEncryption] Starting decryption process...");
    Serial.println("[ShintyaEncryption] Input: " + encryptedData.substring(0, 20) + "...");
  }
  
  try {
    // Step 1: Validate input
    if (encryptedData.length() == 0) {
      lastError = "Empty encrypted data";
      return "";
    }
    
    if (!isValidBase64(encryptedData)) {
      lastError = "Invalid Base64 format";
      return "";
    }
    
    // Step 2: Base64 decode
    String base64Decoded = _base64Decode(encryptedData);
    if (base64Decoded.length() == 0) {
      lastError = "Base64 decode failed";
      return "";
    }
    
    if (debugMode) {
      Serial.println("[ShintyaEncryption] Base64 decoded length: " + String(base64Decoded.length()));
    }
    
    // Step 3: Reverse Caesar cipher
    String caesarDecrypted = _reverseCaesar(base64Decoded);
    if (caesarDecrypted.length() == 0) {
      lastError = "Caesar decryption failed";
      return "";
    }
    
    // Step 4: Reverse XOR encryption
    String xorDecrypted = _reverseXOR(caesarDecrypted);
    if (xorDecrypted.length() == 0) {
      lastError = "XOR decryption failed";
      return "";
    }
    
    if (debugMode) {
      Serial.println("[ShintyaEncryption] XOR decrypted: " + xorDecrypted.substring(0, 50) + "...");
    }
    
    // Step 5: Validate JSON format
    if (!isValidJsonData(xorDecrypted)) {
      lastError = "Invalid JSON format after decryption";
      return "";
    }
    
    // Step 6: Validate payload
    if (!_validatePayload(xorDecrypted)) {
      // lastError sudah diset di _validatePayload
      return "";
    }
    
    if (debugMode) {
      Serial.println("[ShintyaEncryption] Decryption successful!");
    }
    
    return xorDecrypted;
    
  } catch (...) {
    lastError = "Unknown decryption error";
    return "";
  }
}

/**
 * Extract field dari decrypted JSON string
 * 
 * @param decryptedJson JSON string hasil decryption
 * @param fieldName Nama field yang ingin diextract
 * @return Value dari field, atau empty string jika tidak ditemukan
 */
String ShintyaEncryption::extractField(String decryptedJson, String fieldName) {
  if (decryptedJson.length() == 0 || fieldName.length() == 0) {
    return "";
  }
  
  return _extractJsonField(decryptedJson, fieldName);
}

/**
 * Extract email dari decrypted JSON
 */
String ShintyaEncryption::extractEmail(String decryptedJson) {
  return extractField(decryptedJson, "email");
}

/**
 * Extract timestamp dari decrypted JSON
 */
String ShintyaEncryption::extractTimestamp(String decryptedJson) {
  return extractField(decryptedJson, "timestamp");
}

/**
 * Extract nonce dari decrypted JSON
 */
String ShintyaEncryption::extractNonce(String decryptedJson) {
  return extractField(decryptedJson, "nonce");
}

/**
 * Extract session ID dari decrypted JSON
 */
String ShintyaEncryption::extractSessionId(String decryptedJson) {
  return extractField(decryptedJson, "sessionId");
}

/**
 * Validate timestamp
 */
bool ShintyaEncryption::validateTimestamp(unsigned long timestamp, unsigned long maxAge) {
  unsigned long now = millis(); // ESP32 uptime dalam milliseconds
  
  // Simple validation - dalam konteks ESP32, kita check relative age
  // Karena ESP32 tidak punya real-time clock, ini simplified validation
  if (timestamp == 0) {
    return false;
  }
  
  // Untuk production, implementation ini perlu disesuaikan dengan real-time clock
  // Saat ini kita return true untuk basic validation
  return true;
}

/**
 * Validate user email (placeholder implementation)
 */
bool ShintyaEncryption::validateUser(String email) {
  if (email.length() == 0) {
    return false;
  }
  
  // Basic email format validation
  int atIndex = email.indexOf('@');
  int dotIndex = email.lastIndexOf('.');
  
  return (atIndex > 0 && dotIndex > atIndex && dotIndex < email.length() - 1);
}

/**
 * Check jika string adalah valid encrypted data
 */
bool ShintyaEncryption::isValidEncryptedData(String data) {
  if (data.length() == 0) {
    return false;
  }
  
  // Check Base64 format
  if (!isValidBase64(data)) {
    return false;
  }
  
  // Try to decrypt (tanpa error output)
  bool originalDebugMode = debugMode;
  debugMode = false;
  
  String decrypted = decrypt(data);
  
  debugMode = originalDebugMode;
  
  return (decrypted.length() > 0);
}

/**
 * Check jika string adalah valid JSON
 */
bool ShintyaEncryption::isValidJsonData(String jsonData) {
  if (jsonData.length() == 0) {
    return false;
  }
  
  // Basic JSON validation - check untuk opening dan closing braces
  jsonData.trim();
  
  return (jsonData.startsWith("{") && jsonData.endsWith("}"));
}

/**
 * Generate checksum untuk string
 */
int ShintyaEncryption::generateChecksum(String input) {
  long hash = 0;
  
  if (input.length() == 0) return hash;
  
  for (int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash; // Convert to 32-bit
  }
  
  return abs((int)hash);
}

/**
 * Verify checksum dari JSON data
 */
bool ShintyaEncryption::verifyChecksum(String jsonData, int expectedChecksum) {
  int actualChecksum = generateChecksum(jsonData);
  return (actualChecksum == expectedChecksum);
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
  return algorithmInfo;
}

/**
 * Print decryption steps untuk debugging
 */
void ShintyaEncryption::printDecryptionSteps(String encryptedData) {
  bool originalDebugMode = debugMode;
  debugMode = true;
  
  Serial.println("=== SHINTYA ENCRYPTION DEBUG ===");
  Serial.println("Input: " + encryptedData);
  
  String result = decrypt(encryptedData);
  
  Serial.println("Result: " + (result.length() > 0 ? "SUCCESS" : "FAILED"));
  if (result.length() == 0) {
    Serial.println("Error: " + lastError);
  } else {
    Serial.println("Decrypted JSON: " + result);
  }
  Serial.println("=== END DEBUG ===");
  
  debugMode = originalDebugMode;
}

/**
 * Get last error message
 */
String ShintyaEncryption::getLastError() {
  return lastError;
}

/**
 * Set debug mode
 */
void ShintyaEncryption::setDebugMode(bool enabled) {
  debugMode = enabled;
}

/**
 * Check jika debug mode aktif
 */
bool ShintyaEncryption::isDebugMode() {
  return debugMode;
}

/**
 * Check jika ada error
 */
bool ShintyaEncryption::hasError() {
  return (lastError.length() > 0);
}

/**
 * Clear error message
 */
void ShintyaEncryption::clearError() {
  lastError = "";
}

// ==================== STATIC UTILITY METHODS ====================

/**
 * Generate random nonce string
 */
String ShintyaEncryption::generateRandomNonce(int length) {
  String chars = "0123456789abcdef";
  String result = "";
  
  for (int i = 0; i < length; i++) {
    result += chars.charAt(random(chars.length()));
  }
  
  return result;
}

/**
 * Check jika string adalah valid Base64
 */
bool ShintyaEncryption::isValidBase64(String data) {
  if (data.length() == 0) return false;
  
  // Check character set
  for (int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if (!((c >= 'A' && c <= 'Z') || 
          (c >= 'a' && c <= 'z') || 
          (c >= '0' && c <= '9') || 
          c == '+' || c == '/' || c == '=')) {
      return false;
    }
  }
  
  // Check length (must be multiple of 4)
  return (data.length() % 4 == 0);
}

/**
 * Get current time as string (untuk ESP32)
 */
String ShintyaEncryption::getCurrentTimeString() {
  return String(millis());
}

// ==================== PRIVATE HELPER METHODS ====================

/**
 * Reverse XOR encryption
 */
String ShintyaEncryption::_reverseXOR(String input) {
  String result = "";
  int keyLength = secretKey.length();
  
  for (int i = 0; i < input.length(); i++) {
    char inputChar = input.charAt(i);
    char keyChar = secretKey.charAt(i % keyLength);
    char xorResult = inputChar ^ keyChar;
    result += xorResult;
  }
  
  return result;
}

/**
 * Reverse Caesar cipher
 */
String ShintyaEncryption::_reverseCaesar(String input) {
  String result = "";
  
  for (int i = 0; i < input.length(); i++) {
    int charCode = (int)input.charAt(i);
    charCode = (charCode - caesarShift + 256) % 256;
    result += (char)charCode;
  }
  
  return result;
}

/**
 * Base64 decode implementation
 */
String ShintyaEncryption::_base64Decode(String input) {
  String result = "";
  int i = 0;
  
  // Remove padding
  while (input.endsWith("=")) {
    input = input.substring(0, input.length() - 1);
  }
  
  while (i < input.length()) {
    int encoded1 = BASE64_CHARS.indexOf(input.charAt(i++));
    int encoded2 = (i < input.length()) ? BASE64_CHARS.indexOf(input.charAt(i++)) : 0;
    int encoded3 = (i < input.length()) ? BASE64_CHARS.indexOf(input.charAt(i++)) : 0;
    int encoded4 = (i < input.length()) ? BASE64_CHARS.indexOf(input.charAt(i++)) : 0;
    
    if (encoded1 == -1 || encoded2 == -1) {
      lastError = "Invalid Base64 character";
      return "";
    }
    
    int combined = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += (char)((combined >> 16) & 255);
    if (encoded3 != 0) result += (char)((combined >> 8) & 255);
    if (encoded4 != 0) result += (char)(combined & 255);
  }
  
  return result;
}

/**
 * Validate decrypted payload
 */
bool ShintyaEncryption::_validatePayload(String jsonString) {
  // Check required fields
  String requiredFields[] = {"timestamp", "nonce", "sessionId", "checksum", "version"};
  int numFields = 5;
  
  for (int i = 0; i < numFields; i++) {
    String fieldValue = _extractJsonField(jsonString, requiredFields[i]);
    if (fieldValue.length() == 0) {
      lastError = "Missing required field: " + requiredFields[i];
      return false;
    }
  }
  
  // Validate nonce format (should be hex)
  String nonce = _extractJsonField(jsonString, "nonce");
  if (!_isHexString(nonce)) {
    lastError = "Invalid nonce format";
    return false;
  }
  
  // Additional validations bisa ditambahkan di sini
  
  return true;
}

/**
 * Extract field dari JSON string (simple parser)
 */
String ShintyaEncryption::_extractJsonField(String jsonString, String fieldName) {
  String searchPattern = "\"" + fieldName + "\":";
  int startIndex = jsonString.indexOf(searchPattern);
  
  if (startIndex == -1) {
    return "";
  }
  
  startIndex += searchPattern.length();
  
  // Skip whitespace
  while (startIndex < jsonString.length() && 
         (jsonString.charAt(startIndex) == ' ' || jsonString.charAt(startIndex) == '\t')) {
    startIndex++;
  }
  
  if (startIndex >= jsonString.length()) {
    return "";
  }
  
  // Check jika value adalah string (quoted)
  if (jsonString.charAt(startIndex) == '"') {
    startIndex++; // Skip opening quote
    int endIndex = jsonString.indexOf('"', startIndex);
    if (endIndex == -1) return "";
    return jsonString.substring(startIndex, endIndex);
  } else {
    // Numeric atau boolean value
    int endIndex = startIndex;
    while (endIndex < jsonString.length() && 
           jsonString.charAt(endIndex) != ',' && 
           jsonString.charAt(endIndex) != '}' &&
           jsonString.charAt(endIndex) != ' ') {
      endIndex++;
    }
    return jsonString.substring(startIndex, endIndex);
  }
}

/**
 * Helper method untuk indexOf implementation
 */
int ShintyaEncryption::_indexOf(String source, char target, int startIndex) {
  for (int i = startIndex; i < source.length(); i++) {
    if (source.charAt(i) == target) {
      return i;
    }
  }
  return -1;
}

/**
 * Helper method untuk indexOf string implementation
 */
int ShintyaEncryption::_indexOf(String source, String target, int startIndex) {
  if (target.length() == 0) return startIndex;
  if (startIndex >= source.length()) return -1;
  
  for (int i = startIndex; i <= source.length() - target.length(); i++) {
    bool found = true;
    for (int j = 0; j < target.length(); j++) {
      if (source.charAt(i + j) != target.charAt(j)) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

/**
 * Helper method untuk substring
 */
String ShintyaEncryption::_substring(String source, int startIndex, int endIndex) {
  if (endIndex == -1) endIndex = source.length();
  if (startIndex >= source.length() || startIndex >= endIndex) return "";
  
  String result = "";
  for (int i = startIndex; i < endIndex && i < source.length(); i++) {
    result += source.charAt(i);
  }
  return result;
}

/**
 * Helper method untuk trim
 */
String ShintyaEncryption::_trim(String input) {
  int start = 0;
  int end = input.length() - 1;
  
  // Find start
  while (start < input.length() && 
         (input.charAt(start) == ' ' || input.charAt(start) == '\t' || 
          input.charAt(start) == '\n' || input.charAt(start) == '\r')) {
    start++;
  }
  
  // Find end
  while (end >= 0 && 
         (input.charAt(end) == ' ' || input.charAt(end) == '\t' || 
          input.charAt(end) == '\n' || input.charAt(end) == '\r')) {
    end--;
  }
  
  if (start > end) return "";
  
  return input.substring(start, end + 1);
}

/**
 * Check jika string adalah hex
 */
bool ShintyaEncryption::_isHexString(String input) {
  if (input.length() == 0) return false;
  
  for (int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'))) {
      return false;
    }
  }
  return true;
}