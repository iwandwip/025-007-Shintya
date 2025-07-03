/**
 * Scanner Mode Service Testing
 * Comprehensive testing untuk scanner mode management
 */

import { scannerModeService } from '../services/scannerModeService.js';

class ScannerModeTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Run all scanner mode tests
   */
  async runAllTests() {
    console.log('🔄 Starting Scanner Mode Tests...\n');
    
    await this.testModeSwitch();
    await this.testSessionManagement();
    await this.testAutoReset();
    await this.testModeValidation();
    
    this.printResults();
  }

  /**
   * Test mode switching
   */
  async testModeSwitch() {
    await this.runAsyncTest('Mode Switch', async () => {
      // Test switching to user_qr mode
      const sessionId = await scannerModeService.setScannerMode('user_qr', 'test_user_123');
      
      if (!sessionId) {
        throw new Error('Session ID not returned');
      }

      const currentMode = await scannerModeService.getCurrentMode();
      
      if (currentMode.mode !== 'user_qr') {
        throw new Error('Mode not switched correctly');
      }

      if (!currentMode.isActive) {
        throw new Error('Mode should be active');
      }

      // Reset to resi mode
      await scannerModeService.setScannerMode('resi', 'test_user_123');
      
      const resetMode = await scannerModeService.getCurrentMode();
      if (resetMode.mode !== 'resi' || resetMode.isActive) {
        throw new Error('Mode reset failed');
      }

      return {
        sessionId,
        modeSwitch: 'success',
        resetWorking: true
      };
    });
  }

  /**
   * Test session management
   */
  async testSessionManagement() {
    await this.runAsyncTest('Session Management', async () => {
      // Create session with custom duration
      const sessionId = await scannerModeService.setScannerMode('user_qr', 'test_user_456', 10000); // 10 seconds
      
      const modeData = await scannerModeService.getCurrentMode();
      
      if (modeData.sessionId !== sessionId) {
        throw new Error('Session ID mismatch');
      }

      if (!modeData.expiresAt || modeData.expiresAt <= Date.now()) {
        throw new Error('Invalid expiry time');
      }

      // Test session extension
      const originalExpiry = modeData.expiresAt;
      await scannerModeService.extendSession(5000); // Extend 5 seconds
      
      const extendedMode = await scannerModeService.getCurrentMode();
      if (extendedMode.expiresAt <= originalExpiry) {
        throw new Error('Session extension failed');
      }

      // Clean up
      await scannerModeService.endCurrentSession();

      return {
        sessionCreated: true,
        expirySet: true,
        extensionWorked: true,
        cleanupWorked: true
      };
    });
  }

  /**
   * Test auto-reset functionality
   */
  async testAutoReset() {
    await this.runAsyncTest('Auto Reset', async () => {
      // Set mode with very short duration for testing
      await scannerModeService.setScannerMode('user_qr', 'test_user_789', 1000); // 1 second
      
      let initialMode = await scannerModeService.getCurrentMode();
      if (initialMode.mode !== 'user_qr') {
        throw new Error('Initial mode setting failed');
      }

      // Wait for auto-reset (with buffer time)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let resetMode = await scannerModeService.getCurrentMode();
      if (resetMode.mode !== 'resi') {
        throw new Error('Auto-reset did not occur');
      }

      return {
        initialModeSet: true,
        autoResetWorked: true,
        finalMode: resetMode.mode
      };
    });
  }

  /**
   * Test mode validation
   */
  async testModeValidation() {
    await this.runAsyncTest('Mode Validation', async () => {
      // Test valid modes
      const validModes = ['resi', 'user_qr', 'rfid'];
      const validResults = [];

      for (const mode of validModes) {
        try {
          await scannerModeService.setScannerMode(mode, 'test_user');
          validResults.push({ mode, success: true });
        } catch (error) {
          validResults.push({ mode, success: false, error: error.message });
        }
      }

      // Test display text
      const displayTexts = {
        'resi': scannerModeService.getModeDisplayText('resi'),
        'user_qr': scannerModeService.getModeDisplayText('user_qr'),
        'rfid': scannerModeService.getModeDisplayText('rfid')
      };

      // Test colors
      const colors = {
        'resi': scannerModeService.getModeColor('resi'),
        'user_qr': scannerModeService.getModeColor('user_qr'),
        'rfid': scannerModeService.getModeColor('rfid')
      };

      // Reset to default
      await scannerModeService.setScannerMode('resi');

      return {
        validModes: validResults,
        displayTexts,
        colors,
        allValidModesWork: validResults.every(r => r.success)
      };
    });
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
   * Print test results
   */
  printResults() {
    console.log('📊 Scanner Mode Test Results');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log('');

    if (this.passedTests === this.totalTests) {
      console.log('🎉 All scanner mode tests passed!');
    } else {
      console.log('⚠️ Some scanner mode tests failed.');
    }
  }
}

export default ScannerModeTest;

// Auto-run in appropriate environments
if (typeof window !== 'undefined') {
  window.runScannerModeTests = async () => {
    const tester = new ScannerModeTest();
    await tester.runAllTests();
  };
}