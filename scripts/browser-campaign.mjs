import { createHash, randomUUID } from 'node:crypto';
import { launchBrowser } from './browser-runtime.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await launchBrowser();
const key = 'marketverse:sprint01:state',
  url = process.env.SMOKE_URL || 'http://127.0.0.1:5173/';
mkdirSync('.browser-artifacts', { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } }),
    page = await context.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  page.once('dialog', (d) => d.accept());
  await page
    .getByLabel('Import save or replay', { exact: true })
    .setInputFiles('tests/fixtures/save-v1.json');
  await page.waitForFunction((k) => JSON.parse(localStorage.getItem(k)).version === 9, key);
  assert.match(await page.locator('.campaignReport').innerText(), /Foundation sandbox/);
  assert.equal(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).cities.length, key),
    3,
  );
  // Existing three-city saves must remain untouched until the player opts in.
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
  assert.equal(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).cities.length, key),
    3,
  );
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu với 8 thành phố' }).waitFor();
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Start national campaign', exact: true }).click();
  await page.waitForFunction(
    (k) => JSON.parse(localStorage.getItem(k)).campaign.mode === 'national',
    key,
  );
  const timings = [];
  for (let week = 1; week <= 104; week++) {
    const started = performance.now();
    await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).click();
    if (week === 1) {
      await page.getByRole('button', { name: 'Products', exact: true }).click();
      await page.getByLabel('Production target (nova)', { exact: true }).fill('180');
      await page.getByRole('button', { name: 'Projects & review', exact: true }).click();
      await page.getByLabel('Destination', { exact: true }).selectOption('north');
      await page.getByRole('button', { name: 'Add construction', exact: true }).click();
      await page.getByRole('button', { name: 'Add research', exact: true }).click();
      await page.getByRole('button', { name: 'Marketing & staff', exact: true }).click();
      await page.getByRole('button', { name: 'Increase Production hires', exact: true }).click();
      await page.getByLabel('Weekly media budget', { exact: true }).fill('500');
    }
    if (week === 5) {
      await page.getByRole('button', { name: 'Projects & review', exact: true }).click();
      await page.getByLabel('Destination', { exact: true }).selectOption('north');
      await page.getByLabel('Shipment origin', { exact: true }).selectOption('central');
      await page.getByLabel('Units', { exact: true }).fill('80');
      await page.getByRole('button', { name: 'Add shipment', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Commit week', exact: true }).click();
    await page.waitForFunction(
      ({ key, week }) => JSON.parse(localStorage.getItem(key)).absoluteWeek === week + 1,
      { key, week },
    );
    timings.push(performance.now() - started);
    if (week % 13 === 0) console.log(`Browser campaign: ${week}/104 weeks committed`);
    if (week === 52) {
      await page.reload();
      await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
      assert.match(await page.locator('.metrics').innerText(), /Y02 · W01/);
    }
  }
  await page.getByRole('dialog', { name: 'Campaign complete' }).waitFor();
  await page.screenshot({ path: '.browser-artifacts/campaign-complete.png' });
  assert.match(await page.getByRole('dialog').innerText(), /104 business weeks completed/);
  const completeDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export completed campaign', exact: true }).click();
  await (await completeDownload).saveAs('.browser-artifacts/completed-save.json');
  await page.getByRole('button', { name: 'Review map', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Xem kế hoạch tuần' }).isDisabled(), true);
  const original = await page.evaluate((k) => localStorage.getItem(k), key),
    state = JSON.parse(original);
  assert.equal(state.campaign.status, 'completed');
  assert.equal(state.replay.commands.length, 104);
  assert.equal(state.reports.length, 104);
  assert.equal(state.cities.length, 8);
  assert.equal(state.companies.length, 5);
  assert.ok(
    state.projects.some(
      (p) => p.kind === 'shipment' && p.companyId === 'player' && p.status === 'completed',
    ),
  );
  assert.ok(state.products.some((p) => p.parentId === 'nova'));
  assert.equal(readFileSync('.browser-artifacts/completed-save.json', 'utf8'), original);
  await page.getByRole('button', { name: 'Báo cáo', exact: true }).click();
  await page.getByLabel('Report period', { exact: true }).selectOption('52');
  assert.match(await page.getByRole('dialog').innerText(), /52\/52 reported/);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  // Invalid imports preserve the exact current save; no confirmation is requested.
  await page
    .getByLabel('Import save or replay', { exact: true })
    .setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), original);
  const corrupt = { ...state, version: 999 };
  await page.getByLabel('Import save or replay', { exact: true }).setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(corrupt)),
  });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), original);
  // Restore exported save in a fresh browser; then verify full replay in a worker.
  const saveContext = await browser.newContext({ viewport: { width: 1280, height: 800 } }),
    restore = await saveContext.newPage();
  restore.on('pageerror', (e) => errors.push(e.message));
  await restore.goto(url);
  await restore.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
  await restore.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await restore.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  restore.once('dialog', (d) => d.accept());
  await restore
    .getByLabel('Import save or replay', { exact: true })
    .setInputFiles('.browser-artifacts/completed-save.json');
  await restore.getByRole('dialog', { name: 'Campaign complete' }).waitFor();
  await restore.getByRole('button', { name: 'Review map', exact: true }).click();
  assert.equal(await restore.evaluate((k) => localStorage.getItem(k), key), original);
  const replayDownload = restore.waitForEvent('download');
  await restore.getByRole('button', { name: /^Export replay from week/ }).click();
  await (await replayDownload).saveAs('.browser-artifacts/completed-replay.json');
  await saveContext.close();
  const replayContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    }),
    replayPage = await replayContext.newPage();
  replayPage.on('pageerror', (e) => errors.push(e.message));
  await replayPage.goto(url);
  await replayPage.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
  await replayPage.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await replayPage.getByRole('button', { name: 'Thông tin nâng cao & nhập save' }).click();
  replayPage.once('dialog', (d) => d.accept());
  await replayPage
    .getByLabel('Import save or replay', { exact: true })
    .setInputFiles('.browser-artifacts/completed-replay.json');
  await replayPage.getByRole('dialog', { name: 'Campaign complete' }).waitFor({ timeout: 120000 });
  assert.equal(await replayPage.evaluate((k) => localStorage.getItem(k), key), original);
  assert.deepEqual(errors, []);
  const result = {
    version: '0.1.0-alpha.1',
    runId: randomUUID(),
    production: process.env.BROWSER_PRODUCTION === '1',
    browserVersion: await browser.version(),
    saveSha256: createHash('sha256').update(original).digest('hex'),
    replaySha256: createHash('sha256')
      .update(readFileSync('.browser-artifacts/completed-replay.json'))
      .digest('hex'),
    weeks: 104,
    cities: 8,
    rivals: 4,
    replayCommands: 104,
    score: state.campaign.score.total,
    completedSaveRestored: true,
    workerReplayExact: true,
    malformedImportsPreserveData: true,
    yearReportComplete: true,
    uncaughtErrors: errors,
    medianUiTurnMs: [...timings].sort((a, b) => a - b)[52],
    maxUiTurnMs: Math.max(...timings),
    testedViewports: ['1366x768 DPR1', '1280x800 DPR2'],
  };
  writeFileSync('docs/validation/ALPHA_BROWSER_16.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  await replayContext.close();
  await context.close();
} finally {
  await browser.close();
}
