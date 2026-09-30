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

Skrip migrasi database lengkap tersedia di [supabase/migrations/20260930_init_absence.sql](file:///c:/project/Absence/supabase/migrations/20260930_init_absence.sql).

Langkah instalasi di Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih project Anda (`tgnqtexegvcpagphqurb`).
3. Masuk ke menu **SQL Editor**.
4. Salin seluruh isi berkas `supabase/migrations/20260930_init_absence.sql` dan klik **Run**.
5. Skema tabel, indeks, data awal demo, dan fungsi stored procedure `record_attendance_scan()` akan langsung aktif.

---

## 📄 Dokumentasi Desain & Spesifikasi

- [01_PRD.md](file:///c:/project/Absence/01_PRD.md) — Product Requirements Document
- [02_DESIGN.md](file:///c:/project/Absence/02_DESIGN.md) — UI/UX Principles & Design System
- [03_DATABASE.md](file:///c:/project/Absence/03_DATABASE.md) — Schema, Constraints & RLS
- [04_SYSTEM_FLOW.md](file:///c:/project/Absence/04_SYSTEM_FLOW.md) — Mermaid Workflows & Logic Flow
- [05_TECH_SPEC.md](file:///c:/project/Absence/05_TECH_SPEC.md) — Technical Specification & PWA
- [06_IMPLEMENTATION_PLAN.md](file:///c:/project/Absence/06_IMPLEMENTATION_PLAN.md) — Milestone Roadmap
- [07_TESTING.md](file:///c:/project/Absence/07_TESTING.md) — Test Cases & QA Matrix
- [08_DEPLOYMENT.md](file:///c:/project/Absence/08_DEPLOYMENT.md) — Deployment & Tablet Hardening
