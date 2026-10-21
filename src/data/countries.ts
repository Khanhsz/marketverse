export type ContinentId =
  | 'varenis'
  | 'northhjem'
  | 'eryndor'
  | 'solkara'
  | 'thalessa'
  | 'kharith'
  | 'lumara';

export type Country = {
  id: string;
  name: string;
  continent: ContinentId;
  capital: string;
  cityId: string;
  specialty: string;
  center: { x: number; y: number };
  stats: {
    population: number;
    gdpIndex: number;
    taxRate: number;
    stability: number;
    infrastructure: number;
    tradeOpenness: number;
  };
};

type CountrySeed = Omit<Country, 'stats'>;

const seeds: CountrySeed[] = [
  {
    id: 'aldera',
    name: 'Aldera',
    continent: 'varenis',
    capital: 'Alder Bay',
    cityId: 'lake',
    specialty: 'Timber & fisheries',
    center: { x: 162, y: 405 },
  },
  {
    id: 'norlan',
    name: 'Norlan',
    continent: 'varenis',
    capital: 'Norhaven',
    cityId: 'lake',
    specialty: 'Technology services',
    center: { x: 306, y: 396 },
  },
  {
    id: 'cascadia',
    name: 'Cascadia',
    continent: 'varenis',
    capital: 'Cascade',
    cityId: 'west',
    specialty: 'Renewable energy',
    center: { x: 229, y: 531 },
  },
  {
    id: 'unita',
    name: 'Unita',
    continent: 'varenis',
    capital: 'Unitas',
    cityId: 'west',
    specialty: 'Consumer manufacturing',
    center: { x: 395, y: 531 },
  },
  {
    id: 'freyland',
    name: 'Freyland',
    continent: 'varenis',
    capital: 'Freyport',
    cityId: 'west',
    specialty: 'Agriculture & retail',
    center: { x: 503, y: 498 },
  },
  {
    id: 'solridge',
    name: 'Solridge',
    continent: 'varenis',
    capital: 'Sol City',
    cityId: 'west',
    specialty: 'Mining & materials',
    center: { x: 375, y: 621 },
  },
  {
    id: 'frostria',
    name: 'Frostria',
    continent: 'northhjem',
    capital: 'Frostholm',
    cityId: 'north',
    specialty: 'Cold-chain logistics',
    center: { x: 781, y: 256 },
  },
  {
    id: 'halsvik',
    name: 'Halsvik',
    continent: 'northhjem',
    capital: 'Hals',
    cityId: 'north',
    specialty: 'Maritime trade',
    center: { x: 819, y: 338 },
  },
  {
    id: 'bjornar',
    name: 'Bjornar',
    continent: 'northhjem',
    capital: 'Bjorn',
    cityId: 'north',
    specialty: 'Heavy engineering',
    center: { x: 988, y: 313 },
  },
  {
    id: 'kaldor',
    name: 'Kaldor',
    continent: 'northhjem',
    capital: 'Kald',
    cityId: 'north',
    specialty: 'Hydropower',
    center: { x: 1056, y: 369 },
  },
  {
    id: 'varsgard',
    name: 'Varsgard',
    continent: 'northhjem',
    capital: 'Vars',
    cityId: 'north',
    specialty: 'Precision equipment',
    center: { x: 1100, y: 313 },
  },
  {
    id: 'nyland',
    name: 'Nyland',
    continent: 'northhjem',
    capital: 'Nystad',
    cityId: 'north',
    specialty: 'Digital services',
    center: { x: 1213, y: 313 },
  },
  {
    id: 'valmira',
    name: 'Valmira',
    continent: 'eryndor',
    capital: 'Valmir',
    cityId: 'central',
    specialty: 'Forestry & water',
    center: { x: 813, y: 538 },
  },
  {
    id: 'arvan',
    name: 'Arvan',
    continent: 'eryndor',
    capital: 'Arva',
    cityId: 'central',
    specialty: 'Food processing',
    center: { x: 769, y: 644 },
  },
  {
    id: 'kaelis',
    name: 'Kaelis',
    continent: 'eryndor',
    capital: 'Kael',
    cityId: 'central',
    specialty: 'Textiles',
    center: { x: 819, y: 731 },
  },
  {
    id: 'meldan',
    name: 'Meldan',
    continent: 'eryndor',
    capital: 'Melda',
    cityId: 'central',
    specialty: 'Mass-market industry',
    center: { x: 925, y: 656 },
  },
  {
    id: 'dreval',
    name: 'Dreval',
    continent: 'eryndor',
    capital: 'Dreva',
    cityId: 'central',
    specialty: 'Finance & headquarters',
    center: { x: 1063, y: 569 },
  },
  {
    id: 'soran',
    name: 'Soran',
    continent: 'eryndor',
    capital: 'Sora',
    cityId: 'central',
    specialty: 'Automotive supply',
    center: { x: 1088, y: 725 },
  },
  {
    id: 'keshana',
    name: 'Keshana',
    continent: 'eryndor',
    capital: 'Kesh',
    cityId: 'central',
    specialty: 'Advanced manufacturing',
    center: { x: 1175, y: 625 },
  },
  {
    id: 'talora',
    name: 'Talora',
    continent: 'eryndor',
    capital: 'Talor',
    cityId: 'central',
    specialty: 'Consumer commerce',
    center: { x: 1259, y: 666 },
  },
  {
    id: 'zahir',
    name: 'Zahir',
    continent: 'solkara',
    capital: 'Zahra',
    cityId: 'east',
    specialty: 'Solar energy',
    center: { x: 1471, y: 399 },
  },
  {
    id: 'miran',
    name: 'Miran',
    continent: 'solkara',
    capital: 'Mir',
    cityId: 'east',
    specialty: 'Inland logistics',
    center: { x: 1615, y: 461 },
  },
  {
    id: 'qadir',
    name: 'Qadir',
    continent: 'solkara',
    capital: 'Qadira',
    cityId: 'east',
    specialty: 'Petrochemicals',
    center: { x: 1498, y: 551 },
  },
  {
    id: 'khald',
    name: 'Khald',
    continent: 'solkara',
    capital: 'Khaldia',
    cityId: 'east',
    specialty: 'Trade & aviation',
    center: { x: 1719, y: 394 },
  },
  {
    id: 'danura',
    name: 'Danura',
    continent: 'solkara',
    capital: 'Danur',
    cityId: 'east',
    specialty: 'Metals & machinery',
    center: { x: 1701, y: 555 },
  },
  {
    id: 'liria',
    name: 'Liria',
    continent: 'thalessa',
    capital: 'Liris',
    cityId: 'river',
    specialty: 'Island tourism',
    center: { x: 163, y: 738 },
  },
  {
    id: 'orin',
    name: 'Orin',
    continent: 'thalessa',
    capital: 'Orina',
    cityId: 'river',
    specialty: 'Creative industries',
    center: { x: 498, y: 756 },
  },
  {
    id: 'sylva',
    name: 'Sylva',
    continent: 'thalessa',
    capital: 'Sylvan',
    cityId: 'river',
    specialty: 'Biotechnology',
    center: { x: 231, y: 850 },
  },
  {
    id: 'tamara',
    name: 'Tamara',
    continent: 'thalessa',
    capital: 'Tamar',
    cityId: 'river',
    specialty: 'Regional retail',
    center: { x: 375, y: 850 },
  },
  {
    id: 'vela',
    name: 'Vela',
    continent: 'thalessa',
    capital: 'Velis',
    cityId: 'river',
    specialty: 'Shipbuilding',
    center: { x: 538, y: 831 },
  },
  {
    id: 'nexis',
    name: 'Nexis',
    continent: 'thalessa',
    capital: 'Nexa',
    cityId: 'river',
    specialty: 'Data & communications',
    center: { x: 400, y: 931 },
  },
  {
    id: 'drakon',
    name: 'Drakon',
    continent: 'kharith',
    capital: 'Draka',
    cityId: 'harbor',
    specialty: 'Mining equipment',
    center: { x: 850, y: 935 },
  },
  {
    id: 'svarin',
    name: 'Svarin',
    continent: 'kharith',
    capital: 'Svar',
    cityId: 'harbor',
    specialty: 'Scientific research',
    center: { x: 1050, y: 931 },
  },
  {
    id: 'thuria',
    name: 'Thuria',
    continent: 'kharith',
    capital: 'Thur',
    cityId: 'harbor',
    specialty: 'Industrial materials',
    center: { x: 1244, y: 981 },
  },
  {
    id: 'valtera',
    name: 'Valtera',
    continent: 'kharith',
    capital: 'Valter',
    cityId: 'harbor',
    specialty: 'Cold-water ports',
    center: { x: 1058, y: 1031 },
  },
  {
    id: 'caelon',
    name: 'Caelon',
    continent: 'lumara',
    capital: 'Caela',
    cityId: 'south',
    specialty: 'Aquaculture',
    center: { x: 1598, y: 881 },
  },
  {
    id: 'lumara',
    name: 'Lumara',
    continent: 'lumara',
    capital: 'Luma',
    cityId: 'south',
    specialty: 'Export distribution',
    center: { x: 1719, y: 869 },
  },
  {
    id: 'tavia',
    name: 'Tavia',
    continent: 'lumara',
    capital: 'Tavis',
    cityId: 'south',
    specialty: 'Electronics assembly',
    center: { x: 1738, y: 930 },
  },
];

