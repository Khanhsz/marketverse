import { CITY_PROFILES, WORLD_ENTITIES, type WorldEntity } from '../data/worldEntities.ts';
import { FINANCE_RULES } from '../data/rules.ts';
import type { City, Facility } from './game.ts';

export type CityOperationalStats = {
  sector: string;
  growthRate: number;
  wageIndex: number;
  rentIndex: number;
  taxRate: number;
  talentIndex: number;
  infrastructure: number;
  demandMultiplier: number;
  logisticsMultiplier: number;
  productivityMultiplier: number;
  retailMultiplier: number;
  entityCount: number;
};

export function cityEntities(cityId: string): readonly WorldEntity[] {
  return WORLD_ENTITIES.filter((entity) => entity.cityId === cityId);
}

/** One audited aggregate used by demand, production, logistics, finance and UI. */
export function cityOperationalStats(city: Pick<City, 'id'>): CityOperationalStats {
  const profile = CITY_PROFILES[city.id as keyof typeof CITY_PROFILES] ?? {
    sector: 'Diversified economy',
    growthRate: 0.01,
    wageIndex: 1,
    rentIndex: 1,
    taxRate: 0.18,
    talentIndex: 65,
    infrastructure: 65,
  };
  const entities = cityEntities(city.id);
  const sum = (key: 'demandBoost' | 'logisticsBoost' | 'productivityBoost' | 'retailBoost') =>
    entities.reduce(
      (total, entity) => total + entity.stats[key] * (entity.stats.condition / 100),
      0,
    );
  return {
    ...profile,
    demandMultiplier: Math.min(1.35, 0.9 + sum('demandBoost')),
    logisticsMultiplier: Math.max(
      0.58,
      1.18 - profile.infrastructure / 300 - sum('logisticsBoost'),
    ),
    productivityMultiplier: Math.min(
      1.35,
      0.75 + profile.infrastructure / 400 + sum('productivityBoost'),
    ),
    retailMultiplier: Math.min(1.35, 0.75 + profile.infrastructure / 500 + sum('retailBoost')),
    entityCount: entities.length,
  };
}

const FACILITY_BASE = {
  hq: { capacity: 120, workforce: 35, efficiency: 1.08 },
  store: { capacity: 260, workforce: 12, efficiency: 1 },
  factory: { capacity: 200, workforce: 40, efficiency: 1 },
  warehouse: { capacity: 1200, workforce: 18, efficiency: 1.05 },
  rd: { capacity: 100, workforce: 25, efficiency: 1.12 },
} as const;

export function facilityOperationalStats(facility: Facility, city: Pick<City, 'id'>) {
  const base = FACILITY_BASE[facility.kind];
  const local = cityOperationalStats(city);
  const localCapacity =
    facility.kind === 'store'
      ? local.retailMultiplier
      : facility.kind === 'factory'
        ? local.productivityMultiplier
        : facility.kind === 'warehouse'
          ? 1 / local.logisticsMultiplier
          : facility.kind === 'rd' || facility.kind === 'hq'
            ? 0.8 + local.talentIndex / 500
            : 1;
  return {
    level: 1,
    condition: 100,
    workforce: base.workforce,
    capacity: Math.max(1, Math.round(base.capacity * localCapacity)),
    efficiency: Math.round(base.efficiency * localCapacity * 100),
    weeklyCost: Math.round(
      FINANCE_RULES.rent[facility.kind] * local.rentIndex * (1 + local.taxRate * 0.2),
    ),
  };
}

export function transportQuoteModifiers(from: Pick<City, 'id'>, to: Pick<City, 'id'>) {
  const average =
    (cityOperationalStats(from).logisticsMultiplier +
      cityOperationalStats(to).logisticsMultiplier) /
    2;
  return { cost: average, leadTime: average <= 0.78 ? -1 : 0 };
}
