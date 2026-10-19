import test from 'node:test';
import assert from 'node:assert/strict';
import { fitCamera, panCamera, zoomCamera, screenToWorld, MIN_SCALE, MAX_SCALE } from '../src/ui/camera.ts';
const view = { width: 1000, height: 650 };
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('cursor anchored zoom preserves world point, including at zoom bounds',()=>{
 const camera=fitCamera(view),point={x:143,y:499},anchor=screenToWorld(camera,view,point);
 for(const factor of [2,.5,1e9,1e-9]) {
  const zoomed=zoomCamera(camera,view,point,factor),after=screenToWorld(zoomed,view,point);
  close(anchor.x,after.x);close(anchor.y,after.y);assert.ok(zoomed.scale>=MIN_SCALE&&zoomed.scale<=MAX_SCALE);
 }
});
test('pan translates by screen distance at every zoom without mutating camera',()=>{
 for(const scale of [MIN_SCALE,.5,MAX_SCALE]) {
  const camera={x:960,y:640,scale};const before={...camera};const after=panCamera(camera,100,-35);
  close((camera.x-after.x)*scale,100);close((camera.y-after.y)*scale,-35);assert.deepEqual(camera,before);
 }
});
test('camera keeps world center and scale when viewport resizes',()=>{
 const camera=panCamera(fitCamera(view),80,30);
 for(const resized of [view,{width:650,height:500}])assert.deepEqual(screenToWorld(camera,resized,{x:resized.width/2,y:resized.height/2}),{x:camera.x,y:camera.y});
});
