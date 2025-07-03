/**
 * Scanner Mode Service
 * Manages ESP32 scanner mode switching via Firebase RTDB
 * Supports: 'resi', 'user_qr', 'rfid' modes
 */

import { ref, set, onValue, off, get } from 'firebase/database';
import { realtimeDb } from './firebase';
import { activityService } from './activityService';

class ScannerModeService {
  constructor() {
    this.currentMode = 'resi'; // Default mode
    this.listener = null;
    this.activeSession = null;
    this.callbacks = new Set();
  }

  /**
   * Set scanner mode di Firebase RTDB
   * @param {String} mode - 'resi', 'user_qr', 'rfid'
   * @param {String} userId - User yang initiate mode change
   * @param {Number} duration - Duration dalam ms (default 5 minutes)
   * @returns {String} - Session ID
   */
  async setScannerMode(mode, userId = null, duration = 5 * 60 * 1000) {
    try {
      const sessionId = this.generateSessionId();
      const currentTime = Date.now();
      
      const modeData = {
        mode: mode,
        isActive: mode !== 'resi',
        initiatedBy: userId,
        startTime: currentTime,
        expiresAt: currentTime + duration,
        sessionId: sessionId,
        lastUpdated: currentTime
      };

      console.log('Setting scanner mode:', modeData);

      // Update Firebase RTDB
      const scannerRef = ref(realtimeDb, 'monitoring/systemStatus/scannerMode');
      await set(scannerRef, modeData);

      // Store active session
      this.activeSession = modeData;
      this.currentMode = mode;

      // Log activity
      await this.logScannerModeChange(mode, userId, sessionId);

      // Auto-reset timer
      if (mode !== 'resi') {
        setTimeout(() => {
          this.autoResetMode(sessionId);
        }, duration);
      }

      return sessionId;

    } catch (error) {
      console.error('Failed to set scanner mode:', error);
      throw new Error('Failed to set scanner mode: ' + error.message);
    }
  }

  /**
   * Get current scanner mode
   * @returns {Object} - Current mode data
   */
  async getCurrentMode() {
    try {
      const scannerRef = ref(realtimeDb, 'monitoring/systemStatus/scannerMode');
      const snapshot = await get(scannerRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Check if expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
          await this.setScannerMode('resi', null, 0);
          return { mode: 'resi', isActive: false };
        }
        
        return data;
      } else {
        // Initialize default mode
        await this.setScannerMode('resi', null, 0);
        return { mode: 'resi', isActive: false };
      }
      
    } catch (error) {
      console.error('Failed to get current mode:', error);
      return { mode: 'resi', isActive: false };
    }
  }

  /**
   * Start real-time monitoring scanner mode changes
   * @param {Function} callback - Callback function untuk mode changes
   * @returns {Function} - Unsubscribe function
   */
  startModeMonitoring(callback) {
    const scannerRef = ref(realtimeDb, 'monitoring/systemStatus/scannerMode');
    
    this.listener = onValue(scannerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Check expiry
        if (data.expiresAt && Date.now() > data.expiresAt) {
          this.setScannerMode('resi', null, 0);
          return;
        }
        
        this.currentMode = data.mode;
        this.activeSession = data;
        
        console.log('Scanner mode updated:', data);
        
        // Notify all callbacks
        this.callbacks.forEach(cb => {
          try {
            cb(data);
          } catch (error) {
            console.error('Mode callback error:', error);
          }
        });
        
        // Call main callback
        if (callback) {
          callback(data);
        }
      }
    });

    return () => this.stopModeMonitoring();
  }

  /**
   * Stop monitoring scanner mode
   */
  stopModeMonitoring() {
    if (this.listener) {
      const scannerRef = ref(realtimeDb, 'monitoring/systemStatus/scannerMode');
      off(scannerRef, 'value', this.listener);
      this.listener = null;
    }
  }

  /**
   * Add callback untuk mode changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Remove callback function
   */
  addModeCallback(callback) {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Check if specific mode is active
   * @param {String} mode - Mode to check
   * @returns {Boolean}
   */
  isModeActive(mode) {
    return this.currentMode === mode && this.activeSession?.isActive;
  }

  /**
   * Get mode display text
   * @param {String} mode - Mode string
   * @returns {String} - Indonesian display text
   */
  getModeDisplayText(mode) {
    const modeTexts = {
      'resi': 'Scan Resi Paket',
      'user_qr': 'QR Code Pengguna',
      'rfid': 'Kartu RFID'
    };
    
    return modeTexts[mode] || 'Mode Tidak Dikenal';
  }

  /**
   * Get mode color
   * @param {String} mode - Mode string
   * @returns {String} - Color code
   */
  getModeColor(mode) {
    const modeColors = {
      'resi': '#6B7280',      // Gray-500
      'user_qr': '#10B981',   // Emerald-500
      'rfid': '#3B82F6'       // Blue-500
    };
    
    return modeColors[mode] || '#6B7280';
  }

  /**
   * Extend current session
   * @param {Number} additionalTime - Additional time in ms
   */
  async extendSession(additionalTime = 5 * 60 * 1000) {
    if (!this.activeSession) {
      throw new Error('No active session to extend');
    }

    const newExpiryTime = this.activeSession.expiresAt + additionalTime;
    
    const updatedData = {
      ...this.activeSession,
      expiresAt: newExpiryTime,
      lastUpdated: Date.now()
    };

    const scannerRef = ref(realtimeDb, 'monitoring/systemStatus/scannerMode');
    await set(scannerRef, updatedData);

    console.log('Session extended:', { sessionId: this.activeSession.sessionId, newExpiry: newExpiryTime });
  }

  /**
   * Force end current session
   */
  async endCurrentSession() {
    if (this.activeSession) {
      await this.setScannerMode('resi', this.activeSession.initiatedBy, 0);
      this.activeSession = null;
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Generate unique session ID
   * @private
   */
  generateSessionId() {
    return 'scan_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Auto-reset mode after timeout
   * @private
   */
  async autoResetMode(sessionId) {
    try {
      // Check if session is still active
      const currentData = await this.getCurrentMode();
      
      if (currentData.sessionId === sessionId && currentData.isActive) {
        console.log('Auto-resetting scanner mode for session:', sessionId);
        await this.setScannerMode('resi', null, 0);
        
        // Log auto-reset activity
        await activityService.logActivity({
          userId: currentData.initiatedBy || 'system',
          type: 'scanner_mode_auto_reset',
          message: `Scanner mode auto-reset ke 'resi' setelah timeout`,
          metadata: {
            previousMode: currentData.mode,
            sessionId: sessionId,
            autoReset: true
          }
        });
      }
    } catch (error) {
      console.error('Auto-reset failed:', error);
    }
  }

  /**
   * Log scanner mode change activity
   * @private
   */
  async logScannerModeChange(mode, userId, sessionId) {
    try {
      await activityService.logActivity({
        userId: userId || 'system',
        type: 'scanner_mode_change',
        message: `Scanner mode diubah ke '${this.getModeDisplayText(mode)}'`,
        metadata: {
          mode: mode,
          sessionId: sessionId,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to log scanner mode change:', error);
    }
  }
}

// Export singleton instance
export const scannerModeService = new ScannerModeService();
export default scannerModeService;