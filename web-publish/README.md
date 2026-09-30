# Absence — Web Ready for Publish

Folder ini adalah versi web siap pakai (production build) dari **Absence — Sistem Presensi QR Karyawan**.
Folder ini sudah bersih total dari file development (`node_modules`, `src`, `.agents`, file dokumentasi markdown, dsb.).

---

## 📂 Isi Folder Ini:
- `index.html` : Halaman web utama
- `assets/` : Bundled JavaScript, CSS (minified), dan seluruh asset tactile / skeuomorphic
- `manifest.json` : Konfigurasi Web App / PWA Kiosk
- `koji_mascot.png` : Maskot Koji
- `favicon.svg` & `icons.svg` : Icon aplikasi

---

## 🚀 Cara Menggunakan / Mempublikasikan:

### 1. Upload ke Hosting (cPanel / Apache / Nginx / Hostinger)
Tinggal upload seluruh isi folder `web-publish` ini ke folder `public_html` di cPanel atau server web Anda. Path asset menggunakan format relatif (`./assets/...`), sehingga bisa ditaruh di root domain (`domain.com`) ataupun subfolder (`domain.com/absen/`).

### 2. Deploy Gratis ke Vercel / Netlify
- **Netlify Drop**: Buka [app.netlify.com/drop](https://app.netlify.com/drop), lalu drag & drop folder `web-publish` ini.
- **Vercel**: Bisa hubungkan repository GitHub atau deploy folder ini via Vercel CLI.

### 3. Dijalankan di Jaringan Lokal Kantor / Toko (Tanpa Internet Luar)
Cukup jalankan server statis sederhana di komputer/laptop yang satu WiFi dengan tablet:
```bash
npx serve web-publish
```
Lalu buka alamat IP komputer (contoh `http://192.168.1.50:3000`) dari browser tablet kiosk.
