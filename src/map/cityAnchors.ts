import { WORLD_SIZE } from './atlasLayers.ts';

/**
 * Visual anchors for the hand-illustrated V6 country artwork.
 * Normalized 0..1 positions are independent of simulation coordinates.
 * Keeping them here preserves existing saves, command replays, logistics costs and AI behavior.
 */
export const CITY_ARTWORK_ANCHORS = {
  north:   { x: 0.39, y: 0.26 },
  lake:    { x: 0.61, y: 0.26 },
  east:    { x: 0.82, y: 0.39 },
  central: { x: 0.63, y: 0.47 },
  west:    { x: 0.36, y: 0.49 },
  river:   { x: 0.52, y: 0.67 },
  south:   { x: 0.78, y: 0.70 },
  harbor:  { x: 0.70, y: 0.80 },
} as const;

/** Visual offset in artwork pixels, not simulation/world units. */
export const CITY_LABEL_OFFSETS = {
  north:   { dx: -10, dy: -18 },
  lake:    { dx: 0, dy: -20 },
  east:    { dx: 10, dy: -18 },
  central: { dx: 12, dy: -18 },
  west:    { dx: -8, dy: -18 },
  river:   { dx: 0, dy: 18 },
  south:   { dx: 16, dy: 14 },
  harbor:  { dx: 10, dy: 18 },
} as const;

type CityLocation = { id: string; x: number; y: number };
type Layout = 'artwork' | 'legacy';
type AnchorId = keyof typeof CITY_ARTWORK_ANCHORS;

/** World-space coordinate used consistently by every Pixi overlay and hit test. */
export function cityWorldPoint(city: CityLocation, layout: Layout = 'artwork') {
  const anchor = CITY_ARTWORK_ANCHORS[city.id as AnchorId];
  if (layout === 'legacy' || !anchor) return { x: city.x * 2, y: city.y * 2 };
  return { x: anchor.x * WORLD_SIZE.width, y: anchor.y * WORLD_SIZE.height };
}

/** Default Pixi labels are offset from the city marker to avoid covering it. */
export function cityLabelPoint(city: CityLocation, layout: Layout = 'artwork') {
  const center = cityWorldPoint(city, layout);
  const shift = layout === 'artwork'
    ? CITY_LABEL_OFFSETS[city.id as AnchorId]
    : undefined;
  // Label offsets from the design are authored in PNG pixels (world/artwork = 1.25).
  return {
    x: center.x + 40 + (shift?.dx ?? 0) * 1.25,
    y: center.y - 18 + (shift?.dy ?? 0) * 1.25,
  };
}

/** The card rectangle is shared by drawing and pointer hit detection. */
export function cityCardBounds(city: CityLocation, layout: Layout = 'artwork') {
  const center = cityWorldPoint(city, layout);
  const offsets: Partial<Record<AnchorId, { dx: number; dy: number }>> = {
    east: { dx: -270, dy: -138 },
    south: { dx: -16, dy: -138 },
    harbor: { dx: -284, dy: 12 },
  };
  const offset = layout === 'artwork' ? offsets[city.id as AnchorId] : undefined;
  return {
    x: center.x + (offset?.dx ?? -16),
    y: center.y + (offset?.dy ?? -138),
    width: 284,
    height: 91,
  };
}
