/**
 * SHINTYA ENCRYPTION MINI - Ultra compact version
 * 
 * WARNING: This is for demonstration only!
 * - No timestamp protection (vulnerable to replay attacks)
 * - No nonce (QR codes will be identical for same email)
 * - No checksum (no data integrity checking)
 * - Minimal security for maximum compactness
 * 
 * Use only for non-critical applications!
 */

class ShintyaEncryptionMini {
  constructor(secretKey = "SHINTYA_SECRET", caesarShift = 3) {
    this.secretKey = secretKey;
    this.caesarShift = caesarShift;
  }

  /**
   * Ultra compact encryption - just email with minimal security
   */
  encrypt(email) {
    try {
      // Step 1: Add minimal randomness (just 2 random chars)
      const randomSuffix = Math.random().toString(36).substring(2, 4);
      const dataWithRandom = email + '|' + randomSuffix;
      
      // Step 2: Simple XOR
      let xorResult = '';
      for (let i = 0; i < dataWithRandom.length; i++) {
        const char = dataWithRandom.charCodeAt(i);
        const keyChar = this.secretKey.charCodeAt(i % this.secretKey.length);
        xorResult += String.fromCharCode(char ^ keyChar);
      }
      
      // Step 3: Mini Caesar cipher
      let caesarResult = '';
      for (let i = 0; i < xorResult.length; i++) {
        let charCode = xorResult.charCodeAt(i);
        charCode = (charCode + this.caesarShift) % 256;
        caesarResult += String.fromCharCode(charCode);
      }
      
      // Step 4: Base64 encode
      const base64Result = Buffer.from(caesarResult, 'binary').toString('base64');
      
      return base64Result;
      
    } catch (error) {
      throw new Error(`Mini encryption failed: ${error.message}`);
    }
  }

  /**
   * Ultra compact decryption
   */
  decrypt(encryptedData) {
    try {
      // Step 1: Base64 decode
      const base64Decoded = Buffer.from(encryptedData, 'base64').toString('binary');
      
      // Step 2: Reverse Caesar
      let caesarDecrypted = '';
      for (let i = 0; i < base64Decoded.length; i++) {
        let charCode = base64Decoded.charCodeAt(i);
        charCode = (charCode - this.caesarShift + 256) % 256;
        caesarDecrypted += String.fromCharCode(charCode);
      }
      
      // Step 3: Reverse XOR
      let xorDecrypted = '';
      for (let i = 0; i < caesarDecrypted.length; i++) {
        const char = caesarDecrypted.charCodeAt(i);
        const keyChar = this.secretKey.charCodeAt(i % this.secretKey.length);
        xorDecrypted += String.fromCharCode(char ^ keyChar);
      }
      
      // Step 4: Extract email (remove random suffix)
      const email = xorDecrypted.split('|')[0];
      
      return {
        data: { email },
        metadata: {
          encryptionType: 'mini',
          warning: 'Minimal security - for demo only!'
        }
      };
      
    } catch (error) {
      throw new Error(`Mini decryption failed: ${error.message}`);
    }
  }
}

module.exports = ShintyaEncryptionMini;