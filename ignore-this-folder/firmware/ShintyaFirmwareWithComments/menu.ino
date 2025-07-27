enum MenuState {
  MENU_MAIN,
  MENU_SELECT_COURIER,
  MENU_INPUT_TRACKING,
  MENU_SCAN_TRACKING,
  MENU_COMPARE_TRACKING,
  MENU_TRACKING_FOUND,
  MENU_INSERT_PACKAGE,
  MENU_OPEN_LOKER,
  MENU_CLOSE_LOKER,
  MENU_OPEN_DOOR
};
MenuState currentMenuState = MENU_MAIN;
int selectedCourier = 0;
String courierNames[4] = {
  "Belum Ada",
  "Shopeee",
  "J&T",
  "SiCepat"
};
String trackingInput;
int currentPackageIndex;
String packageType;
bool isPackageReceived = false;

void menu() {
  switch (currentMenuState) {
    case MENU_MAIN:
      {
        displayTextOnLCD(0, 0, "        " + String(100 - (currentDistance * 100 / 45)) + "%");
        displayTextOnLCD(0, 1, "         ||         ");
        displayTextOnLCD(0, 2, "  INPUT  ||   SCAN  ");
        displayTextOnLCD(0, 3, "  RESI   ||   RESI  ");
        if (button1) {
          lcd.clear();
          playAudioCommand(String(soundPilihKurir));
          while (button1)
            ;  // Menunggu button1 dilepas
          currentMenuState = MENU_SELECT_COURIER;
        } else if (button2) {
          lcd.clear();
          playAudioCommand("15");
          while (button2)
            ;  // Menunggu button2 dilepas
          currentMenuState = MENU_SCAN_TRACKING;
        }
        if (keyPad.isPressed()) {
          lcd.clear();
          if (keyPad.getChar() == '#') currentMenuState = MENU_OPEN_DOOR;
        }
        break;
      }

    case MENU_OPEN_DOOR:
      {
        displayTextOnLCD(0, 0, "");
        displayTextOnLCD(0, 1, "    Silahkan Scan");
        displayTextOnLCD(0, 2, "       QR Code!");
        displayTextOnLCD(0, 3, "");
        if (Serial2.available()) {
          String qrcode = Serial2.readStringUntil('\r');
          isQRCodeDetected = true;
          for (int i = 0; i < MAX_USERS; i++) {
            if (qrcode == registeredUserEmails[i]) {
              isUserFound = true;
            }
          }
        }
        if (isUserFound && isQRCodeDetected) {
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "   User Ditemukan!");
          displayTextOnLCD(0, 2, "    Pintu Terbuka");
          displayTextOnLCD(0, 3, "");
          digitalWrite(RELAY_SELECT_PIN, LOW);
          vTaskDelay(5000);
          digitalWrite(RELAY_SELECT_PIN, HIGH);
          // serialInput = "cr";
          isUserFound = false;
          isQRCodeDetected = false;
          currentMenuState = MENU_MAIN;
        } else if (!isUserFound && isQRCodeDetected) {
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "  User Tidak Valid! ");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          digitalWrite(RELAY_SELECT_PIN, HIGH);
          vTaskDelay(5000);
          isUserFound = false;
          isQRCodeDetected = false;
          currentMenuState = MENU_MAIN;
        }

        break;
      }

    case MENU_SELECT_COURIER:
      {
        displayTextOnLCD(0, 0, "Pilih Kurir :");
        displayTextOnLCD(0, 1, "1.Shopeee");
        displayTextOnLCD(0, 2, "2.J&T");
        displayTextOnLCD(0, 3, "3.Sicepat");

        if (keyPad.isPressed()) {
          char key = keyPad.getChar();
          if (key == 'B') {
            playAudioCommand(String(soundPilihMetode));
            while (keyPad.getChar() == 'B')
              ;
            currentMenuState = MENU_MAIN;
          }

          if (key == '1') {
            lcd.clear();
            playAudioCommand(String(soundInputResi));
            selectedCourier = 1;
            scannedBarcode = "SPXID";
            while (keyPad.getChar() == '1') currentMenuState = MENU_INPUT_TRACKING;
          }
          if (key == '2') {
            lcd.clear();
            playAudioCommand(String(soundInputResi));
            selectedCourier = 2;
            scannedBarcode = "JD";
            while (keyPad.getChar() == '2') currentMenuState = MENU_INPUT_TRACKING;
          }
          if (key == '3') {
            lcd.clear();
            playAudioCommand(String(soundInputResi));
            selectedCourier = 3;
            scannedBarcode = "";
            while (keyPad.getChar() == '3') currentMenuState = MENU_INPUT_TRACKING;
          }
        }
        break;
      }

    case MENU_SCAN_TRACKING:
      {
        if (isBarcodeReady) {
          isNewBarcodeScanned = true;
          scanBarcodeFromSerial();
        }
        displayTextOnLCD(0, 0, "Kode Resi : ");
        displayTextOnLCD(0, 1, scannedBarcode);
        displayTextOnLCD(0, 2, !isNewBarcodeScanned ? "Barcode Kosong!" : "Barcode Terdeteksi");
        displayTextOnLCD(0, 3, !isNewBarcodeScanned ? "Silahkan Scan!" : "Tekan Tombol Biru!");

        if (keyPad.isPressed() && keyPad.getChar() == 'B') {
          scannedBarcode = "||||||||||||||||||||";
          playAudioCommand(String(soundPilihMetode));
          isNewBarcodeScanned = false;
          while (keyPad.getChar() == 'B') currentMenuState = MENU_MAIN;
        }

        if (button2 && isNewBarcodeScanned) {
          while (button2)
            ;
          currentMenuState = MENU_COMPARE_TRACKING;
        }
        break;
      }

    case MENU_COMPARE_TRACKING:
      {
        playAudioCommand(String(soundCekResi));
        displayTextOnLCD(0, 0, "Mengecek Resi...");
        displayTextOnLCD(0, 1, scannedBarcode);
        displayTextOnLCD(0, 2, "Silahkan Tunggu!!");
        displayTextOnLCD(0, 3, "");
        bool resiDitemukan = false;
        vTaskDelay(2500);
        for (int i = 0; i < MAX_PACKAGES; i++) {
          if (scannedBarcode == receipts[i].noResi) {
            resiDitemukan = true;
            currentPackageIndex = i;
            packageType = receipts[i].tipePaket;
            break;
          }
        }

        if (resiDitemukan) {
          playAudioCommand(String(soundResiCocok));
          displayTextOnLCD(0, 0, "Resi Ditemukan!");
          displayTextOnLCD(0, 1, scannedBarcode);
          displayTextOnLCD(0, 2, "TYPE : " + receipts[currentPackageIndex].tipePaket);
          displayTextOnLCD(0, 3, "Membuka Kotak...");
          serialInput = "ot";
          currentMenuState = MENU_INSERT_PACKAGE;
        } else {
          playAudioCommand(String(soundResiTidakCocok));
          displayTextOnLCD(0, 0, "Resi Tidak Ditemukan!");
          displayTextOnLCD(0, 1, scannedBarcode);
          displayTextOnLCD(0, 2, "Itu Bukan Paket Saya!");
          displayTextOnLCD(0, 3, "Terima Kasih!");
          serialInput = "ct";
          vTaskDelay(5000);
          scannedBarcode = "||||||||||||||||||||";
          isNewBarcodeScanned = false;
          currentMenuState = MENU_MAIN;
          playAudioCommand(String(soundPilihMetode));
        }

        break;
      }

    case MENU_INPUT_TRACKING:
      {
        displayTextOnLCD(0, 0, "Kurir " + courierNames[selectedCourier]);
        displayTextOnLCD(0, 1, "Resi : ");

        // Gabungkan scannedBarcode dan trackingInput secara dinamis
        String cursor = "";
        for (int i = 0; i < scannedBarcode.length() + trackingInput.length(); i++) cursor += " ";
        // Tampilkan buffResi di LCD
        displayTextOnLCD(0, 2, scannedBarcode + trackingInput);

        // Update panjang buffResi di baris ke-3
        displayTextOnLCD(0, 3, cursor + "^");

        if (keyPad.isPressed()) {
          char key = keyPad.getChar();  // Membaca tombol yang ditekan
          if (key == '#') {
            scannedBarcode = scannedBarcode + trackingInput;
            playAudioCommand(String(soundCekResi));
            currentMenuState = MENU_COMPARE_TRACKING;
            while (keyPad.getChar() == '#')
              ;
          } else if (key == '*') {
            scannedBarcode = "||||||||||||||||||||";
            playAudioCommand(String(soundPilihMetode));
            currentMenuState = MENU_MAIN;
            lcd.clear();
            while (keyPad.getChar() == '*')
              ;
          }
          // Menangani serialInput berdasarkan tombol yang ditekan
          if (key == 'D') {
            if (trackingInput.length() > 0) {
              trackingInput.remove(trackingInput.length() - 1);
            }
          } else if (key == 'C') {
            trackingInput = "";
          } else if (key != 'N' && key != 'F') {
            if (trackingInput.length() < 20) {
              trackingInput += key;
            }
          }
        }
        break;
        vTaskDelay(5000);
      }
    case MENU_CLOSE_LOKER:
      {

        displayTextOnLCD(0, 0, "Loker " + String(receipts[currentPackageIndex].nomorLoker) + " Tertutup");

        switch (receipts[currentPackageIndex].nomorLoker) {
          case 1:
            {
              serialInput = "c1";
              break;
            }
          case 2:
            {
              serialInput = "c2";
              break;
            }
          case 3:
            {
              serialInput = "c3";
              break;
            }
          case 4:
            {
              serialInput = "c4";

              break;
            }
          case 5:
            {
              serialInput = "c5";
              break;
            }
          default:
            {
              serialInput = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
              break;
            }
        }
        if (!entrySwitches[receipts[currentPackageIndex].nomorLoker - 1] == 0) {
          playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2) + 1));
          vTaskDelay(2000);
          displayTextOnLCD(0, 0, "Terima Kasih");
          displayTextOnLCD(0, 1, "");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          vTaskDelay(2000);
          playAudioCommand(String(soundPilihMetode));
          currentMenuState = MENU_MAIN;
        }
        break;
      }
    case MENU_OPEN_LOKER:
      {
        displayTextOnLCD(0, 0, "Loker " + String(receipts[currentPackageIndex].nomorLoker) + " Terbuka");
        if (!exitSwitches[receipts[currentPackageIndex].nomorLoker - 1] == 0) {
          int start = millis();
          displayTextOnLCD(0, 1, "Silahkan Ambil Uang!");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          vTaskDelay(5000);
          currentMenuState = MENU_CLOSE_LOKER;
        }
        break;
      }

    case MENU_INSERT_PACKAGE:
      {
        if (!entrySwitches[5] == 0) {
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "  Silahkan Masukan");
          displayTextOnLCD(0, 2, "       Paket!");
          displayTextOnLCD(0, 3, "");

          if (isPackageReceived == false) {
            if (currentDistance != 0 && currentDistance < 20) {
              serialInput = "ct";
              isPackageReceived = true;
            }
          }
        }

        if (!exitSwitches[5] == 0 && isPackageReceived) {
          isPackageReceived = false;
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, " Paket Diterima!  ");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");

          if (packageType == "COD") {
            scannedBarcode = "|||||||||||||||||||";
            isNewBarcodeScanned = false;
            playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2)));

            switch (receipts[currentPackageIndex].nomorLoker) {
              case 1:
                {
                  serialInput = "o1";
                  break;
                }
              case 2:
                {
                  serialInput = "o2";
                  vTaskDelay(5000);
                  break;
                }
              case 3:
                {
                  serialInput = "o3";
                  vTaskDelay(5000);
                  break;
                }
              case 4:
                {
                  serialInput = "o4";
                  vTaskDelay(5000);

                  break;
                }
              case 5:
                {
                  serialInput = "o5";
                  vTaskDelay(5000);
                  break;
                }
              default:
                {
                  serialInput = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
                  break;
                }
            }
            lcd.clear();
            currentMenuState = MENU_OPEN_LOKER;

          } else if (packageType == "Non-COD") {
            scannedBarcode = "|||||||||||||||||||";
            isNewBarcodeScanned = false;
            playAudioCommand(String(soundTerimaKasih));
            vTaskDelay(2000);
            currentMenuState = MENU_MAIN;
            playAudioCommand(String(soundPilihMetode));
          }
        }
      }
    default:
      {
        // Default case to handle invalid currentMenuState
        break;
      }
  }
}
