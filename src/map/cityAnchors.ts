import { WORLD_SIZE } from './atlasLayers.ts';

/**
 * Visual anchors for the hand-illustrated V6 country artwork.
 * Normalized 0..1 positions are independent of simulation coordinates.
 * Keeping them here preserves existing saves, command replays, logistics costs and AI behavior.
 */
export const CITY_ARTWORK_ANCHORS = {
  // Tied to identifiable urban / port / lake / river artwork, NOT to engine geography.
  north: { x: 0.35, y: 0.275 },    // northwest port and docks
  lake: { x: 0.445, y: 0.355 },    // central-north lake shore (not the mountain)
  east: { x: 0.845, y: 0.40 },     // eastern industrial gateway
  central: { x: 0.565, y: 0.475 }, // dense central interchange
  west: { x: 0.315, y: 0.49 },     // western developed valley
  river: { x: 0.445, y: 0.61 },    // west bank of river bend
  south: { x: 0.75, y: 0.69 },     // southeast urban coastal district
  harbor: { x: 0.685, y: 0.815 }, // southern harbor shoreline
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
  const shift = layout === 'artwork' ? CITY_LABEL_OFFSETS[city.id as AnchorId] : undefined;
  // Label offsets from the design are authored in PNG pixels (world/artwork = 1.25).
  return {
    x: center.x + 40 + (shift?.dx ?? 0) * 1.25,
    y: center.y - 18 + (shift?.dy ?? 0) * 1.25,
  };
}

/**
 * In the visual UI, all cities have small clickable chips and only the
 * selected city gets a detailed card. This prevents 8 big banners over the map.
 * Legacy layout keeps the original full-size cards and old hit regions.
 */
export function cityCardBounds(
  city: CityLocation,
  layout: Layout = 'artwork',
  expanded = false,
) {
  const center = cityWorldPoint(city, layout);
  if (layout === 'legacy') {
    return { x: center.x - 16, y: center.y - 138, width: 284, height: 91 };
  }
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
  const offset = (expanded ? fullOffsets : compactOffsets)[city.id as AnchorId] ??
    { dx: 24, dy: -95 };
  return {
    x: center.x + offset.dx,
    y: center.y + offset.dy,
    width: expanded ? 300 : 204,
    height: expanded ? 108 : 50,
  };
}
