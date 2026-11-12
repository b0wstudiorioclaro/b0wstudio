// Local static preview: expose only public site files, never repository or audit data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.otf': 'font/otf' };
const cache = new Map();
http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  const baseline = name.startsWith('/__baseline/');
  const release = name.startsWith('/__release/');
  if (baseline) name = name.slice('/__baseline'.length);
  if (release) name = name.slice('/__release'.length);
  if (name === '/') name = '/index.html';
  if (!/^\/(?:index\.html|404\.html|(?:css|js|ASSETS)\/[^\0]+)$/.test(name) || name.includes('..') || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404).end(); return; }
  const base = release ? path.join(root, 'dist') : baseline && !name.startsWith('/ASSETS/') ? path.join(root, '.audit/before') : root;
  const file = path.join(base, name);
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end(); return; }
    let resource = cache.get(file);
    if (!resource || resource.modified !== stat.mtimeMs) {
      const raw = fs.readFileSync(file);
      resource = { raw, gzip: /\.(?:html|js|css|svg)$/.test(file) ? zlib.gzipSync(raw) : null, modified: stat.mtimeMs, etag: `"${createHash('sha256').update(raw).digest('hex')}"` };
      cache.set(file, resource);
    }
    const compressed = resource.gzip && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const bytes = compressed ? resource.gzip : resource.raw;
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': 'public, max-age=600', ETag: resource.etag, Vary: 'Accept-Encoding' };
    if (compressed) headers['Content-Encoding'] = 'gzip';
    if (req.headers['if-none-match'] === resource.etag) { res.writeHead(304, headers).end(); return; }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end(); else res.end(bytes);
  });
}).listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173'));
