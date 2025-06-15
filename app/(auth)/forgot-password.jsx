import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ForgotPasswordIllustration from '../../components/illustrations/ForgotPasswordIllustration';
import IllustrationContainer from '../../components/ui/IllustrationContainer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);
  
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setEmailSent(true);
      Alert.alert(
        'Email Terkirim',
        'Link reset password telah dikirim ke email Anda. Silakan cek inbox dan folder spam.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Terjadi kesalahan saat mengirim email reset password';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar dalam sistem';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan. Silakan coba lagi nanti';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Tidak ada koneksi internet. Silakan coba lagi';
      }
      
      Alert.alert('Reset Password Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <IllustrationContainer>
            <ForgotPasswordIllustration width={250} height={180} />
          </IllustrationContainer>
          <Text style={styles.title}>Lupa Password</Text>
          <Text style={styles.subtitle}>
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </Text>
          
          <View style={styles.inputContainer}>
            <Input
              label="Email"
              placeholder="Masukkan email Anda"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </View>
          
          <Button
            title="Kirim Link Reset"
            onPress={handleResetPassword}
            style={styles.resetButton}
            disabled={loading || emailSent}
          />
          
          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.backLink}>← Kembali ke Login</Text>
            </TouchableOpacity>
          </View>
          
          {emailSent && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Email telah dikirim! Silakan cek inbox Anda.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 100, // Add extra bottom padding
  },
  formContainer: {
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    minHeight: '80%', // Ensure minimum height
  },
  illustration: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  resetButton: {
    marginBottom: 32,
  },
  backContainer: {
    alignSelf: 'center',
    marginBottom: 20, // Add bottom margin to prevent overlap
  },
  backLink: {
    fontSize: 14,
    color: '#378e40',
    fontWeight: '600',
  },
  successContainer: {
    backgroundColor: '#378e40',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#378e40',
  },
  successText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
  },
});