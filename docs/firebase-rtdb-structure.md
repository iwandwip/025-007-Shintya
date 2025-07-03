# Firebase Realtime Database Structure Update
## Dynamic QR System Integration

### Updated RTDB Structure for Scanner Mode Management

```json
{
  "monitoring": {
    "systemStatus": {
      "hardware": {
        "isInUse": boolean,
        "sessionType": "rfid" | "weighing" | "idle",
        "rfid": "string",
        "userRfid": "string", 
        "weight": number,
        "height": number,
        "measurementComplete": boolean,
        "lastActivity": timestamp,
        "deviceStatus": "online" | "offline" | "error",
        "errorMessage": "string"
      },
      "scannerMode": {
        "mode": "resi" | "user_qr" | "rfid",
        "isActive": boolean,
        "initiatedBy": "user_id" | null,
        "startTime": timestamp,
        "expiresAt": timestamp,
        "sessionId": "unique_session_id",
        "lastUpdated": timestamp
      }
    }
  },
  "control": {
    "capacity": {
      "currentHeight": number,
      "maxHeight": number,
      "percentage": number,
      "lastReading": timestamp
    },
    "rfidReader": {
      "isListening": boolean,
      "lastCardRead": "string",
      "readTimestamp": timestamp
    },
    "lokers": {
      "loker_1": {
        "isOpen": boolean,
        "hasPackage": boolean,
        "lastAccessed": timestamp
      },
      "loker_2": { "..." },
      "loker_3": { "..." },
      "loker_4": { "..." },
      "loker_5": { "..." }
    },
    "qrScanner": {
      "lastScan": "string",
      "scanTimestamp": timestamp,
      "scanMode": "resi" | "user_qr",
      "processingStatus": "idle" | "processing" | "complete" | "error",
      "lastResult": {
        "success": boolean,
        "message": "string",
        "data": "object"
      }
    }
  },
  "sessions": {
    "active": {
      "{sessionId}": {
        "type": "user_qr" | "rfid_pairing",
        "userId": "string",
        "startTime": timestamp,
        "expiresAt": timestamp,
        "status": "active" | "expired" | "completed",
        "metadata": "object"
      }
    },
    "history": {
      "{date}": {
        "{sessionId}": {
          "type": "string",
          "userId": "string", 
          "duration": number,
          "result": "success" | "timeout" | "cancelled",
          "timestamp": timestamp
        }
      }
    }
  }
}
```

### Scanner Mode States

#### Default State (resi)
```json
{
  "mode": "resi",
  "isActive": false,
  "initiatedBy": null,
  "startTime": 0,
  "expiresAt": 0,
  "sessionId": null,
  "lastUpdated": timestamp
}
```

#### User QR Mode (active)
```json
{
  "mode": "user_qr", 
  "isActive": true,
  "initiatedBy": "user_12345",
  "startTime": 1704067200000,
  "expiresAt": 1704067500000,
  "sessionId": "scan_1704067200_abc123",
  "lastUpdated": 1704067201000
}
```

#### RFID Mode (active)
```json
{
  "mode": "rfid",
  "isActive": true, 
  "initiatedBy": "user_67890",
  "startTime": 1704067300000,
  "expiresAt": 1704067330000,
  "sessionId": "rfid_1704067300_def456",
  "lastUpdated": 1704067301000
}
```

### ESP32 Integration Points

#### Reading Scanner Mode
```cpp
// ESP32 code to read current mode
void checkScannerMode() {
  String path = "/monitoring/systemStatus/scannerMode";
  String response = firebase.getString(path);
  
  if (response.indexOf("\"mode\":\"user_qr\"") > -1) {
    currentMode = "user_qr";
    lcd.display("Mode: QR Pengguna");
  } else if (response.indexOf("\"mode\":\"resi\"") > -1) {
    currentMode = "resi"; 
    lcd.display("Mode: Scan Resi");
  }
  
  // Check if mode is expired
  checkModeExpiry(response);
}
```

#### Processing QR Based on Mode
```cpp
void processQRCode(String qrData) {
  if (currentMode == "user_qr") {
    // Use ShintyaEncryption library to decrypt
    ShintyaEncryption encryption;
    String decrypted = encryption.decrypt(qrData);
    
    if (decrypted.length() > 0) {
      String email = encryption.extractEmail(decrypted);
      lcd.display("Welcome!");
      lcd.display(email);
      
      // Log successful scan
      logQRScan(email, "user_qr", true);
    } else {
      lcd.display("QR Invalid");
      logQRScan("", "user_qr", false);
    }
  } else if (currentMode == "resi") {
    // Process as regular receipt QR
    if (validateResiFormat(qrData)) {
      lcd.display("Resi Valid");
      logQRScan(qrData, "resi", true);
    } else {
      lcd.display("Resi Invalid");
      logQRScan(qrData, "resi", false);
    }
  }
}
```

