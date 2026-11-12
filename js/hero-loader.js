/* Keep the UI responsive while the unchanged Three.js scene renders off-thread. */
(() => {
  const hero = document.querySelector('.bow-hero');
  let canvas = document.getElementById('hero-3d');
  if (!hero || !canvas) return;
  const base = new URL(document.currentScript.src);
  const url = name => { const value = new URL(name, base); value.search = base.search; return value.href; };
  let started = hero.classList.contains('error-visual'), progress = 0;
  let worker = null, transferred = false, usingFallback = false, inView = true;
  let resizeFrame = 0, pointerFrame = 0, lastPointer = null;
  const bounds = () => {
    const rect = hero.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  };
  const send = message => worker?.postMessage(message);
  window.BOWHero = {
    start() { started = true; send({ type: 'start' }); },
    setProgress(value) { progress = value; send({ type: 'progress', value }); }
  };
  const load = (name, integrity) => new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = url(name);
    if (integrity) { script.integrity = integrity; script.crossOrigin = 'anonymous'; }
    script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
  });
  const fallback = async () => {
    if (usingFallback) return;
    usingFallback = true; clearTimeout(watchdog); worker?.terminate(); worker = null;
    if (transferred) {
      const replacement = canvas.cloneNode(false); canvas.replaceWith(replacement); canvas = replacement;
      // GSAP may have targeted the transferred element before a driver failure.
      canvas.style.opacity = '1'; canvas.style.transform = 'none';
    }
    canvas.dataset.renderer = 'main';
    try {
      if (!window.THREE) await load('vendor/three-0.128.0.min.js', 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu');
      if (!window.BOW_SYMBOL) await load('symbol.js');
      await load('hero3d.js');
      if (started) window.BOWHero?.start();
      window.BOWHero?.setProgress(progress);
    } catch {
      canvas.hidden = true;
      const image = document.createElement('img'); image.className = 'bh-fallback'; image.src = new URL('../ASSETS/SIMBOLO%20BOW%20BRANCA.svg', base).href; image.alt = '';
      hero.prepend(image);
    }
  };
  const watchdog = setTimeout(fallback, 10000);
  if (!window.Worker || !canvas.transferControlToOffscreen) { fallback(); return; }
  try { worker = new Worker(url('hero-render-worker.js')); }
  catch { fallback(); return; }
  worker.onerror = fallback;
  worker.onmessage = ({ data }) => {
    if (usingFallback) return;
    if (data.type === 'available') {
      if (!data.supported) { fallback(); return; }
      try {
        const offscreen = canvas.transferControlToOffscreen(); transferred = true;
        worker.postMessage({ type: 'init', canvas: offscreen, bounds: bounds(), dpr: devicePixelRatio || 1,
          standalone: hero.classList.contains('error-visual'), reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
          visible: inView && !document.hidden, started, progress }, [offscreen]);
      } catch { fallback(); }
    } else if (data.type === 'ready') {
      clearTimeout(watchdog); canvas.dataset.renderer = 'worker';
    } else if (data.type === 'error') fallback();
    else if (data.type === 'cursor') {
      hero.classList.toggle('is-grab', data.grab); hero.classList.toggle('is-grabbing', data.grabbing);
    } else if (data.type === 'capture') {
      try { hero.setPointerCapture(data.pointerId); } catch { /* Pointer may already be released. */ }
    }
  };
  const syncVisibility = () => send({ type: 'visibility', visible: inView && !document.hidden });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (transferred) syncVisibility(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (transferred) syncVisibility(); });
  const resize = () => {
    if (resizeFrame || !transferred || usingFallback) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; send({ type: 'resize', bounds: bounds() }); });
  };
  new ResizeObserver(resize).observe(hero);
  // Bounds also move during page scroll, even when canvas dimensions stay unchanged.
  addEventListener('scroll', resize, { passive: true });
  const pointer = event => ({ clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId });
  const flushPointer = () => {
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    if (lastPointer) { send({ type: 'pointer', name: 'pointermove', event: lastPointer }); lastPointer = null; }
  };
  for (const name of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave']) {
    hero.addEventListener(name, event => {
      if (usingFallback || !transferred || event.target.closest?.('a,button')) return;
      flushPointer();
      send({ type: 'pointer', name, event: pointer(event) });
    });
  }
  hero.addEventListener('pointermove', event => {
    if (usingFallback || !transferred) return;
    lastPointer = pointer(event);
    if (!pointerFrame) pointerFrame = requestAnimationFrame(flushPointer);
  }, { passive: true });
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    clearTimeout(watchdog); worker?.terminate(); worker = null;
  });
})();
