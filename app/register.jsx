import React, { useState } from 'react';
import { ScrollView, Alert, View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { AuthCard, AuthInput, AuthButton } from './components';
import { REGISTER_ILLUSTRATION } from './constants/illustrations';
import { registerUser } from './services/auth';
import { validateEmail, validatePassword, validateRequired, validatePasswordMatch } from './lib/validation';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;
    const newErrors = {};
    
    if (!validateRequired(fullName)) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!validateRequired(confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!validatePasswordMatch(password, confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const { fullName, email, password } = formData;
    setLoading(true);
    const result = await registerUser(email, password, { fullName });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Welcome to Smart Packet Box! Account created successfully.', [
        { text: 'Continue', style: 'default' }
      ]);
    } else {
      Alert.alert('Registration Failed', result.error, [
        { text: 'Try Again', style: 'default' }
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
          title="Create Account 🚀"
          subtitle="Join Smart Packet Box and start managing your deliveries effortlessly"
          illustration={REGISTER_ILLUSTRATION}
        >
          <AuthInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            icon="account"
            error={errors.fullName}
            helperText="Enter your full name as it appears on your ID"
          />

          <AuthInput
            label="Email Address"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
            error={errors.email}
            helperText="We'll use this for account verification and notifications"
          />

          <AuthInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            icon="lock"
            error={errors.password}
            helperText="Choose a strong password with at least 6 characters"
            rightIcon={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
                iconColor="#9ca3af"
              />
            }
          />

          <AuthInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            icon="lock-check"
            error={errors.confirmPassword}
            rightIcon={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                iconColor="#9ca3af"
              />
            }
          />

          <AuthButton
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            mode="contained"
            style={styles.registerButton}
          >
            Create Account
          </AuthButton>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <AuthButton
              mode="text"
              onPress={() => router.push('/login')}
              style={styles.linkButton}
            >
              Sign In
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 16,
  },
  linkButton: {
    marginLeft: -8,
  },
});