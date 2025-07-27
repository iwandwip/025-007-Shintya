# CLAUDE.md - ShintyaFirmware

## Overview

ESP32-based firmware for Smart Packet Box with Cash on Delivery (COD) support. Implements a dual-core RTOS architecture for real-time hardware control and Firebase communication.

## Code Refactoring Update

The firmware has been completely refactored with improved naming conventions for better readability and maintainability. All variable and function names now follow English naming conventions with descriptive, professional naming patterns.

## Architecture

### RTOS Dual-Core Design
- **Core 0**: Database/Firebase operations (`TaskDatabase`)
- **Core 1**: Hardware control and user interface (`TaskControl`)

### Hardware Components

#### Sensors
- **Ultrasonic Sensor**: NewPing (Pins 32/33, 0-45cm range) - `currentDistance`
- **Barcode Scanner**: GM67 via Serial2 (Pins 25/26) - `scannedBarcode`
- **I2C Keypad**: 4x4 matrix (Address 0x22) - `keyPad`
- **Limit Switches**: PCF8574 expanders (0x20/0x21) - `entrySwitches[]`, `exitSwitches[]`

#### Actuators
- **Servo Motors**: PCA9685 driver (Address 0x40) - `servo`
  - Channels 0-4: Individual loker control - `lokerControlCommands[]`
  - Channels 5-6: Main door control - `mainDoorControl`
- **Audio**: DFPlayer Mini (Pins 16/17) - `myDFPlayer`
- **Display**: 20x4 I2C LCD (Address 0x27) - `lcd`
- **Relay**: Main door lock (Pin 27) - `RELAY_SELECT_PIN`, `relayControlCommand`

#### User Interface
- **Buttons**: 2 navigation buttons (Pins 36/39)
- **Keypad**: I2C 4x4 matrix for input
- **LCD**: Real-time status and menu display
- **Audio**: Voice prompts and feedback

### Firebase Integration

#### Collections Accessed
- `users`: User authentication and profiles
- `receipts`: Package tracking and status
- `lokerControl`: Remote loker commands

#### Data Structures
```cpp
struct UsersTypedef {
  String email;
  String nama;
};

struct RececiptsTypedef {
  String nama;
  String noResi;
  int nomorLoker;
  String status;
  String tipePaket;
  String userEmail;
};

struct LokerControlTypedef {
  int nomorLoker;
  int buka;
  int tutup;
};
```

### Menu System

#### States (Refactored)
- `MENU_MAIN`: Main screen with capacity display
- `MENU_SELECT_COURIER`: Courier selection (Shopee/J&T/SiCepat)
- `MENU_INPUT_TRACKING`: Manual tracking number input
- `MENU_SCAN_TRACKING`: Barcode scanning mode
- `MENU_COMPARE_TRACKING`: Database validation
- `MENU_INSERT_PACKAGE`: Package insertion
- `MENU_OPEN_LOKER`: COD loker opening
- `MENU_CLOSE_LOKER`: COD loker closing
- `MENU_OPEN_DOOR`: QR code access

#### Menu Variables
- `currentMenuState`: Current menu state (was `menuIdx`)
- `selectedCourier`: Selected courier index (was `kurir`)
- `courierNames[]`: Courier name array (was `kurirStr[]`)
- `trackingInput`: Manual tracking input (was `inputResi`)
- `currentPackageIndex`: Active package index (was `paketIdx`)
- `packageType`: Package type string (was `type`)
- `isPackageReceived`: Package reception flag (was `paketDiterima`)

### Package Flow

#### Standard Package (Non-COD)
1. Scan/input tracking number (`scannedBarcode`)
2. Validate against Firebase (`receipts[]`)
3. Open main compartment (`mainDoorControl`)
4. Detect package insertion (`currentDistance` < 20cm)
5. Close compartment
6. Complete transaction

#### COD Package
1. Scan/input tracking number (`scannedBarcode`)
2. Validate and get loker assignment (`currentPackageIndex`)
3. Open main compartment (`mainDoorControl = "buka"`)
4. Insert package (detected via `currentDistance`)
5. Open assigned COD loker 1-5 (`lokerControlCommands[i] = "buka"`)
6. Wait for payment collection (`exitSwitches[i]`)
7. Close loker when complete (`lokerControlCommands[i] = "tutup"`)

