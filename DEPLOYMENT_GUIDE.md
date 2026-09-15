# 🚀 Panduan Hosting & Deployment Live: CNGR Tournament Engine

Aplikasi **CNGR Tournament Engine** dibangun dengan arsitektur **Node.js (Express.js)** pada backend dan **Vanilla HTML5, CSS3, & Modern JS** pada frontend, dengan data tersimpan di `backend/data/tournaments.json`.

Berikut adalah panduan lengkap dan rekomendasi tempat hosting yang cepat, murah/terjangkau, dan mudah.

---

## 🔍 Perbandingan Platform Hosting

| Platform | Biaya | Kecepatan & Uptime | Penyimpanan Data (`tournaments.json`) | Kemudahan Deploy | Rekomendasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Railway.app** | ~$5 / bulan (ada saldo awal) | ⚡ Sangat Cepat (Tanpa Cold Start) | ✅ Aman (Tersedia Persistent Volume / Disk) | ⭐⭐⭐⭐⭐ (Tinggal klik dari GitHub) | 🏆 **Sangat Direkomendasikan** |
| **Render.com** | Gratis (Free) / $7 (Starter) | 🟡 Free: Ada sleep 30-50 detik saat pertama dibuka.<br>⚡ Paid: Selalu aktif & cepat | ✅ Mendukung Persistent Disk ($1/bln) | ⭐⭐⭐⭐⭐ (Sangat mudah) | 👍 Pilihan Alternatif Bagus |
| **VPS (Hostinger / Hetzner / IDCloudHost)** | ~$3 - $5 / bulan (Rp 45rb - 75rb/bln) | ⚡⚡ Paling Cepat & Stabil 24/7 | ✅ 100% Permanen di SSD VPS Anda | ⭐⭐⭐ (Perlu setup Linux & PM2) | 🏅 Terbaik untuk Skala Besar & Kantor |
| **Vercel** | Gratis / $20 Pro | ⚡ Sangat Cepat (Global Edge) | ⚠️ **Catatan Penting**: Sistem file Vercel bersifat *ephemeral / read-only* (file `tournaments.json` akan reset saat server sleep/cold-start). | ⭐⭐⭐⭐ (Perlu pindah storage ke cloud DB) | 💡 Cocok jika dipadukan dengan Supabase / Vercel KV |

---

## 🏆 Rekomendasi #1: Deploy Menggunakan Railway.app (Paling Cepat & Praktis)

**Railway** adalah pilihan terbaik untuk aplikasi Node.js yang menggunakan sistem file lokal seperti project kita:
- Tidak ada jeda "sleep / cold-start" seperti hosting gratisan.
- Mendukung sistem file persisten (data turnamen tidak akan hilang).
- Otomatis membuatkan domain HTTPS gratis (contoh: `cngr-bracket.up.railway.app`) dan bisa dipasang custom domain sendiri.

### Langkah-langkah Deploy ke Railway:

