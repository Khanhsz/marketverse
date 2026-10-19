import { roundSimulation } from './precision.ts';
import type { GameState, Segment } from './game.ts';
import type { Policy } from './orders.ts';
import { HR_RULES } from '../data/rules.ts';
export type Staff = { production: number; sales: number; research: number };
export type StaffRole = keyof Staff;
export const STAFF_ROLES = ['production', 'sales', 'research'] as const;
export const brandKey = (companyId: string, cityId: string, segment: string) =>
  `${companyId}|${cityId}|${segment}`;
export function initializeStaff(
  state: Pick<GameState, 'companies' | 'factories' | 'facilities' | 'policies'>,
): Record<string, Staff> {
  return Object.fromEntries(
    state.companies.map((c) => [
      c.id,
      {
        production: state.factories
          .filter((f) => state.facilities.find((x) => x.id === f.facilityId)?.companyId === c.id)
          .reduce((n, f) => n + f.workers, 0),
        sales: Math.max(2, state.policies[c.id].staff),
        research: 0,
      },
    ]),
  );
}
export function marketingBudget(policy: Policy) {
  return (
    policy.marketing +
    Object.values(policy.media || {}).reduce(
      (n, segments) => n + Object.values(segments).reduce((m, v) => m + v, 0),
      0,
    )
  );
}
export function updateBrand(state: GameState) {
  const totalPopulation = state.cities.reduce((n, c) => n + c.population, 0);
  for (const company of state.companies) {
    const policy = state.policies[company.id],
      budget = marketingBudget(policy);
    const paid = -state.ledger
      .filter(
        (e) =>
          e.companyId === company.id &&
          e.week === state.absoluteWeek &&
          e.memo === 'Weekly marketing',
      )
      .flatMap((e) => e.lines)
      .filter((l) => l.account === 'cash')
      .reduce((n, l) => n + l.amount, 0);
    const funded = budget ? Math.max(0, Math.min(1, paid / budget)) : 0;
    for (const city of state.cities)
      for (const segment of ['value', 'mainstream', 'premium'] as Segment[]) {
        const key = brandKey(company.id, city.id, segment),
          before = state.brand[key] || 0;
        const spend =
          ((policy.media?.[city.id]?.[segment] || 0) +
            ((policy.marketing * city.population) / totalPopulation) * city.segments[segment]) *
          funded;
        const retained = before * (1 - HR_RULES.brandDecay);
        state.brand[key] = roundSimulation(
          Math.min(
            1,
            retained +
              (1 - retained) *
                (1 - Math.exp(-spend / HR_RULES.brandSpendScale)) *
                HR_RULES.brandBuild,
          ),
        );
      }
  }
}
export function allocateWorkers(state: GameState) {
  for (const company of state.companies) {
    let available = state.staff[company.id].production;
    for (const f of state.factories
      .filter((f) => state.facilities.find((x) => x.id === f.facilityId)?.companyId === company.id)
      .sort((a, b) => a.facilityId.localeCompare(b.facilityId))) {
      f.workers = Math.min(4, available);
      available -= f.workers;
    }
  }
}
export function validatePeople(state: GameState) {
  if (!state.staff || !state.brand) throw new Error('Invalid workforce or brand state');
  for (const company of state.companies) {
    const staff = state.staff[company.id];
    if (
      !staff ||
      STAFF_ROLES.some((r) => !Number.isSafeInteger(staff[r]) || staff[r] < 0 || staff[r] > 1000)
    )
      throw new Error('Invalid staffing');
  }
  const valid = new Set(
    state.companies.flatMap((c) =>
      state.cities.flatMap((city) =>
        ['value', 'mainstream', 'premium'].map((s) => brandKey(c.id, city.id, s)),
      ),
    ),
  );
  for (const [key, value] of Object.entries(state.brand))
    if (!valid.has(key) || !Number.isFinite(value) || value < 0 || value > 1)
      throw new Error('Invalid awareness');
}
