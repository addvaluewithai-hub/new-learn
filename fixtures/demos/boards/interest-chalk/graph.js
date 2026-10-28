// 1000 at a yearly rate for up to 30 years: simple interest is a straight line, compound
// interest curves away from it. The marker at `years` shows both values and the gap.
const COLORS = {
  chalk: '#f4f1e8',
  simple: '#cfe8ff',
  compound: '#ffe066',
  gap: '#f48fb1',
  dim: '#93a39c',
};
const PRINCIPAL = 1000;
const simpleAt = (rate, n) => PRINCIPAL * (1 + (rate / 100) * n);
const compoundAt = (rate, n) => PRINCIPAL * Math.pow(1 + rate / 100, n);
/** A round top for the money axis, so the curve fills most of the height. */
const niceMax = (v) => {
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (step / 2)) * (step / 2);
};
const GRAPH = {
  landscape: { x0: 130, x1: 800, y0: 610, y1: 120 },
  portrait: { x0: 120, x1: 660, y0: 640, y1: 150 },
};

function drawGraph(ch, { rate, years, layout, lang, p }) {
  const G = GRAPH[layout] ?? GRAPH.landscape;
  const fmt = new Intl.NumberFormat(lang === 'en' ? 'en' : 'ar-EG', { maximumFractionDigits: 0 });
  const top = niceMax(compoundAt(rate, 30));
  const X = (n) => G.x0 + ((G.x1 - G.x0) * n) / 30;
  const Y = (v) => G.y0 - ((G.y0 - G.y1) * v) / top;
  ch.board();
  // Axes, ticks and labels.
  ch.arrow([G.x0, G.y0], [G.x1 + 34, G.y0], 1, { width: 4 });
  ch.arrow([G.x0, G.y0], [G.x0, G.y1 - 40], 1, { width: 4 });
  for (let n = 5; n <= 30; n += 5) {
    ch.stroke(ch.curve([X(n), G.y0 - 8], [X(n), G.y0 + 8], null, 4), 1, { width: 3 });
    ch.write(fmt.format(n), X(n), G.y0 + 44, 1, { size: 26, align: 'center', color: COLORS.dim });
  }
  for (const v of [top / 2, top]) {
    ch.stroke(ch.curve([G.x0 - 8, Y(v)], [G.x0 + 8, Y(v)], null, 4), 1, { width: 3 });
    ch.write(fmt.format(v), G.x0 - 16, Y(v) + 9, 1, {
      size: 24,
      align: 'right',
      color: COLORS.dim,
    });
  }
  const words =
    lang === 'en' ? { years: 'years', money: 'money' } : { years: 'السنين', money: 'الفلوس' };
  ch.write(words.years, G.x1 + 34, G.y0 - 22, 1, { size: 26, align: 'right', color: COLORS.dim });
  ch.write(words.money, G.x0 + 14, G.y1 - 52, 1, { size: 26, align: 'left', color: COLORS.dim });
  // The whole 30 years, faint: where each line is heading.
  const path = (f, to) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const n = (to * i) / 60;
      pts.push([X(n) + 1.5 * Math.sin(i * 0.7), Y(f(rate, n)) + 1.5 * Math.sin(i * 1.3)]);
    }
    return pts;
  };
  ch.stroke(path(simpleAt, 30), 1, { width: 2, color: '#5d6f68' });
  ch.stroke(path(compoundAt, 30), 1, { width: 2, color: '#6f6a45' });
  // Up to `years`, bright and drawn by the pen.
  if (years > 0) {
    ch.stroke(path(simpleAt, years), p, { width: 6, color: COLORS.simple });
    ch.stroke(path(compoundAt, years), p, { width: 6, color: COLORS.compound });
  }
  ch.flush();
  if (p < 1 || years === 0) return;
  // The marker: both values at `years`, and the gap between them.
  const s = simpleAt(rate, years),
    c = compoundAt(rate, years);
  const x = X(years);
  ch.stroke(ch.curve([x, G.y0], [x, Y(c) - 16], null, 20), 1, { width: 2, color: COLORS.dim });
  ch.dot(x, Y(s), 9, COLORS.simple);
  ch.dot(x, Y(c), 9, COLORS.compound);
  if (Y(s) - Y(c) > 26) {
    const bx = x + (x > G.x1 - 120 ? -22 : 22);
    ch.stroke(ch.curve([bx, Y(c)], [bx, Y(s)], null, 12), 1, { width: 4, color: COLORS.gap });
    ch.write(`+${fmt.format(c - s)}`, bx + (x > G.x1 - 120 ? -12 : 12), (Y(s) + Y(c)) / 2 + 10, 1, {
      size: 30,
      bold: true,
      color: COLORS.gap,
      align: x > G.x1 - 120 ? 'right' : 'left',
    });
  }
  ch.flush();
}
