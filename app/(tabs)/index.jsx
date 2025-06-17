import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from "../../contexts/SettingsContext";
import { getThemeByRole } from "../../constants/Colors";
import { resiService } from "../../services/resiService";

export default function Home() {
  const { userProfile, refreshProfile, currentUser } = useAuth();
  const { theme } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(false);
  const [refreshing, setRefreshing] = useState(false);
  const [packageStats, setPackageStats] = useState({
    total: 0,
    cod: 0,
    pending: 0
  });

  const fetchPackageStats = async () => {
    if (currentUser?.uid) {
      const result = await resiService.getUserPackageStats(currentUser.uid);
      if (result.success) {
        setPackageStats(result.stats);
      }
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Subscribe to real-time updates
    const unsubscribe = resiService.subscribeToUserPackageStats(
      currentUser.uid,
      (result) => {
        if (result.success) {
          setPackageStats(result.stats);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshProfile) {
        await refreshProfile();
      }
      await fetchPackageStats();
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  }, [refreshProfile, currentUser]);

  const quickActions = [
    {
      id: 1,
      title: "List Resi",
      icon: "📋",
      route: "/(tabs)/list-resi",
      color: colors.primary,
    },
    {
      id: 2,
      title: "Kapasitas",
      icon: "📦",
      route: "/(tabs)/kapasitas-paket",
      color: "#FF6B6B",
    },
    {
      id: 3,
      title: "Profil",
      icon: "👤",
      route: "/(tabs)/profile",
      color: colors.gray600,
    },
  ];

  const statsData = [
    { label: "Total Paket", value: packageStats.total.toString(), icon: "📦" },
    { label: "Paket COD", value: packageStats.cod.toString(), icon: "💰" },
    { label: "Menunggu Diambil", value: packageStats.pending.toString(), icon: "⏳" },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.gray600 }]}>
            Selamat datang,
          </Text>
          <Text style={[styles.userName, { color: colors.gray900 }]}>
            {userProfile?.nama || "User"}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {statsData.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.white,
                  shadowColor: colors.shadow.color,
                },
              ]}
            >
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.gray900 }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray600 }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Notification Card */}
        {packageStats.pending > 0 && (
          <View
            style={[
              styles.notificationCard,
              {
                backgroundColor: "#FFF4E6",
                borderColor: "#FFB74D",
              },
            ]}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: "#F57C00" }]}>
                Pengingat
              </Text>
              <Text style={[styles.notificationText, { color: "#795548" }]}>
                Anda memiliki {packageStats.pending} paket yang belum diambil. Segera ambil paket Anda.
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>
            Menu Cepat
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionCard,
                  {
                    backgroundColor: colors.white,
                    shadowColor: colors.shadow.color,
                  },
                ]}
                onPress={() => router.push(action.route)}
              >
                <View
                  style={[
                    styles.quickActionIconContainer,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                </View>
                <Text
                  style={[styles.quickActionTitle, { color: colors.gray900 }]}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>
            Aktivitas Terakhir
          </Text>
          <View
            style={[
              styles.activityCard,
              {
                backgroundColor: colors.white,
                shadowColor: colors.shadow.color,
              },
            ]}
          >
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>📦</Text>
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: colors.gray900 }]}>
                  Paket baru diterima
                </Text>
                <Text style={[styles.activityTime, { color: colors.gray500 }]}>
                  2 jam yang lalu • REX001234571
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>✅</Text>
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: colors.gray900 }]}>
                  Paket diambil
                </Text>
                <Text style={[styles.activityTime, { color: colors.gray500 }]}>
                  Kemarin • REX001234569
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  notificationCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
