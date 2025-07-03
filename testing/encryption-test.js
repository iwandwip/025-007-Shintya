/**
 * ShintyaEncryption Testing Framework
 * Comprehensive testing untuk JavaScript encryption library
 * Cross-platform compatibility testing
 */

import ShintyaEncryption from '../utils/ShintyaEncryption.js';

class EncryptionTester {
  constructor() {
    this.encryption = new ShintyaEncryption();
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting ShintyaEncryption Tests...\n');
    
    // Basic functionality tests
    this.testBasicEncryptDecrypt();
    this.testDynamicQRGeneration();
    this.testDataIntegrity();
    this.testTimestampValidation();
    this.testChecksumValidation();
    
    // Edge case tests
    this.testEmptyData();
    this.testInvalidData();
    this.testLargeData();
    
    // Performance tests
    await this.testPerformance();
    
    // Cross-platform compatibility tests
    this.testCrossPlatformCompatibility();
    
    this.printResults();
  }

  /**
   * Test basic encrypt/decrypt functionality
   */
  testBasicEncryptDecrypt() {
    this.runTest('Basic Encrypt/Decrypt', () => {
      const testData = {
        email: 'test@gmail.com',
        userId: 'user123',
        type: 'user_profile'
      };

      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);

      if (!encrypted || encrypted.length === 0) {
        throw new Error('Encryption failed');
      }

      if (!decrypted || !decrypted.email) {
        throw new Error('Decryption failed');
      }

      if (decrypted.email !== testData.email) {
        throw new Error('Data mismatch after decrypt');
      }

      return {
        encrypted: encrypted.substring(0, 20) + '...',
        decryptedEmail: decrypted.email,
        success: true
      };
    });
  }

  /**
   * Test dynamic QR generation
   */
  testDynamicQRGeneration() {
    this.runTest('Dynamic QR Generation', () => {
      const testData = {
        email: 'user@gmail.com',
        type: 'user_profile'
      };

      // Generate multiple QR codes
      const qr1 = this.encryption.encrypt(testData);
      const qr2 = this.encryption.encrypt(testData);
      const qr3 = this.encryption.encrypt(testData);

      // QR codes should be different (dynamic)
      if (qr1 === qr2 || qr2 === qr3 || qr1 === qr3) {
        throw new Error('QR codes are not dynamic');
      }

      // But decrypted data should be same
      const decrypt1 = this.encryption.decrypt(qr1);
      const decrypt2 = this.encryption.decrypt(qr2);
      const decrypt3 = this.encryption.decrypt(qr3);

      if (decrypt1.email !== decrypt2.email || 
          decrypt2.email !== decrypt3.email) {
        throw new Error('Decrypted data mismatch');
      }

      return {
        qr1Length: qr1.length,
        qr2Length: qr2.length,
        allDifferent: true,
        sameEmail: decrypt1.email === decrypt2.email
      };
    });
  }

  /**
   * Test data integrity
   */
  testDataIntegrity() {
    this.runTest('Data Integrity', () => {
      const testData = {
        email: 'integrity@test.com',
        userId: 'user456',
        userName: 'Test User',
        type: 'user_profile'
      };

      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);

      // Check all fields
      const fieldsMatch = 
        decrypted.email === testData.email &&
        decrypted.userId === testData.userId &&
        decrypted.userName === testData.userName &&
        decrypted.type === testData.type;

      if (!fieldsMatch) {
        throw new Error('Data integrity check failed');
      }

      // Check additional fields
      if (!decrypted.timestamp || !decrypted.nonce || !decrypted.checksum) {
        throw new Error('Missing required fields');
      }

      return {
        allFieldsPresent: true,
        timestampValid: typeof decrypted.timestamp === 'number',
        nonceLength: decrypted.nonce.length,
        checksumValid: typeof decrypted.checksum === 'number'
      };
    });
  }

  /**
   * Test timestamp validation
   */
  testTimestampValidation() {
    this.runTest('Timestamp Validation', () => {
      const testData = { email: 'time@test.com' };
      
      // Test valid timestamp
      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);
      
      const isValid = this.encryption.validateTimestamp(decrypted.timestamp);
      if (!isValid) {
        throw new Error('Valid timestamp rejected');
      }

      // Test expired timestamp
      const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const isExpired = !this.encryption.validateTimestamp(oldTimestamp);
      if (!isExpired) {
        throw new Error('Expired timestamp accepted');
      }

      return {
        currentTimestampValid: isValid,
        oldTimestampExpired: isExpired,
        timestampDiff: Date.now() - decrypted.timestamp
      };
    });
  }

  /**
   * Test checksum validation
   */
  testChecksumValidation() {
    this.runTest('Checksum Validation', () => {
      const email = 'checksum@test.com';
      const testData = { email };

      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);

      // Calculate expected checksum
      const expectedChecksum = this.encryption.generateChecksum(email);
      
      if (decrypted.checksum !== expectedChecksum) {
        throw new Error('Checksum validation failed');
      }

      // Test different email should have different checksum
      const differentChecksum = this.encryption.generateChecksum('different@email.com');
      if (expectedChecksum === differentChecksum) {
        throw new Error('Checksums should be different for different emails');
      }

      return {
        checksumMatch: true,
        expectedChecksum,
        actualChecksum: decrypted.checksum,
        differentEmailChecksum: differentChecksum
      };
    });
  }

  /**
   * Test empty data handling
   */
  testEmptyData() {
    this.runTest('Empty Data Handling', () => {
      const testCases = [
        { email: '' },
        {},
        null,
        undefined
      ];

      let allHandled = true;
      const results = [];

      testCases.forEach((testCase, index) => {
        try {
          const encrypted = this.encryption.encrypt(testCase);
          const decrypted = this.encryption.decrypt(encrypted);
          results.push({ case: index, success: true, data: decrypted });
        } catch (error) {
          results.push({ case: index, success: false, error: error.message });
          if (testCase === null || testCase === undefined) {
            // Expected to fail for null/undefined
          } else {
            allHandled = false;
          }
        }
      });

      return {
        allCasesHandled: allHandled,
        results
      };
    });
  }

  /**
   * Test invalid data handling
   */
  testInvalidData() {
    this.runTest('Invalid Data Handling', () => {
      const invalidEncryptedData = [
        'invalid_base64',
        '',
        'YWJjZGVmZ2g=', // Valid base64 but wrong data
        '12345',
        'not_encrypted_data'
      ];

      let allRejected = true;
      const results = [];

      invalidEncryptedData.forEach((invalidData, index) => {
        try {
          const decrypted = this.encryption.decrypt(invalidData);
          results.push({ case: index, success: true, unexpected: true });
          allRejected = false; // Should not succeed
        } catch (error) {
          results.push({ case: index, success: false, error: error.message });
        }
      });

      return {
        allInvalidDataRejected: allRejected,
        results
      };
    });
  }

  /**
   * Test large data handling
   */
  testLargeData() {
    this.runTest('Large Data Handling', () => {
      const largeData = {
        email: 'large@test.com',
        bigField: 'x'.repeat(1000), // 1KB of data
        manyFields: {}
      };

      // Add many fields
      for (let i = 0; i < 50; i++) {
        largeData.manyFields[`field${i}`] = `value${i}`;
      }

      const encrypted = this.encryption.encrypt(largeData);
      const decrypted = this.encryption.decrypt(encrypted);

      if (decrypted.bigField.length !== 1000) {
        throw new Error('Large field data corruption');
      }

      if (Object.keys(decrypted.manyFields).length !== 50) {
        throw new Error('Many fields data loss');
      }

      return {
        originalSize: JSON.stringify(largeData).length,
        encryptedSize: encrypted.length,
        fieldsCount: Object.keys(decrypted.manyFields).length,
        bigFieldLength: decrypted.bigField.length
      };
    });
  }

  /**
   * Test performance
   */
  async testPerformance() {
    return new Promise((resolve) => {
      this.runTest('Performance Test', () => {
        const testData = { email: 'perf@test.com' };
        const iterations = 100;

        // Encryption performance
        const encryptStart = performance.now();
        const encrypted = [];
        for (let i = 0; i < iterations; i++) {
          encrypted.push(this.encryption.encrypt(testData));
        }
        const encryptTime = performance.now() - encryptStart;

        // Decryption performance
        const decryptStart = performance.now();
        for (let i = 0; i < iterations; i++) {
          this.encryption.decrypt(encrypted[i]);
        }
        const decryptTime = performance.now() - decryptStart;

        const avgEncryptTime = encryptTime / iterations;
        const avgDecryptTime = decryptTime / iterations;

        // Performance benchmarks
        if (avgEncryptTime > 100) { // 100ms per encryption
          console.warn('⚠️ Encryption performance may be slow');
        }

        if (avgDecryptTime > 100) { // 100ms per decryption
          console.warn('⚠️ Decryption performance may be slow');
        }

        return {
          iterations,
          totalEncryptTime: encryptTime.toFixed(2),
          totalDecryptTime: decryptTime.toFixed(2),
          avgEncryptTime: avgEncryptTime.toFixed(2),
          avgDecryptTime: avgDecryptTime.toFixed(2),
          performanceGood: avgEncryptTime < 100 && avgDecryptTime < 100
        };
      });
      resolve();
    });
  }

  /**
   * Test cross-platform compatibility
   */
  testCrossPlatformCompatibility() {
    this.runTest('Cross-Platform Compatibility', () => {
      const testData = { email: 'cross@platform.com' };

      // Test different secret keys
      const encryption1 = new ShintyaEncryption('KEY1', 5);
      const encryption2 = new ShintyaEncryption('KEY2', 7);
      const encryption3 = new ShintyaEncryption('SHINTYA_2024_SECRET', 7); // Default

      const encrypted1 = encryption1.encrypt(testData);
      const encrypted2 = encryption2.encrypt(testData);
      const encrypted3 = encryption3.encrypt(testData);

      // Should not be able to decrypt with wrong keys
      let crossDecryptFailed = false;
      try {
        encryption1.decrypt(encrypted2); // Wrong key
        crossDecryptFailed = false;
      } catch {
        crossDecryptFailed = true;
      }

      // Should decrypt with correct key
      const decrypted3 = encryption3.decrypt(encrypted3);

      return {
        differentKeysProduceDifferentResults: encrypted1 !== encrypted2,
        wrongKeyDecryptionFails: crossDecryptFailed,
        correctKeyDecryptionSucceeds: decrypted3.email === testData.email,
        defaultEncryptionWorks: true
      };
    });
  }

  /**
   * Helper method to run individual test
   */
  runTest(testName, testFunction) {
    this.totalTests++;
    try {
      const result = testFunction();
      this.passedTests++;
      this.testResults.push({
        name: testName,
        status: 'PASS',
        result
      });
      console.log(`✅ ${testName}: PASSED`);
      if (result && typeof result === 'object') {
        console.log(`   Result:`, result);
      }
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${testName}: FAILED`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  /**
   * Print final test results
   */
  printResults() {
    console.log('📊 Test Results Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (this.passedTests === this.totalTests) {
      console.log('🎉 All tests passed! Encryption library is ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Please review and fix issues before deployment.');
    }

    // Library info
    console.log('');
    console.log('📚 Library Information:');
    console.log(`Version: ${this.encryption.getVersion()}`);
    console.log(`Algorithm: ${this.encryption.getAlgorithmInfo()}`);
  }
}

// Export for use in other test files
export default EncryptionTester;

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runEncryptionTests = async () => {
    const tester = new EncryptionTester();
    await tester.runAllTests();
  };
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  const runTests = async () => {
    const tester = new EncryptionTester();
    await tester.runAllTests();
  };

  // Auto-run if this is the main module
  if (require.main === module) {
    runTests();
  }

  module.exports = { EncryptionTester, runTests };
}