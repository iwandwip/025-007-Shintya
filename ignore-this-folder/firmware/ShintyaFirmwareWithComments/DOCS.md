# DOCS.md - Dokumentasi Firmware ESP32 ShintyaFirmwareWithComments

## Overview

Dokumentasi ini menjelaskan cara kerja firmware ESP32 untuk Smart Packet Box dengan dukungan Cash on Delivery (COD). Firmware menggunakan arsitektur RTOS dual-core untuk kontrol hardware real-time dan komunikasi Firebase.

## Struktur File dan Fungsinya

### 1. **ShintyaFirmwareWithComments.ino** - File Utama
**Fungsi**: Entry point utama program
**Isi**:
- `setup()`: Inisialisasi komunikasi serial dan memulai task RTOS
- `loop()`: Dibiarkan kosong karena semua logika ditangani oleh task RTOS
- Include library.h yang berisi semua definisi global

**Cara Kerja**:
1. Program dimulai dengan `setup()` yang menginisialisasi serial pada 115200 baud
2. Memanggil `setupRTOS()` untuk membuat dan menjalankan task-task RTOS
3. `loop()` kosong karena semua pemrosesan dilakukan oleh task RTOS yang berjalan parallel

### 2. **library.h** - Header File dengan Definisi Global
**Fungsi**: Menyimpan semua definisi, variabel global, dan konfigurasi
**Isi**:
- **Include Libraries**: FirebaseClient, LCD, Sensor, Audio, dll
- **Konfigurasi Hardware**:
  - LCD: `LiquidCrystal_I2C lcd(0x27, 20, 4)` - LCD 20x4 alamat I2C 0x27
  - Ultrasonic: `NewPing sonar` - Pin 32/33, jarak max 45cm
  - Barcode Scanner: Serial2 - Pin RX:26, TX:25
  - Keypad: `I2CKeyPad` alamat 0x22
  - Servo Controller: `Adafruit_PWMServoDriver` alamat 0x40
  - Audio: `DFRobotDFPlayerMini` - Pin TX:17, RX:16
- **Variabel Global**:
  - `currentDistance`: Jarak sensor ultrasonik saat ini
  - `scannedBarcode`: String barcode yang dipindai
  - `lokerControlCommands[5]`: Array perintah kontrol loker 1-5
  - `mainDoorControl`: Kontrol pintu utama (buka/tutup)
  - `entrySwitches[6]`, `exitSwitches[6]`: Status limit switch
- **Struktur Data**:
  - `UsersTypedef`: email, nama
  - `RececiptsTypedef`: nama, noResi, nomorLoker, status, tipePaket, userEmail
  - `LokerControlTypedef`: nomorLoker, buka, tutup
- **Konfigurasi Network**: WiFi SSID, password, Firebase API key, project ID

### 3. **RTOS.ino** - Manajemen Task RTOS
**Fungsi**: Mengatur task dual-core RTOS
**Isi**:
- `TaskDatabase()`: Task untuk Core 0 - operasi Firebase
- `TaskControl()`: Task untuk Core 1 - kontrol hardware dan UI
- `setupRTOS()`: Membuat dan assign task ke core

**Cara Kerja**:
1. **Core 0 (TaskDatabase)**:
   - Inisialisasi koneksi WiFi dan Firebase
   - Update data dari database setiap 2 detik
   - Sinkronisasi data users, receipts, lokerControl
2. **Core 1 (TaskControl)**:
   - Inisialisasi semua hardware (audio, LCD, sensor, servo, keypad)
   - Loop kontrol hardware: baca sensor, kontrol aktuator, proses menu
   - Responsif terhadap input user dan perintah serial

### 4. **sensor.ino** - Manajemen Sensor dan Input
**Fungsi**: Mengatur semua sensor dan input device
**Isi**:
- `initializeSensors()`: Inisialisasi I2C, Serial2, PCF8574
- `scanBarcodeFromSerial()`: Membaca barcode dari GM67 scanner
- `readDistanceSensor()`: Membaca jarak ultrasonik (0-45cm)
- `initializeKeypad()`: Setup keypad I2C
- `processKeypadInput()`: Proses input tombol keypad
- `processSerialCommands()`: Proses perintah dari Serial Monitor
- `readLimitSwitches()`: Baca status limit switch dari PCF8574

**Cara Kerja**:
1. **Ultrasonic Sensor**: `sonar.ping_cm()` mengukur jarak, return MAX_DISTANCE jika 0
2. **Barcode Scanner**: `Serial2.readStringUntil('\r')` baca hingga carriage return
3. **Keypad**: Mapping karakter `"147*2580369#ABCDNF"` untuk tombol 4x4
4. **Limit Switches**: PCF8574 expander alamat 0x20 (entry) dan 0x21 (exit)
5. **Serial Commands**: 
   - `r`: restart ESP32
   - `o1-o5`: buka loker 1-5
   - `c1-c5`: tutup loker 1-5
   - `ot/ct`: buka/tutup pintu utama

