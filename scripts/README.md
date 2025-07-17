# Migration Scripts

## Firestore to RTDB Migration

Script untuk mengcopy semua data yang sudah ada di Firestore ke Realtime Database (RTDB) sebagai mirror/backup.

### Prerequisites

1. **Node.js** sudah terinstall
2. **Firebase project** sudah dikonfigurasi
3. **Dependencies** sudah terinstall:
   ```bash
   npm install
   ```

### Cara Menjalankan Migration

#### 1. Dry Run (Testing Mode)
Jalankan dulu dalam mode testing untuk melihat apa yang akan dimigrate tanpa benar-benar menulis data:

```bash
node scripts/migrateFirestoreToRTDB.js
```

Script akan berjalan dalam mode `DRY_RUN` secara default untuk keamanan.

#### 2. Actual Migration
Setelah yakin dengan dry run, edit script dan ubah:

```javascript
const CONFIG = {
  DRY_RUN: false,  // Ubah dari true ke false
  // ... config lainnya
};
```

Lalu jalankan:

```bash
node scripts/migrateFirestoreToRTDB.js
```

### Collections yang Akan Dimigrate

1. **receipts** - Data paket/resi
2. **users** - Profil user dan data RFID
3. **lokerControl** - Command dan status loker

### Fitur Migration Script

✅ **Progress Tracking** - Real-time progress dengan percentage
✅ **Batch Processing** - Proses data dalam batch untuk performa optimal
✅ **Error Handling** - Comprehensive error handling dengan detail
✅ **Timestamp Conversion** - Otomatis convert Firestore timestamp ke Unix timestamp
✅ **Dry Run Mode** - Test mode tanpa menulis data
✅ **Detailed Logging** - Log lengkap untuk debugging
✅ **Rate Limiting** - Delay antar batch untuk mencegah overload

### Sample Output

```
🚀 Starting Firestore to RTDB Migration Script
============================================================
🧪 DRY RUN MODE: No data will be written to RTDB
📋 Collections to migrate: 3
   1. receipts → receipts
   2. users → users
   3. lokerControl → lokerControl

🔄 Migrating receipts → receipts
📝 Package receipts and tracking data
📊 Fetching data from Firestore collection: receipts...
📈 Found 1,250 documents to migrate
🔢 Processing in 25 batches of 50 documents each

📦 Processing batch 1/25 (50 documents)...
   Progress: 4% (50/1,250)

📦 Processing batch 2/25 (50 documents)...
   Progress: 8% (100/1,250)

... (continue until 100%)

✅ Migration completed for receipts
📊 Results:
   - Migrated: 1,250 documents
   - Errors: 0 documents

============================================================
📊 MIGRATION SUMMARY REPORT
============================================================
⏱️  Total Duration: 45 seconds
📂 Collections Processed: 3
✅ Successful Collections: 3
❌ Failed Collections: 0
📄 Total Documents Migrated: 2,350
⚠️  Total Errors: 0
🚀 Migration Speed: 52 docs/second

📋 Per-Collection Results:
   1. ✅ receipts: 1,250 migrated, 0 errors
   2. ✅ users: 950 migrated, 0 errors
   3. ✅ lokerControl: 150 migrated, 0 errors

🎉 Migration completed successfully!
✅ All Firestore data has been mirrored to RTDB
```

### Configuration Options

Edit bagian `CONFIG` dalam script untuk customization:

```javascript
const CONFIG = {
  DRY_RUN: false,              // true = test mode, false = actual migration
  BATCH_SIZE: 50,              // Jumlah dokumen per batch
  DELAY_BETWEEN_BATCHES: 1000, // Delay antar batch (ms)
  COLLECTIONS_TO_MIGRATE: [    // Collections yang akan dimigrate
    { 
      firestore: 'receipts', 
      rtdb: 'receipts',
      description: 'Package receipts and tracking data'
    },
    // ... collections lainnya
  ]
};
```

### Alternative Script (Dengan Authentication)

Jika mengalami permission denied, gunakan script alternatif:

```bash
node scripts/migrateWithAuth.js
```

Script ini menggunakan authentication dan config yang sama dengan aplikasi.

### Troubleshooting

#### Error: "Permission denied"
**Solusi 1: Gunakan script dengan authentication**
```bash
node scripts/migrateWithAuth.js
```

**Solusi 2: Check Firebase config**
- Pastikan Firebase config sudah benar
- Check Firebase Rules untuk Firestore dan RTDB
- Pastikan service account punya akses read/write

**Solusi 3: Login admin account**
- Buat account admin@gmail.com di Firebase Auth
- Set password apa saja
- Script akan auto-login dengan credentials ini

#### Error: "Network timeout"
- Kurangi `BATCH_SIZE` (misal dari 50 ke 25)
- Tingkatkan `DELAY_BETWEEN_BATCHES` (misal ke 2000ms)
- Check koneksi internet

#### Error: "Quota exceeded"
- Tunggu beberapa saat lalu coba lagi
- Kurangi `BATCH_SIZE` untuk mengurangi load
- Check Firebase usage quota

#### Script berhenti di tengah
- Script akan otomatis resume dari batch terakhir
- Check error log untuk detail masalah
- Bisa re-run script, duplikasi data akan ter-overwrite

### Verification

Setelah migration selesai:

1. **Firebase Console** - Check Realtime Database section
2. **Data Structure** - Pastikan structure sama dengan Firestore
3. **Document Count** - Verify jumlah dokumen sama
4. **Test App** - Test fungsi read dari RTDB

### Post-Migration

1. **Monitor Performance** - Watch RTDB usage dan latency
2. **Test Sync** - Verify new write operations sync ke RTDB
3. **Backup Strategy** - Setup regular backup untuk RTDB
4. **Cost Monitoring** - Monitor Firebase billing untuk RTDB usage

### Support

Jika ada masalah dengan migration:

1. Check script logs untuk error details
2. Verify Firebase configuration
3. Test dengan smaller batch size
4. Run dry run dulu sebelum actual migration

---

**⚠️ Important Notes:**

- **Backup first** - Selalu backup data sebelum migration
- **Test thoroughly** - Use dry run mode dulu
- **Monitor resources** - Watch Firebase quotas
- **Incremental approach** - Bisa migrate satu collection dulu jika perlu