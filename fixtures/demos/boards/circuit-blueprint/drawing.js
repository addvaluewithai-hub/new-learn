// The circuit as a blueprint in SVG: grid, white technical lines, schematic symbols, a glowing
// bulb and a title block. Current: I = V / (R + 6); the bulb shows the power it gets, I²·6.
const BULB_OHMS = 6;
function circuit(volts, resistor, closed) {
  const current = closed ? volts / (resistor + BULB_OHMS) : 0;
  const power = current * current * BULB_OHMS;
  return { current, power, glow: Math.min(1, Math.sqrt(power / 13.5)) };
}

function drawingSvg({ volts, resistor, closed, glow, labels }) {
  const grid = [];
  for (let x = 0; x <= 860; x += 20)
    grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="720" class="${x % 100 ? 'g' : 'G'}"/>`);
  for (let y = 0; y <= 720; y += 20)
    grid.push(`<line x1="0" y1="${y}" x2="860" y2="${y}" class="${y % 100 ? 'g' : 'G'}"/>`);
  const cells = Math.round(volts / 1.5);
  const battery = Array.from({ length: cells }, (_, i) => {
    const y = 300 + i * 22 - (cells - 1) * 11;
    return `<line x1="104" y1="${y}" x2="156" y2="${y}" class="w"/><line x1="117" y1="${y + 9}" x2="143" y2="${y + 9}" class="w thick"/>`;
  }).join('');
  const zig = Array.from(
    { length: 7 },
    (_, i) => `${370 + i * 20},${560 + (i % 2 ? -16 : 16)}`,
  ).join(' ');
  const resistorPart = resistor
    ? `<polyline points="350,560 360,560 ${zig} 510,560" class="w" fill="none"/>`
    : `<line x1="350" y1="560" x2="510" y2="560" class="w"/>`;
  const switchArm = closed
    ? `<line x1="300" y1="160" x2="420" y2="160" class="w"/>`
    : `<line x1="300" y1="160" x2="408" y2="112" class="w"/>`;
  const flow = closed
    ? `<path d="M130,250 L130,160 L300,160 M420,160 L730,160 L730,268 M730,392 L730,560 L130,560 L130,350" class="flow" style="animation-duration:${(2.4 / Math.max(0.15, glow + 0.15)).toFixed(2)}s"/>`
    : '';
  return `
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#fff4b8" stop-opacity="${glow}"/>
    <stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs>
  <rect width="860" height="720" fill="#123a6b"/>
  <g>${grid.join('')}</g>
  <rect x="30" y="30" width="800" height="660" class="w frame" fill="none"/>
  <path d="M130,250 L130,160 L300,160 M420,160 L730,160 L730,270 M730,390 L730,560 L510,560 M350,560 L130,560 L130,350" class="w" fill="none"/>
  ${flow}
  <g>${battery}</g>
  <circle cx="300" cy="160" r="6" class="dot"/><circle cx="420" cy="160" r="6" class="dot"/>
  ${switchArm}
  ${resistorPart}
  <circle cx="730" cy="330" r="${70 + 50 * glow}" fill="url(#halo)"/>
  <g id="bulb-symbol"><circle cx="730" cy="330" r="60" class="w" fill="${glow > 0.02 ? `rgba(255,236,150,${0.25 + 0.6 * glow})` : 'none'}"/>
    <path d="M688,288 L772,372 M772,288 L688,372" class="w"/></g>
  <g class="dim"><line x1="104" y1="420" x2="156" y2="420"/><text x="130" y="470" class="t">${labels.battery}</text>
    <text x="360" y="120" class="t">${labels.switch}</text>
    <text x="430" y="630" class="t">${labels.resistor}</text>
    <text x="730" y="440" class="t">${labels.bulb}</text></g>
  <g class="block"><rect x="540" y="610" width="290" height="80" class="w" fill="#123a6b"/>
    <text x="685" y="660" class="t b">${labels.title}</text></g>`;
}