### 5. **actuator.ino** - Kontrol Aktuator
**Fungsi**: Mengontrol semua aktuator (servo, audio, relay)
**Isi**:
- `initializeAudioSystem()`: Setup DFPlayer Mini dengan volume 30
- `playAudioCommand()`: Kontrol audio (volume s0-s30, pause p, play 1-100)
- `initializeRelay()`: Setup relay pin 27 (pintu utama)
- `controlRelayOutput()`: Kontrol relay HIGH/LOW
- `controlAllLokers()`: Kontrol semua loker 1-5
- `openLokerCompartment()`, `closeLokerCompartment()`: Kontrol individual loker
- `openMainDoor()`, `closeMainDoor()`: Kontrol pintu utama (servo channel 5-6)
- `initializeServoController()`: Setup PCA9685 PWM driver
- `convertAngleToPulse()`: Konversi sudut (0-180°) ke PWM pulse
- `processRemoteLokerCommands()`: Proses perintah loker dari Firebase

**Cara Kerja**:
1. **Audio System**: DFPlayer Mini dengan kartu SD, file audio 1-100
2. **Servo Control**: PCA9685 driver, channel 0-4 untuk loker, 5-6 untuk pintu utama
3. **Servo Positions**:
   - Loker buka: 135° (atau 100° jika limit switch aktif)
   - Loker tutup: 75° (atau 100° jika limit switch aktif)
   - Pintu utama buka: channel 5=142°, channel 6=80°
   - Pintu utama tutup: channel 5=80°, channel 6=119°
4. **Relay Control**: LOW=aktif (pintu terbuka), HIGH=nonaktif (pintu tertutup)

### 6. **display.ino** - Manajemen LCD Display
**Fungsi**: Mengatur tampilan LCD 20x4
**Isi**:
- `initializeLCDDisplay()`: Inisialisasi LCD, tampilkan judul dan NIM
- `displayTextOnLCD()`: Tampilkan teks dengan smart update (mencegah flicker)
- `displaySystemData()`: Placeholder untuk tampilan data sistem

**Cara Kerja**:
1. **Smart Display Update**: Buffer `lastDisplayedText[4]` menyimpan teks terakhir per baris
2. **Anti-Flicker**: Hanya update LCD jika teks berubah
3. **Format Text**: Pastikan panjang 20 karakter (tambah spasi atau potong)
4. **Positioning**: `lcd.setCursor(x, y)` untuk posisi kursor

### 7. **menu.ino** - Sistem Menu dan Navigasi
**Fungsi**: Mengelola flow menu dan interaksi user
**Isi**:
- **Enum MenuState**: 9 status menu (MAIN, SELECT_COURIER, INPUT_TRACKING, dll)
- **Variabel Menu**:
  - `currentMenuState`: Status menu saat ini
  - `selectedCourier`: Kurir terpilih (0=Belum Ada, 1=Shopee, 2=J&T, 3=SiCepat)
  - `trackingInput`: Input resi manual
  - `currentPackageIndex`: Indeks paket aktif
  - `packageType`: Tipe paket (COD/Non-COD)
- `menu()`: Fungsi utama dengan switch-case untuk tiap status

