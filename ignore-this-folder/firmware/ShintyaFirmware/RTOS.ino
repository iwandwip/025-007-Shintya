void TaskDatabase(void *pvParameters) {
  initializeNetworkConnection();
  initializeFirebaseDatabase();
  while (true) {
    updateDatabaseData();
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}

void TaskControl(void *pvParameters) {
  initializeAudioSystem();
  initializeLCDDisplay();
  initializeSensors();
  initializeServoController();
  initializeKeypad();
  initializeRelay();
  initializeButtons();
  playAudioCommand(String(soundPilihMetode));
  initializeDummyPackages();
  while (true) {
    // updateDataResi();
    // displayData();
    // readKeypad();
    readLimitSwitches();
    controlAllLokers();
    controlMainDoor();
    controlRelayOutput();
    processRemoteLokerCommands();
    menu();
    // readButton();
    currentDistance = readDistanceSensor();
    // printJarak();

    processSerialCommands();
    // vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}







TaskHandle_t DatabaseHandle;
TaskHandle_t ControlHandle;

// Initialize RTOS tasks
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