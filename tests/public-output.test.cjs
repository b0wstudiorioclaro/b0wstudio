const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
test('HTML dependencies, accessible references, pinned vendors and CSP bootstrap hashes are valid', () => {
  for (const name of ['index.html', '404.html']) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, `${name}: duplicate IDs`);
    for (const [, attr] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) for (const id of attr.split(/\s+/)) assert.ok(ids.includes(id), `${name}: missing ${id}`);
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:|#)/.test(ref)) continue;
      assert.ok(fs.existsSync(path.resolve(root, decodeURIComponent(ref.split(/[?#]/)[0]))), `${name}: missing ${ref}`);
    }
    for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const hash = createHash('sha256').update(code.replace(/\r\n/g, '\n')).digest('base64');
      assert.ok(html.includes(`'sha256-${hash}'`));
    }
    assert.doesNotMatch(html, /script-src[^;]*(?:unsafe-inline|unsafe-eval)/);
    assert.match(html, /worker-src 'self'/);
  }
  for (const vendor of require('../scripts/vendor-manifest.json')) {
    const integrity = `sha384-${createHash('sha384').update(fs.readFileSync(path.join(root, vendor.file))).digest('base64')}`;
    assert.equal(integrity, vendor.integrity, vendor.file);
  }
});
test('static build excludes private/development files and versions executable resources', { skip: !fs.existsSync(path.join(root, 'dist/index.html')) }, () => {
  const entries = fs.readdirSync(path.join(root, 'dist'));
  assert.deepEqual(entries.sort(), ['.nojekyll', '404.html', 'ASSETS', 'CNAME', 'css', 'index.html', 'js'].sort());
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  for (const [, ref] of html.matchAll(/(?:src|href)="((?:js|css)\/[^" ]+)"/g)) assert.match(ref, /\?v=[a-f0-9]{12}$/);
});
