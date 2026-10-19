export type Camera = { x: number; y: number; scale: number };
export type Viewport = { width: number; height: number };
export const WORLD = { width: 1920, height: 1280 };
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 2;
export const MAP_UNITS = 2;
const clampScale = (scale: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
export function fitCamera(view: Viewport): Camera {
  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    scale: clampScale(Math.min(view.width / WORLD.width, view.height / WORLD.height)),
  };
}
export function screenToWorld(camera: Camera, view: Viewport, point: { x: number; y: number }) {
  return {
    x: camera.x + (point.x - view.width / 2) / camera.scale,
    y: camera.y + (point.y - view.height / 2) / camera.scale,
  };
}
export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x - dx / camera.scale, y: camera.y - dy / camera.scale };
}
export function zoomCamera(
  camera: Camera,
  view: Viewport,
  point: { x: number; y: number },
  factor: number,
): Camera {
  const anchor = screenToWorld(camera, view, point);
  const scale = clampScale(camera.scale * factor);
  return {
    x: anchor.x - (point.x - view.width / 2) / scale,
    y: anchor.y - (point.y - view.height / 2) / scale,
    scale,
  };
}
