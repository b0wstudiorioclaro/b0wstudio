/* The same scene runs here or on the main thread; only the display host changes. */
const suffix = self.location.search;
self.window = self;
importScripts(`vendor/three-0.128.0.min.js${suffix}`, `symbol.js${suffix}`, `hero-scene.js${suffix}`);
let surface, api;
const pointers = new Map();
let resize = () => {}, visibility = () => {};
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      surface = {
        ...data, THREE: self.THREE, points: self.BOW_SYMBOL,
        makeCanvas: () => new OffscreenCanvas(1, 1),
        onReady(value) { api = value; if (data.started) api.start(); api.setProgress(data.progress || 0); },
        onResize(fn) { resize = fn; }, onVisibility(fn) { visibility = fn; },
        onPointer(name, fn) { pointers.set(name, fn); },
        setCursor(grab, grabbing) { self.postMessage({ type: 'cursor', grab, grabbing }); },
        capture(pointerId) { self.postMessage({ type: 'capture', pointerId }); }
      };
      await self.createBOWScene(surface);
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'resize') {
      const changed = surface.bounds.width !== data.bounds.width || surface.bounds.height !== data.bounds.height;
      surface.bounds = data.bounds;
      if (changed) resize();
    }
    else if (data.type === 'visibility') { surface.visible = data.visible; visibility(); }
    else if (data.type === 'start') { api?.start(); }
    else if (data.type === 'progress') { api?.setProgress(data.value); }
    else if (data.type === 'pointer') { pointers.get(data.name)?.(data.event); }
  } catch {
    self.postMessage({ type: 'error' });
  }
};
self.postMessage({ type: 'available', supported: typeof OffscreenCanvas !== 'undefined' && typeof requestAnimationFrame === 'function' });
