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
export const FACTORY_RULE = { capacity: 200, requiredWorkers: 4, starterWorkers: 2, materialShare: 0.75 };
export const FINANCE_RULES = { weeklyInterest: 0.001, debtLimit: 500000, wage: 300, inputUnit: 60, defaultWeeks: 4, rent: {hq:1000,store:800,factory:1800,warehouse:600,rd:1200} };
export const AI_RULES = {
  'cost-leader': {markup:1.5,target:180,expansionEvery:12,reserve:150000},
  'premium-innovator': {markup:2.4,target:100,expansionEvery:16,reserve:200000},
  'regional-specialist': {markup:1.9,target:120,expansionEvery:10,reserve:120000},
  'aggressive-expander': {markup:1.65,target:170,expansionEvery:6,reserve:100000},
} as const;
export const DESIGN_RULES = { includedImprovement: 20, perPoint: 250, maxResearchWeeks: 12 };
export const ATTRIBUTE_WEIGHTS = {value:{quality:.2,design:.1,performance:.2,durability:.5},mainstream:{quality:.3,design:.2,performance:.3,durability:.2},premium:{quality:.25,design:.3,performance:.3,durability:.15}} as const;
export const HR_RULES = { hiringCost:1000, hiringWeeks:2, wages:{production:300,sales:350,research:500}, unitsPerSeller:75, brandDecay:.02, brandBuild:.15, brandSpendScale:3000 };
export const MACRO_RULES = { minIndex:.75, maxIndex:1.25, weeklyNoise:.004, seasonalAmplitude:.12, eventsEvery:13, annualGrowthMin:.005, annualGrowthRange:.015, shocks:[{title:'Consumer confidence softens',delta:-.04},{title:'Household spending recovers',delta:.04},{title:'Regional productivity improves',delta:.025}] };
