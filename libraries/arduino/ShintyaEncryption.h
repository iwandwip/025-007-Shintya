/**
 * ShintyaEncryption Library - Arduino C++ Version
 * Custom encryption library untuk ESP32
 * Compatible dengan JavaScript version
 * 
 * Algorithm: XOR + Caesar Cipher + Base64
 * Version: 1.0.0
 */

#ifndef SHINTYA_ENCRYPTION_H
#define SHINTYA_ENCRYPTION_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "base64.h"

class ShintyaEncryption {
private:
  String secretKey;
  int caesarShift;
  String version;
  String algorithmName;
  
  // Private methods
  String _xorEncrypt(String input);
  String _xorDecrypt(String input);
  String _caesarEncrypt(String input);
  String _caesarDecrypt(String input);
  String _base64Encode(String input);
  String _base64Decode(String input);
  bool _validatePayload(DynamicJsonDocument& payload);
  
public:
  // Constructor
  ShintyaEncryption(String key = "SHINTYA_2024_SECRET", int shift = 7);
  
  // Main encryption/decryption methods
  String encrypt(String jsonData);
  String decrypt(String encryptedData);
  
  // Utility methods
  String generateNonce(int length = 8);
  int generateChecksum(String input);
  bool validateTimestamp(unsigned long timestamp, unsigned long maxAge = 300000);
  String generateSessionId();
  
  // Data extraction helpers
  String extractField(String jsonString, String fieldName);
  String extractEmail(String decryptedJson);
  String extractUserId(String decryptedJson);
  
  // Validation helpers
  bool isValidEncryptedData(String data);
  bool isPayloadExpired(String decryptedJson);
  
  // Library info
  String getVersion();
  String getAlgorithmInfo();
  
  // Testing helpers
  void printDebugInfo(String message);
  bool testEncryptDecrypt(String testData);
};

#endif