import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { launchBrowser } from './browser-runtime.mjs';

const browser = await launchBrowser();
const key = 'marketverse:sprint01:state';
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.SMOKE_URL || 'http://127.0.0.1:5173/');
  const ready = async () => {
    await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
    assert.equal(await page.locator('.map').getAttribute('data-error'), null);
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.locator('.mapSurface').getAttribute('data-artwork'), 'ready');
  };
  const dismiss = async () => {
    const close = page.getByRole('button', { name: 'Dismiss map actions', exact: true });
    if (await close.isVisible()) await close.click();
  };
  const camera = async () =>
    JSON.parse(await page.locator('.mapSurface').getAttribute('data-camera'));
  const asset = await page.request.get(new URL('/marketverse-v6-map-clean.png', page.url()).href);
  assert.equal(asset.status(), 200);
  assert.equal((await asset.body()).length, 2262971);
  await ready();
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const layer of ['Market', 'Competition', 'Operations', 'Logistics', 'Economy']) {
      await page.getByRole('button', { name: layer, exact: true }).click();
      await page
        .getByLabel('Select city', { exact: true })
        .selectOption(['north', 'central', 'south'][cycle]);
      await dismiss();
      await ready();
    }
  }
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start national campaign', exact: true }).click();
  await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k)).cities.length === 8, key);
  await page.getByLabel('Select city', { exact: true }).selectOption('central');
  await dismiss();
  await page.getByRole('button', { name: 'Operations', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Center selection', exact: true }).click();
  for (let zoom = 0; zoom < 5; zoom++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await page.locator('.mapSurface').getAttribute('data-detail-band'), '2');
  const point = async () => {
    const c = await camera();
    const box = await page.locator('canvas').boundingBox();
    return {
      x: box.x + box.width / 2 + (1100 - 28 - c.x) * c.scale,
      y: box.y + box.height / 2 + (600 + 52 - c.y) * c.scale,
    };
  };
  let p = await point();
  await page.mouse.click(p.x, p.y);
  assert.equal(await page.locator('.panel').getAttribute('data-selection'), 'facility:hq');
  await page.getByLabel('Select city', { exact: true }).selectOption('central');
  await dismiss();
  await page.getByRole('button', { name: 'Market', exact: true }).click();
  p = await point();
  await page.mouse.click(p.x, p.y);
  assert.equal(
    await page.locator('.panel').getAttribute('data-selection'),
    'city:central',
    'hidden facilities cannot intercept map clicks',
  );
  for (let turn = 0; turn < 3; turn++) {
    await page.getByRole('button', { name: 'NEXT WEEK' }).click();
    await page.getByRole('button', { name: 'Commit week', exact: true }).click();
    await ready();
  }
  const saved = await page.evaluate((k) => localStorage.getItem(k), key);
  assert.equal(JSON.parse(saved).absoluteWeek, 4);
  await page.reload();
  await ready();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), saved);
  mkdirSync('.browser-artifacts', { recursive: true });
  await page.screenshot({ path: '.browser-artifacts/map-p0-national.png' });
  // Reproduce the original invalid upload; retry must recover without replacing progress.
  await page.route('**/marketverse-v6-map-clean.png', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from([13, 10]),
      headers: { 'cache-control': 'no-store' },
    }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Retry map', exact: true }).waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), saved);
  await page.unroute('**/marketverse-v6-map-clean.png');
  await page.getByRole('button', { name: 'Retry map', exact: true }).click();
  await ready();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), saved);
  assert.deepEqual(errors, []);
  const result = {
    production: process.env.BROWSER_PRODUCTION === '1',
    target: process.env.SMOKE_URL,
    browser: await browser.version(),
    artworkBytes: 2262971,
    layerSwitches: 15,
    cities: 8,
    weeksCommitted: 3,
    zoomRebuild: true,
    hiddenHitTargetsRejected: true,
    saveReloadExact: true,
    corruptArtworkRetry: true,
    uncaughtErrors: errors,
  };
  writeFileSync('.browser-artifacts/map-p0.json', JSON.stringify(result, null, 2) + '\n');
  console.log(
    'PASS: approved PNG, repeated map redraws, eight cities, zoomed facility selection, hidden hit targets, weekly save/reload, invalid-image recovery, one canvas and no uncaught errors',
  );
} finally {
  await browser.close();
}
