// Downloads the exact existing libraries and verifies their original SRI hashes.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(await fs.readFile('scripts/vendor-manifest.json', 'utf8'));
await fs.mkdir('js/vendor', { recursive: true });
await fs.mkdir('ASSETS/fonts', { recursive: true });
for (const { url, integrity, file: destination } of manifest) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (`sha384-${createHash('sha384').update(bytes).digest('base64')}` !== integrity) throw new Error('SRI mismatch');
  await fs.writeFile(destination, bytes);
  console.log(`${destination} (${bytes.length} bytes, SRI verified)`);
}
const fontResponse = await fetch('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');
if (!fontResponse.ok) throw new Error('Font stylesheet download failed');
const css = await fontResponse.text();
const faces = [...css.matchAll(/url\('(\/\/[^']+\.woff2)'\)[\s\S]*?font-weight: (\d+);/g)];
for (const [, url, weight] of faces) {
  const response = await fetch(`https:${url}`);
  if (!response.ok) throw new Error('Font download failed');
  await fs.writeFile(`ASSETS/fonts/Satoshi-${weight}.woff2`, Buffer.from(await response.arrayBuffer()));
}
