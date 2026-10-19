import type { GameState, Product, Segment } from './game.ts';
import { DESIGN_RULES, RESEARCH_RULE } from '../data/rules.ts';
export type Attributes = {
  quality: number;
  design: number;
  performance: number;
  durability: number;
};
export const ATTRIBUTE_NAMES = ['quality', 'design', 'performance', 'durability'] as const;
export function validAttributes(a: Attributes) {
  return (
    a &&
    Object.keys(a).length === 4 &&
    ATTRIBUTE_NAMES.every((k) => Number.isFinite(a[k]) && a[k] >= 0 && a[k] <= 100)
  );
}
export function defaultUpgrade(product: Product): Attributes {
  return Object.fromEntries(
    ATTRIBUTE_NAMES.map((k) => [k, Math.min(100, product.attributes[k] + 5)]),
  ) as Attributes;
}
export function billOfMaterials(a: Attributes) {
  const electronics = Math.round(20 + a.performance * 0.45),
    housing = Math.round(10 + a.design * 0.2 + a.durability * 0.2),
    testing = Math.round(5 + a.quality * 0.15 + a.durability * 0.1),
    assembly = 25;
  return {
    electronics,
    housing,
    testing,
    assembly,
    total: electronics + housing + testing + assembly,
  };
}
export function quoteResearch(product: Product, attributes?: Attributes) {
  const target = attributes || defaultUpgrade(product);
  if (!validAttributes(target)) throw new Error('Invalid product attributes');
  const improvements = ATTRIBUTE_NAMES.reduce(
    (n, k) => n + Math.max(0, target[k] - product.attributes[k]),
    0,
  );
  if (ATTRIBUTE_NAMES.every((k) => target[k] === product.attributes[k]))
    throw new Error('Design is unchanged or at technology ceiling');
  const extra = Math.max(0, improvements - DESIGN_RULES.includedImprovement);
  return {
    cost: RESEARCH_RULE.cost + Math.ceil(extra * DESIGN_RULES.perPoint),
    weeks: Math.min(DESIGN_RULES.maxResearchWeeks, RESEARCH_RULE.weeks + Math.ceil(extra / 80)),
  };
}
export function completeResearch(
  state: GameState,
  productId: string,
  projectId: string,
  attributes?: Attributes,
  segment?: Segment,
) {
  const parent = state.products.find((p) => p.id === productId)!,
    target = attributes || defaultUpgrade(parent),
    bom = billOfMaterials(target),
    id = `${productId}:v${parent.revision + 1}:${projectId}`;
  const price = Math.max(1, Math.round((parent.price * bom.total) / parent.cost));
  const product: Product = {
    ...parent,
    id,
    name: `${parent.name.split(' / R')[0]} / R${parent.revision + 1}`,
    parentId: parent.id,
    revision: parent.revision + 1,
    lifecycle: 'active',
    attributes: { ...target },
    quality: target.quality,
    cost: bom.total,
    price,
    inventory: 0,
    segment: segment || parent.segment,
  };
  parent.lifecycle = 'legacy';
  state.products.push(product);
  const policy = state.policies[parent.companyId];
  policy.prices[id] = price;
  policy.production[id] = policy.production[parent.id] || 0;
  policy.production[parent.id] = 0;
}
export function validateProducts(state: GameState) {
  for (const p of state.products) {
    if (
      !validAttributes(p.attributes) ||
      p.attributes.quality !== p.quality ||
      !Number.isSafeInteger(p.revision) ||
      p.revision < 1 ||
      !['active', 'legacy', 'retired'].includes(p.lifecycle) ||
      !Number.isSafeInteger(p.cost) ||
      p.cost < 1 ||
      p.id === 'outside' ||
      !Number.isSafeInteger(p.price)
    )
      throw new Error('Invalid product design');
    if (
      p.parentId &&
      !state.products.some(
        (parent) =>
          parent.id === p.parentId &&
          parent.companyId === p.companyId &&
          parent.revision === p.revision - 1,
      )
    )
      throw new Error('Invalid SKU lineage');
  }
}
