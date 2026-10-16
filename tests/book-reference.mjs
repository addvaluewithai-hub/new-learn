import assert from 'node:assert/strict';

/** Reference sizing does not replace or navigate away from the real classroom. */
export async function verifyBookReference(page, width) {
  if (width <= 650) {
    await page.getByRole('button', { name: 'افتح مرجع الكتاب', exact: true }).click();
  }
  const small = page.locator('.book-reference[data-size="small"]');
  await small.waitFor();
  const box = await small.boundingBox();
  assert.ok(box.width <= 280 && box.height <= 240, 'reference starts small');
  const path = await small.locator('image').getAttribute('href');
  assert.ok(
    (await page.request.get(new URL(path, page.url()).href)).ok(),
    'real source crop loads',
  );
  assert.equal(await small.locator('[data-reference-focus]').count(), 1);
  await page.getByRole('button', { name: 'مرجع بنصف الشاشة', exact: true }).click();
  const half = page.locator('.book-reference[data-size="half"]');
  await half.waitFor();
  const halfBox = await half.boundingBox();
  assert.ok(halfBox.width > box.width || halfBox.height > box.height);
  await page.getByRole('button', { name: 'مرجع بملء الشاشة', exact: true }).click();
  await page.locator('dialog.book-reference[open]').waitFor();
  assert.ok(await page.locator('dialog.book-reference').evaluate((node) => node.matches(':modal')));
  await page.keyboard.press('Escape');
  await small.waitFor();
  await page.waitForFunction(() =>
    document.querySelector('.book-reference[data-size="small"]')?.contains(document.activeElement),
  );
  await page.getByRole('button', { name: 'إخفاء مرجع الكتاب', exact: true }).click();
  await page.getByRole('button', { name: 'افتح مرجع الكتاب', exact: true }).waitFor();
  assert.equal(await page.locator('.book-reference').count(), 0);
  assert.equal(await page.locator('.rl').count(), 1, 'original classroom stays mounted');
}
