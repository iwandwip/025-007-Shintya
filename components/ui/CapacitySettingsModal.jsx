/**
 * CapacitySettingsModal - Modal untuk mengatur mode tampilan kapasitas
 * 
 * Modal ini memungkinkan pengguna untuk memilih mode tampilan data kapasitas:
 * - Mode Height: Menampilkan data ketinggian dalam cm dari sensor ultrasonik
 * - Mode Percentage: Menampilkan persentase langsung yang dikirim ESP32
 * 
 * Fitur:
 * - Toggle mode tampilan dengan radio button
 * - Penjelasan untuk setiap mode
 * - Persistensi pengaturan melalui SettingsContext
 * - UI responsif dengan animasi smooth
 * - Konfirmasi perubahan dengan feedback visual
 * 
 * @component CapacitySettingsModal
 * @param {Object} props
 * @param {boolean} props.visible - Status visibility modal
 * @param {Function} props.onClose - Function untuk menutup modal
 * @returns {JSX.Element} Modal pengaturan mode kapasitas
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { getThemeByRole } from '../../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CapacitySettingsModal = ({ visible, onClose }) => {
  const { capacityDisplayMode, enableHeightConversion, changeCapacityDisplayMode, changeHeightConversion } = useSettings();
  const colors = getThemeByRole(false); // Selalu gunakan user theme
  
  // State untuk mode yang dipilih sementara (sebelum disimpan)
  const [selectedMode, setSelectedMode] = useState(capacityDisplayMode);
  
  // State untuk opsi konversi height yang dipilih sementara (sebelum disimpan)
  const [selectedHeightConversion, setSelectedHeightConversion] = useState(enableHeightConversion);
  
  // Animation untuk modal entrance
  const [scaleAnim] = useState(new Animated.Value(0));
  
  React.useEffect(() => {
    if (visible) {
      // Reset selected mode ke mode saat ini
      setSelectedMode(capacityDisplayMode);
      // Reset selected height conversion ke setting saat ini
      setSelectedHeightConversion(enableHeightConversion);
      // Animate modal masuk
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate modal keluar
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, capacityDisplayMode, enableHeightConversion]);

  /**
   * Handle pemilihan mode tampilan kapasitas
   * @param {string} mode - Mode yang dipilih ("height" atau "percentage")
   */
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  /**
   * Handle penyimpanan pengaturan dan menutup modal
   */
  const handleSave = async () => {
    try {
      // Simpan mode yang dipilih melalui SettingsContext
      await changeCapacityDisplayMode(selectedMode);
      
      // Simpan opsi konversi height melalui SettingsContext
      await changeHeightConversion(selectedHeightConversion);
      
      // Tutup modal setelah berhasil menyimpan
      onClose();
    } catch (error) {
      console.error('Error saving capacity settings:', error);
      // Tetap tutup modal meskipun ada error
      onClose();
    }
  };

  /**
   * Handle pembatalan dan reset ke pengaturan sebelumnya
   */
  const handleCancel = () => {
    // Reset ke mode sebelumnya
    setSelectedMode(capacityDisplayMode);
    // Reset ke opsi konversi sebelumnya
    setSelectedHeightConversion(enableHeightConversion);
    onClose();
  };

  /**
   * Render option untuk mode tampilan
   * @param {string} mode - Mode ("height" atau "percentage")
   * @param {string} title - Judul mode
   * @param {string} description - Deskripsi mode
   * @param {string} example - Contoh tampilan
   */
  const renderModeOption = (mode, title, description, example) => {
    const isSelected = selectedMode === mode;
    
    return (
      <TouchableOpacity
        style={[
          styles.modeOption,
          {
            backgroundColor: isSelected ? colors.primary + '15' : colors.white,
            borderColor: isSelected ? colors.primary : colors.gray200,
          }
        ]}
        onPress={() => handleModeSelect(mode)}
        activeOpacity={0.7}
      >
        {/* Radio button */}
        <View style={styles.modeHeader}>
          <View style={[
            styles.radioButton,
            { borderColor: isSelected ? colors.primary : colors.gray300 }
          ]}>
            {isSelected && (
              <View style={[
                styles.radioButtonInner,
                { backgroundColor: colors.primary }
              ]} />
            )}
          </View>
          <Text style={[
            styles.modeTitle,
            { 
              color: isSelected ? colors.primary : colors.gray900,
              fontWeight: isSelected ? '600' : '500'
            }
          ]}>
            {title}
          </Text>
        </View>
        
        {/* Deskripsi mode */}
        <Text style={[styles.modeDescription, { color: colors.gray600 }]}>
          {description}
        </Text>
        
        {/* Contoh tampilan */}
        <View style={[styles.exampleContainer, { backgroundColor: colors.gray50 }]}>
          <Text style={[styles.exampleLabel, { color: colors.gray500 }]}>
            Contoh tampilan:
          </Text>
          <Text style={[styles.exampleValue, { color: colors.gray700 }]}>
            {example}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.white,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Header modal - Fixed */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.gray900 }]}>
                Pengaturan Tampilan Kapasitas
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.gray600 }]}>
                Pilih cara menampilkan data kapasitas dari ESP32
              </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              {/* Mode options */}
              <View style={styles.modesContainer}>
                {renderModeOption(
                  'height',
                  '📏 Mode Ketinggian',
                  'Menampilkan ketinggian paket dalam cm. ESP32 mengirim data sensor ultrasonik, aplikasi menghitung persentase.',
                  'Ketinggian: 22 cm → Persentase: 73.3%'
                )}

                {renderModeOption(
                  'percentage',
                  '📊 Mode Persentase',
                  'Menampilkan persentase langsung dari ESP32. ESP32 menghitung persentase internal dan mengirim hasilnya.',
                  'Persentase: 75% (langsung dari ESP32)'
                )}
              </View>

              {/* Toggle konversi height untuk mode percentage */}
              {selectedMode === 'percentage' && (
                <View style={[styles.conversionToggleContainer, { backgroundColor: colors.gray50 }]}>
                  <Text style={[styles.conversionToggleTitle, { color: colors.gray900 }]}>
                    Opsi Konversi Balik
                  </Text>
                  <Text style={[styles.conversionToggleDescription, { color: colors.gray600 }]}>
                    Ketika ESP32 mengirim persentase, konversi balik ke ketinggian untuk tampilan lengkap
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      {
                        backgroundColor: selectedHeightConversion ? colors.primary + '15' : colors.white,
                        borderColor: selectedHeightConversion ? colors.primary : colors.gray200,
                      }
                    ]}
                    onPress={() => setSelectedHeightConversion(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toggleHeader}>
                      <View style={[
                        styles.radioButton,
                        { borderColor: selectedHeightConversion ? colors.primary : colors.gray300 }
                      ]}>
                        {selectedHeightConversion && (
                          <View style={[
                            styles.radioButtonInner,
                            { backgroundColor: colors.primary }
                          ]} />
                        )}
                      </View>
                      <Text style={[
                        styles.toggleTitle,
                        { 
                          color: selectedHeightConversion ? colors.primary : colors.gray900,
                          fontWeight: selectedHeightConversion ? '600' : '500'
                        }
                      ]}>
                        ✅ Aktifkan Konversi Balik
                      </Text>
                    </View>
                    <Text style={[styles.toggleDescription, { color: colors.gray600 }]}>
                      Tampilkan kedua data: persentase dari ESP32 + ketinggian hasil konversi
                    </Text>
                    <View style={[styles.exampleContainer, { backgroundColor: colors.gray50 }]}>
                      <Text style={[styles.exampleLabel, { color: colors.gray500 }]}>
                        Contoh:
                      </Text>
                      <Text style={[styles.exampleValue, { color: colors.gray700 }]}>
                        ESP32: 75% → Tinggi: 22.5cm (dihitung)
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      {
                        backgroundColor: !selectedHeightConversion ? colors.primary + '15' : colors.white,
                        borderColor: !selectedHeightConversion ? colors.primary : colors.gray200,
                      }
                    ]}
                    onPress={() => setSelectedHeightConversion(false)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toggleHeader}>
                      <View style={[
                        styles.radioButton,
                        { borderColor: !selectedHeightConversion ? colors.primary : colors.gray300 }
                      ]}>
                        {!selectedHeightConversion && (
                          <View style={[
                            styles.radioButtonInner,
                            { backgroundColor: colors.primary }
                          ]} />
                        )}
                      </View>
                      <Text style={[
                        styles.toggleTitle,
                        { 
                          color: !selectedHeightConversion ? colors.primary : colors.gray900,
                          fontWeight: !selectedHeightConversion ? '600' : '500'
                        }
                      ]}>
                        🚫 Nonaktifkan Konversi
                      </Text>
                    </View>
                    <Text style={[styles.toggleDescription, { color: colors.gray600 }]}>
                      Tampilkan hanya persentase langsung dari ESP32, tanpa konversi
                    </Text>
                    <View style={[styles.exampleContainer, { backgroundColor: colors.gray50 }]}>
                      <Text style={[styles.exampleLabel, { color: colors.gray500 }]}>
                        Contoh:
                      </Text>
                      <Text style={[styles.exampleValue, { color: colors.gray700 }]}>
                        ESP32: 75% (tanpa data ketinggian)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Info tambahan */}
              <View style={[styles.infoContainer, { backgroundColor: colors.blue50 }]}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={[styles.infoText, { color: colors.gray700 }]}>
                  Mode ini mengatur bagaimana data ditampilkan di aplikasi. 
                  ESP32 tetap dapat mengirim kedua jenis data sesuai konfigurasi hardware.
                </Text>
              </View>
            </ScrollView>

            {/* Action buttons - Fixed at bottom */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.gray300 }
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.gray700 }]}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  Simpan Pengaturan
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flex: 0,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modesContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 16,
  },
  modeOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modeTitle: {
    fontSize: 16,
    flex: 1,
  },
  modeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  exampleContainer: {
    padding: 12,
    borderRadius: 8,
  },
  exampleLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  exampleValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  conversionToggleContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  conversionToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  conversionToggleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  toggleOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 15,
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CapacitySettingsModal;