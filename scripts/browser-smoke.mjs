import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { launchBrowser } from './browser-runtime.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.SMOKE_URL || 'http://127.0.0.1:5173/');

  const ready = async () => {
    await page.waitForFunction(
      () => document.querySelector('.mapSurface')?.dataset.artwork === 'ready',
    );
    assert.equal(await page.locator('.map').getAttribute('data-error'), null);
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.locator('.mapSurface').getAttribute('data-country-artwork'), '38');
  };
  const camera = async () =>
    JSON.parse(await page.locator('.mapSurface').getAttribute('data-camera'));

  await ready();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).cities.length,
    ),
    8,
  );
  assert.equal(await page.locator('.commandVisual').count(), 1);
  assert.equal(await page.locator('.commandRail .departmentNavButton').count(), 9);
  assert.equal(
    await page.locator('#selection-panel').getAttribute('data-selection'),
    'city:central',
  );
  assert.equal(await page.locator('.commandPanelContent h1').innerText(), 'Vận hành');
  assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'), 'Operations');

  // The canvas is mounted once and camera controls do not change saved game state.
  const canvas = await page.locator('canvas').elementHandle();
  const initialCamera = await camera();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  assert.ok((await camera()).scale > initialCamera.scale);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  const mapKeyboard = page.getByRole('application', {
    name: 'Country map: arrow keys pan, plus or minus zoom, Home fits view',
  });
  await mapKeyboard.focus();
  await page.keyboard.press('Home');
  assert.equal((await camera()).x, 960);
  assert.equal((await camera()).y, 640);

  // Illustrated landmarks are real selectable entities with operating stats.
  const mapBox = await page.locator('.mapSurface').boundingBox();
  const entityCamera = await camera();
  await page.mouse.click(
    mapBox.x + mapBox.width / 2 + (1094.4 - entityCamera.x) * entityCamera.scale,
    mapBox.y + mapBox.height / 2 + (323.2 - entityCamera.y) * entityCamera.scale,
  );
  await page.waitForFunction(
    () =>
      document.querySelector('#selection-panel')?.dataset.selection === 'world:central-factory-1',
  );
  assert.match(
    await page.locator('#selection-panel').innerText(),
    /Central City Industrial Complex 1/,
  );
  assert.match(await page.locator('#selection-panel').innerText(), /Nhân lực \/ Công suất/);
  await page.getByLabel('Select city').selectOption('central', { force: true });

  await page.mouse.click(
    mapBox.x + mapBox.width / 2 + (1300 - entityCamera.x) * entityCamera.scale,
    mapBox.y + mapBox.height / 2 + (960 - entityCamera.y) * entityCamera.scale,
  );
  await page.waitForFunction(
    () => document.querySelector('#selection-panel')?.dataset.selection === 'country:thuria',
  );
  assert.match(await page.locator('#selection-panel').innerText(), /Quốc gia đang chọn/);
  assert.match(await page.locator('#selection-panel').innerText(), /Thuria/);
  await page.getByLabel('Select city').selectOption('central', { force: true });

  // User-facing departments all share the same business state and illustrated map.
  for (const [button, heading, layer] of [
    ['Sản phẩm', 'Sản phẩm', 'Market'],
    ['Marketing', 'Marketing', 'Market'],
    ['Nhân sự', 'Nhân sự', 'Operations'],
    ['Tài chính', 'Tài chính', 'Economy'],
    ['Logistics', 'Logistics', 'Logistics'],
    ['Dự án', 'Dự án', 'Operations'],
    ['Vận hành', 'Vận hành', 'Operations'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click();
    assert.equal(await page.locator('.commandPanelContent h1').innerText(), heading);
    await page.waitForFunction(
      (expected) => document.querySelector('.mapSurface')?.dataset.layer === expected,
      layer,
    );
    assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'), layer);
  }
  assert.ok(
    await canvas.evaluate((el) => el.isConnected),
    'department switches preserve Pixi canvas',
  );

  // Retain the advanced City Intelligence inspector but not the Classic UI.
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Chuyển sang giao diện chi tiết' }).count(),
    0,
  );
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  assert.equal(await page.locator('.detailPanelContent').isVisible(), true);
  assert.equal(await page.locator('.detailPanelContent h1').innerText(), 'Central City');
  assert.equal(await page.evaluate(() => location.search), '');

  // Every business week must persist after browser reload.
  await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: 'Products', exact: true }).click();
  await page.getByLabel('Price (nova)', { exact: true }).fill('270');
  await page.getByLabel('Production target (nova)', { exact: true }).fill('80');
  await page.getByRole('button', { name: 'Commit week', exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week === 2,
  );
  await page.reload();
  await ready();
  assert.match(await page.locator('.metrics').innerText(), /W02/);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('marketverse:sprint01:state')),
  );
  assert.equal(saved.policies.player.prices.nova, 270);
  assert.equal(saved.week, 2);

  await page.getByRole('button', { name: 'Báo cáo', exact: true }).click();
  assert.match(await page.getByRole('dialog').innerText(), /Revenue|profit|Profit/);
  await page.getByRole('button', { name: 'Close reports', exact: true }).click();
  await page.keyboard.press('?');
  assert.equal(await page.getByRole('dialog').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);

  // Malformed saves must not be overwritten or silently reset.
  const corrupted = await page.evaluate(() => {
    const raw = '{invalid original save';
    localStorage.setItem('marketverse:sprint01:state', raw);
    return raw;
  });
  await page.reload();
  await page.getByRole('alert').waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem('marketverse:sprint01:state')),
    corrupted,
  );
  assert.equal(await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).isDisabled(), true);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export original save' }).click();
  assert.equal((await download).suggestedFilename(), 'marketverse-recovery.json');

  // Reset remains explicit; national campaign still initializes real economic state.
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Bắt đầu lại trò chơi' }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week === 1,
  );
  await ready();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).cities.length,
    ),
    8,
  );
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Start national campaign', exact: true }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('marketverse:sprint01:state')).campaign.mode === 'national',
  );
  await ready();
  const national = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('marketverse:sprint01:state')),
  );
  assert.equal(national.cities.length, 8);
  assert.equal(national.companies.length, 5);
  assert.equal(national.campaign.status, 'active');
  assert.deepEqual(errors, []);

  mkdirSync('.browser-artifacts', { recursive: true });
  await page.screenshot({ path: '.browser-artifacts/smoke.png' });
  console.log(
    'PASS: unified UI, persistent map and layers, camera, departments, city intelligence, weekly orders/save, reports, keyboard guidance, corrupt-save recovery, reset, and eight-city campaign.',
  );
} finally {
  await browser.close();
}
