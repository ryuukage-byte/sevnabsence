# Absence — Web-Based Employee Attendance System

Lightweight, modern, and friendly QR-based tablet attendance kiosk and management portal.

## 🚀 Fitur Utama

- **Kiosk Mode (Presensi Tablet):**
  - Menggunakan **kamera depan** secara default dengan tampilan cermin (*mirrored view*).
  - Tombol aksi sentuh berukuran besar: **[ PRESENSI MASUK ]** dan **[ PRESENSI PULANG ]**.
  - Jam digital *real-time* dengan detik dan format tanggal Indonesia.
  - Maskot interaktif (**Koji the Timekeeper**) dengan micro-animation (idle, scanning, validasi, sukses, duplikat, dan error).
  - Nada suara ramah (*Web Audio chime*) seketika saat scan berhasil atau ditolak.
  - Overlay konfirmasi kehadiran dengan *auto-reset countdown* 3 detik.
  - Simulasi scan cepat kartu demo untuk pengujian tanpa kamera.

- **Portal Karyawan (Member Mode):**
  - Ringkasan kehadiran hari ini, status jam masuk, jam pulang, dan durasi kerja.
  - Matriks jadwal kerja pribadi (shift pagi, siang, malam, libur, dan cuti).
  - Riwayat presensi lengkap dengan status keterlambatan dan catatan durasi.
  - Kartu QR Digital pribadi untuk presensi.

- **Admin Management Console:**
  - **Monitoring Hari Ini:** Metrik statistik langsung (Total Terjadwal, Hadir, Pulang, Terlambat, Belum Hadir, Perlu Review) dan *feed* aktivitas terkini.
  - **Manajemen Karyawan & QR:** Tambah/edit karyawan, terbitkan kartu ID QR resmi siap cetak (*printable badge*), serta pencabutan (*revoke*) dan penggantian token instan.
  - **Matriks Jadwal Bulanan:** Tampilan spreadsheet/grid interaktif (Baris: Karyawan, Kolom: Tanggal 1..31). Klik sel untuk ubah shift (Shift A, B, C, OFF, CUTI, SAKIT).
  - **Pengaturan Shift Kerja:** Konfigurasi jam masuk/pulang, toleransi keterlambatan (*grace period*), toleransi hadir lebih awal, dan kode warna badge.
  - **Log Presensi & Audit Anti-Joki:** Log seluruh rekaman, alur verifikasi anti-joki (*proxy scan review*), serta formulir koreksi manual dengan pencatatan riwayat audit (*audit trail*).
  - **Laporan & Ekspor CSV:** Perhitungan persentase kehadiran, total menit keterlambatan, dan ekspor data 1-klik ke format CSV standar RFC 4180.
  - **Pengaturan Organisasi:** Pengaturan nama perusahaan, nama cabang (*flexible business name*), zona waktu, dan status Supabase.

- **Modul Shisetsu Kaigo (介護施設):**
  - **3 portal:** `#kiosk` (scan QR), `#member` (portal staf, login nomor pegawai + PIN), `#admin`.
  - **Profil Fasilitas:** pilih jenis shisetsu (Tokuyou aktif; Rōken, Group Home, Day Service, Kantor menyusul), lantai, ruangan, dan tugas per ruangan (jam mulai–selesai, hari, shift pelaksana, skill wajib, min. staf). Template awal: Tokuyou 2 lantai + shift 早番・日勤・遅番・夜勤.
  - **Identitas Staf:** level (Lv1 Trainee – Lv5 Leader), kualifikasi (無資格 – 介護福祉士 / 看護師), status kerja (正社員, パート, 特定技能 …), skill, shift yang sudah bisa, lantai utama, boleh pindah lantai, maks shift malam, target libur, saldo cuti, PIN portal.
  - **Pembuat Jadwal otomatis:** kebutuhan staf per lantai × shift (hari biasa / akhir pekan), rotasi 夜→明→公, maks hari kerja berturut-turut, larangan 遅→早, kuota libur bulanan, cek skill per tugas ruangan, menghormati 希望休 & cuti yang disetujui. Hasil bisa dipreview, disimpan, diedit di Matriks, lalu dipublikasikan.
  - **Pengajuan:** 希望休 lewat klik kalender (maks per bulan, maks staf per tanggal, batas tanggal pengajuan) dan cuti (berbayar/sakit/khusus/tidak dibayar, cek saldo). Persetujuan admin langsung masuk jadwal + notifikasi.
  - **Kotak Pesan dua arah:** staf kirim masukan/keluhan/laporan insiden; admin kirim peringatan/pemberitahuan ke satu staf atau broadcast, lengkap dengan status dibaca dan balasan per thread.
  - Data demo: *Admin → Profil Fasilitas → Muat staf demo* (7 staf, nomor `2026001`–`2026007`, PIN = 4 digit terakhir).

