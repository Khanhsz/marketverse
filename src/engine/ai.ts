import { HR_RULES } from '../data/rules.ts';
import type { Staff } from './people.ts';
import type { GameState, City, Product, Facility } from './game.ts';
import type { Policy, Project, TurnOrders, ProjectRequest } from './orders.ts';
import { AI_RULES, BUILD_RULES, RESEARCH_RULE, SHIPPING_RULE } from '../data/rules.ts';
import { route } from './orders.ts';
export type Archetype = keyof typeof AI_RULES;
export type Observation = {
  companyId: string;
  week: number;
  cash: number;
  staff: Staff;
  macro: { index: number; seasonal: number };
  bankrupt: boolean;
  strategy: Archetype;
  cities: City[];
  products: Product[];
  facilities: Facility[];
  projects: Project[];
  policy: Policy;
  stocks: { productId: string; cityId: string; quantity: number }[];
  marketPrices: { companyId: string; segment: string; price: number }[];
};
export function observeMarket(state: GameState, companyId: string): Observation {
  const company = state.companies.find((c) => c.id === companyId)!;
  const own = (id: string) => state.products.some((p) => p.id === id && p.companyId === companyId);
  return structuredClone({
    companyId,
    week: state.absoluteWeek,
    cash: company.cash,
    staff: state.staff[companyId],
    macro: { index: state.macro.index, seasonal: state.macro.seasonal },
    bankrupt: state.finance[companyId].bankrupt,
    strategy: company.strategy || 'regional-specialist',
    cities: state.cities,
    products: state.products.filter((p) => p.companyId === companyId),
    facilities: state.facilities.filter((f) => f.companyId === companyId),
    projects: state.projects.filter((p) => p.companyId === companyId && p.status === 'active'),
    policy: state.policies[companyId],
    stocks: state.stocks
      .filter((l) => own(l.productId))
      .map((l) => ({ productId: l.productId, cityId: l.cityId, quantity: l.quantity })),
    marketPrices: state.products
      .filter((p) => p.companyId !== companyId && (p.lifecycle === 'active' || p.inventory > 0))
      .map((p) => ({ companyId: p.companyId, segment: p.segment, price: p.price })),
  });
}
export function planAI(observation: Observation): TurnOrders {
  const o = observation,
    id = `ai:${o.companyId}:${o.week}`;
  if (o.bankrupt) return { id, expectedWeek: o.week, projects: [] };
  const config = AI_RULES[o.strategy],
    policy = structuredClone(o.policy),
    projects: ProjectRequest[] = [];
  let budget = Math.max(0, o.cash - config.reserve);
  const pending = (kind: string, cityId?: string) =>
    o.projects.some(
      (p) =>
        p.kind === 'construction' && p.facilityKind === kind && (!cityId || p.cityId === cityId),
    );
  const factory = o.facilities.find((f) => f.kind === 'factory'),
    home =
      o.facilities.find((f) => f.kind === 'hq' || f.kind === 'store')?.cityId || o.cities[0].id;
  if (!factory && !pending('factory') && budget >= BUILD_RULES.factory.cost) {
    projects.push({ kind: 'construction', cityId: home, facilityKind: 'factory' });
    budget -= BUILD_RULES.factory.cost;
  }
  for (const [role, target] of [
    ['production', 4],
    ['sales', 3],
    ['research', o.strategy === 'premium-innovator' ? 2 : 0],
  ] as const) {
    const incoming = o.projects
      .filter((p) => p.kind === 'hiring' && p.role === role)
      .reduce((n, p) => n + (p.kind === 'hiring' ? p.quantity : 0), 0);
    const quantity = Math.max(0, target - o.staff[role] - incoming),
      cost = quantity * HR_RULES.hiringCost;
    if (quantity && budget >= cost) {
      projects.push({ kind: 'hiring', role, quantity });
      budget -= cost;
    }
  }
  policy.marketing = Math.min(
    o.strategy === 'premium-innovator' ? 2000 : 1000,
    Math.floor(Math.max(0, budget) / 100),
  );
  const candidates = o.cities.filter(
    (c) =>
      !o.facilities.some((f) => f.cityId === c.id && f.kind === 'store') && !pending('store', c.id),
  );
  candidates.sort((a, b) => {
    const origin = o.cities.find((c) => c.id === home)!;
    const score = (c: City) =>
      (c.population * c.power) /
      (1 +
        (o.strategy === 'regional-specialist'
          ? Math.hypot(c.x - origin.x, c.y - origin.y) / 100
          : 0));
    return score(b) - score(a) || a.id.localeCompare(b.id);
  });
  if (
    o.week % config.expansionEvery === 0 &&
    candidates.length &&
    budget >= BUILD_RULES.store.cost
  ) {
    projects.push({ kind: 'construction', cityId: candidates[0].id, facilityKind: 'store' });
    budget -= BUILD_RULES.store.cost;
  }
  for (const product of o.products) {
    const observed = o.marketPrices.filter((p) => p.segment === product.segment),
      market = observed.length
        ? observed.reduce((n, p) => n + p.price, 0) / observed.length
        : product.price;
    policy.prices[product.id] = Math.max(
      Math.ceil(product.cost * 1.25),
      Math.round(product.cost * config.markup * (0.9 + 0.1 * o.macro.index) * 0.8 + market * 0.2),
    );
    policy.production[product.id] =
      factory && product.lifecycle === 'active'
        ? Math.round(config.target * o.macro.index * o.macro.seasonal)
        : 0;
    if (
      product.lifecycle === 'active' &&
      product.quality < 100 &&
      o.strategy === 'premium-innovator' &&
      o.week % 12 === 0 &&
      !o.projects.some((p) => p.kind === 'research' && p.productId === product.id) &&
      budget >= RESEARCH_RULE.cost
    ) {
      projects.push({ kind: 'research', productId: product.id });
      budget -= RESEARCH_RULE.cost;
    }
    for (const store of o.facilities.filter((f) => f.kind === 'store')) {
      if (
        o.stocks.some(
          (l) => l.productId === product.id && l.cityId === store.cityId && l.quantity > 0,
        ) ||
        o.projects.some(
          (p) => p.kind === 'shipment' && p.productId === product.id && p.cityId === store.cityId,
        )
      )
        continue;
      const source = o.stocks
        .filter((l) => l.productId === product.id && l.cityId !== store.cityId && l.quantity > 20)
        .sort((a, b) => b.quantity - a.quantity)[0];
      if (!source) continue;
      const path = route(o, source.cityId, store.cityId);
      if (!path) continue;
      const quantity = Math.min(80, Math.floor(source.quantity / 2)),
        cost = SHIPPING_RULE.base + quantity * (path.length - 1) * SHIPPING_RULE.perUnitPerLink;
      if (cost <= budget) {
        projects.push({
          kind: 'shipment',
          productId: product.id,
          originId: source.cityId,
          cityId: store.cityId,
          quantity,
        });
        budget -= cost;
        break;
      }
    }
  }
  return { id, expectedWeek: o.week, policy, projects };
}
