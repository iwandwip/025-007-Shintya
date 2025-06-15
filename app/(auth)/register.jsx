import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  VStack,
  HStack,
  Text,
  Heading,
  Box,
  ScrollView,
  Pressable,
  Center
} from '@gluestack-ui/themed';
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
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Box flex={1} bg="$white">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          <Center>
            <VStack space="lg" maxWidth="$96" width="$full">
              <IllustrationContainer>
                <RegisterIllustration width={250} height={180} />
              </IllustrationContainer>
              
              <VStack space="sm" alignItems="center">
                <Heading size="2xl" color="$textLight900">
                  Daftar
                </Heading>
                <Text color="$textLight600" textAlign="center">
                  Buat akun baru untuk mulai menggunakan aplikasi
                </Text>
              </VStack>
              
              <VStack space="md">
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
              </VStack>
              
              <Button
                title="Daftar"
                onPress={handleRegister}
                isDisabled={loading}
              />
              
              <HStack justifyContent="center" alignItems="center" space="xs">
                <Text color="$textLight600" fontSize="$sm">
                  Sudah punya akun?
                </Text>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                  <Text color="$primary600" fontSize="$sm" fontWeight="$semibold">
                    Masuk di sini
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </Center>
        </ScrollView>
      </Box>
    </KeyboardAvoidingView>
  );
}

