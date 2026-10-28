// The pizzas in SVG, crayon style: wobbly edges from a turbulence filter, hatched fills and a
// paper grain. Taken slices slide out a little. Same values, same picture.
const TAU = Math.PI * 2;
const at = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function slicePath(cx, cy, r, a0, a1) {
  const [x0, y0] = at(cx, cy, r, a0),
    [x1, y1] = at(cx, cy, r, a1);
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
}
function pizzaSvg(cx, cy, r, slices, taken, id) {
  const parts = [];
  for (let i = 0; i < slices; i++) {
    const a0 = -Math.PI / 2 + (i * TAU) / slices,
      a1 = a0 + TAU / slices,
      mid = (a0 + a1) / 2;
    const out = i < taken ? r * 0.09 : 0;
    const [dx, dy] = [Math.cos(mid) * out, Math.sin(mid) * out];
    const pep = [0.45, 0.72].map((k, j) =>
      at(cx + dx, cy + dy, r * k, mid + (j ? 0.12 : -0.1) * (12 / slices) * 0.6),
    );
    parts.push(`<g>
      <path d="${slicePath(cx + dx, cy + dy, r, a0, a1)}" fill="${i < taken ? '#ffb347' : '#ffe08a'}" stroke="#c0392b" stroke-width="5" stroke-linejoin="round"/>
      ${i < taken ? `<path d="${slicePath(cx + dx, cy + dy, r, a0, a1)}" fill="url(#hatch-${id})"/>` : ''}
      ${pep.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${Math.max(6, r * 0.07)}" fill="#e0533d"/>`).join('')}
    </g>`);
  }
  return `<g filter="url(#crayon)">
    <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="#e9a84a" stroke="#a0522d" stroke-width="5"/>
    ${parts.join('')}</g>`;
}
function boardSvg({ slices, taken }) {
  return `
  <defs>
    <filter id="crayon"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2"/>
      <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0.16 0"/></filter>
    <pattern id="hatch-a" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#e0533d" stroke-width="4" opacity="0.55"/></pattern>
    <pattern id="hatch-b" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <line x1="0" y1="0" x2="0" y2="14" stroke="#3d7be0" stroke-width="4" opacity="0.5"/></pattern>
  </defs>
  <rect width="860" height="720" fill="#fff8e6"/>
  <g filter="url(#crayon)" fill="none" stroke-width="5" stroke-linecap="round">
    <path d="M60,90 l18,-34 l18,34 l-36,-22 l36,0 z" stroke="#f4c430"/>
    <path d="M760,620 l14,-26 l14,26 l-28,-17 l28,0 z" stroke="#7fc8a9"/>
    <path d="M70,640 q30,-40 60,0 t60,0" stroke="#9fb8ff"/>
  </g>
  <g id="pizza-shape">${pizzaSvg(310, 360, 220, slices, Math.min(taken, slices), 'a')}</g>
  <g id="half-shape">${pizzaSvg(700, 250, 105, 2, 1, 'b')}</g>
  <rect width="860" height="720" filter="url(#grain)"/>`;
}
