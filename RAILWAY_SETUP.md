# Panduan Menghubungkan & Hosting di Railway (CNGR Bracket Engine)

Aplikasi ini sudah dipersiapkan khusus untuk cloud hosting di **Railway** dengan **Dual-Mode Database**:
- **Cloud Mode**: Otomatis menggunakan **PostgreSQL Railway** (data tersimpan permanen dan tidak terhapus saat redeploy).
- **Local Mode**: Otomatis menggunakan file lokal `tournaments.json` jika dijalankan secara offline di komputer lokal.

---

## Langkah 1: Hubungkan PostgreSQL ke Web Service di Railway

Karena database PostgreSQL sudah ditambahkan di proyek Railway Anda:

1. Buka dashboard proyek Railway:
   `https://railway.com/project/b5d98723-7186-4e3e-bd7b-2358a19175bd`
2. Di dalam canvas/tampilan arsitektur proyek Railway:
   - Jika Anda belum menambahkan service aplikasi Node.js:
     Klik tombol **`+ New`** (atau `Create`) di pojok kanan atas -> pilih **`GitHub Repo`** -> pilih repositori **`pedlipop/newbracket`**.
3. **Hubungkan Database ke Aplikasi**:
   - Klik pada service aplikasi Anda (`newbracket`).
   - Masuk ke tab **Variables**.
   - Klik **`+ New Variable`** -> pilih **`Add Reference`**.
   - Pilih service **`Postgres`** -> pilih variabel **`DATABASE_URL`**.
   - Variabel akan otomatis terisi: `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
   - Simpan (*Save* / *Deploy*).

> **Catatan Otomatis**: Server Node.js akan otomatis mendeteksi `DATABASE_URL`, membuat tabel `tournaments` secara mandiri (*auto-migration*), dan mengaktifkan koneksi SSL cloud yang aman. Anda **tidak perlu** mengetik query SQL manual apapun!

---

## Langkah 2: Konfigurasi Service Settings di Railway

Pastikan pengaturan pada service aplikasi Anda (`newbracket`):

1. Masuk ke tab **Settings** pada service aplikasi:
   - **Build Command**: Kosongkan (default `npm install` sudah otomatis dijalankan Railway).
   - **Start Command**: `npm start` (atau biarkan default, karena sudah tercantum `"start": "node backend/server.js"` di `package.json`).
   - **Root Directory**: `/`
2. **Generate Public Domain**:
   - Masih di tab **Settings**, scroll ke bawah ke bagian **Networking** (atau **Public Networking**).
   - Klik tombol **`Generate Domain`**.
   - Railway akan memberikan alamat URL publik HTTPS aktif, misalnya:
     `https://newbracket-production.up.railway.app`
   - Salin URL tersebut. Aplikasi sudah live dan dapat diakses dari seluruh dunia!

---

## Langkah 3: Push Perubahan Terbaru ke GitHub

Sebelum Railway men-deploy versi terbaru ini, lakukan push commit terbaru ke branch `main` GitHub Anda:

Jalankan perintah ini di terminal IDE Anda (atau terminal PowerShell):
```bash
git push -u origin main
```

Setiap kali Anda melakukan `git push` ke branch `main`, Railway akan otomatis mendeteksi pembaruan dan melakukan deploy instan tanpa *downtime*.

---

## Ringkasan Lokasi File Penting

- **Proyek Produksi (Siap Hosting)**:
  `c:\Users\CNGR-MLWL\NewBracket`
- **Pencadangan Lengkap (Backup Duplikasi)**:
  `c:\Users\CNGR-MLWL\NewBracket_backup`
- **Git Tag Cadangan**:
  `backup-pre-hosting`
