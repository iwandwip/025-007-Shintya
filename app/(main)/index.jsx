import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { logoutUser } from '../services/auth';

export default function MainScreen() {
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      // Expo router will automatically redirect to login when auth state changes
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="headlineMedium" style={styles.title}>
            🚀 Smart Packet Box
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Welcome to your Smart Packet Box dashboard! 
          </Text>
          <Text variant="bodySmall" style={styles.description}>
            IoT system for automated package reception with Cash on Delivery transactions.
          </Text>
          
          <View style={styles.featureList}>
            <Text variant="bodyMedium" style={styles.featureTitle}>Coming Features:</Text>
            <Text variant="bodySmall" style={styles.feature}>📦 Package tracking</Text>
            <Text variant="bodySmall" style={styles.feature}>📷 QR Code scanning</Text>
            <Text variant="bodySmall" style={styles.feature}>🔔 Real-time notifications</Text>
            <Text variant="bodySmall" style={styles.feature}>💰 COD payment processing</Text>
          </View>
        </Card.Content>
      </Card>
      
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  featureList: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  featureTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feature: {
    marginBottom: 4,
    color: '#6b7280',
  },
  logoutButton: {
    marginTop: 20,
    minWidth: 120,
  },
});