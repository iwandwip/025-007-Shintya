/**
 * UserQRModal Component
 * Dynamic encrypted QR code modal untuk user profile
 * Dengan scanner mode management dan auto-refresh
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X, QrCode, Power, RefreshCw, Clock, ToggleRight, ToggleLeft } from 'lucide-react-native';
import ShintyaEncryption from '../../utils/ShintyaEncryption';
import { scannerModeService } from '../../services/scannerModeService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

const UserQRModal = ({ visible, onClose }) => {
  const { userProfile } = useAuth();
  const { showToast } = useNotification();
  
  // State management
  const [qrCode, setQrCode] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [scannerMode, setScannerMode] = useState('resi');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  
  // Services
  const encryption = new ShintyaEncryption();
  
  // Timer untuk countdown
  useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            endSession();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining]);

  // Monitor scanner mode changes
  useEffect(() => {
    let unsubscribe;
    
    if (visible) {
      unsubscribe = scannerModeService.startModeMonitoring((modeData) => {
        setScannerMode(modeData.mode);
        setSessionActive(modeData.isActive && modeData.mode === 'user_qr');
        
        if (modeData.expiresAt) {
          const remaining = modeData.expiresAt - Date.now();
          setTimeRemaining(Math.max(0, remaining));
        }
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible]);

  // Auto-refresh QR code
  useEffect(() => {
    let interval;
    if (autoRefreshEnabled && sessionActive) {
      interval = setInterval(() => {
        generateQRCode();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled, sessionActive]);

  /**
   * Generate new QR code
   */
  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      if (!userProfile?.email) {
        throw new Error('User profile tidak lengkap');
      }

      // Data untuk encrypt
      const userData = {
        email: userProfile.email,
        userId: userProfile.id,
        userName: userProfile.nama,
        type: 'user_profile'
      };

      console.log('Generating QR for user:', userData);

      // Encrypt data
      const encryptedData = encryption.encrypt(userData);
      
      setQrCode(encryptedData);
      setRefreshCount(count => count + 1);
      
      console.log('QR Generated successfully, count:', refreshCount + 1);
      
    } catch (error) {
      console.error('QR generation error:', error);
      showToast('Gagal generate QR Code: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Start QR session
   */
  const startQRSession = async () => {
    try {
      if (!userProfile?.id) {
        throw new Error('User tidak valid');
      }

      console.log('Starting QR session for user:', userProfile.id);

      // Set scanner mode ke user_qr
      const sessionId = await scannerModeService.setScannerMode('user_qr', userProfile.id);
      
      // Generate QR code
      await generateQRCode();
      
      setSessionActive(true);
      setTimeRemaining(5 * 60 * 1000); // 5 minutes
      
      showToast('QR Code diaktifkan. Scanner siap!', 'success');
      
      console.log('QR session started:', sessionId);
      
    } catch (error) {
      console.error('Failed to start QR session:', error);
      showToast('Gagal mengaktifkan QR Code: ' + error.message, 'error');
    }
  };

  /**
   * End QR session
   */
  const endSession = async () => {
    try {
      await scannerModeService.setScannerMode('resi', userProfile?.id);
      
      setSessionActive(false);
      setQrCode('');
      setTimeRemaining(0);
      setRefreshCount(0);
      
      showToast('QR Code dinonaktifkan', 'info');
      
    } catch (error) {
      console.error('Failed to end session:', error);
      showToast('Gagal menonaktifkan QR Code', 'error');
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (sessionActive) {
      Alert.alert(
        'Tutup QR Code?',
        'QR Code sedang aktif. Tutup dan nonaktifkan?',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Tutup & Nonaktifkan', 
            style: 'destructive',
            onPress: async () => {
              await endSession();
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  /**
   * Extend session
   */
  const extendSession = async () => {
    try {
      await scannerModeService.extendSession(5 * 60 * 1000); // Extend 5 minutes
      showToast('Sesi diperpanjang 5 menit', 'success');
    } catch (error) {
      showToast('Gagal memperpanjang sesi', 'error');
    }
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>QR Code Saya</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
            <Text style={styles.userName}>{userProfile?.nama}</Text>
          </View>

          {/* Scanner Status */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: scannerModeService.getModeColor(scannerMode) }
            ]} />
            <Text style={styles.statusText}>
              Scanner: {scannerModeService.getModeDisplayText(scannerMode)}
            </Text>
          </View>

          {/* Main Content */}
          {!sessionActive ? (
            // Inactive State
            <View style={styles.inactiveContainer}>
              <QrCode size={64} color={Colors.gray400} />
              <Text style={styles.inactiveTitle}>QR Code Tidak Aktif</Text>
              <Text style={styles.inactiveSubtitle}>
                Tekan tombol untuk mengaktifkan QR Code Anda
              </Text>
              
              <TouchableOpacity 
                style={styles.activateButton}
                onPress={startQRSession}
              >
                <Power size={20} color="white" />
                <Text style={styles.activateButtonText}>Aktifkan QR Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Active State
            <View style={styles.activeContainer}>
              {/* QR Code Display */}
              <View style={styles.qrContainer}>
                {isGenerating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Generating QR...</Text>
                  </View>
                ) : (
                  qrCode && (
                    <QRCode
                      value={qrCode}
                      size={screenWidth * 0.6}
                      backgroundColor="white"
                      color="black"
                      logo={require('../../assets/icon.png')}
                      logoSize={30}
                      logoBackgroundColor="white"
                    />
                  )
                )}
              </View>

              {/* QR Info */}
              <View style={styles.qrInfo}>
                <Text style={styles.qrCount}>QR Code #{refreshCount}</Text>
                <Text style={styles.qrTime}>
                  Waktu tersisa: {formatTimeRemaining(timeRemaining)}
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={generateQRCode}
                  disabled={isGenerating}
                >
                  <RefreshCw size={16} color={Colors.primary} />
                  <Text style={styles.controlButtonText}>Generate Baru</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={extendSession}
                >
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.controlButtonText}>Perpanjang</Text>
                </TouchableOpacity>
              </View>

              {/* Auto Refresh Toggle */}
              <TouchableOpacity 
                style={styles.toggleContainer}
                onPress={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              >
                {autoRefreshEnabled ? (
                  <ToggleRight 
                    size={24} 
                    color={Colors.primary} 
                  />
                ) : (
                  <ToggleLeft 
                    size={24} 
                    color={Colors.gray400} 
                  />
                )}
                <Text style={styles.toggleText}>Auto-refresh (30s)</Text>
              </TouchableOpacity>

              {/* End Session Button */}
              <TouchableOpacity 
                style={styles.endButton}
                onPress={endSession}
              >
                <Power size={16} color="white" />
                <Text style={styles.endButtonText}>Nonaktifkan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 QR Code berubah setiap kali di-generate untuk keamanan
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray800,
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  userName: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: '500',
  },
  inactiveContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  inactiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray700,
    marginTop: 16,
  },
  inactiveSubtitle: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeContainer: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  loadingContainer: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.gray600,
  },
  qrInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray700,
  },
  qrTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'white',
  },
  controlButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.gray700,
    marginLeft: 8,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  endButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray500,
    textAlign: 'center',
  },
});

export default UserQRModal;