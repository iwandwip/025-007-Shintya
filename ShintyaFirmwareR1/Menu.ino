void onLcdMenu() {
  static auto menuMain = menu.createMenu(menu.begin(4), "Testing LCD", "I2C 20 x 4", "LCD I2C", "OK");
  menu.showMenu(menuMain);
}