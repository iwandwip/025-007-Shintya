# DOKUMENTASI FIRMWARE ESP32 SMART PACKET BOX COD
### Analisis Mendalam Struktur Kode dan Implementasi

---

## DAFTAR ISI

1. [Gambaran Umum dan Arsitektur Sistem](#1-gambaran-umum-dan-arsitektur-sistem)
2. [Titik Masuk Program dan Inisialisasi](#2-titik-masuk-program-dan-inisialisasi)
3. [Manajemen Task RTOS](#3-manajemen-task-rtos)
4. [Fungsi Inisialisasi Hardware](#4-fungsi-inisialisasi-hardware)
5. [Fungsi Input Sensor](#5-fungsi-input-sensor)
6. [Fungsi Kontrol Aktuator](#6-fungsi-kontrol-aktuator)
7. [Manajemen Tampilan LCD](#7-manajemen-tampilan-lcd)
8. [State Machine Menu](#8-state-machine-menu)
9. [Operasi Jaringan dan Database](#9-operasi-jaringan-dan-database)
10. [Variabel Global dan Struktur Data](#10-variabel-global-dan-struktur-data)
11. [Ketergantungan Pemanggilan Fungsi](#11-ketergantungan-pemanggilan-fungsi)
12. [Alur Sistem dan Pohon Keputusan](#12-alur-sistem-dan-pohon-keputusan)
13. [Analisis Lengkap Implementasi Code](#13-analisis-lengkap-implementasi-code)

---

## 1. GAMBARAN UMUM DAN ARSITEKTUR SISTEM

### Komponen Hardware
```
ESP32 (Dual-Core Processor)
├── Core 0: Operasi Database/Jaringan
├── Core 1: Operasi Kontrol Hardware
├── I2C Bus: LCD(0x27), Keypad(0x22), PCA9685(0x40), PCF8574(0x20,0x21)
├── Interface Serial: Serial(Debug), Serial1(Audio), Serial2(Barcode)
├── GPIO: Ultrasonic(32,33), Relay(27), Tombol(36,39)
└── PWM: 7 channel servo melalui PCA9685
```

### Arsitektur Software
```
main() [Framework Arduino]
├── setup() → setupRTOS()
│   ├── TaskDatabase (Core 0) → Operasi Jaringan
│   └── TaskControl (Core 1) → Operasi Hardware
└── loop() → [Kosong - Semua logika di task RTOS]
```

---

## 2. TITIK MASUK PROGRAM DAN INISIALISASI

### **Fungsi setup() [ShintyaFirmwareWithComments.ino]**
```cpp
void setup() {
  Serial.begin(115200);  // Komunikasi debug
  setupRTOS();           // Memulai sistem dual-core
}
```

**Alur Detail:**
1. **Serial.begin(115200)**: Menginisialisasi komunikasi debug pada kecepatan 115200 baud
2. **setupRTOS()**: Memanggil fungsi pembuatan task RTOS

**Tujuan**: Titik masuk program yang minimal, semua logika kompleks dipindahkan ke task RTOS

### **Fungsi loop() [ShintyaFirmwareWithComments.ino]**
```cpp
void loop() {
  // Kosong - semua logika ditangani oleh task RTOS
}
```

**Alur Detail:**
- **Sengaja Dikosongkan**: Dalam implementasi RTOS, loop utama tidak digunakan
- **Berbasis Task**: Semua logika berjalan di TaskDatabase() dan TaskControl()
- **Keuntungan**: Manajemen resource yang lebih baik, eksekusi bersamaan

---

## 3. MANAJEMEN TASK RTOS

### **Fungsi setupRTOS() [RTOS.ino]**
```cpp
void setupRTOS() {
  // Membuat task Database pada Core 0
  xTaskCreatePinnedToCore(
    TaskDatabase,     // Pointer fungsi
    "TaskDatabase",   // Nama task (untuk debugging)
    10000,            // Ukuran stack (10KB)
    NULL,             // Parameter (tidak ada)
    1,                // Level prioritas
    &DatabaseHandle,  // Handle task
    0                 // Core 0
  );

  // Membuat task Control pada Core 1  
  xTaskCreatePinnedToCore(
    TaskControl,      // Pointer fungsi
    "TaskControl",    // Nama task
    10000,            // Ukuran stack (10KB)
    NULL,             // Parameter
    1,                // Level prioritas
    &ControlHandle,   // Handle task
    1                 // Core 1
  );
}
```

**Analisis Detail:**
1. **Strategi Penugasan Core**:
   - Core 0: Operasi I/O jaringan (operasi blocking aman)
   - Core 1: Kontrol hardware real-time (prioritas untuk responsivitas)

2. **Ukuran Stack (10KB)**:
   - Cukup untuk operasi parsing JSON
   - Buffer untuk variabel lokal dan pemanggilan fungsi

3. **Level Prioritas (1)**:
   - Prioritas yang sama untuk eksekusi seimbang
   - FreeRTOS akan membagi waktu antara task

### **Fungsi TaskDatabase() [RTOS.ino]**
```cpp
void TaskDatabase(void *pvParameters) {
  initializeNetworkConnection();    // Setup WiFi
  initializeFirebaseDatabase();     // Inisialisasi Firebase
  
  while (true) {
    updateDatabaseData();                   // Sinkronisasi dengan Firebase
    vTaskDelay(2000 / portTICK_PERIOD_MS); // Jeda 2 detik
  }
}
```

**Alur Detail:**
1. **initializeNetworkConnection()**: 
   - Setup koneksi WiFi yang blocking
   - Menunggu hingga status WL_CONNECTED
   - Mencetak alamat IP untuk debugging

2. **initializeFirebaseDatabase()**:
   - Setup klien SSL untuk komunikasi aman
   - Menginisialisasi aplikasi Firebase dengan kredensial
   - Setup interface dokumen Firestore

3. **Loop Utama**:
   - **updateDatabaseData()**: Mengambil data dari 3 koleksi
   - **vTaskDelay(2000)**: Jeda non-blocking, memungkinkan task lain berjalan
   - **Sinkronisasi Berkelanjutan**: Sinkronisasi data real-time

### **Fungsi TaskControl() [RTOS.ino]**
```cpp
void TaskControl(void *pvParameters) {
  // Urutan inisialisasi hardware
  initializeAudioSystem();
  initializeLCDDisplay();
  initializeSensors();
  initializeServoController();
  initializeKeypad();
  initializeRelay();
  initializeButtons();
  
  // Status awal sistem
  playAudioCommand(String(soundPilihMetode));
  initializeDummyPackages();
  
  while (true) {
    // Loop kontrol utama
    readLimitSwitches();
    controlAllLokers();
    controlMainDoor();
    controlRelayOutput();
    processRemoteLokerCommands();
    menu();
    currentDistance = readDistanceSensor();
    processSerialCommands();
  }
}
```

**Alur Detail:**
1. **Fase Inisialisasi Hardware**:
   - Inisialisasi berurutan (urutan penting untuk dependensi)
   - Setiap fungsi init menangani komponen hardware spesifik
   - Penanganan error dalam fungsi individual

2. **Setup Status Awal**:
   - Pesan audio selamat datang
   - Memuat data uji untuk pengembangan

3. **Loop Kontrol Utama** (Tanpa jeda - responsivitas maksimum):
   - **readLimitSwitches()**: Monitoring keamanan (prioritas tertinggi)
   - **controlAllLokers()**: Kontrol servo berdasarkan perintah
   - **controlMainDoor()**: Kontrol servo pintu utama
   - **controlRelayOutput()**: Kontrol kunci pintu
   - **processRemoteLokerCommands()**: Pemrosesan perintah Firebase
   - **menu()**: State machine antarmuka pengguna
   - **readDistanceSensor()**: Deteksi paket
   - **processSerialCommands()**: Perintah debug

---

## 4. FUNGSI INISIALISASI HARDWARE

### **Fungsi initializeSensors() [sensor.ino]**
```cpp
void initializeSensors() {
  Wire.begin();                                       // Mode master I2C
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67); // Scanner barcode
  pcfEntryInput.begin(0x20, &Wire);                  // Limit switch masuk
  pcfExitOutput.begin(0x21, &Wire);                  // Limit switch keluar
}
```

**Analisis Detail:**
1. **Wire.begin()**: 
   - Menginisialisasi I2C sebagai perangkat master
   - Pin default: SDA=21, SCL=22 pada ESP32
   - Mengaktifkan resistor pull-up

2. **Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67)**:
   - **9600 baud**: Kecepatan standar scanner barcode GM67
   - **SERIAL_8N1**: 8 bit data, tanpa paritas, 1 bit stop
   - **Pin khusus**: RX=26, TX=25 (didefinisikan dalam library.h)

3. **Inisialisasi PCF8574**:
   - **0x20**: Switch masuk (deteksi pintu menutup)
   - **0x21**: Switch keluar (deteksi pintu membuka)
   - **&Wire**: Referensi ke objek bus I2C

### **Fungsi initializeServoController() [actuator.ino]**
```cpp
void initializeServoController() {
  servo.begin();                                    // Inisialisasi PCA9685
  servo.setPWMFreq(60);                            // 60Hz untuk kontrol servo
  servo.setPWM(5, 0, convertAngleToPulse(100));    // Servo pintu utama 1 netral
  servo.setPWM(6, 0, convertAngleToPulse(100));    // Servo pintu utama 2 netral
}
```

**Analisis Detail:**
1. **servo.begin()**:
   - Menginisialisasi driver PWM I2C PCA9685
   - Reset osilator internal
   - Mengatur nilai PWM default

2. **servo.setPWMFreq(60)**:
   - **Frekuensi 60Hz**: Standar untuk motor servo
   - **Periode PWM**: 16.67ms (1000/60)
   - **Rentang pulse**: ~1-2ms dalam periode 16.67ms

3. **Posisi Servo Awal**:
   - **Channel 5,6**: Servo ganda pintu utama
   - **Posisi 100°**: Posisi netral/aman
   - **convertAngleToPulse()**: Memetakan 0-180° ke nilai PWM

### **Fungsi initializeKeypad() [sensor.ino]**
```cpp
void initializeKeypad() {
  if (keyPad.begin() == false) {
    Serial.println("\nERROR: cannot communicate to keypad.\nPlease reboot.\n");
    while (1);  // Loop tak terbatas jika error
  }
  keyPad.loadKeyMap(keymap);  // Memuat pemetaan karakter
}
```

**Analisis Detail:**
1. **keyPad.begin()**:
   - Tes komunikasi I2C dengan keypad
   - Mengembalikan false jika perangkat tidak merespons
   - Penanganan kegagalan kritis dengan loop tak terbatas

2. **Penanganan Error**:
   - **Pesan error serial**: Informasi debug
   - **while(1)**: Menghentikan eksekusi (watchdog akan reset sistem)
   - **Alternatif**: Implementasi mekanisme percobaan ulang

3. **keyPad.loadKeyMap(keymap)**:
   - **keymap**: `"147*2580369#ABCDNF"` (didefinisikan dalam library.h)
   - **Pemetaan**: Posisi tombol fisik ke karakter
   - **Karakter khusus**: N=NoKey, F=Fail

---

## 5. FUNGSI INPUT SENSOR

### **Fungsi readDistanceSensor() [sensor.ino]**
```cpp
int readDistanceSensor() {
  int measuredDistance = sonar.ping_cm();          // Pengukuran ultrasonik
  if (measuredDistance == 0) return MAX_DISTANCE; // Penanganan di luar jangkauan
  else return measuredDistance;                    // Pengukuran valid
}
```

**Analisis Detail:**
1. **sonar.ping_cm()**:
   - Mengirim pulsa ultrasonik melalui pin TRIG
   - Mengukur waktu echo melalui pin ECHO
   - Menghitung jarak: waktu * kecepatan_suara / 2
   - Mengembalikan jarak dalam sentimeter

2. **Penanganan Jangkauan**:
   - **measuredDistance == 0**: Tidak ada echo yang diterima (>45cm atau halangan)
   - **MAX_DISTANCE (45)**: Asumsi jarak maksimum
   - **Jangkauan valid**: 2-45cm untuk sensor ini

3. **Penggunaan dalam Sistem**:
   - Dipanggil setiap siklus loop utama
   - Memperbarui `currentDistance` global
   - Digunakan untuk deteksi paket (<20cm)

### **Fungsi scanBarcodeFromSerial() [sensor.ino]**
```cpp
void scanBarcodeFromSerial() {
  scannedBarcode = Serial2.readStringUntil('\r');  // Baca hingga carriage return
  Serial.println("barcode : " + scannedBarcode);   // Output debug
}
```

**Analisis Detail:**
1. **Serial2.readStringUntil('\r')**:
   - **Format output GM67**: String barcode + '\r' + '\n'
   - **readStringUntil()**: Membaca karakter sampai delimiter
   - **Fungsi blocking**: Menunggu hingga string lengkap diterima

2. **Pemrosesan Data**:
   - Penugasan langsung ke `scannedBarcode` global
   - Tidak ada validasi dalam fungsi ini
   - Validasi dilakukan dalam state machine menu

3. **Output Debug**:
   - Cetak ke Serial untuk monitoring
   - Membantu troubleshooting scanner barcode

### **Fungsi readLimitSwitches() [sensor.ino]**
```cpp
void readLimitSwitches() {
  // Switch masuk (deteksi pintu menutup)
  entrySwitches[0] = !pcfEntryInput.digitalRead(5);  // Loker 1
  entrySwitches[1] = !pcfEntryInput.digitalRead(1);  // Loker 2
  entrySwitches[2] = !pcfEntryInput.digitalRead(2);  // Loker 3
  entrySwitches[3] = !pcfEntryInput.digitalRead(3);  // Loker 4
  entrySwitches[4] = !pcfEntryInput.digitalRead(4);  // Loker 5
  entrySwitches[5] = !pcfEntryInput.digitalRead(6);  // Pintu utama

  // Switch keluar (deteksi pintu membuka)
  exitSwitches[0] = !pcfExitOutput.digitalRead(5);   // Loker 1
  exitSwitches[1] = !pcfExitOutput.digitalRead(1);   // Loker 2
  exitSwitches[2] = !pcfExitOutput.digitalRead(2);   // Loker 3
  exitSwitches[3] = !pcfExitOutput.digitalRead(3);   // Loker 4
  exitSwitches[4] = !pcfExitOutput.digitalRead(4);   // Loker 5
  exitSwitches[5] = !pcfExitOutput.digitalRead(6);   // Pintu utama
}
```

**Analisis Detail:**
1. **Pemetaan Pin PCF8574**:
   - **Pemetaan tidak biasa**: Pin 0 tidak digunakan, dimulai dari pin 1
   - **Penugasan pin**: 1,2,3,4,5,6 untuk loker dan pintu utama
   - **Dua expander**: Terpisah untuk deteksi masuk dan keluar

2. **Inversi Logika**:
   - **!digitalRead()**: Membalik logika (switch aktif LOW)
   - **true**: Switch diaktifkan (pintu di posisi batas)
   - **false**: Switch dinonaktifkan (pintu bergerak atau posisi tengah)

3. **Implementasi Keamanan**:
   - **Switch masuk**: Mendeteksi posisi tertutup penuh
   - **Switch keluar**: Mendeteksi posisi terbuka penuh
   - **Digunakan untuk**: Keamanan kontrol servo dan umpan balik posisi

### **Fungsi processSerialCommands() [sensor.ino]**
```cpp
void processSerialCommands() {
  if (Serial.available()) {
    serialInput = Serial.readStringUntil('\n');  // Baca perintah
    Serial.println(serialInput);                 // Echo perintah
    playAudioCommand(serialInput);               // Umpan balik audio
  }
  
  // Pemrosesan perintah
  if (serialInput == "r") ESP.restart();                            // Restart sistem
  else if (serialInput == "o1") lokerControlCommands[0] = "buka";   // Buka loker 1
  else if (serialInput == "c1") lokerControlCommands[0] = "tutup";  // Tutup loker 1
  // ... [serupa untuk o2-o5, c2-c5]
  else if (serialInput == "ot") mainDoorControl = "buka";           // Buka pintu utama
  else if (serialInput == "ct") mainDoorControl = "tutup";          // Tutup pintu utama
  else if (serialInput == "st") mainDoorControl = "stop";           // Stop pintu utama
  else if (serialInput == "or") relayControlCommand = "buka";       // Buka relay
  else if (serialInput == "cr") relayControlCommand = "tutup";      // Tutup relay
}
```

**Analisis Detail:**
1. **Pemrosesan Input**:
   - **Serial.available()**: Cek data yang masuk
   - **readStringUntil('\n')**: Baca baris perintah lengkap
   - **Echo perintah**: Umpan balik konfirmasi

2. **Kategori Perintah**:
   - **Sistem**: "r" untuk restart
   - **Kontrol Loker**: "o1"-"o5" (buka), "c1"-"c5" (tutup)
   - **Pintu Utama**: "ot" (buka), "ct" (tutup), "st" (stop)
   - **Relay**: "or" (buka), "cr" (tutup)

3. **Pembaruan Variabel Global**:
   - **lokerControlCommands[]**: Array untuk kontrol loker individual
   - **mainDoorControl**: String untuk status pintu utama
   - **relayControlCommand**: String untuk status relay
   - **Alur kontrol**: Perintah diproses dalam loop utama

---

## 6. FUNGSI KONTROL AKTUATOR

### **Fungsi controlAllLokers() [actuator.ino]**
```cpp
void controlAllLokers() {
  for (int i = 0; i < 5; i++) {
    if (lokerControlCommands[i] == "tutup") closeLokerCompartment(i);
    else if (lokerControlCommands[i] == "buka") openLokerCompartment(i);
  }
}
```

**Analisis Detail:**
1. **Struktur Loop**:
   - **for (i = 0; i < 5)**: Iterasi melalui 5 loker COD
   - **Perbandingan string**: Cek perintah untuk setiap loker
   - **Dispatch aksi**: Panggil fungsi kontrol yang sesuai

2. **Pemrosesan Perintah**:
   - **"tutup"**: Perintah tutup loker
   - **"buka"**: Perintah buka loker
   - **Default**: Tidak ada aksi (pertahankan posisi saat ini)

3. **Pemanggilan Fungsi**:
   - **closeLokerCompartment(i)**: Fungsi tutup individual
   - **openLokerCompartment(i)**: Fungsi buka individual
   - **Parameter i**: Indeks loker (0-4 dipetakan ke loker 1-5)

### **Fungsi openLokerCompartment() [actuator.ino]**
```cpp
void openLokerCompartment(int lokerNumber) {
  if (exitSwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(135));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

**Analisis Detail:**
1. **Cek Keamanan**:
   - **exitSwitches[lokerNumber] == 0**: Cek apakah pintu tidak sedang terbuka
   - **Keamanan pertama**: Mencegah konflik servo dengan posisi mekanis

2. **Kontrol Servo**:
   - **Channel**: lokerNumber (0-4 dipetakan ke channel PCA9685 0-4)
   - **Nilai PWM 0**: Waktu mulai (selalu 0 untuk servo)
   - **convertAngleToPulse(135)**: Posisi buka (135 derajat)
   - **convertAngleToPulse(100)**: Posisi netral aman

3. **Logika Posisi**:
   - **135°**: Posisi terbuka penuh
   - **100°**: Posisi netral/stop (jika ada halangan)

### **Fungsi closeLokerCompartment() [actuator.ino]**
```cpp
void closeLokerCompartment(int lokerNumber) {
  if (entrySwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(75));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

**Analisis Detail:**
1. **Cek Keamanan**:
   - **entrySwitches[lokerNumber] == 0**: Cek apakah pintu tidak sedang tertutup
   - **Mencegah overpressure**: Menghindari tekanan berlebih pada servo

2. **Kontrol Servo**:
   - **convertAngleToPulse(75)**: Posisi tutup (75 derajat)
   - **convertAngleToPulse(100)**: Netral aman jika ada halangan

3. **Perlindungan Mekanis**:
   - **Umpan balik limit switch**: Mencegah kerusakan mekanis
   - **Keamanan servo**: Hentikan operasi jika ada resistensi tak terduga

### **Fungsi convertAngleToPulse() [actuator.ino]**
```cpp
int convertAngleToPulse(int angle) {
  int pulseWidth = map(angle, 0, 180, SERVOMIN, SERVOMAX);  // Pemetaan linear
  return pulseWidth;
}
```

**Analisis Detail:**
1. **Fungsi map()**:
   - **Rentang input**: 0-180 derajat
   - **Rentang output**: SERVOMIN(125) hingga SERVOMAX(575)
   - **Interpolasi linear**: Pemetaan proporsional

2. **Nilai PWM**:
   - **SERVOMIN = 125**: ~1ms lebar pulse
   - **SERVOMAX = 575**: ~2ms lebar pulse
   - **Resolusi PCA9685**: 12-bit (0-4095)

3. **Teori Kontrol Servo**:
   - **Pulse 1ms**: Posisi 0°
   - **Pulse 1.5ms**: Posisi 90° (netral)
   - **Pulse 2ms**: Posisi 180°

### **Fungsi controlMainDoor() [actuator.ino]**
```cpp
void controlMainDoor() {
  if (mainDoorControl == "tutup") closeMainDoor();
  else if (mainDoorControl == "buka") openMainDoor();
  else stopMainDoor();
}
```

**Analisis Detail:**
1. **Dispatch Perintah**:
   - **Perbandingan string**: Cek variabel global mainDoorControl
   - **Pemanggilan fungsi**: Rute ke fungsi pintu yang sesuai
   - **Aksi default**: stopMainDoor() untuk perintah tidak dikenal

2. **Logika State Machine**:
   - **"tutup"**: Tutup pintu utama
   - **"buka"**: Buka pintu utama
   - **Lainnya/kosong**: Posisi stop/netral

### **Fungsi openMainDoor() [actuator.ino]**
```cpp
void openMainDoor() {
  if (entrySwitches[5] == 0) {
    servo.setPWM(5, 0, convertAngleToPulse(142));    // Posisi servo 1
    servo.setPWM(6, 0, convertAngleToPulse(80));     // Posisi servo 2
  } else {
    servo.setPWM(6, 0, convertAngleToPulse(100));    // Posisi netral
    servo.setPWM(5, 0, convertAngleToPulse(100));
  }
}
```

**Analisis Detail:**
1. **Kontrol Servo Ganda**:
   - **Channel 5**: Servo pintu utama pertama (142°)
   - **Channel 6**: Servo pintu utama kedua (80°)
   - **Gerakan terkoordinasi**: Kedua servo bekerja bersama

2. **Cek Keamanan**:
   - **entrySwitches[5]**: Switch masuk pintu utama
   - **Operasi aman**: Hanya bergerak jika tidak ada halangan

3. **Mekanisme Pintu**:
   - **Sudut berbeda**: 142° dan 80° menunjukkan peran mekanis berbeda
   - **Sinkronisasi**: Kedua servo bergerak bersamaan untuk operasi halus

---

## 7. MANAJEMEN TAMPILAN LCD

### **Fungsi displayTextOnLCD() [display.ino]**
```cpp
void displayTextOnLCD(int xPosition, int yPosition, String textBuffer) {
  // Update pintar - hanya refresh jika teks berubah
  if (lastDisplayedText[yPosition] != textBuffer) {
    lastDisplayedText[yPosition] = textBuffer;  // Update buffer
    
    // Bersihkan baris dengan spasi
    String clearString = String("                    ");  // 20 spasi
    lcd.setCursor(xPosition, yPosition);
    lcd.print(clearString);
    
    // Format teks ke 20 karakter
    while (textBuffer.length() < 20) {
      textBuffer += " ";  // Isi dengan spasi
    }
    
    // Potong jika terlalu panjang
    if (textBuffer.length() > 20) {
      textBuffer = textBuffer.substring(0, 20);
    }
    
    // Tampilkan teks terformat
    char displayBuffer[21];                                 // 20 karakter + null terminator
    snprintf(displayBuffer, 21, "%s", textBuffer.c_str()); // Format string aman
    lcd.setCursor(xPosition, yPosition);
    lcd.print(displayBuffer);
  }
}
```

**Analisis Detail:**
1. **Logika Anti-Kedip**:
   - **lastDisplayedText[yPosition]**: Buffer untuk membandingkan teks sebelumnya
   - **Hanya update jika berbeda**: Mencegah update LCD yang tidak perlu
   - **UI halus**: Menghilangkan kedipan layar

2. **Format Teks**:
   - **Bersihkan baris dulu**: 20 spasi untuk slate bersih
   - **Padding**: Tambah spasi sampai 20 karakter
   - **Pemotongan**: Potong teks jika lebih dari 20 karakter
   - **Lebar tetap**: Format tampilan konsisten

3. **Penanganan String Aman**:
   - **snprintf()**: Mencegah buffer overflow
   - **Buffer 21 karakter**: 20 karakter + null terminator
   - **Keamanan memori**: Menghindari korupsi

4. **Positioning LCD**:
   - **setCursor(x, y)**: Posisikan cursor sebelum print
   - **Tampilan 20x4**: 20 kolom, 4 baris (0-3)

### **Fungsi initializeLCDDisplay() [display.ino]**
```cpp
void initializeLCDDisplay() {
  lcd.init();       // Inisialisasi LCD
  lcd.backlight();  // Aktifkan backlight
  
  String displayTitle;
  
  // Tampilkan nama pengembang
  displayTitle = "SHINTYA PUTRI WIJAYA";
  lcd.setCursor(10 - displayTitle.length() / 2, 1);  // Tengah pada baris 1
  lcd.print(displayTitle);
  
  // Tampilkan NIM
  displayTitle = "2141160117";
  lcd.setCursor(10 - displayTitle.length() / 2, 2);  // Tengah pada baris 2
  lcd.print(displayTitle);
  
  lcd.clear();  // Bersihkan layar setelah tampil
}
```

**Analisis Detail:**
1. **Setup LCD**:
   - **lcd.init()**: Inisialisasi komunikasi I2C dan controller LCD
   - **lcd.backlight()**: Nyalakan backlight untuk visibilitas

2. **Perhitungan Pemusatan**:
   - **10 - displayTitle.length() / 2**: Pusatkan teks pada tampilan 20-karakter
   - **Pemusatan matematis**: (20/2) - (panjang_teks/2)
   - **Posisi baris**: Baris 1 dan 2 untuk tampilan judul

3. **Urutan Startup**:
   - **Tampilkan kredit**: Nama pengembang dan NIM
   - **Tampilan singkat**: Pengguna dapat melihat informasi boot
   - **Bersihkan layar**: Siap untuk tampilan operasional

---

## 8. STATE MACHINE MENU

### **Fungsi menu() [menu.ino] - State Machine Utama**
```cpp
void menu() {
  switch (currentMenuState) {
    case MENU_MAIN:
      {
        // Tampilkan kapasitas dan pilihan
        displayTextOnLCD(0, 0, "        " + String(100 - (currentDistance * 100 / 45)) + "%");
        displayTextOnLCD(0, 1, "         ||         ");
        displayTextOnLCD(0, 2, "  INPUT  ||   SCAN  ");
        displayTextOnLCD(0, 3, "  RESI   ||   RESI  ");
        
        // Penanganan input tombol
        if (button1) {
          lcd.clear();
          playAudioCommand(String(soundPilihKurir));
          while (button1);  // Tunggu tombol dilepas
          currentMenuState = MENU_SELECT_COURIER;
        }
        else if (button2) {
          lcd.clear();
          playAudioCommand("15");
          while (button2);
          currentMenuState = MENU_SCAN_TRACKING;
        }
        
        // Akses QR
        if (keyPad.isPressed()) {
          lcd.clear();
          if (keyPad.getChar() == '#') currentMenuState = MENU_OPEN_DOOR;
        }
        break;
      }
      // ... [State menu lainnya]
  }
}
```

**Analisis Detail - State MENU_MAIN:**

1. **Tampilan Kapasitas**:
   - **Perhitungan**: `100 - (currentDistance * 100 / 45)`
   - **Logika**: 0cm = 100% penuh, 45cm = 0% penuh
   - **Real-time**: Update setiap siklus loop

2. **Layout Antarmuka Pengguna**:
   - **Baris 0**: Persentase kapasitas
   - **Baris 1**: Pemisah visual ("||")
   - **Baris 2-3**: Pilihan menu (INPUT || SCAN)

3. **Penanganan Input**:
   - **button1**: Pilihan INPUT RESI
   - **button2**: Pilihan SCAN RESI
   - **keyPad '#'**: Mode akses QR

4. **Transisi State**:
   - **Umpan balik audio**: playAudioCommand() untuk panduan pengguna
   - **Bersihkan layar**: lcd.clear() untuk transisi bersih
   - **Debounce tombol**: while(button1) mencegah trigger ganda

### **State Menu: MENU_COMPARE_TRACKING**
```cpp
case MENU_COMPARE_TRACKING:
  {
    playAudioCommand(String(soundCekResi));
    displayTextOnLCD(0, 0, "Mengecek Resi...");
    displayTextOnLCD(0, 1, scannedBarcode);
    displayTextOnLCD(0, 2, "Silahkan Tunggu!!");
    displayTextOnLCD(0, 3, "");
    
    bool resiDitemukan = false;
    vTaskDelay(2500);  // Jeda pemrosesan
    
    // Pencarian database
    for (int i = 0; i < MAX_PACKAGES; i++) {
      if (scannedBarcode == receipts[i].noResi) {
        resiDitemukan = true;
        currentPackageIndex = i;
        packageType = receipts[i].tipePaket;
        break;
      }
    }
    
    if (resiDitemukan) {
      playAudioCommand(String(soundResiCocok));
      displayTextOnLCD(0, 0, "Resi Ditemukan!");
      displayTextOnLCD(0, 1, scannedBarcode);
      displayTextOnLCD(0, 2, "TYPE : " + receipts[currentPackageIndex].tipePaket);
      displayTextOnLCD(0, 3, "Membuka Kotak...");
      serialInput = "ot";  // Buka pintu utama
      currentMenuState = MENU_INSERT_PACKAGE;
    }
    else {
      playAudioCommand(String(soundResiTidakCocok));
      displayTextOnLCD(0, 0, "Resi Tidak Ditemukan!");
      displayTextOnLCD(0, 1, scannedBarcode);
      displayTextOnLCD(0, 2, "Itu Bukan Paket Saya!");
      displayTextOnLCD(0, 3, "Terima Kasih!");
      serialInput = "ct";  // Tutup pintu utama
      vTaskDelay(5000);
      scannedBarcode = "||||||||||||||||||||";  // Reset
      isNewBarcodeScanned = false;
      currentMenuState = MENU_MAIN;
      playAudioCommand(String(soundPilihMetode));
    }
    break;
  }
```

**Analisis Detail - Validasi Database:**

1. **Umpan Balik Pengguna**:
   - **Audio**: soundCekResi untuk memulai proses
   - **Visual**: "Mengecek Resi..." dengan tampilan barcode
   - **Jeda pemrosesan**: vTaskDelay(2500) untuk persepsi pengguna

2. **Logika Pencarian Database**:
   - **Pencarian linear**: Loop for melalui array receipts[]
   - **Perbandingan string**: scannedBarcode == receipts[i].noResi
   - **Ekstraksi data**: currentPackageIndex, packageType

3. **Jalur Sukses**:
   - **Konfirmasi audio**: soundResiCocok
   - **Info tampilan**: Resi ditemukan + tipe paket
   - **Trigger aksi**: serialInput = "ot" (buka pintu utama)
   - **Transisi state**: MENU_INSERT_PACKAGE

4. **Jalur Gagal**:
   - **Audio error**: soundResiTidakCocok
   - **Tampilan error**: "Resi Tidak Ditemukan"
   - **Pembersihan**: Reset scannedBarcode, isNewBarcodeScanned
   - **Kembali**: Ke MENU_MAIN

### **State Menu: MENU_INSERT_PACKAGE**
```cpp
case MENU_INSERT_PACKAGE:
  {
    // Cek apakah pintu utama terbuka
    if (!entrySwitches[5] == 0) {
      displayTextOnLCD(0, 0, "");
      displayTextOnLCD(0, 1, "  Silahkan Masukan");
      displayTextOnLCD(0, 2, "       Paket!");
      displayTextOnLCD(0, 3, "");
      
      // Logika deteksi paket
      if (isPackageReceived == false) {
        if (currentDistance != 0 && currentDistance < 20) {
          serialInput = "ct";  // Tutup pintu utama
          isPackageReceived = true;
        }
      }
    }
    
    // Cek apakah pintu tertutup dan paket diterima
    if (!exitSwitches[5] == 0 && isPackageReceived) {
      isPackageReceived = false;  // Reset flag
      displayTextOnLCD(0, 0, "");
      displayTextOnLCD(0, 1, " Paket Diterima!  ");
      displayTextOnLCD(0, 2, "");
      displayTextOnLCD(0, 3, "");
      
      // Penanganan tipe paket
      if (packageType == "COD") {
        scannedBarcode = "|||||||||||||||||||";
        isNewBarcodeScanned = false;
        playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2)));
        
        // Buka loker COD yang sesuai
        switch (receipts[currentPackageIndex].nomorLoker) {
          case 1: serialInput = "o1"; break;
          case 2: serialInput = "o2"; vTaskDelay(5000); break;
          case 3: serialInput = "o3"; vTaskDelay(5000); break;
          case 4: serialInput = "o4"; vTaskDelay(5000); break;
          case 5: serialInput = "o5"; vTaskDelay(5000); break;
          default: serialInput = "Unknown Loker"; break;
        }
        
        lcd.clear();
        currentMenuState = MENU_OPEN_LOKER;
      }
      else if (packageType == "Non-COD") {
        scannedBarcode = "|||||||||||||||||||";
        isNewBarcodeScanned = false;
        playAudioCommand(String(soundTerimaKasih));
        vTaskDelay(2000);
        currentMenuState = MENU_MAIN;
        playAudioCommand(String(soundPilihMetode));
      }
    }
  }
```

**Analisis Detail - Logika Penyisipan Paket:**

1. **Monitoring Status Pintu**:
   - **entrySwitches[5]**: Sensor masuk pintu utama
   - **Tampilan kondisional**: Hanya tampilkan instruksi ketika pintu terbuka

2. **Deteksi Paket**:
   - **Threshold jarak**: currentDistance < 20cm
   - **Flag deteksi**: isPackageReceived mencegah trigger ganda
   - **Auto-tutup**: serialInput = "ct" memicu penutupan pintu

3. **Deteksi Penyelesaian**:
   - **exitSwitches[5]**: Sensor pintu tertutup penuh
   - **Kondisi ganda**: Pintu tertutup DAN paket diterima
   - **Reset flag**: isPackageReceived = false untuk siklus berikutnya

4. **Routing Tipe Paket**:
   - **Paket COD**: Rute ke urutan pembukaan loker
   - **Paket Non-COD**: Selesaikan transaksi, kembali ke main
   - **Penugasan loker**: Gunakan receipts[].nomorLoker dari database

---

## 9. OPERASI JARINGAN DAN DATABASE

### **Fungsi initializeNetworkConnection() [Network.ino]**
```cpp
void initializeNetworkConnection() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}
```

**Analisis Detail:**
1. **Proses Koneksi**:
   - **WiFi.begin()**: Mulai koneksi dengan kredensial
   - **Loop blocking**: while(WiFi.status() != WL_CONNECTED)
   - **Umpan balik visual**: Cetak titik untuk indikasi progres

2. **Monitoring Status**:
   - **WL_CONNECTED**: WiFi berhasil terhubung
   - **Tampilan alamat IP**: Berguna untuk debugging jaringan
   - **Output serial**: Informasi debug

### **Fungsi updateDatabaseData() [Network.ino]**
```cpp
void updateDatabaseData() {
  app.loop();  // Jaga koneksi Firebase
  
  static uint32_t firestoreUpdateTimer;
  // Update setiap 5 detik jika app siap
  if (millis() - firestoreUpdateTimer >= 5000 && app.ready()) {
    firestoreUpdateTimer = millis();
    
    // GET koleksi dari Firestore
    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));
    
    // Deserialize JSON ke dokumen
    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);
    
    int currentUserIndex = 0;
    int currentReceiptIndex = 0;
    int currentLokerControlIndex = 0;
    
    // Proses data pengguna
    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentUserIndex < MAX_USERS) {
        users[currentUserIndex].email = obj["fields"]["email"]["stringValue"].as<String>();
        users[currentUserIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
      }
      currentUserIndex++;
    }
    
    // Proses data resi
    for (JsonVariant v : receiptsDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentReceiptIndex < MAX_RECEIPTS) {
        receipts[currentReceiptIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].noResi = obj["fields"]["noResi"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        receipts[currentReceiptIndex].status = obj["fields"]["status"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].tipePaket = obj["fields"]["tipePaket"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].userEmail = obj["fields"]["userEmail"]["stringValue"].as<String>();
      }
      currentReceiptIndex++;
    }
    
    // Proses data kontrol loker
    for (JsonVariant v : lokerControlDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentLokerControlIndex < MAX_LOKER_CONTROL) {
        lokerControl[currentLokerControlIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        lokerControl[currentLokerControlIndex].buka = obj["fields"]["buka"]["integerValue"].as<int>();
        lokerControl[currentLokerControlIndex].tutup = obj["fields"]["tutup"]["integerValue"].as<int>();
      }
      currentLokerControlIndex++;
    }
  }
}
```

**Analisis Detail:**

1. **Pemeliharaan Koneksi**:
   - **app.loop()**: Jaga koneksi Firebase tetap hidup
   - **Dipanggil setiap siklus**: Monitoring koneksi berkelanjutan

2. **Timing Update**:
   - **Interval 5 detik**: Seimbang antara responsivitas dan bandwidth
   - **Perbandingan millis()**: Timing non-blocking
   - **Cek app.ready()**: Hanya update saat koneksi stabil

3. **Pengambilan Data**:
   - **Tiga koleksi**: users, receipts, lokerControl
   - **Request GET Firestore**: Ambil data koleksi lengkap
   - **Response JSON**: Firestore mengembalikan struktur JSON kompleks

4. **Pemrosesan JSON**:
   - **deserializeJson()**: Parse string JSON ke JsonDocument
   - **Iterasi JsonArray**: Loop melalui array dokumen
   - **Ekstraksi field**: Navigasi struktur field Firestore

5. **Update Array Lokal**:
   - **Pengecekan batas**: currentIndex < MAX_SIZE
   - **Konversi tipe**: Ekstraksi stringValue, integerValue
   - **Manajemen memori**: Array ukuran tetap untuk penggunaan memori yang dapat diprediksi

---

## 10. VARIABEL GLOBAL DAN STRUKTUR DATA

### **Variabel Status Hardware [library.h]**
```cpp
// Pembacaan sensor
int currentDistance = 0;                    // Nilai sensor ultrasonik (0-45cm)
String scannedBarcode = "||||||||||||||||||||";  // Barcode terakhir yang dipindai
bool isNewBarcodeScanned = false;           // Flag pemindaian barcode

// Array kontrol hardware
bool entrySwitches[6];                      // Status switch batas masuk
bool exitSwitches[6];                       // Status switch batas keluar
String lokerControlCommands[5] = {          // Perintah servo loker
  "tutup", "tutup", "tutup", "tutup", "tutup"
};
String mainDoorControl = "";                // Perintah servo pintu utama
String relayControlCommand = "buka";        // Perintah kontrol relay

// Variabel status menu
MenuState currentMenuState = MENU_MAIN;     // Status UI saat ini
int selectedCourier = 0;                    // Indeks kurir terpilih
String trackingInput;                       // Input tracking manual
int currentPackageIndex;                    // Indeks paket aktif
String packageType;                         // Tipe paket (COD/Non-COD)
bool isPackageReceived = false;             // Flag penyisipan paket
```

**Analisis Detail:**
1. **Manajemen Status Sensor**:
   - **currentDistance**: Diperbarui setiap siklus loop
   - **scannedBarcode**: Reset dengan karakter pipe untuk debugging visual
   - **isNewBarcodeScanned**: Mencegah pemrosesan duplikat

2. **Array Kontrol Hardware**:
   - **entrySwitches[6]**, **exitSwitches[6]**: Indeks 0-4 untuk loker, indeks 5 untuk pintu utama
   - **lokerControlCommands[5]**: Perintah string untuk kontrol loker individual
   - **Status default**: Semua loker tertutup, relay terbuka

3. **Manajemen Status Menu**:
   - **currentMenuState**: Enum untuk kontrol state machine
   - **selectedCourier**: 0=Tidak ada, 1=Shopee, 2=J&T, 3=SiCepat
   - **trackingInput**: Buffer untuk input resi manual

### **Struktur Database [library.h]**
```cpp
struct UsersTypedef {
  String email;
  String nama;
};

struct RececiptsTypedef {
  String nama;
  String noResi;
  int nomorLoker;        // 1-5 untuk paket COD
  String status;         // Status paket
  String tipePaket;      // "COD" atau "Non-COD"
  String userEmail;
};

struct LokerControlTypedef {
  int nomorLoker;        // Nomor loker (1-5)
  int buka;              // Perintah buka (0/1)
  int tutup;             // Perintah tutup (0/1)
};

// Array data lokal
UsersTypedef users[MAX_USERS];               // Maksimal 20 pengguna
RececiptsTypedef receipts[MAX_RECEIPTS];     // Maksimal 30 paket
LokerControlTypedef lokerControl[5];         // 5 loker COD
```

**Analisis Detail:**
1. **Desain Struktur Data**:
   - **Struktur sederhana**: Serialisasi/deserialisasi mudah
   - **Tipe string**: Kompatibel dengan field stringValue Firestore
   - **Array tetap**: Penggunaan memori yang dapat diprediksi

2. **Manajemen Paket**:
   - **nomorLoker**: Penugasan loker fisik (1-5)
   - **tipePaket**: Menentukan alur pemrosesan (COD vs Non-COD)
   - **status**: Status tracking ("Sedang Dikirim", "Telah Tiba", "Sudah Diambil")

3. **Kontrol Remote**:
   - **LokerControlTypedef**: Perintah remote Firebase
   - **Perintah biner**: buka/tutup sebagai integer 0/1
   - **Kontrol real-time**: Diperbarui melalui updateDatabaseData()

---

## 11. KETERGANTUNGAN PEMANGGILAN FUNGSI

### **Dependensi Loop Utama**
```
TaskControl() [Setiap siklus]
├── readLimitSwitches() → Memperbarui entrySwitches[], exitSwitches[]
├── controlAllLokers() → Menggunakan lokerControlCommands[]
│   ├── openLokerCompartment() → Menggunakan exitSwitches[]
│   └── closeLokerCompartment() → Menggunakan entrySwitches[]
├── controlMainDoor() → Menggunakan mainDoorControl
│   ├── openMainDoor() → Menggunakan entrySwitches[5]
│   └── closeMainDoor() → Menggunakan exitSwitches[5]
├── controlRelayOutput() → Menggunakan relayControlCommand
├── processRemoteLokerCommands() → Menggunakan lokerControl[], Memperbarui serialInput
├── menu() → State machine utama
│   ├── displayTextOnLCD() → Menggunakan buffer lastDisplayedText[]
│   ├── playAudioCommand() → Umpan balik audio
│   ├── scanBarcodeFromSerial() → Memperbarui scannedBarcode
│   └── Logika spesifik state → Memperbarui currentMenuState
├── readDistanceSensor() → Memperbarui currentDistance
└── processSerialCommands() → Memperbarui variabel kontrol
```

### **Dependensi Inisialisasi**
```
Inisialisasi TaskControl():
├── initializeAudioSystem() → Setup DFPlayer
├── initializeLCDDisplay() → Setup LCD
├── initializeSensors() → I2C, Serial2, PCF8574
├── initializeServoController() → Setup PCA9685
├── initializeKeypad() → Setup keypad I2C
├── initializeRelay() → Setup pin relay
└── initializeButtons() → Setup pin tombol
```

### **Dependensi Alur Data**
```
Firebase → updateDatabaseData() → Array lokal
├── users[] ← usersDocument
├── receipts[] ← receiptsDocument
└── lokerControl[] ← lokerControlDocument

Array lokal → logika menu() → Kontrol hardware
├── receipts[] → Validasi paket
├── lokerControl[] → Perintah remote
└── users[] → Validasi akses QR

Sensor hardware → Variabel global → Logika kontrol
├── Limit switch → entrySwitches[], exitSwitches[]
├── Ultrasonic → currentDistance
├── Barcode → scannedBarcode
└── Keypad → Navigasi menu
```

---

## 12. ALUR SISTEM DAN POHON KEPUTUSAN

### **Pohon Keputusan Pemrosesan Paket**
```
Input Pengguna (Tombol/Barcode)
├── INPUT RESI
│   ├── Pilih Kurir (1,2,3)
│   ├── Entri Manual (Keypad)
│   └── Konfirmasi (#) → Validasi Database
├── SCAN RESI
│   ├── Deteksi Barcode
│   ├── Konfirmasi (Tombol2)
│   └── → Validasi Database
└── AKSES QR (#)
    ├── Scan QR Code
    ├── Validasi Email
    └── Akses Pintu (5 detik)

Validasi Database:
├── Ditemukan di receipts[]
│   ├── Ambil packageType
│   ├── Buka Pintu Utama
│   ├── Penyisipan Paket
│   └── Rute berdasarkan Tipe:
│       ├── COD → Buka Loker Assigned → Tunggu Pengambilan → Tutup
│       └── Non-COD → Selesai → Kembali Menu Utama
└── Tidak Ditemukan
    ├── Pesan Error
    ├── Umpan Balik Audio
    └── Kembali Menu Utama
```

### **Alur Kontrol Hardware**
```
Loop Kontrol Utama (Core 1):
├── Keamanan Pertama: readLimitSwitches()
├── Kontrol Servo:
│   ├── controlAllLokers() → Cek lokerControlCommands[]
│   └── controlMainDoor() → Cek mainDoorControl
├── Kontrol Relay: controlRelayOutput()
├── Perintah Remote: processRemoteLokerCommands()
├── Antarmuka Pengguna: menu() → State machine
├── Deteksi Paket: readDistanceSensor()
└── Interface Debug: processSerialCommands()

Logika Keamanan Hardware:
├── Cek Limit Switch → entrySwitches[], exitSwitches[]
├── Gerakan Servo Aman:
│   ├── Buka: Hanya jika exitSwitch == 0
│   ├── Tutup: Hanya jika entrySwitch == 0
│   └── Netral: Jika switch menunjukkan halangan
└── Stop Darurat: Perintah serial "st"
```

### **Alur Operasi Jaringan**
```
TaskDatabase (Core 0):
├── Startup:
│   ├── Koneksi WiFi → Tunggu WL_CONNECTED
│   └── Inisialisasi Firebase → SSL + Auth
└── Loop Runtime:
    ├── app.loop() → Jaga koneksi
    └── Setiap 5 detik:
        ├── GET koleksi users
        ├── GET koleksi receipts
        ├── GET koleksi lokerControl
        ├── Deserialisasi JSON
        └── Perbarui array lokal

Manajemen Koneksi:
├── Monitoring Status WiFi
├── Refresh Autentikasi Firebase
├── Penanganan Error:
│   ├── Koneksi Hilang → Coba Ulang
│   ├── Error Parse JSON → Lewati update
│   └── Batas Rate API → Backoff
```

### **Alur State Machine Menu**
```
MENU_MAIN
├── Tombol1 → MENU_SELECT_COURIER
├── Tombol2 → MENU_SCAN_TRACKING
└── Keypad '#' → MENU_OPEN_DOOR

MENU_SELECT_COURIER
├── Keypad '1' → MENU_INPUT_TRACKING (Shopee)
├── Keypad '2' → MENU_INPUT_TRACKING (J&T)
├── Keypad '3' → MENU_INPUT_TRACKING (SiCepat)
└── Keypad 'B' → MENU_MAIN

MENU_INPUT_TRACKING
├── Input keypad → buffer trackingInput
├── Keypad '#' → MENU_COMPARE_TRACKING
└── Keypad '*' → MENU_MAIN

MENU_SCAN_TRACKING
├── Barcode terdeteksi → scannedBarcode
├── Tombol2 + barcode siap → MENU_COMPARE_TRACKING
└── Keypad 'B' → MENU_MAIN

MENU_COMPARE_TRACKING
├── Pencarian database → receipts[]
├── Ditemukan → MENU_INSERT_PACKAGE
└── Tidak ditemukan → MENU_MAIN

MENU_INSERT_PACKAGE
├── Paket terdeteksi → Tutup pintu
├── Tipe COD → MENU_OPEN_LOKER
└── Tipe Non-COD → MENU_MAIN

MENU_OPEN_LOKER
├── Switch keluar dipicu → MENU_CLOSE_LOKER
└── Tunggu pengambilan

MENU_CLOSE_LOKER
├── Switch masuk dipicu → MENU_MAIN
└── Tunggu pintu tutup

MENU_OPEN_DOOR
├── QR Valid → Akses 5 detik → MENU_MAIN
└── QR Invalid → Error → MENU_MAIN
```

---

## 13. ANALISIS LENGKAP IMPLEMENTASI CODE

### **Analisis Fungsi Sensor [sensor.ino]**

#### **initializeSensors()**
```cpp
void initializeSensors() {
  Wire.begin();                                       // I2C Bus
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67);  // Barcode Scanner
  pcfEntryInput.begin(0x20, &Wire);                   // Entry Limit Switch
  pcfExitOutput.begin(0x21, &Wire);                   // Exit Limit Switch
}
```

**Breakdown Code:**
1. **Wire.begin()**: Menginisialisasi bus I2C sebagai master, memungkinkan komunikasi dengan LCD (0x27), Keypad (0x22), dan PCA9685 (0x40)
2. **Serial2.begin()**: Mengatur komunikasi serial 9600 baud 8N1 pada pin RX_GM67 dan TX_GM67 untuk scanner barcode GM67
3. **pcfEntryInput.begin(0x20)**: Inisialisasi IC PCF8574 pada alamat 0x20 untuk membaca limit switch entry
4. **pcfExitOutput.begin(0x21)**: Inisialisasi IC PCF8574 pada alamat 0x21 untuk membaca limit switch exit

**Dependency:** Dipanggil dari TaskControl() saat startup untuk menginisialisasi semua sensor input

#### **readDistanceSensor()**
```cpp
int readDistanceSensor() {
  int measuredDistance = sonar.ping_cm();          // Ping ultrasonik
  if (measuredDistance == 0) return MAX_DISTANCE; // Jika out of range
  else return measuredDistance;                    // Return jarak valid
}
```

**Breakdown Code:**
1. **sonar.ping_cm()**: Mengirim pulse ultrasonik dan menghitung jarak dalam cm berdasarkan waktu echo
2. **Kondisi 0**: Jika sensor mengembalikan 0, berarti target di luar jangkauan (>45cm)
3. **Return MAX_DISTANCE**: Nilai konstanta 45 untuk menunjukkan kosong
4. **Return measured**: Jarak aktual jika dalam range 1-45cm

**Penggunaan:** Dipanggil setiap loop untuk mendeteksi paket dalam kotak utama

#### **readLimitSwitches()**
```cpp
void readLimitSwitches() {
  entrySwitches[0] = !pcfEntryInput.digitalRead(5);  // Loker 1 entry
  entrySwitches[1] = !pcfEntryInput.digitalRead(1);  // Loker 2 entry
  // ... dst untuk loker 2-5 dan pintu utama
  exitSwitches[0] = !pcfExitOutput.digitalRead(5);   // Loker 1 exit
  // ... dst untuk semua exit switch
}
```

**Breakdown Code:**
1. **digitalRead()**: Membaca status digital pin PCF8574 (HIGH/LOW)
2. **Negasi (!)**: Inversi logika karena switch aktif LOW
3. **Array mapping**: Pin fisik PCF8574 ke indeks array logical
4. **Indeks 0-4**: Loker 1-5, Indeks 5: Pintu utama

**Logic Flow:** Entry=0 (terbuka), Entry=1 (tertutup/ada halangan)

#### **processSerialCommands()**
```cpp
void processSerialCommands() {
  if (Serial.available()) {
    serialInput = Serial.readStringUntil('\n');     // Baca command
    playAudioCommand(serialInput);                  // Audio feedback
  }
  if (serialInput == "r") ESP.restart();            // Restart
  else if (serialInput == "o1") lokerControlCommands[0] = "buka"; // Buka loker 1
  // ... mapping semua command o1-o5, c1-c5, ot/ct, or/cr
}
```

**Breakdown Code:**
1. **Serial.available()**: Cek buffer serial ada data
2. **readStringUntil('\n')**: Baca sampai newline character
3. **Command mapping**: String command ke aksi spesifik
4. **State update**: Mengubah variabel kontrol untuk aktuator

**Command List:**
- `r`: Restart ESP32
- `o1`-`o5`: Buka loker 1-5
- `c1`-`c5`: Tutup loker 1-5
- `ot`/`ct`: Buka/tutup pintu utama
- `or`/`cr`: Buka/tutup relay

### **Analisis Fungsi Aktuator [actuator.ino]**

#### **initializeAudioSystem()**
```cpp
void initializeAudioSystem() {
  Serial1.begin(9600, SERIAL_8N1, SPEAKER_RX_PIN, SPEAKER_TX_PIN); // UART to DFPlayer
  if (!myDFPlayer.begin(Serial1)) {                                // Cek inisialisasi
    Serial.println("Unable to begin:");
    while (true);                                                  // Hang jika gagal
  }
  myDFPlayer.setTimeOut(500);                                      // Timeout 500ms
  myDFPlayer.volume(VOLUME);                                       // Set volume awal
  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SD);                     // Pilih SD card
}
```

**Breakdown Code:**
1. **Serial1.begin()**: Inisialisasi UART untuk komunikasi dengan DFPlayer Mini
2. **myDFPlayer.begin()**: Handshake dengan modul audio, return false jika gagal
3. **while(true)**: Infinite loop jika audio tidak tersedia (sistem tidak bisa berjalan tanpa feedback)
4. **setTimeOut(500)**: Batas waktu response command 500ms
5. **outputDevice()**: Menggunakan SD card sebagai sumber audio file

**Dependency:** Critical system, jika gagal sistem akan hang

#### **controlAllLokers()**
```cpp
void controlAllLokers() {
  for (int i = 0; i < 5; i++) {
    if (lokerControlCommands[i] == "tutup") closeLokerCompartment(i);
    else if (lokerControlCommands[i] == "buka") openLokerCompartment(i);
  }
}
```

**Breakdown Code:**
1. **Loop 5 loker**: Iterasi semua loker COD (indeks 0-4)
2. **String comparison**: Bandingkan command string dengan konstanta
3. **Function call**: Panggil fungsi servo control yang sesuai
4. **No reset**: Command tetap aktif sampai diubah eksplisit

**Control Flow:** Command → Function → PWM → Physical movement

#### **openLokerCompartment(int lokerNumber)**
```cpp
void openLokerCompartment(int lokerNumber) {
  if (exitSwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(135));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

**Breakdown Code:**
1. **Safety check**: Cek exit switch sebelum bergerak
2. **exitSwitches[lokerNumber] == 0**: Jika jalur keluar bebas
3. **convertAngleToPulse(135)**: Konversi sudut 135° ke pulse width PWM
4. **Fallback to 100**: Posisi netral jika ada obstacle
5. **servo.setPWM()**: Command langsung ke driver PCA9685

**Safety Logic:** Hanya bergerak jika aman, stop jika ada hambatan

#### **convertAngleToPulse(int angle)**
```cpp
int convertAngleToPulse(int angle) {
  int pulseWidth = map(angle, 0, 180, SERVOMIN, SERVOMAX);
  return pulseWidth;
}
```

**Breakdown Code:**
1. **map()**: Linear mapping Arduino built-in function
2. **Input range**: 0-180 derajat (rentang servo standar)
3. **Output range**: SERVOMIN-SERVOMAX (konstanta PWM untuk PCA9685)
4. **Kalkulasi**: pulseWidth = SERVOMIN + (angle * (SERVOMAX-SERVOMIN) / 180)

**Purpose:** Konversi sudut servo ke PWM value yang kompatibel dengan PCA9685

### **Analisis State Machine Menu [menu.ino]**

#### **Enum MenuState**
```cpp
enum MenuState {
  MENU_MAIN,              // Status utama dengan pilihan
  MENU_SELECT_COURIER,    // Pemilihan kurir pengiriman
  MENU_INPUT_TRACKING,    // Input manual nomor resi
  MENU_SCAN_TRACKING,     // Scan barcode resi
  MENU_COMPARE_TRACKING,  // Validasi resi dengan database
  MENU_TRACKING_FOUND,    // Resi valid ditemukan
  MENU_INSERT_PACKAGE,    // Proses penyisipan paket
  MENU_OPEN_LOKER,        // Buka loker COD
  MENU_CLOSE_LOKER,       // Tutup loker COD
  MENU_OPEN_DOOR          // Akses QR code
};
```

**State Design:** Finite State Machine dengan transisi eksplisit antar state

#### **Case MENU_MAIN**
```cpp
case MENU_MAIN:
  displayTextOnLCD(0, 0, "        " + String(100 - (currentDistance * 100 / 45)) + "%");
  displayTextOnLCD(0, 2, "  INPUT  ||   SCAN  ");
  displayTextOnLCD(0, 3, "  RESI   ||   RESI  ");
  
  if (button1) {
    currentMenuState = MENU_SELECT_COURIER;
  } else if (button2) {
    currentMenuState = MENU_SCAN_TRACKING;
  }
  if (keyPad.isPressed() && keyPad.getChar() == '#') {
    currentMenuState = MENU_OPEN_DOOR;
  }
```

**Breakdown Code:**
1. **Kalkulasi kapasitas**: `100 - (currentDistance * 100 / 45)` mengkonversi jarak 0-45cm ke persentase 100-0%
2. **UI Layout**: Tampilan 2 kolom dengan separator "||"
3. **Input handling**: 3 jalur input berbeda (button1, button2, keypad #)
4. **State transition**: Langsung ubah currentMenuState tanpa kondisi tambahan

**UI Logic:** Real-time capacity monitoring + static menu options

#### **Case MENU_COMPARE_TRACKING**
```cpp
case MENU_COMPARE_TRACKING:
  playAudioCommand(String(soundCekResi));
  displayTextOnLCD(0, 0, "Mengecek Resi...");
  
  bool resiDitemukan = false;
  vTaskDelay(2500);                    // Artificial delay untuk UX
  
  for (int i = 0; i < MAX_PACKAGES; i++) {
    if (scannedBarcode == receipts[i].noResi) {
      resiDitemukan = true;
      currentPackageIndex = i;
      packageType = receipts[i].tipePaket;
      break;
    }
  }
  
  if (resiDitemukan) {
    playAudioCommand(String(soundResiCocok));
    serialInput = "ot";                // Command buka pintu
    currentMenuState = MENU_INSERT_PACKAGE;
  } else {
    playAudioCommand(String(soundResiTidakCocok));
    currentMenuState = MENU_MAIN;
  }
```

**Breakdown Code:**
1. **Audio feedback**: Immediate user feedback dengan sound
2. **UI feedback**: Loading message untuk user experience
3. **Database search**: Linear search through receipts array
4. **String comparison**: Direct comparison scannedBarcode dengan noResi
5. **Data capture**: Simpan index dan type untuk state selanjutnya
6. **Hardware command**: Set serialInput untuk trigger servo
7. **State branching**: 2 jalur berbeda berdasarkan hasil pencarian

**Search Algorithm:** O(n) linear search, berhenti pada match pertama

#### **Case MENU_INSERT_PACKAGE**
```cpp
case MENU_INSERT_PACKAGE:
  if (!entrySwitches[5] == 0) {    // Jika pintu utama terbuka
    displayTextOnLCD(0, 1, "  Silahkan Masukan");
    displayTextOnLCD(0, 2, "       Paket!");
    
    if (isPackageReceived == false) {
      if (currentDistance != 0 && currentDistance < 20) {
        serialInput = "ct";          // Command tutup pintu
        isPackageReceived = true;
      }
    }
  }
  
  if (!exitSwitches[5] == 0 && isPackageReceived) {
    if (packageType == "COD") {
      // Logic buka loker COD
      switch (receipts[currentPackageIndex].nomorLoker) {
        case 1: serialInput = "o1"; break;
        case 2: serialInput = "o2"; break;
        // ... cases untuk loker 3-5
      }
      currentMenuState = MENU_OPEN_LOKER;
    } else if (packageType == "Non-COD") {
      currentMenuState = MENU_MAIN;
    }
  }
```

**Breakdown Code:**
1. **Safety interlock**: Cek status switch sebelum aksi
2. **Package detection**: Ultrasonic distance < 20cm = paket terdeteksi
3. **Flag management**: isPackageReceived untuk prevent duplicate detection
4. **Door control**: Automatic close door setelah paket masuk
5. **Type branching**: Alur berbeda untuk COD vs Non-COD
6. **Switch statement**: Mapping nomorLoker ke command string
7. **State flow**: COD → MENU_OPEN_LOKER, Non-COD → MENU_MAIN

**Detection Logic:** Distance sensor + limit switch confirmation untuk akurasi

### **Analisis Display Management [display.ino]**

#### **displayTextOnLCD()**
```cpp
void displayTextOnLCD(int xPosition, int yPosition, String textBuffer) {
  if (lastDisplayedText[yPosition] != textBuffer) {    // Anti-flicker check
    lastDisplayedText[yPosition] = textBuffer;         // Update cache
    
    String clearString = String("                    ");  // 20 spaces
    lcd.setCursor(xPosition, yPosition);
    lcd.print(clearString);                            // Clear old text
    
    while (textBuffer.length() < 20) {                 // Pad to 20 chars
      textBuffer += " ";
    }
    if (textBuffer.length() > 20) {                    // Truncate if over
      textBuffer = textBuffer.substring(0, 20);
    }
    
    char displayBuffer[21];                            // C-style buffer
    snprintf(displayBuffer, 21, "%s", textBuffer.c_str());
    lcd.setCursor(xPosition, yPosition);
    lcd.print(displayBuffer);
  }
}
```

**Breakdown Code:**
1. **Flicker prevention**: Compare dengan lastDisplayedText cache untuk skip update yang tidak perlu
2. **Cache update**: Simpan text baru ke cache array
3. **Clear old content**: Print 20 spasi untuk hapus teks lama
4. **Text normalization**: Pad dengan spasi atau truncate ke exactly 20 karakter
5. **Buffer conversion**: String to C-style char array untuk kompatibilitas LCD
6. **Atomic update**: setCursor + print dalam satu operasi

**Performance:** Significant optimization untuk LCD 20x4, mengurangi flicker dan meningkatkan responsiveness

### **Analisis Network Operations [Network.ino]**

#### **updateDatabaseData()**
```cpp
void updateDatabaseData() {
  app.loop();                                // Maintain Firebase connection
  
  static uint32_t firestoreUpdateTimer;
  if (millis() - firestoreUpdateTimer >= 5000 && app.ready()) {
    firestoreUpdateTimer = millis();
    
    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));
    
    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);
    
    // Parse users array
    int currentUserIndex = 0;
    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      if (currentUserIndex < MAX_USERS) {
        users[currentUserIndex].email = v["fields"]["email"]["stringValue"];
        users[currentUserIndex].nama = v["fields"]["nama"]["stringValue"];
      }
      currentUserIndex++;
    }
    // Similar parsing untuk receipts dan lokerControl
  }
}
```

**Breakdown Code:**
1. **Connection maintenance**: app.loop() untuk keep-alive Firebase connection
2. **Timer-based update**: Static variable untuk 5-second interval tanpa blocking
3. **Ready check**: app.ready() memastikan Firebase siap sebelum request
4. **Batch requests**: 3 collection dalam satu update cycle
5. **JSON parsing**: ArduinoJson library untuk deserialize Firestore response
6. **Array population**: Manual mapping dari JSON structure ke local arrays
7. **Bounds checking**: Prevent overflow dengan MAX_USERS, MAX_RECEIPTS limit

**Network Pattern:** Non-blocking periodic sync dengan error tolerance

#### **Firestore JSON Structure**
```json
{
  "documents": [
    {
      "fields": {
        "email": {"stringValue": "user@example.com"},
        "nama": {"stringValue": "User Name"}
      }
    }
  ]
}
```

**Data Flow:** Firestore → JSON → ArduinoJson → Local struct arrays → Application logic

---

## KESIMPULAN ANALISIS

### **Kekuatan Implementasi:**
1. **Dual-core RTOS**: Pemisahan concerns network vs hardware dengan efisien
2. **Safety-first hardware control**: Limit switch checks sebelum movement
3. **Non-blocking operations**: Timer-based updates tanpa delay yang blocking
4. **Robust state machine**: Clear state transitions dengan error handling
5. **Anti-flicker display**: Optimized LCD updates untuk UX yang smooth

### **Area untuk Improvement:**
1. **Error recovery**: Limited exception handling untuk network/hardware failures
2. **Memory management**: Fixed arrays bisa di-optimize dengan dynamic allocation
3. **Security**: Hardcoded credentials dan unencrypted communication
4. **Scalability**: Linear search algorithms O(n) untuk database operations
5. **Logging**: Minimal debugging information untuk production troubleshooting

### **Architectural Decisions:**
1. **String-based commands**: Readable tapi memory-intensive, bisa diganti dengan enums
2. **Polling-based I/O**: Sederhana tapi bisa diganti dengan interrupt-driven untuk efficiency
3. **Firebase REST**: Real-time tapi bandwidth-heavy, bisa di-cache lebih aggressive
4. **Monolithic state machine**: Functional tapi bisa di-break down untuk maintainability

---

**Pengembang:** SHINTYA PUTRI WIJAYA (2141160117)  
**Proyek:** Smart Packet Box COD ESP32 Firmware - Analisis Lengkap Kode dan Implementasi