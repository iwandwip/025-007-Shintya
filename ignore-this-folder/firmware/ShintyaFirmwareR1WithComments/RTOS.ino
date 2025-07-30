/**
 * @brief Task RTOS untuk mengelola operasi database Firebase.
 * 
 * Task ini bertanggung jawab untuk menginisialisasi koneksi jaringan dan Firebase,
 * serta secara berkala memperbarui data dari database Firebase.
 * 
 * @param pvParameters Parameter yang diteruskan ke task (tidak digunakan dalam kasus ini).
 */
void TaskDatabase(void *pvParameters) {
  initializeNetworkConnection();  // Inisialisasi koneksi jaringan
  initializeFirebaseDatabase();   // Inisialisasi database Firebase
  while (true) {
    updateDatabaseData();                   // Perbarui data dari database
    vTaskDelay(2000 / portTICK_PERIOD_MS);  // Tunda selama 2 detik
  }
}

/**
 * @brief Task RTOS untuk mengelola kontrol hardware dan antarmuka pengguna.
 * 
 * Task ini menginisialisasi semua sensor, aktuator, display, dan sistem audio.
 * Ini juga menangani logika menu, pembacaan sensor, dan pemrosesan perintah serial.
 * 
 * @param pvParameters Parameter yang diteruskan ke task (tidak digunakan dalam kasus ini).
 */
void TaskControl(void *pvParameters) {
  initializeAudioSystem();                     // Inisialisasi sistem audio
  initializeLCDDisplay();                      // Inisialisasi layar LCD
  initializeSensors();                         // Inisialisasi semua sensor
  initializeServoController();                 // Inisialisasi kontroler servo
  initializeKeypad();                          // Inisialisasi keypad
  initializeRelay();                           // Inisialisasi relay
  initializeButtons();                         // Inisialisasi tombol
  playAudioCommand(String(soundPilihMetode));  // Putar audio "Pilih Metode"
  initializeDummyPackages();                   // Inisialisasi data paket dummy
  while (true) {
    // updateDataResi(); // Contoh: memperbarui data resi (dikomentari)
    // displayData();    // Contoh: menampilkan data (dikomentari)
    // readKeypad();     // Contoh: membaca keypad (dikomentari)
    readLimitSwitches();           // Baca status limit switch
    controlAllLokers();            // Kontrol semua loker
    controlMainDoor();             // Kontrol pintu utama
    controlRelayOutput();          // Kontrol output relay
    processRemoteLokerCommands();  // Proses perintah loker jarak jauh
    menu();                        // Jalankan logika menu
    // readButton();     // Contoh: membaca tombol (dikomentari)
    currentDistance = readDistanceSensor();  // Baca jarak dari sensor ultrasonik
    // printJarak();     // Contoh: mencetak jarak (dikomentari)

    processSerialCommands();  // Proses perintah serial
    // vTaskDelay(1000 / portTICK_PERIOD_MS); // Contoh: tunda 1 detik (dikomentari)
  }
}

// Handle untuk task Database
TaskHandle_t DatabaseHandle;
// Handle untuk task Control
TaskHandle_t ControlHandle;

/**
 * @brief Mengatur dan membuat task RTOS.
 * 
 * Fungsi ini membuat dua task RTOS: `TaskDatabase` yang berjalan di Core 0
 * untuk operasi database, dan `TaskControl` yang berjalan di Core 1
 * untuk kontrol hardware dan antarmuka pengguna.
 */
void setupRTOS() {
  // Membuat task untuk Database Firebase di Core 0
  xTaskCreatePinnedToCore(
    TaskDatabase,     // Nama fungsi task
    "TaskDatabase",   // Nama task
    10000,            // Ukuran stack (10KB)
    NULL,             // Parameter untuk task (NULL jika tidak ada)
    1,                // Prioritas task (1 adalah prioritas rendah)
    &DatabaseHandle,  // Handle untuk task
    0                 // Core 0
  );

  // Membuat task untuk Control Pin di Core 1
  xTaskCreatePinnedToCore(
    TaskControl,     // Nama fungsi task
    "TaskControl",   // Nama task
    10000,           // Ukuran stack (10KB) untuk kontrol pin
    NULL,            // Parameter untuk task (NULL jika tidak ada)
    1,               // Prioritas task (1 adalah prioritas rendah)
    &ControlHandle,  // Handle untuk task
    1                // Core 1
  );


  Serial.println("Setup RTOS Finish !!");  // Cetak pesan bahwa setup RTOS selesai
}