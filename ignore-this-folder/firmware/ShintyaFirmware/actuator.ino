void setupSpeaker() {
  Serial1.begin(9600, SERIAL_8N1, rxSpeaker, txSpeaker);
  Serial.println();
  Serial.println("DFPlayer Mini Demo");
  Serial.println("Initializing DFPlayer...");

  if (!myDFPlayer.begin(Serial1)) {
    Serial.println("Unable to begin:");
    Serial.println("1.Please recheck the connection!");
    Serial.println("2.Please insert the SD card!");
    while (true)
      ;
  }
  Serial.println(F("DFPlayer Mini online."));

  myDFPlayer.setTimeOut(500);

  // Set initial volume
  myDFPlayer.volume(VOLUME);  // Set initial volume value (0~30).
  myDFPlayer.EQ(DFPLAYER_EQ_NORMAL);
  // myDFPlayer.EQ(DFPLAYER_EQ_BASS);
  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SD);

  Serial.println("Ready to play songs...");
}

void setupButton() {
  pinMode(button1pin, INPUT);
  pinMode(button2pin, INPUT);
}


void readButton() {
  Serial.printf("%d %d \n ", button1, button2);
}

//========================= speaker =============================
void speak(String inputString) {
  // Handle volume change with input like 's0' to 's30'
  if (inputString.startsWith("s")) {
    String volumeString = inputString.substring(1);  // Extract the number after 's'
    int volume = volumeString.toInt();               // Convert the extracted string to an integer

    // Check if the volume is within the valid range (0 to 30)
    if (volume >= 0 && volume <= 30) {
      myDFPlayer.volume(volume);  // Set the volume to the received value
      Serial.print("Volume set to ");
      Serial.println(volume);
    } else {
      Serial.println("Invalid volume. Please enter a number between s0 and s30.");
    }
  }
  // Handle pause command 'p'
  else if (inputString == "p") {
    myDFPlayer.pause();  // Pause the song
    Serial.println("Playback paused.");
  } else {
    // Handle song selection with input like '1', '2', ..., '100'
    int songIndex = inputString.toInt();  // Convert the input string to an integer

    // Check if the song index is between 1 and 100
    if (songIndex >= 0 && songIndex <= 100) {
      myDFPlayer.play(songIndex);  // Play the song based on the input
      Serial.print("Playing song ");
      Serial.println(songIndex);
    } else {
      Serial.println("Invalid song number. Please enter a number between 1 and 100.");
    }
  }
}

void setupRelay() {
  pinMode(selPin, OUTPUT);
  digitalWrite(selPin, HIGH);
  controlRelay = "tutup";
}

void relayController() {
  digitalWrite(selPin, controlRelay == "buka" ? LOW : HIGH);
}

//===================control loker ==========================
void lokerController() {
  for (int i = 0; i < 5; i++) {
    if (controlLoker[i] == "tutup") closeLoker(i);
    else if (controlLoker[i] == "buka") openLoker(i);
  }
}

void openLoker(int i) {
  if (limitKeluar[i] == 0) servo.setPWM(i, 0, angleToPulse(135));
  else servo.setPWM(i, 0, angleToPulse(100));
}

void stopLoker(int i) {
  servo.setPWM(i, 0, angleToPulse(100));
}


void closeLoker(int i) {
  if (limitMasuk[i] == 0) servo.setPWM(i, 0, angleToPulse(75));
  else servo.setPWM(i, 0, angleToPulse(100));
}

//================== control tutup ===================================================

void openTutup() {
  if (limitMasuk[5] == 0) {
    servo.setPWM(5, 0, angleToPulse(142));
    servo.setPWM(6, 0, angleToPulse(80));
  } else {
    servo.setPWM(6, 0, angleToPulse(100));
    servo.setPWM(5, 0, angleToPulse(100));
  }
}

void closeTutup() {
  if (limitKeluar[5] == 0) {
    servo.setPWM(6, 0, angleToPulse(119));
    servo.setPWM(5, 0, angleToPulse(80));
  } else {
    servo.setPWM(5, 0, angleToPulse(100));
    servo.setPWM(6, 0, angleToPulse(100));
  }
}


void stopTutup() {
  servo.setPWM(5, 0, angleToPulse(100));
  servo.setPWM(6, 0, angleToPulse(100));
}

void tutupController() {
  if (controlTutup == "tutup") closeTutup();
  else if (controlTutup == "buka") openTutup();
  else stopTutup();
}

//===============servo====================================================
void setupServo() {
  servo.begin();
  servo.setPWMFreq(60);  // Analog servos run at ~60 Hz updates
  servo.setPWM(5, 0, angleToPulse(100));
  servo.setPWM(6, 0, angleToPulse(100));
}

int angleToPulse(int ang) {
  int pulse = map(ang, 0, 180, SERVOMIN, SERVOMAX);  // map angle of 0 to 180 to Servo min and Servo max
  return pulse;
}



void lokerControllerFromDB() {
  // Serial.println("=========================");
  // for (int i = 0; i < 5; i++) Serial.printf("Loker-%d : buka(%s) tutup(%s)\n", lokerControl[i].nomorLoker, lokerControl[i].buka != false ? "true" : "false", lokerControl[i].tutup != false ? "true" : "false");
  // Serial.println("=========================");
  // vTaskDelay(3000);
  for (int i = 0; i < 5; i++) {
    if (lokerControl[i].buka != false) input = "o"+String(i+1);
    if (lokerControl[i].tutup != false) input = "c"+String(i+1 );
  }
}