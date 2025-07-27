# DOKUMENTASI FIRMWARE ESP32 SMART PACKET BOX COD
### Analisis Mendalam Code Structure dan Implementation

---

## DAFTAR ISI

1. [Overview dan System Architecture](#1-overview-dan-system-architecture)
2. [Program Entry Point dan Initialization](#2-program-entry-point-dan-initialization)
3. [RTOS Task Management](#3-rtos-task-management)
4. [Hardware Initialization Functions](#4-hardware-initialization-functions)
5. [Sensor Input Functions](#5-sensor-input-functions)
6. [Actuator Control Functions](#6-actuator-control-functions)
7. [Display Management](#7-display-management)
8. [Menu State Machine](#8-menu-state-machine)
9. [Network dan Database Operations](#9-network-dan-database-operations)
10. [Global Variables dan Data Structures](#10-global-variables-dan-data-structures)
11. [Function Call Dependencies](#11-function-call-dependencies)
12. [System Flow dan Decision Trees](#12-system-flow-dan-decision-trees)

---

## 1. OVERVIEW DAN SYSTEM ARCHITECTURE

### Hardware Components
```
ESP32 (Dual-Core Processor)
├── Core 0: Database/Network Operations
├── Core 1: Hardware Control Operations
├── I2C Bus: LCD(0x27), Keypad(0x22), PCA9685(0x40), PCF8574(0x20,0x21)
├── Serial Interfaces: Serial(Debug), Serial1(Audio), Serial2(Barcode)
├── GPIO: Ultrasonic(32,33), Relay(27), Buttons(36,39)
└── PWM: 7 Servo channels via PCA9685
```

### Software Architecture
```
main() [Arduino Framework]
├── setup() → setupRTOS()
│   ├── TaskDatabase (Core 0) → Network Operations
│   └── TaskControl (Core 1) → Hardware Operations
└── loop() → [Empty - All logic in RTOS tasks]
```

---

## 2. PROGRAM ENTRY POINT DAN INITIALIZATION

### **setup() Function [ShintyaFirmwareWithComments.ino]**
```cpp
void setup() {
  Serial.begin(115200);  // Debug communication
  setupRTOS();           // Start dual-core system
}
```

**Detailed Flow:**
1. **Serial.begin(115200)**: Initialize debug communication pada 115200 baud rate
2. **setupRTOS()**: Call RTOS task creation function

**Purpose**: Program entry point yang minimal, semua complex logic dipindah ke RTOS tasks

### **loop() Function [ShintyaFirmwareWithComments.ino]**
```cpp
void loop() {
  // Empty - semua logic ditangani oleh RTOS tasks
}
```

**Detailed Flow:**
- **Intentionally Empty**: Dalam RTOS implementation, main loop tidak digunakan
- **Task-based**: Semua logic berjalan di TaskDatabase() dan TaskControl()
- **Benefits**: Better resource management, concurrent execution

---

## 3. RTOS TASK MANAGEMENT

### **setupRTOS() Function [RTOS.ino]**
```cpp
void setupRTOS() {
  // Create Database task pada Core 0
  xTaskCreatePinnedToCore(
    TaskDatabase,     // Function pointer
    "TaskDatabase",   // Task name (debugging)
    10000,            // Stack size (10KB)
    NULL,             // Parameters (none)
    1,                // Priority level
    &DatabaseHandle,  // Task handle
    0                 // Core 0
  );

  // Create Control task pada Core 1  
  xTaskCreatePinnedToCore(
    TaskControl,      // Function pointer
    "TaskControl",    // Task name
    10000,            // Stack size (10KB)
    NULL,             // Parameters
    1,                // Priority level
    &ControlHandle,   // Task handle
    1                 // Core 1
  );
}
```

**Detailed Analysis:**
1. **Core Assignment Strategy**:
   - Core 0: Network I/O operations (blocking operations safe)
   - Core 1: Real-time hardware control (priority untuk responsiveness)

2. **Stack Size (10KB)**:
   - Cukup untuk JSON parsing operations
   - Buffer untuk local variables dan function calls

3. **Priority Level (1)**:
   - Same priority untuk balanced execution
   - FreeRTOS akan time-slice antara tasks

### **TaskDatabase() Function [RTOS.ino]**
```cpp
void TaskDatabase(void *pvParameters) {
  initializeNetworkConnection();    // WiFi setup
  initializeFirebaseDatabase();     // Firebase initialization
  
  while (true) {
    updateDatabaseData();                   // Sync dengan Firebase
    vTaskDelay(2000 / portTICK_PERIOD_MS); // 2 second delay
  }
}
```

**Detailed Flow:**
1. **initializeNetworkConnection()**: 
   - Blocking WiFi connection setup
   - Wait until WL_CONNECTED status
   - Print IP address for debugging

2. **initializeFirebaseDatabase()**:
   - Setup SSL client untuk secure communication
   - Initialize Firebase app dengan credentials
   - Setup Firestore document interface

3. **Main Loop**:
   - **updateDatabaseData()**: GET data dari 3 collections
   - **vTaskDelay(2000)**: Non-blocking delay, allows other tasks to run
   - **Continuous Sync**: Real-time data synchronization

### **TaskControl() Function [RTOS.ino]**
```cpp
void TaskControl(void *pvParameters) {
  // Hardware initialization sequence
  initializeAudioSystem();
  initializeLCDDisplay();
  initializeSensors();
  initializeServoController();
  initializeKeypad();
  initializeRelay();
  initializeButtons();
  
  // Initial system state
  playAudioCommand(String(soundPilihMetode));
  initializeDummyPackages();
  
  while (true) {
    // Main control loop
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

**Detailed Flow:**
1. **Hardware Initialization Phase**:
   - Sequential initialization (order matters untuk dependencies)
   - Each init function handles specific hardware component
   - Error handling dalam individual functions

2. **Initial State Setup**:
   - Audio welcome message
   - Load test data untuk development

3. **Main Control Loop** (No delay - maximum responsiveness):
   - **readLimitSwitches()**: Safety monitoring (highest priority)
   - **controlAllLokers()**: Servo control berdasarkan commands
   - **controlMainDoor()**: Main door servo control
   - **controlRelayOutput()**: Door lock control
   - **processRemoteLokerCommands()**: Firebase command processing
   - **menu()**: User interface state machine
   - **readDistanceSensor()**: Package detection
   - **processSerialCommands()**: Debug commands

---

## 4. HARDWARE INITIALIZATION FUNCTIONS

### **initializeSensors() Function [sensor.ino]**
```cpp
void initializeSensors() {
  Wire.begin();                                       // I2C master mode
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67); // Barcode scanner
  pcfEntryInput.begin(0x20, &Wire);                  // Entry limit switches
  pcfExitOutput.begin(0x21, &Wire);                  // Exit limit switches
}
```

**Detailed Analysis:**
1. **Wire.begin()**: 
   - Initialize I2C sebagai master device
   - Default pins: SDA=21, SCL=22 pada ESP32
   - Enable pull-up resistors

2. **Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67)**:
   - **9600 baud**: Standard GM67 barcode scanner rate
   - **SERIAL_8N1**: 8 data bits, no parity, 1 stop bit
   - **Custom pins**: RX=26, TX=25 (defined dalam library.h)

3. **PCF8574 Initialization**:
   - **0x20**: Entry switches (detect door closing)
   - **0x21**: Exit switches (detect door opening)
   - **&Wire**: Reference ke I2C bus object

### **initializeServoController() Function [actuator.ino]**
```cpp
void initializeServoController() {
  servo.begin();                                    // PCA9685 initialization
  servo.setPWMFreq(60);                            // 60Hz for servo control
  servo.setPWM(5, 0, convertAngleToPulse(100));    // Main door servo 1 neutral
  servo.setPWM(6, 0, convertAngleToPulse(100));    // Main door servo 2 neutral
}
```

**Detailed Analysis:**
1. **servo.begin()**:
   - Initialize PCA9685 I2C PWM driver
   - Reset internal oscillator
   - Set default PWM values

2. **servo.setPWMFreq(60)**:
   - **60Hz frequency**: Standard untuk servo motors
   - **PWM period**: 16.67ms (1000/60)
   - **Pulse range**: ~1-2ms within 16.67ms period

3. **Initial Servo Positions**:
   - **Channel 5,6**: Main door dual servo
   - **100° position**: Neutral/safe position
   - **convertAngleToPulse()**: Maps 0-180° ke PWM values

### **initializeKeypad() Function [sensor.ino]**
```cpp
void initializeKeypad() {
  if (keyPad.begin() == false) {
    Serial.println("\nERROR: cannot communicate to keypad.\nPlease reboot.\n");
    while (1);  // Infinite loop on error
  }
  keyPad.loadKeyMap(keymap);  // Load character mapping
}
```

**Detailed Analysis:**
1. **keyPad.begin()**:
   - I2C communication test dengan keypad
   - Return false jika device tidak respond
   - Critical failure handling dengan infinite loop

2. **Error Handling**:
   - **Serial error message**: Debug information
   - **while(1)**: Stop execution (watchdog akan reset sistem)
   - **Alternative**: Implement retry mechanism

3. **keyPad.loadKeyMap(keymap)**:
   - **keymap**: `"147*2580369#ABCDNF"` (defined dalam library.h)
   - **Mapping**: Physical button positions ke characters
   - **Special chars**: N=NoKey, F=Fail

---

## 5. SENSOR INPUT FUNCTIONS

### **readDistanceSensor() Function [sensor.ino]**
```cpp
int readDistanceSensor() {
  int measuredDistance = sonar.ping_cm();          // Ultrasonic measurement
  if (measuredDistance == 0) return MAX_DISTANCE; // Out of range handling
  else return measuredDistance;                    // Valid measurement
}
```

**Detailed Analysis:**
1. **sonar.ping_cm()**:
   - Send ultrasonic pulse via TRIG pin
   - Measure echo time via ECHO pin
   - Calculate distance: time * speed_of_sound / 2
   - Return distance dalam centimeters

2. **Range Handling**:
   - **measuredDistance == 0**: No echo received (>45cm atau obstacle)
   - **MAX_DISTANCE (45)**: Assume maximum distance
   - **Valid range**: 2-45cm for this sensor

3. **Usage dalam System**:
   - Called every main loop cycle
   - Updates global `currentDistance`
   - Used untuk package detection (<20cm)

### **scanBarcodeFromSerial() Function [sensor.ino]**
```cpp
void scanBarcodeFromSerial() {
  scannedBarcode = Serial2.readStringUntil('\r');  // Read until carriage return
  Serial.println("barcode : " + scannedBarcode);   // Debug output
}
```

**Detailed Analysis:**
1. **Serial2.readStringUntil('\r')**:
   - **GM67 output format**: Barcode string + '\r' + '\n'
   - **readStringUntil()**: Read characters sampai delimiter
   - **Blocking function**: Wait until complete string received

2. **Data Processing**:
   - Direct assignment ke global `scannedBarcode`
   - No validation dalam function ini
   - Validation dilakukan dalam menu state machine

3. **Debug Output**:
   - Print ke Serial untuk monitoring
   - Helps dengan barcode scanner troubleshooting

### **readLimitSwitches() Function [sensor.ino]**
```cpp
void readLimitSwitches() {
  // Entry switches (door closing detection)
  entrySwitches[0] = !pcfEntryInput.digitalRead(5);  // Loker 1
  entrySwitches[1] = !pcfEntryInput.digitalRead(1);  // Loker 2
  entrySwitches[2] = !pcfEntryInput.digitalRead(2);  // Loker 3
  entrySwitches[3] = !pcfEntryInput.digitalRead(3);  // Loker 4
  entrySwitches[4] = !pcfEntryInput.digitalRead(4);  // Loker 5
  entrySwitches[5] = !pcfEntryInput.digitalRead(6);  // Main door

  // Exit switches (door opening detection)
  exitSwitches[0] = !pcfExitOutput.digitalRead(5);   // Loker 1
  exitSwitches[1] = !pcfExitOutput.digitalRead(1);   // Loker 2
  exitSwitches[2] = !pcfExitOutput.digitalRead(2);   // Loker 3
  exitSwitches[3] = !pcfExitOutput.digitalRead(3);   // Loker 4
  exitSwitches[4] = !pcfExitOutput.digitalRead(4);   // Loker 5
  exitSwitches[5] = !pcfExitOutput.digitalRead(6);   // Main door
}
```

**Detailed Analysis:**
1. **PCF8574 Pin Mapping**:
   - **Unusual mapping**: Pin 0 tidak digunakan, starts dari pin 1
   - **Pin assignments**: 1,2,3,4,5,6 untuk loker dan main door
   - **Two expanders**: Separate untuk entry dan exit detection

2. **Logic Inversion**:
   - **!digitalRead()**: Invert logic (switches are active LOW)
   - **true**: Switch activated (door at limit position)
   - **false**: Switch deactivated (door moving atau intermediate position)

3. **Safety Implementation**:
   - **Entry switches**: Detect fully closed position
   - **Exit switches**: Detect fully open position
   - **Used untuk**: Servo control safety dan position feedback

### **processSerialCommands() Function [sensor.ino]**
```cpp
void processSerialCommands() {
  if (Serial.available()) {
    serialInput = Serial.readStringUntil('\n');  // Read command
    Serial.println(serialInput);                 // Echo command
    playAudioCommand(serialInput);               // Audio feedback
  }
  
  // Command processing
  if (serialInput == "r") ESP.restart();                            // System restart
  else if (serialInput == "o1") lokerControlCommands[0] = "buka";   // Open loker 1
  else if (serialInput == "c1") lokerControlCommands[0] = "tutup";  // Close loker 1
  // ... [similar untuk o2-o5, c2-c5]
  else if (serialInput == "ot") mainDoorControl = "buka";           // Open main door
  else if (serialInput == "ct") mainDoorControl = "tutup";          // Close main door
  else if (serialInput == "st") mainDoorControl = "stop";           // Stop main door
  else if (serialInput == "or") relayControlCommand = "buka";       // Open relay
  else if (serialInput == "cr") relayControlCommand = "tutup";      // Close relay
}
```

**Detailed Analysis:**
1. **Input Processing**:
   - **Serial.available()**: Check untuk incoming data
   - **readStringUntil('\n')**: Read complete command line
   - **Echo command**: Confirmation feedback

2. **Command Categories**:
   - **System**: "r" untuk restart
   - **Loker Control**: "o1"-"o5" (open), "c1"-"c5" (close)
   - **Main Door**: "ot" (open), "ct" (close), "st" (stop)
   - **Relay**: "or" (open), "cr" (close)

3. **Global Variable Updates**:
   - **lokerControlCommands[]**: Array untuk individual loker control
   - **mainDoorControl**: String untuk main door state
   - **relayControlCommand**: String untuk relay state
   - **Control flow**: Commands processed dalam main loop

---

## 6. ACTUATOR CONTROL FUNCTIONS

### **controlAllLokers() Function [actuator.ino]**
```cpp
void controlAllLokers() {
  for (int i = 0; i < 5; i++) {
    if (lokerControlCommands[i] == "tutup") closeLokerCompartment(i);
    else if (lokerControlCommands[i] == "buka") openLokerCompartment(i);
  }
}
```

**Detailed Analysis:**
1. **Loop Structure**:
   - **for (i = 0; i < 5)**: Iterate through 5 COD lokers
   - **String comparison**: Check command untuk each loker
   - **Action dispatch**: Call appropriate control function

2. **Command Processing**:
   - **"tutup"**: Close loker command
   - **"buka"**: Open loker command
   - **Default**: No action (maintain current position)

3. **Function Calls**:
   - **closeLokerCompartment(i)**: Individual close function
   - **openLokerCompartment(i)**: Individual open function
   - **Parameter i**: Loker index (0-4 maps to lokers 1-5)

### **openLokerCompartment() Function [actuator.ino]**
```cpp
void openLokerCompartment(int lokerNumber) {
  if (exitSwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(135));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

**Detailed Analysis:**
1. **Safety Check**:
   - **exitSwitches[lokerNumber] == 0**: Check if door tidak sedang terbuka
   - **Safety first**: Prevent servo conflict dengan mechanical position

2. **Servo Control**:
   - **Channel**: lokerNumber (0-4 maps to PCA9685 channels 0-4)
   - **PWM value 0**: Start time (always 0 untuk servo)
   - **convertAngleToPulse(135)**: Open position (135 degrees)
   - **convertAngleToPulse(100)**: Safe neutral position

3. **Position Logic**:
   - **135°**: Full open position
   - **100°**: Neutral/stop position (jika ada obstacle)

### **closeLokerCompartment() Function [actuator.ino]**
```cpp
void closeLokerCompartment(int lokerNumber) {
  if (entrySwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(75));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}
```

**Detailed Analysis:**
1. **Safety Check**:
   - **entrySwitches[lokerNumber] == 0**: Check if door tidak sedang tertutup
   - **Prevent overforce**: Avoid servo strain

2. **Servo Control**:
   - **convertAngleToPulse(75)**: Close position (75 degrees)
   - **convertAngleToPulse(100)**: Safe neutral jika ada obstacle

3. **Mechanical Protection**:
   - **Limit switch feedback**: Prevent mechanical damage
   - **Servo safety**: Stop operation jika unexpected resistance

### **convertAngleToPulse() Function [actuator.ino]**
```cpp
int convertAngleToPulse(int angle) {
  int pulseWidth = map(angle, 0, 180, SERVOMIN, SERVOMAX);  // Linear mapping
  return pulseWidth;
}
```

**Detailed Analysis:**
1. **map() Function**:
   - **Input range**: 0-180 degrees
   - **Output range**: SERVOMIN(125) to SERVOMAX(575)
   - **Linear interpolation**: Proportional mapping

2. **PWM Values**:
   - **SERVOMIN = 125**: ~1ms pulse width
   - **SERVOMAX = 575**: ~2ms pulse width
   - **PCA9685 resolution**: 12-bit (0-4095)

3. **Servo Control Theory**:
   - **1ms pulse**: 0° position
   - **1.5ms pulse**: 90° position (neutral)
   - **2ms pulse**: 180° position

### **controlMainDoor() Function [actuator.ino]**
```cpp
void controlMainDoor() {
  if (mainDoorControl == "tutup") closeMainDoor();
  else if (mainDoorControl == "buka") openMainDoor();
  else stopMainDoor();
}
```

**Detailed Analysis:**
1. **Command Dispatch**:
   - **String comparison**: Check global mainDoorControl variable
   - **Function calls**: Route ke appropriate door function
   - **Default action**: stopMainDoor() untuk unknown commands

2. **State Machine Logic**:
   - **"tutup"**: Close main door
   - **"buka"**: Open main door
   - **Other/empty**: Stop/neutral position

### **openMainDoor() Function [actuator.ino]**
```cpp
void openMainDoor() {
  if (entrySwitches[5] == 0) {
    servo.setPWM(5, 0, convertAngleToPulse(142));    // Servo 1 position
    servo.setPWM(6, 0, convertAngleToPulse(80));     // Servo 2 position
  } else {
    servo.setPWM(6, 0, convertAngleToPulse(100));    // Neutral positions
    servo.setPWM(5, 0, convertAngleToPulse(100));
  }
}
```

**Detailed Analysis:**
1. **Dual Servo Control**:
   - **Channel 5**: First main door servo (142°)
   - **Channel 6**: Second main door servo (80°)
   - **Coordinated movement**: Both servos work together

2. **Safety Check**:
   - **entrySwitches[5]**: Main door entry switch
   - **Safe operation**: Only move jika tidak ada obstacle

3. **Door Mechanism**:
   - **Different angles**: 142° dan 80° suggests different mechanical roles
   - **Synchronized**: Both servos move simultaneously untuk smooth operation

---

## 7. DISPLAY MANAGEMENT

### **displayTextOnLCD() Function [display.ino]**
```cpp
void displayTextOnLCD(int xPosition, int yPosition, String textBuffer) {
  // Smart update - only refresh if text changed
  if (lastDisplayedText[yPosition] != textBuffer) {
    lastDisplayedText[yPosition] = textBuffer;  // Update buffer
    
    // Clear line dengan spaces
    String clearString = String("                    ");  // 20 spaces
    lcd.setCursor(xPosition, yPosition);
    lcd.print(clearString);
    
    // Format text ke 20 characters
    while (textBuffer.length() < 20) {
      textBuffer += " ";  // Pad dengan spaces
    }
    
    // Truncate jika terlalu panjang
    if (textBuffer.length() > 20) {
      textBuffer = textBuffer.substring(0, 20);
    }
    
    // Display formatted text
    char displayBuffer[21];                                 // 20 chars + null terminator
    snprintf(displayBuffer, 21, "%s", textBuffer.c_str()); // Safe string formatting
    lcd.setCursor(xPosition, yPosition);
    lcd.print(displayBuffer);
  }
}
```

**Detailed Analysis:**
1. **Anti-Flicker Logic**:
   - **lastDisplayedText[yPosition]**: Buffer untuk compare previous text
   - **Only update jika different**: Prevent unnecessary LCD updates
   - **Smooth UI**: Eliminates screen flicker

2. **Text Formatting**:
   - **Clear line first**: 20 spaces untuk clean slate
   - **Padding**: Add spaces sampai 20 characters
   - **Truncation**: Cut text jika lebih dari 20 chars
   - **Fixed width**: Consistent display formatting

3. **Safe String Handling**:
   - **snprintf()**: Prevent buffer overflow
   - **21 char buffer**: 20 chars + null terminator
   - **Memory safety**: Avoid corruption

4. **LCD Positioning**:
   - **setCursor(x, y)**: Position cursor sebelum print
   - **20x4 display**: 20 columns, 4 rows (0-3)

### **initializeLCDDisplay() Function [display.ino]**
```cpp
void initializeLCDDisplay() {
  lcd.init();       // LCD initialization
  lcd.backlight();  // Enable backlight
  
  String displayTitle;
  
  // Display developer name
  displayTitle = "SHINTYA PUTRI WIJAYA";
  lcd.setCursor(10 - displayTitle.length() / 2, 1);  // Center on row 1
  lcd.print(displayTitle);
  
  // Display student ID
  displayTitle = "2141160117";
  lcd.setCursor(10 - displayTitle.length() / 2, 2);  // Center on row 2
  lcd.print(displayTitle);
  
  lcd.clear();  // Clear screen after display
}
```

**Detailed Analysis:**
1. **LCD Setup**:
   - **lcd.init()**: Initialize I2C communication dan LCD controller
   - **lcd.backlight()**: Turn on backlight untuk visibility

2. **Centering Calculation**:
   - **10 - displayTitle.length() / 2**: Center text pada 20-char display
   - **Mathematical centering**: (20/2) - (text_length/2)
   - **Row positioning**: Row 1 dan 2 untuk title display

3. **Startup Sequence**:
   - **Show credits**: Developer name dan student ID
   - **Brief display**: User can see boot information
   - **Clear screen**: Ready untuk operational display

---

## 8. MENU STATE MACHINE

### **menu() Function [menu.ino] - Main State Machine**
```cpp
void menu() {
  switch (currentMenuState) {
    case MENU_MAIN:
      {
        // Display capacity dan options
        displayTextOnLCD(0, 0, "        " + String(100 - (currentDistance * 100 / 45)) + "%");
        displayTextOnLCD(0, 1, "         ||         ");
        displayTextOnLCD(0, 2, "  INPUT  ||   SCAN  ");
        displayTextOnLCD(0, 3, "  RESI   ||   RESI  ");
        
        // Button input handling
        if (button1) {
          lcd.clear();
          playAudioCommand(String(soundPilihKurir));
          while (button1);  // Wait untuk button release
          currentMenuState = MENU_SELECT_COURIER;
        }
        else if (button2) {
          lcd.clear();
          playAudioCommand("15");
          while (button2);
          currentMenuState = MENU_SCAN_TRACKING;
        }
        
        // QR access
        if (keyPad.isPressed()) {
          lcd.clear();
          if (keyPad.getChar() == '#') currentMenuState = MENU_OPEN_DOOR;
        }
        break;
      }
      // ... [Other menu states]
  }
}
```

**Detailed Analysis - MENU_MAIN State:**

1. **Capacity Display**:
   - **Calculation**: `100 - (currentDistance * 100 / 45)`
   - **Logic**: 0cm = 100% full, 45cm = 0% full
   - **Real-time**: Updates setiap loop cycle

2. **User Interface Layout**:
   - **Row 0**: Capacity percentage
   - **Row 1**: Visual separator ("||")
   - **Row 2-3**: Menu options (INPUT || SCAN)

3. **Input Handling**:
   - **button1**: INPUT RESI option
   - **button2**: SCAN RESI option
   - **keyPad '#'**: QR access mode

4. **State Transitions**:
   - **Audio feedback**: playAudioCommand() untuk user guidance
   - **Screen clear**: lcd.clear() untuk clean transition
   - **Button debounce**: while(button1) prevents multiple triggers

### **Menu State: MENU_COMPARE_TRACKING**
```cpp
case MENU_COMPARE_TRACKING:
  {
    playAudioCommand(String(soundCekResi));
    displayTextOnLCD(0, 0, "Mengecek Resi...");
    displayTextOnLCD(0, 1, scannedBarcode);
    displayTextOnLCD(0, 2, "Silahkan Tunggu!!");
    displayTextOnLCD(0, 3, "");
    
    bool resiDitemukan = false;
    vTaskDelay(2500);  // Processing delay
    
    // Database search
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
      serialInput = "ot";  // Open main door
      currentMenuState = MENU_INSERT_PACKAGE;
    }
    else {
      playAudioCommand(String(soundResiTidakCocok));
      displayTextOnLCD(0, 0, "Resi Tidak Ditemukan!");
      displayTextOnLCD(0, 1, scannedBarcode);
      displayTextOnLCD(0, 2, "Itu Bukan Paket Saya!");
      displayTextOnLCD(0, 3, "Terima Kasih!");
      serialInput = "ct";  // Close main door
      vTaskDelay(5000);
      scannedBarcode = "||||||||||||||||||||";  // Reset
      isNewBarcodeScanned = false;
      currentMenuState = MENU_MAIN;
      playAudioCommand(String(soundPilihMetode));
    }
    break;
  }
```

**Detailed Analysis - Database Validation:**

1. **User Feedback**:
   - **Audio**: soundCekResi untuk process start
   - **Visual**: "Mengecek Resi..." dengan barcode display
   - **Processing delay**: vTaskDelay(2500) untuk user perception

2. **Database Search Logic**:
   - **Linear search**: for loop through receipts[] array
   - **String comparison**: scannedBarcode == receipts[i].noResi
   - **Data extraction**: currentPackageIndex, packageType

3. **Success Path**:
   - **Audio confirmation**: soundResiCocok
   - **Display info**: Resi found + package type
   - **Action trigger**: serialInput = "ot" (open main door)
   - **State transition**: MENU_INSERT_PACKAGE

4. **Failure Path**:
   - **Error audio**: soundResiTidakCocok
   - **Error display**: "Resi Tidak Ditemukan"
   - **Cleanup**: Reset scannedBarcode, isNewBarcodeScanned
   - **Return**: Back to MENU_MAIN

### **Menu State: MENU_INSERT_PACKAGE**
```cpp
case MENU_INSERT_PACKAGE:
  {
    // Check if main door opened
    if (!entrySwitches[5] == 0) {
      displayTextOnLCD(0, 0, "");
      displayTextOnLCD(0, 1, "  Silahkan Masukan");
      displayTextOnLCD(0, 2, "       Paket!");
      displayTextOnLCD(0, 3, "");
      
      // Package detection logic
      if (isPackageReceived == false) {
        if (currentDistance != 0 && currentDistance < 20) {
          serialInput = "ct";  // Close main door
          isPackageReceived = true;
        }
      }
    }
    
    // Check if door closed dan package received
    if (!exitSwitches[5] == 0 && isPackageReceived) {
      isPackageReceived = false;  // Reset flag
      displayTextOnLCD(0, 0, "");
      displayTextOnLCD(0, 1, " Paket Diterima!  ");
      displayTextOnLCD(0, 2, "");
      displayTextOnLCD(0, 3, "");
      
      // Package type handling
      if (packageType == "COD") {
        scannedBarcode = "|||||||||||||||||||";
        isNewBarcodeScanned = false;
        playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2)));
        
        // Open appropriate COD loker
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

**Detailed Analysis - Package Insertion Logic:**

1. **Door State Monitoring**:
   - **entrySwitches[5]**: Main door entry sensor
   - **Conditional display**: Only show instructions when door open

2. **Package Detection**:
   - **Distance threshold**: currentDistance < 20cm
   - **Detection flag**: isPackageReceived prevents multiple triggers
   - **Auto-close**: serialInput = "ct" triggers door close

3. **Completion Detection**:
   - **exitSwitches[5]**: Door fully closed sensor
   - **Dual condition**: Door closed AND package received
   - **Flag reset**: isPackageReceived = false untuk next cycle

4. **Package Type Routing**:
   - **COD packages**: Route to loker opening sequence
   - **Non-COD packages**: Complete transaction, return to main
   - **Loker assignment**: Use receipts[].nomorLoker dari database

---

## 9. NETWORK DAN DATABASE OPERATIONS

### **initializeNetworkConnection() Function [Network.ino]**
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

**Detailed Analysis:**
1. **Connection Process**:
   - **WiFi.begin()**: Start connection dengan credentials
   - **Blocking loop**: while(WiFi.status() != WL_CONNECTED)
   - **Visual feedback**: Print dots untuk progress indication

2. **Status Monitoring**:
   - **WL_CONNECTED**: WiFi successfully connected
   - **IP Address display**: Useful untuk network debugging
   - **Serial output**: Debug information

### **updateDatabaseData() Function [Network.ino]**
```cpp
void updateDatabaseData() {
  app.loop();  // Maintain Firebase connection
  
  static uint32_t firestoreUpdateTimer;
  // Update every 5 seconds jika app ready
  if (millis() - firestoreUpdateTimer >= 5000 && app.ready()) {
    firestoreUpdateTimer = millis();
    
    // GET collections dari Firestore
    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));
    
    // Deserialize JSON ke documents
    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);
    
    int currentUserIndex = 0;
    int currentReceiptIndex = 0;
    int currentLokerControlIndex = 0;
    
    // Process users data
    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentUserIndex < MAX_USERS) {
        users[currentUserIndex].email = obj["fields"]["email"]["stringValue"].as<String>();
        users[currentUserIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
      }
      currentUserIndex++;
    }
    
    // Process receipts data
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
    
    // Process lokerControl data
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

**Detailed Analysis:**

1. **Connection Maintenance**:
   - **app.loop()**: Keep Firebase connection alive
   - **Called every cycle**: Continuous connection monitoring

2. **Update Timing**:
   - **5 second interval**: Balanced antara responsiveness dan bandwidth
   - **millis() comparison**: Non-blocking timing
   - **app.ready() check**: Only update saat connection stable

3. **Data Retrieval**:
   - **Three collections**: users, receipts, lokerControl
   - **Firestore GET requests**: Retrieve complete collection data
   - **JSON response**: Firestore returns complex JSON structure

4. **JSON Processing**:
   - **deserializeJson()**: Parse JSON strings ke JsonDocument
   - **JsonArray iteration**: Loop through documents array
   - **Field extraction**: Navigate Firestore field structure

5. **Local Array Updates**:
   - **Bounds checking**: currentIndex < MAX_SIZE
   - **Type conversion**: stringValue, integerValue extraction
   - **Memory management**: Fixed-size arrays untuk predictable memory usage

---

## 10. GLOBAL VARIABLES DAN DATA STRUCTURES

### **Hardware State Variables [library.h]**
```cpp
// Sensor readings
int currentDistance = 0;                    // Ultrasonic sensor value (0-45cm)
String scannedBarcode = "||||||||||||||||||||";  // Last scanned barcode
bool isNewBarcodeScanned = false;           // Barcode scan flag

// Hardware control arrays
bool entrySwitches[6];                      // Entry limit switch states
bool exitSwitches[6];                       // Exit limit switch states
String lokerControlCommands[5] = {          // Loker servo commands
  "tutup", "tutup", "tutup", "tutup", "tutup"
};
String mainDoorControl = "";                // Main door servo command
String relayControlCommand = "buka";        // Relay control command

// Menu state variables
MenuState currentMenuState = MENU_MAIN;     // Current UI state
int selectedCourier = 0;                    // Selected courier index
String trackingInput;                       // Manual tracking input
int currentPackageIndex;                    // Active package index
String packageType;                         // Package type (COD/Non-COD)
bool isPackageReceived = false;             // Package insertion flag
```

**Detailed Analysis:**
1. **Sensor State Management**:
   - **currentDistance**: Updated setiap loop cycle
   - **scannedBarcode**: Reset dengan pipe characters untuk visual debugging
   - **isNewBarcodeScanned**: Prevents duplicate processing

2. **Hardware Control Arrays**:
   - **entrySwitches[6]**, **exitSwitches[6]**: Index 0-4 untuk lokers, index 5 untuk main door
   - **lokerControlCommands[5]**: String commands untuk individual loker control
   - **Default states**: All lokers closed, relay open

3. **Menu State Management**:
   - **currentMenuState**: Enum untuk state machine control
   - **selectedCourier**: 0=None, 1=Shopee, 2=J&T, 3=SiCepat
   - **trackingInput**: Buffer untuk manual resi input

### **Database Structures [library.h]**
```cpp
struct UsersTypedef {
  String email;
  String nama;
};

struct RececiptsTypedef {
  String nama;
  String noResi;
  int nomorLoker;        // 1-5 untuk COD packages
  String status;         // Package status
  String tipePaket;      // "COD" atau "Non-COD"
  String userEmail;
};

struct LokerControlTypedef {
  int nomorLoker;        // Loker number (1-5)
  int buka;              // Open command (0/1)
  int tutup;             // Close command (0/1)
};

// Local data arrays
UsersTypedef users[MAX_USERS];               // Max 20 users
RececiptsTypedef receipts[MAX_RECEIPTS];     // Max 30 packages
LokerControlTypedef lokerControl[5];         // 5 COD lokers
```

**Detailed Analysis:**
1. **Data Structure Design**:
   - **Simple structures**: Easy serialization/deserialization
   - **String types**: Compatible dengan Firestore stringValue fields
   - **Fixed arrays**: Predictable memory usage

2. **Package Management**:
   - **nomorLoker**: Physical loker assignment (1-5)
   - **tipePaket**: Determines processing flow (COD vs Non-COD)
   - **status**: Tracking state ("Sedang Dikirim", "Telah Tiba", "Sudah Diambil")

3. **Remote Control**:
   - **LokerControlTypedef**: Firebase remote commands
   - **Binary commands**: buka/tutup sebagai 0/1 integers
   - **Real-time control**: Updated via updateDatabaseData()

---

## 11. FUNCTION CALL DEPENDENCIES

### **Main Loop Dependencies**
```
TaskControl() [Every cycle]
├── readLimitSwitches() → Updates entrySwitches[], exitSwitches[]
├── controlAllLokers() → Uses lokerControlCommands[]
│   ├── openLokerCompartment() → Uses exitSwitches[]
│   └── closeLokerCompartment() → Uses entrySwitches[]
├── controlMainDoor() → Uses mainDoorControl
│   ├── openMainDoor() → Uses entrySwitches[5]
│   └── closeMainDoor() → Uses exitSwitches[5]
├── controlRelayOutput() → Uses relayControlCommand
├── processRemoteLokerCommands() → Uses lokerControl[], Updates serialInput
├── menu() → Main state machine
│   ├── displayTextOnLCD() → Uses lastDisplayedText[] buffer
│   ├── playAudioCommand() → Audio feedback
│   ├── scanBarcodeFromSerial() → Updates scannedBarcode
│   └── State-specific logic → Updates currentMenuState
├── readDistanceSensor() → Updates currentDistance
└── processSerialCommands() → Updates control variables
```

### **Initialization Dependencies**
```
TaskControl() Initialization:
├── initializeAudioSystem() → DFPlayer setup
├── initializeLCDDisplay() → LCD setup
├── initializeSensors() → I2C, Serial2, PCF8574
├── initializeServoController() → PCA9685 setup
├── initializeKeypad() → Keypad I2C setup
├── initializeRelay() → Relay pin setup
└── initializeButtons() → Button pin setup
```

### **Data Flow Dependencies**
```
Firebase → updateDatabaseData() → Local arrays
├── users[] ← usersDocument
├── receipts[] ← receiptsDocument
└── lokerControl[] ← lokerControlDocument

Local arrays → menu() logic → Hardware control
├── receipts[] → Package validation
├── lokerControl[] → Remote commands
└── users[] → QR access validation

Hardware sensors → Global variables → Control logic
├── Limit switches → entrySwitches[], exitSwitches[]
├── Ultrasonic → currentDistance
├── Barcode → scannedBarcode
└── Keypad → Menu navigation
```

---

## 12. SYSTEM FLOW DAN DECISION TREES

### **Package Processing Decision Tree**
```
User Input (Button/Barcode)
├── INPUT RESI
│   ├── Select Courier (1,2,3)
│   ├── Manual Entry (Keypad)
│   └── Confirm (#) → Database Validation
├── SCAN RESI
│   ├── Barcode Detection
│   ├── Confirm (Button2)
│   └── → Database Validation
└── QR ACCESS (#)
    ├── Scan QR Code
    ├── Email Validation
    └── Door Access (5s)

Database Validation:
├── Found in receipts[]
│   ├── Get packageType
│   ├── Open Main Door
│   ├── Package Insertion
│   └── Route by Type:
│       ├── COD → Open Assigned Loker → Wait Collection → Close
│       └── Non-COD → Complete → Return Main Menu
└── Not Found
    ├── Error Message
    ├── Audio Feedback
    └── Return Main Menu
```

### **Hardware Control Flow**
```
Main Control Loop (Core 1):
├── Safety First: readLimitSwitches()
├── Servo Control:
│   ├── controlAllLokers() → Check lokerControlCommands[]
│   └── controlMainDoor() → Check mainDoorControl
├── Relay Control: controlRelayOutput()
├── Remote Commands: processRemoteLokerCommands()
├── User Interface: menu() → State machine
├── Package Detection: readDistanceSensor()
└── Debug Interface: processSerialCommands()

Hardware Safety Logic:
├── Limit Switch Check → entrySwitches[], exitSwitches[]
├── Safe Servo Movement:
│   ├── Open: Only if exitSwitch == 0
│   ├── Close: Only if entrySwitch == 0
│   └── Neutral: If switches indicate obstacle
└── Emergency Stop: Serial command "st"
```

### **Network Operations Flow**
```
TaskDatabase (Core 0):
├── Startup:
│   ├── WiFi Connection → Wait WL_CONNECTED
│   └── Firebase Initialization → SSL + Auth
└── Runtime Loop:
    ├── app.loop() → Maintain connection
    └── Every 5 seconds:
        ├── GET users collection
        ├── GET receipts collection
        ├── GET lokerControl collection
        ├── JSON deserializetion
        └── Update local arrays

Connection Management:
├── WiFi Status Monitoring
├── Firebase Authentication Refresh
├── Error Handling:
│   ├── Connection Lost → Retry
│   ├── JSON Parse Error → Skip update
│   └── API Rate Limit → Backoff
```

### **Menu State Machine Flow**
```
MENU_MAIN
├── Button1 → MENU_SELECT_COURIER
├── Button2 → MENU_SCAN_TRACKING
└── Keypad '#' → MENU_OPEN_DOOR

MENU_SELECT_COURIER
├── Keypad '1' → MENU_INPUT_TRACKING (Shopee)
├── Keypad '2' → MENU_INPUT_TRACKING (J&T)
├── Keypad '3' → MENU_INPUT_TRACKING (SiCepat)
└── Keypad 'B' → MENU_MAIN

MENU_INPUT_TRACKING
├── Keypad input → trackingInput buffer
├── Keypad '#' → MENU_COMPARE_TRACKING
└── Keypad '*' → MENU_MAIN

MENU_SCAN_TRACKING
├── Barcode detected → scannedBarcode
├── Button2 + barcode ready → MENU_COMPARE_TRACKING
└── Keypad 'B' → MENU_MAIN

MENU_COMPARE_TRACKING
├── Database search → receipts[]
├── Found → MENU_INSERT_PACKAGE
└── Not found → MENU_MAIN

MENU_INSERT_PACKAGE
├── Package detected → Door close
├── COD type → MENU_OPEN_LOKER
└── Non-COD type → MENU_MAIN

MENU_OPEN_LOKER
├── Exit switch triggered → MENU_CLOSE_LOKER
└── Wait for collection

MENU_CLOSE_LOKER
├── Entry switch triggered → MENU_MAIN
└── Wait for door close

MENU_OPEN_DOOR
├── Valid QR → 5s access → MENU_MAIN
└── Invalid QR → Error → MENU_MAIN
```

---

**Developer:** SHINTYA PUTRI WIJAYA (2141160117)  
**Project:** Smart Packet Box COD ESP32 Firmware - Complete Code Analysis