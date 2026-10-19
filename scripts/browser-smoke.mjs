import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.SMOKE_URL || 'http://127.0.0.1:5173/');
  const ready = async () => {
    await page.waitForFunction(() => document.querySelector('.mapSurface')?.dataset.camera);
    assert.equal(await page.locator('.map').getAttribute('data-error'), null);
    assert.equal(await page.locator('canvas').count(), 1);
  };
  const camera = async () => JSON.parse(await page.locator('.mapSurface').getAttribute('data-camera'));
  const screen = async (x,y) => {
    const box = await page.locator('canvas').boundingBox(), c = await camera();
    return { x: box.x + box.width/2 + (x*2-c.x)*c.scale, y: box.y + box.height/2 + (y*2-c.y)*c.scale };
  };
  const select = async (x,y,name) => {
    const before = await camera(), p = await screen(x,y);
    await page.mouse.click(p.x,p.y);
    await page.waitForFunction(n => document.querySelector('h1').textContent === n, name);
    assert.deepEqual(await camera(),before,'selection preserves camera');
    await ready();
  };
  await ready();
  const canvas = await page.locator('canvas').elementHandle();
  assert.equal(await page.locator('h1').innerText(), 'Central City');
  for (const [x,y,name] of [[390,160,'Northport'],[550,300,'Central City'],[670,440,'South Bay']]) await select(x,y,name);
  assert.ok(await canvas.evaluate(el => el.isConnected),'selection keeps renderer alive');
  const beforeZoom = await camera(), box = await page.locator('canvas').boundingBox();
  const cursor = {x:Math.round(box.x+box.width*.42),y:Math.round(box.y+box.height*.5)};
  const worldAt = c => ({x:c.x+(cursor.x-box.x-box.width/2)/c.scale,y:c.y+(cursor.y-box.y-box.height/2)/c.scale});
  await page.mouse.move(cursor.x,cursor.y);await page.mouse.wheel(0,-250);
  await page.waitForFunction(s => JSON.parse(document.querySelector('.mapSurface').dataset.camera).scale>s,beforeZoom.scale);
  const afterZoom = await camera();
  assert.ok(Math.abs(worldAt(beforeZoom).x-worldAt(afterZoom).x)<1e-6);
  assert.ok(Math.abs(worldAt(beforeZoom).y-worldAt(afterZoom).y)<1e-6);
  // Drag an unselected city in the unobstructed canvas; pointer release must not select it.
  const north = await screen(550,300);
  await page.mouse.move(north.x,north.y);await page.mouse.down();await page.mouse.move(north.x+90,north.y+45,{steps:10});await page.mouse.up();
  assert.equal(await page.locator('h1').innerText(),'South Bay','drag does not select');
  assert.notEqual((await camera()).x,afterZoom.x);
  await select(550,300,'Central City');
  const beforeResize = await camera();
  await page.setViewportSize({width:1280,height:800});
  await page.waitForFunction(() => document.querySelector('canvas').clientWidth === document.querySelector('.mapSurface').clientWidth);
  assert.deepEqual(await camera(),beforeResize,'resize keeps center and zoom');
  for (const name of ['Market','Competition','Operations','Logistics','Economy']) {
    await page.getByRole('button',{name,exact:true}).click();
    assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.mapSurface').getAttribute('data-layer'),name);
    assert.ok((await page.locator('.mapLegend').innerText()).length>30);
    assert.deepEqual(await camera(),beforeResize,'layer switch keeps camera');
  }
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  assert.equal((await camera()).x,960);assert.equal((await camera()).y,640);
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  const zoomIn = (await camera()).scale;
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();assert.ok((await camera()).scale<zoomIn);
  await page.getByRole('button',{name:'NEXT WEEK'}).click();
  await page.getByRole('button',{name:'Commit week',exact:true}).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week===2);
  await page.reload();await ready();assert.match(await page.locator('.metrics').innerText(),/W02/);
  await page.getByRole('button',{name:'Company',exact:true}).click();
  assert.equal(await page.locator('.panel').getAttribute('data-selection'),'company:player');
  assert.equal(await page.locator('h1').innerText(),'NOVA INDUSTRIES');
  await page.getByRole('button',{name:'Map',exact:true}).click();assert.equal(await page.locator('.panel').getAttribute('data-selection'),'city:central');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'RESET',exact:true}).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week===1);
  assert.equal(await page.locator('h1').innerText(),'Central City');
  // Facility and company marker interactions use real state IDs, with camera preserved.
  await page.getByRole('button',{name:'NOVA HQ',exact:true}).click();
  assert.equal(await page.locator('.panel').getAttribute('data-selection'),'facility:hq');
  await page.getByRole('button',{name:'NOVA INDUSTRIES',exact:true}).click();
  assert.equal(await page.locator('.panel').getAttribute('data-selection'),'company:player');
  await page.getByRole('button',{name:'Map',exact:true}).click();
  await page.getByRole('button',{name:'Competition',exact:true}).click();
  const p = await screen(390-14,160+48); // company diamond: world offset (-28,+96)
  await page.mouse.click(p.x,p.y);
  assert.equal(await page.locator('.panel').getAttribute('data-selection'),'company:premium');
  await page.getByRole('button',{name:'Atlas Showroom',exact:true}).click();
  assert.equal(await page.locator('.panel').getAttribute('data-selection'),'facility:atlas-store');
  assert.match(await page.locator('.panel').innerText(),/Competitor owned/);
  await page.getByRole('button',{name:'Northport',exact:true}).click();
  await page.getByRole('button',{name:'Central City',exact:true}).click();
  assert.equal(await page.locator('h1').innerText(),'Central City');
  // Test-only valid fixture exercises every facility kind without changing starter content.
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('marketverse:sprint01:state'));
    for(const kind of ['factory','warehouse','rd'])state.facilities.push({id:'test-'+kind,name:'Test '+kind,cityId:'central',companyId:'player',kind});
    localStorage.setItem('marketverse:sprint01:state',JSON.stringify(state));
  });
  await page.reload();await ready();
  for(const [i,name] of ['NOVA HQ','NOVA Flagship','Test factory','Test warehouse','Test rd'].entries()){
    const c=await camera(),b=await page.locator('canvas').boundingBox();
    await page.mouse.click(b.x+b.width/2+(1100-28+i*32-c.x)*c.scale,b.y+b.height/2+(600+52-c.y)*c.scale);
    assert.equal(await page.locator('h1').innerText(),name);
  }
  // Broken reference must not silently replace an existing save.
  const invalid=await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('marketverse:sprint01:state'));state.facilities[0].cityId='missing';const raw=JSON.stringify(state);localStorage.setItem('marketverse:sprint01:state',raw);return raw;});
  await page.reload();await page.getByRole('alert').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('marketverse:sprint01:state')),invalid);
  assert.equal(await page.getByRole('button',{name:'NEXT WEEK'}).isDisabled(),true);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export original save'}).click();
  assert.equal((await download).suggestedFilename(),'marketverse-recovery.json');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'RESET',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('[role=alert]'));
  await ready();assert.equal(await page.locator('h1').innerText(),'Central City');
  await page.getByRole('button',{name:'NEXT WEEK'}).click();
  await page.getByLabel('Price (nova)',{exact:true}).fill('270');
  await page.getByLabel('Production target (nova)',{exact:true}).fill('80');
  await page.getByLabel('Destination',{exact:true}).selectOption('north');
  await page.getByRole('button',{name:'Add construction',exact:true}).click();
  await page.getByRole('button',{name:'Add research',exact:true}).click();
  assert.match(await page.getByRole('dialog').innerText(),/70,000/);
  await page.getByRole('button',{name:'Commit week',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week===2);
  await page.reload();await ready();
  const committed=await page.evaluate(()=>JSON.parse(localStorage.getItem('marketverse:sprint01:state')));
  assert.equal(committed.policies.player.prices.nova,270);assert.equal(committed.projects[0].remaining,3);assert.equal(committed.companies[0].cash,2430000);
  await page.getByRole('button',{name:'NEXT WEEK'}).click();
  assert.equal(await page.getByLabel('Price (nova)',{exact:true}).inputValue(),'270');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  mkdirSync('.browser-artifacts',{recursive:true});
  await page.screenshot({path:'.browser-artifacts/smoke.png'});
  console.log('PASS: real canvas cities; cursor zoom; drag without selection; zoomed selection; camera retained on selection/layer/resize; five layers; reset/zoom controls; week/save/reload/reset/tabs; all facility kinds and ownership context; company marker; transport navigation; malformed-save preservation and recovery; laptop layout; no page errors.');
} finally { await browser.close(); }
