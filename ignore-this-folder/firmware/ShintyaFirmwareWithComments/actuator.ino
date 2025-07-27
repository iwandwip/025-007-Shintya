/**
 * @brief Menginisialisasi sistem audio menggunakan modul DFPlayer Mini.
 * 
 * Fungsi ini mengatur komunikasi serial dengan DFPlayer Mini,
 * melakukan inisialisasi modul, mengatur volume awal, dan
 * memilih perangkat output (kartu SD).
 */
void initializeAudioSystem() {
  // Memulai komunikasi serial untuk DFPlayer Mini
  Serial1.begin(9600, SERIAL_8N1, SPEAKER_RX_PIN, SPEAKER_TX_PIN);
  Serial.println();
  Serial.println("DFPlayer Mini Demo");
  Serial.println("Initializing DFPlayer...");

  // Memulai inisialisasi DFPlayer Mini
  if (!myDFPlayer.begin(Serial1)) {
    Serial.println("Unable to begin:");
    Serial.println("1.Please recheck the connection!");
    Serial.println("2.Please insert the SD card!");
    while (true)  // Loop tak terbatas jika inisialisasi gagal
      ;
  }
  Serial.println(F("DFPlayer Mini online."));

  // Mengatur batas waktu (timeout) untuk komunikasi DFPlayer
  myDFPlayer.setTimeOut(500);

  // Mengatur volume awal (0~30)
  myDFPlayer.volume(VOLUME);
  // Mengatur equalizer ke mode normal
  myDFPlayer.EQ(DFPLAYER_EQ_NORMAL);
  // myDFPlayer.EQ(DFPLAYER_EQ_BASS); // Contoh: equalizer bass
  // Memilih kartu SD sebagai perangkat output
  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SD);

  Serial.println("Ready to play songs...");
}

void initializeButtons() {
  pinMode(button1pin, INPUT);
  pinMode(button2pin, INPUT);
}


void readButtonStates() {
  Serial.printf("%d %d \n ", button1, button2);
}

//========================= speaker =============================
void playAudioCommand(String audioCommand) {
  // Handle volume change with input like 's0' to 's30'
  if (audioCommand.startsWith("s")) {
    String volumeString = audioCommand.substring(1);  // Extract the number after 's'
    int volume = volumeString.toInt();                // Convert the extracted string to an integer

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
  else if (audioCommand == "p") {
    myDFPlayer.pause();  // Pause the song
    Serial.println("Playback paused.");
  } else {
    // Handle song selection with input like '1', '2', ..., '100'
    int songIndex = audioCommand.toInt();  // Convert the input string to an integer

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

void initializeRelay() {
  pinMode(RELAY_SELECT_PIN, OUTPUT);
  digitalWrite(RELAY_SELECT_PIN, HIGH);
  relayControlCommand = "tutup";
}

void controlRelayOutput() {
  digitalWrite(RELAY_SELECT_PIN, relayControlCommand == "buka" ? LOW : HIGH);
}

//===================control loker ==========================
void controlAllLokers() {
  for (int i = 0; i < 5; i++) {
    if (lokerControlCommands[i] == "tutup") closeLokerCompartment(i);
    else if (lokerControlCommands[i] == "buka") openLokerCompartment(i);
  }
}

void openLokerCompartment(int lokerNumber) {
  if (exitSwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(135));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}

void stopLokerCompartment(int lokerNumber) {
  servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}


void closeLokerCompartment(int lokerNumber) {
  if (entrySwitches[lokerNumber] == 0) servo.setPWM(lokerNumber, 0, convertAngleToPulse(75));
  else servo.setPWM(lokerNumber, 0, convertAngleToPulse(100));
}

//================== control tutup ===================================================

void openMainDoor() {
  if (entrySwitches[5] == 0) {
    servo.setPWM(5, 0, convertAngleToPulse(142));
    servo.setPWM(6, 0, convertAngleToPulse(80));
  } else {
    servo.setPWM(6, 0, convertAngleToPulse(100));
    servo.setPWM(5, 0, convertAngleToPulse(100));
  }
}

void closeMainDoor() {
  if (exitSwitches[5] == 0) {
    servo.setPWM(6, 0, convertAngleToPulse(119));
    servo.setPWM(5, 0, convertAngleToPulse(80));
  } else {
    servo.setPWM(5, 0, convertAngleToPulse(100));
    servo.setPWM(6, 0, convertAngleToPulse(100));
  }
}


void stopMainDoor() {
  servo.setPWM(5, 0, convertAngleToPulse(100));
  servo.setPWM(6, 0, convertAngleToPulse(100));
}

void controlMainDoor() {
  if (mainDoorControl == "tutup") closeMainDoor();
  else if (mainDoorControl == "buka") openMainDoor();
  else stopMainDoor();
}

//===============servo====================================================
void initializeServoController() {
  servo.begin();
  servo.setPWMFreq(60);  // Analog servos run at ~60 Hz updates
  servo.setPWM(5, 0, convertAngleToPulse(100));
  servo.setPWM(6, 0, convertAngleToPulse(100));
}

int convertAngleToPulse(int angle) {
  int pulseWidth = map(angle, 0, 180, SERVOMIN, SERVOMAX);  // map angle of 0 to 180 to Servo min and Servo max
  return pulseWidth;
}



void processRemoteLokerCommands() {
  // Serial.println("=========================");
  // for (int i = 0; i < 5; i++) Serial.printf("Loker-%d : buka(%s) tutup(%s)\n", lokerControl[i].nomorLoker, lokerControl[i].buka != false ? "true" : "false", lokerControl[i].tutup != false ? "true" : "false");
  // Serial.println("=========================");
  // vTaskDelay(3000);
  for (int i = 0; i < 5; i++) {
    if (lokerControl[i].buka != false) serialInput = "o" + String(i + 1);
    if (lokerControl[i].tutup != false) serialInput = "c" + String(i + 1);
  }
}