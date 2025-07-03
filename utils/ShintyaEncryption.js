/**
 * ShintyaEncryption Library - JavaScript Version
 * Custom encryption library untuk Shintya App
 * Compatible dengan ESP32 Arduino version
 * 
 * Algorithm: XOR + Caesar Cipher + Base64
 * Version: 1.0.0
 */

class ShintyaEncryption {
  constructor(secretKey = "SHINTYA_2024_SECRET", caesarShift = 7) {
    this.secretKey = secretKey;
    this.caesarShift = caesarShift;
    this.version = "1.0.0";
    this.algorithmName = "XOR + Caesar + Base64";
  }

  /**
   * Encrypt data dengan dynamic elements
   * @param {Object|String} data - Data yang akan di-encrypt
   * @returns {String} - Encrypted Base64 string
   */
  encrypt(data) {
    try {
      // Convert data to payload dengan dynamic elements
      const payload = this._createPayload(data);
      
      // Convert to JSON string
      const jsonString = JSON.stringify(payload);
      
      console.log('Encrypting payload:', payload);
      
      // Step 1: XOR Encryption
      const xorResult = this._xorEncrypt(jsonString);
      
      // Step 2: Caesar Cipher
      const caesarResult = this._caesarEncrypt(xorResult);
      
      // Step 3: Base64 Encoding
      const base64Result = this._base64Encode(caesarResult);
      
      return base64Result;
      
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt encrypted data
   * @param {String} encryptedData - Base64 encrypted string
   * @returns {Object} - Decrypted payload object
   */
  decrypt(encryptedData) {
    try {
      // Step 1: Base64 Decode
      const caesarResult = this._base64Decode(encryptedData);
      
      // Step 2: Reverse Caesar Cipher
      const xorResult = this._caesarDecrypt(caesarResult);
      
      // Step 3: Reverse XOR
      const jsonString = this._xorDecrypt(xorResult);
      
      // Parse JSON
      const payload = JSON.parse(jsonString);
      
      // Validate payload
      this._validatePayload(payload);
      
      console.log('Decrypted payload:', payload);
      
      return payload;
      
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Generate unique nonce
   * @param {Number} length - Panjang nonce (default 8)
   * @returns {String} - Random nonce string
   */
  generateNonce(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate checksum dari input string
   * @param {String} input - Input string
   * @returns {Number} - 6-digit checksum
   */
  generateChecksum(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input.charCodeAt(i);
    }
    return sum % 999999; // 6 digit checksum
  }

  /**
   * Validate timestamp (check expiry)
   * @param {Number} timestamp - Timestamp to validate
   * @param {Number} maxAge - Maximum age in milliseconds (default 5 minutes)
   * @returns {Boolean} - True if valid
   */
  validateTimestamp(timestamp, maxAge = 5 * 60 * 1000) {
    const currentTime = Date.now();
    const age = currentTime - timestamp;
    return age >= 0 && age <= maxAge;
  }

  /**
   * Generate session ID
   * @returns {String} - Unique session ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Get library version
   * @returns {String} - Version string
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get algorithm information
   * @returns {String} - Algorithm description
   */
  getAlgorithmInfo() {
    return this.algorithmName;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Create payload dengan dynamic elements
   * @private
   */
  _createPayload(data) {
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    const sessionId = this.generateSessionId();
    
    // Base payload
    let payload = {
      timestamp,
      nonce,
      sessionId,
      version: this.version
    };

    // Add data
    if (typeof data === 'string') {
      payload.data = data;
      payload.checksum = this.generateChecksum(data);
    } else if (typeof data === 'object') {
      payload = { ...payload, ...data };
      // Generate checksum dari primary identifier
      const primaryKey = data.email || data.userId || data.id || JSON.stringify(data);
      payload.checksum = this.generateChecksum(primaryKey);
    } else {
      payload.data = String(data);
      payload.checksum = this.generateChecksum(String(data));
    }

    return payload;
  }

  /**
   * XOR Encryption
   * @private
   */
  _xorEncrypt(input) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const inputChar = input.charCodeAt(i);
      const keyChar = this.secretKey.charCodeAt(i % this.secretKey.length);
      result += String.fromCharCode(inputChar ^ keyChar);
    }
    return result;
  }

  /**
   * XOR Decryption (same as encryption karena XOR)
   * @private
   */
  _xorDecrypt(input) {
    return this._xorEncrypt(input); // XOR is symmetric
  }

  /**
   * Caesar Cipher Encryption
   * @private
   */
  _caesarEncrypt(input) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i) + this.caesarShift;
      if (charCode > 255) charCode -= 256;
      result += String.fromCharCode(charCode);
    }
    return result;
  }

  /**
   * Caesar Cipher Decryption
   * @private
   */
  _caesarDecrypt(input) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i) - this.caesarShift;
      if (charCode < 0) charCode += 256;
      result += String.fromCharCode(charCode);
    }
    return result;
  }

  /**
   * Base64 Encode
   * @private
   */
  _base64Encode(input) {
    // Convert string to Uint8Array untuk proper encoding
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Convert to base64
    let binary = '';
    data.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    
    return btoa(binary);
  }

  /**
   * Base64 Decode
   * @private
   */
  _base64Decode(input) {
    try {
      const binary = atob(input);
      
      // Convert back to original encoding
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
      
    } catch (error) {
      throw new Error('Invalid Base64 data');
    }
  }

  /**
   * Validate decrypted payload
   * @private
   */
  _validatePayload(payload) {
    // Check required fields
    if (!payload.timestamp || !payload.nonce || !payload.checksum) {
      throw new Error('Invalid payload structure');
    }

    // Check timestamp expiry
    if (!this.validateTimestamp(payload.timestamp)) {
      throw new Error('Payload expired');
    }

    // Validate checksum
    let primaryKey;
    if (payload.email) primaryKey = payload.email;
    else if (payload.userId) primaryKey = payload.userId;
    else if (payload.data) primaryKey = payload.data;
    else primaryKey = JSON.stringify(payload);

    const expectedChecksum = this.generateChecksum(primaryKey);
    if (payload.checksum !== expectedChecksum) {
      throw new Error('Checksum validation failed');
    }

    // Check version compatibility
    if (payload.version && payload.version !== this.version) {
      console.warn(`Version mismatch: payload=${payload.version}, library=${this.version}`);
    }
  }
}

export default ShintyaEncryption;