const hash = (text: string) =>
  [...text].reduce((value, char) => Math.imul(value, 31) + char.charCodeAt(0), 17) >>> 0;

export const COUNTRIES: readonly Country[] = seeds.map((seed) => {
  const value = hash(seed.id);
  return {
    ...seed,
    stats: {
      population: 2_400_000 + (value % 18_000_000),
      gdpIndex: 72 + (value % 59),
      taxRate: 0.12 + ((value >>> 3) % 13) / 100,
      stability: 58 + ((value >>> 5) % 40),
      infrastructure: 55 + ((value >>> 7) % 44),
      tradeOpenness: 48 + ((value >>> 9) % 51),
    },
  };
});

export const CONTINENT_HIT_AREAS: Record<ContinentId, readonly [number, number][]> = {
  varenis: [
    [38, 388],
    [250, 238],
    [525, 275],
    [600, 525],
    [475, 650],
    [188, 625],
    [50, 525],
  ],
  northhjem: [
    [675, 231],
    [950, 175],
    [1288, 250],
    [1250, 388],
    [1000, 438],
    [775, 388],
  ],
  eryndor: [
    [625, 488],
    [838, 425],
    [1250, 500],
    [1375, 688],
    [1150, 813],
    [813, 775],
    [625, 663],
  ],
  solkara: [
    [1338, 363],
    [1500, 288],
    [1813, 338],
    [1875, 663],
    [1625, 738],
    [1400, 600],
  ],
  thalessa: [
    [75, 675],
    [313, 688],
    [600, 750],
    [625, 938],
    [375, 975],
    [100, 875],
  ],
  kharith: [
    [638, 900],
    [938, 838],
    [1313, 900],
    [1388, 1063],
    [1038, 1113],
    [725, 1050],
  ],
  lumara: [
    [1525, 838],
    [1738, 788],
    [1850, 900],
    [1813, 1063],
    [1575, 1025],
  ],
};

export const country = (id: string) => COUNTRIES.find((item) => item.id === id);

export function pointInPolygon(x: number, y: number, polygon: readonly [number, number][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function countryAtPoint(x: number, y: number): Country | undefined {
  const continent = (
    Object.entries(CONTINENT_HIT_AREAS) as [ContinentId, readonly [number, number][]][]
  ).find(([, polygon]) => pointInPolygon(x, y, polygon))?.[0];
  if (!continent) return undefined;
  return COUNTRIES.filter((item) => item.continent === continent).sort(
    (a, b) =>
      Math.hypot(a.center.x - x, a.center.y - y) - Math.hypot(b.center.x - x, b.center.y - y),
  )[0];
}
