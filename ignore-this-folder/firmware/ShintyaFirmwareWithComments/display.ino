void initializeLCDDisplay() {
  lcd.init();
  lcd.backlight();
  String displayTitle;
  displayTitle = "SHINTYA PUTRI WIJAYA";
  lcd.setCursor(10 - displayTitle.length() / 2, 1);
  lcd.print(displayTitle);
  displayTitle = "2141160117";
  lcd.setCursor(10 - displayTitle.length() / 2, 2);
  lcd.print(displayTitle);
  // playAudioCommand(String(soundJudul));
  // vTaskDelay(10000);
  lcd.clear();
}

String lastDisplayedText[4];  // Buffer to store the last displayed text (4 LCD rows)

void displayTextOnLCD(int xPosition, int yPosition, String textBuffer) {
  // Only update if there's a change in text
  if (lastDisplayedText[yPosition] != textBuffer) {
    lastDisplayedText[yPosition] = textBuffer;  // Save new text

    // Clear screen with empty spaces to avoid old text remnants
    String clearString = String("                    ");  // 20 empty characters
    lcd.setCursor(xPosition, yPosition);
    lcd.print(clearString);  // Clear old text

    // Ensure buffer length is exactly 20 characters
    while (textBuffer.length() < 20) {  // Add spaces until buffer length becomes 20 characters
      textBuffer += " ";
    }

    // Limit buffer length to 20 characters if more
    if (textBuffer.length() > 20) {
      textBuffer = textBuffer.substring(0, 20);
    }

    char displayBuffer[21];  // 20 characters + null terminator
    snprintf(displayBuffer, 21, "%s", textBuffer.c_str());
    lcd.setCursor(xPosition, yPosition);
    lcd.print(displayBuffer);  // Display the new text
  }
}

void displaySystemData() {
  // sprintf(buff , "B:%s" , scannedBarcode);
  // displayTextOnLCD(0, 0, scannedBarcode);
}
