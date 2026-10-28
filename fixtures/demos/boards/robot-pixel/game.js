// The maze, the run and the pixel drawing. Grid 7×5, robot from the bottom left to the battery;
// '#' is a wall. Drawn at 16px tiles on a tiny canvas that CSS scales up, pixelated.
const MAZE = ['..##...', '#...##.', '.#..#..', '#..#..#', '..#....'];
const START = [0, 4],
  GOAL = [3, 1];
const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const wall = ([x, y]) => x < 0 || y < 0 || x > 6 || y > 4 || MAZE[y][x] === '#';

/** Walk the program `repeat` times: the cells visited, and how it ended. */
function run(program, repeat) {
  const moves = [];
  for (let r = 0; r < repeat; r++) moves.push(...program.filter((m) => m !== 'none'));
  let at = START;
  const path = [at];
  for (const m of moves) {
    const next = [at[0] + STEP[m][0], at[1] + STEP[m][1]];
    if (wall(next)) return { path, end: 'wall', bump: next, moves: moves.length };
    at = next;
    path.push(at);
    if (at[0] === GOAL[0] && at[1] === GOAL[1]) return { path, end: 'goal', moves: moves.length };
  }
  return { path, end: moves.length ? 'short' : 'empty', moves: moves.length };
}

const ROBOT = [
  '..aaaa..',
  '.abbbba.',
  '.bcbbcb.',
  '.bbbbbb.',
  '..bddb..',
  '.eeeeee.',
  '.e.ee.e.',
  '..e..e..',
];
const BATTERY = [
  '...ff...',
  '..gggg..',
  '..ghhg..',
  '..gggg..',
  '..ghhg..',
  '..gggg..',
  '..ghhg..',
  '..gggg..',
];
const PAL = {
  a: '#ff5d8f',
  b: '#7cf2ff',
  c: '#1b1035',
  d: '#ffd166',
  e: '#4cc9f0',
  f: '#ffd166',
  g: '#06d6a0',
  h: '#b8ffe9',
};
const sprite = (g, rows, x, y, s) =>
  rows.forEach((row, j) =>
    [...row].forEach((c, i) => {
      if (c === '.') return;
      g.fillStyle = PAL[c];
      g.fillRect(x + i * s, y + j * s, s, s);
    }),
  );

function drawMaze(g, result) {
  const T = 16,
    ox = 8,
    oy = 8;
  g.fillStyle = '#2a1f4a';
  g.fillRect(0, 0, 128, 96);
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 7; x++) {
      const px = ox + x * T,
        py = oy + y * T;
      if (MAZE[y][x] === '#') {
        g.fillStyle = '#5b3fa0';
        g.fillRect(px, py, T, T);
        g.fillStyle = '#7d5fd0';
        g.fillRect(px, py, T, 2);
        g.fillRect(px, py + 8, T, 1);
        g.fillRect(px + 7, py + 2, 1, 6);
        g.fillRect(px + 3, py + 9, 1, 7);
        g.fillRect(px + 11, py + 9, 1, 7);
      } else {
        g.fillStyle = (x + y) % 2 ? '#33275a' : '#30245a';
        g.fillRect(px, py, T, T);
      }
    }
  // The trail, then the battery, then the robot where it stopped.
  g.fillStyle = '#ffd166';
  for (const [x, y] of result.path.slice(0, -1)) g.fillRect(ox + x * T + 6, oy + y * T + 6, 4, 4);
  if (result.end !== 'goal') sprite(g, BATTERY, ox + GOAL[0] * T + 4, oy + GOAL[1] * T + 4, 1);
  const [rx, ry] = result.path[result.path.length - 1];
  sprite(g, ROBOT, ox + rx * T + 2, oy + ry * T + 2, 1.5);
  if (result.end === 'wall') {
    const [bx, by] = result.bump;
    g.fillStyle = '#ff5d8f';
    for (let i = 0; i < 10; i++) {
      g.fillRect(ox + bx * T + 3 + i, oy + by * T + 3 + i, 2, 2);
      g.fillRect(ox + bx * T + 12 - i, oy + by * T + 3 + i, 2, 2);
    }
  }
  if (result.end === 'goal') {
    g.fillStyle = '#06d6a0';
    for (const [dx, dy] of [
      [-6, -4],
      [18, -4],
      [6, -8],
      [-4, 14],
      [16, 14],
    ])
      g.fillRect(ox + rx * T + dx, oy + ry * T + dy, 2, 2);
  }
}
