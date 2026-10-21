import type { Country } from '../data/countries';

export type CountryArtworkPlacement = {
  width: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
};

/**
 * Display sizes are authored in the 1920×1280 world coordinate space.
 * The cutouts intentionally overlap slightly so the original continent coastlines
 * remain continuous beneath the independently selectable country sprites.
 */
export const COUNTRY_ARTWORK_LAYOUT: Readonly<Record<string, CountryArtworkPlacement>> = {
  aldera: { width: 188, rotation: -0.05 },
  norlan: { width: 202, rotation: 0.03 },
  cascadia: { width: 184, rotation: -0.02 },
  unita: { width: 178, rotation: 0.02 },
  freyland: { width: 188, rotation: 0.04 },
  solridge: { width: 230, rotation: -0.02 },
  frostria: { width: 176, rotation: -0.03 },
  halsvik: { width: 178, rotation: 0.02 },
  bjornar: { width: 182, rotation: -0.03 },
  kaldor: { width: 158, rotation: 0.03 },
  varsgard: { width: 166, rotation: -0.02 },
  nyland: { width: 176, rotation: 0.02 },
  valmira: { width: 176, rotation: -0.03 },
  arvan: { width: 166, rotation: 0.02 },
  kaelis: { width: 166, rotation: -0.01 },
  meldan: { width: 184, rotation: -0.03 },
  dreval: { width: 206, rotation: 0.02 },
  soran: { width: 170, rotation: -0.02 },
  keshana: { width: 158, rotation: 0.03 },
  talora: { width: 158, rotation: -0.02 },
  zahir: { width: 190, rotation: -0.03 },
  miran: { width: 196, rotation: 0.04 },
  qadir: { width: 184, rotation: -0.02 },
  khald: { width: 204, rotation: 0.02 },
  danura: { width: 186, rotation: -0.03 },
  liria: { width: 188, rotation: -0.04 },
  orin: { width: 166, rotation: 0.02 },
  sylva: { width: 184, rotation: -0.02 },
  tamara: { width: 184, rotation: 0.02 },
  vela: { width: 170, rotation: -0.03 },
  nexis: { width: 198, rotation: 0.03 },
  drakon: { width: 212, rotation: -0.03 },
  svarin: { width: 214, rotation: 0.02 },
  thuria: { width: 226, rotation: -0.02 },
  valtera: { width: 220, rotation: 0.02 },
  caelon: { width: 164, rotation: -0.04 },
  lumara: { width: 176, rotation: 0.01 },
  tavia: { width: 174, rotation: 0.04 },
};

export function countryArtworkPath(country: Pick<Country, 'continent' | 'id'>) {
  return `/maps/countries/${country.continent}/${country.id}.png`;
}
