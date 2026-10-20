/** Standalone polygon-geometry fixtures. No image, texture or game-state dependency. */
export type Point = { x: number; y: number };
export type ZoneKind = 'urban' | 'industrial' | 'residential';
export type BuildingKind = 'office' | 'retail' | 'warehouse' | 'housing' | 'factory';
export type District = {
  id: string;
  name: string;
  purpose: string;
  kind: ZoneKind;
  landValue: number;
  visitors: number;
  points: Point[];
};
export type Building = {
  id: string;
  name: string;
  districtId: string;
  kind: BuildingKind;
  x: number;
  y: number;
  height: number;
  floors: number;
  state: 'available' | 'active';
};
export const MAP_SIZE = { width: 1500, height: 960 } as const;

export const ISLAND: Point[] = [
  { x: 91, y: 532 },
  { x: 114, y: 447 },
  { x: 172, y: 387 },
  { x: 206, y: 316 },
  { x: 291, y: 272 },
  { x: 354, y: 285 },
  { x: 438, y: 228 },
  { x: 498, y: 194 },
  { x: 551, y: 220 },
  { x: 614, y: 179 },
  { x: 680, y: 172 },
  { x: 753, y: 203 },
  { x: 830, y: 147 },
  { x: 913, y: 165 },
  { x: 991, y: 156 },
  { x: 1066, y: 205 },
  { x: 1159, y: 218 },
  { x: 1240, y: 283 },
  { x: 1293, y: 298 },
  { x: 1349, y: 367 },
  { x: 1420, y: 431 },
  { x: 1410, y: 527 },
  { x: 1436, y: 594 },
  { x: 1394, y: 683 },
  { x: 1371, y: 769 },
  { x: 1290, y: 824 },
  { x: 1192, y: 847 },
  { x: 1104, y: 815 },
  { x: 1000, y: 837 },
  { x: 918, y: 887 },
  { x: 841, y: 870 },
  { x: 768, y: 912 },
  { x: 661, y: 871 },
  { x: 579, y: 908 },
  { x: 482, y: 887 },
  { x: 416, y: 816 },
  { x: 313, y: 803 },
  { x: 269, y: 738 },
  { x: 170, y: 710 },
  { x: 116, y: 635 },
];

export const DISTRICTS: District[] = [
  {
    id: 'northport',
    name: 'Northport District',
    purpose: 'Cảng biển, thương mại và logistics quốc gia',
    kind: 'industrial',
    landValue: 1750,
    visitors: 38600,
    points: [
      { x: 229, y: 340 },
      { x: 380, y: 280 },
      { x: 554, y: 341 },
      { x: 585, y: 453 },
      { x: 503, y: 559 },
      { x: 345, y: 564 },
      { x: 222, y: 476 },
    ],
  },
  {
    id: 'central',
    name: 'Central City Core',
    purpose: 'Trung tâm văn phòng và bán lẻ giá trị cao',
    kind: 'urban',
    landValue: 2920,
    visitors: 91700,
    points: [
      { x: 651, y: 414 },
      { x: 777, y: 315 },
      { x: 944, y: 305 },
      { x: 1103, y: 406 },
      { x: 1122, y: 561 },
      { x: 980, y: 686 },
      { x: 779, y: 691 },
      { x: 633, y: 572 },
    ],
  },
  {
    id: 'southbay',
    name: 'South Bay Commercial',
    purpose: 'Cửa hàng ven biển, nhà ở và dịch vụ',
    kind: 'residential',
    landValue: 2110,
    visitors: 53400,
    points: [
      { x: 1021, y: 627 },
      { x: 1145, y: 550 },
      { x: 1337, y: 627 },
      { x: 1360, y: 749 },
      { x: 1241, y: 820 },
      { x: 1050, y: 785 },
      { x: 974, y: 699 },
    ],
  },
];

export function pointInPolygon(point: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    const crosses = a.y > point.y !== b.y > point.y;
    if (crosses && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function pseudorandom(seed: number): number {
  const x = Math.sin(seed * 91.137 + 13.77) * 43758.545;
  return x - Math.floor(x);
}

/** Deterministic set of separately addressable city buildings. */
export function generateBuildings(): Building[] {
  const generated: Building[] = [];
  const distributions = [
    { district: DISTRICTS[0], cols: 8, rows: 6, x: 252, y: 329, dx: 41, dy: 37 },
    { district: DISTRICTS[1], cols: 10, rows: 8, x: 682, y: 352, dx: 42, dy: 41 },
    { district: DISTRICTS[2], cols: 8, rows: 7, x: 1011, y: 589, dx: 43, dy: 37 },
  ];
  for (const [dIndex, dist] of distributions.entries()) {
    let count = 0;
    for (let row = 0; row < dist.rows; row++) {
      for (let col = 0; col < dist.cols; col++) {
        const n = dIndex * 500 + row * 27 + col * 11;
        if (pseudorandom(n + 9) < 0.28) continue;
        const x = dist.x + col * dist.dx + (pseudorandom(n + 3) - 0.5) * 7;
        const y = dist.y + row * dist.dy + (pseudorandom(n + 7) - 0.5) * 7;
        if (!pointInPolygon({ x, y }, dist.district.points)) continue;
        if (generated.length >= 74) break;
        const kind: BuildingKind =
          dIndex === 0
            ? col % 3 === 0
              ? 'warehouse'
              : row % 3 === 0
                ? 'factory'
                : 'retail'
            : dIndex === 1
              ? col % 4 === 0
                ? 'retail'
                : 'office'
              : col % 3 === 0
                ? 'retail'
                : 'housing';
        const height =
          kind === 'office'
            ? 43 + Math.round(pseudorandom(n + 18) * 65)
            : kind === 'housing'
              ? 27 + Math.round(pseudorandom(n + 21) * 32)
              : kind === 'retail'
                ? 25 + Math.round(pseudorandom(n + 25) * 31)
                : 24 + Math.round(pseudorandom(n + 28) * 19);
        count++;
        generated.push({
          id: `${dist.district.id}-b${String(count).padStart(2, '0')}`,
          name: `${kind === 'office' ? 'Business Tower' : kind === 'retail' ? 'Retail Plaza' : kind === 'housing' ? 'Residential Block' : kind === 'factory' ? 'Manufacturing Plant' : 'Logistics Warehouse'} ${String(count).padStart(2, '0')}`,
          districtId: dist.district.id,
          kind,
          x,
          y,
          height,
          floors: Math.max(1, Math.floor(height / 15)),
          state: pseudorandom(n + 15) > 0.72 ? 'active' : 'available',
        });
      }
      if (generated.length >= 74) break;
    }
  }
  return generated;
}
