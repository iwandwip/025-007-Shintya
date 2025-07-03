/**
 * SHINTYA ENCRYPTION LIBRARY - JavaScript Version
 * 
 * Custom encryption library untuk Shintya Package Delivery System
 * yang menyediakan dynamic QR code generation dengan tingkat security tinggi.
 * 
 * Features:
 * - XOR + Caesar Cipher encryption algorithm
 * - Dynamic content generation dengan timestamp dan nonce
 * - Cross-platform compatibility (JavaScript ↔ Arduino C++)
 * - No external dependencies, pure JavaScript implementation
 * - Built-in validation dan checksum untuk data integrity
 * 
 * Security Features:
 * - Always different QR content untuk same user data
 * - Timestamp validation untuk prevent replay attacks
 * - Nonce system untuk guarantee uniqueness
 * - Checksum validation untuk data integrity
 * - Configurable secret keys dan Caesar shift values
 * 
 * Usage:
 * ```javascript
 * import ShintyaEncryption from './ShintyaEncryption';
 * 
 * const encryption = new ShintyaEncryption();
 * const userData = { email: "user@gmail.com", type: "user_profile" };
 * const encrypted = encryption.encrypt(userData);
 * 
 * // Use in QR Code
 * <QRCode value={encrypted} />
 * ```
 * 
 * @author Shintya Package Delivery System
 * @version 1.0.0
 * @compatibility ESP32 Arduino, React Native, Web
 */

class ShintyaEncryption {
  /**
   * Constructor untuk ShintyaEncryption
   * 
   * @param {string} secretKey - Secret key untuk XOR encryption (default: "SHINTYA_2024_SECRET")
   * @param {number} caesarShift - Caesar cipher shift value (default: 7)
   */
  constructor(secretKey = "SHINTYA_2024_SECRET", caesarShift = 7) {
    this.secretKey = secretKey;
    this.caesarShift = caesarShift;
    this.version = "1.0.0";
    this.algorithmInfo = "XOR + Caesar + Base64";
    
    // Validation
    if (typeof secretKey !== 'string' || secretKey.length < 8) {
      throw new Error('Secret key must be at least 8 characters long');
    }
    
    if (typeof caesarShift !== 'number' || caesarShift < 1 || caesarShift > 25) {
      throw new Error('Caesar shift must be between 1 and 25');
    }
  }

