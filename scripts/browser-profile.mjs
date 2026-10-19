import {chromium} from 'playwright';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const [width,height,dpr] of [[1024,768,1],[1280,800,1],[1440,900,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:5173/');await page.waitForFunction(()=>document.querySelector('.mapSurface')?.dataset.camera);
  await page.evaluate(async()=>{const {createNationalCampaign}=await import('/src/engine/campaign.ts');localStorage.setItem('marketverse:sprint01:state',JSON.stringify(createNationalCampaign()));});
  await page.reload();await page.waitForFunction(()=>document.querySelector('.mapSurface')?.dataset.camera);
  const frames=await page.evaluate(async()=>{const canvas=document.querySelector('canvas');canvas.focus();const deltas=[];let prior=performance.now();for(let i=0;i<60;i++){await new Promise(requestAnimationFrame);const now=performance.now();if(i>0)deltas.push(now-prior);prior=now;canvas.dispatchEvent(new KeyboardEvent('keydown',{key:i%2?'ArrowLeft':'ArrowRight',bubbles:true,cancelable:true}));}deltas.sort((a,b)=>a-b);return {p95FrameMs:deltas[Math.floor(deltas.length*.95)],maxFrameMs:Math.max(...deltas),sampleCount:deltas.length};});
  assert.ok(frames.p95FrameMs<100,`Pan frame budget at ${width}: ${frames.p95FrameMs}`);
  assert.equal(await page.locator('canvas').count(),1);assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  mkdirSync('.browser-artifacts',{recursive:true});await page.screenshot({path:`.browser-artifacts/laptop-${width}-${dpr}x.png`});
  results.push({width,height,devicePixelRatio:dpr,...frames,uncaughtErrors:errors.length,horizontalOverflow:false,canvasCount:1});await context.close();
 }
 mkdirSync('docs/validation',{recursive:true});writeFileSync('docs/validation/UI_PROFILE_15.json',JSON.stringify({browser:'Chromium headless with software SwiftShader',scope:'Eight-city national map; focused keyboard pan; no guarantee for other hardware',results},null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close();}
