import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { launchBrowser } from './browser-runtime.mjs';

mkdirSync('.browser-artifacts', { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.SMOKE_URL || 'http://127.0.0.1:5174/');
  await page.waitForFunction(
    () => document.querySelector('.mapSurface')?.dataset.artwork === 'ready',
  );
  assert.equal(await page.locator('.commandVisual').count(), 1);
  assert.equal(await page.locator('.commandRail .departmentNavButton').count(), 9);
  assert.equal(await page.locator('.panel h1').first().innerText(), 'Vận hành');
  assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'), 'Operations');
  assert.match(await page.locator('.commandStockCard').innerText(), /400 SP/);
  await page.screenshot({ path: '.browser-artifacts/visual-command-1366.png' });

  // Map cards must remain real, world-anchored and selectable.
  const camera = JSON.parse(await page.locator('.mapSurface').getAttribute('data-camera'));
  const canvas = await page.locator('canvas').boundingBox();
  // The new artwork anchor is independent of the original engine x/y values.
  const clickWorld = async (worldX, worldY) => {
    await page.mouse.click(
      canvas.x + canvas.width / 2 + (worldX - camera.x) * camera.scale,
      canvas.y + canvas.height / 2 + (worldY - camera.y) * camera.scale,
    );
  };
  // First click a compact rival-city chip, then the newly compact center chip.
  await clickWorld(0.35 * 1920 + 70, 0.275 * 1280 - 65);
  assert.equal(await page.locator('.panel').getAttribute('data-selection'), 'facility:atlas-store');
  await clickWorld(0.565 * 1920 + 100, 0.475 * 1280 - 65);
  assert.equal(await page.locator('.panel').getAttribute('data-selection'), 'facility:store');
  const targetX = 0.565 * 1920 + 100;
  const targetY = 0.475 * 1280 - 92;
  await page.mouse.click(
    canvas.x + canvas.width / 2 + (targetX - camera.x) * camera.scale,
    canvas.y + canvas.height / 2 + (targetY - camera.y) * camera.scale,
  );
  assert.equal(await page.locator('.panel').getAttribute('data-selection'), 'facility:store');
  assert.equal(await page.locator('.commandPanelContent h1').innerText(), 'Vận hành');

  await page.getByRole('button', { name: 'Điều chỉnh sản xuất' }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Products', exact: true }).getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();

  await page.getByRole('button', { name: 'Sản phẩm', exact: true }).click();
  assert.equal(await page.locator('.commandPanelContent h1').innerText(), 'Sản phẩm');
  assert.match(await page.locator('.commandPanelContent').innerText(), /NOVA AIR/);
  await page.getByRole('button', { name: 'Logistics', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.layer === 'Logistics');
  assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'), 'Logistics');
  assert.match(await page.locator('.commandPanelContent').innerText(), /Lô hàng đang chuyển/);
  await page.getByRole('button', { name: 'Marketing', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.layer === 'Market');
  assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'), 'Market');
  assert.match(await page.locator('.commandPanelContent').innerText(), /Nhận biết thương hiệu/);
  await page.getByRole('button', { name: 'Nhân sự', exact: true }).click();
  assert.match(await page.locator('.commandPanelContent').innerText(), /Nhân lực hiện tại/);
  await page.getByRole('button', { name: 'Tài chính', exact: true }).click();
  assert.match(await page.locator('.commandPanelContent').innerText(), /2.500.000 CR/);
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  assert.match(await page.locator('.commandPanelContent').innerText(), /Dự án đang triển khai/);
  await page.getByRole('button', { name: 'Vận hành', exact: true }).click();
  await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(
    await page
      .getByRole('button', { name: 'Projects & review', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await page.getByRole('button', { name: 'Commit week', exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week === 2,
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector('.mapSurface')?.dataset.artwork === 'ready',
  );
  assert.equal(await page.locator('.commandPanelContent h1').innerText(), 'Vận hành');
  assert.match(await page.locator('.metrics').innerText(), /W02/);

  await page.setViewportSize({ width: 1024, height: 700 });
  await page.waitForFunction(
    () =>
      document.querySelector('canvas').clientWidth ===
      document.querySelector('.mapSurface').clientWidth,
  );
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '.browser-artifacts/visual-command-1024.png' });
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  assert.match(
    await page.locator('.commandPanelContent').innerText(),
    /Chuyển sang giao diện chi tiết/,
  );
  await page.getByRole('button', { name: 'Chuyển sang giao diện chi tiết' }).click();
  await page.waitForURL(/view=classic/);
  assert.equal(await page.locator('.commandVisual').count(), 0);
  assert.equal(await page.locator('.panel h1').innerText(), 'Central City');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: visual operations panel, Pixi facility cards, 9 department views, deep-linked weekly planner, save/reload, laptop breakpoints and accessible classic fallback',
  );
} finally {
  await browser.close();
}
