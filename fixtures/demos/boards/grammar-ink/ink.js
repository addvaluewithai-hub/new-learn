// The picture under the sentence, in ink: whoever is the doer holds the pen and writes on the
// other. A student writing a lesson, or (the joke) a lesson writing on a student.
const studentSvg = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="#1e1a16" stroke-width="5" fill="none" stroke-linecap="round">
    <circle cx="0" cy="-70" r="26" fill="#f6efe2"/>
    <path d="M-6,-74 h2 M10,-74 h2 M-4,-60 q6,5 12,0"/>
    <path d="M0,-44 L0,30 M0,30 L-22,82 M0,30 L22,82 M0,-28 L-30,6 M0,-28 L34,-6"/>
  </g>`;
const notebookSvg = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="#1e1a16" stroke-width="5" fill="#fbf6ea" stroke-linejoin="round">
    <rect x="-46" y="-62" width="92" height="120" rx="6"/>
    <path d="M-30,-36 h60 M-30,-14 h60 M-30,8 h40" fill="none"/>
    <path d="M-46,-50 h-10 M-46,-26 h-10 M-46,-2 h-10 M-46,22 h-10" fill="none"/>
  </g>`;
const penSvg = (x, y, angle) => `
  <g transform="translate(${x} ${y}) rotate(${angle})">
    <rect x="-6" y="-60" width="12" height="62" rx="3" fill="#1e1a16"/>
    <path d="M-6,2 L0,18 L6,2 Z" fill="#b23a2a"/>
  </g>`;

function pictureSvg(doer) {
  const student = doer === 'student';
  // Right is the doer (reading right to left), the arrow runs to the one written on.
  const doerArt = student ? studentSvg(560, 150, 1) : notebookSvg(560, 150, 1.25);
  const otherArt = student ? notebookSvg(200, 170, 0.85) : studentSvg(200, 170, 0.8);
  return `
  <defs><filter id="bleed"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7"/>
    <feDisplacementMap in="SourceGraphic" scale="4"/></filter></defs>
  <g filter="url(#bleed)">
    ${doerArt}${otherArt}
    ${penSvg(student ? 520 : 512, student ? 150 : 140, -55)}
    <path d="M470,160 C400,120 330,120 270,160" stroke="#b23a2a" stroke-width="6" fill="none" stroke-dasharray="14 10"/>
    <path d="M282,142 L262,166 L292,170" stroke="#b23a2a" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>`;
}