#### QR Code Access
1. Press '#' on keypad
2. Scan user QR code (`Serial2`)
3. Validate against user database (`registeredUserEmails[]`)
4. Grant 5-second door access (`RELAY_SELECT_PIN`)

### Hardware Control

#### Servo Control
```cpp
// Loker positions
void openLokerCompartment(int lokerNumber) {
  if (exitSwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(135));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}

void closeLokerCompartment(int lokerNumber) {
  if (entrySwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(75));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

#### Capacity Monitoring
- Real-time ultrasonic measurement (`currentDistance`)
- 0-45cm range with percentage calculation
- Display format: `100 - (currentDistance * 100 / 45)`%
- Function: `readDistanceSensor()` (was `readJarak()`)

### Audio System

#### Sound Prompts
- Voice guidance for each operation
- Loker-specific audio feedback
- Error notifications
- Volume control (0-30)

```cpp
enum sound {
  soundResiCocok = 1,
  soundLoker1Terbuka = 2,
  soundInputResi = 14,
  soundScanResi = 15,
  // ... additional sounds
};
```

### Security Features

#### Access Control
- QR code user validation
- Receipt number verification
- Limit switch monitoring
- Timeout protections

#### User Database (Refactored)
```cpp
String registeredUserEmails[MAX_USERS] = {
  "",
  "pwshintya@gmail.com",
  "putri@gmail.com",
  "wijaya@gmail.com",
  "user1@gmail.com",
  "user2@gmail.com"
  // ... up to 10 users
};
```

### Configuration

#### Network Settings
```cpp
#define WIFI_SSID "zainul"
#define WIFI_PASSWORD "12345678"
#define API_KEY "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU"
#define USER_EMAIL "user1@gmail.com"
#define USER_PASSWORD "admin123"
#define FIREBASE_PROJECT_ID "alien-outrider-453003-g8"
```

#### Hardware Limits (Updated Constants)
- Maximum packages: 30 (`MAX_PACKAGES`)
- Maximum users: 10 (`MAX_USERS`)
- COD lokers: 5 (numbered 1-5)
- Ultrasonic range: 0-45cm (`MAX_DISTANCE`)

### Development Guidelines

#### Serial Commands (Updated Function Names)
- `r`: Restart ESP32
- `o1-o5`: Open loker 1-5 (`openLokerCompartment()`)
- `c1-c5`: Close loker 1-5 (`closeLokerCompartment()`)
- `ot/ct`: Open/close main door (`openMainDoor()`/`closeMainDoor()`)
- `or/cr`: Relay control (`controlRelayOutput()`)
- `s0-s30`: Volume control (`playAudioCommand()`)
- `p`: Pause audio (`playAudioCommand()`)

#### LCD Display Optimization (Updated Functions)
- 20x4 character display
- Smart refresh to prevent flicker (`displayTextOnLCD()`)
- Buffer management for smooth updates (`lastDisplayedText[]`)
- Cursor positioning for input feedback
- Setup function: `initializeLCDDisplay()` (was `setupDisplay()`)

#### Memory Management
- Structured data arrays for efficiency
- JSON document parsing with limits
- RTOS stack allocation (10KB per task)

## Code Refactoring Summary

### Variable Name Improvements

| Old Name | New Name | Type | Description |
|----------|----------|------|-------------|
| `jarak` | `currentDistance` | int | Current ultrasonic sensor reading |
| `barcode` | `scannedBarcode` | String | Scanned barcode data |
| `barcodeBaru` | `isNewBarcodeScanned` | bool | New barcode scan flag |
| `input` | `serialInput` | String | Serial command input |
| `limitMasuk[]` | `entrySwitches[]` | bool[] | Entry limit switches |
| `limitKeluar[]` | `exitSwitches[]` | bool[] | Exit limit switches |
| `controlLoker[]` | `lokerControlCommands[]` | String[] | Loker control commands |
| `controlTutup` | `mainDoorControl` | String | Main door control |
| `controlRelay` | `relayControlCommand` | String | Relay control command |
| `menuIdx` | `currentMenuState` | enum | Current menu state |
| `kurir` | `selectedCourier` | int | Selected courier index |
| `inputResi` | `trackingInput` | String | Manual tracking input |
| `paketIdx` | `currentPackageIndex` | int | Current package index |

### Function Name Improvements

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `setupSensor()` | `initializeSensors()` | Initialize all sensors |
| `readJarak()` | `readDistanceSensor()` | Read ultrasonic distance |
| `readBarcode()` | `scanBarcodeFromSerial()` | Scan barcode from Serial2 |
| `setupDisplay()` | `initializeLCDDisplay()` | Initialize LCD display |
| `lcd_print()` | `displayTextOnLCD()` | Display text on LCD |
| `speak()` | `playAudioCommand()` | Play audio commands |
| `setupSpeaker()` | `initializeAudioSystem()` | Initialize audio system |
| `openLoker()` | `openLokerCompartment()` | Open loker compartment |
| `closeLoker()` | `closeLokerCompartment()` | Close loker compartment |
| `openTutup()` | `openMainDoor()` | Open main door |
| `closeTutup()` | `closeMainDoor()` | Close main door |
| `angleToPulse()` | `convertAngleToPulse()` | Convert angle to PWM pulse |
| `setupNetwork()` | `initializeNetworkConnection()` | Initialize WiFi connection |
| `setupDatabase()` | `initializeFirebaseDatabase()` | Initialize Firebase |
| `updateData()` | `updateDatabaseData()` | Update database data |

### Menu State Enum Improvements

| Old State | New State | Purpose |
|-----------|-----------|---------|
| `menuUtama` | `MENU_MAIN` | Main menu screen |
| `menuPilihKurir` | `MENU_SELECT_COURIER` | Courier selection |
| `menuInputResi` | `MENU_INPUT_TRACKING` | Manual tracking input |
| `menuScanResi` | `MENU_SCAN_TRACKING` | Barcode scanning |
| `menuCompareResi` | `MENU_COMPARE_TRACKING` | Database validation |
| `menuMasukanPaket` | `MENU_INSERT_PACKAGE` | Package insertion |
| `menuBukaLoker` | `MENU_OPEN_LOKER` | Open COD loker |
| `menuTutupLoker` | `MENU_CLOSE_LOKER` | Close COD loker |
| `menuBukaPintu` | `MENU_OPEN_DOOR` | QR code access |

### Benefits of Refactoring

1. **Improved Readability**: English naming conventions make code more accessible
2. **Better Maintainability**: Descriptive names reduce need for comments
3. **Professional Standards**: Follows C++ naming conventions
4. **Reduced Confusion**: Clear distinction between similar variables
5. **Enhanced Debugging**: Easier to track variables in debugging tools
6. **Code Consistency**: Uniform naming pattern throughout the codebase

### Known Limitations

1. **Single Box Support**: One main compartment only
2. **Fixed User List**: Hardcoded email validation
3. **No OTA Updates**: Requires manual firmware updates
4. **Basic Error Handling**: Limited recovery mechanisms

### Integration Notes

#### Mobile App Communication
- Firebase real-time updates
- Remote loker control via `lokerControl` collection
- Status synchronization through `receipts` collection
- User QR codes match email addresses

#### Hardware Dependencies
- Requires stable Wi-Fi connection
- I2C device address conflicts possible
- Servo calibration needed for proper operation
- SD card required for audio files

### Troubleshooting

#### Common Issues
1. **LCD not displaying**: Check I2C address (0x27)
2. **Servos not moving**: Verify PCA9685 connections
3. **Audio not playing**: Check DFPlayer SD card
4. **Keypad unresponsive**: Validate I2C address (0x22)
5. **Limit switches false positives**: Check PCF8574 wiring

#### Debug Output
- Serial monitor at 115200 baud
- Firebase connection status
- Sensor readings and limit switch states
- Menu navigation and command processing