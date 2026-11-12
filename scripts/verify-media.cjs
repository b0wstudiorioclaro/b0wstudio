const fs = require('node:fs');
const assert = require('node:assert/strict');
const sharp = require('./tooling.cjs')('sharp');
const { woff2 } = require('./tooling.cjs')('fonteditor-core');
const manifest = require('./assets-manifest.json');
function tables(bytes) {
  const map = new Map();
  for (let i = 0; i < bytes.readUInt16BE(4); i++) {
    const entry = 12 + i * 16, name = bytes.toString('ascii', entry, entry + 4);
    const offset = bytes.readUInt32BE(entry + 8), length = bytes.readUInt32BE(entry + 12);
    map.set(name, bytes.subarray(offset, offset + length));
  }
  return map;
}
(async () => {
  let imageCount = 0;
  for (const [src, data] of Object.entries(manifest.images)) {
    const full = data.variants.find(v => v.width === data.width);
    if (full.src === src) continue;
    const [a, b] = await Promise.all([sharp(src).ensureAlpha().raw().toBuffer(), sharp(full.src).ensureAlpha().raw().toBuffer()]);
    assert.equal(a.length, b.length, `Dimensions differ: ${src}`);
    let changedVisiblePixels = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] !== b[i + 3] || (a[i + 3] !== 0 && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]))) changedVisiblePixels++;
    }
    assert.equal(changedVisiblePixels, 0, `Visible pixels differ: ${src}`); imageCount++;
  }
  await woff2.init();
  for (const [original, compressed] of Object.entries(manifest.fonts)) {
    const before = tables(fs.readFileSync(`ASSETS/${original}`));
    const after = tables(Buffer.from(woff2.decode(fs.readFileSync(compressed))));
    for (const [name, bytes] of before) {
      // WOFF2 recomputes checksumAdjustment and sets the lossless-compression flag.
      if (name === 'head') {
        const a = Buffer.from(bytes), b = Buffer.from(after.get(name)); a.fill(0, 8, 12); b.fill(0, 8, 12);
        a.writeUInt16BE(a.readUInt16BE(16) & ~0x0800, 16); b.writeUInt16BE(b.readUInt16BE(16) & ~0x0800, 16);
        assert.deepEqual(a, b, `${original}: ${name}`);
      } else assert.deepEqual(bytes, after.get(name), `${original}: ${name}`);
    }
  }
  console.log(`${imageCount} full-resolution images: pixel-identical. ${Object.keys(manifest.fonts).length} fonts: original glyphs, metrics and hinting preserved.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
