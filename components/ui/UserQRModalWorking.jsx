/**
 * USER QR MODAL WORKING - Combine all working components
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { getThemeByRole } from "../../constants/Colors";
import { encryptUserProfile } from "../../services/encryptionService";

const { width: screenWidth } = Dimensions.get("window");

function UserQRModalWorking({ visible, onClose, userProfile }) {
  console.log('UserQRModalWorking rendered with:', { visible, userProfile: userProfile?.email });
  
  // Simple state - no complex useEffect
  const [qrCode, setQrCode] = useState('');
  const [qrMetadata, setQrMetadata] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  
  // Safe theme
  const colors = getThemeByRole(userProfile?.role === 'admin');
  
  // Simple QR generation
  const generateQR = async () => {
    if (!userProfile?.email) {
      Alert.alert('Error', 'User profile tidak valid');
      return;
    }
    
    console.log('generateQR: Starting...');
    setIsGenerating(true);
    
    try {
      const result = await encryptUserProfile(userProfile);
      console.log('generateQR: Result:', result.success ? 'SUCCESS' : 'FAILED');
      
      if (result.success) {
        setQrCode(result.qrCode);
        setQrMetadata(result.metadata);
        setGenerationCount(prev => prev + 1);
        console.log('generateQR: QR set successfully');
      } else {
        Alert.alert('Error', result.error || 'Gagal membuat QR Code');
      }
    } catch (error) {
      console.error('generateQR: Error:', error);
      Alert.alert('Error', 'Terjadi kesalahan: ' + error.message);
    }
    
    setIsGenerating(false);
  };
  
  // Auto-generate EVERY TIME modal opens - fresh QR every time
  React.useEffect(() => {
    if (visible && userProfile?.email) {
      console.log('Auto-generating fresh QR on modal open...');
      // Reset state first
      setQrCode('');
      setQrMetadata(null);
      setGenerationCount(0);
      // Generate new QR
      generateQR();
    }
  }, [visible]); // Every time modal opens
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.white }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.gray900 }]}>
                QR Code Saya
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.gray100 }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: colors.gray600 }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
              <Text style={[styles.userInfoText, { color: colors.gray600 }]}>
                Email: {userProfile?.email}
              </Text>
              <Text style={[styles.userInfoText, { color: colors.gray600 }]}>
                Role: {userProfile?.role === 'admin' ? 'Administrator' : 'Pengguna'}
              </Text>
            </View>

            {/* QR Code Display */}
            {qrCode ? (
              <View style={styles.qrContainer}>
                <View style={[styles.qrWrapper, { backgroundColor: colors.white }]}>
                  <QRCode
                    value={qrCode}
                    size={200}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                
                <View style={styles.qrInfo}>
                  <Text style={[styles.qrInfoText, { color: colors.gray600 }]}>
                    QR #{generationCount} • {new Date().toLocaleTimeString('id-ID')}
                  </Text>
                  
                  {qrCode && (
                    <Text style={[styles.qrInfoText, { color: colors.gray500 }]}>
                      {qrCode.substring(0, 30)}...
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.gray600 }]}>
                  {isGenerating ? 'Membuat QR Code...' : 'Memuat...'}
                </Text>
              </View>
            )}

            {/* Info: QR auto-refreshes */}
            <View style={styles.autoRefreshInfo}>
              <Ionicons name="information-circle-outline" size={16} color={colors.gray500} />
              <Text style={[styles.autoRefreshText, { color: colors.gray500 }]}>
                QR Code otomatis diperbaharui setiap kali dibuka untuk keamanan
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={[styles.instructionsTitle, { color: colors.gray700 }]}>
                Cara Penggunaan:
              </Text>
              <Text style={[styles.instructionsText, { color: colors.gray600 }]}>
                1. Tunjukkan QR code ke scanner ESP32
              </Text>
              <Text style={[styles.instructionsText, { color: colors.gray600 }]}>
                2. QR akan otomatis tervalidasi dan menampilkan info user
              </Text>
              <Text style={[styles.instructionsText, { color: colors.gray500 }]}>
                * QR code ini unik dan berubah setiap kali di-generate untuk keamanan
              </Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  userInfo: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  userInfoText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrInfo: {
    alignItems: "center",
  },
  qrInfoText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 2,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  autoRefreshInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  autoRefreshText: {
    fontSize: 12,
    textAlign: "center",
    flex: 1,
    lineHeight: 16,
  },
  instructionsContainer: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default UserQRModalWorking;