const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const original = require('./geometry-original.json');

test('worker geometry exactly matches the original positions, normals, UVs and groups', () => {
  let result, transfers;
  const scope = { THREE: require('../js/vendor/three-0.128.0.min.js') };
  scope.self = scope;
  scope.location = { search: '' };
  scope.postMessage = (value, buffers) => { result = value; transfers = buffers; };
  scope.importScripts = (...urls) => urls.filter(url => !url.includes('/vendor/') && !url.startsWith('vendor/')).forEach(url => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', url), 'utf8'), context));
  const context = vm.createContext(scope);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/geometry-worker.js'), 'utf8'), context);
  scope.onmessage();
  assert.deepEqual(JSON.parse(JSON.stringify(result.groups)), original.groups);
  for (const [name, expected] of Object.entries(original.attributes)) {
    const actual = result.attributes[name];
    assert.equal(actual.itemSize, expected.itemSize);
    assert.equal(actual.array.length, expected.length);
    assert.equal(createHash('sha256').update(Buffer.from(actual.array.buffer)).digest('hex'), expected.sha256);
    assert.ok(transfers.includes(actual.array.buffer));
  }
});
