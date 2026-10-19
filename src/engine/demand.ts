import type { GameState, Product, City, Segment } from './game.ts';
import { SEGMENT_RULES, WEEKLY_PURCHASE_RATE, ATTRIBUTE_WEIGHTS } from '../data/rules.ts';
export type DemandCell = { cityId: string; segment: Segment; potential: number; outside: number; allocations: { productId: string; desired: number }[] };
export function productUtility(product: Product, city: City, segment: Segment, brand = 0): number {
  const rules=SEGMENT_RULES[segment];
  const attributes={...product.attributes,quality:product.quality},weights=ATTRIBUTE_WEIGHTS[segment];
  const fit=(Object.keys(weights) as (keyof typeof weights)[]).reduce((n,k)=>n+attributes[k]*weights[k],0);
  return fit/100*rules.qualityWeight - product.price/(rules.referencePrice*city.power)*rules.elasticity + (product.segment===segment?rules.match:0) + Math.max(0,Math.min(1,brand));
}
// Hamilton allocation: integer units, outside option participates, stable ID tie-break.
export function allocatePreference(total: number, weights: {id:string;weight:number}[]) {
  if(!Number.isSafeInteger(total)||total<0||!weights.length||weights.some(w=>!Number.isFinite(w.weight)||w.weight<=0)||new Set(weights.map(w=>w.id)).size!==weights.length)throw new Error('Invalid preference allocation');
  const sum=weights.reduce((n,w)=>n+w.weight,0);
  const rows=weights.map(w=>{const raw=total*w.weight/sum;return {id:w.id,units:Math.floor(raw),fraction:raw-Math.floor(raw)};});
  let remainder=total-rows.reduce((n,r)=>n+r.units,0);
  for(const row of [...rows].sort((a,b)=>b.fraction-a.fraction||a.id.localeCompare(b.id)))if(remainder-->0)row.units++;
  return Object.fromEntries(rows.map(r=>[r.id,r.units]));
}
export function calculateDemand(state: GameState): DemandCell[] {
  const cells:DemandCell[]=[];
  for(const city of [...state.cities].sort((a,b)=>a.id.localeCompare(b.id)))for(const segment of Object.keys(SEGMENT_RULES) as Segment[]) {
    const potential=Math.floor(city.population*city.segments[segment]*WEEKLY_PURCHASE_RATE*city.power);
    const products=state.products.filter(p=>p.lifecycle!=='retired'&&(p.lifecycle==='active'||p.inventory>0)&&state.facilities.some(f=>f.companyId===p.companyId&&f.cityId===city.id&&f.kind==='store')).sort((a,b)=>a.id.localeCompare(b.id));
    const weights=[{id:'outside',weight:1},...products.map(p=>{
      const utility=Math.max(-40,Math.min(40,productUtility(p,city,segment)));
      return {id:p.id,weight:Math.exp(utility)};
    })];
    const units=allocatePreference(potential,weights);
    cells.push({cityId:city.id,segment,potential,outside:units.outside,allocations:products.map(p=>({productId:p.id,desired:units[p.id]}))});
  }
  return cells;
}
