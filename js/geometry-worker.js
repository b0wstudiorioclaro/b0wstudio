/* Build the unchanged extrusion away from the UI thread. */
self.window = self;
importScripts('vendor/three-0.128.0.min.js', `symbol.js${self.location.search}`);
self.onmessage = () => {
  const points = self.BOW_SYMBOL;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  points.forEach(p => p.forEach(([x, y]) => {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, scale = 4.2 / (x1 - x0);
  const shapes = points.map(p => {
    const shape = new THREE.Shape();
    p.forEach(([x, y], i) => shape[i ? 'lineTo' : 'moveTo']((x - cx) * scale, -(y - cy) * scale));
    return shape;
  });
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth: .5, bevelEnabled: true, bevelThickness: .045, bevelSize: .035, bevelSegments: 4, curveSegments: 1 });
  geometry.translate(0, 0, -.25); geometry.computeVertexNormals();
  const attributes = Object.fromEntries(Object.entries(geometry.attributes).map(([name, attribute]) => [name, { array: attribute.array, itemSize: attribute.itemSize }]));
  self.postMessage({ attributes, groups: geometry.groups }, Object.values(attributes).map(a => a.array.buffer));
};
