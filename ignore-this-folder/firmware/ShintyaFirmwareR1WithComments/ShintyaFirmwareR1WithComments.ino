// Nama : SHINTYA PUTRI WIJAYA
// Judul : RANCANG BANGUN SMART PACKET BOX CASH ON DELIVERY (COD) BERBASIS APLIKASI ANDROID

// Memasukkan (include) file header library.h yang berisi definisi dan deklarasi global
#include "library.h"

/**
 * @brief Fungsi setup() yang dijalankan sekali saat ESP32 dinyalakan atau di-reset.
 * 
 * Fungsi ini menginisialisasi komunikasi serial dan memulai task-task RTOS
 * yang telah didefinisikan.
 */
void setup() {
  // Memulai komunikasi serial dengan baud rate 115200
  Serial.begin(115200);
  // Memanggil fungsi untuk mengatur dan memulai task-task RTOS
  setupRTOS();
}

/**
 * @brief Fungsi loop() yang dijalankan berulang kali setelah setup().
 * 
 * Dalam implementasi RTOS ini, fungsi loop() dibiarkan kosong karena
 * semua logika program utama ditangani oleh task-task RTOS yang berjalan
 * secara konkruen.
 */
void loop() {
  // Tidak ada kode di sini karena semua logika ditangani oleh task RTOS
}
