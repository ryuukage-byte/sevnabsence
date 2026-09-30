const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUTPUT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByText(page, selector, text) {
  const elements = await page.$$(selector);
  for (const el of elements) {
    const content = await page.evaluate(node => node.textContent, el);
    if (content && content.includes(text)) {
      await el.click();
      return true;
    }
  }
  return false;
}

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Memulai browser Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. Initial Setup Screen
  console.log('📸 00: Layar Otorisasi / Setup Tablet Kiosk...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '00_setup_aktivasi_perangkat.png') });

  // 2. Activate Kiosk
  console.log('👉 Mengaktifkan Kiosk Presensi...');
  await clickByText(page, 'button', 'Aktifkan Kiosk Presensi');
  await sleep(800);

  // 3. Kiosk Masuk
  console.log('📸 01: Mode Kiosk Presensi Masuk (Desktop)...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_kiosk_presensi_masuk.png') });

  // 4. Kiosk Pulang
  console.log('📸 02: Mode Kiosk Presensi Pulang...');
  await page.evaluate(() => {
    const pulangBtn = document.querySelector('.tactile-action-btn.pulang');
    if (pulangBtn) pulangBtn.click();
  });
  await sleep(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_kiosk_presensi_pulang.png') });

  // 5. Scan Berhasil (Simulasi)
  console.log('📸 03: Kiosk Scan Berhasil (Feedback Card & Maskot Koji)...');
  await page.evaluate(() => {
    const masukBtn = document.querySelector('.tactile-action-btn.masuk');
    if (masukBtn) masukBtn.click();
  });
  await sleep(200);
  await page.evaluate(() => {
    const chip = document.querySelector('.dev-chip-btn') || document.querySelector('.tactile-chip-btn');
    if (chip) chip.click();
  });
  await page.waitForSelector('.tactile-stamp-badge', { timeout: 4000 }).catch(() => {});
  await sleep(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_kiosk_scan_berhasil_feedback.png') });

  // 6. Tablet Portrait Kiosk
  console.log('📸 04: Kiosk Tablet Portrait View (iPad 768x1024)...');
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1.5 });
  await sleep(400);
  await page.evaluate(() => {
    const resetBtn = document.querySelector('.btn-close-result');
    if (resetBtn) resetBtn.click();
  });
  await sleep(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_kiosk_tablet_portrait_ipad.png') });

  // Reset back to Desktop Viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await sleep(400);

  // 7. Security Gate Modal
  console.log('📸 05: Modal Security Gate Admin (Kunci Keamanan)...');
  await clickByText(page, '.mode-nav-btn', 'Admin');
  await sleep(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_modal_admin_security_gate.png') });

  // 8. Unlock Admin using demo helper
  console.log('👉 Membuka Kunci Admin...');
  const demoFill = await page.$('.btn-quick-fill');
  if (demoFill) await demoFill.click();
  await sleep(200);
  const unlockBtn = await page.$('.btn-unlock');
  if (unlockBtn) await unlockBtn.click();
  await sleep(800);

  // 9. Admin Dashboard - Monitoring Hari Ini
  console.log('📸 06: Admin Dashboard - Monitoring Hari Ini...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_admin_monitoring_hari_ini.png') });

  // 10. Admin - Data Karyawan
  console.log('📸 07: Admin Dashboard - Data Karyawan & QR...');
  await clickByText(page, '.admin-nav-item', 'Data Karyawan');
  await sleep(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_admin_data_karyawan_list.png') });

  // 11. Modal Tambah Karyawan
  console.log('📸 08: Modal Tambah Karyawan Baru...');
  await clickByText(page, 'button', 'Tambah Karyawan');
  await sleep(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_admin_modal_tambah_karyawan.png') });

  // Close modal via close button
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-card .btn-close');
    if (closeBtn) closeBtn.click();
  });
  await sleep(300);

  // 12. Modal Kartu Identitas & QR Code
  console.log('📸 09: Modal Kartu Identitas & QR Code Karyawan...');
  await page.evaluate(() => {
    const qrBtn = document.querySelector('.btn-qr-view');
    if (qrBtn) qrBtn.click();
  });
  await sleep(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_admin_modal_qr_identity_card.png') });

  // Close modal using 'Tutup' button
  console.log('👉 Menutup Modal QR Card...');
  await clickByText(page, 'button', 'Tutup');
  await sleep(400);

  // 13. Admin - Matriks Jadwal
  console.log('📸 10: Admin Dashboard - Matriks Jadwal Mingguan...');
  await clickByText(page, '.admin-nav-item', 'Matriks Jadwal');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_admin_matriks_jadwal_mingguan.png') });

  // 14. Admin - Shift Kerja & Toleransi
  console.log('📸 11: Admin Dashboard - Shift Kerja & Toleransi...');
  await clickByText(page, '.admin-nav-item', 'Shift Kerja');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_admin_shift_kerja_toleransi.png') });

  // 15. Modal Tambah Shift
  console.log('📸 12: Modal Tambah Shift Kerja Baru...');
  await clickByText(page, 'button', 'Tambah Shift');
  await sleep(400);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_admin_modal_tambah_shift.png') });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-card .btn-close');
    if (closeBtn) closeBtn.click();
  });
  await sleep(300);

  // 16. Admin - Log & Audit Presensi
  console.log('📸 13: Admin Dashboard - Log & Audit Presensi...');
  await clickByText(page, '.admin-nav-item', 'Log & Audit');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_admin_log_audit_presensi.png') });

  // 17. Admin - Laporan & Ekspor CSV
  console.log('📸 14: Admin Dashboard - Laporan & Ekspor CSV...');
  await clickByText(page, '.admin-nav-item', 'Laporan');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_admin_laporan_ekspor_csv.png') });

  // 18. Admin - Pengaturan Organisasi & Sandi
  console.log('📸 15: Admin Dashboard - Pengaturan Organisasi...');
  await clickByText(page, '.admin-nav-item', 'Pengaturan');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_admin_pengaturan_organisasi.png') });

  // 19. Admin - Responsive Mobile View
  console.log('📸 16: Admin Tampilan Smartphone Responsive (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await clickByText(page, '.admin-nav-item', 'Monitoring');
  await sleep(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16_admin_smartphone_responsive.png') });

  console.log('🎉 Selesai! Semua 17 tangkapan layar unik berhasil disimpan ke:', OUTPUT_DIR);
  await browser.close();
}

capture().catch((err) => {
  console.error('❌ Terjadi kesalahan:', err);
  process.exit(1);
});
