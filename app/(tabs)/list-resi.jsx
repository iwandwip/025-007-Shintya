import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getThemeByRole } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { resiService } from "../../services/resiService";
import { getCapacityData, calculateCapacityStatus } from "../../services/capacityService";
import AddResiModal from "../../components/ui/AddResiModal";
import EditResiModal from "../../components/ui/EditResiModal";
import HelpModal from "../../components/ui/HelpModal";
import QRCodeModal from "../../components/ui/QRCodeModal";
import { useNotification } from "../../contexts/NotificationContext";


function ListResi() {
  const { userProfile, currentUser } = useAuth();
  const { theme, loading: settingsLoading } = useSettings();
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(false);
  
  const [resiList, setResiList] = useState([]);
  const [filteredResiList, setFilteredResiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingResi, setAddingResi] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResi, setEditingResi] = useState(false);
  const [selectedResi, setSelectedResi] = useState(null);
  const [userResiCount, setUserResiCount] = useState(0);
  const [totalResiCount, setTotalResiCount] = useState(0);
  const [codResiCount, setCodResiCount] = useState(0);
  const [capacityData, setCapacityData] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedResiForQR, setSelectedResiForQR] = useState(null);
  const [activeTab, setActiveTab] = useState("aktif");
  const [activeResiCount, setActiveResiCount] = useState(0);
  const [historyResiCount, setHistoryResiCount] = useState(0);
  const [activeCodResiCount, setActiveCodResiCount] = useState(0);

  const getStatusColor = (status, colors) => {
    switch (status) {
      case "Sedang Dikirim":
        return { bg: colors.warning + "20", text: colors.warning };
      case "Telah Tiba":
        return { bg: colors.info + "20", text: colors.info };
      case "Sudah Diambil":
        return { bg: colors.success + "20", text: colors.success };
      default:
        return { bg: colors.gray100, text: colors.gray600 };
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // The real-time subscription will handle data refresh automatically
      // Just add a small delay to show the refresh indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing:', error);
      showNotification("Gagal memuat ulang data", "error");
    }
    setRefreshing(false);
  }, [showNotification]);

  const filterResiList = (resiData, tab) => {
    if (tab === "aktif") {
      return resiData.filter(resi => 
        resi.status === "Sedang Dikirim" || resi.status === "Telah Tiba"
      );
    } else {
      return resiData.filter(resi => resi.status === "Sudah Diambil");
    }
  };

  const updateCounts = (resiData) => {
    const activeResis = resiData.filter(resi => 
      resi.status === "Sedang Dikirim" || resi.status === "Telah Tiba"
    );
    const historyResis = resiData.filter(resi => resi.status === "Sudah Diambil");
    const userResis = resiData.filter(resi => resi.userId === currentUser?.uid);
    const codResis = resiData.filter(resi => resi.tipePaket === 'COD');
    const activeCodResis = activeResis.filter(resi => resi.tipePaket === 'COD');

    setActiveResiCount(activeResis.length);
    setHistoryResiCount(historyResis.length);
    setUserResiCount(userResis.length);
    setTotalResiCount(resiData.length);
    setCodResiCount(codResis.length);
    setActiveCodResiCount(activeCodResis.length);
  };

  useEffect(() => {
    const unsubscribe = resiService.subscribeToResiList((result) => {
      if (result.success) {
        setResiList(result.data);
        updateCounts(result.data);
        setFilteredResiList(filterResiList(result.data, activeTab));
      } else {
        showNotification("Gagal memuat data resi", "error");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    setFilteredResiList(filterResiList(resiList, activeTab));
  }, [activeTab, resiList]);

  useEffect(() => {
    const loadCapacityData = async () => {
      const result = await getCapacityData();
      if (result.success) {
        setCapacityData(result.data);
      }
    };
    loadCapacityData();
  }, []);

  const handleAddResi = async (resiData) => {
    if (!currentUser) {
      showNotification("Anda harus login terlebih dahulu", "error");
      return;
    }

    // Check COD package limit (maksimal 5 paket COD aktif untuk semua user)
    if (resiData.tipePaket === 'COD' && activeCodResiCount >= 5) {
      showNotification("Sudah mencapai batas maksimal 5 paket COD aktif untuk semua user", "error");
      return;
    }

    // Check capacity limit for Non-COD packages only
    if (resiData.tipePaket === 'Non-COD' && capacityData) {
      const capacityStatus = calculateCapacityStatus(capacityData.height, capacityData.maxHeight);
      if (capacityStatus.percentage >= 90) {
        showNotification("Kapasitas box sudah penuh, tidak bisa menambah paket Non-COD lagi", "error");
        return;
      }
    }

    setAddingResi(true);
    
    try {
      const resiToAdd = {
        ...resiData,
        nama: userProfile?.nama || currentUser?.email || "Unknown",
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
      };
      
      const result = await resiService.addResi(resiToAdd);

      if (result.success) {
        showNotification("Resi berhasil ditambahkan", "success");
        setShowAddModal(false);
      } else {
        showNotification("Gagal menambahkan resi: " + (result.error || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error in handleAddResi:", error);
      showNotification("Terjadi kesalahan: " + error.message, "error");
    }
    
    setAddingResi(false);
  };

  const handleEditResi = async (resiData) => {
    if (!currentUser || !selectedResi) {
      showNotification("Terjadi kesalahan saat mengedit resi", "error");
      return;
    }

    // Check ownership
    if (selectedResi.userId !== currentUser.uid) {
      showNotification("Anda hanya bisa mengedit resi milik Anda sendiri", "error");
      return;
    }

    setEditingResi(true);
    
    try {
      const result = await resiService.updateResi(selectedResi.id, resiData);

      if (result.success) {
        showNotification("Resi berhasil diperbarui", "success");
        setShowEditModal(false);
        setSelectedResi(null);
      } else {
        showNotification("Gagal memperbarui resi: " + (result.error || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error in handleEditResi:", error);
      showNotification("Terjadi kesalahan: " + error.message, "error");
    }
    
    setEditingResi(false);
  };

  const openEditModal = (resi) => {
    if (resi.userId !== currentUser?.uid) {
      showNotification("Anda hanya bisa mengedit resi milik Anda sendiri", "error");
      return;
    }
    setSelectedResi(resi);
    setShowEditModal(true);
  };

  const handleDeleteResi = (resiId, resiUserId) => {
    if (resiUserId !== currentUser?.uid) {
      showNotification("Anda hanya bisa menghapus resi milik Anda sendiri", "error");
      return;
    }

    Alert.alert(
      "Hapus Resi",
      "Apakah Anda yakin ingin menghapus resi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const result = await resiService.deleteResi(resiId);
            if (result.success) {
              showNotification("Resi berhasil dihapus", "success");
            } else {
              showNotification("Gagal menghapus resi", "error");
            }
          },
        },
      ]
    );
  };

  const handleShowQRCode = (resi) => {
    // Only allow owner to view QR code
    if (resi.userId !== currentUser?.uid) {
      showNotification("Anda hanya bisa melihat QR code resi milik Anda sendiri", "error");
      return;
    }
    setSelectedResiForQR(resi);
    setShowQRModal(true);
  };

  const renderResiItem = ({ item }) => {
    const isOwner = item.userId === currentUser?.uid;
    
    return (
      <TouchableOpacity 
        style={[styles.resiCard, { backgroundColor: colors.white, shadowColor: colors.shadow.color }]}
        onPress={() => handleShowQRCode(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resiHeader}>
          <View style={styles.resiInfo}>
            <Text style={[styles.namaText, { color: colors.gray900 }]}>{item.nama}</Text>
            {isOwner && (
              <Text style={[styles.ownerBadge, { color: colors.primary }]}>Milik Anda</Text>
            )}
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity
              onPress={() => handleShowQRCode(item)}
              style={styles.qrButton}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={[
              styles.tipePaketBadge, 
              { backgroundColor: item.tipePaket === 'COD' ? colors.primary : colors.gray200 }
            ]}>
              <Text style={[
                styles.tipePaketText, 
                { color: item.tipePaket === 'COD' ? colors.white : colors.gray700 }
              ]}>
                {item.tipePaket}
              </Text>
            </View>
            {isOwner && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteResi(item.id, item.userId)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => handleShowQRCode(item)}
          style={styles.resiContent}
        >
          <Text style={[styles.noResiText, { color: colors.gray600 }]}>
            No. Resi: {item.noResi}
          </Text>
          
          {/* Nomor Loker - Only show for COD packages */}
          {item.tipePaket === 'COD' && item.nomorLoker && (
            <View style={styles.lokerInfo}>
              <Ionicons name="cube-outline" size={16} color={colors.primary} />
              <Text style={[styles.lokerText, { color: colors.primary }]}>
                Loker #{item.nomorLoker}
              </Text>
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.gray500 }]}>Status: </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status, colors).bg }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item.status, colors).text }
              ]}>
                {item.status || "Sedang Dikirim"}
              </Text>
            </View>
          </View>
          <View style={styles.qrHint}>
            <Ionicons name="qr-code-outline" size={16} color={colors.gray400} />
            <Text style={[styles.qrHintText, { color: colors.gray400 }]}>
              Tap untuk melihat QR Code
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
            Memuat data resi...
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.gray900 }]}>
            List Resi
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.gray600 }]}>
            {activeTab === "aktif" 
              ? `COD: ${activeCodResiCount}/5 | Aktif: ${activeResiCount}`
              : `Riwayat: ${historyResiCount}`
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.gray600} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "aktif" && styles.activeTabButton,
            { backgroundColor: activeTab === "aktif" ? colors.primary : colors.gray100 }
          ]}
          onPress={() => setActiveTab("aktif")}
        >
          <Text style={[
            styles.tabText,
            activeTab === "aktif" && styles.activeTabText,
            { color: activeTab === "aktif" ? colors.white : colors.gray600 }
          ]}>
            Aktif ({activeResiCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "riwayat" && styles.activeTabButton,
            { backgroundColor: activeTab === "riwayat" ? colors.primary : colors.gray100 }
          ]}
          onPress={() => setActiveTab("riwayat")}
        >
          <Text style={[
            styles.tabText,
            activeTab === "riwayat" && styles.activeTabText,
            { color: activeTab === "riwayat" ? colors.white : colors.gray600 }
          ]}>
            Riwayat ({historyResiCount})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredResiList}
        renderItem={renderResiItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === "aktif" ? "cube-outline" : "time-outline"} 
              size={64} 
              color={colors.gray300} 
            />
            <Text style={[styles.emptyText, { color: colors.gray500 }]}>
              {activeTab === "aktif" 
                ? "Belum ada resi aktif"
                : "Belum ada resi di riwayat"
              }
            </Text>
          </View>
        }
      />

      <AddResiModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddResi}
        loading={addingResi}
        codResiCount={activeCodResiCount}
        capacityPercentage={capacityData ? calculateCapacityStatus(capacityData.height, capacityData.maxHeight).percentage : 0}
      />

      <EditResiModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedResi(null);
        }}
        onSubmit={handleEditResi}
        resiData={selectedResi}
        loading={editingResi}
      />

      <HelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <QRCodeModal
        visible={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedResiForQR(null);
        }}
        userEmail={selectedResiForQR?.noResi || ""}
        isAdmin={false}
        resiData={selectedResiForQR}
      />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  resiCard: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resiInfo: {
    flex: 1,
    marginRight: 12,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ownerBadge: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  namaText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  tipePaketBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tipePaketText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noResiText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  qrButton: {
    padding: 4,
    marginRight: 8,
  },
  resiContent: {
    flex: 1,
  },
  qrHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  qrHintText: {
    fontSize: 12,
    marginLeft: 4,
    fontStyle: "italic",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTabButton: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "700",
  },
  lokerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  lokerText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default ListResi;