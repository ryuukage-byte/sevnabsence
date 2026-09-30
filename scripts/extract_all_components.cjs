const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'assets', 'scrapbook');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Flood-fill / connected-components extraction for black background
async function processSheet(sheetName, inputPath, prefix) {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  
  // Get raw RGBA buffer
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  
  // Mask: 0 = background (black), 1 = foreground (sticker)
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rawBuffer[idx];
      const g = rawBuffer[idx + 1];
      const b = rawBuffer[idx + 2];
      
      // Black background check
      if (r < 30 && g < 30 && b < 30) {
        mask[y * width + x] = 0;
        rawBuffer[idx + 3] = 0; // Transparent
      } else {
        mask[y * width + x] = 1;
        rawBuffer[idx + 3] = 255;
      }
    }
  }

  // Find connected components using BFS
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      if (mask[pos] === 1 && visited[pos] === 0) {
        // Start BFS
        let minX = x, maxX = x, minY = y, maxY = y;
        const queue = [x, y];
        visited[pos] = 1;

        let qHead = 0;
        while (qHead < queue.length) {
          const cx = queue[qHead++];
          const cy = queue[qHead++];

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4 neighbors
          const neighbors = [
            [cx - 1, cy],
            [cx + 1, cy],
            [cx, cy - 1],
            [cx, cy + 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const npos = ny * width + nx;
              if (mask[npos] === 1 && visited[npos] === 0) {
                visited[npos] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }

        const compW = maxX - minX + 1;
        const compH = maxY - minY + 1;

        // Filter out small artifacts (< 18x18)
        if (compW >= 18 && compH >= 18) {
          components.push({
            minX, maxX, minY, maxY,
            width: compW, height: compH,
            pixelCount: queue.length / 2
          });
        }
      }
    }
  }

  console.log(`${sheetName}: found ${components.length} components`);

  // Sort components by position (top-to-bottom, left-to-right)
  components.sort((a, b) => {
    const rowA = Math.floor(a.minY / 40);
    const rowB = Math.floor(b.minY / 40);
    if (rowA !== rowB) return rowA - rowB;
    return a.minX - b.minX;
  });

  // Extract each component to transparent PNG
  const transparentFullImg = sharp(rawBuffer, {
    raw: { width, height, channels: 4 }
  });

  const extractedList = [];

  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    // Add small 2px padding if within bounds
    const pad = 2;
    const cropLeft = Math.max(0, c.minX - pad);
    const cropTop = Math.max(0, c.minY - pad);
    const cropWidth = Math.min(width - cropLeft, c.width + pad * 2);
    const cropHeight = Math.min(height - cropTop, c.height + pad * 2);

    const filename = `${prefix}_${String(i + 1).padStart(2, '0')}.png`;
    const outPath = path.join(outputDir, filename);

    await sharp(rawBuffer, { raw: { width, height, channels: 4 } })
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .png()
      .toFile(outPath);

    extractedList.push({
      filename,
      width: cropWidth,
      height: cropHeight,
      left: cropLeft,
      top: cropTop
    });
  }

  return extractedList;
}

async function run() {
  const srcFiles = {
    stickers: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771979192.jpg',
    ui: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771986378.jpg',
    panels: 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2389ca20-e1fc-4997-b0a8-8d1a400d7ca8\\.user_uploaded\\media_1790771991972.jpg'
  };

  const results = {};
  for (const [key, filePath] of Object.entries(srcFiles)) {
    results[key] = await processSheet(key, filePath, key);
  }

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('Extraction complete! Manifest written to manifest.json');
}

run().catch(console.error);
