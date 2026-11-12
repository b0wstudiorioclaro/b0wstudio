/* B0w Studio logo 3D da hero (Three.js).
   Padrão: diagonal de 45°, girando de lado em loop. Mouse EM CIMA da logo: clique = pulo, arrastar = gira na mão.
   Saiu do mouse: volta ao padrão. */
(async () => {
  const TILT_Z = 45, TILT_X = 10, SPIN = .55;
  const hero = document.querySelector('.bow-hero'), canvas = document.getElementById('hero-3d');
  if (!hero || !canvas || !window.THREE || !window.BOW_SYMBOL) return;
  const standalone404 = hero.classList.contains('error-visual');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = standalone404, P = 0;
  window.BOWHero = { start() { started = true; }, setProgress(v) { P = v; } };
  const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));
  // Identical geometry, transferred from a worker without copying the buffers.
  const geometryReady = new Promise(resolve => {
    let worker;
    const finish = value => { clearTimeout(timeout); worker?.terminate(); resolve(value); };
    const timeout = setTimeout(() => finish(null), 10000);
    try {
      const scriptURL = new URL(document.currentScript.src);
      const workerURL = new URL('geometry-worker.js', scriptURL);
      workerURL.search = scriptURL.search;
      worker = new Worker(workerURL);
      worker.onmessage = event => finish(event.data);
      worker.onerror = () => finish(null);
      worker.postMessage({ build: true });
    } catch { finish(null); }
  });
  await yieldToBrowser();

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); hero.insertAdjacentHTML('afterbegin', '<img class="bh-fallback" src="ASSETS/SIMBOLO%20BOW%20BRANCA.svg" alt="">'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.z = 14;

  await yieldToBrowser();

  (() => { // estúdio claro -> reflexos no preto polido
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#f2f4f8'); gr.addColorStop(.55, '#9a9fa8'); gr.addColorStop(1, '#2a2b2e');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    [[60, 30, 90, 400, '#fff'], [300, 0, 30, 512, '#fff'], [470, 60, 240, 50, '#fff'], [780, 20, 120, 430, '#fff'], [140, 250, 200, 14, '#111'], [620, 300, 260, 24, '#111'], [940, 120, 40, 300, '#111']]
      .forEach(([x, y, w, h, col]) => { g.fillStyle = col; g.fillRect(x, y, w, h); });
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose();
  })();
  scene.add(new THREE.AmbientLight(0xffffff, .25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(6, -2, -5); scene.add(rim);

  // símbolo extrudado a partir do SVG real
  const pts = window.BOW_SYMBOL; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  pts.forEach((p) => p.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, K = 4.2 / (x1 - x0);
  const shapes = pts.map((p) => { const s = new THREE.Shape(); p.forEach(([x, y], i) => { const X = (x - cx) * K, Y = -(y - cy) * K; i ? s.lineTo(X, Y) : s.moveTo(X, Y); }); return s; });
  const built = await geometryReady;
  let geo;
  if (built) {
    geo = new THREE.BufferGeometry();
    Object.entries(built.attributes).forEach(([name, value]) => geo.setAttribute(name, new THREE.BufferAttribute(value.array, value.itemSize)));
    geo.groups = built.groups;
  } else {
    // Retain the original path if workers are unavailable.
    await yieldToBrowser();
    geo = new THREE.ExtrudeGeometry(shapes, { depth: .5, bevelEnabled: true, bevelThickness: .045, bevelSize: .035, bevelSegments: 4, curveSegments: 1 });
    geo.translate(0, 0, -.25); geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0x0c0c0e, metalness: .9, roughness: .2, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.25 }));

  // pitch > giro lateral (Y) > inclinação diagonal (Z) > logo
  const group = new THREE.Group(), pitch = new THREE.Group(), spin = new THREE.Group(), tilt = new THREE.Group();
  pitch.rotation.x = THREE.MathUtils.degToRad(TILT_X); tilt.rotation.z = THREE.MathUtils.degToRad(TILT_Z);
  tilt.add(mesh); spin.add(tilt); pitch.add(spin); group.add(pitch); scene.add(group);

  // sombra de contato logo abaixo
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sg = sc.getContext('2d');
  const rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, 'rgba(0,0,0,.6)'); rg.addColorStop(.5, 'rgba(0,0,0,.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.position.z = -.4; shadow.renderOrder = -1; scene.add(shadow);

  // área de clique (esfera invisível)
  const hit = new THREE.Mesh(new THREE.SphereGeometry(2.35, 16, 16), new THREE.MeshBasicMaterial({ visible: false })); pitch.add(hit);

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.position.z, vw = vh * camera.aspect;
    const portrait = w < 820 || w / h < .95, box = 4.7;
    const size = standalone404 ? Math.min(vw * .7, vh * .7) : portrait ? Math.min(vw * .78, vh * .36) : Math.min(vw * .44, vh * .74), U = group.userData;
    U.s = size / box; U.size = size; U.vw = vw; U.vh = vh;
    U.x = standalone404 ? 0 : portrait ? 0 : vw * .245; U.y = standalone404 ? vh * .06 : portrait ? vh * .2 : -vh * .01;
  }
  new ResizeObserver(resize).observe(hero); resize();

  /* ---- interação: só quando o mouse está EM CIMA da logo ---- */
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(), clampN = (v, a, b) => Math.min(b, Math.max(a, v));
  let hover = false, dragging = false, moved = 0, downAt = 0, lx = 0, ly = 0, vel = 0, pitchOff = 0, spinBase = 0, spd = 1, jumpT = -1, intro = 0;
  const cur = () => { hero.classList.toggle('is-grab', hover && !dragging); hero.classList.toggle('is-grabbing', dragging); };
  const over = (e) => { const r = hero.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); ray.setFromCamera(m2, camera); return ray.intersectObject(hit).length > 0; };
  hero.addEventListener('pointermove', (e) => {
    if (dragging) { const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy); spinBase += dx * .009; vel = dx * .009 / .016; pitchOff = clampN(pitchOff + dy * .005, -.6, .6); }
    else hover = over(e);
    cur();
  });
  hero.addEventListener('pointerdown', (e) => {
    if (!started || !over(e)) return;
    dragging = true; hover = true; moved = 0; lx = e.clientX; ly = e.clientY; downAt = performance.now(); vel = 0;
    try { hero.setPointerCapture(e.pointerId); } catch (_) {} cur();
  });
  const release = (e) => { if (!dragging) return; dragging = false; if (moved < 6 && performance.now() - downAt < 350) jumpT = 0; hover = over(e); cur(); };
  hero.addEventListener('pointerup', release); hero.addEventListener('pointercancel', release);
  hero.addEventListener('pointerleave', () => { if (!dragging) { hover = false; cur(); } });

  /* ---- API para o site (intro depois do preloader + parallax do scroll) ---- */
  setTimeout(() => { started = true; }, 6000);                    // segurança caso não haja preloader

  const clock = new THREE.Clock(); let visible = true, frame = 0, warmed = false;
  const syncLoop = () => {
    cancelAnimationFrame(frame); frame = 0;
    clock.getDelta();
    if (visible && !document.hidden) frame = requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', syncLoop);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); }).observe(hero);

  function loop() {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    if (started) intro = Math.min(1, intro + dt * .75); const e = 1 - Math.pow(1 - intro, 3);

    const target = dragging ? 0 : hover ? .35 : 1; spd += (target - spd) * (1 - Math.exp(-dt * 5));
    spinBase += dt * (reduce ? SPIN * .25 : SPIN) * (1 + (1 - e) * 3) * spd * (1 + P * 1.5);
    if (!dragging) { spinBase += vel * dt; vel *= Math.exp(-dt * 3); pitchOff *= Math.exp(-dt * 4); }

    let hop = 0, kick = 0;
    if (jumpT >= 0) { jumpT += dt / .8; const t = Math.min(jumpT, 1); hop = Math.sin(Math.PI * t); kick = (1 - Math.pow(1 - t, 3)) * Math.PI * 2; if (jumpT >= 1) jumpT = -1; }

    spin.rotation.y = spinBase + kick;
    pitch.rotation.x = THREE.MathUtils.degToRad(TILT_X + P * 18) + pitchOff;
    const U = group.userData, rise = P * U.vh * .24;
    group.scale.setScalar(U.s * (.7 + .3 * e) * (1 - P * .18));
    group.position.set(U.x, U.y + rise + hop * U.size * .3 + (reduce ? 0 : Math.sin(clock.elapsedTime * .9) * .06), 0);

    const lift = (group.position.y - U.y - rise) / U.size, k = .3 + .7 * Math.abs(Math.cos(spin.rotation.y)), fade = Math.max(.35, 1 - lift * 1.6);
    shadow.position.set(U.x, U.y + rise - U.size * .6, -.4);
    shadow.scale.set(U.size * .85 * k * Math.max(.45, 1 - lift * 1.6) * (.7 + .3 * e) * (1 - P * .2), U.size * .13, 1);
    shadow.material.opacity = .85 * e * fade * (1 - P * .8);
    // The preloader is opaque. Keep the simulation in sync without redrawing
    // an invisible canvas; retain full frame rate as soon as the hero starts.
    if (started || !warmed) { renderer.render(scene, camera); warmed = true; }
  }
  syncLoop();
})();
