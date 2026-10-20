/** V6.1: static artwork and gameplay overlays are separate, camera-aligned layers. */
export type MapMode = 'Market' | 'Competition' | 'Operations' | 'Logistics' | 'Economy';
export type ArtworkLayer = 'terrain' | 'geography' | 'roads' | 'urban' | 'landmarks';
export const WORLD_SIZE = { width: 1920, height: 1280 } as const;
export const ARTWORK_SIZE = { width: 1536, height: 1024 } as const;
export const ARTWORK_SCALE = {
  x: WORLD_SIZE.width / ARTWORK_SIZE.width,
  y: WORLD_SIZE.height / ARTWORK_SIZE.height,
} as const;
export const ARTWORK_ORDER: ArtworkLayer[] = [
  'terrain',
  'geography',
  'roads',
  'urban',
  'landmarks',
];
export const MAP_MODES: Record<
  MapMode,
  {
    label: string;
    color: number;
    showRoutes: boolean;
    showFacilities: boolean;
    showMarket: boolean;
    showCompetition: boolean;
  }
> = {
  Market: {
    label: 'Demand intensity',
    color: 0x3d8068,
    showRoutes: false,
    showFacilities: false,
    showMarket: true,
    showCompetition: false,
  },
  Competition: {
    label: 'Company presence / market share',
    color: 0x5576a0,
    showRoutes: false,
    showFacilities: true,
    showMarket: false,
    showCompetition: true,
  },
  Operations: {
    label: 'Operating facilities',
    color: 0x647d8b,
    showRoutes: false,
    showFacilities: true,
    showMarket: false,
    showCompetition: false,
  },
  Logistics: {
    label: 'Incoming cargo & routes',
    color: 0x3c8391,
    showRoutes: true,
    showFacilities: false,
    showMarket: false,
    showCompetition: false,
  },
  Economy: {
    label: 'Purchasing power',
    color: 0x98834d,
    showRoutes: false,
    showFacilities: false,
    showMarket: true,
    showCompetition: false,
  },
};
export function artworkToWorld(x: number, y: number) {
  return { x: x * ARTWORK_SCALE.x, y: y * ARTWORK_SCALE.y };
}
export function worldToArtwork(x: number, y: number) {
  return { x: x / ARTWORK_SCALE.x, y: y / ARTWORK_SCALE.y };
}
