import React, { useState } from 'react';
import { ScrollView, Alert, View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { AuthCard, AuthInput, AuthButton } from './components';
import { LOGIN_ILLUSTRATION } from './constants/illustrations';
import { loginUser } from './services/auth';
import { validateEmail, validateRequired } from './lib/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Welcome back! Login successful.', [
        { text: 'Continue', style: 'default' }
      ]);
    } else {
      Alert.alert('Login Failed', result.error, [
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
          title="Welcome Back! 👋"
          subtitle="Sign in to continue to your Smart Packet Box"
          illustration={LOGIN_ILLUSTRATION}
        >
          <AuthInput
            label="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: null }));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
            error={errors.email}
            helperText="Enter your registered email address"
          />

          <AuthInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: null }));
              }
            }}
            secureTextEntry={!showPassword}
            icon="lock"
            error={errors.password}
            rightIcon={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
                iconColor="#9ca3af"
              />
            }
          />

          <AuthButton
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            mode="contained"
            style={styles.loginButton}
          >
            Sign In
          </AuthButton>

          <AuthButton
            onPress={() => router.push('/forgot-password')}
            mode="text"
            style={styles.textButton}
          >
            Forgot your password?
          </AuthButton>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <AuthButton
              mode="text"
              onPress={() => router.push('/register')}
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  textButton: {
    marginVertical: 4,
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