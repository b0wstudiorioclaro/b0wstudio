const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Three = require('../js/vendor/three-0.128.0.min.js');
module.exports = function harness(width = 1350, height = 940) {
  const callbacks = new Map(), pointers = new Map();
  let frameId = 0, frameCount = 0, scene, camera, api;
  const makeCanvas = () => ({ width: 1, height: 1, getContext: () => ({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) });
  const rendererState = {};
  class Renderer {
    constructor() { Object.assign(rendererState, { renders: 0 }); }
    setPixelRatio(v) { rendererState.dpr = v; } setClearColor(color, alpha) { rendererState.clear = [color, alpha]; }
    setSize(w, h) { rendererState.size = [w, h]; }
    render(s, c) { scene = s; camera = c; scene.updateMatrixWorld(); camera.updateMatrixWorld(); rendererState.renders++; }
    set toneMapping(value) { rendererState.toneMapping = value; }
    set toneMappingExposure(value) { rendererState.exposure = value; }
    set outputEncoding(value) { rendererState.encoding = value; }
  }
  const THREE = { ...Three, WebGLRenderer: Renderer, PMREMGenerator: class { fromEquirectangular() { return { texture: new Three.Texture() }; } dispose() {} }, Clock: class { getDelta() { return 1 / 60; } get elapsedTime() { return frameCount / 60; } } };
  const hero = { clientWidth: width, clientHeight: height, classList: { contains: () => false, toggle() {} }, addEventListener: (name, fn) => pointers.set(name, fn), getBoundingClientRect: () => ({ left: 0, top: 0, width, height }), setPointerCapture() {} };
  const window = { THREE };
  const context = vm.createContext({ window, THREE, self: {}, performance: { now: () => frameCount * 1000 / 60 }, devicePixelRatio: 2,
    matchMedia: () => ({ matches: false }),
    document: { querySelector: () => hero, getElementById: makeCanvas, createElement: makeCanvas, addEventListener() {}, hidden: false },
    requestAnimationFrame: fn => { callbacks.set(++frameId, fn); return frameId; }, cancelAnimationFrame: id => callbacks.delete(id),
    setTimeout: (fn, delay) => { if (!delay) queueMicrotask(fn); return 1; }, clearTimeout() {},
    ResizeObserver: class { observe() {} }, IntersectionObserver: class { observe() {} }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/symbol.js'), 'utf8'), context);
  const surface = { THREE, points: window.BOW_SYMBOL, canvas: makeCanvas(), dpr: 2, reduce: false, standalone: false, visible: true,
    bounds: hero.getBoundingClientRect(), makeCanvas, onReady: value => { api = value; }, onResize() {}, onVisibility() {}, onPointer: (name, fn) => pointers.set(name, fn), setCursor() {}, capture() {} };
  return {
    async load(source, original = false) {
      vm.runInContext(source, context);
      if (original) api = window.BOWHero;
      else { await context.self.createBOWScene(surface); this.step(false); }
    },
    step(advance = true) { if (advance) frameCount++; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(frameCount * 1000 / 60)); },
    start() { api.start(); }, progress(value) { api.setProgress(value); },
    drag() {
      const mesh = scene.children.find(x => x.type === 'Group');
      const p = mesh.position.clone().project(camera);
      const event = { clientX: (p.x + 1) * width / 2, clientY: (1 - p.y) * height / 2, pointerId: 1 };
      pointers.get('pointerdown')(event); pointers.get('pointermove')({ ...event, clientX: event.clientX + 35, clientY: event.clientY + 20 }); pointers.get('pointerup')({ ...event, clientX: event.clientX + 35, clientY: event.clientY + 20 });
    },
    snapshot() {
      const round = value => Number(value.toFixed(9));
      const nodes = [];
      scene.traverse(node => {
        const material = node.material;
        nodes.push({ type: node.type, position: node.position.toArray().map(round), rotation: node.rotation.toArray().slice(0, 3).map(round), scale: node.scale.toArray().map(round),
          material: material && { type: material.type, color: material.color?.getHex(), metalness: material.metalness, roughness: material.roughness, clearcoat: material.clearcoat, clearcoatRoughness: material.clearcoatRoughness, envMapIntensity: material.envMapIntensity, opacity: round(material.opacity) },
          geometry: node.geometry && Object.fromEntries(Object.entries(node.geometry.attributes).map(([name,a]) => [name, crypto.createHash('sha256').update(Buffer.from(a.array.buffer)).digest('hex')])) });
      });
      const { renders, ...settings } = rendererState;
      return { settings, camera: { fov: camera.fov, aspect: camera.aspect, z: camera.position.z }, nodes };
    }
  };
};
