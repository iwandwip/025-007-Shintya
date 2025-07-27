/**
 * @brief Menginisialisasi semua sensor yang terhubung.
 *
 * Fungsi ini memulai komunikasi Wire (I2C), Serial2 untuk barcode scanner,
 * dan menginisialisasi expander I/O PCF8574 untuk limit switch.
 */
void initializeSensors() {
  Wire.begin(); // Memulai komunikasi I2C
  Serial2.begin(9600, SERIAL_8N1, RX_GM67, TX_GM67); // Memulai komunikasi serial untuk barcode scanner
  pcfEntryInput.begin(0x20, &Wire); // Inisialisasi PCF8574 untuk limit switch masuk (alamat 0x20)
  pcfExitOutput.begin(0x21, &Wire);  // Inisialisasi PCF8574 untuk limit switch keluar (alamat 0x21)
}

/**
 * @brief Memindai barcode dari input serial.
 *
 * Fungsi ini membaca string dari Serial2 hingga karakter carriage return
 * dan menyimpannya ke variabel `scannedBarcode`. Hasilnya juga dicetak ke Serial.
 */
void scanBarcodeFromSerial() {
  scannedBarcode = Serial2.readStringUntil('\r'); // Membaca string barcode
  Serial.println("barcode : " + scannedBarcode); // Mencetak barcode ke Serial
}

/**
 * @brief Membaca jarak dari sensor ultrasonik.
 *
 * Fungsi ini melakukan ping pada sensor ultrasonik dan mengembalikan jarak
 * dalam sentimeter. Jika jarak yang terukur adalah 0 (di luar jangkauan),
 * maka akan mengembalikan nilai `MAX_DISTANCE`.
 *
 * @return Jarak terukur dalam sentimeter atau `MAX_DISTANCE` jika 0.
 */
int readDistanceSensor() {
  int measuredDistance = sonar.ping_cm(); // Mengukur jarak dalam cm
  if (measuredDistance == 0) return MAX_DISTANCE; // Jika 0, kembalikan MAX_DISTANCE
  else return measuredDistance; // Kembalikan jarak terukur
}

/**
 * @brief Mencetak jarak saat ini dari sensor ultrasonik ke Serial Monitor.
 */
void printCurrentDistance() {
  Serial.print("Distance Sensor : "); // Mencetak label
  Serial.print(currentDistance);      // Mencetak jarak saat ini
  Serial.println(" cm\t");             // Mencetak satuan dan tab
}

/**
 * @brief Menginisialisasi keypad I2C.
 *
 * Fungsi ini memulai komunikasi dengan keypad. Jika inisialisasi gagal,
 * program akan berhenti dan mencetak pesan error.
 */
void initializeKeypad() {
  if (keyPad.begin() == false) {
    Serial.println("\nERROR: cannot communicate to keypad.\nPlease reboot.\n"); // Pesan error
    while (1) // Loop tak terbatas
      ;
  }
  keyPad.loadKeyMap(keymap); // Memuat peta kunci untuk keypad
}

/**
 * @brief Memproses input dari keypad.
 *
 * Fungsi ini memeriksa apakah ada tombol yang ditekan pada keypad.
 * Jika ada, karakter tombol akan dicetak ke Serial Monitor, kecuali
 * jika itu adalah karakter 'F' (Fail) atau 'N' (NoKey).
 */
void processKeypadInput() {
  if (keyPad.isPressed()) {
    char keyInput = keyPad.getChar(); // Membaca karakter tombol yang ditekan
    if (keyInput != 'F' && keyInput != 'N') // Jika bukan 'F' atau 'N'
      Serial.println(keyInput); // Cetak karakter tombol
  }
}

/**
 * @brief Memproses perintah yang diterima melalui Serial Monitor.
 *
 * Fungsi ini membaca string dari Serial Monitor dan memprosesnya sebagai perintah.
 * Perintah yang didukung meliputi restart ESP32, kontrol loker, kontrol pintu utama,
 * dan kontrol relay.
 */
