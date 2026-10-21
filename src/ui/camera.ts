export type Camera = { x: number; y: number; scale: number };
export type Viewport = { width: number; height: number };
export const WORLD = { width: 1920, height: 1280 };
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 2;
export const minScaleForView = (view: Viewport) =>
  Math.max(MIN_SCALE, view.width / WORLD.width, view.height / WORLD.height);
const clampScale = (scale: number, view: Viewport) =>
  Math.max(minScaleForView(view), Math.min(MAX_SCALE, scale));
export function constrainCamera(camera: Camera, view: Viewport): Camera {
  const scale = clampScale(camera.scale, view);
  const halfWidth = view.width / (2 * scale);
  const halfHeight = view.height / (2 * scale);
  const clampAxis = (center: number, half: number, size: number) =>
    half * 2 >= size ? size / 2 : Math.max(half, Math.min(size - half, center));
  return {
    x: clampAxis(camera.x, halfWidth, WORLD.width),
    y: clampAxis(camera.y, halfHeight, WORLD.height),
    scale,
  };
}
export function fitCamera(view: Viewport): Camera {
  return constrainCamera(
    {
      x: WORLD.width / 2,
      y: WORLD.height / 2,
      scale: minScaleForView(view),
    },
    view,
  );
}
export function screenToWorld(camera: Camera, view: Viewport, point: { x: number; y: number }) {
  return {
    x: camera.x + (point.x - view.width / 2) / camera.scale,
    y: camera.y + (point.y - view.height / 2) / camera.scale,
  };
}
export function panCamera(camera: Camera, view: Viewport, dx: number, dy: number): Camera {
  return constrainCamera(
    { ...camera, x: camera.x - dx / camera.scale, y: camera.y - dy / camera.scale },
    view,
  );
}
export function zoomCamera(
  camera: Camera,
  view: Viewport,
  point: { x: number; y: number },
  factor: number,
): Camera {
  const anchor = screenToWorld(camera, view, point);
  const scale = clampScale(camera.scale * factor, view);
  return constrainCamera(
    {
      x: anchor.x - (point.x - view.width / 2) / scale,
      y: anchor.y - (point.y - view.height / 2) / scale,
      scale,
    },
    view,
  );
}
