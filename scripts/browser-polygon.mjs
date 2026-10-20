import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { launchBrowser } from './browser-runtime.mjs';

mkdirSync('.browser-artifacts', { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.env.SMOKE_URL || 'http://127.0.0.1:5174/';
  await page.goto(new URL('/polygon-poc.html', base).href);
  await page.waitForFunction(() => document.querySelector('#poc-map')?.dataset.ready === 'true');
  const map = page.locator('#poc-map');
  assert.equal(await map.getAttribute('data-geometry-only'), 'true');
  const num = Number(await map.getAttribute('data-buildings'));
  assert.ok(num >= 40, 'minimum 40 addressable building geometries');
  assert.equal(await map.getAttribute('data-districts'), '3');
  assert.equal(await page.locator('#poc-map canvas').count(), 1);
  assert.equal(await page.locator('#poc-map img').count(), 0);
  assert.match(await page.locator('#poc-inspector').innerText(), /Central City Core/);
  await page.screenshot({ path: '.browser-artifacts/polygon-poc-desktop.png' });
  const getCamera = async () => JSON.parse(await map.getAttribute('data-camera'));
  const baseCamera = await getCamera();
  await page.getByRole('button', { name: 'Phóng to' }).click();
  const zoomCamera = await getCamera();
  assert.ok(zoomCamera.scale > baseCamera.scale);
  await page.getByRole('button', { name: 'Vừa khung' }).click();
  const fitted = await getCamera();
  assert.ok(Math.abs(fitted.scale - baseCamera.scale) < 0.001);
  await page.getByRole('button', { name: 'Districts', exact: true }).click();
  assert.equal(await map.getAttribute('data-layer'), 'districts');
  await page.getByRole('button', { name: 'Công trình', exact: true }).click();
  assert.equal(await map.getAttribute('data-layer'), 'buildings');
  await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
  const sample = JSON.parse(await map.getAttribute('data-sample-building'));
  const rect = await page.locator('#poc-map canvas').boundingBox();
  const c = await getCamera();
  const bx = rect.x + rect.width / 2 + (sample.x - c.x) * c.scale;
  const by = rect.y + rect.height / 2 + (sample.y - sample.height / 2 - c.y) * c.scale;
  await page.mouse.click(bx, by);
  await page.waitForFunction(() =>
    document.querySelector('#poc-map')?.dataset.selected?.startsWith('building:'),
  );
  const selected = await map.getAttribute('data-selected');
  assert.ok(selected.startsWith('building:central-'));
  assert.match(await page.locator('#poc-inspector').innerText(), /BUILDING ENTITY/);
  await page.getByRole('button', { name: 'Đổi trạng thái công trình' }).click();
  assert.equal(await map.getAttribute('data-changed-building'), selected.split(':')[1]);
  await page.screenshot({ path: '.browser-artifacts/polygon-poc-selected.png' });
  assert.deepEqual(errors, []);
  // Check production output includes a real second HTML entry, not an SPA fallback.
  if (process.env.BROWSER_PRODUCTION === '1') {
    const text = await page.locator('title').textContent();
    assert.match(text, /Native Polygon POC/);
  }
  console.log(
    'PASS: standalone PNG-free PixiJS map, 3 district polygons, ' +
      num +
      ' independent buildings, zoom, layer filters, building hit, state change and screenshots',
  );
} finally {
  await browser.close();
}
