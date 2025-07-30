void TaskDatabase(void *pvParameters) {
  setupNetwork();
  setupDatabase();
  while (true) {
    updateData();
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}

void TaskControl(void *pvParameters) {
  setupSpeaker();
  setupDisplay();
  setupSensor();
  setupServo();
  setupKeypad();
  setupRelay();
  setupButton();
  speak(String(soundPilihMetode));
  setupDummyPaket();
  while (true) {
    // updateDataResi();
    // displayData();
    // readKeypad();
    readLimit();
    lokerController();
    tutupController();
    relayController();
    lokerControllerFromDB();
    menu();
    // readButton();
    jarak = readJarak();
    // printJarak();

    command();
    // vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}







TaskHandle_t DatabaseHandle;
TaskHandle_t ControlHandle;

// Fungsi setup RTOS
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
    1,               // Prioritas task (2 adalah prioritas menengah)
    &ControlHandle,  // Handle untuk task
    1                // Core 1
  );


  Serial.println("Setup RTOS Finish !!");
}