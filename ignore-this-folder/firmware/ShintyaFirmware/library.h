#define ENABLE_USER_AUTH
#define ENABLE_FIRESTORE

#include <FirebaseClient.h>
#include "ExampleFunctions.h"
#include <LiquidCrystal_I2C.h>
#include <NewPing.h>
#include <Adafruit_PCF8574.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <I2CKeyPad.h>
#include "DFRobotDFPlayerMini.h"
#include <ArduinoJson.h>

//=========================== LCD ============================
LiquidCrystal_I2C lcd(0x27, 20, 4);
char buff[100];

//==========================UltraSonik==========================
// Definisikan pin sensor ultrasonik
#define SONAR_ECHO_PIN 32
#define SONAR_TRIG_PIN 33
#define MAX_DISTANCE 45
NewPing sonar(SONAR_TRIG_PIN, SONAR_ECHO_PIN, MAX_DISTANCE);
int jarak = 0;
unsigned long prevJarak = 0;  // Waktu sebelumnya

//==============GM67=================================
#define RX_GM67 26
#define TX_GM67 25
String barcode = "||||||||||||||||||||";
#define barcodeReady Serial2.available()
bool barcodeBaru = false;

#define maxPaket 30



//===================limit switch =======================
String input;
bool limitMasuk[6];
bool limitKeluar[6];


String controlLoker[5] = {
  "tutup",
  "tutup",
  "tutup",
  "tutup",
  "tutup"
};

String controlTutup = "";

Adafruit_PCF8574 pcfIn, pcfOut;


//=================== keypad =======================

const uint8_t KEYPAD_ADDRESS = 0x22;

I2CKeyPad keyPad(KEYPAD_ADDRESS);

char keymap[19] = "147*2580369#ABCDNF";  // N = NoKey, F = Fail



//================== pca =====================

Adafruit_PWMServoDriver servo = Adafruit_PWMServoDriver(0x40);
#define SERVOMIN 125  // this is the 'minimum' pulse length count (out of 4096)
#define SERVOMAX 575  // this is the 'maximum' pulse length count (out of 4096)

int servoNumber = 0;

//====================== relay ===================================

#define selPin 27
String controlRelay = "buka";

// =================== Speaker ===================================


DFRobotDFPlayerMini myDFPlayer;

#define txSpeaker 17
#define rxSpeaker 16

enum sound {
  soundResiCocok = 1,
  soundLoker1Terbuka = 2,
  soundLoker1Tertutup = 3,
  soundLoker2Terbuka = 4,
  soundLoker2Tertutup = 5,
  soundLoker3Terbuka = 6,
  soundLoker3Tertutup = 7,
  soundLoker4Terbuka = 8,
  soundLoker4Tertutup = 9,
  soundLoker5Terbuka = 10,
  soundLoker5Tertutup = 11,
  soundInputResi = 14,
  soundScanResi = 15,
  soundTerimaKasih = 16,
  soundResiTidakCocok = 17,
  soundJudul = 18,
  soundCekResi = 24,
  soundPilihMetode = 25,
  soundPilihKurir = 26

};

#define VOLUME 30  // 0 - 30

// ================ button ====================================
#define button1pin 39
#define button2pin 36

#define button1 !digitalRead(button1pin)
#define button2 !digitalRead(button2pin)

//=========================== Network ============================

// #define API_KEY "AIzaSyB4PmCYIVRoEirYUbVo-7fmKxi4T8025L8"
// #define DATABASE_URL "https://milinda-6552a-default-rtdb.firebaseio.com/"
// #define USER_EMAIL "admin@gmail.com"
// #define USER_PASSWORD "admin123"
// #define WIFI_SSID "TIMEOSPACE"
// #define WIFI_PASSWORD "1234Saja"



// // void processData(AsyncResult &aResult);
// // void create_document_await(const String &documentPath, Document<Values::Value> &doc);
// // void get_document_async(const String &documentPath, const GetDocumentOptions &options);
// // void get_document_async2(const String &documentPath, const GetDocumentOptions &options);
// // void get_document_await(const String &documentPath, const GetDocumentOptions &options);

// SSL_CLIENT ssl_client;

// using AsyncClient = AsyncClientClass;
// AsyncClient aClient(ssl_client);

// UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD, 3000 /* expire period in seconds (<3600) */);
// FirebaseApp app;
// Firestore::Documents Docs;

// AsyncResult firestoreResult;

//////////////////////////////////////////////////
#define WIFI_SSID "zainul"
#define WIFI_PASSWORD "12345678"

#define API_KEY "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU"
#define USER_EMAIL "user1@gmail.com"
#define USER_PASSWORD "admin123"
#define FIREBASE_PROJECT_ID "alien-outrider-453003-g8"

SSL_CLIENT ssl_client;

using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);

UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD, 3000 /* expire period in seconds (<3600) */);
FirebaseApp app;

Firestore::Documents Docs;
AsyncResult firestoreResult;

JsonDocument usersDocument;
JsonDocument receiptsDocument;
JsonDocument lokerControlDocument;

struct UsersTypedef {
  String email;
  String nama;
};

struct RececiptsTypedef {
  String nama;
  String noResi;
  int nomorLoker;
  String status;
  String tipePaket;
  String userEmail;
};

struct dataPaket {
  String resi;
  String type;
  int loker;
} paket[maxPaket];

struct LokerControlTypedef {
  int nomorLoker;
  int buka;
  int tutup;
};

const int MAX_USERS = 20;
const int MAX_RECEIPTS = 30;
const int MAX_LOKER_CONTROL = 5;

UsersTypedef users[MAX_USERS];
RececiptsTypedef receipts[MAX_RECEIPTS];
LokerControlTypedef lokerControl[MAX_LOKER_CONTROL];

#define maxUser 10
char isUserDitemukan = false, isQRDitemukan = false;

String userEmail[maxUser] = {
  "",
  "pwshintya@gmail.com",
  "putri@gmail.com",
  "wijaya@gmail.com",
  "user1@gmail.com",
  "user2@gmail.com",
  "",
  "",
  "",
  ""

};
