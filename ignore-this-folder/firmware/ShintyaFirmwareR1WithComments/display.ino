/**
 * @brief Menginisialisasi layar LCD.
 * 
 * Fungsi ini menginisialisasi LCD, menyalakan lampu latar (backlight),
 * dan menampilkan judul serta informasi awal pada layar.
 */
void initializeLCDDisplay() {
  lcd.init();       // Inisialisasi LCD
  lcd.backlight();  // Nyalakan lampu latar LCD
  String displayTitle;

  // Menampilkan judul "SHINTYA PUTRI WIJAYA"
  displayTitle = "SHINTYA PUTRI WIJAYA";
  lcd.setCursor(10 - displayTitle.length() / 2, 1);  // Atur posisi kursor di tengah baris 1
  lcd.print(displayTitle);                           // Tampilkan judul

  // Menampilkan NIM "2141160117"
  displayTitle = "2141160117";
  lcd.setCursor(10 - displayTitle.length() / 2, 2);  // Atur posisi kursor di tengah baris 2
  lcd.print(displayTitle);                           // Tampilkan NIM

  // playAudioCommand(String(soundJudul)); // Contoh: memutar audio judul (dikomentari)
  // vTaskDelay(10000); // Contoh: jeda 10 detik (dikomentari)
  lcd.clear();  // Bersihkan layar LCD
}

// Buffer untuk menyimpan teks terakhir yang ditampilkan pada setiap baris LCD (4 baris)
String lastDisplayedText[4];

/**
 * @brief Menampilkan teks pada layar LCD dengan pembaruan cerdas.
 * 
 * Fungsi ini hanya memperbarui layar LCD jika teks yang akan ditampilkan
 * berbeda dengan teks yang sudah ada, untuk mencegah flicker.
 * Ini juga memastikan teks memiliki panjang 20 karakter dengan menambahkan spasi
 * atau memotongnya jika diperlukan.
 * 
 * @param xPosition Posisi kolom (x) untuk memulai teks.
 * @param yPosition Posisi baris (y) untuk memulai teks.
 * @param textBuffer Teks yang akan ditampilkan.
 */
void displayTextOnLCD(int xPosition, int yPosition, String textBuffer) {
  // Hanya perbarui jika ada perubahan teks
  if (lastDisplayedText[yPosition] != textBuffer) {
    lastDisplayedText[yPosition] = textBuffer;  // Simpan teks baru

    // Bersihkan layar dengan spasi kosong untuk menghindari sisa teks lama
    String clearString = String("                    ");  // 20 karakter kosong
    lcd.setCursor(xPosition, yPosition);                  // Atur posisi kursor
    lcd.print(clearString);                               // Bersihkan teks lama

    // Pastikan panjang buffer teks tepat 20 karakter
    while (textBuffer.length() < 20) {  // Tambahkan spasi hingga panjang buffer menjadi 20 karakter
      textBuffer += " ";
    }

    // Batasi panjang buffer teks menjadi 20 karakter jika lebih
    if (textBuffer.length() > 20) {
      textBuffer = textBuffer.substring(0, 20);
    }

    char displayBuffer[21];                                 // Buffer karakter: 20 karakter + null terminator
    snprintf(displayBuffer, 21, "%s", textBuffer.c_str());  // Format teks ke buffer karakter
    lcd.setCursor(xPosition, yPosition);                    // Atur posisi kursor
    lcd.print(displayBuffer);                               // Tampilkan teks baru
  }
}

/**
 * @brief Menampilkan data sistem pada layar LCD.
 * 
 * Fungsi ini adalah placeholder untuk menampilkan berbagai data sistem
 * seperti barcode yang dipindai atau informasi lainnya.
 */
void displaySystemData() {
  // sprintf(buff , "B:%s" , scannedBarcode); // Contoh: menampilkan barcode yang dipindai (dikomentari)
  // displayTextOnLCD(0, 0, scannedBarcode); // Contoh: menampilkan barcode pada LCD (dikomentari)
}
