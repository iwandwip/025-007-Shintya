import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getThemeByRole } from "../../constants/Colors";

const { width: screenWidth } = Dimensions.get("window");

function QRCodeModal({ visible, onClose, userEmail, isAdmin = false, resiData = null }) {
  const colors = getThemeByRole(isAdmin);
  
  // Use resi number if provided, otherwise use userEmail
  const qrValue = resiData?.noResi || userEmail;
  const displayText = resiData?.noResi || userEmail;
  const title = resiData ? "QR Code Resi" : "Kode QR Saya";
  const description = resiData ? "Tunjukkan QR code ini untuk identifikasi resi" : "Tunjukkan kode QR ini untuk identifikasi";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.white }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.gray900 }]}>
              {title}
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

          {resiData && (
            <View style={styles.resiInfo}>
              <Text style={[styles.resiInfoLabel, { color: colors.gray500 }]}>
                Nama Penerima:
              </Text>
              <Text style={[styles.resiInfoValue, { color: colors.gray900 }]}>
                {resiData.nama}
              </Text>
              <Text style={[styles.resiInfoLabel, { color: colors.gray500 }]}>
                Status:
              </Text>
              <Text style={[styles.resiInfoValue, { color: colors.gray900 }]}>
                {resiData.status || "Sedang Dikirim"}
              </Text>
            </View>
          )}

          <View style={styles.qrContainer}>
            <View style={[styles.qrWrapper, { backgroundColor: colors.white }]}>
              <QRCode
                value={qrValue}
                size={200}
                color={colors.gray900}
                backgroundColor={colors.white}
              />
            </View>
            <Text style={[styles.emailText, { color: colors.gray600 }]}>
              {displayText}
            </Text>
          </View>

          <Text style={[styles.description, { color: colors.gray500 }]}>
            {description}
          </Text>
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
    width: screenWidth * 0.85,
    maxWidth: 350,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  emailText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  resiInfo: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resiInfoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 2,
  },
  resiInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
});

export default QRCodeModal;