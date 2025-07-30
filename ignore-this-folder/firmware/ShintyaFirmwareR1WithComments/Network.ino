
/**
 * @brief Menginisialisasi koneksi Wi-Fi.
 * 
 * Fungsi ini mencoba untuk terhubung ke jaringan Wi-Fi yang ditentukan
 * menggunakan SSID dan kata sandi yang telah didefinisikan. Ini akan
 * terus mencoba hingga koneksi berhasil dan kemudian mencetak alamat IP lokal.
 */
void initializeNetworkConnection() {
  // Memulai koneksi Wi-Fi
  Serial.println("Connecting to WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Tunggu hingga terhubung
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);  // Tunggu 1 detik
    Serial.print(".");
  }

  // Jika berhasil terhubung, tampilkan Alamat IP
  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

/**
 * @brief Menginisialisasi koneksi ke Firebase Firestore.
 * 
 * Fungsi ini mengatur klien SSL, menginisialisasi aplikasi Firebase,
 * dan menyiapkan objek Firestore::Documents untuk interaksi database.
 */
void initializeFirebaseDatabase() {
  Firebase.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  // Mengatur klien SSL agar tidak aman (untuk pengembangan, tidak disarankan untuk produksi)
  set_ssl_client_insecure_and_buffer(ssl_client);

  Serial.println("Initializing app...");
  // initializeApp(aClient, app, getAuth(user_auth), auth_debug_print, "🔐 authTask");

  // Atau inisialisasi aplikasi dan tunggu.
  initializeApp(aClient, app, getAuth(user_auth), 120 * 1000, auth_debug_print);

  Serial.println("Initializing app finish!!");
  // Mendapatkan instance Firestore::Documents dari aplikasi Firebase
  app.getApp<Firestore::Documents>(Docs);
}

/**
 * @brief Memperbarui data dari Firebase Firestore.
 * 
 * Fungsi ini secara berkala mengambil data dari koleksi 'users', 'receipts',
 * dan 'lokerControl' di Firestore, kemudian mendeserialisasikannya ke dalam
 * struktur data lokal yang sesuai.
 */
void updateDatabaseData() {
  // Untuk menjaga otentikasi dan tugas asinkron
  app.loop();

  static uint32_t firestoreUpdateTimer;  // Timer untuk pembaruan Firestore
  // Perbarui setiap 5 detik jika aplikasi siap
  if (millis() - firestoreUpdateTimer >= 5000 && app.ready()) {
    firestoreUpdateTimer = millis();

    // Mengambil payload JSON dari koleksi 'users', 'receipts', dan 'lokerControl'
    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));

    // Mendeserialisasikan payload JSON ke dalam objek JsonDocument
    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);

    // serializeJsonPretty(usersDocument, Serial); // Contoh: mencetak JSON pengguna (dikomentari)
    // serializeJsonPretty(receiptsDocument, Serial); // Contoh: mencetak JSON resi (dikomentari)
    // serializeJsonPretty(lokerControlDocument, Serial); // Contoh: mencetak JSON kontrol loker (dikomentari)

    int currentUserIndex = 0;
    int currentReceiptIndex = 0;
    int currentLokerControlIndex = 0;

    // Memproses data pengguna dari dokumen JSON
    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentUserIndex < MAX_USERS) {
        users[currentUserIndex].email = obj["fields"]["email"]["stringValue"].as<String>();
        users[currentUserIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
      }
      currentUserIndex++;
    }

    // Memproses data resi dari dokumen JSON
    for (JsonVariant v : receiptsDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentReceiptIndex < MAX_RECEIPTS) {
        receipts[currentReceiptIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].noResi = obj["fields"]["noResi"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        receipts[currentReceiptIndex].status = obj["fields"]["status"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].tipePaket = obj["fields"]["tipePaket"]["stringValue"].as<String>();
        receipts[currentReceiptIndex].userEmail = obj["fields"]["userEmail"]["stringValue"].as<String>();
      }
      currentReceiptIndex++;
    }

    // Memproses data kontrol loker dari dokumen JSON
    for (JsonVariant v : lokerControlDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentLokerControlIndex < MAX_LOKER_CONTROL) {
        lokerControl[currentLokerControlIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        lokerControl[currentLokerControlIndex].buka = obj["fields"]["buka"]["integerValue"].as<int>();
        lokerControl[currentLokerControlIndex].tutup = obj["fields"]["tutup"]["integerValue"].as<int>();
      }
      currentLokerControlIndex++;
    }
  }
}

/**
 * @brief Memperbarui data pelacakan (tracking) paket.
 * 
 * Fungsi ini adalah placeholder untuk memperbarui data pelacakan paket
 * berdasarkan informasi dari database. Saat ini, bagian ini dikomentari.
 */
void updateTrackingData() {
  if (app.ready()) {
    for (int i = 0; i <= MAX_PACKAGES; i++) {
      // packageDatabase[i].trackingNumber = receipts[i].noResi;
      // packageDatabase[i].packageType = receipts[i].tipePaket;
      // if (packageDatabase[i].packageType == "COD") packageDatabase[i].assignedLoker = receipts[i].nomorLoker;
    }
  }
}

/**
 * @brief Menginisialisasi data paket dummy.
 * 
 * Fungsi ini mengisi array `packageDatabase` dengan data paket contoh
 * untuk tujuan pengujian atau demonstrasi.
 */
void initializeDummyPackages() {
  packageDatabase[0].trackingNumber = "004420188204";
  packageDatabase[0].assignedLoker = 1;
  packageDatabase[0].packageType = "COD";
  packageDatabase[1].trackingNumber = "SPXID04700838417A";
  packageDatabase[1].assignedLoker = 2;
  packageDatabase[1].packageType = "COD";
  packageDatabase[2].trackingNumber = "11002158312640";
  packageDatabase[2].assignedLoker = 3;
  packageDatabase[2].packageType = "COD";
  packageDatabase[3].trackingNumber = "SPXID050573568463";
  packageDatabase[3].assignedLoker = 4;
  packageDatabase[3].packageType = "COD";
  packageDatabase[4].trackingNumber = "JD0441796666";
  packageDatabase[4].assignedLoker = 5;
  packageDatabase[4].packageType = "NON-COD";
  packageDatabase[5].trackingNumber = "SPXID045314957071";
  packageDatabase[5].packageType = "COD";
  packageDatabase[5].assignedLoker = 1;
}