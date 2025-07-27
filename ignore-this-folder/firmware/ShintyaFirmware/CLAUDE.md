# CLAUDE.md - ShintyaFirmware

## Overview

ESP32-based firmware for Smart Packet Box with Cash on Delivery (COD) support. Implements a dual-core RTOS architecture for real-time hardware control and Firebase communication.

## Architecture

### RTOS Dual-Core Design
- **Core 0**: Database/Firebase operations (`TaskDatabase`)
- **Core 1**: Hardware control and user interface (`TaskControl`)

### Hardware Components

#### Sensors
- **Ultrasonic Sensor**: NewPing (Pins 32/33, 0-45cm range)
- **Barcode Scanner**: GM67 via Serial2 (Pins 25/26)
- **I2C Keypad**: 4x4 matrix (Address 0x22)
- **Limit Switches**: PCF8574 expanders (0x20/0x21)

#### Actuators
- **Servo Motors**: PCA9685 driver (Address 0x40)
  - Channels 0-4: Individual loker control
  - Channels 5-6: Main door control
- **Audio**: DFPlayer Mini (Pins 16/17)
- **Display**: 20x4 I2C LCD (Address 0x27)
- **Relay**: Main door lock (Pin 27)

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

#### States
- `menuUtama`: Main screen with capacity display
- `menuPilihKurir`: Courier selection (Shopee/J&T/SiCepat)
- `menuInputResi`: Manual receipt number input
- `menuScanResi`: Barcode scanning mode
- `menuCompareResi`: Database validation
- `menuMasukanPaket`: Package insertion
- `menuBukaLoker`: COD loker opening
- `menuTutupLoker`: COD loker closing
- `menuBukaPintu`: QR code access

### Package Flow

#### Standard Package (Non-COD)
1. Scan/input receipt number
2. Validate against Firebase
3. Open main compartment
4. Detect package insertion (ultrasonic)
5. Close compartment
6. Complete transaction

#### COD Package
1. Scan/input receipt number
2. Validate and get loker assignment
3. Open main compartment
4. Insert package
5. Open assigned COD loker (1-5)
6. Wait for payment collection
7. Close loker when complete

#### QR Code Access
1. Press '#' on keypad
2. Scan user QR code
3. Validate against user database
4. Grant 5-second door access

### Hardware Control

#### Servo Control
```cpp
// Loker positions
void openLoker(int i) {
  if (limitKeluar[i] == 0) servo.setPWM(i, 0, angleToPulse(135));
  else servo.setPWM(i, 0, angleToPulse(100));
}

void closeLoker(int i) {
  if (limitMasuk[i] == 0) servo.setPWM(i, 0, angleToPulse(75));
  else servo.setPWM(i, 0, angleToPulse(100));
}
```

#### Capacity Monitoring
- Real-time ultrasonic measurement
- 0-45cm range with percentage calculation
- Display format: `100 - (distance * 100 / 45)`%

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

#### User Database
```cpp
String userEmail[maxUser] = {
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

#### Hardware Limits
- Maximum packages: 30
- Maximum users: 10
- COD lokers: 5 (numbered 1-5)
- Ultrasonic range: 0-45cm

### Development Guidelines

#### Serial Commands
- `r`: Restart ESP32
- `o1-o5`: Open loker 1-5
- `c1-c5`: Close loker 1-5
- `ot/ct`: Open/close main door
- `or/cr`: Relay control
- `s0-s30`: Volume control
- `p`: Pause audio

#### LCD Display Optimization
- 20x4 character display
- Smart refresh to prevent flicker
- Buffer management for smooth updates
- Cursor positioning for input feedback

#### Memory Management
- Structured data arrays for efficiency
- JSON document parsing with limits
- RTOS stack allocation (10KB per task)

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