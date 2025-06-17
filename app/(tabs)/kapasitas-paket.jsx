import React, { useState, useEffect } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getThemeByRole } from "../../constants/Colors";
import { 
  getCapacityData, 
  subscribeToCapacityUpdates, 
  calculateCapacityStatus 
} from "../../services/capacityService";

function KapasitasPaket() {
  const { userProfile, refreshProfile } = useAuth();
  const { theme, loading: settingsLoading } = useSettings();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(false);
  const [refreshing, setRefreshing] = useState(false);
  const [kapasitasData, setKapasitasData] = useState({
    height: 0,
    maxHeight: 30,
    percentage: 0,
    status: "Kosong",
    message: "Box kosong, siap menerima paket",
    color: "#22C55E",
    lastUpdated: null,
    deviceId: null
  });
  const [loading, setLoading] = useState(true);

  const loadKapasitas = async () => {
    try {
      const result = await getCapacityData();
      if (result.success) {
        const { height, maxHeight, lastUpdated, deviceId } = result.data;
        const statusInfo = calculateCapacityStatus(height, maxHeight);
        
        setKapasitasData({
          height,
          maxHeight,
          percentage: statusInfo.percentage,
          status: statusInfo.status,
          message: statusInfo.message,
          color: statusInfo.color,
          lastUpdated,
          deviceId
        });
      }
    } catch (error) {
      console.error('Error loading kapasitas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKapasitas();
    
    const unsubscribe = subscribeToCapacityUpdates((result) => {
      if (result.success) {
        const { height, maxHeight, lastUpdated, deviceId } = result.data;
        const statusInfo = calculateCapacityStatus(height, maxHeight);
        
        setKapasitasData({
          height,
          maxHeight,
          percentage: statusInfo.percentage,
          status: statusInfo.status,
          message: statusInfo.message,
          color: statusInfo.color,
          lastUpdated,
          deviceId
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadKapasitas();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadKapasitas();
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
      case "Penuh":
        return "🚫";
      case "Hampir Penuh":
        return "⚠️";
      case "Terisi Sebagian":
        return "📦";
      case "Kosong":
        return "✅";
      default:
        return "📏";
    }
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Belum ada data';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Waktu tidak valid';
    }
  };

  if (settingsLoading || loading) {
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
            Monitoring ketinggian paket dengan sensor ultrasonik
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
              <Text style={[styles.statusText, { color: kapasitasData.color }]}>
                {kapasitasData.status}
              </Text>
              <Text style={[styles.statusMessage, { color: colors.gray600 }]}>
                {kapasitasData.message}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${kapasitasData.percentage}%`,
                    backgroundColor: kapasitasData.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.gray600 }]}>
              {kapasitasData.percentage.toFixed(1)}% terisi
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
                Ketinggian Saat Ini
              </Text>
              <Text style={[styles.detailValue, { color: kapasitasData.color }]}>
                {kapasitasData.height}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                cm
              </Text>
            </View>

            <View style={[styles.detailItem, { borderColor: colors.gray100 }]}>
              <Text style={[styles.detailLabel, { color: colors.gray600 }]}>
                Batas Maksimal
              </Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                {kapasitasData.maxHeight}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                cm
              </Text>
            </View>

            <View style={[styles.detailItem, { borderColor: colors.gray100 }]}>
              <Text style={[styles.detailLabel, { color: colors.gray600 }]}>
                Persentase
              </Text>
              <Text style={[styles.detailValue, { color: kapasitasData.color }]}>
                {kapasitasData.percentage.toFixed(1)}
              </Text>
              <Text style={[styles.detailUnit, { color: colors.gray500 }]}>
                %
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sensorCard,
            {
              backgroundColor: colors.white,
              shadowColor: colors.shadow.color,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.gray900 }]}>
            Informasi Sensor
          </Text>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Text style={[styles.sensorLabel, { color: colors.gray600 }]}>
                Device ID
              </Text>
              <Text style={[styles.sensorValue, { color: colors.gray900 }]}>
                {kapasitasData.deviceId || 'Tidak terhubung'}
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={[styles.sensorLabel, { color: colors.gray600 }]}>
                Update Terakhir
              </Text>
              <Text style={[styles.sensorValue, { color: colors.gray900 }]}>
                {formatLastUpdated(kapasitasData.lastUpdated)}
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
            <Text style={styles.infoIcon}>📏</Text>
            <Text style={[styles.infoText, { color: colors.gray600 }]}>
              Sensor ultrasonik mengukur ketinggian paket secara real-time dan memperbarui data otomatis.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔄</Text>
            <Text style={[styles.infoText, { color: colors.gray600 }]}>
              Data kapasitas diperbarui langsung oleh ESP32 setiap kali ada perubahan ketinggian paket.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⚡</Text>
            <Text style={[styles.infoText, { color: colors.gray600 }]}>
              Sistem monitoring berjalan 24/7 untuk memastikan akurasi data kapasitas box.
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
  sensorCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorGrid: {
    gap: 12,
  },
  sensorItem: {
    paddingVertical: 8,
  },
  sensorLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  sensorValue: {
    fontSize: 14,
    fontWeight: '600',
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