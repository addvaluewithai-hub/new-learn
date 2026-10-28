// Art direction for each look the «اعمل كورس» page offers (src/features/studio/looks.ts has
// the same ids). The builder's prompt carries a summary; the full style guide and a reference
// board come from the get_style MCP tool (docs/visuals/styles, server/styles).

const COMMON =
  "Draw every scene's board in this look, one consistent world across the course. Text in the board font (NL Sans); keep the picture readable on a phone.";

export const LOOKS: Record<string, string> = {
  chalk:
    'Chalk on a dark green-black blackboard (#1f2b27) with faint half-wiped smudges. Canvas 2D: strokes drawn twice (a soft wide pass under a bright narrow one), wobble from sin() never Math.random, a fixed noise mask that speckles the chalk. Chalk white, pale blue, yellow (#ffe066) and pink for what matters. The pen draws lines when the lesson moves on; reduced motion shows the end picture.',
  watercolour:
    'Hand-painted watercolour on warm paper (#F3EBDC) with p5.js 2.3.3 and p5.brush 2.2.3 (allowed libraries): flat washes, soft watercolour fills, tapered ink outlines (#2B2233), a multiplied paper grain. Soft harmonious palette, no pure black or white, no text inside the painting. Paint once per state (seed each element) and keep one canvas size for both layouts.',
  crt: 'An old green-phosphor terminal: dark bezel, curved glowing screen (#07150c to #0f2a18), scanlines, text glow (#8dffa6), block-segment bars, a blinking cursor. Numbers and labels as on a terminal; one amber or pale-green accent for the answer.',
  space3d:
    'A 3D scene in three.js 0.186.1 (allowed library, loaded as an ES module from /lib; keep your own scripts classic). Deep navy space (#050816), seeded stars, one warm light, simple bold forms the learner can turn or move; a side panel with the numbers. Not to scale where scale would hide the idea.',
  seachart:
    'An old sea chart on parchment (#e9d8b0) with stains and a darkened edge: ink coastlines (#5a3b22) with water lines, a faint graticule, a compass rose, a cartouche title, routes as dashed red ink (#8e2a1a). Place names on cream labels.',
  shadow:
    'Shadow puppets on layered cut paper at sunset: a warm sky gradient, paper layers with soft drop shadows, solid dark silhouettes (#2b1b10) for people and machines, a fine paper grain over everything (SVG filters). Few colours, strong shapes.',
  blueprint:
    'An engineering blueprint: deep blue sheet (#123a6b) with a fine grid, white technical lines (4px), standard schematic symbols, dimension marks and a title block. One yellow (#ffe066) for what moves or flows.',
  crayon:
    'A crayon picture book on cream paper (#fff8e6): bright crayon colours, wobbly edges (SVG turbulence displacement), hatched fills, a few doodles (stars, waves). Big friendly shapes for children; numbers large.',
  calligraphy:
    "Ink and naskh calligraphy on warm paper (#f6efe2): Arabic display text in 'NL Naskh' (Amiri) at large size, ink drawings with a slight bleed, red (#b23a2a) and blue (#2a5ab2) to mark roles. Calm, lots of space.",
  pixel:
    'A pixel-art game: a tiny canvas scaled up with image-rendering: pixelated, a dark purple palette (#1b1035, #2a1f4a) with cyan, pink, yellow and green accents, hand-made 8×8 sprites, chunky square buttons. Moves and states read like a game.',
};

export function lookDirection(look: string): string {
  if (look === 'auto' || !LOOKS[look])
    return `Look: choose the one that suits the topic best from these, and use it for the whole course:\n${Object.entries(
      LOOKS,
    )
      .map(([id, text]) => `- ${id}: ${text.split('.')[0]}.`)
      .join(
        '\n',
      )}\nThen call get_style with that look before the first board and follow its guide and reference board. ${COMMON}`;
  return `Look (${look}): ${LOOKS[look]} Before the first board, call get_style with look "${look}" and follow its guide and reference board. ${COMMON}`;
}
