import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SMOKE_URL || 'http://127.0.0.1:5173/');
 const ready=async()=>{await page.locator('canvas').waitFor();await page.waitForTimeout(300);assert.equal(await page.locator('.map').getAttribute('data-error'),null);};
 await ready();assert.equal(await page.locator('h1').innerText(),'Central City');
 for(const [x,y,name] of [[390,160,'Northport'],[550,300,'Central City'],[670,440,'South Bay']]){
 const box=await page.locator('canvas').boundingBox();const s=Math.min(box.width/960,box.height/640);
 await page.mouse.click(box.x+(box.width-960*s)/2+x*s,box.y+(box.height-640*s)/2+y*s);
 await page.waitForFunction(n=>document.querySelector('h1').textContent===n,name);await ready();
 }
 await page.getByRole('button',{name:'NEXT WEEK'}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week===2);
 await page.reload();await ready();assert.match(await page.locator('.metrics').innerText(),/W02/);
 console.log('Reload selection:',await page.locator('h1').innerText());
 await page.getByRole('button',{name:'Company',exact:true}).click();await page.locator('.floating').waitFor();
 await page.getByRole('button',{name:'Map',exact:true}).click();assert.equal(await page.locator('.floating').count(),0);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESET',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('marketverse:sprint01:state')).week===1);
 assert.equal(await page.locator('h1').innerText(),'Central City');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 mkdirSync('.browser-artifacts',{recursive:true});
 await page.screenshot({path:'.browser-artifacts/smoke.png'});
 console.log('PASS: 3 canvas city selections, week advance, persisted week on reload, company/map tabs, reset, laptop layout, no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
