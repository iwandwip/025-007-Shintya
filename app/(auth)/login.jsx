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
import LoginIllustration from '../../components/illustrations/LoginIllustration';
import IllustrationContainer from '../../components/ui/IllustrationContainer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Gagal', error.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
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
                <LoginIllustration width={250} height={180} />
              </IllustrationContainer>
              
              <VStack space="sm" alignItems="center">
                <Heading size="2xl" color="$textLight900">
                  Masuk
                </Heading>
                <Text color="$textLight600" textAlign="center">
                  Silakan masuk ke akun Anda
                </Text>
              </VStack>
              
              <VStack space="md">
                <Input
                  label="Email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                
                <Input
                  label="Password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                />
              </VStack>
              
              <Pressable 
                alignSelf="flex-end"
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text color="$primary600" fontSize="$sm">
                  Lupa Password?
                </Text>
              </Pressable>
              
              <Button
                title="Masuk"
                onPress={handleLogin}
                isDisabled={loading}
              />
              
              <HStack justifyContent="center" alignItems="center" space="xs">
                <Text color="$textLight600" fontSize="$sm">
                  Belum punya akun?
                </Text>
                <Pressable onPress={() => router.push('/(auth)/register')}>
                  <Text color="$primary600" fontSize="$sm" fontWeight="$semibold">
                    Daftar di sini
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

