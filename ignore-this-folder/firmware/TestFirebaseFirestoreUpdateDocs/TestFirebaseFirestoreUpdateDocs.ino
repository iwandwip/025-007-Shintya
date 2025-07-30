#include <Arduino.h>
#include <FirebaseClient.h>
#include "ExampleFunctions.h"  // Provides the functions used in the examples.

#define WIFI_SSID "TIMEOSPACE"
#define WIFI_PASSWORD "1234Saja"

#define API_KEY "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU"
#define USER_EMAIL "user1@gmail.com"
#define USER_PASSWORD "admin123"
#define FIREBASE_PROJECT_ID "alien-outrider-453003-g8"

SSL_CLIENT ssl_client;

// This uses built-in core WiFi/Ethernet for network connection.
// See examples/App/NetworkInterfaces for more network examples.
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);

UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD, 3000 /* expire period in seconds (<3600) */);
FirebaseApp app;

Firestore::Documents Docs;
AsyncResult firestoreResult;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  Firebase.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  set_ssl_client_insecure_and_buffer(ssl_client);

  Serial.println("Initializing app...");
  initializeApp(aClient, app, getAuth(user_auth), auth_debug_print, "🔐 authTask");

  // Or intialize the app and wait.
  // initializeApp(aClient, app, getAuth(user_auth), 120 * 1000, auth_debug_print);

  app.getApp<Firestore::Documents>(Docs);
}

void loop() {
  // To maintain the authentication and async tasks
  app.loop();
  if (Serial.available()) {
    int val = Serial.readStringUntil('\n').toInt();
    Values::IntegerValue percentageV(val);

    Document<Values::Value> doc("percentage", Values::Value(percentageV));
    PatchDocumentOptions patchOptions(DocumentMask("percentage") /* updateMask */, DocumentMask() /* mask */, Precondition() /* precondition */);

    String payload = Docs.patch(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), "capacity/box_sensor", patchOptions, doc);
    if (aClient.lastError().code() == 0)
      Serial.println(payload);
    else
      Firebase.printf("Error, msg: %s, code: %d\n", aClient.lastError().message().c_str(), aClient.lastError().code());
  }
}