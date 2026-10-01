const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\ba5836a4-edaf-4899-8fce-0195b617b08d";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:5175/...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });
  await sleep(600);

  // If initial activation screen is showing, activate
  const activateBtn = await page.$('button');
  const activateText = await page.evaluate(btn => btn?.textContent || '', activateBtn);
  if (activateText.includes('Aktifkan Kiosk')) {
    await activateBtn.click();
    await sleep(600);
  }

  // Switch to Admin
  console.log('Switching to Admin...');
  const modeButtons = await page.$$('.mode-nav-btn');
  for (const btn of modeButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Admin')) {
      await btn.click();
      break;
    }
  }
  await sleep(600);

  // Check if admin gate is showing
  const quickFillBtn = await page.$('.btn-quick-fill');
  if (quickFillBtn) {
    console.log('Bypassing admin gate...');
    await quickFillBtn.click();
    await sleep(300);
    const unlockBtn = await page.$('.btn-unlock');
    if (unlockBtn) await unlockBtn.click();
    await sleep(600);
  }

  // Click Manajemen Karyawan in sidebar
  console.log('Navigating to Manajemen Karyawan...');
  const navItems = await page.$$('.admin-nav-item');
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text.includes('Manajemen Karyawan') || text.includes('Karyawan')) {
      await item.click();
      break;
    }
  }
  await sleep(600);

  // Check if table has rows, if not, click "+ Tambah Karyawan" to add one
  let editButtons = await page.$$('.btn-edit-member');
  if (editButtons.length === 0) {
    console.log('Table is empty. Adding a new employee via modal...');
    const addBtn = await page.$('.admin-view-header .btn-primary');
    if (addBtn) {
      await addBtn.click();
      await sleep(500);

      await page.waitForSelector('input[placeholder="Contoh: EMP005"]', { timeout: 3000 });
      await page.type('input[placeholder="Contoh: EMP005"]', 'EMP001');
      await page.type('input[placeholder="Nama lengkap staf"]', 'Musa Al-Fatih');
      await page.type('input[placeholder="Operasional"]', 'Operasional');
      await page.type('input[placeholder="Staff / Koordinator"]', 'Koordinator Layanan');

      const submitBtn = await page.$('.modal-form button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(700);
      }
    }
  }

  // 1. Capture table screenshot showing Edit button ONLY under Aksi (no Ganti Token in table)
  console.log('Capturing table screenshot...');
  const tableEl = await page.$('.table-responsive');
  if (tableEl) {
    await tableEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'final_employee_table_clean.png')
    });
    console.log('Saved final_employee_table_clean.png');
  }

  // 2. Click Edit button
  editButtons = await page.$$('.btn-edit-member');
  if (editButtons.length > 0) {
    console.log('Opening Edit modal...');
    await editButtons[0].click();
    await sleep(600);

    // Capture the Edit Modal with the new Ganti Token security box
    const modalEl = await page.$('.modal-card');
    if (modalEl) {
      await modalEl.screenshot({
        path: path.join(ARTIFACT_DIR, 'final_edit_modal_with_token_box.png')
      });
      console.log('Saved final_edit_modal_with_token_box.png');
    }

    // Close edit modal
    const closeBtn = await page.$('.btn-close');
    if (closeBtn) {
      await closeBtn.click();
      await sleep(400);
    }
  }

  // 3. Open ID Card modal
  const qrBtn = await page.$('.btn-qr-view');
  if (qrBtn) {
    console.log('Opening ID Card modal...');
    await qrBtn.click();
    await sleep(700);

    const cardModal = await page.$('.id-card-modal-large');
    if (cardModal) {
      await cardModal.screenshot({
        path: path.join(ARTIFACT_DIR, 'final_id_card_modal_preview.png')
      });
      console.log('Saved final_id_card_modal_preview.png');
    }

    const cardElement = await page.$('#printable-id-card');
    if (cardElement) {
      await cardElement.screenshot({
        path: path.join(ARTIFACT_DIR, 'final_id_card_exact_element.png')
      });
      console.log('Saved final_id_card_exact_element.png');
    }
  }

  await browser.close();
  console.log('All captures completed successfully!');
}

run().catch((err) => {
  console.error('Error running capture:', err);
  process.exit(1);
});
