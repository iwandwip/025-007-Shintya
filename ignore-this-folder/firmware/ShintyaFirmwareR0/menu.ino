enum menuData {
  menuUtama,
  menuPilihKurir,
  menuInputResi,
  menuScanResi,
  menuCompareResi,
  menuResiDitemukan,
  menuMasukanPaket,
  menuBukaLoker,
  menuTutupLoker,
  menuBukaPintu
};
menuData menuIdx = menuUtama;
int kurir = 0;
String kurirStr[4] = {
  "Belum Ada",
  "Shopeee",
  "J&T",
  "SiCepat"

};
String inputResi;
int paketIdx;
String type;
bool paketDiterima = false;

void menu() {
  switch (menuIdx) {
    case menuUtama:
      {
        lcd_print(0, 0, "        " + String(100 - (jarak * 100 / 45)) + "%");
        lcd_print(0, 1, "         ||         ");
        lcd_print(0, 2, "  INPUT  ||   SCAN  ");
        lcd_print(0, 3, "  RESI   ||   RESI  ");
        if (button1) {
          lcd.clear();
          speak(String(soundPilihKurir));
          while (button1)
            ;  // Menunggu button1 dilepas
          menuIdx = menuPilihKurir;
        } else if (button2) {
          lcd.clear();
          speak("15");
          while (button2)
            ;  // Menunggu button2 dilepas
          menuIdx = menuScanResi;
        }
        if (keyPad.isPressed()) {
          lcd.clear();
          if (keyPad.getChar() == '#') menuIdx = menuBukaPintu;
        }
        break;
      }

    case menuBukaPintu:
      {
        lcd_print(0, 0, "");
        lcd_print(0, 1, "    Silahkan Scan");
        lcd_print(0, 2, "       QR Code!");
        lcd_print(0, 3, "");
        if (Serial2.available()) {
          String qrcode = Serial2.readStringUntil('\r');
          isQRDitemukan = true;
          for (int i = 0; i < maxUser; i++) {
            if (qrcode == userEmail[i]) {
              isUserDitemukan = true;
            }
          }
        }
        if (isUserDitemukan && isQRDitemukan) {
          lcd_print(0, 0, "");
          lcd_print(0, 1, "   User Ditemukan!");
          lcd_print(0, 2, "    Pintu Terbuka");
          lcd_print(0, 3, "");
          digitalWrite(selPin, LOW);
          vTaskDelay(5000);
          digitalWrite(selPin, HIGH);
          // input = "cr";
          isUserDitemukan = false;
          isQRDitemukan = false;
          menuIdx = menuUtama;
        } else if (!isUserDitemukan && isQRDitemukan) {
          lcd_print(0, 0, "");
          lcd_print(0, 1, "  User Tidak Valid! ");
          lcd_print(0, 2, "");
          lcd_print(0, 3, "");
          digitalWrite(selPin, HIGH);
          vTaskDelay(5000);
          isUserDitemukan = false;
          isQRDitemukan = false;
          menuIdx = menuUtama;
        }

        break;
      }

    case menuPilihKurir:
      {
        lcd_print(0, 0, "Pilih Kurir :");
        lcd_print(0, 1, "1.Shopeee");
        lcd_print(0, 2, "2.J&T");
        lcd_print(0, 3, "3.Sicepat");

        if (keyPad.isPressed()) {
          char key = keyPad.getChar();
          if (key == 'B') {
            speak(String(soundPilihMetode));
            while (keyPad.getChar() == 'B')
              ;
            menuIdx = menuUtama;
          }

          if (key == '1') {
            lcd.clear();
            speak(String(soundInputResi));
            kurir = 1;
            barcode = "SPXID";
            while (keyPad.getChar() == '1') menuIdx = menuInputResi;
          }
          if (key == '2') {
            lcd.clear();
            speak(String(soundInputResi));
            kurir = 2;
            barcode = "JD";
            while (keyPad.getChar() == '2') menuIdx = menuInputResi;
          }
          if (key == '3') {
            lcd.clear();
            speak(String(soundInputResi));
            kurir = 3;
            barcode = "";
            while (keyPad.getChar() == '3') menuIdx = menuInputResi;
          }
        }
        break;
      }

    case menuScanResi:
      {
        if (barcodeReady) {
          barcodeBaru = true;
          readBarcode();
        }
        lcd_print(0, 0, "Kode Resi : ");
        lcd_print(0, 1, barcode);
        lcd_print(0, 2, !barcodeBaru ? "Barcode Kosong!" : "Barcode Terdeteksi");
        lcd_print(0, 3, !barcodeBaru ? "Silahkan Scan!" : "Tekan Tombol Biru!");

        if (keyPad.isPressed() && keyPad.getChar() == 'B') {
          barcode = "||||||||||||||||||||";
          speak(String(soundPilihMetode));
          barcodeBaru = false;
          while (keyPad.getChar() == 'B') menuIdx = menuUtama;
        }

        if (button2 && barcodeBaru) {
          while (button2)
            ;
          menuIdx = menuCompareResi;
        }
        break;
      }

    case menuCompareResi:
      {
        speak(String(soundCekResi));
        lcd_print(0, 0, "Mengecek Resi...");
        lcd_print(0, 1, barcode);
        lcd_print(0, 2, "Silahkan Tunggu!!");
        lcd_print(0, 3, "");
        bool resiDitemukan = false;
        vTaskDelay(2500);
        for (int i = 0; i < maxPaket; i++) {
          if (barcode == receipts[i].noResi) {
            resiDitemukan = true;
            paketIdx = i;
            type = receipts[i].tipePaket;
            break;
          }
        }

        if (resiDitemukan) {
          speak(String(soundResiCocok));
          lcd_print(0, 0, "Resi Ditemukan!");
          lcd_print(0, 1, barcode);
          lcd_print(0, 2, "TYPE : " +  receipts[paketIdx].tipePaket);
          lcd_print(0, 3, "Membuka Kotak...");
          input = "ot";
          menuIdx = menuMasukanPaket;
        } else {
          speak(String(soundResiTidakCocok));
          lcd_print(0, 0, "Resi Tidak Ditemukan!");
          lcd_print(0, 1, barcode);
          lcd_print(0, 2, "Itu Bukan Paket Saya!");
          lcd_print(0, 3, "Terima Kasih!");
          input = "ct";
          vTaskDelay(5000);
          barcode = "||||||||||||||||||||";
          barcodeBaru = false;
          menuIdx = menuUtama;
          speak(String(soundPilihMetode));
        }

        break;
      }

    case menuInputResi:
      {
        lcd_print(0, 0, "Kurir " + kurirStr[kurir]);
        lcd_print(0, 1, "Resi : ");

        // Gabungkan barcode dan inputResi secara dinamis
        String cursor = "";
        for (int i = 0; i < barcode.length() + inputResi.length(); i++) cursor += " ";
        // Tampilkan buffResi di LCD
        lcd_print(0, 2, barcode + inputResi);

        // Update panjang buffResi di baris ke-3
        lcd_print(0, 3, cursor + "^");

        if (keyPad.isPressed()) {
          char key = keyPad.getChar();  // Membaca tombol yang ditekan
          if (key == '#') {
            barcode = barcode + inputResi;
            speak(String(soundCekResi));
            menuIdx = menuCompareResi;
            while (keyPad.getChar() == '#')
              ;
          } else if (key == '*') {
            barcode = "||||||||||||||||||||";
            speak(String(soundPilihMetode));
            menuIdx = menuUtama;
            lcd.clear();
            while (keyPad.getChar() == '*')
              ;
          }
          // Menangani input berdasarkan tombol yang ditekan
          if (key == 'D') {
            if (inputResi.length() > 0) {
              inputResi.remove(inputResi.length() - 1);
            }
          } else if (key == 'C') {
            inputResi = "";
          } else if (key != 'N' && key != 'F') {
            if (inputResi.length() < 20) {
              inputResi += key;
            }
          }
        }
        break;
        vTaskDelay(5000);
      }
    case menuTutupLoker:
      {

        lcd_print(0, 0, "Loker " + String(receipts[paketIdx].nomorLoker) + " Tertutup");

        switch (receipts[paketIdx].nomorLoker) {
          case 1:
            {
              input = "c1";
              break;
            }
          case 2:
            {
              input = "c2";
              break;
            }
          case 3:
            {
              input = "c3";
              break;
            }
          case 4:
            {
              input = "c4";

              break;
            }
          case 5:
            {
              input = "c5";
              break;
            }
          default:
            {
              input = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
              break;
            }
        }
        if (!limitMasuk[receipts[paketIdx].nomorLoker - 1] == 0) {
          speak(String((receipts[paketIdx].nomorLoker * 2) + 1));
          vTaskDelay(2000);
          lcd_print(0, 0, "Terima Kasih");
          lcd_print(0, 1, "");
          lcd_print(0, 2, "");
          lcd_print(0, 3, "");
          vTaskDelay(2000);
          speak(String(soundPilihMetode));
          menuIdx = menuUtama;
        }
        break;
      }
    case menuBukaLoker:
      {
        lcd_print(0, 0, "Loker " + String(receipts[paketIdx].nomorLoker) + " Terbuka");
        if (!limitKeluar[receipts[paketIdx].nomorLoker - 1] == 0) {
          int start = millis();
          lcd_print(0, 1, "Silahkan Ambil Uang!");
          lcd_print(0, 2, "");
          lcd_print(0, 3, "");
          vTaskDelay(5000);
          menuIdx = menuTutupLoker;
        }
        break;
      }

    case menuMasukanPaket:
      {
        if (!limitMasuk[5] == 0) {
          lcd_print(0, 0, "");
          lcd_print(0, 1, "  Silahkan Masukan");
          lcd_print(0, 2, "       Paket!");
          lcd_print(0, 3, "");

          if (paketDiterima == false) {
            if (jarak != 0 && jarak < 20) {
              input = "ct";
              paketDiterima = true;
            }
          }
        }

        if (!limitKeluar[5] == 0 && paketDiterima) {
          paketDiterima = false;
          lcd_print(0, 0, "");
          lcd_print(0, 1, " Paket Diterima!  ");
          lcd_print(0, 2, "");
          lcd_print(0, 3, "");

          if (type == "COD") {
            barcode = "|||||||||||||||||||";
            barcodeBaru = false;
            speak(String((receipts[paketIdx].nomorLoker * 2)));

            switch (receipts[paketIdx].nomorLoker) {
              case 1:
                {
                  input = "o1";
                  break;
                }
              case 2:
                {
                  input = "o2";
                  vTaskDelay(5000);
                  break;
                }
              case 3:
                {
                  input = "o3";
                  vTaskDelay(5000);
                  break;
                }
              case 4:
                {
                  input = "o4";
                  vTaskDelay(5000);

                  break;
                }
              case 5:
                {
                  input = "o5";
                  vTaskDelay(5000);
                  break;
                }
              default:
                {
                  input = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
                  break;
                }
            }
            lcd.clear();
            menuIdx = menuBukaLoker;

          } else if (type == "Non-COD") {
            barcode = "|||||||||||||||||||";
            barcodeBaru = false;
            speak(String(soundTerimaKasih));
            vTaskDelay(2000);
            menuIdx = menuUtama;
            speak(String(soundPilihMetode));
          }
        }
      }
    default:
      {
        // Default case to handle invalid menuIdx
        break;
      }
  }
}