#### Langkah 1: Siapkan Repository GitHub
Pastikan seluruh folder project diupload ke GitHub:
1. Buat repository baru di [github.com](https://github.com) (misal bernama `cngr-tournament-bracket`).
2. Buka terminal di folder project Anda (`c:\Users\CNGR-MLWL\NewBracket`), lalu jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - CNGR Tournament Engine"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/cngr-tournament-bracket.git
   git push -u origin main
   ```

#### Langkah 2: Buat Project di Railway
1. Buka [railway.app](https://railway.app) dan login dengan akun **GitHub** Anda.
2. Klik tombol **"New Project"** -> Pilih **"Deploy from GitHub repo"**.
3. Pilih repository `cngr-tournament-bracket`.
4. Railway akan otomatis mendeteksi Node.js dan menjalankan `npm start` (yang menjalankan `node backend/server.js`).

#### Langkah 3: Tambahkan Persistent Volume (Agar Data Bracket Tidak Hilang)
1. Di dashboard Railway, klik service aplikasi Anda.
2. Masuk ke tab **Data / Volumes** -> Klik **"Add Volume"**.
3. Set Mount Path ke:
   ```text
   /app/backend/data
   ```
4. Klik **Save & Deploy**. Sekarang, file turnamen akan tersimpan permanen di volume tersebut.

#### Langkah 4: Aktifkan Domain Publik
1. Masuk ke tab **Settings** di service aplikasi Anda.
2. Pada bagian **Networking**, klik **"Generate Domain"**.
3. Anda akan langsung mendapatkan URL live yang aktif dan siap dibagikan ke peserta melalui QR Code! (Contoh: `https://cngr-tournament.up.railway.app`).

---

## 🥈 Rekomendasi #2: Deploy Menggunakan Render.com

Jika Anda ingin mencoba yang ada opsi gratisnya terlebih dahulu:

1. Buka [render.com](https://render.com) dan daftar akun.
2. Klik **"New +"** -> Pilih **"Web Service"**.
3. Hubungkan repository GitHub Anda.
4. Isi konfigurasi:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Instance Type**: Pilih **Free** (untuk uji coba) atau **Starter ($7/bln)** untuk kecepatan tinggi tanpa delay.
5. Pada bagian **Advanced** -> **Disks** (jika menggunakan paket Starter):
   - **Name**: `bracket-data`
   - **Mount Path**: `/opt/render/project/src/backend/data`
   - **Size**: `1 GB`
6. Klik **"Create Web Service"**. Dalam 2 menit link web Anda sudah aktif.

---

## 🥉 Rekomendasi #3: Menggunakan VPS Murah (Hostinger VPS / IDCloudHost / Hetzner)

Jika Anda ingin performa maksimal dengan biaya sangat murah (mulai **Rp 45.000 - Rp 70.000 / bulan** atau $3.99/bln):

1. Sewa VPS dengan OS **Ubuntu 22.04 / 24.04**.
2. Login ke VPS via SSH, lalu pasang Node.js & PM2:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm git
   sudo npm install -g pm2
   ```
3. Clone repository Anda ke VPS:
   ```bash
   git clone https://github.com/USERNAME_ANDA/cngr-tournament-bracket.git
   cd cngr-tournament-bracket
   npm install
   ```
4. Jalankan aplikasi di background 24/7 dengan PM2:
   ```bash
   pm2 start backend/server.js --name "cngr-bracket"
   pm2 startup
   pm2 save
   ```
5. Pasang **Nginx** sebagai reverse proxy agar web bisa dibuka di port 80/443 (domain Anda) dengan SSL gratis:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
   Arahkan Nginx proxy pass ke `http://localhost:3000`.

---

## ❓ Bagaimana dengan Vercel?

Jika Anda ingin menggunakan **Vercel**:
- Vercel sangat cepat, namun karena arsitekturnya bertipe **Serverless**, file lokal yang tersimpan di `tournaments.json` akan terhapus atau kembali ke awal setiap kali fungsinya restart/sleep.
- **Solusi jika ingin tetap pakai Vercel**:
  Kita cukup menambahkan adaptor database cloud gratis (seperti **Supabase PostgreSQL** atau **Upstash Redis**) untuk menggantikan penyimpanan file JSON lokal di `backend/db.js`.
- Jika Anda ingin saya ubahkan kodenya agar kompatibel langsung dengan Vercel + Supabase, beri tahu saya dan saya bisa siapkan konfigurasinya!

---

## 🎯 Saran Terbaik untuk Kebutuhan Anda Saat Ini:

Gunakan **Railway.app**:
1. Tidak perlu ubah kode backend sama sekali.
2. Proses setup dari GitHub selesai dalam **kurang dari 3 menit**.
3. Sangat cepat, biaya sangat terjangkau (~$5/bln), dan QR Code pendaftaran langsung bisa discan oleh siapapun melalui internet!
