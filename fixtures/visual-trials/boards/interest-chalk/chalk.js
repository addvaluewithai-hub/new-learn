// Chalk on a blackboard, drawn stroke by stroke. Shapes and wobble adapted from khan-explainer
// by Haider Farooq (MIT, github.com/haiderfarooq3/khan-explainer): wobble comes from sin(),
// never Math.random, so the same values always draw the same picture.
const Chalk = (canvas) => {
  const g = canvas.getContext('2d');
  let W = canvas.width,
    H = canvas.height;
  // Chalk is drawn on its own layer, then speckled by a fixed noise mask, then laid on the board.
  const layer = document.createElement('canvas');
  const lg = layer.getContext('2d');
  const noise = document.createElement('canvas');
  const lcg = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const resize = (w, h) => {
    W = canvas.width = layer.width = noise.width = w;
    H = canvas.height = layer.height = noise.height = h;
    const n = noise.getContext('2d'),
      img = n.createImageData(w, h),
      d = img.data,
      rnd = lcg(7);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 0;
      d[i + 3] = rnd() < 0.22 ? 150 + rnd() * 105 : 0;
    }
    n.putImageData(img, 0, 0);
  };
  /** The board: dark slate with old, half-wiped smudges. */
  const board = () => {
    g.fillStyle = '#1f2b27';
    g.fillRect(0, 0, W, H);
    const rnd = lcg(3);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W,
        y = rnd() * H,
        r = 80 + rnd() * 260;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(220,230,225,${0.025 + rnd() * 0.035})`);
      gr.addColorStop(1, 'rgba(220,230,225,0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    lg.clearRect(0, 0, W, H);
  };
  /** Lay the chalk layer on the board, speckled like real chalk on slate. */
  const flush = () => {
    lg.globalCompositeOperation = 'destination-out';
    lg.drawImage(noise, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(layer, 0, 0);
    lg.clearRect(0, 0, W, H);
  };
  const curve = (a, b, ctrl, n = 40) => {
    const m = ctrl || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const amp = Math.min(2, Math.hypot(b[0] - a[0], b[1] - a[1]) / 80);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        v = 1 - u,
        w = amp * Math.sin(u * 9);
      pts.push([
        v * v * a[0] + 2 * v * u * m[0] + u * u * b[0] + w,
        v * v * a[1] + 2 * v * u * m[1] + u * u * b[1] + w,
      ]);
    }
    return pts;
  };
  /** Part p (0..1) of a path, as chalk: a soft wide pass under a bright narrow one. */
  const stroke = (pts, p = 1, o = {}) => {
    if (p <= 0 || pts.length < 2) return;
    const n = Math.max(2, Math.ceil(pts.length * p));
    for (const [width, alpha] of [
      [(o.width || 5) * 2.2, 0.18],
      [o.width || 5, 0.92],
    ]) {
      lg.strokeStyle = o.color || '#f4f1e8';
      lg.globalAlpha = alpha;
      lg.lineWidth = width;
      lg.lineCap = lg.lineJoin = 'round';
      lg.beginPath();
      lg.moveTo(...pts[0]);
      for (let i = 1; i < n; i++) lg.lineTo(...pts[i]);
      lg.stroke();
    }
    lg.globalAlpha = 1;
  };
  const arrow = (a, b, p = 1, o = {}) => {
    const pts = curve(a, b, o.ctrl);
    stroke(pts, p, o);
    if (p < 1) return;
    const e = pts[40],
      q = pts[36],
      ang = Math.atan2(e[1] - q[1], e[0] - q[0]);
    for (const d of [2.6, -2.6])
      stroke([e, [e[0] + Math.cos(ang + d) * 20, e[1] + Math.sin(ang + d) * 20]], 1, o);
  };
  /** Text in the board font, uncovered in writing order (right to left for Arabic). */
  const write = (str, x, y, p = 1, o = {}) => {
    if (p <= 0) return;
    const size = o.size || 32;
    lg.font = `${o.bold ? 600 : 400} ${size}px 'NL Sans', sans-serif`;
    lg.fillStyle = o.color || '#f4f1e8';
    const rtl = /[؀-ۿ]/.test(str);
    lg.direction = rtl ? 'rtl' : 'ltr';
    lg.textAlign = o.align || (rtl ? 'right' : 'left');
    const m = lg.measureText(str),
      full = m.width;
    const left = lg.textAlign === 'center' ? x - full / 2 : lg.textAlign === 'right' ? x - full : x;
    lg.save();
    lg.beginPath();
    const shown = full * p;
    lg.rect(rtl ? left + full - shown : left - 4, y - size * 1.2, shown + 8, size * 1.7);
    lg.clip();
    lg.fillText(str, x, y);
    lg.restore();
    lg.direction = 'ltr';
  };
  const dot = (x, y, r, color) => {
    lg.fillStyle = color;
    lg.beginPath();
    lg.arc(x, y, r, 0, Math.PI * 2);
    lg.fill();
  };
  resize(W, H);
  return {
    resize,
    board,
    flush,
    curve,
    stroke,
    arrow,
    write,
    dot,
    get size() {
      return [W, H];
    },
  };
};
