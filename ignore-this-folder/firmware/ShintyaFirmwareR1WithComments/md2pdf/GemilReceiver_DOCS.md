# DOKUMENTASI GEMIL RECEIVER
## Sistem Deteksi Mikroplastik - Bridge Node

### **Penulis: Faiz Gemilang Ramadhan**
### **Versi: 1.0 (Bridge Node ESP32)**

---

## 📚 DAFTAR ISI

- **[CHEAT SHEET SIDANG](#cheat-sheet-sidang)** (Quick Reference untuk Sidang)
- **[BAB I: OVERVIEW BRIDGE NODE](#bab-i-overview-bridge-node)**
- **[BAB II: ANALISIS ESP-NOW RECEIVER](#bab-ii-analisis-esp-now-receiver)**
- **[BAB III: ANALISIS SERIAL BRIDGE](#bab-iii-analisis-serial-bridge)**
- **[BAB IV: ANALISIS SISTEM MONITORING](#bab-iv-analisis-sistem-monitoring)**

---

## 🔥 CHEAT SHEET SIDANG
### Quick Reference untuk Menjawab Pertanyaan Dosen

#### **❓ PERTANYAAN STRUKTUR KODE:**

**Q: "Apa fungsi GemilReceiver dalam sistem?"**  
✅ **A**: "Bridge node yang menerima data dari GemilTransmitter via ESP-NOW (line 64), lalu forward ke GemilDatabase via Serial2 (line 120). Protokol jembatan nirkabel ke serial"

**Q: "Data structure apa yang dipakai?"**  
✅ **A**: "line 35-40, typedef struct SensorDataPacket {float phValue, tdsValue, uvValue; char microplasticLevel[10];}. Same structure dengan Transmitter"

**Q: "Format data yang dikirim ke database?"**  
✅ **A**: "line 134-141, format string 'pH:X.XX, TDS:Y.YY, UV:Z.ZZ, Mikroplastik:Level' via Serial2 9600 baud"

#### **❓ PERTANYAAN IMPLEMENTASI:**

**Q: "ESP-NOW callback gimana kerjanya?"**  
✅ **A**: "line 64-77 onSensorDataReceived(), validasi ukuran packet, memcpy data, update statistik, forward ke database"

**Q: "Monitoring sistem gimana?"**  
✅ **A**: "line 230-243 printStatusReport() setiap 30 detik, tampilkan uptime, total packet, timestamp terakhir"

---

## BAB I: OVERVIEW BRIDGE NODE

### 1.1 Peran dalam Sistem

**GemilReceiver** berfungsi sebagai bridge komunikasi antara:
- **Input**: Data sensor dari GemilTransmitter via ESP-NOW (nirkabel)
- **Output**: Forward data ke GemilDatabase via Serial2 (kabel)

## Arsitektur Bridge
Sistem menggunakan arsitektur bridge tunggal dengan dua interface komunikasi:

### Interface Input: ESP-NOW
- **Protokol**: ESP-NOW (peer-to-peer)
- **Sumber**: GemilTransmitter
- **Format**: SensorDataPacket struct
- **Frekuensi**: Real-time reception

### Interface Output: Serial2
- **Protokol**: UART Serial
- **Tujuan**: GemilDatabase
- **Format**: String format "pH:x.xx, TDS:x.xx, UV:x.xx, Mikroplastik:Level"
- **Baud Rate**: 9600
- **Pin**: RX=16, TX=17

## Struktur Kode

### 1. Konstanta Komunikasi
```cpp
const int USB_SERIAL_BAUD_RATE = 115199;   // Serial debug ke komputer
const int BRIDGE_SERIAL_BAUD_RATE = 9600;  // Serial ke GemilDatabase
const int SERIAL_RX_PIN = 16;              // Pin RX untuk Serial2
const int SERIAL_TX_PIN = 17;              // Pin TX untuk Serial2
const int MICROPLASTIC_LEVEL_SIZE = 10;    // Buffer size untuk string level
```

**Istilah Teknis:**
- **Baud Rate**: Kecepatan transmisi data dalam bit per detik
- **UART (Universal Asynchronous Receiver/Transmitter)**: Protocol komunikasi serial
- **RX (Receive)**: Pin untuk menerima data serial
- **TX (Transmit)**: Pin untuk mengirimkan data serial

### 2. Struktur Data
```cpp
typedef struct SensorDataPacket {
  float phValue;                                    // Nilai pH
  float tdsValue;                                   // Nilai TDS 
  float uvValue;                                    // Nilai UV
  char microplasticLevel[MICROPLASTIC_LEVEL_SIZE];  // Level mikroplastik
} SensorDataPacket;

SensorDataPacket receivedSensorData;  // Buffer penerimaan data
```

**Istilah Teknis:**
- **Struct**: Struktur data yang menggabungkan beberapa variabel berbeda tipe
- **Buffer**: Area memori sementara untuk menyimpan data
- **Global variable**: Variabel yang dapat diakses dari semua fungsi

### 3. Variabel Statistik
```cpp
unsigned long totalPacketsReceived = 0;  // Counter total paket diterima
unsigned long lastPacketTime = 0;        // Timestamp paket terakhir
```

**Istilah Teknis:**
- **unsigned long**: Tipe data 32-bit untuk nilai positif besar
- **Counter**: Variabel penghitung
- **Timestamp**: Waktu dalam milidetik sejak sistem mulai

## Fungsi-Fungsi Utama

### 1. Callback ESP-NOW Reception
```cpp
void onSensorDataReceived(const uint8_t *senderMacAddress, 
                         const uint8_t *incomingDataBytes, 
                         int dataLength) {
    // Validasi ukuran data
    if (dataLength != sizeof(SensorDataPacket)) {
        Serial.println("ERROR: Ukuran paket data yang diterima tidak valid");
        return;
    }
    
    // Copy data ke struct
    memcpy(&receivedSensorData, incomingDataBytes, sizeof(receivedSensorData));
    
    updatePacketStatistics();   // Update statistik
    logReceivedDataToSerial();  // Log ke Serial debug
    forwardDataToDatabase();    // Forward ke database
}
```

**Fungsi Callback:**
1. **Data Validation**: Mengecek ukuran paket sesuai dengan struct
2. **Memory Copy**: Menyalin byte data ke struktur receivedSensorData
3. **Statistics Update**: Menambah counter dan update timestamp
4. **Debug Logging**: Mencetak data ke Serial untuk monitoring
5. **Data Forwarding**: Meneruskan data ke GemilDatabase

**Istilah Teknis:**
- **Callback function**: Fungsi yang dipanggil otomatis saat event terjadi
- **memcpy**: Fungsi untuk menyalin data dalam memori
- **const uint8_t**: Pointer ke data 8-bit yang tidak dapat diubah
- **sizeof**: Operator untuk mendapatkan ukuran data dalam bytes

### 2. Statistik dan Monitoring
```cpp
void updatePacketStatistics() {
    totalPacketsReceived++;     // Increment counter
    lastPacketTime = millis();  // Update timestamp
}

void logReceivedDataToSerial() {
    Serial.println("=== Data ESP-NOW Diterima ===");
    Serial.printf("Paket #%lu diterima pada %lu ms\n", totalPacketsReceived, lastPacketTime);
    Serial.printf("pH: %.2f\n", receivedSensorData.phValue);
    Serial.printf("TDS: %.2f ppm\n", receivedSensorData.tdsValue);
    Serial.printf("UV: %.2f\n", receivedSensorData.uvValue);
    Serial.printf("Level Mikroplastik: %s\n", receivedSensorData.microplasticLevel);
    Serial.println("=============================");
}
```

**Fungsi Monitoring:**
- **Packet Counting**: Menghitung total paket yang berhasil diterima
- **Timing Analysis**: Mencatat waktu penerimaan untuk analisis koneksi
- **Data Logging**: Format output yang mudah dibaca untuk debugging
- **Real-time Display**: Menampilkan semua parameter sensor

**Istilah Teknis:**
- **printf formatting**: Teknik formatting string dengan placeholder
- **%lu**: Format specifier untuk unsigned long
- **%.2f**: Format specifier untuk float dengan 2 desimal
- **%s**: Format specifier untuk string

### 3. Data Forwarding
```cpp
void forwardDataToDatabase() {
    String formattedData = formatSensorDataForTransmission();
    
    Serial2.println(formattedData);  // Kirim ke GemilDatabase
    Serial.printf("Data diteruskan ke database: %s\n", formattedData.c_str());
}

String formatSensorDataForTransmission() {
    char dataBuffer[128];
    snprintf(dataBuffer, sizeof(dataBuffer),
             "pH:%.2f, TDS:%.2f, UV:%.2f, Mikroplastik:%s",
             receivedSensorData.phValue,
             receivedSensorData.tdsValue,
             receivedSensorData.uvValue,
             receivedSensorData.microplasticLevel);
    
    return String(dataBuffer);
}
```

**Format Output:**
```
pH:7.23, TDS:456.7, UV:1.8, Mikroplastik:Sedang
```

**Fungsi Data Processing:**
- **String Formatting**: Mengkonversi struct data menjadi string terformat
- **Serial Transmission**: Mengirim via Serial2 ke GemilDatabase
- **Logging**: Mencatat data yang diteruskan untuk debugging
- **Error Prevention**: Buffer size control dengan snprintf

**Istilah Teknis:**
- **snprintf**: Safe string formatting dengan buffer size limit
- **String.c_str()**: Konversi String object ke C-style string
- **Buffer overflow protection**: Mencegah data melebihi kapasitas buffer

### 4. Inisialisasi Sistem
```cpp
void initializeEspNowReceiver() {
    WiFi.mode(WIFI_STA);  // Set WiFi mode
    WiFi.disconnect();    // Disconnect existing connections
    
    if (esp_now_init() != ESP_OK) {
        Serial.println("ERROR: Inisialisasi ESP-NOW gagal");
        Serial.println("Sistem akan memulai ulang dalam 5 detik...");
        delay(5000);
        ESP.restart();
        return;
    }
    
    esp_now_register_recv_cb(onSensorDataReceived);  // Register callback
    Serial.println("Penerima ESP-NOW berhasil diinisialisasi");
}

void initializeSerialCommunication() {
    Serial.begin(USB_SERIAL_BAUD_RATE);   // Debug serial
    Serial2.begin(BRIDGE_SERIAL_BAUD_RATE, SERIAL_8N1, SERIAL_RX_PIN, SERIAL_TX_PIN);
    
    Serial.println("Modul Bridge Deteksi Mikroplastik");
    Serial.printf("Serial USB: %d baud\n", USB_SERIAL_BAUD_RATE);
    Serial.printf("Serial Bridge: %d baud (RX:%d, TX:%d)\n", 
                  BRIDGE_SERIAL_BAUD_RATE, SERIAL_RX_PIN, SERIAL_TX_PIN);
}
```

**Proses Inisialisasi:**
1. **WiFi Setup**: Configure untuk ESP-NOW compatibility
2. **ESP-NOW Init**: Initialize protocol stack dengan error handling
3. **Callback Register**: Daftarkan fungsi penerima data
4. **Serial Setup**: Initialize debug dan bridge communication
5. **Error Recovery**: Auto-restart jika inisialisasi gagal

**Istilah Teknis:**
- **WIFI_STA**: WiFi Station mode (client mode)
- **esp_now_register_recv_cb**: Fungsi untuk mendaftarkan callback penerima
- **SERIAL_8N1**: 8 data bits, No parity, 1 stop bit
- **ESP.restart()**: Fungsi untuk restart sistem ESP32

### 5. Loop Utama dan Status Reporting
```cpp
void loop() {
    static unsigned long lastStatusReport = 0;
    const unsigned long STATUS_REPORT_INTERVAL = 30000;  // 30 detik
    
    unsigned long currentTime = millis();
    
    if (currentTime - lastStatusReport >= STATUS_REPORT_INTERVAL) {
        lastStatusReport = currentTime;
        printStatusReport(currentTime);
    }
    
    delay(100);  // CPU throttling
}

void printStatusReport(unsigned long uptime) {
    Serial.println("=== Laporan Status Bridge ===");
    Serial.printf("Uptime: %lu ms\n", uptime);
    Serial.printf("Total paket diterima: %lu\n", totalPacketsReceived);
    
    if (totalPacketsReceived > 0) {
        Serial.printf("Paket terakhir: %lu ms yang lalu\n", uptime - lastPacketTime);
    } else {
        Serial.println("Belum ada paket yang diterima");
    }
    
    Serial.println("============================");
}
```

**Status Monitoring:**
- **Periodic Reporting**: Laporan status setiap 30 detik
- **Uptime Tracking**: Monitor waktu sistem berjalan
- **Connection Health**: Analisis waktu sejak paket terakhir
- **Performance Metrics**: Total throughput dan timing analysis

**Istilah Teknis:**
- **static variable**: Variabel yang mempertahankan nilai antar pemanggilan fungsi
- **millis()**: Fungsi untuk mendapatkan waktu sistem dalam milidetik
- **Uptime**: Total waktu sistem berjalan sejak startup

## Karakteristik Kinerja

### Throughput Data
- **Input Rate**: Mengikuti rate dari GemilTransmitter (100ms interval)
- **Processing Latency**: <1ms per paket
- **Output Rate**: Real-time forwarding ke database
- **Buffer Size**: 128 bytes untuk string formatting

### Memory Usage
- **Static Variables**: ~20 bytes untuk statistik
- **Buffer Space**: 128 bytes untuk formatting
- **Struct Data**: ~22 bytes untuk SensorDataPacket
- **Total RAM**: <200 bytes untuk operasi normal

### Communication Specs
- **ESP-NOW Reception**: Unlimited rate (hardware limited)
- **Serial2 Output**: 9600 baud = ~960 bytes/second
- **Debug Output**: 115200 baud untuk real-time monitoring
- **Error Recovery**: Auto-restart untuk critical failures

## Error Handling

### Data Validation
```cpp
if (dataLength != sizeof(SensorDataPacket)) {
    Serial.println("ERROR: Ukuran paket data yang diterima tidak valid");
    return;
}
```

### System Recovery
```cpp
if (esp_now_init() != ESP_OK) {
    Serial.println("ERROR: Inisialisasi ESP-NOW gagal");
    delay(5000);
    ESP.restart();
}
```

### Connection Monitoring
- **Packet Statistics**: Track total received packets
- **Timing Analysis**: Monitor last packet time
- **Health Reporting**: Periodic status updates

**Istilah Teknis:**
- **Data validation**: Proses verifikasi integritas data
- **System recovery**: Mekanisme pemulihan dari kegagalan
- **Health monitoring**: Pemantauan kondisi sistem secara real-time

## Flow Data Sistem

```
GemilTransmitter → ESP-NOW → GemilReceiver → Serial2 → GemilDatabase
                      ↓
                 Data Processing:
                 1. Receive callback
                 2. Validate packet size
                 3. Copy to struct
                 4. Update statistics
                 5. Format for Serial2
                 6. Forward to database
                 7. Log to debug
```

### Data Transformation
**Input (ESP-NOW)**: Binary SensorDataPacket struct
**Output (Serial2)**: Formatted string "pH:x.xx, TDS:x.xx, UV:x.xx, Mikroplastik:Level"

### Quality Assurance
- **Size Validation**: Memastikan data packet integrity
- **Real-time Logging**: Debug output untuk monitoring
- **Statistics Tracking**: Performance dan health metrics
- **Auto Recovery**: Restart pada critical failure

GemilReceiver berfungsi sebagai bridge yang reliable dan efficient antara wireless sensor network (ESP-NOW) dan wired database connection (Serial), dengan monitoring komprehensif untuk memastikan data integrity dan system reliability.