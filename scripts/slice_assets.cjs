const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcFiles = {
  stickers: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771979192.jpg',
  ui_elements: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771986378.jpg',
  panels: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771991972.jpg'
};

async function main() {
  for (const [key, filePath] of Object.entries(srcFiles)) {
    const meta = await sharp(filePath).metadata();
    console.log(`${key}: ${meta.width}x${meta.height}, channels: ${meta.channels}`);
  }
}

main().catch(console.error);
