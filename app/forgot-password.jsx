import React, { useState } from "react";
import { ScrollView, Alert, View, StyleSheet } from "react-native";
import { Text, Paragraph } from "react-native-paper";
import { router } from "expo-router";
import { AuthCard, AuthInput, AuthButton } from "./components";
import { FORGOT_PASSWORD_ILLUSTRATION } from "./constants/illustrations";
import { resetPassword } from "./services/auth";
import { validateEmail, validateRequired } from "./lib/validation";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      setEmailSent(true);
      Alert.alert(
        "Reset Link Sent! 📧",
        "Password reset email sent! Please check your inbox and follow the instructions.",
        [
          {
            text: "Back to Login",
            onPress: () => router.push("/login"),
          },
        ]
      );
    } else {
      Alert.alert("Reset Failed", result.error, [
        { text: "Try Again", style: "default" },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthCard
          title="Forgot Password? 🔓"
          subtitle="Don't worry! Enter your email address and we'll send you a secure link to reset your password"
          illustration={FORGOT_PASSWORD_ILLUSTRATION}
        >
          {!emailSent && (
            <>
              <AuthInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="email"
                error={errors.email}
                helperText="Enter the email address associated with your account"
              />

              <AuthButton
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                mode="contained"
                style={styles.resetButton}
              >
                Send Reset Link
              </AuthButton>
            </>
          )}

          {emailSent && (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>📧</Text>
              </View>
              <Paragraph style={styles.successText}>
                Reset link sent to
              </Paragraph>
              <Paragraph style={styles.emailText}>{email}</Paragraph>
              <Paragraph style={styles.instructionText}>
                Please check your email and follow the instructions to reset
                your password. Don't forget to check your spam folder!
              </Paragraph>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <AuthButton
              mode="text"
              onPress={() => router.push("/login")}
              style={styles.linkButton}
            >
              Sign In
            </AuthButton>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <AuthButton
              mode="text"
              onPress={() => router.push("/register")}
              style={styles.linkButton}
            >
              Create Account
            </AuthButton>
          </View>
        </AuthCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  successText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#166534",
  },
  emailText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#f59e0b",
  },
  instructionText: {
    textAlign: "center",
    color: "#059669",
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    color: "#6b7280",
    fontSize: 16,
  },
  linkButton: {
    marginLeft: -8,
  },
});
