// The scene in SVG, shadow-puppet style: paper layers at sunset, a pyramid, a dark ramp at the
// chosen slope, a block on its sledge and the workers hauling it. Design box 860×720.
const GROUND = 560,
  TOP = { x: 568, y: 400 };
const SVGNS = 'http://www.w3.org/2000/svg';
const worker = (x, y, a, i) =>
  `<g transform="translate(${x} ${y}) rotate(${a}) scale(${i % 3 === 1 ? 0.95 : 1})">
     <circle cx="${i % 2 ? 1 : -1}" cy="-34" r="6"/>
     <path d="M2,-28 L-7,-8 L-12,10 L-7,10 L-2,-3 L3,10 L8,10 L4,-8 L5,-26 Z"/>
     <path d="M3,-22 L-14,-14 L-13,-11 L3,-17 Z"/>
   </g>`;

function sceneSvg({ slope, sand, workers }) {
  const a = (slope * Math.PI) / 180;
  const run = (GROUND - TOP.y) / Math.tan(a);
  const foot = { x: TOP.x - run, y: GROUND };
  const along = (t) => ({ x: TOP.x - run * t, y: TOP.y + (GROUND - TOP.y) * t });
  const deg = -slope;
  // Block well down the ramp; the workers ahead of it, up the slope.
  // Keep the block on screen: at gentle slopes most of the ramp runs off to the left.
  const at = Math.min(0.55, ((TOP.x - 70) / run) * 0.92),
    block = along(at);
  const shown = Math.min(workers, 14);
  const gap = Math.min(0.03, (at - 0.1) / shown);
  const crew = Array.from({ length: shown }, (_, i) => {
    const p = along(at - 0.07 - i * gap);
    return worker(p.x, p.y, deg, i);
  }).join('');
  const lead = along(at - 0.07 - (shown - 1) * gap);
  const struts = Array.from({ length: 30 }, (_, i) => {
    const p = along(i / 30);
    return `<line x1="${p.x}" y1="${p.y + 6}" x2="${p.x}" y2="${GROUND}" />`;
  }).join('');
  const courses = Array.from({ length: 13 }, (_, i) => {
    const y = GROUND - 22 * (i + 1),
      half = ((GROUND - y) / 310) * 190;
    return `<line x1="${470 + half}" y1="${y}" x2="${850 - half}" y2="${y}" />`;
  }).join('');
  const water =
    sand === 'wet'
      ? `<g fill="#7fb7d8">${[0, 1, 2].map((i) => `<ellipse cx="${block.x + 34 + i * 7}" cy="${block.y - 14 + i * 6}" rx="3" ry="5"/>`).join('')}</g>
         <path d="M${block.x + 8},${block.y - 6} q 40 6 60 -4" stroke="#7fb7d8" stroke-width="4" fill="none" opacity="0.8"/>`
      : '';
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffcf8a"/><stop offset="0.55" stop-color="#f4945a"/><stop offset="1" stop-color="#d9603f"/>
    </linearGradient>
    <filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#4a1e08" flood-opacity="0.45"/></filter>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/>
      <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0 0.05  0 0 0 0.09 0"/></filter>
    <clipPath id="frame"><rect width="860" height="720"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="860" height="720" fill="url(#sky)"/>
    <circle cx="200" cy="170" r="72" fill="#ffe7b3" opacity="0.92"/>
    <path filter="url(#lift)" fill="#eaa45c" d="M0,470 C120,420 230,450 330,430 C450,405 560,440 860,410 L860,720 L0,720 Z"/>
    <g filter="url(#lift)">
      <polygon fill="#b8622e" points="470,${GROUND} 660,250 660,${GROUND}"/>
      <polygon fill="#cf8247" points="660,250 850,${GROUND} 660,${GROUND}"/>
      <g stroke="#8f4a20" stroke-width="2" opacity="0.6">${courses}</g>
    </g>
    <path filter="url(#lift)" fill="#9a5226" d="M0,${GROUND} L860,${GROUND} L860,720 L0,720 Z"/>
    <g id="ramp-shape" filter="url(#lift)">
      <polygon fill="#2b1b10" points="${TOP.x},${TOP.y} ${TOP.x + 14},${TOP.y + 6} ${TOP.x + 14},${GROUND} ${foot.x},${GROUND}"/>
      <g stroke="#5b3a22" stroke-width="3">${struts}</g>
    </g>
    <g fill="#2b1b10" filter="url(#lift)">
      <line x1="${block.x}" y1="${block.y - 14}" x2="${lead.x}" y2="${lead.y - 18}" stroke="#2b1b10" stroke-width="3"/>
      <g transform="translate(${block.x} ${block.y}) rotate(${deg})">
        <rect x="-30" y="-46" width="60" height="40" rx="3"/>
        <rect x="-36" y="-8" width="72" height="6" rx="3"/>
      </g>
      ${crew}
    </g>
    ${water}
    <rect width="860" height="720" filter="url(#paper)" opacity="1"/>
  </g>`;
}
