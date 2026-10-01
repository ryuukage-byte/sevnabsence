#!/usr/bin/env node
/**
 * Design-token guard.  Run:  npm run lint:design
 *
 * Fails (exit 1) when:
 *  1. a var(--x) is used but never defined (this is what silently broke the progress bar / Admin icon)
 *  2. a hex colour is hard-coded outside src/styles/00-tokens.css (CSS) or in a .tsx file
 *  3. a raw px border-radius, raw rem/px font-size or raw z-index is used outside the token file
 *
 * Intentional exceptions: shift colours are DATA stored per shift (`color_code`), not theme -> ShiftManager.tsx and
 * any `color_code:` seed line are ignored.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const TOKENS = path.join(SRC, 'styles', '00-tokens.css');
const DATA_COLOUR_FILES = new Set(['ShiftManager.tsx']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(css|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const files = walk(SRC);
const errors = [];
const defined = new Set();
for (const f of files.filter((f) => f.endsWith('.css'))) {
  for (const m of strip(fs.readFileSync(f, 'utf8')).matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
}

for (const f of files) {
  const rel = path.relative(path.resolve(SRC, '..'), f);
  const isCss = f.endsWith('.css');
  const isTokens = f === TOKENS;
  const lines = (isCss ? strip(fs.readFileSync(f, 'utf8')) : fs.readFileSync(f, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    for (const m of line.matchAll(/var\((--[\w-]+)/g)) {
      if (!defined.has(m[1])) errors.push(`${at}  undefined token ${m[1]}`);
    }
    if (isTokens) return;
    if (!DATA_COLOUR_FILES.has(path.basename(f)) && /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/.test(line) && !/\burl\(|href=|&#\d|\bcolor_code\s*:/.test(line)) {
      errors.push(`${at}  hard-coded hex colour -> use a token  (${line.trim().slice(0, 70)})`);
    }
    if (isCss) {
      if (/border-radius:[^;]*\d+(\.\d+)?px/.test(line)) errors.push(`${at}  raw px border-radius -> var(--radius-*)`);
      if (/font-size:\s*[\d.]+(rem|px|em)/.test(line)) errors.push(`${at}  raw font-size -> var(--text-*)`);
      if (/z-index:\s*-?\d/.test(line) && !/z-index:\s*(-?[0-5])\s*;/.test(line)) errors.push(`${at}  raw z-index -> var(--z-*)`);
    }
  });
}

if (errors.length) {
  console.error(`design-token check FAILED (${errors.length})\n` + errors.slice(0, 60).join('\n'));
  if (errors.length > 60) console.error(`... +${errors.length - 60} more`);
  process.exit(1);
}
console.log(`design-token check passed (${files.length} files, ${defined.size} tokens/custom properties)`);
