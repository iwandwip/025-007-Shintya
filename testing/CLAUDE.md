# Testing Directory - Development Testing Tools

## Overview
The `testing/` directory contains development testing tools and simulators for the React Native + Expo application. These tools support hardware simulation, framework testing, and development workflow optimization.

## Directory Structure
```
testing/
├── esp32-framework.cpp     # ESP32 framework testing template
└── esp32-simulator.js      # Node.js ESP32 hardware simulator
```

## Testing Tools

### esp32-simulator.js
- **Purpose**: Node.js-based ESP32 hardware simulator for development
- **Key Features**:
  - Hardware simulation without physical ESP32
  - Firebase integration testing
  - RFID system simulation
  - Capacity sensor simulation
  - Real-time data synchronization
  - Interactive command-line interface
- **Key Functions**:
  - `simulateRFIDScan(rfidCode)` - Simulate RFID card scanning
  - `simulateCapacityReading(height)` - Simulate ultrasonic sensor
  - `simulateLokerControl(lokerNumber, action)` - Simulate loker operations
  - `connectToFirebase()` - Firebase connection simulation
  - `startSimulation()` - Initialize simulator
  - `processCommand(command)` - Handle CLI commands
- **CLI Commands**:
  - `scan <rfid_code>` - Simulate RFID scan
  - `capacity <height>` - Update capacity reading
  - `loker <number> <action>` - Control loker operation
  - `status` - Show simulator status
  - `help` - Show available commands
- **Dependencies**: `firebase`, `inquirer`, `fs`, `path`

### esp32-framework.cpp
- **Purpose**: ESP32 framework testing template
- **Key Features**:
  - Hardware testing framework
  - Component testing templates
  - Arduino framework integration
  - Sensor testing utilities
  - WiFi connection testing
- **Key Components**:
  - `setup()` - Hardware initialization
  - `loop()` - Main testing loop
  - `testRFID()` - RFID module testing
  - `testUltrasonic()` - Ultrasonic sensor testing
  - `testWiFi()` - WiFi connectivity testing
  - `testFirebase()` - Firebase integration testing
- **Test Modules**:
  - RFID RC522 module testing
  - Ultrasonic sensor HC-SR04 testing
  - LCD display testing
  - WiFi module testing
  - Firebase connectivity testing
- **Dependencies**: Arduino framework, ESP32 libraries

## ESP32 Simulator Features

### Hardware Simulation
```javascript
// RFID scanning simulation
const simulateRFIDScan = async (rfidCode) => {
  console.log(`🔍 Simulating RFID scan: ${rfidCode}`);
  
  // Update Firebase with scan result
  await updateFirebaseData('rfidScans', {
    rfidCode,
    timestamp: Date.now(),
    deviceId: 'simulator',
    scanResult: 'success'
  });
  
  console.log('✅ RFID scan completed');
};

// Capacity monitoring simulation
const simulateCapacityReading = async (height) => {
  const maxHeight = 30; // cm
  const percentage = Math.max(0, Math.min(100, ((maxHeight - height) / maxHeight) * 100));
  
  console.log(`📏 Simulating capacity: ${height}cm (${percentage.toFixed(1)}% full)`);
  
  await updateFirebaseData('capacity', {
    height,
    maxHeight,
    percentage,
    lastUpdated: Date.now(),
    deviceId: 'simulator'
  });
};
```

### Firebase Integration
```javascript
// Firebase connection simulation
const connectToFirebase = async () => {
  try {
    // Initialize Firebase connection
    const firebaseConfig = require('../firebase-config.json');
    
    await firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase connected successfully');
    
    // Setup real-time listeners
    setupRealtimeListeners();
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
};

// Real-time data listeners
const setupRealtimeListeners = () => {
  // Listen for loker control commands
  firebase.database().ref('lokerControl').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      processLokerCommands(data);
    }
  });
  
  // Listen for scanner mode changes
  firebase.database().ref('scannerMode').on('value', (snapshot) => {
    const mode = snapshot.val();
    if (mode) {
      processScannerModeChange(mode);
    }
  });
};
```

