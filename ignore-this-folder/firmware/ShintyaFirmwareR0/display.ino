void setupDisplay() {
  lcd.init();
  lcd.backlight();
  String title;
  title = "SHINTYA PUTRI WIJAYA";
  lcd.setCursor(10 - title.length() / 2, 1);
  lcd.print(title);
  title = "2141160117";
  lcd.setCursor(10 - title.length() / 2, 2);
  lcd.print(title);
  // speak(String(soundJudul));
  // vTaskDelay(10000);
  lcd.clear();
}

String lastPrintedString[4];  // Buffer untuk menyimpan teks yang terakhir ditampilkan (4 baris LCD)

void lcd_print(int x, int y, String buffer) {
  // Hanya perbarui jika ada perubahan pada teks
  if (lastPrintedString[y] != buffer) {
    lastPrintedString[y] = buffer;  // Simpan teks baru

    // Kosongkan layar dengan spasi kosong untuk menghindari sisa teks lama
    String emptyString = String("                    ");  // 20 karakter kosong
    lcd.setCursor(x, y);
    lcd.print(emptyString);  // Hapus teks lama

    // Pastikan panjang buffer tepat 20 karakter
    while (buffer.length() < 20) {  // Tambahkan spasi hingga panjang buffer menjadi 20 karakter
      buffer += " ";
    }

    // Batasi panjang buffer ke 20 karakter jika lebih
    if (buffer.length() > 20) {
      buffer = buffer.substring(0, 20);
    }

    char buff[21];  // 20 karakter + null terminator
    snprintf(buff, 21, "%s", buffer.c_str());
    lcd.setCursor(x, y);
    lcd.print(buff);  // Menampilkan teks yang baru
  }
}

void displayData() {
  // sprintf(buff , "B:%s" , barcode);
  // lcd_print(0, 0, barcode);
}
