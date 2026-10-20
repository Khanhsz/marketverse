/** V6.1: static artwork and gameplay overlays are separate, camera-aligned layers. */
export type MapMode = 'Market' | 'Competition' | 'Operations' | 'Logistics' | 'Economy';
export const WORLD_SIZE = { width: 1920, height: 1280 } as const;
export const ARTWORK_SIZE = { width: 1536, height: 1024 } as const;

export const MAP_MODES: Record<
  MapMode,
  {
    label: string;
    color: number;
  }
> = {
  Market: {
    label: 'Demand intensity',
    color: 0x3d8068,
  },
  Competition: {
    label: 'Company presence / market share',
    color: 0x5576a0,
  },
  Operations: {
    label: 'Operating facilities',
    color: 0x647d8b,
  },
  Logistics: {
    label: 'Incoming cargo & routes',
    color: 0x3c8391,
  },
  Economy: {
    label: 'Purchasing power',
    color: 0x98834d,
  },
};
