// All currency amounts are integer credits (the smallest game currency unit).
export const BUILD_RULES = {
  hq: { cost: 120000, weeks: 6 }, store: { cost: 40000, weeks: 4 },
  factory: { cost: 180000, weeks: 10 }, warehouse: { cost: 60000, weeks: 5 }, rd: { cost: 100000, weeks: 8 },
} as const;
export const RESEARCH_RULE = { cost: 30000, weeks: 6 };
export const SHIPPING_RULE = { base: 100, perUnitPerLink: 2 };
