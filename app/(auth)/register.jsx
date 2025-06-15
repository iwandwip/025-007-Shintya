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
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RegisterIllustration from '../../components/illustrations/RegisterIllustration';
import IllustrationContainer from '../../components/ui/IllustrationContainer';

export default function Register() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    noTelp: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama wajib diisi';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }
    
    if (!formData.noTelp.trim()) {
      newErrors.noTelp = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s]+$/.test(formData.noTelp)) {
      newErrors.noTelp = 'Format nomor telepon tidak valid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await register({
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        password: formData.password,
        noTelp: formData.noTelp.trim(),
      });
      
      Alert.alert(
        'Registrasi Berhasil',
        'Akun Anda telah berhasil dibuat. Silakan login.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registrasi Gagal', error.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
            <RegisterIllustration width={250} height={180} />
          </IllustrationContainer>
          <Text style={styles.title}>Daftar</Text>
          <Text style={styles.subtitle}>Buat akun baru untuk mulai menggunakan aplikasi</Text>
          
          <View style={styles.inputContainer}>
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              value={formData.nama}
              onChangeText={(value) => updateFormData('nama', value)}
              error={errors.nama}
            />
            
            <Input
              label="Email"
              placeholder="Masukkan email Anda"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            
            <Input
              label="Nomor Telepon"
              placeholder="Masukkan nomor telepon Anda"
              value={formData.noTelp}
              onChangeText={(value) => updateFormData('noTelp', value)}
              keyboardType="phone-pad"
              error={errors.noTelp}
            />
            
            <Input
              label="Password"
              placeholder="Masukkan password Anda"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              error={errors.password}
            />
            
            <Input
              label="Konfirmasi Password"
              placeholder="Masukkan ulang password Anda"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              error={errors.confirmPassword}
            />
          </View>
          
          <Button
            title="Daftar"
            onPress={handleRegister}
            style={styles.registerButton}
            disabled={loading}
          />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
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
  },
  inputContainer: {
    marginBottom: 24,
  },
  registerButton: {
    marginBottom: 32,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Add bottom margin to prevent overlap
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});