# DOKUMENTASI FIRMWARE ESP32 SMART PACKET BOX COD
### Analisis Code Structure dan Function Hierarchy

---

## DAFTAR ISI

1. [Overview Sistem](#1-overview-sistem)
2. [Struktur File dan Isinya](#2-struktur-file-dan-isinya)
3. [Cara Kerja Program](#3-cara-kerja-program)
4. [Function Call Hierarchy](#4-function-call-hierarchy)
5. [Hardware Configuration](#5-hardware-configuration)
6. [Database Structure](#6-database-structure)
7. [Menu State Machine](#7-menu-state-machine)
8. [Debug dan Troubleshooting](#8-debug-dan-troubleshooting)

---

## 1. OVERVIEW SISTEM

### Arsitektur RTOS Dual-Core
- **Core 0**: Database operations (TaskDatabase)
- **Core 1**: Hardware control (TaskControl)
- **Tujuan**: Pemisahan network I/O dan hardware control untuk real-time response

### Komponen Utama
- ESP32 dengan WiFi
- LCD 20x4 (I2C 0x27)
- Ultrasonic sensor (Pin 32/33)
- Barcode scanner GM67 (Serial2)
- Keypad 4x4 (I2C 0x22)
- 7 Servo motors (PCA9685 0x40)
- Audio DFPlayer Mini (Serial1)
- 12 Limit switches (PCF8574 0x20/0x21)

---

## 2. STRUKTUR FILE DAN ISINYA

### **ShintyaFirmwareWithComments.ino**
**Isi:**
- `setup()`: Entry point, start serial communication, call setupRTOS()
- `loop()`: Empty (semua logic di RTOS tasks)
- Include library.h

**Fungsi:** Program entry point dan RTOS initialization

### **library.h**
**Isi:**
- Library includes: FirebaseClient, LiquidCrystal_I2C, NewPing, Adafruit libraries, dll
- Hardware pin definitions: SONAR_TRIG_PIN=33, RX_GM67=26, RELAY_SELECT_PIN=27, dll
- Global variables: currentDistance, scannedBarcode, lokerControlCommands[5], entrySwitches[6]
- Data structures: UsersTypedef{email,nama}, RececiptsTypedef{nama,noResi,nomorLoker,status,tipePaket,userEmail}
- Network configuration: WIFI_SSID, API_KEY, FIREBASE_PROJECT_ID credentials
- Constants: MAX_USERS=10, MAX_PACKAGES=30, MAX_DISTANCE=45, VOLUME=30

**Fungsi:** Global configuration dan variable declarations

### **RTOS.ino**
**Isi:**
- `TaskDatabase(void *pvParameters)`: Infinite loop untuk network ops, call initializeNetworkConnection(), updateDatabaseData() setiap 2s
- `TaskControl(void *pvParameters)`: Infinite loop untuk hardware control, init semua devices, main control loop
- `setupRTOS()`: Create 2 tasks dengan xTaskCreatePinnedToCore(), assign ke Core 0 dan Core 1
- Task handles: DatabaseHandle dan ControlHandle untuk task management

**Fungsi:** RTOS task management dan core assignment

### **sensor.ino**
**Isi:**
- `initializeSensors()`: Setup komunikasi I2C, Serial2 untuk barcode, dan PCF8574 expander
- `scanBarcodeFromSerial()`: Baca string barcode dari GM67 via Serial2 hingga '\r'
- `readDistanceSensor()`: Kirim ping ultrasonic, return jarak dalam cm (0-45cm range)
- `initializeKeypad()`: Setup keypad I2C dan load character mapping
- `processKeypadInput()`: Detect tombol keypad yang ditekan, filter 'F' dan 'N'
- `processSerialCommands()`: Parse perintah debug dari Serial Monitor (r, o1-o5, c1-c5, etc)
- `readLimitSwitches()`: Baca status 12 limit switches via PCF8574, update global arrays

**Fungsi:** Input device management dan sensor reading

### **actuator.ino** 
**Isi:**
- `initializeAudioSystem()`: Setup DFPlayer Mini, set volume dan output device ke SD card
- `playAudioCommand()`: Parse string command untuk volume (s0-s30), pause (p), atau play file (1-100)
- `initializeRelay()`: Set pin 27 sebagai OUTPUT dan default state HIGH (door locked)
- `controlRelayOutput()`: Set relay LOW/HIGH berdasarkan relayControlCommand global variable
- `controlAllLokers()`: Loop 5 loker, check lokerControlCommands[] dan execute buka/tutup
- `openLokerCompartment()` / `closeLokerCompartment()`: Control individual servo berdasarkan limit switch state
- `controlMainDoor()`: Control dual servo (channels 5-6) untuk main door berdasarkan mainDoorControl
- `initializeServoController()`: Setup PCA9685, set frequency 60Hz, init servo positions
- `convertAngleToPulse()`: Convert angle (0-180°) ke PWM pulse width untuk servo control
- `processRemoteLokerCommands()`: Baca lokerControl[] array dari Firebase, generate serial commands

**Fungsi:** Output device control dan actuator management

### **display.ino**
**Isi:**
- `initializeLCDDisplay()`: Init LCD I2C, nyalakan backlight, tampilkan nama dan NIM developer
- `displayTextOnLCD()`: Update LCD hanya jika text berubah, format ke 20 char, prevent flicker
- `lastDisplayedText[4]`: Buffer array untuk compare text lama vs baru pada 4 baris LCD
- `displaySystemData()`: Placeholder function untuk display barcode atau system data (unused)

**Fungsi:** LCD management dengan optimized rendering

### **menu.ino**
**Isi:**
- `enum MenuState`: Define 9 menu states dari MAIN sampai OPEN_DOOR
- Menu state variables: currentMenuState, selectedCourier, trackingInput, packageType, dll
- `menu()`: Main state machine dengan switch-case, handle semua 9 states
- Navigation logic: button press detection, keypad input, state transitions
- Package flow logic: resi validation, COD vs Non-COD handling, QR access

**Fungsi:** User interface state machine dan navigation

### **Network.ino**
**Isi:**
- `initializeNetworkConnection()`: Connect ke WiFi, loop hingga WL_CONNECTED, print IP address
- `initializeFirebaseDatabase()`: Setup SSL client, initialize Firebase app dengan credentials
- `updateDatabaseData()`: GET 3 collections dari Firestore, deserialize JSON ke local arrays
- `updateTrackingData()`: Update packageDatabase[] dari receipts[] (currently commented out)
- `initializeDummyPackages()`: Populate packageDatabase[] dengan 6 sample tracking numbers
- JSON deserialization: Parse Firestore response ke users[], receipts[], lokerControl[]

**Fungsi:** Network communication dan database synchronization

---

## 3. CARA KERJA PROGRAM

### Program Startup Sequence
```
1. main() [Arduino Framework]
2. setup() → Serial.begin(115200) → setupRTOS()
3. xTaskCreatePinnedToCore(TaskDatabase, Core 0)
4. xTaskCreatePinnedToCore(TaskControl, Core 1)
5. Kedua task mulai execute secara parallel
```

### Core 0 (TaskDatabase) Flow
```
TaskDatabase():
├── initializeNetworkConnection() → WiFi.begin() → wait connection
├── initializeFirebaseDatabase() → SSL setup → Firebase app init
└── while(true):
    ├── app.loop() → maintain Firebase connection
    └── updateDatabaseData() [every 5 seconds]:
        ├── GET users collection → deserializeJson(usersDocument)
        ├── GET receipts collection → deserializeJson(receiptsDocument)
        ├── GET lokerControl collection → deserializeJson(lokerControlDocument)
        └── Update local arrays (users[], receipts[], lokerControl[])
```

### Core 1 (TaskControl) Flow
```
TaskControl():
├── Hardware Initialization:
│   ├── initializeAudioSystem() → DFPlayer Mini setup
│   ├── initializeLCDDisplay() → LCD init + title display
│   ├── initializeSensors() → I2C + Serial2 + PCF8574
│   ├── initializeServoController() → PCA9685 setup
│   ├── initializeKeypad() → keypad setup
│   ├── initializeRelay() → relay pin setup
│   └── initializeButtons() → button pins setup
├── playAudioCommand(soundPilihMetode)
├── initializeDummyPackages()
└── while(true) [Main Control Loop]:
    ├── readLimitSwitches() → update entrySwitches[], exitSwitches[]
    ├── controlAllLokers() → servo control berdasarkan lokerControlCommands[]
    ├── controlMainDoor() → servo control berdasarkan mainDoorControl
    ├── controlRelayOutput() → relay control berdasarkan relayControlCommand
    ├── processRemoteLokerCommands() → process Firebase commands
    ├── menu() → state machine execution
    ├── currentDistance = readDistanceSensor()
    └── processSerialCommands() → debug commands
```

---

## 4. FUNCTION CALL HIERARCHY

### Entry Points
```
setup() [ShintyaFirmwareWithComments.ino]
└── setupRTOS() [RTOS.ino]
    ├── xTaskCreatePinnedToCore(TaskDatabase, Core 0)
    └── xTaskCreatePinnedToCore(TaskControl, Core 1)
```

### Core 0 Function Calls
```
TaskDatabase() [RTOS.ino]
├── initializeNetworkConnection() [Network.ino]
├── initializeFirebaseDatabase() [Network.ino]
└── updateDatabaseData() [Network.ino] [Called every 5 seconds]
    ├── Docs.get() → Firebase API calls
    ├── deserializeJson() → JSON parsing
    └── Array updates → users[], receipts[], lokerControl[]
```

### Core 1 Function Calls
```
TaskControl() [RTOS.ino]
├── Initialization Phase:
│   ├── initializeAudioSystem() [actuator.ino]
│   ├── initializeLCDDisplay() [display.ino]
│   ├── initializeSensors() [sensor.ino]
│   ├── initializeServoController() [actuator.ino]
│   ├── initializeKeypad() [sensor.ino]
│   ├── initializeRelay() [actuator.ino]
│   └── initializeButtons() [actuator.ino]
└── Main Loop [Every cycle]:
    ├── readLimitSwitches() [sensor.ino]
    ├── controlAllLokers() [actuator.ino]
    │   └── Calls: openLokerCompartment(), closeLokerCompartment()
    ├── controlMainDoor() [actuator.ino]
    │   └── Calls: openMainDoor(), closeMainDoor(), stopMainDoor()
    ├── controlRelayOutput() [actuator.ino]
    ├── processRemoteLokerCommands() [actuator.ino]
    ├── menu() [menu.ino] [Main state machine]
    │   ├── displayTextOnLCD() [display.ino] [~40+ calls per cycle]
    │   ├── playAudioCommand() [actuator.ino] [On state changes]
    │   ├── scanBarcodeFromSerial() [sensor.ino] [In SCAN_TRACKING state]
    │   └── processKeypadInput() [sensor.ino] [In input states]
    ├── readDistanceSensor() [sensor.ino]
    └── processSerialCommands() [sensor.ino]
```

### Function Dependencies
```
displayTextOnLCD() [display.ino]
├── Called by: menu() [All 9 states, multiple calls per state]
├── Uses: lastDisplayedText[] buffer untuk anti-flicker
└── Hardware: lcd object (I2C 0x27)

controlAllLokers() [actuator.ino]  
├── Called by: TaskControl() main loop
├── Uses: lokerControlCommands[] array
├── Calls: openLokerCompartment(), closeLokerCompartment()
└── Hardware: servo object (PCA9685 channels 0-4)

readDistanceSensor() [sensor.ino]
├── Called by: TaskControl() main loop
├── Updates: currentDistance global variable
├── Used by: menu() untuk package detection
└── Hardware: sonar object (pins 32/33)

processRemoteLokerCommands() [actuator.ino]
├── Called by: TaskControl() main loop  
├── Reads: lokerControl[] array (from Firebase)
├── Updates: serialInput variable
└── Triggers: loker open/close commands
```

---

## 5. HARDWARE CONFIGURATION

### I2C Device Mapping
```cpp
0x27 - LCD 20x4
0x22 - Keypad 4x4
0x40 - PCA9685 Servo Driver
0x20 - PCF8574 Entry Limit Switches
0x21 - PCF8574 Exit Limit Switches
```

### Pin Configuration
```cpp
// Ultrasonic
#define SONAR_TRIG_PIN 33
#define SONAR_ECHO_PIN 32

// Barcode Scanner GM67
#define RX_GM67 26
#define TX_GM67 25

// Audio DFPlayer Mini  
#define SPEAKER_TX_PIN 17
#define SPEAKER_RX_PIN 16

// Relay
#define RELAY_SELECT_PIN 27

// Buttons
#define button1pin 39  // INPUT RESI
#define button2pin 36  // SCAN RESI
```

### Servo Channel Assignment
```cpp
Channel 0-4: Loker COD 1-5
Channel 5-6: Main Door (dual servo)

Servo Positions:
- 75°: Closed position
- 100°: Neutral/stop position  
- 135°: Open position
```

---

## 6. DATABASE STRUCTURE

### Local Arrays (ESP32 Memory)
```cpp
UsersTypedef users[MAX_USERS];           // Max 20 users
RececiptsTypedef receipts[MAX_RECEIPTS]; // Max 30 packages  
LokerControlTypedef lokerControl[5];     // 5 COD lokers
```

### Firebase Collections
```
users: {email, nama}
receipts: {nama, noResi, nomorLoker, status, tipePaket, userEmail}
lokerControl: {nomorLoker, buka, tutup}
```

### Data Sync Flow
```
Firebase → updateDatabaseData() → JSON deserialize → Local arrays
Local arrays → menu() logic → Hardware control
Remote commands → lokerControl[] → processRemoteLokerCommands() → Hardware
```

---

## 7. MENU STATE MACHINE

### State Definitions
```cpp
enum MenuState {
  MENU_MAIN,              // Main menu with capacity display
  MENU_SELECT_COURIER,    // Courier selection (1=Shopee, 2=J&T, 3=SiCepat)
  MENU_INPUT_TRACKING,    // Manual tracking number input
  MENU_SCAN_TRACKING,     // Barcode scanning mode
  MENU_COMPARE_TRACKING,  // Database validation
  MENU_INSERT_PACKAGE,    // Package insertion detection
  MENU_OPEN_LOKER,        // COD loker opening
  MENU_CLOSE_LOKER,       // COD loker closing
  MENU_OPEN_DOOR          // QR code access
};
```

### State Transitions
```
MENU_MAIN:
├── button1 → MENU_SELECT_COURIER
├── button2 → MENU_SCAN_TRACKING  
└── keyPad '#' → MENU_OPEN_DOOR

MENU_SELECT_COURIER:
├── keyPad '1','2','3' → MENU_INPUT_TRACKING
└── keyPad 'B' → MENU_MAIN

MENU_INPUT_TRACKING:
├── keyPad '#' → MENU_COMPARE_TRACKING
└── keyPad '*' → MENU_MAIN

MENU_SCAN_TRACKING:
├── button2 + isNewBarcodeScanned → MENU_COMPARE_TRACKING
└── keyPad 'B' → MENU_MAIN

MENU_COMPARE_TRACKING:
├── resi found → MENU_INSERT_PACKAGE
└── resi not found → MENU_MAIN

MENU_INSERT_PACKAGE:
├── packageType == "COD" → MENU_OPEN_LOKER
└── packageType == "Non-COD" → MENU_MAIN

MENU_OPEN_LOKER:
└── exitSwitches[loker] triggered → MENU_CLOSE_LOKER

MENU_CLOSE_LOKER:
└── entrySwitches[loker] triggered → MENU_MAIN

MENU_OPEN_DOOR:
├── valid QR → 5s door access → MENU_MAIN
└── invalid QR → error message → MENU_MAIN
```

### State Variables
```cpp
MenuState currentMenuState = MENU_MAIN;
int selectedCourier = 0;                    // 0=None, 1=Shopee, 2=J&T, 3=SiCepat
String trackingInput;                       // Manual input buffer
int currentPackageIndex;                    // Active package index in receipts[]
String packageType;                         // "COD" or "Non-COD"
bool isPackageReceived = false;             // Package insertion flag
```

---

## 8. DEBUG DAN TROUBLESHOOTING

### Serial Commands (115200 baud)
```
System:
r          → ESP.restart()

Loker Control:
o1-o5      → lokerControlCommands[0-4] = "buka"
c1-c5      → lokerControlCommands[0-4] = "tutup"

Main Door:
ot         → mainDoorControl = "buka"
ct         → mainDoorControl = "tutup"  
st         → mainDoorControl = "stop"

Relay:
or         → relayControlCommand = "buka"
cr         → relayControlCommand = "tutup"

Audio:
s0-s30     → Volume control
p          → Pause
1-100      → Play file number
```

### Critical Variables to Monitor
```cpp
currentDistance        // Ultrasonic reading
entrySwitches[6]      // Limit switch status
exitSwitches[6]       // Limit switch status  
currentMenuState      // Current UI state
lokerControlCommands[5] // Loker servo commands
mainDoorControl       // Main door servo command
scannedBarcode        // Last scanned barcode
```

### Common Issues
- I2C device not found: Check wiring dan addresses
- Servo not moving: Check PCA9685 connection dan power supply
- LCD not updating: Check displayTextOnLCD() buffer logic
- Database sync fail: Check WiFi connection dan Firebase credentials
- Menu stuck: Check state transition logic dalam menu()

---

**Developer:** SHINTYA PUTRI WIJAYA (2141160117)  
**Project:** Smart Packet Box COD ESP32 Firmware