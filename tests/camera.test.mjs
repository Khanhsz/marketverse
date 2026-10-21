import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitCamera,
  panCamera,
  zoomCamera,
  screenToWorld,
  MAX_SCALE,
  minScaleForView,
} from '../src/ui/camera.ts';
const view = { width: 1000, height: 650 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test('cursor anchored zoom preserves world point, including at zoom bounds', () => {
  const camera = fitCamera(view),
    point = { x: 143, y: 499 },
    anchor = screenToWorld(camera, view, point);
  for (const factor of [2, 0.5, 1e9, 1e-9]) {
    const zoomed = zoomCamera(camera, view, point, factor),
      after = screenToWorld(zoomed, view, point);
    close(anchor.x, after.x);
    close(anchor.y, after.y);
    assert.ok(zoomed.scale >= minScaleForView(view) && zoomed.scale <= MAX_SCALE);
  }
});
test('pan translates by screen distance at every zoom without mutating camera', () => {
  for (const scale of [1, MAX_SCALE]) {
    const camera = { x: 960, y: 640, scale };
    const before = { ...camera };
    const after = panCamera(camera, view, 100, -35);
    close((camera.x - after.x) * scale, 100);
    close((camera.y - after.y) * scale, -35);
    assert.deepEqual(camera, before);
  }
});
test('camera keeps world center and scale when viewport resizes', () => {
  const camera = panCamera(zoomCamera(fitCamera(view), view, { x: 500, y: 325 }, 2), view, 80, 30);
  for (const resized of [view, { width: 650, height: 500 }])
    assert.deepEqual(
      screenToWorld(camera, resized, { x: resized.width / 2, y: resized.height / 2 }),
      { x: camera.x, y: camera.y },
    );
});
test('zooming and panning never expose space outside the world', () => {
  const views = [view, { width: 1600, height: 500 }, { width: 480, height: 900 }];
  for (const viewport of views) {
    let camera = zoomCamera(fitCamera(viewport), viewport, { x: 0, y: 0 }, 1e-9);
    camera = panCamera(camera, viewport, 1e9, -1e9);
    const halfWidth = viewport.width / (2 * camera.scale);
    const halfHeight = viewport.height / (2 * camera.scale);
    assert.ok(camera.x - halfWidth >= -1e-9);
    assert.ok(camera.x + halfWidth <= 1920 + 1e-9);
    assert.ok(camera.y - halfHeight >= -1e-9);
    assert.ok(camera.y + halfHeight <= 1280 + 1e-9);
    assert.ok(camera.scale >= minScaleForView(viewport));
  }
});
