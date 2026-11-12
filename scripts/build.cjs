// Allowlisted static output: never publishes tests, reports, .git, .env or local tooling.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const esbuild = require('./tooling.cjs')('esbuild');
require('./security-policy.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in public output');
    const name = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(name); else files.push(name);
  }
}
for (const dir of ['css', 'js', 'ASSETS']) walk(dir);
files.push('index.html', '404.html', 'favicon.ico', 'CNAME');
// No recursive delete: refuse stale/unexpected files instead of removing user data.
fs.mkdirSync(output, { recursive: true });
const allowed = new Set([...files, '.nojekyll']);
function checkOutput(dir = '') {
  for (const entry of fs.readdirSync(path.join(output, dir), { withFileTypes: true })) {
    const name = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink in dist: ${name}`);
    if (entry.isDirectory()) checkOutput(name);
    else if (!allowed.has(name)) throw new Error(`Unexpected file in dist (review before publishing): ${name}`);
  }
}
checkOutput();
const prepared = new Map();
for (const name of files) {
  let bytes = fs.readFileSync(path.join(root, name));
  if (/\.(?:css|js)$/.test(name) && !name.startsWith('js/vendor/')) {
    bytes = Buffer.from(esbuild.transformSync(bytes.toString('utf8'), { loader: name.endsWith('.css') ? 'css' : 'js', minify: true, target: 'es2022', legalComments: 'inline' }).code);
  }
  prepared.set(name, bytes);
}
const hash = createHash('sha256');
for (const [name, bytes] of prepared) { hash.update(name); hash.update(bytes); }
const version = hash.digest('hex').slice(0, 12);
for (const [name, original] of prepared) {
  const destination = path.join(output, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const bytes = name.endsWith('.html')
    ? Buffer.from(original.toString('utf8').replace(/((?:src|href)="(?:css|js)\/[^"?]+)(?:\?[^"\s]*)?"/g, `$1?v=${version}"`))
    : original;
  fs.writeFileSync(destination, bytes);
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Static build ready: dist/ (${files.length} files, version ${version}).`);
