// The pictures on the «اعمل كورس» look cards (apps/platform/public/styles/<look>.webp), made
// from each demo board's board:check screenshot. Run after `npm run board:check` on the demo
// boards: node tools/style-previews.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
// Look id → demo board folder and the board:check shot that shows it best.
const SHOTS = {
  chalk: ['interest-chalk', 'landscape-05'],
  watercolour: ['plants-painted', 'landscape-04'],
  crt: ['ai-crt', 'landscape-05'],
  space3d: ['seasons-3d', 'landscape-03'],
  seachart: ['suez-map', 'landscape-01'],
  shadow: ['pyramid-shadow', 'landscape-05'],
  blueprint: ['circuit-blueprint', 'landscape-03'],
  crayon: ['fractions-crayon', 'landscape-01'],
  calligraphy: ['grammar-ink', 'landscape-01'],
  pixel: ['robot-pixel', 'landscape-03'],
};

const browser = await chromium.launch();
const page = await browser.newPage();
try {
  for (const [look, [folder, shot]] of Object.entries(SHOTS)) {
    const png = await readFile(join(root, 'test-results/board-check', folder, `${shot}.png`));
    const data = await page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = 640;
        c.height = 360;
        c.getContext('2d').drawImage(img, 0, 0, 640, 360);
        return c.toDataURL('image/webp', 0.82);
      },
      `data:image/png;base64,${png.toString('base64')}`,
    );
    await writeFile(
      join(root, 'apps/platform/public/styles', `${look}.webp`),
      Buffer.from(data.split(',')[1], 'base64'),
    );
    console.log(look);
  }
} finally {
  await browser.close();
}
