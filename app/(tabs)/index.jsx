import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getThemeByRole } from '../../constants/Colors';

export default function Home() {
  const { userProfile } = useAuth();
  const colors = getThemeByRole(false);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.white, borderBottomColor: colors.gray200 },
        ]}
      >
        <Text style={[styles.title, { color: colors.gray900 }]}>
          Smart Packet Box COD
        </Text>
        {userProfile && (
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>
            Selamat datang, {userProfile.nama}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.white, borderColor: colors.gray200 },
          ]}
        >
          <Text style={[styles.emptyIcon, { color: colors.gray400 }]}>📦</Text>
          <Text style={[styles.emptyTitle, { color: colors.gray900 }]}>
            Halaman Utama
          </Text>
          <Text style={[styles.emptyText, { color: colors.gray600 }]}>
            Aplikasi Smart Packet Box COD sedang dalam pengembangan
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.gray500 }]}>
            Fitur-fitur akan ditambahkan segera
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
