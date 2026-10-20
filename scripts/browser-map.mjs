import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  const switchDepartment = async (name, layer) => {
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForFunction(
      (expected) => document.querySelector('.mapSurface')?.dataset.layer === expected,
      layer,
    );
  };
  const camera = async () =>
    JSON.parse(await page.locator('.mapSurface').getAttribute('data-camera'));
  const asset = await page.request.get(new URL('/marketverse-v6-map-clean.png', page.url()).href);
  assert.equal(asset.status(), 200);
  const artworkBytes = await asset.body();
  // A CDN can losslessly recompress the response; the build gate pins the source bytes.
  const imageSize = await page.evaluate(
    async ({ data, type }) => {
      const image = new Image();
      image.src = `data:${type};base64,${data}`;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    },
    { data: artworkBytes.toString('base64'), type: asset.headers()['content-type'] },
  );
  assert.deepEqual(imageSize, { width: 1536, height: 1024 });
  await ready();
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const [name, layer] of [
      ['Sản phẩm', 'Market'],
      ['Logistics', 'Logistics'],
      ['Tài chính', 'Economy'],
      ['Vận hành', 'Operations'],
      ['Marketing', 'Market'],
    ]) {
      await switchDepartment(name, layer);
      await ready();
    }
  }
  await switchDepartment('Cài đặt', 'Operations');
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start national campaign', exact: true }).click();
  await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k)).cities.length === 8, key);
  await switchDepartment('Vận hành', 'Operations');
  const mapKeyboard = page.getByRole('application', {
    name: 'Country map: arrow keys pan, plus or minus zoom, Home fits view',
  });
  await mapKeyboard.focus();
  await page.keyboard.press('Home');
  for (let zoom = 0; zoom < 5; zoom++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.equal(await page.locator('.mapSurface').getAttribute('data-detail-band'), '2');
  const point = async () => {
    const c = await camera();
    const box = await page.locator('canvas').boundingBox();
    return {
      x: box.x + box.width / 2 + (0.565 * 1920 - 28 - c.x) * c.scale,
      y: box.y + box.height / 2 + (0.475 * 1280 + 52 - c.y) * c.scale,
    };
  };
  const p = await point();
  await page.mouse.click(p.x, p.y);
  assert.equal(await page.locator('.panel').getAttribute('data-selection'), 'facility:hq');
  await switchDepartment('Sản phẩm', 'Market');
  const c = await camera();
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(
    box.x + box.width / 2 + (0.565 * 1920 - c.x) * c.scale,
    box.y + box.height / 2 + (0.475 * 1280 - c.y) * c.scale,
  );
  assert.equal(
    await page.locator('.panel').getAttribute('data-selection'),
    'city:central',
    'hidden facilities cannot intercept map clicks',
  );
  for (let turn = 0; turn < 3; turn++) {
    await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).click();
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
    sourceArtworkBytes: 2262971,
    artworkBytes: artworkBytes.length,
    deliveredArtworkSha256: createHash('sha256').update(artworkBytes).digest('hex'),
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
