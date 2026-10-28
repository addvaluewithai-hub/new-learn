// An old sea chart on parchment, in canvas 2D: water-lined coasts, a graticule, a compass rose
// and the two routes. `p` is how much of the chosen route is drawn (the pen and the ship).
const VIEW = { lon: [-20, 125], lat: [-40, 60] };
const INK = '#5a3b22';
const project =
  (box) =>
  ([lon, lat]) => [
    box.x + ((lon - VIEW.lon[0]) / (VIEW.lon[1] - VIEW.lon[0])) * box.w,
    box.y + ((VIEW.lat[1] - lat) / (VIEW.lat[1] - VIEW.lat[0])) * box.h,
  ];
function pathOf(g, pts) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}
function parchment(g, w, h) {
  g.fillStyle = '#e9d8b0';
  g.fillRect(0, 0, w, h);
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 30; i++) {
    const x = rnd() * w,
      y = rnd() * h,
      r = 60 + rnd() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(150,105,55,${0.04 + rnd() * 0.06})`);
    gr.addColorStop(1, 'rgba(150,105,55,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const edge = g.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  );
  edge.addColorStop(0, 'rgba(110,70,30,0)');
  edge.addColorStop(1, 'rgba(110,70,30,0.32)');
  g.fillStyle = edge;
  g.fillRect(0, 0, w, h);
}
function compass(g, cx, cy, r) {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8,
      long = i % 4 === 0,
      len = long ? r * 1.25 : i % 2 ? r * 0.55 : r * 0.85;
    g.fillStyle = i % 2 ? '#c9a46b' : INK;
    g.beginPath();
    g.moveTo(Math.cos(a) * len, Math.sin(a) * len);
    g.lineTo(Math.cos(a + 0.18) * r * 0.18, Math.sin(a + 0.18) * r * 0.18);
    g.lineTo(Math.cos(a - 0.18) * r * 0.18, Math.sin(a - 0.18) * r * 0.18);
    g.closePath();
    g.fill();
  }
  g.restore();
}
function routeLine(g, pts, upTo, style) {
  g.save();
  g.strokeStyle = style.color;
  g.lineWidth = style.width;
  g.setLineDash(style.dash);
  g.lineCap = 'round';
  g.beginPath();
  let left = upTo,
    tip = pts[0];
  g.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [x0, y0] = pts[i - 1],
      [x1, y1] = pts[i],
      len = Math.hypot(x1 - x0, y1 - y0);
    const k = Math.min(1, left / len);
    tip = [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    g.lineTo(...tip);
    left -= len;
  }
  g.stroke();
  g.restore();
  return tip;
}
const lengthOf = (pts) =>
  pts.slice(1).reduce((n, [x, y], i) => n + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);
function ship(g, [x, y]) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#7a2a18';
  g.beginPath();
  g.moveTo(-16, -2);
  g.lineTo(16, -2);
  g.lineTo(10, 7);
  g.lineTo(-10, 7);
  g.closePath();
  g.fill();
  g.fillStyle = '#f4ead2';
  g.strokeStyle = INK;
  g.beginPath();
  g.moveTo(0, -22);
  g.lineTo(11, -4);
  g.lineTo(0, -4);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

function drawChart(g, box, size, { route, p }) {
  const P = project(box);
  parchment(g, size[0], size[1]);
  // Graticule and a frame.
  g.strokeStyle = 'rgba(90,59,34,0.18)';
  g.lineWidth = 1;
  for (let lon = -20; lon <= 120; lon += 20) {
    g.beginPath();
    g.moveTo(...P([lon, VIEW.lat[0]]));
    g.lineTo(...P([lon, VIEW.lat[1]]));
    g.stroke();
  }
  for (let lat = -40; lat <= 60; lat += 20) {
    g.beginPath();
    g.moveTo(...P([VIEW.lon[0], lat]));
    g.lineTo(...P([VIEW.lon[1], lat]));
    g.stroke();
  }
  // Water lines round every coast, then the land, then its ink outline.
  const lands = Object.values(LAND).map((pts) => pts.map(P));
  g.save();
  g.beginPath();
  g.rect(box.x, box.y, box.w, box.h);
  g.clip();
  for (const [width, alpha] of [
    [22, 0.05],
    [14, 0.07],
    [7, 0.1],
  ]) {
    g.strokeStyle = `rgba(70,95,110,${alpha})`;
    g.lineWidth = width;
    g.lineJoin = 'round';
    lands.forEach((pts) => (pathOf(g, pts), g.stroke()));
  }
  g.fillStyle = '#dcc595';
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  lands.forEach((pts) => (pathOf(g, pts), g.fill(), g.stroke()));
  g.fillStyle = '#e4d3aa';
  Object.values(WATER).forEach((pts) => (pathOf(g, pts.map(P)), g.fill(), g.stroke()));
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.strokeRect(box.x, box.y, box.w, box.h);
  compass(g, ...P([-9, -24]), Math.min(box.w, box.h) * 0.07);
  // The other route faint, the chosen one drawn by the pen with the ship at its tip.
  const other = ROUTES[route === 'suez' ? 'cape' : 'suez'].path.map(P);
  routeLine(g, other, lengthOf(other), { color: 'rgba(90,59,34,0.45)', width: 2.5, dash: [4, 8] });
  const chosen = ROUTES[route].path.map(P);
  const tip = routeLine(g, chosen, lengthOf(chosen) * p, {
    color: '#8e2a1a',
    width: 4.5,
    dash: [14, 8],
  });
  for (const place of [PLACES.singapore, PLACES.rotterdam]) {
    const [x, y] = P(place);
    g.fillStyle = '#8e2a1a';
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    g.fill();
  }
  ship(g, tip);
  return P;
}
