// The painted scene, in a 760×720 design box: a window, a pot of basil on a table, and a
// magnified slice of the top soil with a fingertip 2 cm down. Same soil state, same picture.
const SOIL = {
  moist: { soil: '#4A3426', top: '#5B402E', leaf: '#5E9A4E', droop: 0 },
  dry: { soil: '#B9946A', top: '#CDAF84', leaf: '#A9B276', droop: 1.05 },
  watered: { soil: '#3B2A20', top: '#46322A', leaf: '#67A957', droop: -0.05 },
};
const BOX = { w: 760, h: 720 };
const PROBE = { x: 600, y: 196, r: 120 };

function paintScene(p, P, soil) {
  const s = SOIL[soil] ?? SOIL.moist;
  const { key, ell, rect, leaf, shape, line } = P;
  // Window and the light it lets in.
  key('window');
  shape(rect(70, 58, 250, 270, 2), { wash: '#D7E8EF', fill: '#BFD9E6', fillOp: 120, sw: 1.2 });
  key('bars');
  shape(rect(188, 60, 14, 266, 1), { wash: '#F3EBDC', sw: 0.8 });
  shape(rect(72, 186, 246, 14, 1), { wash: '#F3EBDC', sw: 0.8 });
  key('clouds');
  shape(ell(124, 112, 40, 15, 20, 2), { wash: '#FFFFFF', washOp: 210, ink: null });
  shape(ell(262, 252, 34, 12, 20, 2), { wash: '#FFFFFF', washOp: 210, ink: null });
  key('light');
  shape(
    [
      [70, 328],
      [320, 328],
      [560, 600],
      [240, 600],
    ],
    { wash: '#FBE7B5', washOp: 70, ink: null },
  );
  // Table.
  key('table');
  shape(rect(-20, 598, 800, 140, 1.5), { wash: '#C99A63', fill: '#B88452', fillOp: 110, sw: 0.8 });
  // Saucer, with water in it once the pot has drained.
  key('saucer');
  shape(ell(380, 606, 178, 26, 32, 1.5), { wash: '#A85A42', sw: 0.9 });
  if (soil === 'watered') {
    key('saucer-water');
    shape(ell(380, 600, 150, 15, 28, 1), { wash: '#8EC3E6', washOp: 220, ink: null });
    line(
      [
        [300, 598],
        [350, 596],
      ],
      0.6,
      '#F7FBFF',
    );
  }
  // Pot and rim.
  key('pot');
  shape(
    [
      [264, 396],
      [496, 396],
      [466, 598],
      [294, 598],
    ],
    { wash: '#D97757', fill: '#C8663F', fillOp: 120, sw: 1.1 },
  );
  key('feet');
  shape(rect(300, 570, 26, 22, 1), { wash: '#A85A42', sw: 0.7 });
  shape(rect(434, 570, 26, 22, 1), { wash: '#A85A42', sw: 0.7 });
  key('rim');
  shape(rect(248, 372, 264, 46, 1.5), { wash: '#E58B66', sw: 1.1 });
  // Soil surface.
  key('soil');
  shape(ell(380, 378, 120, 17, 28, 1.5), { wash: s.soil, sw: 0.7 });
  if (soil === 'dry')
    for (let i = 0; i < 5; i++) {
      key(`crack${i}`);
      const x = 300 + i * 36;
      line(
        [
          [x, 374],
          [x + 10, 380],
          [x + 4, 386],
        ],
        0.5,
        '#7D5C3C',
        'ink',
        0.2,
      );
    }
  // Basil: one stem, branching, with paired leaves.
  key('stem');
  const bend = soil === 'dry' ? 34 : 0;
  line(
    [
      [380, 378],
      [376, 300],
      [384 + bend * 0.4, 230],
      [378 + bend, 176],
    ],
    1.3,
    '#3F6B37',
  );
  const nodes = [
    [378, 330, 0.9, 54],
    [381, 268, 0.75, 50],
    [380 + bend * 0.3, 214, 0.6, 44],
    [378 + bend, 178, 0.45, 34],
  ];
  nodes.forEach(([x, y, a, l], i) => {
    for (const side of [-1, 1]) {
      key(`leaf${i}${side}`);
      const angle = side < 0 ? Math.PI + a : -a;
      const droop = side * 0 + s.droop * (side < 0 ? -1 : 1);
      shape(leaf(x, y, l, l * 0.42, angle + droop), {
        wash: s.leaf,
        fill: s.leaf,
        fillOp: 90,
        sw: 0.7,
      });
    }
  });
  key('top-leaf');
  shape(leaf(378 + bend, 178, 30, 13, -Math.PI / 2 + bend / 60), { wash: s.leaf, sw: 0.7 });
  // Watering can and its stream.
  if (soil === 'watered') {
    key('can');
    shape(
      [
        [96, 300],
        [206, 290],
        [214, 382],
        [104, 392],
      ],
      { wash: '#3A9C98', fill: '#2F8A86', fillOp: 120, sw: 1 },
    );
    shape(
      [
        [206, 306],
        [300, 262],
        [306, 272],
        [212, 322],
      ],
      { wash: '#3A9C98', sw: 0.9 },
    );
    line(
      [
        [110, 300],
        [150, 250],
        [196, 292],
      ],
      1.1,
    );
    for (let i = 0; i < 4; i++) {
      key(`stream${i}`);
      line(
        [
          [302 + i * 4, 270],
          [330 + i * 6, 320],
          [350 + i * 8, 368],
        ],
        0.55,
        '#6FB2DA',
        'ink',
        0.6,
      );
    }
    for (const [x, y] of [
      [330, 616],
      [430, 624],
      [332, 638],
    ]) {
      key(`drop${x}${y}`);
      shape(ell(x, y, 5, 8, 12, 0.4), { wash: '#8EC3E6', ink: '#5C8FB4', sw: 0.4 });
    }
  }
  // The magnified slice: top 2 cm of soil, a fingertip, and a depth mark.
  const { x, y, r } = PROBE;
  key('probe-line');
  line(
    [
      [x - r * 0.72, y + r * 0.72],
      [470, 362],
    ],
    0.5,
    '#6B5A4E',
  );
  key('probe-bg');
  shape(ell(x, y, r, r, 40, 0.6), { wash: '#F6EEDD', ink: null });
  key('probe-deep');
  shape(
    [
      [x - r * 0.98, y - 10],
      [x + r * 0.98, y - 10],
      [x + r * 0.7, y + r * 0.72],
      [x - r * 0.7, y + r * 0.72],
    ],
    { wash: s.soil, ink: null },
  );
  key('probe-top');
  shape(
    [
      [x - r * 0.98, y - 46],
      [x + r * 0.98, y - 46],
      [x + r * 0.98, y + 8],
      [x - r * 0.98, y + 8],
    ],
    { wash: s.top, ink: null },
  );
  if (soil !== 'dry')
    for (let i = 0; i < 6; i++) {
      key(`bead${i}`);
      const bx = x - 70 + i * 28,
        by = y - 20 + (i % 2) * 22;
      shape(ell(bx, by, 4, 4, 10, 0.3), { wash: '#9FCBE8', ink: null });
    }
  key('finger');
  shape(
    [
      [x - 22, y - r],
      [x + 22, y - r],
      [x + 20, y - 4],
      [x, y + 10],
      [x - 20, y - 4],
    ],
    { wash: '#EDB99A', sw: 0.8, curv: 0.4 },
  );
  key('mark');
  line(
    [
      [x + 52, y - 46],
      [x + 52, y + 8],
    ],
    0.7,
    '#2B2233',
    'ink',
    0,
  );
  line(
    [
      [x + 44, y - 46],
      [x + 60, y - 46],
    ],
    0.6,
    '#2B2233',
    'ink',
    0,
  );
  line(
    [
      [x + 44, y + 8],
      [x + 60, y + 8],
    ],
    0.6,
    '#2B2233',
    'ink',
    0,
  );
  key('probe-ring');
  shape(ell(x, y, r, r, 40, 0.6), { ink: '#2B2233', sw: 1.6 });
}