**Flow Menu**:
1. **MENU_MAIN**: Tampil kapasitas, pilih INPUT/SCAN resi, QR access (#)
2. **MENU_SELECT_COURIER**: Pilih kurir (1=Shopee, 2=J&T, 3=SiCepat)
3. **MENU_INPUT_TRACKING**: Input resi manual dengan keypad
4. **MENU_SCAN_TRACKING**: Scan barcode resi dengan GM67
5. **MENU_COMPARE_TRACKING**: Validasi resi dengan database
6. **MENU_INSERT_PACKAGE**: Masukkan paket ke box utama
7. **MENU_OPEN_LOKER**: Buka loker COD untuk ambil uang
8. **MENU_CLOSE_LOKER**: Tutup loker COD setelah selesai
9. **MENU_OPEN_DOOR**: Akses QR code untuk buka pintu

### 8. **Network.ino** - Komunikasi Firebase
**Fungsi**: Mengatur koneksi WiFi dan Firebase
**Isi**:
- `initializeNetworkConnection()`: Koneksi WiFi dengan SSID/password
- `initializeFirebaseDatabase()`: Setup Firebase Firestore
- `updateDatabaseData()`: Update data dari database setiap 5 detik
- `updateTrackingData()`: Placeholder update tracking data
- `initializeDummyPackages()`: Data paket contoh untuk testing

**Cara Kerja**:
1. **WiFi Connection**: Loop hingga `WL_CONNECTED`, tampilkan IP address
2. **Firebase Setup**: SSL client, UserAuth, FirebaseApp, Firestore::Documents
3. **Data Sync**: GET request ke koleksi users/receipts/lokerControl
4. **JSON Parsing**: Deserialize ke struktur data lokal
5. **Update Frequency**: Setiap 5 detik jika `app.ready()`

## Alur Kerja Program

### 1. **Startup Sequence**
1. `setup()` → `setupRTOS()`
2. Core 0: `TaskDatabase` → WiFi → Firebase
3. Core 1: `TaskControl` → Hardware init → Menu loop

### 2. **Package Processing Flow**

#### **Paket Regular (Non-COD)**:
1. Pilih metode input (INPUT/SCAN)
2. Input/scan nomor resi
3. Validasi dengan database
4. Buka pintu utama
5. Deteksi paket masuk (jarak < 20cm)
6. Tutup pintu utama
7. Selesai → kembali ke menu utama

#### **Paket COD**:
1. Sama seperti regular hingga step 6
2. Buka loker COD sesuai `nomorLoker` dari database
3. Tunggu pengambilan uang (limit switch keluar)
4. Tutup loker otomatis
5. Selesai → kembali ke menu utama

#### **QR Code Access**:
1. Tekan '#' di menu utama
2. Scan QR code user
3. Validasi dengan `registeredUserEmails[]`
4. Jika valid: aktifkan relay 5 detik
5. Kembali ke menu utama

### 3. **Hardware Control Loop**
```
TaskControl (Core 1):
├── readLimitSwitches()
├── controlAllLokers()
├── controlMainDoor()
├── controlRelayOutput()
├── processRemoteLokerCommands()
├── menu()
├── readDistanceSensor()
└── processSerialCommands()
```

### 4. **Database Sync Loop**
```
TaskDatabase (Core 0):
├── app.loop() (maintain Firebase connection)
├── Timer check (every 5 seconds)
├── GET users/receipts/lokerControl
├── JSON deserialize
└── Update local arrays
```

## Konfigurasi Hardware

### **Pin Assignment**:
- **Ultrasonic**: TRIG=33, ECHO=32
- **Barcode**: RX=26, TX=25
- **Audio**: RX=16, TX=17
- **Relay**: Pin 27
- **Buttons**: Pin 36, 39

### **I2C Devices**:
- **LCD**: 0x27 (20x4 display)
- **Keypad**: 0x22 (4x4 matrix)
- **Servo Driver**: 0x40 (PCA9685)
- **Limit Switch Entry**: 0x20 (PCF8574)
- **Limit Switch Exit**: 0x21 (PCF8574)

### **Servo Channels**:
- **Channel 0-4**: Loker 1-5
- **Channel 5-6**: Pintu utama

## Audio System

### **Sound Enum**:
- `soundResiCocok = 1`: Resi cocok
- `soundLoker1Terbuka = 2`: Loker 1 terbuka
- `soundInputResi = 14`: Input resi
- `soundScanResi = 15`: Scan resi
- `soundTerimaKasih = 16`: Terima kasih
- `soundResiTidakCocok = 17`: Resi tidak cocok

## Database Structure

### **Collections**:
1. **users**: email, nama
2. **receipts**: nama, noResi, nomorLoker, status, tipePaket, userEmail
3. **lokerControl**: nomorLoker, buka, tutup

### **Local Arrays**:
- `users[MAX_USERS]`: Data pengguna
- `receipts[MAX_RECEIPTS]`: Data resi/paket
- `lokerControl[MAX_LOKER_CONTROL]`: Perintah kontrol loker

## Troubleshooting

### **Common Issues**:
1. **LCD tidak tampil**: Cek alamat I2C 0x27
2. **Servo tidak bergerak**: Cek koneksi PCA9685
3. **Audio tidak keluar**: Cek kartu SD DFPlayer
4. **Keypad tidak responsif**: Cek alamat I2C 0x22
5. **Limit switch salah baca**: Cek wiring PCF8574

### **Debug Commands**:
- Serial Monitor 115200 baud
- Status koneksi Firebase
- Pembacaan sensor dan limit switch
- Navigasi menu dan pemrosesan perintah

## Security Features

1. **QR Code Validation**: Email harus ada di `registeredUserEmails[]`
2. **Receipt Verification**: Nomor resi harus ada di database
3. **Timeout Protection**: Relay otomatis mati setelah 5 detik
4. **Limit Switch Monitoring**: Deteksi buka/tutup loker dan pintu

Firmware ini mengimplementasikan sistem smart locker dengan kontrol real-time, integrasi cloud database, dan multiple interface (keypad, barcode, QR code) untuk operasi COD yang aman dan efisien.