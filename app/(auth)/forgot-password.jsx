import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { resetPassword } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Mohon isi email Anda");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);

    if (result.success) {
      Alert.alert(
        "Berhasil", 
        "Link reset password telah dikirim ke email Anda",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } else {
      Alert.alert("Gagal", result.error);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Lupa Password</Text>
            <Text style={styles.subtitle}>
              Masukkan email Anda untuk menerima link reset password
            </Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Email"
              placeholder="Masukkan email Anda"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title={loading ? "Mengirim..." : "Kirim Link Reset"}
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.resetButton}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.linkText}>Kembali ke Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  resetButton: {
    marginTop: 8,
    backgroundColor: "#10b981",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
});