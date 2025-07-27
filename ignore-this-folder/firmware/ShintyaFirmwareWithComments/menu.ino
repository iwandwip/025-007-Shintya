/**
 * @brief Enumerasi untuk mendefinisikan status menu yang berbeda dalam sistem.
 */
enum MenuState {
  MENU_MAIN,             ///< Status menu utama
  MENU_SELECT_COURIER,   ///< Status untuk memilih kurir
  MENU_INPUT_TRACKING,   ///< Status untuk memasukkan nomor resi secara manual
  MENU_SCAN_TRACKING,    ///< Status untuk memindai barcode resi
  MENU_COMPARE_TRACKING, ///< Status untuk membandingkan resi dengan database
  MENU_TRACKING_FOUND,   ///< Status ketika resi ditemukan di database
  MENU_INSERT_PACKAGE,   ///< Status untuk memasukkan paket ke dalam loker
  MENU_OPEN_LOKER,       ///< Status untuk membuka loker (khusus COD)
  MENU_CLOSE_LOKER,      ///< Status untuk menutup loker (khusus COD)
  MENU_OPEN_DOOR         ///< Status untuk membuka pintu utama dengan QR code
};

// Variabel global untuk menyimpan status menu saat ini
MenuState currentMenuState = MENU_MAIN;
// Variabel global untuk menyimpan indeks kurir yang dipilih
int selectedCourier = 0;
// Array string untuk menyimpan nama-nama kurir
String courierNames[4] = {
  "Belum Ada",
  "Shopeee",
  "J&T",
  "SiCepat"
};
// Variabel global untuk menyimpan input resi manual
String trackingInput;
// Variabel global untuk menyimpan indeks paket saat ini
int currentPackageIndex;
// Variabel global untuk menyimpan tipe paket (COD/Non-COD)
String packageType;
// Flag boolean untuk menunjukkan apakah paket telah diterima
bool isPackageReceived = false;

/**
 * @brief Fungsi utama untuk mengelola navigasi dan logika menu.
 * 
 * Fungsi ini menggunakan struktur switch-case untuk menangani berbagai
 * status menu, menampilkan informasi yang relevan di LCD, dan merespons
 * input dari tombol atau keypad.
 */
