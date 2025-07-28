# DOKUMENTASI GEMIL TRANSMITTER
## Sistem Deteksi Mikroplastik - Node Sensor

### **Penulis: Faiz Gemilang Ramadhan**
### **Versi: 1.0 (Node Sensor ESP32)**

---

## 📚 DAFTAR ISI

- **[CHEAT SHEET SIDANG](#cheat-sheet-sidang)** (Quick Reference untuk Sidang)
- **[BAB I: OVERVIEW STRUKTUR FIRMWARE](#bab-i-overview-struktur-firmware)**
- **[BAB II: ANALISIS ENTRY POINT](#bab-ii-analisis-entry-point)**
- **[BAB III: ANALISIS RTOS DUAL-CORE](#bab-iii-analisis-rtos-dual-core)**
- **[BAB IV: ANALISIS SISTEM SENSOR](#bab-iv-analisis-sistem-sensor)**
- **[BAB V: ANALISIS DECISION TREE](#bab-v-analisis-decision-tree)**
- **[BAB VI: ANALISIS ESP-NOW COMMUNICATION](#bab-vi-analisis-esp-now-communication)**

---

## 🔥 CHEAT SHEET SIDANG
### Quick Reference untuk Menjawab Pertanyaan Dosen

#### **❓ PERTANYAAN STRUKTUR KODE:**

**Q: "Entry point program dimana?"**  
✅ **A**: "File `GemilTransmitter.ino:22-31`, fungsi `setup()` line 24 Serial.begin(115200), line 30 setupRTOS(). Entry point sistem sensor node"

**Q: "Mengapa pakai dual-core RTOS?"**  
✅ **A**: "File `RTOS.ino:94-124`, Core 0 untuk ESP-NOW communication (taskCommunication), Core 1 untuk sensor reading (taskSensorControl). Mencegah komunikasi lag pengaruhi pembacaan sensor"

**Q: "Sensor apa saja yang dipakai?"**  
✅ **A**: "library.h:19-67 - 3 sensor: pH (pin 34), TDS (pin 36), UV (pin 39). pH untuk keasaman, TDS untuk mineral terlarut, UV untuk indeks ultraviolet"

**Q: "Decision tree logic ada dimana?"**  
✅ **A**: "File `sensor.ino:189-279`, fungsi evaluateMicroplasticLevel() mengklasifikasi pH/TDS/UV ke kategori, lalu logika pohon keputusan tentukan level Rendah/Sedang/Tinggi"

**Q: "ESP-NOW untuk apa?"**  
✅ **A**: "File `espNowProtocol.ino:24-100`, komunikasi nirkabel ke GemilReceiver dengan MAC B0:A7:32:F3:13:F8. Kirim struct SensorDataPacket setiap 100ms"

#### **❓ PERTANYAAN ALGORITMA & SENSOR:**

**Q: "Algoritma pembacaan sensor pH gimana?"**  
✅ **A**: "sensor.ino:108-150, buffer 10 sampel, buang 20% nilai ekstrim, rata-rata 6 nilai tengah, konversi ADC ke voltage lalu ke pH dengan kalibrasi 15.5"

**Q: "TDS sensor pakai algoritma apa?"**  
✅ **A**: "sensor.ino:24-61, ambil 30 sampel, filter median untuk buang noise, kompensasi temperatur 25°C, konversi polynomial ke ppm"

**Q: "Decision tree rulenya apa?"**  
✅ **A**: "Rendah: pH Normal + TDS Baik + UV Sedikit. Tinggi: UV Banyak + TDS Tinggi/Sedang. Sisanya Sedang. Total 9 kombinasi kondisi"

**Q: "Memory management gimana?"**  
✅ **A**: "RTOS.ino:98,118 stack 10KB per task, total 20KB dari 520KB SRAM ESP32. Buffer sensor: pH[10], TDS[30], UV filtered value"

---

## BAB I: OVERVIEW STRUKTUR FIRMWARE

### 1.1 Arsitektur Node Sensor

**GemilTransmitter** adalah node sensor dalam sistem deteksi mikroplastik yang bertanggung jawab untuk:
- Membaca data dari 3 sensor (pH, TDS, UV)
- Mengklasifikasi level mikroplastik menggunakan Decision Tree
- Mengirim data melalui ESP-NOW ke bridge node
- Menampilkan data real-time di LCD

## Struktur File dan Fungsi

### 1. GemilTransmitter.ino (File Utama)
**Fungsi Utama:**
- `setup()`: Inisialisasi sistem dan memulai RTOS
- `loop()`: Kosong karena semua logika ditangani oleh FreeRTOS tasks

**Istilah Teknis:**
- **FreeRTOS**: Sistem operasi real-time untuk mikrokontroler
- **Task**: Unit kerja independen yang berjalan secara paralel
- **Dual-core**: Dua processor core yang dapat menjalankan tugas secara bersamaan

### 2. library.h (Konfigurasi dan Definisi)
**Konstanta dan Konfigurasi:**

#### Sensor pH
```cpp
const float PH_CALIBRATION_VALUE = 15.5;  // Nilai kalibrasi untuk akurasi pembacaan
const int PH_SENSOR_PIN = 34;             // Pin ADC (Analog-to-Digital Converter)
const int PH_BUFFER_SIZE = 10;            // Buffer untuk averaging dan filtering
```

#### Sensor TDS (Total Dissolved Solids)
```cpp
const int TDS_SENSOR_PIN = 36;               // Pin ADC untuk sensor TDS
const float TDS_VOLTAGE_REF = 3.3;           // Tegangan referensi ESP32 (3.3V)
const int TDS_SAMPLE_COUNT = 30;             // Jumlah sampel untuk median filtering
const float TDS_TEMPERATURE_DEFAULT = 25.0;  // Suhu default untuk kompensasi
```

#### Sensor UV (Ultraviolet)
```cpp
const int UV_SENSOR_PIN = 39;             // Pin ADC untuk sensor UV
const float UV_FILTER_ALPHA = 0.1;        // Koefisien low-pass filter (0.0-1.0)
```

#### Struktur Data ESP-NOW
```cpp
typedef struct SensorDataPacket {
  float phValue;                                    // Nilai pH air
  float tdsValue;                                   // Nilai TDS dalam ppm
  float uvValue;                                    // Nilai indeks UV
  char microplasticLevel[MICROPLASTIC_LEVEL_SIZE];  // "Rendah", "Sedang", "Tinggi"
} SensorDataPacket;
```

**Istilah Teknis:**
- **ADC (Analog-to-Digital Converter)**: Mengkonversi sinyal analog sensor menjadi nilai digital
- **Buffer**: Area memori sementara untuk menyimpan data sebelum diproses
- **Typedef struct**: Mendefinisikan struktur data kustom dalam bahasa C
- **Low-pass filter**: Filter yang meloloskan frekuensi rendah, mengurangi noise
- **Median filtering**: Teknik filtering dengan mengambil nilai tengah dari sekelompok data

### 3. RTOS.ino (Manajemen Task)
**Fungsi Utama:**

#### setupRTOS()
Menginisialisasi kedua task FreeRTOS:
- `createCommunicationTask()`: Membuat task komunikasi di Core 0
- `createSensorControlTask()`: Membuat task kontrol sensor di Core 1

#### Task Functions
```cpp
void taskCommunication(void *pvParameters);    // Task ESP-NOW di Core 0
void taskSensorControl(void *pvParameters);    // Task sensor+LCD di Core 1
```

#### Task Creation
```cpp
xTaskCreatePinnedToCore(
    taskFunction,        // Pointer ke fungsi task
    "TaskName",         // Nama task untuk debugging
    10000,              // Stack size dalam bytes
    NULL,               // Parameter yang diteruskan ke task
    priority,           // Prioritas task (1-N)
    &taskHandle,        // Handle untuk task control
    coreNumber);        // Core yang menjalankan task (0 atau 1)
```

**Istilah Teknis:**
- **xTaskCreatePinnedToCore**: Fungsi FreeRTOS untuk membuat task pada core tertentu
- **Stack size**: Ukuran memori yang dialokasikan untuk task
- **Task Handle**: Pointer untuk mengontrol dan memantau task
- **vTaskDelay**: Fungsi untuk menunda eksekusi task (non-blocking)
- **portTICK_PERIOD_MS**: Konstanta untuk konversi ms ke tick FreeRTOS

### 4. sensor.ino (Pembacaan Sensor dan Decision Tree)

#### Pembacaan Sensor pH
**Algoritma:**
1. **Buffer Sampling**: Mengumpulkan 10 sampel dalam buffer
2. **Outlier Removal**: Mengurutkan dan membuang 20% nilai terendah/tertinggi
3. **Averaging**: Menghitung rata-rata dari 60% nilai tengah
4. **Calibration**: Mengkonversi ADC ke pH menggunakan rumus kalibrasi

```cpp
void readPhSensor() {
    // Sampling berkala setiap 30ms
    if (currentTime - phLastReadTime >= PH_READ_INTERVAL_MS) {
        phSensorBuffer[phBufferIndex] = analogRead(PH_SENSOR_PIN);
        // Buffer management dan outlier removal
        // Kalkulasi: pH = -5.70 * voltage + PH_CALIBRATION_VALUE
    }
}
```

#### Pembacaan Sensor TDS
**Algoritma:**
1. **Sampling**: Mengumpulkan 30 sampel dalam interval 40ms
2. **Median Filtering**: Menggunakan `getMedianValue()` untuk mengurangi noise
3. **Temperature Compensation**: Koreksi suhu menggunakan faktor kompensasi
4. **Polynomial Calculation**: Menghitung TDS menggunakan persamaan kubik

```cpp
float temperatureCompensation = 1.0 + 0.02 * (waterTemperature - 25.0);
tdsValue = (133.42 * voltage³ - 255.86 * voltage² + 857.39 * voltage) * 0.25;
```

#### Pembacaan Sensor UV
**Algoritma:**
1. **ADC to Voltage**: Konversi nilai ADC ke tegangan
2. **Photocurrent Calculation**: Menghitung arus foto dari sensor
3. **UV Index**: Konversi ke indeks UV menggunakan rumus kalibrasi
4. **Low-pass Filtering**: Smoothing dengan filter alpha = 0.1

```cpp
float photocurrent = (voltage / UV_RESISTOR_VALUE) * 1000.0;
float uvIndex = (photocurrent - 83) / 21.0;
uvFilteredValue = UV_FILTER_ALPHA * uvIndex + (1 - UV_FILTER_ALPHA) * uvFilteredValue;
```

#### Decision Tree Algorithm
**Klasifikasi Parameter:**
- **pH**: Asam (<6.0), Normal (6.0-8.0), Basa (>8.0)
- **TDS**: Baik (<200), Sedang (200-500), Banyak (>500)
- **UV**: Sedikit (<1.0), Sedang (1.0-2.0), Banyak (>2.0)

**Logika Keputusan:**
```cpp
String classifyPhLevel(float ph);   // Klasifikasi kategori pH
String classifyTdsLevel(float tds); // Klasifikasi kategori TDS  
String classifyUvLevel(float uv);   // Klasifikasi kategori UV

bool isLowMicroplasticCondition(String ph, String tds, String uv);
bool isMediumMicroplasticCondition(String uv);
bool isHighMicroplasticCondition(String uv, String tds);
```

**Aturan Decision Tree:**
- **Rendah**: Kombinasi optimal (pH normal + TDS baik + UV rendah)
- **Sedang**: Kondisi menengah atau default
- **Tinggi**: UV tinggi dengan TDS tinggi/sedang

**Istilah Teknis:**
- **Outlier**: Data yang secara signifikan berbeda dari data lainnya
- **Median filtering**: Mengambil nilai tengah setelah sorting untuk mengurangi noise
- **Temperature compensation**: Koreksi nilai sensor berdasarkan suhu lingkungan
- **Polynomial equation**: Persamaan matematika dengan pangkat tinggi
- **Low-pass filter**: Filter yang meloloskan sinyal frekuensi rendah
- **Decision Tree**: Algoritma klasifikasi menggunakan aturan if-then

### 5. display.ino (Kontrol LCD)

#### Inisialisasi LCD
```cpp
void setupDisplay() {
    lcd.init();       // Inisialisasi komunikasi I2C
    lcd.backlight();  // Mengaktifkan lampu latar
    // Menampilkan splash screen
}
```

#### Anti-Flickering System
```cpp
String lastDisplayedText[LCD_ROWS];  // Menyimpan teks terakhir
void displayTextAtPosition(int column, int row, String text) {
    if (lastDisplayedText[row] != text) {  // Hanya update jika berbeda
        clearRow(row);                     // Bersihkan baris
        lcd.print(formatTextForDisplay(text)); // Tampilkan teks baru
    }
}
```

#### Format Data
**Baris 1**: `pH:X.XX|TDS:Y.Y`
**Baris 2**: `UV:Z.Z|Level`

```cpp
String formatSensorLine(String label1, float value1, String label2, float value2);
String formatResultLine(String uvLabel, float uvVal, char* result);
```

**Istilah Teknis:**
- **I2C (Inter-Integrated Circuit)**: Protocol komunikasi serial untuk perangkat
- **LCD Address 0x27**: Alamat I2C untuk modul LCD controller
- **Flickering**: Kedipan layar akibat refresh yang terlalu sering
- **Buffer management**: Pengelolaan area memori untuk data sementara
- **snprintf**: Fungsi C untuk formatting string dengan buffer size safety

### 6. espNowProtocol.ino (Komunikasi ESP-NOW)

#### Inisialisasi ESP-NOW
```cpp
void setupEspNowCommunication() {
    WiFi.mode(WIFI_STA);              // Set WiFi ke Station mode
    esp_now_init();                   // Inisialisasi ESP-NOW protocol
    esp_now_register_send_cb(onDataSent); // Register callback function
    addReceiverPeer();                // Tambahkan peer receiver
}
```

#### Peer Management
```cpp
bool addReceiverPeer() {
    esp_now_peer_info_t receiverPeer = {};
    memcpy(receiverPeer.peer_addr, RECEIVER_MAC_ADDRESS, 6);
    receiverPeer.channel = 0;      // Channel WiFi
    receiverPeer.encrypt = false;  // Tanpa enkripsi
    return (esp_now_add_peer(&receiverPeer) == ESP_OK);
}
```

#### Data Transmission
```cpp
void transmitSensorData() {
    prepareSensorDataPacket();  // Siapkan data
    esp_now_send(RECEIVER_MAC_ADDRESS, 
                (uint8_t *)&sensorDataToSend, 
                sizeof(sensorDataToSend));
}
```

#### Callback Function
```cpp
void onDataSent(const uint8_t *macAddress, esp_now_send_status_t deliveryStatus) {
    Serial.println(deliveryStatus == ESP_NOW_SEND_SUCCESS ? "BERHASIL" : "GAGAL");
}
```

**Istilah Teknis:**
- **ESP-NOW**: Protocol komunikasi peer-to-peer ESP32 tanpa WiFi router
- **WIFI_STA**: WiFi Station mode (sebagai client, bukan access point)
- **MAC Address**: Alamat unik hardware untuk identifikasi perangkat
- **Peer**: Perangkat lain dalam jaringan ESP-NOW
- **Callback function**: Fungsi yang dipanggil otomatis saat event terjadi
- **memcpy**: Fungsi C untuk menyalin data dalam memori
- **sizeof**: Operator C untuk mendapatkan ukuran data dalam bytes

## Timing dan Interval

### Interval Pembacaan Sensor
- **pH**: 30ms per sampel, buffer 10 sampel
- **TDS**: 40ms per sampel, 800ms per kalkulasi, 30 sampel
- **UV**: 100ms per pembacaan dengan filtering

### Interval Komunikasi
- **ESP-NOW**: 100ms per transmisi data
- **LCD Update**: Real-time berdasarkan perubahan data

### Task Management
- **Communication Task**: 100ms delay antar iterasi
- **Sensor Control Task**: Non-blocking, continuous reading

## Konfigurasi Hardware

### Pin Assignment
- **pH Sensor**: Pin 34 (ADC1_CH6)
- **TDS Sensor**: Pin 36 (ADC1_CH0) 
- **UV Sensor**: Pin 39 (ADC1_CH3)
- **LCD I2C**: SDA/SCL default ESP32, Address 0x27

### Spesifikasi Sensor
- **ADC Resolution**: 12-bit (0-4095)
- **Reference Voltage**: 3.3V
- **LCD**: 16x2 characters, I2C interface

## Error Handling dan Debugging

### Serial Output
- Informasi inisialisasi sistem
- Status ESP-NOW transmission
- Nilai UV untuk monitoring
- Serial command support ('r'/'R' untuk restart)

### Failsafe Mechanisms
- Buffer overflow protection
- Invalid sensor reading handling
- ESP-NOW connection recovery
- LCD anti-flickering system

**Istilah Teknis:**
- **ADC Resolution**: Jumlah bit untuk presisi konversi analog-digital
- **Reference voltage**: Tegangan standar untuk kalkulasi ADC
- **Buffer overflow**: Kondisi ketika data melebihi kapasitas buffer
- **Failsafe**: Mekanisme keamanan untuk mencegah kegagalan sistem

## Flow Data Sistem

```
Sensor Reading → Buffer/Filtering → Decision Tree → LCD Display
                                        ↓
                                  Data Packet → ESP-NOW → Receiver
```

1. **Input**: Sensor pH, TDS, UV menghasilkan sinyal analog
2. **Processing**: ADC conversion → Filtering → Calibration
3. **Classification**: Decision tree mengklasifikasikan level mikroplastik  
4. **Output**: LCD display + ESP-NOW transmission ke receiver
5. **Communication**: Data diteruskan ke database melalui receiver

Sistem ini dirancang untuk operasi real-time dengan akurasi tinggi dalam deteksi mikroplastik menggunakan pendekatan multi-sensor dan algoritma decision tree.