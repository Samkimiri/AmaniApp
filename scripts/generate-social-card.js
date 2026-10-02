/**
 * Generates public/og-image.png — the 1200x630 social-preview card that
 * WhatsApp, iMessage, Slack and X show when amani-app.vercel.app is
 * shared. Previously the app icon (a square) was used, which most
 * platforms crop awkwardly; a real card at the right aspect ratio is what
 * they actually want.
 *
 * Written with nothing but Node's built-in zlib: the card is flat colour
 * plus a small hand-drawn bitmap wordmark, so a full image library would
 * be a lot of dependency for very little. Kept in the repo so the card can
 * be regenerated if the palette or wording changes.
 *
 * Usage:  node scripts/generate-social-card.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const WIDTH = 1200;
const HEIGHT = 630;

const NAVY = [0x1f, 0x3a, 0x5f];
const GOLD = [0xd9, 0xb7, 0x5c];
const GOLD_LIGHT = [0xf0, 0xd6, 0x8a];

// 5x7 bitmap glyphs — only the letters the two lines actually need.
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
};
const GLYPH_W = 5;
const GLYPH_H = 7;

const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
for (let i = 0; i < WIDTH * HEIGHT; i++) {
  pixels[i * 3] = NAVY[0];
  pixels[i * 3 + 1] = NAVY[1];
  pixels[i * 3 + 2] = NAVY[2];
}

function fillRect(x, y, w, h, [r, g, b]) {
  for (let yy = Math.max(0, y); yy < Math.min(HEIGHT, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(WIDTH, x + w); xx++) {
      const o = (yy * WIDTH + xx) * 3;
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
    }
  }
}

function textWidth(text, scale, spacing) {
  return text.length * GLYPH_W * scale + (text.length - 1) * spacing;
}

function drawText(text, scale, spacing, y, color) {
  let x = Math.round((WIDTH - textWidth(text, scale, spacing)) / 2);
  for (const ch of text) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      for (let row = 0; row < GLYPH_H; row++) {
        for (let col = 0; col < GLYPH_W; col++) {
          if (glyph[row][col] === "1") {
            fillRect(x + col * scale, y + row * scale, scale, scale, color);
          }
        }
      }
    }
    x += GLYPH_W * scale + spacing;
  }
}

// Wordmark, a gold rule, then the app's own subtitle.
drawText("AMANI", 12, 30, 190, GOLD);
fillRect(Math.round((WIDTH - 120) / 2), 330, 120, 5, GOLD);
drawText("SERMON NOTES", 5, 12, 390, GOLD_LIGHT);

// ---- PNG encoding ---------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
for (let y = 0; y < HEIGHT; y++) {
  raw[y * (WIDTH * 3 + 1)] = 0; // filter: none
  pixels.copy(raw, y * (WIDTH * 3 + 1) + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // truecolour RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(__dirname, "..", "public", "og-image.png");
fs.writeFileSync(out, png);

// Sanity check: confirm the decoded image really contains drawn pixels,
// so a blank card can never be generated silently.
const decoded = zlib.inflateSync(png.slice(png.indexOf("IDAT") + 4, png.length - 12));
let distinct = 0;
for (let i = 1; i < decoded.length; i += 3) {
  if (decoded[i] !== NAVY[0] || decoded[i + 1] !== NAVY[1] || decoded[i + 2] !== NAVY[2]) distinct++;
}
console.log(`wrote public/og-image.png (${WIDTH}x${HEIGHT}, ${png.length}B, ${distinct} drawn pixels)`);
if (distinct < 1000) {
  console.error("Generated card looks blank — check the drawing code.");
  process.exit(1);
}