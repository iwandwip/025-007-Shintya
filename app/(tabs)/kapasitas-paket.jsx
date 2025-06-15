import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getThemeByRole } from "../../constants/Colors";

const kapasitasData = {
  totalKapasitas: 100,
  terpakai: 85,
  tersisa: 15,
  status: "Hampir Penuh",
  pesan: "Segera ambil paket Anda",
  statusColor: "#FF6B6B", // Red color for warning
};

function KapasitasPaket() {
  const { userProfile, refreshProfile } = useAuth();
  const { theme, loading: settingsLoading } = useSettings();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  }, [refreshProfile]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Hampir Penuh":
        return "⚠️";
      case "Penuh":
        return "🚫";
      case "Tersedia":
        return "✅";
      default:
        return "📦";
    }
  };

  const getProgressPercentage = () => {
    return (kapasitasData.terpakai / kapasitasData.totalKapasitas) * 100;
  };

  if (settingsLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>
            Memuat kapasitas paket...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.gray900 }]}>
            Kapasitas Paket
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.gray600 }]}>
            Status kapasitas box penyimpanan
          </Text>
        </View>

        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.white,
              shadowColor: colors.shadow.color,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(kapasitasData.status)}
            </Text>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusText, { color: kapasitasData.statusColor }]}>
                {kapasitasData.status}
              </Text>
              <Text style={[styles.statusMessage, { color: colors.gray600 }]}>
                {kapasitasData.pesan}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: kapasitasData.statusColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.gray600 }]}>
              {getProgressPercentage().toFixed(1)}% terpakai
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: colors.white,
              shadowColor: colors.shadow.color,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.gray900 }]}>
            Detail Kapasitas
          </Text>

          <View style={styles.detailGrid}>
            <View style={[styles.detailItem, { borderColor: colors.gray100 }]}>
              <Text style={[styles.detailLabel, { color: colors.gray600 }]}>
                Total Kapasitas
              </Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                {kapasitasData.totalKapasitas}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                paket
              </Text>
            </View>

            <View style={[styles.detailItem, { borderColor: colors.gray100 }]}>
              <Text style={[styles.detailLabel, { color: colors.gray600 }]}>
                Terpakai
              </Text>
              <Text style={[styles.detailValue, { color: kapasitasData.statusColor }]}>
                {kapasitasData.terpakai}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                paket
              </Text>
            </View>

            <View style={[styles.detailItem, { borderColor: colors.gray100 }]}>
              <Text style={[styles.detailLabel, { color: colors.gray600 }]}>
                Tersisa
              </Text>
              <Text style={[styles.detailValue, { color: colors.success || colors.green600 }]}>
                {kapasitasData.tersisa}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                paket
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.white,
              shadowColor: colors.shadow.color,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.gray900 }]}>
            Informasi
          </Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={[styles.infoText, { color: colors.gray600 }]}>
              Kapasitas box akan diperbarui secara otomatis setiap kali ada paket yang masuk atau keluar.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔔</Text>
            <Text style={[styles.infoText, { color: colors.gray600 }]}>
              Anda akan mendapat notifikasi ketika kapasitas mencapai batas tertentu.
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
  },
  detailCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detailUnit: {
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default KapasitasPaket;