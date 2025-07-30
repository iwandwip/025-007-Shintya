void initializeSensors() {
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67);
  pcfEntryInput.begin(0x20, &Wire);
  pcfExitOutput.begin(0x21, &Wire);
}

void scanBarcodeFromSerial() {
  scannedBarcode = Serial2.readStringUntil('\r');
  Serial.println("barcode : " + scannedBarcode);
}

int readDistanceSensor() {
  int measuredDistance = sonar.ping_cm();
  if (measuredDistance == 0) return MAX_DISTANCE;
  else return measuredDistance;
}

void printCurrentDistance() {
  Serial.print("Distance Sensor : ");
  Serial.print(currentDistance);
  Serial.println(" cm\t");
}

void initializeKeypad() {

  if (keyPad.begin() == false) {
    Serial.println("\nERROR: cannot communicate to keypad.\nPlease reboot.\n");
    while (1)
      ;
  }

  keyPad.loadKeyMap(keymap);
}

void processKeypadInput() {
  if (keyPad.isPressed()) {
    char keyInput = keyPad.getChar();
    if (keyInput != 'F' && keyInput != 'N')
      Serial.println(keyInput);
  }
}

void processSerialCommands() {
  if (Serial.available()) {
    serialInput = Serial.readStringUntil('\n');
    Serial.println(serialInput);
    playAudioCommand(serialInput);
  }
  if (serialInput == "r") ESP.restart();
  else if (serialInput == "o1") lokerControlCommands[0] = "buka";
  else if (serialInput == "c1") lokerControlCommands[0] = "tutup";
  else if (serialInput == "o2") lokerControlCommands[1] = "buka";
  else if (serialInput == "c2") lokerControlCommands[1] = "tutup";
  else if (serialInput == "o3") lokerControlCommands[2] = "buka";
  else if (serialInput == "c3") lokerControlCommands[2] = "tutup";
  else if (serialInput == "o4") lokerControlCommands[3] = "buka";
  else if (serialInput == "c4") lokerControlCommands[3] = "tutup";
  else if (serialInput == "o5") lokerControlCommands[4] = "buka";
  else if (serialInput == "c5") lokerControlCommands[4] = "tutup";
  else if (serialInput == "ot") mainDoorControl = "buka";
  else if (serialInput == "ct") mainDoorControl = "tutup";
  else if (serialInput == "st") mainDoorControl = "stop";
  else if (serialInput == "or") relayControlCommand = "buka";
  else if (serialInput == "cr") relayControlCommand = "tutup";
}

void readLimitSwitches() {
  entrySwitches[0] = !pcfEntryInput.digitalRead(5);
  entrySwitches[1] = !pcfEntryInput.digitalRead(1);
  entrySwitches[2] = !pcfEntryInput.digitalRead(2);
  entrySwitches[3] = !pcfEntryInput.digitalRead(3);
  entrySwitches[4] = !pcfEntryInput.digitalRead(4);
  entrySwitches[5] = !pcfEntryInput.digitalRead(6);
  exitSwitches[0] = !pcfExitOutput.digitalRead(5);
  exitSwitches[1] = !pcfExitOutput.digitalRead(1);
  exitSwitches[2] = !pcfExitOutput.digitalRead(2);
  exitSwitches[3] = !pcfExitOutput.digitalRead(3);
  exitSwitches[4] = !pcfExitOutput.digitalRead(4);
  exitSwitches[5] = !pcfExitOutput.digitalRead(6);
  //  sprintf(buff , "%d%d%d%d%d | %d%d%d%d%d\n" , entrySwitches[0] ,entrySwitches[1] , entrySwitches[2] , entrySwitches[3] , entrySwitches[4] , exitSwitches[0] ,exitSwitches[1] , exitSwitches[2] , exitSwitches[3] , exitSwitches[4]  );
  //  sprintf(buff , "%d | %d\n" , entrySwitches[5]  , exitSwitches[5] );
  //  Serial.print(buff);
}