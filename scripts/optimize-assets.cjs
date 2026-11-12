// Build-time only; the website has no npm/runtime dependencies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('./tooling.cjs')('sharp');
const { woff2 } = require('./tooling.cjs')('fonteditor-core');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
(async () => {
  fs.mkdirSync('ASSETS/optimized', { recursive: true });
  fs.mkdirSync('ASSETS/fonts', { recursive: true });
  const manifest = { images: {}, fonts: {} };
  const html = fs.readFileSync('index.html', 'utf8');
  const sources = [...new Set([...html.matchAll(/<img[^>]+src="(ASSETS\/[^"?]+\.(?:png|jpg))"/g)].map(m => m[1]))];
  for (const src of sources) {
    const input = fs.readFileSync(decodeURI(src));
    const meta = await sharp(input).metadata();
    const widths = [...new Set([480, 768, 1024, meta.width].filter(w => w <= meta.width))];
    const variants = [];
    for (const width of widths) {
      const output = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 }).toBuffer();
      if (output.length >= input.length) continue;
      const name = `ASSETS/optimized/${path.parse(src).name}-${width}-${digest(output)}.webp`;
      fs.writeFileSync(name, output);
      variants.push({ width, src: name, bytes: output.length });
    }
    if (!variants.some(v => v.width === meta.width)) variants.push({ width: meta.width, src, bytes: input.length });
    manifest.images[src] = { width: meta.width, height: meta.height, originalBytes: input.length, variants };
    console.log(`${src}: ${input.length} -> ${variants.at(-1).bytes} bytes (full size, lossless)`);
  }
  await woff2.init();
  for (const name of fs.readdirSync('ASSETS').filter(n => n.endsWith('.otf'))) {
    const input = fs.readFileSync(`ASSETS/${name}`);
    // Compress original SFNT/CFF tables directly; never convert outlines or subset glyphs.
    const output = Buffer.from(woff2.encode(input));
    const destination = `ASSETS/fonts/${path.parse(name).name}-${digest(output)}.woff2`;
    fs.writeFileSync(destination, output);
    manifest.fonts[name] = destination;
    console.log(`${name}: ${input.length} -> ${output.length} bytes`);
  }
  fs.writeFileSync('scripts/assets-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
})();