#### Updating QR Scanner Status
```cpp
void updateQRScannerStatus(String lastScan, bool success, String message) {
  String path = "/control/qrScanner";
  
  DynamicJsonDocument doc(512);
  doc["lastScan"] = lastScan;
  doc["scanTimestamp"] = getCurrentTimestamp();
  doc["scanMode"] = currentMode;
  doc["processingStatus"] = success ? "complete" : "error";
  doc["lastResult"]["success"] = success;
  doc["lastResult"]["message"] = message;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  firebase.setString(path, jsonString);
}
```

### Security Rules Update

```javascript
// Firebase Realtime Database Security Rules
{
  "rules": {
    "monitoring": {
      "systemStatus": {
        "scannerMode": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    },
    "control": {
      "qrScanner": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "sessions": {
      "active": {
        "$sessionId": {
          ".read": "auth != null && auth.uid == data.child('userId').val()",
          ".write": "auth != null && auth.uid == data.child('userId').val()"
        }
      },
      "history": {
        ".read": "auth != null",
        ".write": false
      }
    }
  }
}
```

### Migration Script

```javascript
// Migration script to update existing RTDB structure
const updateRTDBStructure = async () => {
  const updates = {};
  
  // Initialize scanner mode
  updates['/monitoring/systemStatus/scannerMode'] = {
    mode: 'resi',
    isActive: false,
    initiatedBy: null,
    startTime: 0,
    expiresAt: 0,
    sessionId: null,
    lastUpdated: Date.now()
  };
  
  // Initialize QR scanner control
  updates['/control/qrScanner'] = {
    lastScan: '',
    scanTimestamp: 0,
    scanMode: 'resi',
    processingStatus: 'idle',
    lastResult: {
      success: false,
      message: 'System initialized',
      data: null
    }
  };
  
  // Initialize sessions structure
  updates['/sessions/active'] = {};
  updates['/sessions/history'] = {};
  
  await firebase.database().ref().update(updates);
  console.log('RTDB structure updated for Dynamic QR System');
};
```

### Monitoring and Analytics

#### Session Analytics
```javascript
// Track session usage patterns
const logSessionAnalytics = async (sessionData) => {
  const date = new Date().toISOString().split('T')[0];
  const analyticsRef = firebase.database().ref(`analytics/sessions/${date}`);
  
  await analyticsRef.push({
    sessionId: sessionData.sessionId,
    type: sessionData.type,
    duration: sessionData.expiresAt - sessionData.startTime,
    result: sessionData.result,
    userId: sessionData.userId,
    timestamp: Date.now()
  });
};
```

#### Mode Usage Statistics  
```javascript
// Track mode switching patterns
const trackModeUsage = async (mode, userId) => {
  const date = new Date().toISOString().split('T')[0];
  const usageRef = firebase.database().ref(`analytics/mode_usage/${date}/${mode}`);
  
  const snapshot = await usageRef.once('value');
  const currentCount = snapshot.val() || 0;
  
  await usageRef.set(currentCount + 1);
};
```

### Performance Optimization

#### Efficient Listeners
```javascript
// Optimized RTDB listeners for scanner mode
const optimizedModeListener = () => {
  const modeRef = firebase.database().ref('/monitoring/systemStatus/scannerMode');
  
  // Use once() for one-time reads
  const getCurrentMode = () => modeRef.once('value');
  
  // Use on() with cleanup for real-time updates
  const startModeMonitoring = (callback) => {
    const listener = modeRef.on('value', callback);
    
    return () => modeRef.off('value', listener);
  };
};
```

#### Batch Updates
```javascript
// Batch RTDB updates for better performance
const batchUpdateScannerState = async (mode, sessionId, qrResult) => {
  const updates = {};
  
  updates['/monitoring/systemStatus/scannerMode/lastUpdated'] = Date.now();
  updates['/control/qrScanner/lastScan'] = qrResult.qrData;
  updates['/control/qrScanner/scanTimestamp'] = Date.now();
  updates['/control/qrScanner/lastResult'] = qrResult;
  
  await firebase.database().ref().update(updates);
};
```

This updated structure provides:
- ✅ Clear separation of scanner modes
- ✅ Session management with expiry
- ✅ ESP32 integration points  
- ✅ Performance optimized listeners
- ✅ Comprehensive analytics
- ✅ Security rule enforcement
- ✅ Migration path from existing structure