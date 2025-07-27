void setupSensor() {
  Wire.begin();
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67);
  pcfIn.begin(0x20, &Wire);
  pcfOut.begin(0x21, &Wire);
}

void readBarcode() {
  barcode = Serial2.readStringUntil('\r');
  Serial.println("barcode : " + barcode);
}

int readJarak() {
  int measure = sonar.ping_cm();
  if (measure == 0) return MAX_DISTANCE;
  else return measure;
}

void printJarak() {
  Serial.print("Jarak Sensor : ");
  Serial.print(jarak);
  Serial.println(" cm\t");
}

void setupKeypad() {

  if (keyPad.begin() == false) {
    Serial.println("\nERROR: cannot communicate to keypad.\nPlease reboot.\n");
    while (1)
      ;
  }

  keyPad.loadKeyMap(keymap);
}

void readKeypad() {
  if (keyPad.isPressed()) {
    char input = keyPad.getChar();
    if (input != 'F' && input != 'N')
      Serial.println(input);
  }
}

void command() {
  if (Serial.available()) {
    input = Serial.readStringUntil('\n');
    Serial.println(input);
    speak(input);
  }
  if (input == "r") ESP.restart();
  else if (input == "o1") controlLoker[0] = "buka";
  else if (input == "c1") controlLoker[0] = "tutup";
  else if (input == "o2") controlLoker[1] = "buka";
  else if (input == "c2") controlLoker[1] = "tutup";
  else if (input == "o3") controlLoker[2] = "buka";
  else if (input == "c3") controlLoker[2] = "tutup";
  else if (input == "o4") controlLoker[3] = "buka";
  else if (input == "c4") controlLoker[3] = "tutup";
  else if (input == "o5") controlLoker[4] = "buka";
  else if (input == "c5") controlLoker[4] = "tutup";
  else if (input == "ot") controlTutup = "buka";
  else if (input == "ct") controlTutup = "tutup";
  else if (input == "st") controlTutup = "stop";
  else if (input == "or") controlRelay = "buka";
  else if (input == "cr") controlRelay = "tutup";
}

void readLimit() {
  limitMasuk[0] = !pcfIn.digitalRead(5);
  limitMasuk[1] = !pcfIn.digitalRead(1);
  limitMasuk[2] = !pcfIn.digitalRead(2);
  limitMasuk[3] = !pcfIn.digitalRead(3);
  limitMasuk[4] = !pcfIn.digitalRead(4);
  limitMasuk[5] = !pcfIn.digitalRead(6);
  limitKeluar[0] = !pcfOut.digitalRead(5);
  limitKeluar[1] = !pcfOut.digitalRead(1);
  limitKeluar[2] = !pcfOut.digitalRead(2);
  limitKeluar[3] = !pcfOut.digitalRead(3);
  limitKeluar[4] = !pcfOut.digitalRead(4);
  limitKeluar[5] = !pcfOut.digitalRead(6);
  //  sprintf(buff , "%d%d%d%d%d | %d%d%d%d%d\n" , limitMasuk[0] ,limitMasuk[1] , limitMasuk[2] , limitMasuk[3] , limitMasuk[4] , limitKeluar[0] ,limitKeluar[1] , limitKeluar[2] , limitKeluar[3] , limitKeluar[4]  );
  //  sprintf(buff , "%d | %d\n" , limitMasuk[5]  , limitKeluar[5] );
  //  Serial.print(buff);
}