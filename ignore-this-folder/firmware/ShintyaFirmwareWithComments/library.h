// Mengaktifkan otentikasi pengguna
#define ENABLE_USER_AUTH
// Mengaktifkan fungsionalitas Firestore
#define ENABLE_FIRESTORE

// Memasukkan (include) pustaka yang diperlukan
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
// Objek LiquidCrystal_I2C untuk LCD 20x4 dengan alamat I2C 0x27
LiquidCrystal_I2C lcd(0x27, 20, 4);
// Buffer karakter untuk penggunaan umum
char buff[100];

//==========================UltraSonik==========================
// Mendefinisikan pin untuk sensor ultrasonik
#define SONAR_ECHO_PIN 32  // Pin ECHO sensor ultrasonik
#define SONAR_TRIG_PIN 33  // Pin TRIG sensor ultrasonik
#define MAX_DISTANCE 45    // Jarak maksimum yang dapat dideteksi oleh sensor (cm)
// Objek NewPing untuk sensor ultrasonik
NewPing sonar(SONAR_TRIG_PIN, SONAR_ECHO_PIN, MAX_DISTANCE);
// Variabel untuk menyimpan jarak saat ini yang terdeteksi oleh sensor
int currentDistance = 0;
// Variabel untuk menyimpan waktu terakhir pembacaan jarak
unsigned long previousDistanceTime = 0;

//==============GM67=================================
// Mendefinisikan pin RX dan TX untuk modul barcode scanner GM67
#define RX_GM67 26
#define TX_GM67 25
// Variabel untuk menyimpan barcode yang dipindai
String scannedBarcode = "||||||||||||||||||||";
// Makro untuk memeriksa apakah data barcode tersedia di Serial2
#define isBarcodeReady Serial2.available()
// Flag untuk menunjukkan apakah barcode baru telah dipindai
bool isNewBarcodeScanned = false;

// Mendefinisikan jumlah maksimum paket yang dapat ditangani
#define MAX_PACKAGES 30

//===================limit switch =======================
// Variabel untuk menyimpan input serial
String serialInput;
// Array boolean untuk status limit switch masuk (entry)
bool entrySwitches[6];
// Array boolean untuk status limit switch keluar (exit)
bool exitSwitches[6];

// Array string untuk perintah kontrol loker (buka/tutup)
String lokerControlCommands[5] = {
  "tutup",
  "tutup",
  "tutup",
  "tutup",
  "tutup"
};

// Variabel string untuk kontrol pintu utama (buka/tutup)
String mainDoorControl = "";

// Objek Adafruit_PCF8574 untuk expander I/O limit switch masuk dan keluar
Adafruit_PCF8574 pcfEntryInput, pcfExitOutput;

//=================== keypad =======================
// Alamat I2C untuk keypad
const uint8_t KEYPAD_ADDRESS = 0x22;
// Objek I2CKeyPad untuk keypad
I2CKeyPad keyPad(KEYPAD_ADDRESS);
// Peta karakter untuk tombol keypad
char keymap[19] = "147*2580369#ABCDNF";  // N = NoKey, F = Fail

//================== pca =====================
// Objek Adafruit_PWMServoDriver untuk kontrol servo (PCA9685) dengan alamat I2C 0x40
Adafruit_PWMServoDriver servo = Adafruit_PWMServoDriver(0x40);
// Nilai pulse minimum untuk servo (dari 4096)
#define SERVOMIN 125  
// Nilai pulse maksimum untuk servo (dari 4096)
#define SERVOMAX 575  

// Variabel untuk menyimpan nomor servo yang aktif
int activeServoNumber = 0;

//====================== relay ===================================
// Mendefinisikan pin untuk kontrol relay
#define RELAY_SELECT_PIN 27
// Variabel string untuk perintah kontrol relay (buka/tutup)
String relayControlCommand = "buka";

// =================== Speaker ===================================
// Objek DFRobotDFPlayerMini untuk modul pemutar audio
DFRobotDFPlayerMini myDFPlayer;

// Mendefinisikan pin TX dan RX untuk modul speaker
#define SPEAKER_TX_PIN 17
#define SPEAKER_RX_PIN 16

// Enumerasi untuk berbagai suara/audio yang dapat dimainkan
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

// Mendefinisikan volume audio awal (0 - 30)
#define VOLUME 30  

// ================ button ====================================
// Mendefinisikan pin untuk tombol 1 dan tombol 2
#define button1pin 39
#define button2pin 36

// Makro untuk membaca status tombol (aktif LOW)
#define button1 !digitalRead(button1pin)
#define button2 !digitalRead(button2pin)

//=========================== Network ============================

// Konfigurasi WiFi
#define WIFI_SSID "zainul"
#define WIFI_PASSWORD "12345678"

// Kunci API Firebase
#define API_KEY "AIzaSyA5Lsxqplxa4eQ9H8Zap3e95R_-SFGe2yU"
// Email pengguna untuk otentikasi Firebase
#define USER_EMAIL "user1@gmail.com"
// Kata sandi pengguna untuk otentikasi Firebase
#define USER_PASSWORD "admin123"
// ID Proyek Firebase
#define FIREBASE_PROJECT_ID "alien-outrider-453003-g8"

// Klien SSL untuk koneksi aman
SSL_CLIENT ssl_client;

// Alias untuk AsyncClientClass
using AsyncClient = AsyncClientClass;
// Objek AsyncClient
AsyncClient aClient(ssl_client);

// Objek UserAuth untuk otentikasi pengguna Firebase
UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD, 3000 /* periode kedaluwarsa dalam detik (<3600) */);
// Objek FirebaseApp
FirebaseApp app;

// Objek Firestore::Documents
Firestore::Documents Docs;
// Hasil asinkron dari operasi Firestore
AsyncResult firestoreResult;

// Dokumen JSON untuk data pengguna
JsonDocument usersDocument;
// Dokumen JSON untuk data resi
JsonDocument receiptsDocument;
// Dokumen JSON untuk data kontrol loker
JsonDocument lokerControlDocument;

// Struktur data untuk pengguna
struct UsersTypedef {
  String email;
  String nama;
};

// Struktur data untuk resi/paket
struct RececiptsTypedef {
  String nama;
  String noResi;
  int nomorLoker;
  String status;
  String tipePaket;
  String userEmail;
};

// Struktur data untuk paket dalam database
struct PackageData {
  String trackingNumber;
  String packageType;
  int assignedLoker;
} packageDatabase[MAX_PACKAGES];

// Struktur data untuk kontrol loker
struct LokerControlTypedef {
  int nomorLoker;
  int buka;
  int tutup;
};

// Konstanta untuk jumlah maksimum pengguna, resi, dan kontrol loker
const int MAX_USERS = 20;
const int MAX_RECEIPTS = 30;
const int MAX_LOKER_CONTROL = 5;

// Array untuk menyimpan data pengguna
UsersTypedef users[MAX_USERS];
// Array untuk menyimpan data resi
RececiptsTypedef receipts[MAX_RECEIPTS];
// Array untuk menyimpan data kontrol loker
LokerControlTypedef lokerControl[MAX_LOKER_CONTROL];

// Mendefinisikan ulang MAX_USERS (seharusnya hanya satu definisi)
#undef MAX_USERS
#define MAX_USERS 10
// Flag untuk menunjukkan apakah pengguna ditemukan atau kode QR terdeteksi
bool isUserFound = false, isQRCodeDetected = false;

// Array string untuk email pengguna terdaftar
String registeredUserEmails[MAX_USERS] = {
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