void menu() {
  switch (currentMenuState) {
    case MENU_MAIN:
      {
        // Menampilkan persentase kapasitas loker di baris 0
        displayTextOnLCD(0, 0, "        " + String(100 - (currentDistance * 100 / 45)) + "%");
        // Menampilkan pemisah di baris 1
        displayTextOnLCD(0, 1, "         ||         ");
        // Menampilkan opsi "INPUT RESI" di baris 2
        displayTextOnLCD(0, 2, "  INPUT  ||   SCAN  ");
        // Menampilkan opsi "SCAN RESI" di baris 3
        displayTextOnLCD(0, 3, "  RESI   ||   RESI  ");
        
        // Logika untuk tombol 1 (INPUT RESI)
        if (button1) {
          lcd.clear(); // Bersihkan layar LCD
          playAudioCommand(String(soundPilihKurir)); // Putar audio "Pilih Kurir"
          while (button1) // Tunggu tombol 1 dilepas
            ;
          currentMenuState = MENU_SELECT_COURIER; // Pindah ke status SELECT_COURIER
        } 
        // Logika untuk tombol 2 (SCAN RESI)
        else if (button2) {
          lcd.clear(); // Bersihkan layar LCD
          playAudioCommand("15"); // Putar audio "Scan Resi"
          while (button2) // Tunggu tombol 2 dilepas
            ;
          currentMenuState = MENU_SCAN_TRACKING; // Pindah ke status SCAN_TRACKING
        }
        
        // Logika untuk keypad (tombol '#')
        if (keyPad.isPressed()) {
          lcd.clear(); // Bersihkan layar LCD
          if (keyPad.getChar() == '#') currentMenuState = MENU_OPEN_DOOR; // Pindah ke status OPEN_DOOR jika '#' ditekan
        }
        break;
      }

    case MENU_OPEN_DOOR:
      {
        // Menampilkan pesan instruksi di LCD
        displayTextOnLCD(0, 0, "");
        displayTextOnLCD(0, 1, "    Silahkan Scan");
        displayTextOnLCD(0, 2, "       QR Code!");
        displayTextOnLCD(0, 3, "");
        
        // Membaca QR code dari Serial2 jika tersedia
        if (Serial2.available()) {
          String qrcode = Serial2.readStringUntil('\r'); // Baca string hingga karakter carriage return
          isQRCodeDetected = true; // Set flag QR code terdeteksi
          // Periksa apakah QR code cocok dengan email pengguna terdaftar
          for (int i = 0; i < MAX_USERS; i++) {
            if (qrcode == registeredUserEmails[i]) {
              isUserFound = true; // Set flag pengguna ditemukan
            }
          }
        }
        
        // Logika jika pengguna ditemukan dan QR code terdeteksi
        if (isUserFound && isQRCodeDetected) {
          // Menampilkan pesan sukses di LCD
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "   User Ditemukan!");
          displayTextOnLCD(0, 2, "    Pintu Terbuka");
          displayTextOnLCD(0, 3, "");
          digitalWrite(RELAY_SELECT_PIN, LOW); // Aktifkan relay (buka pintu)
          vTaskDelay(5000); // Tunda 5 detik
          digitalWrite(RELAY_SELECT_PIN, HIGH); // Nonaktifkan relay (tutup pintu)
          // serialInput = "cr"; // Contoh: perintah serial untuk menutup relay (dikomentari)
          isUserFound = false; // Reset flag pengguna ditemukan
          isQRCodeDetected = false; // Reset flag QR code terdeteksi
          currentMenuState = MENU_MAIN; // Kembali ke menu utama
        } 
        // Logika jika pengguna tidak ditemukan tetapi QR code terdeteksi
        else if (!isUserFound && isQRCodeDetected) {
          // Menampilkan pesan error di LCD
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "  User Tidak Valid! ");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          digitalWrite(RELAY_SELECT_PIN, HIGH); // Pastikan relay nonaktif (pintu tertutup)
          vTaskDelay(5000); // Tunda 5 detik
          isUserFound = false; // Reset flag pengguna ditemukan
          isQRCodeDetected = false; // Reset flag QR code terdeteksi
          currentMenuState = MENU_MAIN; // Kembali ke menu utama
        }

        break;
      }

    case MENU_SELECT_COURIER:
      {
        // Menampilkan opsi pemilihan kurir di LCD
        displayTextOnLCD(0, 0, "Pilih Kurir :");
        displayTextOnLCD(0, 1, "1.Shopeee");
        displayTextOnLCD(0, 2, "2.J&T");
        displayTextOnLCD(0, 3, "3.Sicepat");

        // Logika untuk input dari keypad
        if (keyPad.isPressed()) {
          char key = keyPad.getChar(); // Baca karakter tombol yang ditekan
          // Jika tombol 'B' ditekan (kembali ke menu utama)
          if (key == 'B') {
            playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
            while (keyPad.getChar() == 'B') // Tunggu tombol 'B' dilepas
              ;
            currentMenuState = MENU_MAIN; // Pindah ke status MENU_MAIN
          }

          // Jika tombol '1' ditekan (Shopee)
          if (key == '1') {
            lcd.clear(); // Bersihkan layar LCD
            playAudioCommand(String(soundInputResi)); // Putar audio "Input Resi"
            selectedCourier = 1; // Set kurir terpilih ke Shopee
            scannedBarcode = "SPXID"; // Set awalan barcode untuk Shopee
            while (keyPad.getChar() == '1') currentMenuState = MENU_INPUT_TRACKING; // Pindah ke status INPUT_TRACKING
          }
          // Jika tombol '2' ditekan (J&T)
          if (key == '2
') {
            lcd.clear(); // Bersihkan layar LCD
            playAudioCommand(String(soundInputResi)); // Putar audio "Input Resi"
            selectedCourier = 2; // Set kurir terpilih ke J&T
            scannedBarcode = "JD"; // Set awalan barcode untuk J&T
            while (keyPad.getChar() == '2') currentMenuState = MENU_INPUT_TRACKING; // Pindah ke status INPUT_TRACKING
          }
          // Jika tombol '3' ditekan (SiCepat)
          if (key == '3') {
            lcd.clear(); // Bersihkan layar LCD
            playAudioCommand(String(soundInputResi)); // Putar audio "Input Resi"
            selectedCourier = 3; // Set kurir terpilih ke SiCepat
            scannedBarcode = ""; // Set awalan barcode kosong untuk SiCepat
            while (keyPad.getChar() == '3') currentMenuState = MENU_INPUT_TRACKING; // Pindah ke status INPUT_TRACKING
          }
        }
        break;
      }

    case MENU_SCAN_TRACKING:
      {
        // Periksa apakah barcode siap dibaca
        if (isBarcodeReady) {
          isNewBarcodeScanned = true; // Set flag barcode baru terdeteksi
          scanBarcodeFromSerial(); // Pindai barcode dari serial
        }
        // Menampilkan status barcode di LCD
        displayTextOnLCD(0, 0, "Kode Resi : ");
        displayTextOnLCD(0, 1, scannedBarcode);
        displayTextOnLCD(0, 2, !isNewBarcodeScanned ? "Barcode Kosong!" : "Barcode Terdeteksi");
        displayTextOnLCD(0, 3, !isNewBarcodeScanned ? "Silahkan Scan!" : "Tekan Tombol Biru!");

        // Logika untuk tombol 'B' pada keypad (kembali ke menu utama)
        if (keyPad.isPressed() && keyPad.getChar() == 'B') {
          scannedBarcode = "||||||||||||||||||||"; // Reset barcode yang dipindai
          playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
          isNewBarcodeScanned = false; // Reset flag barcode baru
          while (keyPad.getChar() == 'B') currentMenuState = MENU_MAIN; // Kembali ke menu utama
        }

        // Logika untuk tombol 2 (tombol biru) jika barcode baru terdeteksi
        if (button2 && isNewBarcodeScanned) {
          while (button2) // Tunggu tombol 2 dilepas
            ;
          currentMenuState = MENU_COMPARE_TRACKING; // Pindah ke status COMPARE_TRACKING
        }
        break;
      }

    case MENU_COMPARE_TRACKING:
      {
        playAudioCommand(String(soundCekResi)); // Putar audio "Cek Resi"
        // Menampilkan pesan "Mengecek Resi..." di LCD
        displayTextOnLCD(0, 0, "Mengecek Resi...");
        displayTextOnLCD(0, 1, scannedBarcode);
        displayTextOnLCD(0, 2, "Silahkan Tunggu!!");
        displayTextOnLCD(0, 3, "");
        bool resiDitemukan = false; // Flag untuk menunjukkan apakah resi ditemukan
        vTaskDelay(2500); // Tunda 2.5 detik
        // Loop untuk mencari resi di database
        for (int i = 0; i < MAX_PACKAGES; i++) {
          if (scannedBarcode == receipts[i].noResi) {
            resiDitemukan = true; // Set flag resi ditemukan
            currentPackageIndex = i; // Simpan indeks paket
            packageType = receipts[i].tipePaket; // Simpan tipe paket
            break; // Keluar dari loop
          }
        }

        // Logika jika resi ditemukan
        if (resiDitemukan) {
          playAudioCommand(String(soundResiCocok)); // Putar audio "Resi Cocok"
          // Menampilkan informasi resi di LCD
          displayTextOnLCD(0, 0, "Resi Ditemukan!");
          displayTextOnLCD(0, 1, scannedBarcode);
          displayTextOnLCD(0, 2, "TYPE : " + receipts[currentPackageIndex].tipePaket);
          displayTextOnLCD(0, 3, "Membuka Kotak...");
          serialInput = "ot"; // Perintah serial untuk membuka pintu utama
          currentMenuState = MENU_INSERT_PACKAGE; // Pindah ke status INSERT_PACKAGE
        } 
        // Logika jika resi tidak ditemukan
        else {
          playAudioCommand(String(soundResiTidakCocok)); // Putar audio "Resi Tidak Cocok"
          // Menampilkan pesan error di LCD
          displayTextOnLCD(0, 0, "Resi Tidak Ditemukan!");
          displayTextOnLCD(0, 1, scannedBarcode);
          displayTextOnLCD(0, 2, "Itu Bukan Paket Saya!");
          displayTextOnLCD(0, 3, "Terima Kasih!");
          serialInput = "ct"; // Perintah serial untuk menutup pintu utama
          vTaskDelay(5000); // Tunda 5 detik
          scannedBarcode = "||||||||||||||||||||"; // Reset barcode
          isNewBarcodeScanned = false; // Reset flag barcode baru
          currentMenuState = MENU_MAIN; // Kembali ke menu utama
          playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
        }

        break;
      }

    case MENU_INPUT_TRACKING:
      {
        // Menampilkan kurir yang dipilih di baris 0
        displayTextOnLCD(0, 0, "Kurir " + courierNames[selectedCourier]);
        // Menampilkan label "Resi : " di baris 1
        displayTextOnLCD(0, 1, "Resi : ");

        // Membuat kursor spasi secara dinamis
        String cursor = "";
        for (int i = 0; i < scannedBarcode.length() + trackingInput.length(); i++) cursor += " ";
        // Menampilkan gabungan scannedBarcode dan trackingInput di baris 2
        displayTextOnLCD(0, 2, scannedBarcode + trackingInput);

        // Menampilkan kursor di baris 3
        displayTextOnLCD(0, 3, cursor + "^");

        // Logika untuk input dari keypad
        if (keyPad.isPressed()) {
          char key = keyPad.getChar();  // Membaca tombol yang ditekan
          // Jika tombol '#' ditekan (konfirmasi resi)
          if (key == '#') {
            scannedBarcode = scannedBarcode + trackingInput; // Gabungkan awalan dengan input resi
            playAudioCommand(String(soundCekResi)); // Putar audio "Cek Resi"
            currentMenuState = MENU_COMPARE_TRACKING; // Pindah ke status COMPARE_TRACKING
            while (keyPad.getChar() == '#') // Tunggu tombol '#' dilepas
              ;
          } 
          // Jika tombol '*' ditekan (kembali ke menu utama)
          else if (key == '*') {
            scannedBarcode = "|||||||||||||||||||"; // Reset barcode
            playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
            currentMenuState = MENU_MAIN; // Pindah ke status MENU_MAIN
            lcd.clear(); // Bersihkan layar LCD
            while (keyPad.getChar() == '*') // Tunggu tombol '*' dilepas
              ;
          }
          // Menangani input karakter dari keypad
          if (key == 'D') { // Tombol 'D' untuk menghapus karakter terakhir
            if (trackingInput.length() > 0) {
              trackingInput.remove(trackingInput.length() - 1); // Hapus karakter terakhir
            }
          } else if (key == 'C') { // Tombol 'C' untuk menghapus semua input
            trackingInput = ""; // Kosongkan input resi
          } else if (key != 'N' && key != 'F') { // Jika tombol bukan 'NoKey' atau 'Fail'
            if (trackingInput.length() < 20) { // Batasi panjang input hingga 20 karakter
              trackingInput += key; // Tambahkan karakter ke input resi
            }
          }
        }
        break;
        vTaskDelay(5000); // Tunda 5 detik (ini akan membuat menu tidak responsif jika tidak di dalam task RTOS)
      }
    case MENU_CLOSE_LOKER:
      {
        // Menampilkan status loker tertutup di LCD
        displayTextOnLCD(0, 0, "Loker " + String(receipts[currentPackageIndex].nomorLoker) + " Tertutup");

        // Logika untuk menutup loker berdasarkan nomor loker
        switch (receipts[currentPackageIndex].nomorLoker) {
          case 1:
            {
              serialInput = "c1"; // Perintah serial untuk menutup loker 1
              break;
            }
          case 2:
            {
              serialInput = "c2"; // Perintah serial untuk menutup loker 2
              break;
            }
          case 3:
            {
              serialInput = "c3"; // Perintah serial untuk menutup loker 3
              break;
            }
          case 4:
            {
              serialInput = "c4"; // Perintah serial untuk menutup loker 4
              break;
            }
          case 5:
            {
              serialInput = "c5"; // Perintah serial untuk menutup loker 5
              break;
            }
          default:
            {
              serialInput = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
              break;
            }
        }
        // Jika limit switch masuk loker tidak aktif (loker tertutup)
        if (!entrySwitches[receipts[currentPackageIndex].nomorLoker - 1] == 0) {
          playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2) + 1)); // Putar audio loker tertutup
          vTaskDelay(2000); // Tunda 2 detik
          // Menampilkan pesan "Terima Kasih" di LCD
          displayTextOnLCD(0, 0, "Terima Kasih");
          displayTextOnLCD(0, 1, "");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          vTaskDelay(2000); // Tunda 2 detik
          playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
          currentMenuState = MENU_MAIN; // Kembali ke menu utama
        }
        break;
      }
    case MENU_OPEN_LOKER:
      {
        // Menampilkan status loker terbuka di LCD
        displayTextOnLCD(0, 0, "Loker " + String(receipts[currentPackageIndex].nomorLoker) + " Terbuka");
        // Jika limit switch keluar loker tidak aktif (loker terbuka)
        if (!exitSwitches[receipts[currentPackageIndex].nomorLoker - 1] == 0) {
          int start = millis(); // Simpan waktu mulai
          // Menampilkan pesan "Silahkan Ambil Uang!" di LCD
          displayTextOnLCD(0, 1, "Silahkan Ambil Uang!");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");
          vTaskDelay(5000); // Tunda 5 detik
          currentMenuState = MENU_CLOSE_LOKER; // Pindah ke status CLOSE_LOKER
        }
        break;
      }

    case MENU_INSERT_PACKAGE:
      {
        // Jika limit switch masuk pintu utama tidak aktif (pintu utama terbuka)
        if (!entrySwitches[5] == 0) {
          // Menampilkan pesan instruksi di LCD
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, "  Silahkan Masukan");
          displayTextOnLCD(0, 2, "       Paket!");
          displayTextOnLCD(0, 3, "");

          // Logika deteksi paket masuk
          if (isPackageReceived == false) {
            if (currentDistance != 0 && currentDistance < 20) { // Jika ada objek terdeteksi dalam jarak 20cm
              serialInput = "ct"; // Perintah serial untuk menutup pintu utama
              isPackageReceived = true; // Set flag paket diterima
            }
          }
        }

        // Jika limit switch keluar pintu utama tidak aktif (pintu utama tertutup) dan paket sudah diterima
        if (!exitSwitches[5] == 0 && isPackageReceived) {
          isPackageReceived = false; // Reset flag paket diterima
          // Menampilkan pesan "Paket Diterima!" di LCD
          displayTextOnLCD(0, 0, "");
          displayTextOnLCD(0, 1, " Paket Diterima!  ");
          displayTextOnLCD(0, 2, "");
          displayTextOnLCD(0, 3, "");

          // Logika berdasarkan tipe paket (COD atau Non-COD)
          if (packageType == "COD") {
            scannedBarcode = "|||||||||||||||||||"; // Reset barcode
            isNewBarcodeScanned = false; // Reset flag barcode baru
            playAudioCommand(String((receipts[currentPackageIndex].nomorLoker * 2))); // Putar audio loker terbuka

            // Logika untuk membuka loker COD berdasarkan nomor loker
            switch (receipts[currentPackageIndex].nomorLoker) {
              case 1:
                {
                  serialInput = "o1"; // Perintah serial untuk membuka loker 1
                  break;
                }
              case 2:
                {
                  serialInput = "o2"; // Perintah serial untuk membuka loker 2
                  vTaskDelay(5000); // Tunda 5 detik
                  break;
                }
              case 3:
                {
                  serialInput = "o3"; // Perintah serial untuk membuka loker 3
                  vTaskDelay(5000); // Tunda 5 detik
                  break;
                }
              case 4:
                {
                  serialInput = "o4"; // Perintah serial untuk membuka loker 4
                  vTaskDelay(5000); // Tunda 5 detik
                  break;
                }
              case 5:
                {
                  serialInput = "o5"; // Perintah serial untuk membuka loker 5
                  vTaskDelay(5000); // Tunda 5 detik
                  break;
                }
              default:
                {
                  serialInput = "Unknown Loker";  // Menangani jika loker tidak sesuai dengan 1-5
                  break;
                }
            }
            lcd.clear(); // Bersihkan layar LCD
            currentMenuState = MENU_OPEN_LOKER; // Pindah ke status OPEN_LOKER

          }
          // Jika tipe paket adalah Non-COD
          else if (packageType == "Non-COD") {
            scannedBarcode = "|||||||||||||||||||"; // Reset barcode
            isNewBarcodeScanned = false; // Reset flag barcode baru
            playAudioCommand(String(soundTerimaKasih)); // Putar audio "Terima Kasih"
            vTaskDelay(2000); // Tunda 2 detik
            currentMenuState = MENU_MAIN; // Kembali ke menu utama
            playAudioCommand(String(soundPilihMetode)); // Putar audio "Pilih Metode"
          }
        }
      }
    default:
      {
        // Kasus default untuk menangani currentMenuState yang tidak valid
        break;
      }
  }
}
