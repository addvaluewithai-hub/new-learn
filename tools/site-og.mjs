// Renders the website's share image (1200×630) from the brand and three look posters:
//   node tools/site-og.mjs
// Writes apps/platform/public/site/og.png. Run it again when the headline or looks change.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = new URL('../apps/platform/public/', import.meta.url);
const poster = async (name) =>
  `data:image/webp;base64,${(await readFile(new URL(`styles/${name}.webp`, root))).toString('base64')}`;
const [chalk, map, space] = await Promise.all(['chalk', 'seachart', 'space3d'].map(poster));

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: 'IBM Plex Sans Arabic', sans-serif;
    background: radial-gradient(70% 60% at 30% 50%, #27463c, transparent 70%), #0f2c26; color: #fff; }
  .copy { position: absolute; top: 96px; right: 72px; width: 560px; }
  .brand { display: flex; align-items: center; gap: 14px; font: 700 34px Arial, sans-serif; }
  .mark { width: 56px; height: 56px; border-radius: 14px; background: #153d35; color: #d7f77b; display: grid; place-items: center; font-size: 40px; position: relative; }
  .mark i { position: absolute; top: 10px; left: 10px; width: 9px; height: 9px; border-radius: 50%; background: #d7f77b; }
  h1 { margin: 44px 0 20px; font-size: 64px; line-height: 1.18; font-weight: 700; letter-spacing: -0.02em; }
  p { margin: 0; font-size: 26px; line-height: 1.6; color: rgba(255,255,255,.72); font-weight: 500; }
  .shots { position: absolute; left: 56px; top: 110px; width: 470px; height: 420px; }
  .shots img { position: absolute; width: 330px; aspect-ratio: 16/9; object-fit: cover; border-radius: 18px; border: 5px solid #fff; box-shadow: 0 30px 60px rgba(0,0,0,.45); }
  .shots img:nth-child(1) { top: 0; left: 0; transform: rotate(-4deg); }
  .shots img:nth-child(2) { top: 120px; left: 120px; transform: rotate(3deg); }
  .shots img:nth-child(3) { top: 240px; left: 20px; transform: rotate(-1deg); }
</style></head><body>
<div class="copy">
  <div class="brand"><span class="mark">L<i></i></span><span>learn</span></div>
  <h1>أي فكرة، تبقى درس بيترسم قدامك.</h1>
  <p>بورد بيترسم بالكود، وسؤال بعد كل فكرة، وNova بتشرح بالصوت.</p>
</div>
<div class="shots"><img src="${chalk}"><img src="${map}"><img src="${space}"></div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await writeFile(new URL('site/og.png', root), await page.screenshot({ type: 'png' }));
  console.log('Wrote apps/platform/public/site/og.png');
} finally {
  await browser.close();
}
