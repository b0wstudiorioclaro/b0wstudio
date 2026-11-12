const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/hero-loader.js'), 'utf8');
function load({ supported = true } = {}) {
  const messages = [], scripts = [], timers = new Map(), frames = new Map(), listeners = new Map();
  let id = 0, worker, canvas;
  const makeCanvas = () => ({ dataset: {}, style: {}, transferControlToOffscreen: supported ? () => ({ offscreen: true }) : undefined,
    cloneNode: makeCanvas, replaceWith(value) { canvas = value; } });
  canvas = makeCanvas();
  const hero = { classList: { contains: () => false, toggle() {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }), addEventListener: (name, fn) => listeners.set(name, fn), setPointerCapture() {}, prepend() {} };
  const fallbackCalls = [];
  const window = { Worker: true, BOWHero: null };
  class Worker {
    constructor(url) { this.url = url; worker = this; }
    postMessage(value) { messages.push(value); }
    terminate() { this.terminated = true; }
  }
  const document = { currentScript: { src: 'https://example.test/js/hero-loader.js?v=abc123' }, hidden: false,
    querySelector: () => hero, getElementById: () => canvas, addEventListener() {}, createElement: () => ({}),
    head: { appendChild(script) {
      scripts.push(script.src);
      if (script.src.includes('three-')) window.THREE = {};
      if (script.src.includes('symbol.js')) window.BOW_SYMBOL = [];
      if (script.src.includes('hero3d.js')) window.BOWHero = { start: () => fallbackCalls.push('start'), setProgress: v => fallbackCalls.push(v) };
      queueMicrotask(() => script.onload());
    } }
  };
  const context = vm.createContext({ window, document, Worker, URL, devicePixelRatio: 3, matchMedia: () => ({ matches: false }),
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: key => timers.delete(key),
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: key => frames.delete(key),
    IntersectionObserver: class { observe() {} }, ResizeObserver: class { observe() {} }, addEventListener() {} });
  vm.runInContext(source, context);
  return { messages, scripts, timers, frames, window, listeners, fallbackCalls, get worker() { return worker; }, get canvas() { return canvas; }, async settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); } };
}
test('worker receives the exact viewport, DPR and queued hero state; pending drag is flushed before release', () => {
  const h = load(); h.window.BOWHero.start(); h.window.BOWHero.setProgress(.5);
  h.worker.onmessage({ data: { type: 'available', supported: true } });
  const init = h.messages.find(m => m.type === 'init');
  assert.equal(init.dpr, 3); assert.equal(init.bounds.width, 390); assert.equal(init.started, true); assert.equal(init.progress, .5);
  h.worker.onmessage({ data: { type: 'ready' } }); assert.equal(h.canvas.dataset.renderer, 'worker'); assert.equal(h.timers.size, 0);
  const event = { target: { closest: () => null }, clientX: 200, clientY: 200, pointerId: 1 };
  h.listeners.get('pointermove')(event); h.listeners.get('pointerup')(event);
  assert.deepEqual(h.messages.slice(-2).map(m => m.name), ['pointermove', 'pointerup']); assert.equal(h.frames.size, 0);
});
test('browsers without OffscreenCanvas load the existing renderer and replay start/progress', async () => {
  const h = load({ supported: false }); h.window.BOWHero.start(); h.window.BOWHero.setProgress(.4); await h.settle();
  assert.equal(h.scripts.length, 3); assert.equal(h.canvas.dataset.renderer, 'main');
  assert.deepEqual(h.fallbackCalls, ['start', .4]);
  assert.ok(h.scripts.every(url => url.startsWith('https://example.test/js/') && url.endsWith('?v=abc123')));
});
test('worker failure restores a visible canvas and starts fallback only once', async () => {
  const h = load(); h.worker.onmessage({ data: { type: 'available', supported: true } });
  const worker = h.worker; worker.onmessage({ data: { type: 'error' } }); worker.onerror(); await h.settle();
  assert.equal(worker.terminated, true); assert.equal(h.canvas.style.opacity, '1'); assert.equal(h.scripts.length, 3);
});
