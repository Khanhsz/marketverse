import { WORLD_SIZE } from './atlasLayers.ts';

/**
 * Visual anchors for the fictional world atlas artwork.
 * Normalized 0..1 positions are independent of simulation coordinates.
 * Keeping them here preserves existing saves, command replays, logistics costs and AI behavior.
 */
export const CITY_ARTWORK_ANCHORS = {
  // Tied to identifiable urban / port / lake / river artwork, NOT to engine geography.
  north: { x: 0.4, y: 0.215 }, // world atlas visual anchor
  lake: { x: 0.15, y: 0.29 }, // world atlas visual anchor
  east: { x: 0.86, y: 0.305 }, // world atlas visual anchor
  central: { x: 0.53, y: 0.47 }, // world atlas visual anchor
  west: { x: 0.16, y: 0.425 }, // world atlas visual anchor
  river: { x: 0.21, y: 0.6725 }, // world atlas visual anchor
  south: { x: 0.86, y: 0.7025 }, // world atlas visual anchor
  harbor: { x: 0.55, y: 0.755 }, // world atlas visual anchor
} as const;

/** Visual offset in artwork pixels, not simulation/world units. */
export const CITY_LABEL_OFFSETS = {
  north: { dx: -10, dy: -18 },
  lake: { dx: 0, dy: -20 },
  east: { dx: 10, dy: -18 },
  central: { dx: 12, dy: -18 },
  west: { dx: -8, dy: -18 },
  river: { dx: 0, dy: 18 },
  south: { dx: 16, dy: 14 },
  harbor: { dx: 10, dy: 18 },
} as const;

type CityLocation = { id: string; x: number; y: number };
type AnchorId = keyof typeof CITY_ARTWORK_ANCHORS;

/** World-space coordinate used consistently by every Pixi overlay and hit test. */
export function cityWorldPoint(city: CityLocation) {
  const anchor = CITY_ARTWORK_ANCHORS[city.id as AnchorId];
  if (!anchor) return { x: city.x * 2, y: city.y * 2 };
  return { x: anchor.x * WORLD_SIZE.width, y: anchor.y * WORLD_SIZE.height };
}

/** Default Pixi labels are offset from the city marker to avoid covering it. */
export function cityLabelPoint(city: CityLocation) {
  const center = cityWorldPoint(city);
  const shift = CITY_LABEL_OFFSETS[city.id as AnchorId];
  // Label offsets from the design are authored in PNG pixels (world/artwork = 1.25).
  return {
    x: center.x + 40 + (shift?.dx ?? 0) * 1.25,
    y: center.y - 18 + (shift?.dy ?? 0) * 1.25,
  };
}

/**
 * In the visual UI, all cities have small clickable chips and only the
 * selected city gets a detailed card. This prevents 8 big banners over the map.
 */
export function cityCardBounds(city: CityLocation, expanded = false) {
  const center = cityWorldPoint(city);
  const fullOffsets: Partial<Record<AnchorId, { dx: number; dy: number }>> = {
    north: { dx: 22, dy: -133 },
    lake: { dx: 28, dy: -130 },
    east: { dx: -312, dy: -132 },
    central: { dx: 24, dy: -132 },
    west: { dx: 24, dy: -130 },
    river: { dx: 24, dy: -132 },
    south: { dx: -312, dy: -130 },
    harbor: { dx: -318, dy: -140 },
  };
  const compactOffsets: Partial<Record<AnchorId, { dx: number; dy: number }>> = {
    north: { dx: 25, dy: -91 },
    lake: { dx: 26, dy: -91 },
    east: { dx: -225, dy: -101 },
    central: { dx: 25, dy: -86 },
    west: { dx: 28, dy: -90 },
    river: { dx: 24, dy: -85 },
    south: { dx: -226, dy: -84 },
    harbor: { dx: -224, dy: 16 },
  };
  const offset = (expanded ? fullOffsets : compactOffsets)[city.id as AnchorId] ?? {
    dx: 24,
    dy: -95,
  };
  return {
    x: center.x + offset.dx,
    y: center.y + offset.dy,
    width: expanded ? 300 : 204,
    height: expanded ? 108 : 50,
  };
}
