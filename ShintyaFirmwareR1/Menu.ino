void onLcdMenu() {
  static auto menuMain = menu.createMenu(4, "Resi Non-COD", "Resi COD", "Ambil Paket", "Info: Paket Penuh");
  menu.showMenu(menuMain);
}