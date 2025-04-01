void onLcdMenu() {
  static auto menuMain = menu.createMenu(4, "Resi Non-COD", "Resi COD", "Ambil Paket", "Info: Paket Penuh");

  // "      [COD]      ";
  // "    [NON-COD]    ";
  // "  Silahkan Scan  ";
  // " Resi Paket Anda ";
  // " Pengecekan Resi ";
  // "   Nomor Resi    ";
  // "    Terdaftar    ";
  // " Tidak Terdaftar ";

  // "  Pintu Terbuka  ";
  // "  Mohon Tunggu   ";

  // "    Silahkan     ";
  // " Memasukan Paket ";
  // "     Terima      ";
  // "      Kasih      ";
  // "                 ";

  menu.onSelect(menuMain, "Resi Non-COD", []() {
    static auto menuNonCOD = menu.createMenu(4, "    [NON-COD]    ", "  Silahkan Scan  ", " Resi Paket Anda ", "");
    if (!buttonOkStr.isEmpty()) {
      menu.clearMenu(menuNonCOD, menuMain, menu.end());
    }
    if (!resiBarcode.isEmpty()) {
      menu.formatMenu(menuNonCOD, 3, "[ %s ]", resiBarcode.c_str());
      menu.showMenu(menuNonCOD, true);
      delay(2000);
      menu.formatMenu(menuNonCOD, 3, "%s", "                 ");
      auto menuNonCODCheck = menu.createMenu(4, "    [NON-COD]    ", " Pengecekan Resi ", "", "");
      menu.showMenu(menuNonCODCheck, true);
      delay(2000);
      bool isResiTerdaftar = false;
      for (int i = 0; i < PAKET_MAX; i++) {
        if (resiBarcode == resiData[i].noResi) {
          isResiTerdaftar = true;
          break;
        }
      }
      if (isResiTerdaftar) {
        menu.formatMenu(menuNonCODCheck, 2, "%s", "   Nomor Resi    ");
        menu.formatMenu(menuNonCODCheck, 3, "%s", "    Terdaftar    ");
        menu.showMenu(menuNonCODCheck, true);
        delay(4000);
        auto menuNonCODResiTerdaftar = menu.createMenu(4, "    [NON-COD]    ", "  Pintu Terbuka  ", "  Mohon Tunggu   ", "");
        menu.showMenu(menuNonCODResiTerdaftar, true);
        delay(2000);
        auto menuNonCODMasukanPaket = menu.createMenu(4, "    [NON-COD]    ", "    Silahkan     ", " Memasukan Paket ", "");
        menu.showMenu(menuNonCODMasukanPaket, true);
        delay(4000);
        auto menuNonCODTerimaKasih = menu.createMenu(4, "    [NON-COD]    ", "     Terima      ", "      Kasih      ", "");
        menu.showMenu(menuNonCODTerimaKasih, true);
        delay(2000);
        menu.clearMenu(menuNonCOD, menuMain, menu.end());
        resiBarcode = "";
        menu.freeMenu(menuNonCODCheck);
        menu.freeMenu(menuNonCODResiTerdaftar);
        menu.freeMenu(menuNonCODMasukanPaket);
        menu.freeMenu(menuNonCODTerimaKasih);
        return;
      } else {
        menu.formatMenu(menuNonCODCheck, 2, "%s", "   Nomor Resi    ");
        menu.formatMenu(menuNonCODCheck, 3, "%s", " Tidak Terdaftar ");
        menu.showMenu(menuNonCODCheck, true);
        delay(4000);
        menu.clearMenu(menuNonCOD, menuMain, menu.end());
        resiBarcode = "";
        menu.freeMenu(menuNonCODCheck);
        return;
      }
    }
    menu.showMenu(menuNonCOD);
  });

  menu.onSelect(menuMain, "Resi COD", []() {
    static auto menuCOD = menu.createMenu(4, "      [COD]      ", "  Silahkan Scan  ", " Resi Paket Anda ", "");
    if (!buttonOkStr.isEmpty()) {
      menu.clearMenu(menuCOD, menuMain, menu.end());
    }
    if (!resiBarcode.isEmpty()) {
      menu.formatMenu(menuCOD, 3, "[ %s ]", resiBarcode.c_str());
    }
    menu.showMenu(menuCOD);
  });

  menu.onSelect(menuMain, "Ambil Paket", []() {
    static auto menuAmbilPaket = menu.createMenu(4, "", "", "", "");
    menu.showMenu(menuAmbilPaket);
  });

  menu.showMenu(menuMain);
}