// Keep inline bootstrap hashes in sync. No unsafe-inline/eval in script-src.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
for (const filename of ['index.html', '404.html']) {
  let html = fs.readFileSync(filename, 'utf8');
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${createHash('sha256').update(m[1].replace(/\r\n/g, '\n')).digest('base64')}'`);
  const policy = `default-src 'none'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://formsubmit.co; worker-src 'self'; base-uri 'none'; object-src 'none'; form-action https://formsubmit.co; upgrade-insecure-requests`;
  html = html.replace(/(<meta http-equiv="Content-Security-Policy" content=")[^"]+/, `$1${policy}`);
  fs.writeFileSync(filename, html);
}
