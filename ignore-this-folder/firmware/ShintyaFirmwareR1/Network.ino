
void initializeNetworkConnection() {
  // Start Wi-Fi connection
  Serial.println("Connecting to WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait until connected
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);  // Wait 1 second
    Serial.print(".");
  }

  // If successfully connected, display IP Address
  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void initializeFirebaseDatabase() {
  Firebase.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  set_ssl_client_insecure_and_buffer(ssl_client);

  Serial.println("Initializing app...");
  // initializeApp(aClient, app, getAuth(user_auth), auth_debug_print, "🔐 authTask");

  // Or intialize the app and wait.
  initializeApp(aClient, app, getAuth(user_auth), 120 * 1000, auth_debug_print);

  Serial.println("Initializing app finish!!");
  app.getApp<Firestore::Documents>(Docs);
}



void updateDatabaseData() {
  // To maintain the authentication and async tasks
  app.loop();

  static uint32_t firestoreUpdateTimer;
  if (millis() - firestoreUpdateTimer >= 5000 && app.ready()) {
    firestoreUpdateTimer = millis();

    int heightV = 100 - (currentDistance * 100 / 45);
    Values::IntegerValue percentageV(heightV);

    Document<Values::Value> doc("percentage", Values::Value(percentageV));
    PatchDocumentOptions patchOptions(DocumentMask("percentage"), DocumentMask(), Precondition());

    Docs.patch(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "capacity/box_sensor", patchOptions, doc);

    String usersJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "users", GetDocumentOptions(DocumentMask("")));
    String receiptsJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "receipts", GetDocumentOptions(DocumentMask("")));
    String lokerControlJsonPayload = Docs.get(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "lokerControl", GetDocumentOptions(DocumentMask("")));

    deserializeJson(usersDocument, usersJsonPayload);
    deserializeJson(receiptsDocument, receiptsJsonPayload);
    deserializeJson(lokerControlDocument, lokerControlJsonPayload);

    // serializeJsonPretty(usersDocument, Serial);
    // serializeJsonPretty(receiptsDocument, Serial);
    // serializeJsonPretty(lokerControlDocument, Serial);

    int currentUserIndex = 0;
    int currentReceiptIndex = 0;
    int currentLokerControlIndex = 0;

    for (JsonVariant v : usersDocument["documents"].as<JsonArray>()) {
      JsonObject obj = v.as<JsonObject>();
      if (currentUserIndex < MAX_USERS) {
        users[currentUserIndex].email = obj["fields"]["email"]["stringValue"].as<String>();
        users[currentUserIndex].nama = obj["fields"]["nama"]["stringValue"].as<String>();
      }
      currentUserIndex++;
    }

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



void updateTrackingData() {
  if (app.ready()) {
    for (int i = 0; i <= MAX_PACKAGES; i++) {
      // packageDatabase[i].trackingNumber = receipts[i].noResi;
      // packageDatabase[i].packageType = receipts[i].tipePaket;
      // if (packageDatabase[i].packageType == "COD") packageDatabase[i].assignedLoker = receipts[i].nomorLoker;
    }
  }
}

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