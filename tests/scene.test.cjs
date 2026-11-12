const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const harness = require('./scene-harness.cjs');
const source = fs.readFileSync(path.join(__dirname, '../js/hero-scene.js'), 'utf8');
for (const [name, width, height] of [['desktop', 1350, 940], ['mobile', 390, 844]]) {
  test(`worker scene preserves original ${name} geometry, lighting, materials, movement, scroll and drag`, async () => {
    const h = harness(width, height); await h.load(source); h.start();
    for (let i = 0; i < 120; i++) h.step();
    const states = [h.snapshot()];
    h.progress(.55); for (let i = 0; i < 30; i++) h.step(); states.push(h.snapshot());
    h.drag(); for (let i = 0; i < 30; i++) h.step(); states.push(h.snapshot());
    assert.deepEqual(JSON.parse(JSON.stringify(states)), JSON.parse(fs.readFileSync(path.join(__dirname, `scene-original-${name}.json`), 'utf8')));
  });
}