  /**
   * Main encryption method
   * 
   * Encrypts data object menjadi string yang aman untuk QR code.
   * Setiap kali dipanggil akan menghasilkan output yang berbeda
   * meskipun input data sama.
   * 
   * @param {Object} data - Data object untuk di-encrypt
   * @returns {string} Encrypted string dalam format Base64
   * 
   * @example
   * const encrypted = encryption.encrypt({
   *   email: "user@gmail.com",
   *   type: "user_profile"
   * });
   */
  encrypt(data) {
    try {
      // Step 1: Create payload dengan dynamic elements (optimized for shorter length)
      const payload = {
        ...data,
        t: Date.now(), // timestamp -> t
        n: this.generateNonce(4), // nonce 4 chars instead of 8  
        s: this.generateSessionId().split('_')[1], // shorter sessionId
        c: this.generateChecksum(JSON.stringify(data))
        // removed version field
      };
      
      // Step 2: Convert to JSON string
      const jsonString = JSON.stringify(payload);
      
      // Step 3: Apply XOR encryption
      const xorEncrypted = this._applyXOR(jsonString);
      
      // Step 4: Apply Caesar cipher
      const caesarEncrypted = this._applyCaesar(xorEncrypted);
      
      // Step 5: Base64 encode untuk QR compatibility
      const base64Encoded = this._base64Encode(caesarEncrypted);
      
      return base64Encoded;
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Main decryption method
   * 
   * Decrypts encrypted string kembali menjadi original data object.
   * Includes validation untuk timestamp dan checksum.
   * 
   * @param {string} encryptedData - Encrypted string dalam format Base64
   * @returns {Object} Decrypted data object
   * 
   * @example
   * const decrypted = encryption.decrypt(encryptedString);
   * console.log(decrypted.email); // "user@gmail.com"
   */
  decrypt(encryptedData) {
    try {
      // Step 1: Base64 decode
      const base64Decoded = this._base64Decode(encryptedData);
      
      // Step 2: Reverse Caesar cipher
      const caesarDecrypted = this._reverseCaesar(base64Decoded);
      
      // Step 3: Reverse XOR encryption
      const xorDecrypted = this._reverseXOR(caesarDecrypted);
      
      // Step 4: Parse JSON
      const payload = JSON.parse(xorDecrypted);
      
      // Step 5: Validate payload
      this._validatePayload(payload);
      
      // Step 6: Extract original data (remove our added fields)
      const { t: timestamp, n: nonce, s: sessionId, c: checksum, ...originalData } = payload;
      
      return {
        data: originalData,
        metadata: {
          timestamp,
          nonce,
          sessionId,
          checksum,
          version: this.version, // add back for compatibility
          decryptedAt: Date.now()
        }
      };
      
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate random nonce string
   * 
   * @param {number} length - Panjang nonce yang diinginkan (default: 8)
   * @returns {string} Random nonce string
   */
  generateNonce(length = 8) {
    const chars = '0123456789abcdef';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Generate session ID
   * 
   * @returns {string} Unique session identifier
   */
  generateSessionId() {
    return `sess_${Date.now()}_${this.generateNonce(6)}`;
  }

  /**
   * Generate checksum untuk data integrity
   * 
   * @param {string} input - Input string untuk di-checksum
   * @returns {number} Checksum value
   */
  generateChecksum(input) {
    let hash = 0;
    
    if (input.length === 0) return hash;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Validate timestamp - check if not too old
   * 
   * @param {number} timestamp - Timestamp untuk divalidasi
   * @param {number} maxAge - Maximum age dalam milliseconds (default: 5 minutes)
   * @returns {boolean} True jika timestamp valid
   */
  validateTimestamp(timestamp, maxAge = 300000) {
    const now = Date.now();
    const age = now - timestamp;
    
    return age >= 0 && age <= maxAge;
  }

  /**
   * Get library version
   * 
   * @returns {string} Library version
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get algorithm information
   * 
   * @returns {string} Algorithm description
   */
  getAlgorithmInfo() {
    return this.algorithmInfo;
  }

  /**
   * Validate if string is valid encrypted data
   * 
   * @param {string} data - Data untuk divalidasi
   * @returns {boolean} True jika valid encrypted data
   */
  isValidEncryptedData(data) {
    try {
      // Check if it's valid Base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        return false;
      }
      
      // Try to decrypt (without throwing error)
      this.decrypt(data);
      return true;
      
    } catch (error) {
      return false;
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Apply XOR encryption
   * 
   * @private
   * @param {string} input - Input string
   * @returns {string} XOR encrypted string
   */
  _applyXOR(input) {
    let result = '';
    const keyLength = this.secretKey.length;
    
    for (let i = 0; i < input.length; i++) {
      const inputChar = input.charCodeAt(i);
      const keyChar = this.secretKey.charCodeAt(i % keyLength);
      const xorResult = inputChar ^ keyChar;
      result += String.fromCharCode(xorResult);
    }
    
    return result;
  }

  /**
   * Reverse XOR encryption
   * 
   * @private
   * @param {string} input - XOR encrypted string
   * @returns {string} Original string
   */
  _reverseXOR(input) {
    // XOR is reversible - same operation
    return this._applyXOR(input);
  }

  /**
   * Apply Caesar cipher
   * 
   * @private
   * @param {string} input - Input string
   * @returns {string} Caesar encrypted string
   */
  _applyCaesar(input) {
    let result = '';
    
    for (let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i);
      charCode = (charCode + this.caesarShift) % 256;
      result += String.fromCharCode(charCode);
    }
    
    return result;
  }

  /**
   * Reverse Caesar cipher
   * 
   * @private
   * @param {string} input - Caesar encrypted string
   * @returns {string} Original string
   */
  _reverseCaesar(input) {
    let result = '';
    
    for (let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i);
      charCode = (charCode - this.caesarShift + 256) % 256;
      result += String.fromCharCode(charCode);
    }
    
    return result;
  }

  /**
   * Base64 encode
   * 
   * @private
   * @param {string} input - Input string
   * @returns {string} Base64 encoded string
   */
  _base64Encode(input) {
    // Use built-in Buffer for reliable Base64 encoding
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'binary').toString('base64');
    }
    
    // Fallback for environments without Buffer
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < input.length) {
      const a = input.charCodeAt(i++);
      const b = i < input.length ? input.charCodeAt(i++) : 0;
      const c = i < input.length ? input.charCodeAt(i++) : 0;
      
      const combined = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((combined >> 18) & 63);
      result += chars.charAt((combined >> 12) & 63);
      result += chars.charAt((combined >> 6) & 63);
      result += chars.charAt(combined & 63);
    }
    
    // Add padding
    const padding = 3 - ((input.length % 3) || 3);
    result = result.slice(0, result.length - padding) + '='.repeat(padding);
    
    return result;
  }

  /**
   * Base64 decode
   * 
   * @private
   * @param {string} input - Base64 encoded string
   * @returns {string} Decoded string
   */
  _base64Decode(input) {
    // Use built-in Buffer for reliable Base64 decoding
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'base64').toString('binary');
    }
    
    // Fallback for environments without Buffer
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    // Remove padding
    input = input.replace(/=/g, '');
    
    while (i < input.length) {
      const encoded1 = chars.indexOf(input.charAt(i++));
      const encoded2 = chars.indexOf(input.charAt(i++));
      const encoded3 = i < input.length ? chars.indexOf(input.charAt(i++)) : -1;
      const encoded4 = i < input.length ? chars.indexOf(input.charAt(i++)) : -1;
      
      const combined = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 >= 0 ? encoded3 : 0) << 6) | (encoded4 >= 0 ? encoded4 : 0);
      
      result += String.fromCharCode((combined >> 16) & 255);
      if (encoded3 >= 0) result += String.fromCharCode((combined >> 8) & 255);
      if (encoded4 >= 0) result += String.fromCharCode(combined & 255);
    }
    
    return result;
  }

  /**
   * Validate decrypted payload
   * 
   * @private
   * @param {Object} payload - Decrypted payload object
   * @throws {Error} Jika payload tidak valid
   */
  _validatePayload(payload) {
    // Check required fields (using short field names)
    const requiredFields = ['t', 'n', 's', 'c']; // timestamp, nonce, sessionId, checksum
    
    for (const field of requiredFields) {
      if (!(field in payload)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate timestamp (not too old)
    if (!this.validateTimestamp(payload.t)) {
      throw new Error('Timestamp is too old or invalid');
    }
    
    // Validate nonce format (should be hex string)
    if (!/^[0-9a-f]+$/.test(payload.n)) {
      throw new Error('Invalid nonce format');
    }
    
    // Validate checksum (reconstruct original data untuk verification)
    const { t: timestamp, n: nonce, s: sessionId, c: checksum, ...originalData } = payload;
    const expectedChecksum = this.generateChecksum(JSON.stringify(originalData));
    
    if (checksum !== expectedChecksum) {
      throw new Error('Checksum validation failed - data may be corrupted');
    }
  }
}

export default ShintyaEncryption;