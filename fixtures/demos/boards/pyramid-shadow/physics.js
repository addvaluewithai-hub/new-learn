// Dragging a 2.5-tonne block up a ramp on a wooden sledge. Friction on dry sand is about
// 0.55; wetting the sand in front of the sledge brings it near 0.3 (as Egyptian paintings
// show, and lab tests confirm). One worker pulls about 250 N for a long haul.
const BLOCK_KG = 2500,
  G = 9.81,
  PULL_N = 250,
  PYRAMID_M = 146;
const FRICTION = { dry: 0.55, wet: 0.3 };
function haul(slope, sand) {
  const a = (slope * Math.PI) / 180;
  const force = BLOCK_KG * G * (Math.sin(a) + FRICTION[sand] * Math.cos(a));
  return { force, workers: Math.ceil(force / PULL_N), rampKm: PYRAMID_M / Math.sin(a) / 1000 };
}
