import type { City } from '../engine/game.ts';
export function nationalCities(): City[] {
  const cities: City[] = [
    {
      id: 'north',
      name: 'Northport',
      x: 390,
      y: 160,
      population: 660000,
      power: 1.12,
      segments: { value: 0.29, mainstream: 0.48, premium: 0.23 },
      links: [],
    },
    {
      id: 'central',
      name: 'Central City',
      x: 550,
      y: 300,
      population: 1120000,
      power: 1,
      segments: { value: 0.34, mainstream: 0.49, premium: 0.17 },
      links: [],
    },
    {
      id: 'south',
      name: 'South Bay',
      x: 670,
      y: 440,
      population: 840000,
      power: 0.92,
      segments: { value: 0.42, mainstream: 0.46, premium: 0.12 },
      links: [],
    },
    {
      id: 'west',
      name: 'Westridge',
      x: 325,
      y: 310,
      population: 540000,
      power: 0.85,
      segments: { value: 0.48, mainstream: 0.4, premium: 0.12 },
      links: [],
    },
    {
      id: 'east',
      name: 'Eastgate',
      x: 720,
      y: 245,
      population: 980000,
      power: 1.18,
      segments: { value: 0.24, mainstream: 0.48, premium: 0.28 },
      links: [],
    },
    {
      id: 'river',
      name: 'Riverbend',
      x: 465,
      y: 420,
      population: 430000,
      power: 0.9,
      segments: { value: 0.45, mainstream: 0.43, premium: 0.12 },
      links: [],
    },
    {
      id: 'lake',
      name: 'Lakeview',
      x: 530,
      y: 165,
      population: 720000,
      power: 1.3,
      segments: { value: 0.2, mainstream: 0.45, premium: 0.35 },
      links: [],
    },
    {
      id: 'harbor',
      name: 'Sunhaven',
      x: 620,
      y: 495,
      population: 790000,
      power: 1.05,
      segments: { value: 0.33, mainstream: 0.47, premium: 0.2 },
      links: [],
    },
  ];
  for (const [a, b] of [
    ['north', 'central'],
    ['central', 'south'],
    ['north', 'lake'],
    ['lake', 'east'],
    ['east', 'central'],
    ['central', 'west'],
    ['west', 'river'],
    ['river', 'south'],
    ['south', 'harbor'],
    ['harbor', 'east'],
    ['lake', 'central'],
  ]) {
    cities.find((c) => c.id === a)!.links.push(b);
    cities.find((c) => c.id === b)!.links.push(a);
  }
  return cities;
}
export const CAMPAIGN_RULES = {
  length: 104,
  targets: { profit: 300000, liquidity: 500000, share: 0.15, innovation: 3, brand: 0.25, reach: 4 },
  weights: { profit: 0.2, liquidity: 0.15, share: 0.2, innovation: 0.15, brand: 0.15, reach: 0.15 },
};
