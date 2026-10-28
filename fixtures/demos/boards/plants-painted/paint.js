// Watercolour painting helpers for p5 + p5.brush (instance mode). Adapted from
// ClaudeAnimationBase by John Heibel (MIT, github.com/JohnHeibel/ClaudeAnimationBase):
// one call paints one shape with a flat wash, a watercolour fill and a tapered ink outline.
// Everything is seeded per element, so the same state always paints the same picture.
const Paint = (p) => {
  const TAU = Math.PI * 2;
  const INK = '#2B2233';
  let seed = 1;
  const jit = (a) => (p.random() * 2 - 1) * a;
  /** Reseed before each element: the picture depends only on the element's key. */
  const key = (k) => {
    let h = 2166136261 ^ seed;
    for (const c of String(k)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    p.randomSeed(h >>> 0);
    p.noiseSeed(h >>> 0);
  };
  const ell = (cx, cy, rx, ry, n = 28, j = 0, rot = 0) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      out.push([cx + Math.cos(a) * rx + jit(j), cy + Math.sin(a) * ry + jit(j)]);
    }
    return out;
  };
  const rect = (x, y, w, h, j = 0) => [
    [x + jit(j), y + jit(j)],
    [x + w / 2, y + jit(j) * 0.5],
    [x + w + jit(j), y + jit(j)],
    [x + w + jit(j) * 0.5, y + h / 2],
    [x + w + jit(j), y + h + jit(j)],
    [x + w / 2, y + h + jit(j) * 0.5],
    [x + jit(j), y + h + jit(j)],
    [x + jit(j) * 0.5, y + h / 2],
  ];
  /** A leaf: a pointed teardrop from base (x, y), length l, width w, at angle a. */
  const leaf = (x, y, l, w, a) => {
    const out = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const r = Math.sin(Math.PI * u) * w * (1 - u * 0.35);
      out.push([u * l, -r]);
    }
    for (let i = 11; i > 0; i--) {
      const u = i / 12;
      out.push([u * l, Math.sin(Math.PI * u) * w * (1 - u * 0.35) * 0.9]);
    }
    return out.map(([u, v]) => [
      x + u * Math.cos(a) - v * Math.sin(a),
      y + u * Math.sin(a) + v * Math.cos(a),
    ]);
  };
  // p5.brush loses strokes far from the origin, so each shape is drawn around its own centre.
  const centred = (pts, draw) => {
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2;
    p.push();
    p.translate(cx, cy);
    draw(pts.map(([x, y]) => [x - cx, y - cy]));
    p.pop();
  };
  /** One painted shape: { wash, fill, ink (null for none), sw, curv }. */
  const shape = (pts, o = {}) =>
    centred(pts, (P) => {
      if (o.wash || o.fill) {
        if (o.wash) brush.wash(o.wash, o.washOp ?? 255);
        else brush.noWash();
        if (o.fill) {
          brush.fill(o.fill, o.fillOp ?? 170);
          brush.fillBleed(o.bleed ?? 0.1);
          brush.fillTexture(o.tex ?? 0.4, o.border ?? 0.35);
        } else brush.noFill();
        brush.noHatch();
        brush.noStroke();
        if (o.curv) {
          brush.beginShape(o.curv);
          for (const q of P) brush.vertex(q[0], q[1]);
          brush.endShape(true);
        } else brush.polygon(P);
      }
      if (o.ink !== null) {
        brush.noWash();
        brush.noFill();
        brush.noHatch();
        brush.set(o.br || 'ink', o.ink || INK, o.sw ?? 1);
        brush.beginShape(o.curv || 0);
        for (const q of P) brush.vertex(q[0], q[1]);
        brush.endShape(true);
      }
    });
  /** A tapered ink line through the points. */
  const line = (pts, sw = 1, col = INK, br = 'ink', curv = 0.5) =>
    centred(pts, (P) => {
      brush.noFill();
      brush.noWash();
      brush.noHatch();
      brush.set(br, col, sw);
      brush.spline(P, curv);
    });
  const setup = () => {
    brush.instance(p);
    brush.scaleBrushes(3.2);
    brush.add('ink', {
      type: 'default',
      weight: 5,
      scatter: 0.25,
      sharpness: 0.8,
      grain: 40,
      opacity: 235,
      spacing: 0.2,
      pressure: [1.15, 0.75],
      rotate: 'natural',
      noise: 0.15,
    });
    brush.add('dry', {
      type: 'default',
      weight: 14,
      scatter: 3,
      sharpness: 0.3,
      grain: 6,
      opacity: 90,
      spacing: 0.6,
      pressure: [1, 0.6],
      rotate: 'natural',
      noise: 0.4,
    });
  };
  return { key, ell, rect, leaf, shape, line, setup, jit, INK, reseed: (s) => (seed = s) };
};
