import { STAFF_ROLES } from './people.ts';
import type { StaffRole } from './people.ts';
import { HR_RULES } from '../data/rules.ts';
import { quoteResearch, completeResearch, validAttributes } from './products.ts';
import type { Attributes } from './products.ts';
import type { Segment } from './game.ts';
import { projectPayment, post, financing } from './finance.ts';
import { consumeStock, receiveStock, localStock } from './operations.ts';
import type { Cargo } from './operations.ts';
import type { GameState, Facility } from './game.ts';
import { placementError, FACILITY_KINDS } from './entities.ts';
import { BUILD_RULES, SHIPPING_RULE } from '../data/rules.ts';
export type Policy = {
  prices: Record<string, number>;
  production: Record<string, number>;
  marketing: number;
  staff: number;
  media: Record<string, Partial<Record<Segment, number>>>;
};
export type ProjectRequest =
  | { kind: 'hiring'; role: StaffRole; quantity: number }
  | { kind: 'construction'; cityId: string; facilityKind: Facility['kind'] }
  | { kind: 'research'; productId: string; attributes?: Attributes; segment?: Segment }
  | { kind: 'shipment'; productId: string; originId: string; cityId: string; quantity: number };
export type Project = ProjectRequest & {
  id: string;
  companyId: string;
  cost: number;
  createdWeek: number;
  dueWeek: number;
  remaining: number;
  status: 'active' | 'completed';
  cargo?: Cargo[];
};
export type TurnOrders = {
  id: string;
  expectedWeek: number;
  policy?: Policy;
  projects: ProjectRequest[];
  financing?: { borrow: number; repay: number };
};
export const integer = (n: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
export function initialPolicies(
  state: Pick<GameState, 'companies' | 'products'>,
): Record<string, Policy> {
  return Object.fromEntries(
    state.companies.map((c) => [
      c.id,
      {
        prices: Object.fromEntries(
          state.products.filter((p) => p.companyId === c.id).map((p) => [p.id, p.price]),
        ),
        production: {},
        marketing: 0,
        staff: 0,
        media: {},
      },
    ]),
  );
}
export function route(
  state: Pick<GameState, 'cities'>,
  from: string,
  to: string,
): string[] | undefined {
  if (!state.cities.some((c) => c.id === from) || !state.cities.some((c) => c.id === to)) return;
  const queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!,
      last = path.at(-1)!;
    if (last === to) return path;
    for (const next of [...state.cities.find((c) => c.id === last)!.links].sort())
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
  }
}
export function quoteProject(
  state: GameState,
  actor: string,
  request: ProjectRequest,
): { cost: number; weeks: number } {
  if (!state.companies.some((c) => c.id === actor)) throw new Error('Unknown company');
  if (request.kind === 'hiring') {
    if (
      !STAFF_ROLES.includes(request.role) ||
      !integer(request.quantity, 1, 100)
    )
      throw new Error('Invalid hiring');
    return { cost: request.quantity * HR_RULES.hiringCost, weeks: HR_RULES.hiringWeeks };
  }
  if (request.kind === 'construction') {
    const pending = state.projects
      .filter(
        (p): p is Project & { kind: 'construction' } =>
          p.status === 'active' && p.kind === 'construction',
      )
      .map(
        (p) =>
          ({
            id: p.id,
            name: p.id,
            companyId: p.companyId,
            cityId: p.cityId,
            kind: p.facilityKind,
          }) as Facility,
      );
    const error = placementError(
      { ...state, facilities: [...state.facilities, ...pending] },
      { companyId: actor, cityId: request.cityId, kind: request.facilityKind },
    );
    if (error) throw new Error(error);
    return BUILD_RULES[request.facilityKind];
  }
  const product = state.products.find((p) => p.id === request.productId && p.companyId === actor);
  if (!product) throw new Error('Product is not owned by company');
  if (request.kind === 'research') {
    if (
      state.projects.some(
        (p) => p.kind === 'research' && p.productId === request.productId && p.status === 'active',
      )
    )
      throw new Error('Research already queued');
    if (product.lifecycle !== 'active') throw new Error('Research requires an active SKU');
    if (request.segment && !['value', 'mainstream', 'premium'].includes(request.segment))
      throw new Error('Invalid target segment');
    const q = quoteResearch(product, request.attributes);
    return {
      ...q,
      cost: Math.round(q.cost * (1 - Math.min(0.2, state.staff[actor].research * 0.02))),
    };
  }
  if (request.kind !== 'shipment' || !integer(request.quantity, 1))
    throw new Error('Invalid shipment');
  if (request.originId === request.cityId) throw new Error('Shipment needs different cities');
  const path = route(state, request.originId, request.cityId);
  if (!path) throw new Error('No transport route');
  for (const id of [request.originId, request.cityId])
    if (!state.facilities.some((f) => f.companyId === actor && f.cityId === id))
      throw new Error('Company needs facilities at both shipment nodes');
  if (localStock(state, product.id, request.originId) < request.quantity)
    throw new Error('Insufficient inventory');
  return {
    cost: SHIPPING_RULE.base + request.quantity * (path.length - 1) * SHIPPING_RULE.perUnitPerLink,
    weeks: Math.min(3, path.length - 1),
  };
}
export function validatePolicy(state: GameState, actor: string, policy: Policy) {
  if (
    !policy ||
    !policy.prices ||
    !policy.production ||
    !integer(policy.marketing, 0, 1000000) ||
    !integer(policy.staff, 0, 1000)
  )
    throw new Error('Invalid policy');
  if (
    !policy.media ||
    Object.entries(policy.media).some(
      ([id, segments]) =>
        !state.cities.some((c) => c.id === id) ||
        Object.entries(segments).some(
          ([s, v]) => !['value', 'mainstream', 'premium'].includes(s) || !integer(v!, 0, Number.MAX_SAFE_INTEGER),
        ),
    )
  )
    throw new Error('Invalid media policy');
  for (const [ids, minimum] of [
    [policy.prices, 1],
    [policy.production, 0],
  ] as const)
    for (const [id, value] of Object.entries(ids)) {
      if (
        !state.products.some((p) => p.id === id && p.companyId === actor) ||
        !integer(value, minimum, 1000000)
      )
        throw new Error('Invalid product policy');
    }
}
/** Mutates only a newly cloned turn state; caller owns transaction validation. */
export function applyOrders(next: GameState, actor: string, orders: TurnOrders, events: string[]) {
  if (
    !orders.id ||
    orders.expectedWeek !== next.absoluteWeek ||
    next.commandHistory.includes(orders.id)
  )
    throw new Error('Stale or duplicate turn command');
  if (!Array.isArray(orders.projects) || orders.projects.length > 20)
    throw new Error('Too many orders');
  if (orders.policy) {
    validatePolicy(next, actor, orders.policy);
    next.policies[actor] = structuredClone(orders.policy);
  }
  const company = next.companies.find((c) => c.id === actor)!;
  if (next.finance[actor].bankrupt && (orders.projects.length || orders.policy))
    throw new Error('Bankrupt company cannot place new orders');
  if (orders.financing) financing(next, actor, orders.financing.borrow, orders.financing.repay);
  for (const [index, request] of orders.projects.entries()) {
    const quote = quoteProject(next, actor, request);
    if (company.cash < quote.cost) throw new Error('Insufficient cash for project');
    projectPayment(next, actor, request.kind, quote.cost);
    const id = `${actor}:${orders.id}:${index}`;
    next.projects.push({
      ...request,
      id,
      companyId: actor,
      cost: quote.cost,
      createdWeek: next.absoluteWeek,
      dueWeek: next.absoluteWeek + quote.weeks,
      remaining: quote.weeks,
      status: 'active',
    });
    if (request.kind === 'shipment')
      next.projects.at(-1)!.cargo = consumeStock(
        next,
        request.productId,
        request.originId,
        request.quantity,
      );
    events.push(
      `${actor}: ${request.kind} committed (${quote.cost} credits, ${quote.weeks} weeks)`,
    );
  }
  for (const [id, price] of Object.entries(next.policies[actor].prices))
    next.products.find((p) => p.id === id)!.price = price;
  next.commandHistory.push(orders.id);
}
export function progressProjects(next: GameState, events: string[]) {
  for (const project of next.projects) {
    if (project.status !== 'active') continue;
    project.remaining--;
    if (project.remaining > 0) continue;
    project.status = 'completed';
    if (project.kind === 'construction') {
      post(next, project.companyId, 'Construction commissioned', {
        construction: -project.cost,
        fixedAssets: project.cost,
      });
      next.facilities.push({
        id: `${project.id}:asset`,
        companyId: project.companyId,
        cityId: project.cityId,
        kind: project.facilityKind,
        name: `${project.companyId.toUpperCase()} ${project.facilityKind.toUpperCase()}`,
      });
    }
    if (project.kind === 'hiring') next.staff[project.companyId][project.role] += project.quantity;
    if (project.kind === 'research')
      completeResearch(next, project.productId, project.id, project.attributes, project.segment);
    if (project.kind === 'shipment')
      receiveStock(next, project.id, project.productId, project.cityId, project.cargo || []);
    events.push(`${project.companyId}: ${project.kind} completed (${project.id})`);
  }
}
export function validateOrdersState(state: GameState) {
  if (
    !state.policies ||
    !Array.isArray(state.projects) ||
    !Array.isArray(state.commandHistory) ||
    new Set(state.commandHistory).size !== state.commandHistory.length
  )
    throw new Error('Invalid order state');
  for (const company of state.companies)
    validatePolicy(state, company.id, state.policies[company.id]);
  if (new Set(state.projects.map((p) => p.id)).size !== state.projects.length)
    throw new Error('Duplicate project');
  for (const p of state.projects) {
    if (
      !p.id ||
      !state.companies.some((c) => c.id === p.companyId) ||
      !['construction', 'research', 'shipment', 'hiring'].includes(p.kind) ||
      !['active', 'completed'].includes(p.status) ||
      !integer(p.remaining) ||
      !integer(p.cost) ||
      !integer(p.createdWeek, 1) ||
      !integer(p.dueWeek, p.createdWeek + 1) ||
      p.dueWeek - p.createdWeek > 20 ||
      p.remaining !== Math.max(0, p.dueWeek - state.absoluteWeek) ||
      (p.status === 'completed') !== (p.remaining === 0)
    )
      throw new Error('Invalid project');
    if (
      p.kind === 'construction' &&
      (!FACILITY_KINDS.includes(p.facilityKind) || !state.cities.some((c) => c.id === p.cityId))
    )
      throw new Error('Invalid construction');
    if (
      (p.kind === 'research' || p.kind === 'shipment') &&
      !state.products.some((x) => x.id === p.productId && x.companyId === p.companyId)
    )
      throw new Error('Invalid project product');
    if (p.kind === 'hiring' && (!STAFF_ROLES.includes(p.role) || !integer(p.quantity, 1, 100)))
      throw new Error('Invalid hiring project');
    if (
      p.kind === 'research' &&
      p.segment &&
      !['value', 'mainstream', 'premium'].includes(p.segment)
    )
      throw new Error('Invalid pending segment');
    if (p.kind === 'research' && p.attributes && !validAttributes(p.attributes))
      throw new Error('Invalid pending design');
    if (p.kind === 'shipment' && (!integer(p.quantity, 1) || !route(state, p.originId, p.cityId)))
      throw new Error('Invalid shipment route');
  }
  const virtual = [...state.facilities];
  for (const p of state.projects) {
    if (p.kind !== 'construction' || p.status !== 'active') continue;
    const proposal = {
      id: p.id,
      name: p.id,
      companyId: p.companyId,
      cityId: p.cityId,
      kind: p.facilityKind,
    };
    const error = placementError({ ...state, facilities: virtual }, proposal);
    if (error) throw new Error('Invalid pending construction: ' + error);
    virtual.push(proposal);
  }
}

function nextStaffTotal(state: GameState, actor: string, role: StaffRole) {
  return (
    state.staff[actor][role] +
    state.projects
      .filter(
        (p) =>
          p.kind === 'hiring' && p.status === 'active' && p.companyId === actor && p.role === role,
      )
      .reduce((n, p) => n + (p.kind === 'hiring' ? p.quantity : 0), 0)
  );
}
