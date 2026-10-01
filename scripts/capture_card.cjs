const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

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

  // Pre-seed initialized device and test member
  await page.evaluate(() => {
    const testMember = {
      id: 'c0000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      member_number: 'EMP001',
      full_name: 'Musa Al-Fatih',
      department: 'Operasional',
      position: 'Senior Staff',
      gender: 'MALE',
      date_of_birth: '1995-10-05',
      avatar_url: 'card_avatar_default.jpg',
      is_active: true,
      active_token: 'tok_musa_live_sec99'
    };
    localStorage.setItem('sevn_device_initialized', 'true');
    localStorage.setItem('sevn_members', JSON.stringify([testMember]));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);

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
    if (text.includes('Karyawan')) {
      await item.click();
      break;
    }
  }
  await sleep(600);

  // Click QR button for first member
  console.log('Opening ID Card modal...');
  const qrBtn = await page.$('.btn-qr-view');
  if (qrBtn) {
    await qrBtn.click();
    await sleep(800);
  } else {
    console.log('QR button not found!');
  }

  // Take screenshot of the card modal
  console.log('Capturing card modal...');
  const modal = await page.$('.id-card-modal-large');
  if (modal) {
    await modal.screenshot({
      path: path.join(ARTIFACT_DIR, 'id_card_modal_preview.png')
    });
    console.log('Modal screenshot saved to artifact directory!');
  }

  // Take screenshot of just the ID Card element
  const card = await page.$('#printable-id-card');
  if (card) {
    await card.screenshot({
      path: path.join(ARTIFACT_DIR, 'id_card_exact_element.png')
    });
    console.log('Card element screenshot saved to artifact directory!');
  }

  // Emulate print media and take screenshot of what prints
  console.log('Emulating print media...');
  await page.emulateMediaType('print');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'id_card_print_emulation.png'),
    fullPage: false
  });
  console.log('Print emulation screenshot saved to artifact directory!');

  await browser.close();
  console.log('Done!');
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