### Interactive CLI
```javascript
// Command processing
const processCommand = async (command) => {
  const [cmd, ...args] = command.split(' ');
  
  switch (cmd) {
    case 'scan':
      if (args[0]) {
        await simulateRFIDScan(args[0]);
      } else {
        console.log('Usage: scan <rfid_code>');
      }
      break;
      
    case 'capacity':
      if (args[0]) {
        const height = parseInt(args[0]);
        await simulateCapacityReading(height);
      } else {
        console.log('Usage: capacity <height_cm>');
      }
      break;
      
    case 'loker':
      if (args[0] && args[1]) {
        const lokerNumber = parseInt(args[0]);
        const action = args[1];
        await simulateLokerControl(lokerNumber, action);
      } else {
        console.log('Usage: loker <number> <action>');
      }
      break;
      
    case 'status':
      showSimulatorStatus();
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.log('Unknown command. Type "help" for available commands.');
  }
};
```

## ESP32 Framework Testing

### Hardware Testing Template
```cpp
// ESP32 framework testing
void setup() {
  Serial.begin(115200);
  
  // Initialize components
  initializeWiFi();
  initializeRFID();
  initializeUltrasonic();
  initializeLCD();
  
  // Run initial tests
  runInitialTests();
}

void loop() {
  // Continuous testing loop
  testRFID();
  testUltrasonic();
  testWiFi();
  testFirebase();
  
  delay(1000);
}

// RFID testing
void testRFID() {
  if (rfid.PICC_IsNewCardPresent()) {
    if (rfid.PICC_ReadCardSerial()) {
      String rfidCode = getRFIDCode();
      Serial.println("RFID detected: " + rfidCode);
      
      // Send to Firebase
      sendToFirebase("rfidScans", rfidCode);
    }
  }
}

// Ultrasonic sensor testing
void testUltrasonic() {
  long duration, distance;
  
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH);
  distance = (duration / 2) / 29.1;
  
  Serial.println("Distance: " + String(distance) + " cm");
  
  // Send to Firebase
  sendCapacityData(distance);
}
```

## Usage Patterns

### Development Workflow
1. **Start Simulator**: `npm run test` to launch ESP32 simulator
2. **Interactive Testing**: Use CLI commands to simulate hardware
3. **Real-time Monitoring**: Watch Firebase updates in real-time
4. **App Integration**: Test app responses to simulated hardware events

### Testing Scenarios
```javascript
// Test RFID pairing flow
await simulateRFIDScan('A1B2C3D4');

// Test capacity monitoring
await simulateCapacityReading(15); // 50% full

// Test loker control
await simulateLokerControl(1, 'buka'); // Open loker 1
```

### Firebase Integration Testing
```javascript
// Test real-time data sync
const testDataSync = async () => {
  console.log('🧪 Testing Firebase data synchronization...');
  
  // Simulate multiple sensor readings
  for (let i = 0; i < 5; i++) {
    await simulateCapacityReading(Math.random() * 30);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Data sync test completed');
};
```

## Development Benefits

### Hardware-Free Development
- **No Physical Hardware**: Develop without ESP32 device
- **Rapid Testing**: Quick iteration and testing cycles
- **Cost Effective**: No hardware costs for development
- **Team Collaboration**: Multiple developers can test simultaneously

### Realistic Simulation
- **Real Firebase Integration**: Uses actual Firebase services
- **Accurate Timing**: Realistic response times and delays
- **Error Simulation**: Can simulate hardware failures
- **Data Consistency**: Maintains data integrity like real hardware

### Debugging Support
- **Detailed Logging**: Comprehensive logging for debugging
- **Interactive Control**: Manual control for specific test cases
- **State Inspection**: Real-time state monitoring
- **Error Tracking**: Detailed error reporting

## Configuration

### Simulator Configuration
```javascript
const simulatorConfig = {
  deviceId: 'simulator',
  rfidEnabled: true,
  capacityEnabled: true,
  lokerCount: 5,
  maxCapacity: 30, // cm
  responseDelay: 500, // ms
  autoMode: false
};
```

### Firebase Configuration
```javascript
const firebaseConfig = {
  // Firebase configuration from main app
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};
```

## Best Practices

### Testing Workflow
1. **Start with Simulator**: Begin development with simulator
2. **Test App Integration**: Ensure app responds correctly
3. **Validate Data Flow**: Check Firebase data consistency
4. **Hardware Testing**: Move to real hardware when ready

### Error Handling
- **Graceful Failures**: Simulate network failures and errors
- **Recovery Testing**: Test app recovery from failures
- **Edge Cases**: Test unusual hardware states
- **Performance Testing**: Simulate high-load scenarios

### Documentation
- **Command Reference**: Document all CLI commands
- **Test Scenarios**: Document common test scenarios
- **Configuration Options**: Document all configuration options
- **Troubleshooting**: Document common issues and solutions

The testing directory provides comprehensive tools for hardware simulation and development testing, enabling efficient development without physical hardware dependencies.