// All currency amounts are integer credits (the smallest game currency unit).
export const BUILD_RULES = {
  hq: { cost: 120000, weeks: 6 }, store: { cost: 40000, weeks: 4 },
  factory: { cost: 180000, weeks: 10 }, warehouse: { cost: 60000, weeks: 5 }, rd: { cost: 100000, weeks: 8 },
} as const;
export const RESEARCH_RULE = { cost: 30000, weeks: 6 };
export const SHIPPING_RULE = { base: 100, perUnitPerLink: 2 };
export const SEGMENT_RULES = {
  value: { referencePrice: 200, elasticity: 3.2, qualityWeight: 1.1, match: 0.65 },
  mainstream: { referencePrice: 280, elasticity: 2.2, qualityWeight: 2.1, match: 0.7 },
  premium: { referencePrice: 450, elasticity: 1.6, qualityWeight: 3.1, match: 0.7 },
} as const;
export const WEEKLY_PURCHASE_RATE = 0.0004;