void processSerialCommands() {
  if (Serial.available()) {
    serialInput = Serial.readStringUntil('\n'); // Membaca string perintah
    Serial.println(serialInput); // Mencetak perintah yang diterima
    playAudioCommand(serialInput); // Memutar audio berdasarkan perintah (jika berlaku)
  }
  // Logika untuk berbagai perintah serial
  if (serialInput == "r") ESP.restart(); // Restart ESP32
  else if (serialInput == "o1") lokerControlCommands[0] = "buka"; // Buka loker 1
  else if (serialInput == "c1") lokerControlCommands[0] = "tutup"; // Tutup loker 1
  else if (serialInput == "o2") lokerControlCommands[1] = "buka"; // Buka loker 2
  else if (serialInput == "c2") lokerControlCommands[1] = "tutup"; // Tutup loker 2
  else if (serialInput == "o3") lokerControlCommands[2] = "buka"; // Buka loker 3
  else if (serialInput == "c3") lokerControlCommands[2] = "tutup"; // Tutup loker 3
  else if (serialInput == "o4") lokerControlCommands[3] = "buka"; // Buka loker 4
  else if (serialInput == "c4") lokerControlCommands[3] = "tutup"; // Tutup loker 4
  else if (serialInput == "o5") lokerControlCommands[4] = "buka"; // Buka loker 5
  else if (serialInput == "c5") lokerControlCommands[4] = "tutup"; // Tutup loker 5
  else if (serialInput == "ot") mainDoorControl = "buka"; // Buka pintu utama
  else if (serialInput == "ct") mainDoorControl = "tutup"; // Tutup pintu utama
  else if (serialInput == "st") mainDoorControl = "stop"; // Hentikan pintu utama
  else if (serialInput == "or") relayControlCommand = "buka"; // Buka relay
  else if (serialInput == "cr") relayControlCommand = "tutup"; // Tutup relay
}

/**
 * @brief Membaca status semua limit switch.
 *
 * Fungsi ini membaca status digital dari limit switch masuk dan keluar
 * menggunakan expander I/O PCF8574 dan menyimpannya ke dalam array boolean
 * `entrySwitches` dan `exitSwitches`.
 */
void readLimitSwitches() {
  // Membaca status limit switch masuk untuk loker 0-4 dan pintu utama (indeks 5)
  entrySwitches[0] = !pcfEntryInput.digitalRead(5);
  entrySwitches[1] = !pcfEntryInput.digitalRead(1);
  entrySwitches[2] = !pcfEntryInput.digitalRead(2);
  entrySwitches[3] = !pcfEntryInput.digitalRead(3);
  entrySwitches[4] = !pcfEntryInput.digitalRead(4);
  entrySwitches[5] = !pcfEntryInput.digitalRead(6);
  // Membaca status limit switch keluar untuk loker 0-4 dan pintu utama (indeks 5)
  exitSwitches[0] = !pcfExitOutput.digitalRead(5);
  exitSwitches[1] = !pcfExitOutput.digitalRead(1);
  exitSwitches[2] = !pcfExitOutput.digitalRead(2);
  exitSwitches[3] = !pcfExitOutput.digitalRead(3);
  exitSwitches[4] = !pcfExitOutput.digitalRead(4);
  exitSwitches[5] = !pcfExitOutput.digitalRead(6);
  //  sprintf(buff , "%d%d%d%d%d | %d%d%d%d%d\n" , entrySwitches[0] ,entrySwitches[1] , entrySwitches[2] , entrySwitches[3] , entrySwitches[4] , exitSwitches[0] ,exitSwitches[1] , exitSwitches[2] , exitSwitches[3] , exitSwitches[4]  ); // Contoh: mencetak status limit switch (dikomentari)
  //  sprintf(buff , "%d | %d\n" , entrySwitches[5]  , exitSwitches[5] ); // Contoh: mencetak status limit switch pintu utama (dikomentari)
  //  Serial.print(buff); // Contoh: mencetak buffer (dikomentari)
}