---

## 🛠️ Tech Stack

- **Frontend:** React 18/19, TypeScript, Vite
- **Styling:** Vanilla CSS Modern dengan CSS Tokens (`tokens.css`), responsive tablet/mobile/desktop
- **Icons:** Lucide React
- **QR Engine:** `html5-qrcode` (kamera depan), `qrcode.react` (pembuat QR badge)
- **Audio:** Web Audio API Native Synthesizer
- **Backend / Database:** Supabase (PostgreSQL 15+, PL/pgSQL Atomic Stored Function, RLS)
- **Deployment & PWA:** Standalone PWA Manifest, Vercel/Netlify ready

---

## 📦 Menjalankan Secara Lokal

1. Clone repositori:
```bash
git clone https://github.com/ryuukage-byte/sevnabsence.git
cd sevnabsence
```

2. Instal dependensi:
```bash
npm install
```

3. Jalankan development server:
```bash
npm run dev
```

Buka peramban di `http://localhost:5173`.

---

## 🗄️ Setup Database Supabase

### Sinkron lintas perangkat (wajib untuk kiosk + HP staf + admin)

1. Jalankan [supabase/migrations/20261028_app_records_sync.sql](./supabase/migrations/20261028_app_records_sync.sql) di **SQL Editor** project Supabase Anda.
2. Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` dan `VITE_ORG_ID` (lihat `.env.example`). Semua perangkat satu fasilitas memakai `VITE_ORG_ID` yang sama.
3. Perangkat pertama yang tersambung ke cloud kosong akan mengunggah datanya; perangkat berikutnya mengunduh data cloud saat dibuka.

Cara kerja: setiap data (staf, shift, jadwal, presensi, lantai/ruangan/tugas, identitas, pengajuan, pesan, pengaturan) disimpan satu baris di `app_records` dan juga di perangkat. Perubahan dikirim otomatis, perubahan dari perangkat lain masuk lewat Supabase Realtime (cadangan: cek tiap 15 detik / saat aplikasi dibuka lagi). Konflik diselesaikan per data, yang terakhir disimpan menang. Saat offline aplikasi tetap jalan dan mengirim perubahan setelah tersambung. Status sinkron terlihat di titik warna sebelah nama organisasi dan di *Pengaturan Organisasi*.

> ⚠️ Keamanan: belum memakai Supabase Auth per pengguna, jadi siapa pun yang memegang anon key bisa membaca/menulis data organisasi (termasuk PIN member). Cocok untuk uji coba; sebelum produksi pindahkan login admin & member ke Supabase Auth dengan RLS per member.

### Skema relasional (opsional)

Skrip migrasi database lengkap tersedia di [supabase/migrations/20260930_init_absence.sql](./supabase/migrations/20260930_init_absence.sql).

Langkah instalasi di Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih project Anda (`esiwgshifchloadscuoh` / sevnabsence).
3. Masuk ke menu **SQL Editor**.
4. Salin seluruh isi berkas `supabase/migrations/20260930_init_absence.sql` dan klik **Run**.
5. Skema tabel, indeks, data awal demo, dan fungsi stored procedure `record_attendance_scan()` akan langsung aktif.

---

## 📄 Dokumentasi Desain & Spesifikasi

- [01_PRD.md](./01_PRD.md) — Product Requirements Document
- [02_DESIGN.md](./02_DESIGN.md) — UI/UX Principles & Design System
- [03_DATABASE.md](./03_DATABASE.md) — Schema, Constraints & RLS
- [04_SYSTEM_FLOW.md](./04_SYSTEM_FLOW.md) — Mermaid Workflows & Logic Flow
- [05_TECH_SPEC.md](./05_TECH_SPEC.md) — Technical Specification & PWA
- [06_IMPLEMENTATION_PLAN.md](./06_IMPLEMENTATION_PLAN.md) — Milestone Roadmap
- [07_TESTING.md](./07_TESTING.md) — Test Cases & QA Matrix
- [08_DEPLOYMENT.md](./08_DEPLOYMENT.md) — Deployment & Tablet Hardening
