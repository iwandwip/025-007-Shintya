
void setupNetwork() {
  // Mulai koneksi ke Wi-Fi
  Serial.println("Connecting to WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Tunggu sampai terhubung
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);  // Tunggu 1 detik
    Serial.print(".");
  }

  // Jika berhasil terhubung, tampilkan IP Address
  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setupDatabase() {
  Firebase.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  set_ssl_client_insecure_and_buffer(ssl_client);

  Serial.println("Initializing app...");
  // initializeApp(aClient, app, getAuth(user_auth), auth_debug_print, "🔐 authTask");

  // Or intialize the app and wait.
  initializeApp(aClient, app, getAuth(user_auth), 120 * 1000, auth_debug_print);

  Serial.println("Initializing app finish!!");
  app.getApp<Firestore::Documents>(Docs);
}



void updateData() {
  // To maintain the authentication and async tasks
  app.loop();

  static uint32_t firestoreTimer;
  if (millis() - firestoreTimer >= 5000 && app.ready()) {
    firestoreTimer = millis();

    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));

    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);

    // serializeJsonPretty(usersDocument, Serial);
    // serializeJsonPretty(receiptsDocument, Serial);
    // serializeJsonPretty(lokerControlDocument, Serial);

    int userIndex = 0;
    int receiptIndex = 0;
    int lokerControlIndex = 0;

    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (userIndex < MAX_USERS) {
        users[userIndex].email = obj["fields"]["email"]["stringValue"].as<String>();
        users[userIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
      }
      userIndex++;
    }

    for (JsonVariant v : receiptsDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (receiptIndex < MAX_RECEIPTS) {
        receipts[receiptIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
        receipts[receiptIndex].noResi = obj["fields"]["noResi"]["stringValue"].as<String>();
        receipts[receiptIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        receipts[receiptIndex].status = obj["fields"]["status"]["stringValue"].as<String>();
        receipts[receiptIndex].tipePaket = obj["fields"]["tipePaket"]["stringValue"].as<String>();
        receipts[receiptIndex].userEmail = obj["fields"]["userEmail"]["stringValue"].as<String>();
      }
      receiptIndex++;
    }

    for (JsonVariant v : lokerControlDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (lokerControlIndex < MAX_LOKER_CONTROL) {
        lokerControl[lokerControlIndex].nomorLoker = obj["fields"]["nomorLoker"]["integerValue"].as<int>();
        lokerControl[lokerControlIndex].buka = obj["fields"]["buka"]["integerValue"].as<int>();
        lokerControl[lokerControlIndex].tutup = obj["fields"]["tutup"]["integerValue"].as<int>();
      }
      lokerControlIndex++;
    }
  }
}



void updateDataResi() {
  if (app.ready()) {
    for (int i = 0; i <= maxPaket; i++) {
      // paket[i].resi = receipts[i].noResi;
      // paket[i].type = receipts[i].tipePaket;
      // if (paket[i].type == "COD") paket[i].loker = receipts[i].nomorLoker;
    }
  }
}

void setupDummyPaket() {
  paket[0].resi = "004420188204";
  paket[0].loker = 1;
  paket[0].type = "COD";
  paket[1].resi = "SPXID04700838417A";
  paket[1].loker = 2;
  paket[1].type = "COD";
  paket[2].resi = "11002158312640";
  paket[2].loker = 3;
  paket[2].type = "COD";
  paket[3].resi = "SPXID050573568463";
  paket[3].loker = 4;
  paket[3].type = "COD";
  paket[4].resi = "JD0441796666";
  paket[4].loker = 5;
  paket[4].type = "NON-COD";
  paket[5].resi = "SPXID045314957071";
  paket[5].type = "COD";
  paket[5].loker = 1;
}