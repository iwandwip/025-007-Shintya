/**
 * List Resi Screen - Halaman manajemen paket dengan sistem COD dan Non-COD
 * 
 * Halaman ini mengelola:
 * - Daftar semua paket dengan filter Aktif/Riwayat
 * - Sistem COD (Cash on Delivery) dengan loker otomatis (1-5)
 * - Sistem Non-COD dengan monitoring kapasitas box
 * - CRUD operations (Create, Read, Update, Delete) untuk paket
 * - QR Code untuk kontrol loker pada paket COD
 * - Real-time updates menggunakan Firebase listeners
 * 
 * Business Logic:
 * - Maksimal 5 paket COD aktif secara global
 * - Paket COD mendapat nomor loker otomatis (1-5)
 * - Paket Non-COD dibatasi oleh kapasitas box (90% threshold)
 * - Hanya pemilik yang bisa edit/delete/lihat QR paket
 * - Real-time sync untuk semua perubahan data
 * 
 * @component ListResi
 * @returns {JSX.Element} Halaman manajemen list resi
 */

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


/**
 * Komponen utama halaman List Resi
 * Mengelola state dan logika untuk manajemen paket
 */
function ListResi() {
  // Context dan hooks untuk autentikasi, tema, dan notifikasi
  const { userProfile, currentUser } = useAuth();
  const { theme, loading: settingsLoading } = useSettings();
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(false); // Selalu menggunakan tema user
  
  // State untuk data resi dan filtering
  const [resiList, setResiList] = useState([]);           // Semua data resi
  const [filteredResiList, setFilteredResiList] = useState([]); // Data resi yang sudah difilter
  const [loading, setLoading] = useState(true);           // Loading state inisialisasi
  const [refreshing, setRefreshing] = useState(false);    // Loading state pull-to-refresh
  
  // State untuk modal dan form
  const [showAddModal, setShowAddModal] = useState(false);     // Modal tambah resi
  const [addingResi, setAddingResi] = useState(false);         // Loading saat menambah resi
  const [showEditModal, setShowEditModal] = useState(false);   // Modal edit resi
  const [editingResi, setEditingResi] = useState(false);       // Loading saat mengedit resi
  const [selectedResi, setSelectedResi] = useState(null);      // Resi yang dipilih untuk diedit
  
  // State untuk statistik dan counter
  const [userResiCount, setUserResiCount] = useState(0);       // Jumlah resi milik user
  const [totalResiCount, setTotalResiCount] = useState(0);     // Total semua resi
  const [codResiCount, setCodResiCount] = useState(0);         // Total resi COD
  const [activeResiCount, setActiveResiCount] = useState(0);   // Resi aktif (Sedang Dikirim + Telah Tiba)
  const [historyResiCount, setHistoryResiCount] = useState(0); // Resi riwayat (Sudah Diambil)
  const [activeCodResiCount, setActiveCodResiCount] = useState(0); // Resi COD aktif (untuk batasan 5)
  
  // State untuk kapasitas dan QR code
  const [capacityData, setCapacityData] = useState(null);      // Data kapasitas box dari sensor
  const [showHelpModal, setShowHelpModal] = useState(false);   // Modal bantuan
  const [showQRModal, setShowQRModal] = useState(false);       // Modal QR code untuk kontrol loker
  const [selectedResiForQR, setSelectedResiForQR] = useState(null); // Resi untuk QR code
  
  // State untuk tab filter
  const [activeTab, setActiveTab] = useState("aktif");         // Tab aktif: "aktif" atau "riwayat"

  /**
   * Mendapatkan warna untuk badge status paket
   * 
   * @param {string} status - Status paket ("Sedang Dikirim", "Telah Tiba", "Sudah Diambil")
   * @param {object} colors - Objek palet warna tema
   * @returns {object} Objek dengan warna background dan text untuk badge
   */
  const getStatusColor = (status, colors) => {
    switch (status) {
      case "Sedang Dikirim":
        return { bg: colors.warning + "20", text: colors.warning }; // Kuning untuk dalam perjalanan
      case "Telah Tiba":
        return { bg: colors.info + "20", text: colors.info };       // Biru untuk sudah tiba
      case "Sudah Diambil":
        return { bg: colors.success + "20", text: colors.success }; // Hijau untuk selesai
      default:
        return { bg: colors.gray100, text: colors.gray600 };        // Abu-abu untuk status lain
    }
  };

  /**
   * Handler untuk pull-to-refresh
   * Karena menggunakan real-time listener, hanya perlu delay untuk UX
   */
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Real-time subscription akan handle refresh otomatis
      // Tambah delay kecil untuk menunjukkan refresh indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing:', error);
      showNotification("Gagal memuat ulang data", "error");
    }
    setRefreshing(false);
  }, [showNotification]);

  /**
   * Memfilter daftar resi berdasarkan tab yang aktif
   * 
   * @param {Array} resiData - Array data resi
   * @param {string} tab - Tab aktif ("aktif" atau "riwayat")
   * @returns {Array} Array resi yang sudah difilter
   */
  const filterResiList = (resiData, tab) => {
    if (tab === "aktif") {
      // Tab aktif: paket yang sedang dikirim atau sudah tiba (belum diambil)
      return resiData.filter(resi => 
        resi.status === "Sedang Dikirim" || resi.status === "Telah Tiba"
      );
    } else {
      // Tab riwayat: paket yang sudah diambil
      return resiData.filter(resi => resi.status === "Sudah Diambil");
    }
  };

  /**
   * Menghitung dan memperbarui berbagai counter statistik resi
   * 
   * @param {Array} resiData - Array data resi untuk dihitung
   */
  const updateCounts = (resiData) => {
    // Filter resi berdasarkan status aktif (Sedang Dikirim + Telah Tiba)
    const activeResis = resiData.filter(resi => 
      resi.status === "Sedang Dikirim" || resi.status === "Telah Tiba"
    );
    
    // Filter resi berdasarkan status riwayat (Sudah Diambil)
    const historyResis = resiData.filter(resi => resi.status === "Sudah Diambil");
    
    // Filter resi milik user yang sedang login
    const userResis = resiData.filter(resi => resi.userId === currentUser?.uid);
    
    // Filter semua resi COD (untuk statistik total)
    const codResis = resiData.filter(resi => resi.tipePaket === 'COD');
    
    // Filter resi COD yang aktif (untuk batasan maksimal 5)
    const activeCodResis = activeResis.filter(resi => resi.tipePaket === 'COD');

    // Update semua counter
    setActiveResiCount(activeResis.length);
    setHistoryResiCount(historyResis.length);
    setUserResiCount(userResis.length);
    setTotalResiCount(resiData.length);
    setCodResiCount(codResis.length);
    setActiveCodResiCount(activeCodResis.length); // PENTING: Untuk validasi batas COD
  };

  /**
   * Effect untuk setup real-time listener untuk data resi
   * Akan otomatis update ketika ada perubahan data di Firebase
   */
  useEffect(() => {
    const unsubscribe = resiService.subscribeToResiList((result) => {
      if (result.success) {
        // Update data resi dari real-time listener
        setResiList(result.data);
        // Hitung ulang semua statistik
        updateCounts(result.data);
        // Filter data sesuai tab aktif
        setFilteredResiList(filterResiList(result.data, activeTab));
      } else {
        showNotification("Gagal memuat data resi", "error");
      }
      setLoading(false);
    });

    // Cleanup subscription saat component unmount
    return () => unsubscribe();
  }, [currentUser]);

  /**
   * Effect untuk memperbarui filter saat tab atau data berubah
   */
  useEffect(() => {
    setFilteredResiList(filterResiList(resiList, activeTab));
  }, [activeTab, resiList]);

  /**
   * Effect untuk memuat data kapasitas box dari sensor ESP32
   * Diperlukan untuk validasi paket Non-COD
   */
  useEffect(() => {
    const loadCapacityData = async () => {
      const result = await getCapacityData();
      if (result.success) {
        setCapacityData(result.data);
      }
    };
    loadCapacityData();
  }, []);

  /**
   * Handler untuk menambah resi baru dengan validasi business logic
   * 
   * Validasi yang dilakukan:
   * 1. User harus login
   * 2. COD: Maksimal 5 paket COD aktif secara global
   * 3. Non-COD: Kapasitas box tidak boleh lebih dari 90%
   * 
   * @param {object} resiData - Data resi dari form
   */
  const handleAddResi = async (resiData) => {
    // Validasi autentikasi
    if (!currentUser) {
      showNotification("Anda harus login terlebih dahulu", "error");
      return;
    }

    // BUSINESS LOGIC: Validasi batas COD (maksimal 5 paket COD aktif untuk semua user)
    if (resiData.tipePaket === 'COD' && activeCodResiCount >= 5) {
      showNotification("Sudah mencapai batas maksimal 5 paket COD aktif untuk semua user", "error");
      return;
    }

    // BUSINESS LOGIC: Validasi kapasitas box untuk paket Non-COD saja
    if (resiData.tipePaket === 'Non-COD' && capacityData) {
      const capacityStatus = calculateCapacityStatus(capacityData.height, capacityData.maxHeight);
      if (capacityStatus.percentage >= 90) {
        showNotification("Kapasitas box sudah penuh, tidak bisa menambah paket Non-COD lagi", "error");
        return;
      }
    }

    setAddingResi(true);
    
    try {
      // Persiapkan data resi dengan informasi user
      const resiToAdd = {
        ...resiData,
        nama: userProfile?.nama || currentUser?.email || "Unknown", // Nama pemilik
        userId: currentUser?.uid,     // ID user untuk ownership
        userEmail: currentUser?.email, // Email user untuk referensi
      };
      
      // Kirim ke service untuk disimpan ke Firebase
      const result = await resiService.addResi(resiToAdd);

      if (result.success) {
        showNotification("Resi berhasil ditambahkan", "success");
        setShowAddModal(false); // Tutup modal setelah berhasil
      } else {
        showNotification("Gagal menambahkan resi: " + (result.error || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error in handleAddResi:", error);
      showNotification("Terjadi kesalahan: " + error.message, "error");
    }
    
    setAddingResi(false);
  };

  /**
   * Handler untuk mengedit resi dengan validasi ownership
   * 
   * @param {object} resiData - Data resi yang sudah diedit
   */
  const handleEditResi = async (resiData) => {
    // Validasi state dan autentikasi
    if (!currentUser || !selectedResi) {
      showNotification("Terjadi kesalahan saat mengedit resi", "error");
      return;
    }

    // SECURITY: Validasi ownership - hanya pemilik yang bisa edit
    if (selectedResi.userId !== currentUser.uid) {
      showNotification("Anda hanya bisa mengedit resi milik Anda sendiri", "error");
      return;
    }

    setEditingResi(true);
    
    try {
      // Update resi melalui service
      const result = await resiService.updateResi(selectedResi.id, resiData);

      if (result.success) {
        showNotification("Resi berhasil diperbarui", "success");
        setShowEditModal(false); // Tutup modal
        setSelectedResi(null);   // Reset selected resi
      } else {
        showNotification("Gagal memperbarui resi: " + (result.error || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error in handleEditResi:", error);
      showNotification("Terjadi kesalahan: " + error.message, "error");
    }
    
    setEditingResi(false);
  };

  /**
   * Membuka modal edit dengan validasi ownership
   * 
   * @param {object} resi - Data resi yang akan diedit
   */
  const openEditModal = (resi) => {
    // SECURITY: Validasi ownership sebelum membuka modal edit
    if (resi.userId !== currentUser?.uid) {
      showNotification("Anda hanya bisa mengedit resi milik Anda sendiri", "error");
      return;
    }
    setSelectedResi(resi);    // Set resi yang dipilih
    setShowEditModal(true);   // Buka modal edit
  };

  /**
   * Handler untuk menghapus resi dengan konfirmasi dan validasi ownership
   * 
   * @param {string} resiId - ID resi yang akan dihapus
   * @param {string} resiUserId - ID user pemilik resi
   */
  const handleDeleteResi = (resiId, resiUserId) => {
    // SECURITY: Validasi ownership sebelum menghapus
    if (resiUserId !== currentUser?.uid) {
      showNotification("Anda hanya bisa menghapus resi milik Anda sendiri", "error");
      return;
    }

    // Konfirmasi penghapusan dengan alert
    Alert.alert(
      "Hapus Resi",
      "Apakah Anda yakin ingin menghapus resi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            // Proses penghapusan melalui service
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

  /**
   * Handler untuk menampilkan QR Code dengan validasi ownership
   * QR Code digunakan untuk kontrol loker pada paket COD
   * 
   * @param {object} resi - Data resi untuk QR code
   */
  const handleShowQRCode = (resi) => {
    // SECURITY: Hanya pemilik yang bisa melihat QR code
    if (resi.userId !== currentUser?.uid) {
      showNotification("Anda hanya bisa melihat QR code resi milik Anda sendiri", "error");
      return;
    }
    setSelectedResiForQR(resi); // Set resi untuk QR code
    setShowQRModal(true);       // Buka modal QR code
  };

  /**
   * Render item resi dalam FlatList
   * 
   * @param {object} param0 - Object dengan property item dari FlatList
   * @returns {JSX.Element} Komponen card resi
   */
  const renderResiItem = ({ item }) => {
    // Cek apakah user adalah pemilik resi
    const isOwner = item.userId === currentUser?.uid;
    // Cek apakah paket adalah tipe COD
    const isCODPackage = item.tipePaket === 'COD';
    // Card bisa diklik jika user adalah pemilik dan paket COD (untuk kontrol loker)
    const isClickable = isOwner && isCODPackage;
    
    // Gunakan TouchableOpacity jika clickable, View jika tidak
    const CardComponent = isClickable ? TouchableOpacity : View;
    
    return (
      <CardComponent 
        style={[styles.resiCard, { backgroundColor: colors.white, shadowColor: colors.shadow.color }]}
        onPress={isClickable ? () => handleShowQRCode(item) : undefined}
        activeOpacity={isClickable ? 0.7 : 1}
      >
        <View style={styles.resiHeader}>
          <View style={styles.resiInfo}>
            <Text style={[styles.namaText, { color: colors.gray900 }]}>{item.nama}</Text>
            {isOwner && (
              <Text style={[styles.ownerBadge, { color: colors.primary }]}>Milik Anda</Text>
            )}
          </View>
          <View style={styles.rightSection}>
            {/* Tombol QR - Hanya tampil untuk paket COD milik user */}
            {isCODPackage && isOwner && (
              <TouchableOpacity
                onPress={() => handleShowQRCode(item)}
                style={styles.qrButton}
              >
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
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
        <View style={styles.resiContent}>
          <Text style={[styles.noResiText, { color: colors.gray600 }]}>
            No. Resi: {item.noResi}
          </Text>
          
          {/* Informasi Nomor Loker - Hanya tampil untuk paket COD yang sudah dapat loker */}
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
          {/* Hint text - Petunjuk untuk paket COD milik user */}
          {isCODPackage && isOwner && (
            <View style={styles.qrHint}>
              <Ionicons name="cube-outline" size={16} color={colors.gray400} />
              <Text style={[styles.qrHintText, { color: colors.gray400 }]}>
                Tap untuk kontrol loker
              </Text>
            </View>
          )}
        </View>
      </CardComponent>
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