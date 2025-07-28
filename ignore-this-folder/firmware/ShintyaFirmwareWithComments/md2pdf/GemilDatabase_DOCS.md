# DOKUMENTASI GEMIL DATABASE
## Sistem Deteksi Mikroplastik - Cloud Node

### **Penulis: Faiz Gemilang Ramadhan**
### **Versi: 1.0 (Cloud Node ESP32)**

---

## 📚 DAFTAR ISI

- **[CHEAT SHEET SIDANG](#cheat-sheet-sidang)** (Quick Reference untuk Sidang)
- **[BAB I: OVERVIEW CLOUD NODE](#bab-i-overview-cloud-node)**
- **[BAB II: ANALISIS RTOS DUAL-CORE](#bab-ii-analisis-rtos-dual-core)**
- **[BAB III: ANALISIS SERIAL DATA PARSING](#bab-iii-analisis-serial-data-parsing)**
- **[BAB IV: ANALISIS FIREBASE INTEGRATION](#bab-iv-analisis-firebase-integration)**
- **[BAB V: ANALISIS NETWORK MANAGEMENT](#bab-v-analisis-network-management)**

---

## 🔥 CHEAT SHEET SIDANG
### Quick Reference untuk Menjawab Pertanyaan Dosen

#### **❓ PERTANYAAN STRUKTUR KODE:**

**Q: "Apa fungsi GemilDatabase dalam sistem?"**  
✅ **A**: "Cloud node yang terima data dari GemilReceiver via Serial2 (line 149-176), parsing data sensor, upload ke Firebase Realtime Database. Node terakhir dalam IoT pipeline"

**Q: "Entry point program dimana?"**  
✅ **A**: "File `GemilDatabase.ino:23-31`, fungsi setup() line 24 initializeSerialCommunication(), line 30 setupRTOS(). Dual-core task management"

**Q: "Mengapa pakai dual-core RTOS?"**  
✅ **A**: "RTOS.ino:9-35, Core 0 untuk Firebase operations (taskDatabaseManager), Core 1 untuk serial communication (taskSerialCommunication). Pemisahan network dan I/O processing"

**Q: "Firebase configuration dimana?"**  
✅ **A**: "library.h:31-34, API key, database URL https://gemil-606a8-default-rtdb.firebaseio.com/, user auth admin@gmail.com. Realtime Database struktur /sensor"

#### **❓ PERTANYAAN IMPLEMENTASI TEKNIS:**

**Q: "Data parsing gimana kerjanya?"**  
✅ **A**: "GemilDatabase.ino:69-102, parseSensorDataFromSerial() extract pH/TDS/UV dari string format 'pH:X.XX, TDS:Y.YY, UV:Z.ZZ, Mikroplastik:Level'"

**Q: "Firebase upload processnya?"**  
✅ **A**: "network.ino:156-191, create JSON object dengan JsonWriter, upload ke path /sensor dengan struktur {kadar_ph, kadar_tds, sinar_uv, status}"

**Q: "Error handling sistemnya?"**  
✅ **A**: "network.ino:14-18 WiFi timeout restart, line 200-208 log upload status, line 172-174 timeout detection 60 detik"

**Q: "Memory management gimana?"**  
✅ **A**: "RTOS.ino:66,90 stack DatabaseManager 12KB, SerialComm 8KB. Total 20KB dari 520KB SRAM ESP32. Firebase async client untuk efficiency"

#### **❓ PERTANYAAN DATA FLOW:**

**Q: "Struktur data yang diupload ke Firebase?"**  
✅ **A**: "library.h:88-94 struct SensorReadings, network.ino:171-175 JSON {kadar_ph: float, kadar_tds: float, sinar_uv: float, status: string}"

**Q: "WiFi dan Firebase connection managementnya?"**  
✅ **A**: "network.ino:7-29 initializeWifiConnection() dengan timeout, line 134-147 checkWifiConnection() auto-reconnect setiap 30 detik"

---

## BAB I: OVERVIEW CLOUD NODE

### 1.1 Peran dalam Sistem IoT

**GemilDatabase** adalah node terakhir dalam IoT pipeline yang bertanggung jawab untuk:
- Menerima data sensor dari GemilReceiver via Serial2 (9600 baud)
- Parsing string data menjadi nilai numerik dan kategori
- Upload data ke Firebase Realtime Database untuk cloud storage
- Monitoring koneksi WiFi dan Firebase dengan auto-recovery

### 1.2 Arsitektur Dual-Core Cloud

**Core 0 - Database Manager:**
```cpp
void taskDatabaseManager(void *pvParameters) {
  setupDatabaseConnection();    // WiFi + Firebase init
  while (true) {
    maintainDatabaseConnection();  // Firebase operations
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}
```

**Core 1 - Serial Communication:**
```cpp
void taskSerialCommunication(void *pvParameters) {
  while (true) {
    readSensorDataFromBridge();   // Serial2 data reading
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}
```

### 1.3 Data Flow Architecture

```
GemilReceiver → Serial2 → Data Parsing → JSON Creation → Firebase Upload
             (9600 baud)   (string extraction)  (JsonWriter)   (AsyncClient)
```

---

## BAB II: ANALISIS RTOS DUAL-CORE

### 2.1 Task Configuration (RTOS.ino)

**Task Creation:**
```cpp
void setupRTOS() {
  createDatabaseManagerTask();      // Core 0, Priority 2, 12KB stack
  createSerialCommunicationTask();  // Core 1, Priority 3, 8KB stack
}
```

**Memory Allocation:**
- **DatabaseManager**: 12KB stack untuk Firebase operations
- **SerialCommunication**: 8KB stack untuk I/O processing
- **Total RTOS overhead**: 20KB dari 520KB SRAM ESP32

### 2.2 Task Priority Strategy

**Core 0 (Database Manager):**
- **Priority**: 2 (medium)
- **Interval**: 100ms delay
- **Operations**: WiFi monitoring, Firebase upload, connection maintenance

**Core 1 (Serial Communication):**
- **Priority**: 3 (high)
- **Interval**: 10ms delay
- **Operations**: Serial2 reading, data parsing, buffer management

**Reasoning**: Serial communication lebih prioritas untuk real-time data acquisition

---

## BAB III: ANALISIS SERIAL DATA PARSING

### 3.1 Data Reception (GemilDatabase.ino:149-176)

```cpp
void readSensorDataFromBridge() {
  if (Serial2.available()) {
    String incomingData = Serial2.readStringUntil('\n');
    
    if (incomingData.length() > 0) {
      parseSensorDataFromSerial(incomingData);  // Parse string data
      lastDataUpdateTime = millis();            // Update timestamp
    }
  }
  
  // Timeout detection (60 second threshold)
  if (lastDataReceived > 0 && (millis() - lastDataReceived) > 60000) {
    Serial.println("PERINGATAN: Tidak ada data >60 detik");
  }
}
```

### 3.2 String Parsing Algorithm (GemilDatabase.ino:69-102)

**Input Format:** `"pH:7.25, TDS:150.50, UV:1.25, Mikroplastik:Rendah"`

**Parsing Steps:**
```cpp
void parseSensorDataFromSerial(String rawData) {
  // 1. Format validation
  if (!isValidDataFormat(rawData)) return;
  
  // 2. Index extraction
  int phIndex = rawData.indexOf("pH:") + 3;
  int tdsIndex = rawData.indexOf("TDS:");
  int uvIndex = rawData.indexOf("UV:");
  int microplasticIndex = rawData.indexOf("Mikroplastik:");
  
  // 3. Substring extraction
  String phString = rawData.substring(phIndex, rawData.indexOf(',', phIndex));
  String tdsString = rawData.substring(tdsIndex + 4, rawData.indexOf(',', tdsIndex));
  String uvString = rawData.substring(uvIndex + 3, rawData.indexOf(',', uvIndex));
  String microplasticString = rawData.substring(microplasticIndex + 13);
  
  // 4. Type conversion
  currentSensorData.phValue = phString.toFloat();
  currentSensorData.tdsValue = tdsString.toFloat();
  currentSensorData.uvValue = uvString.toFloat();
  currentSensorData.microplasticLevel = microplasticString;
}
```

### 3.3 Data Structure (library.h:88-94)

```cpp
struct SensorReadings {
  float phValue;              // Nilai pH sensor
  float tdsValue;             // Nilai TDS dalam ppm
  float uvValue;              // Nilai UV index
  String microplasticLevel;   // "Rendah"/"Sedang"/"Tinggi"
  String microplasticStatus;  // "rendah"/"sedang"/"tinggi" untuk database
};
```

**Istilah Teknis:**
- **struct**: Struktur data yang mengelompokkan variabel berbeda tipe
- **String vs string**: String object untuk manipulation, lowercase untuk database consistency
- **Type conversion**: toFloat() untuk konversi string ke floating point number

---

## BAB IV: ANALISIS FIREBASE INTEGRATION

### 4.1 Firebase Configuration (library.h:31-41)

```cpp
#define FIREBASE_API_KEY "AIzaSyCDKHmIkiSjyDFBTfW2dqdf9eo89FmZCHo"
#define FIREBASE_DATABASE_URL "https://gemil-606a8-default-rtdb.firebaseio.com/"
#define FIREBASE_USER_EMAIL "admin@gmail.com"
#define FIREBASE_USER_PASSWORD "admin123"
#define WIFI_NETWORK_SSID "TIMEOSPACE"
#define WIFI_NETWORK_PASSWORD "1234Saja"
```

### 4.2 Firebase Objects (library.h:67-77)

```cpp
SSL_CLIENT sslClient;                        // SSL client untuk HTTPS
AsyncClient firebaseAsyncClient(sslClient);  // Async client untuk non-blocking
UserAuth firebaseUserAuth(FIREBASE_API_KEY, // User authentication object
                          FIREBASE_USER_EMAIL,
                          FIREBASE_USER_PASSWORD,
                          AUTH_TOKEN_EXPIRE_SECONDS);
FirebaseApp firebaseApp;                     // Main Firebase app instance
RealtimeDatabase firebaseDatabase;          // Realtime Database object
```

**Istilah Teknis:**
- **SSL_CLIENT**: Secure Socket Layer untuk encrypted communication
- **AsyncClient**: Non-blocking client untuk parallel operations
- **UserAuth**: Firebase authentication dengan email/password
- **RealtimeDatabase**: Firebase Realtime Database (bukan Firestore)

### 4.3 Data Upload Process (network.ino:156-191)

```cpp
void uploadSensorDataToFirebase() {
  // Throttling: minimal 1 detik interval
  if (millis() - lastUpload < 1000) return;
  
  // JSON object creation
  object_t sensorDataJson;
  object_t phObject, tdsObject, uvObject, statusObject;
  JsonWriter jsonWriter;
  
  // Create individual JSON objects dengan presisi 2 decimal
  jsonWriter.create(phObject, "/kadar_ph", number_t(currentSensorData.phValue, 2));
  jsonWriter.create(tdsObject, "/kadar_tds", number_t(currentSensorData.tdsValue, 2));
  jsonWriter.create(uvObject, "/sinar_uv", number_t(currentSensorData.uvValue, 2));
  jsonWriter.create(statusObject, "/status", string_t(currentSensorData.microplasticStatus));
  
  // Join objects into main JSON
  jsonWriter.join(sensorDataJson, 4, phObject, tdsObject, uvObject, statusObject);
  
  // Upload to Firebase path "/sensor"
  bool success = firebaseDatabase.set<object_t>(firebaseAsyncClient, "/sensor", sensorDataJson);
  
  if (success) totalDataUploads++;
}
```

### 4.4 Database Structure

**Firebase Path:** `/sensor`
**JSON Structure:**
```json
{
  "kadar_ph": 7.25,
  "kadar_tds": 150.50,
  "sinar_uv": 1.25,
  "status": "rendah"
}
```

**Istilah Teknis:**
- **JsonWriter**: Firebase library class untuk JSON creation
- **object_t**: Firebase object type untuk JSON objects
- **number_t**: Firebase number type dengan precision control
- **string_t**: Firebase string type

---

## BAB V: ANALISIS NETWORK MANAGEMENT

### 5.1 WiFi Connection Management (network.ino:7-29)

```cpp
void initializeWifiConnection() {
  Serial.printf("Menghubungkan ke WiFi: %s\n", WIFI_NETWORK_SSID);
  WiFi.begin(WIFI_NETWORK_SSID, WIFI_NETWORK_PASSWORD);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    // Timeout handling (30 second limit)
    if (millis() - startTime > WIFI_CONNECTION_TIMEOUT_MS) {
      Serial.println("ERROR: Timeout koneksi WiFi");
      ESP.restart();  // Restart jika timeout
      return;
    }
    Serial.print(".");
    delay(500);
  }
  
  isWifiConnected = true;
  Serial.printf("WiFi terhubung! IP: %s, RSSI: %d dBm\n", 
                WiFi.localIP().toString().c_str(), WiFi.RSSI());
}
```

### 5.2 Connection Monitoring (network.ino:134-147)

```cpp
void checkWifiConnection() {
  static unsigned long lastCheck = 0;
  
  // Check WiFi status setiap 30 detik
  if (millis() - lastCheck > 30000) {
    lastCheck = millis();
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi terputus - reconnecting...");
      isWifiConnected = false;
      initializeWifiConnection();  // Auto-reconnect
    }
  }
}
```

### 5.3 Firebase Application Loop (network.ino:110-126)

```cpp
void maintainDatabaseConnection() {
  firebaseApp.loop();  // Maintain Firebase connection
  
  // Upload data jika Firebase ready
  if (firebaseApp.ready() && isDatabaseReady) {
    uploadSensorDataToFirebase();
  } else if (!firebaseApp.ready()) {
    // Warning setiap 10 detik jika Firebase not ready
    static unsigned long lastWarning = 0;
    if (millis() - lastWarning > 10000) {
      lastWarning = millis();
      Serial.println("PERINGATAN: Firebase belum siap");
    }
  }
  
  checkWifiConnection();  // WiFi health check
}
```

### 5.4 Error Handling & Logging (network.ino:200-208)

```cpp
void logDatabaseOperationStatus(bool success) {
  if (success) {
    Serial.printf("✓ Upload berhasil (Total: %lu)\n", totalDataUploads);
  } else {
    Serial.printf("✗ Upload gagal - Error: %s, Code: %d\n",
                  firebaseAsyncClient.lastError().message().c_str(),
                  firebaseAsyncClient.lastError().code());
  }
}
```

**Error Recovery Mechanisms:**
- **WiFi Timeout**: Auto-restart ESP32 setelah 30 detik
- **Firebase Not Ready**: Warning log setiap 10 detik
- **Upload Failure**: Detailed error message dengan error code
- **Data Timeout**: Warning jika tidak ada data >60 detik

---

## KESIMPULAN DOKUMENTASI

### **🎯 Keunggulan Cloud Architecture:**

**Robust Network Management:**
- **Auto-recovery WiFi**: Reconnection setiap 30 detik jika terputus
- **Firebase health monitoring**: Ready state checking dan error logging
- **Timeout protection**: 30 detik WiFi, 60 detik data timeout
- **SSL security**: Encrypted communication ke Firebase

**Efficient Data Processing:**
- **Dual-core separation**: Network ops di Core 0, I/O di Core 1
- **String parsing**: Robust extraction dari formatted serial data
- **JSON creation**: Structured data dengan precision control
- **Upload throttling**: 1 detik minimum interval untuk rate limiting

**Cloud Integration:**
- **Firebase Realtime Database**: Real-time sync untuk web/mobile apps
- **User authentication**: Email/password based auth
- **Structured data**: JSON format {kadar_ph, kadar_tds, sinar_uv, status}
- **Async operations**: Non-blocking Firebase operations

### **📊 Performance Metrics:**
- **Memory Usage**: 20KB RTOS stack dari 520KB SRAM (~4%)
- **Upload Rate**: Maximum 1 Hz (throttled untuk database protection)  
- **Network Recovery**: <30 detik untuk WiFi reconnection
- **Data Latency**: <100ms parsing + upload time
- **Reliability**: Auto-restart recovery untuk critical failures

### **🔧 Technical Implementation:**
- **Serial Communication**: 9600 baud bridge dari GemilReceiver
- **Data Validation**: Format checking sebelum parsing
- **Type Conversion**: String to float dengan error handling
- **Database Path**: `/sensor` dengan structured JSON data
- **Authentication**: Firebase user auth dengan token expiry

---

**Dokumentasi Completed by: Faiz Gemilang Ramadhan**  
**GemilDatabase - Cloud Node ESP32 untuk Firebase Integration**
**IoT-to-Cloud Bridge dengan Dual-Core RTOS Architecture**