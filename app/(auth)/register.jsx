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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { registerWithEmail } from "../../services/authService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nama, setNama] = useState("");
  const [noTelp, setNoTelp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !nama.trim() || !noTelp.trim()) {
      Alert.alert("Error", "Mohon isi semua field");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password dan konfirmasi password tidak sama");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    const result = await registerWithEmail(email, password, {
      nama,
      noTelp,
    });

    if (result.success) {
      Alert.alert("Berhasil", "Akun berhasil dibuat", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") }
      ]);
    } else {
      Alert.alert("Daftar Gagal", result.error);
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

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Daftar</Text>
              <Text style={styles.subtitle}>
                Buat akun baru untuk memulai
              </Text>
            </View>

            <View style={styles.formSection}>
              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={nama}
                onChangeText={setNama}
              />

              <Input
                label="Email"
                placeholder="Masukkan email Anda"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="No. Telepon"
                placeholder="Masukkan nomor telepon"
                value={noTelp}
                onChangeText={setNoTelp}
                keyboardType="phone-pad"
              />

              <Input
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Input
                label="Konfirmasi Password"
                placeholder="Masukkan ulang password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Button
                title={loading ? "Sedang Mendaftar..." : "Daftar"}
                onPress={handleRegister}
                disabled={loading}
                style={styles.registerButton}
              />

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.linkText}>Sudah punya akun? Masuk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
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
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
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
  registerButton: {
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