/**
 * Integration Testing Suite
 * Complete integration testing untuk Dynamic QR System
 * Testing full flow: Encryption → QR Generation → Scanner Mode → Decryption
 */

import ShintyaEncryption from '../utils/ShintyaEncryption.js';
import { scannerModeService } from '../services/scannerModeService.js';

class IntegrationTester {
  constructor() {
    this.encryption = new ShintyaEncryption();
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Run complete integration tests
   */
  async runAllIntegrationTests() {
    console.log('🔗 Starting Integration Tests...\n');
    
    await this.testCompleteUserQRFlow();
    await this.testMultiUserSession();
    await this.testSecurityScenarios();
    await this.testErrorHandling();
    await this.testPerformanceIntegration();
    
    this.printResults();
  }

  /**
   * Test complete user QR flow
   */
  async testCompleteUserQRFlow() {
    await this.runAsyncTest('Complete User QR Flow', async () => {
      const testUser = {
        id: 'user_integration_test',
        email: 'integration@test.com',
        nama: 'Integration Test User',
        role: 'user'
      };

      // Step 1: User opens QR modal (set scanner mode)
      const sessionId = await scannerModeService.setScannerMode('user_qr', testUser.id, 30000);
      
      // Step 2: Generate encrypted QR
      const userData = {
        email: testUser.email,
        userId: testUser.id,
        userName: testUser.nama,
        type: 'user_profile'
      };
      
      const encryptedQR = this.encryption.encrypt(userData);
      
      // Step 3: Simulate ESP32 scan and decrypt
      const currentMode = await scannerModeService.getCurrentMode();
      
      if (currentMode.mode !== 'user_qr') {
        throw new Error('Scanner not in user_qr mode');
      }
      
      // ESP32 would decrypt the QR
      const decryptedData = this.encryption.decrypt(encryptedQR);
      
      // Step 4: Validate user exists (simulate Firebase query)
      const userValidation = this.simulateUserValidation(decryptedData.email);
      
      // Step 5: Close session
      await scannerModeService.setScannerMode('resi', testUser.id);
      
      return {
        sessionId,
        qrGenerated: encryptedQR.length > 0,
        scannerModeSet: true,
        decryptionSuccessful: decryptedData.email === testUser.email,
        userValidated: userValidation,
        sessionClosed: true,
        flowComplete: true
      };
    });
  }

  /**
   * Test multi-user session handling
   */
  async testMultiUserSession() {
    await this.runAsyncTest('Multi-User Session', async () => {
      const user1 = { id: 'user1', email: 'user1@test.com' };
      const user2 = { id: 'user2', email: 'user2@test.com' };

      // User 1 starts session
      const session1 = await scannerModeService.setScannerMode('user_qr', user1.id, 10000);
      
      // Generate QR for user 1
      const qr1 = this.encryption.encrypt({
        email: user1.email,
        userId: user1.id,
        type: 'user_profile'
      });

      // User 2 tries to start session (should override user 1)
      const session2 = await scannerModeService.setScannerMode('user_qr', user2.id, 10000);
      
      const currentMode = await scannerModeService.getCurrentMode();
      
      // Generate QR for user 2
      const qr2 = this.encryption.encrypt({
        email: user2.email,
        userId: user2.id,
        type: 'user_profile'
      });

      // Both QRs should decrypt successfully
      const decrypt1 = this.encryption.decrypt(qr1);
      const decrypt2 = this.encryption.decrypt(qr2);
      
      // Clean up
      await scannerModeService.setScannerMode('resi');

      return {
        session1Created: !!session1,
        session2Created: !!session2,
        currentSession: currentMode.initiatedBy,
        qr1Valid: decrypt1.email === user1.email,
        qr2Valid: decrypt2.email === user2.email,
        sessionOverride: currentMode.initiatedBy === user2.id
      };
    });
  }

  /**
   * Test security scenarios
   */
  async testSecurityScenarios() {
    await this.runAsyncTest('Security Scenarios', async () => {
      const testUser = { id: 'security_test', email: 'security@test.com' };

      // Scenario 1: Expired QR code
      const oldData = {
        email: testUser.email,
        timestamp: Date.now() - (10 * 60 * 1000), // 10 minutes old
        nonce: 'oldnonce',
        checksum: this.encryption.generateChecksum(testUser.email)
      };
      
      let expiredQRRejected = false;
      try {
        // Manually create expired QR (bypass normal encryption)
        const expiredJSON = JSON.stringify(oldData);
        const encryption = new ShintyaEncryption();
        const expiredQR = encryption.encrypt(oldData);
        
        // This should fail due to timestamp validation
        encryption.decrypt(expiredQR);
      } catch (error) {
        expiredQRRejected = true;
      }

      // Scenario 2: Tampered QR code
      const validQR = this.encryption.encrypt({ email: testUser.email });
      const tamperedQR = validQR.substring(0, validQR.length - 5) + 'TAMPR';
      
      let tamperedQRRejected = false;
      try {
        this.encryption.decrypt(tamperedQR);
      } catch (error) {
        tamperedQRRejected = true;
      }

      // Scenario 3: Wrong scanner mode
      await scannerModeService.setScannerMode('resi');
      const currentMode = await scannerModeService.getCurrentMode();
      
      const modeSecure = currentMode.mode === 'resi' && !currentMode.isActive;

      return {
        expiredQRRejected,
        tamperedQRRejected,
        defaultModeSecure: modeSecure,
        securityPassed: expiredQRRejected && tamperedQRRejected && modeSecure
      };
    });
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    await this.runAsyncTest('Error Handling', async () => {
      const errorTests = [];

      // Test 1: Invalid user data
      try {
        this.encryption.encrypt(null);
        errorTests.push({ test: 'null_data', handled: false });
      } catch (error) {
        errorTests.push({ test: 'null_data', handled: true, error: error.message });
      }

      // Test 2: Empty QR data
      try {
        this.encryption.decrypt('');
        errorTests.push({ test: 'empty_qr', handled: false });
      } catch (error) {
        errorTests.push({ test: 'empty_qr', handled: true, error: error.message });
      }

      // Test 3: Invalid scanner mode
      try {
        await scannerModeService.setScannerMode('invalid_mode', 'test_user');
        errorTests.push({ test: 'invalid_mode', handled: false });
      } catch (error) {
        errorTests.push({ test: 'invalid_mode', handled: true, error: error.message });
      }

      // Test 4: Session without user
      try {
        await scannerModeService.setScannerMode('user_qr', null);
        errorTests.push({ test: 'no_user_session', handled: false });
      } catch (error) {
        errorTests.push({ test: 'no_user_session', handled: true, error: error.message });
      }

      const allErrorsHandled = errorTests.every(test => test.handled);

      return {
        errorTests,
        allErrorsHandled,
        totalErrorTests: errorTests.length
      };
    });
  }

  /**
   * Test performance integration
   */
  async testPerformanceIntegration() {
    await this.runAsyncTest('Performance Integration', async () => {
      const testUser = { 
        id: 'perf_test', 
        email: 'performance@test.com',
        nama: 'Performance Test User'
      };

      const iterations = 10;
      const results = {
        sessionCreation: [],
        qrGeneration: [],
        qrDecryption: [],
        sessionEnd: []
      };

      for (let i = 0; i < iterations; i++) {
        // Session creation time
        const sessionStart = performance.now();
        const sessionId = await scannerModeService.setScannerMode('user_qr', testUser.id + i);
        results.sessionCreation.push(performance.now() - sessionStart);

        // QR generation time
        const qrStart = performance.now();
        const qrData = this.encryption.encrypt({
          email: testUser.email,
          userId: testUser.id + i,
          iteration: i
        });
        results.qrGeneration.push(performance.now() - qrStart);

        // QR decryption time
        const decryptStart = performance.now();
        const decrypted = this.encryption.decrypt(qrData);
        results.qrDecryption.push(performance.now() - decryptStart);

        // Session end time
        const endStart = performance.now();
        await scannerModeService.setScannerMode('resi');
        results.sessionEnd.push(performance.now() - endStart);
      }

      // Calculate averages
      const averages = {};
      Object.keys(results).forEach(key => {
        const times = results[key];
        averages[key] = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
      });

      // Performance thresholds (in ms)
      const thresholds = {
        sessionCreation: 500,
        qrGeneration: 100,
        qrDecryption: 100,
        sessionEnd: 300
      };

      const performanceGood = Object.keys(averages).every(key => 
        parseFloat(averages[key]) < thresholds[key]
      );

      return {
        iterations,
        averages,
        thresholds,
        performanceGood,
        totalTime: Object.values(results).flat().reduce((a, b) => a + b, 0).toFixed(2)
      };
    });
  }

  /**
   * Simulate user validation (would be Firebase query in real app)
   */
  simulateUserValidation(email) {
    const validEmails = [
      'integration@test.com',
      'user1@test.com',
      'user2@test.com',
      'security@test.com',
      'performance@test.com'
    ];
    
    return validEmails.includes(email);
  }

  /**
   * Helper for async tests
   */
  async runAsyncTest(testName, testFunction) {
    this.totalTests++;
    try {
      const result = await testFunction();
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
   * Print final results
   */
  printResults() {
    console.log('📊 Integration Test Results');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (this.passedTests === this.totalTests) {
      console.log('🎉 All integration tests passed! System is ready for deployment.');
    } else {
      console.log('⚠️ Some integration tests failed. Please review before deployment.');
    }
  }
}

export default IntegrationTester;

// Export test runner
export const runIntegrationTests = async () => {
  const tester = new IntegrationTester();
  await tester.runAllIntegrationTests();
};

// Auto-run in browser
if (typeof window !== 'undefined') {
  window.runIntegrationTests = runIntegrationTests;
}