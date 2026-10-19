import { allocateWorkers } from './people.ts';
import { HR_RULES } from '../data/rules.ts';
import type { GameState, Product } from './game.ts';
import type { DemandCell } from './demand.ts';
import { post } from './finance.ts';
import { FINANCE_RULES } from '../data/rules.ts';
import { FACTORY_RULE } from '../data/rules.ts';
export type StockLot = { id:string; productId:string; cityId:string; quantity:number; unitCost:number };
export type Cargo = { quantity:number; unitCost:number };
export type Factory = { facilityId:string; capacity:number; workers:number; inputs:number };
export type Sale = {cityId:string;segment:string;productId:string;desired:number;units:number;revenue:number;cogs:number};
export type Production = {facilityId:string;productId:string;units:number;cost:number;materialCost:number;laborCost:number};
export function initializeStocks(state: Pick<GameState,'products'|'facilities'|'cities'>):StockLot[] {
  return state.products.filter(p=>p.inventory>0).map(p=>({id:`opening:${p.id}`,productId:p.id,cityId:state.facilities.find(f=>f.companyId===p.companyId&&(f.kind==='hq'||f.kind==='store'))?.cityId||state.cities[0].id,quantity:p.inventory,unitCost:p.cost}));
}
export const localStock=(state:Pick<GameState,'stocks'>,productId:string,cityId:string)=>state.stocks.filter(l=>l.productId===productId&&l.cityId===cityId).reduce((n,l)=>n+l.quantity,0);
export function syncInventory(state:GameState){for(const p of state.products)p.inventory=state.stocks.filter(l=>l.productId===p.id).reduce((n,l)=>n+l.quantity,0);}
export function consumeStock(state:GameState,productId:string,cityId:string,quantity:number):Cargo[]{
  if(!Number.isSafeInteger(quantity)||quantity<0||localStock(state,productId,cityId)<quantity)throw new Error('Insufficient local inventory');
  let remaining=quantity;const cargo:Cargo[]=[];
  for(const lot of state.stocks.filter(l=>l.productId===productId&&l.cityId===cityId).sort((a,b)=>a.id.localeCompare(b.id))){const take=Math.min(remaining,lot.quantity);if(take){lot.quantity-=take;remaining-=take;cargo.push({quantity:take,unitCost:lot.unitCost});}}
  state.stocks=state.stocks.filter(l=>l.quantity>0);syncInventory(state);return cargo;
}
export function receiveStock(state:GameState,id:string,productId:string,cityId:string,cargo:Cargo[]){
  cargo.forEach((lot,index)=>{if(lot.quantity)state.stocks.push({id:`${id}:${index}`,productId,cityId,...lot});});syncInventory(state);
}
export function refreshFactories(state:GameState){
  for(const f of state.facilities.filter(f=>f.kind==='factory'))if(!state.factories.some(x=>x.facilityId===f.id))state.factories.push({facilityId:f.id,capacity:FACTORY_RULE.capacity,workers:0,inputs:0});
}
export function simulateOperations(state:GameState,demand:DemandCell[],events:string[]):{sales:Sale[];production:Production[]} {
  refreshFactories(state);allocateWorkers(state);const production:Production[]=[],sales:Sale[]=[];
  for(const factory of [...state.factories].sort((a,b)=>a.facilityId.localeCompare(b.facilityId))){
    const facility=state.facilities.find(f=>f.id===factory.facilityId)!;
    const company=state.companies.find(c=>c.id===facility.companyId)!;
    if(state.finance[company.id].bankrupt)continue;
    let capacity=Math.floor(factory.capacity*Math.min(1,factory.workers/FACTORY_RULE.requiredWorkers));
    for(const p of state.products.filter(p=>p.companyId===company.id).sort((a,b)=>a.id.localeCompare(b.id))){
      const target=state.policies[company.id].production[p.id]||0;
      const already=production.filter(r=>r.productId===p.id).reduce((n,r)=>n+r.units,0);
      const unitCost=Math.max(FINANCE_RULES.inputUnit,p.cost),materialUnit=FINANCE_RULES.inputUnit,laborUnit=unitCost-materialUnit;
      const budgetUnits=Math.floor(Math.max(0,company.cash)/unitCost);
      const units=Math.min(Math.max(0,target-already),capacity,budgetUnits);
      if(!units)continue;
      const buy=Math.max(0,units-factory.inputs);factory.inputs+=buy;
      const materialCost=buy*materialUnit,laborCost=units*laborUnit;
      post(state,company.id,'Purchase component kits',{materials:materialCost,cash:-materialCost});
      post(state,company.id,'Manufacture goods',{inventory:units*unitCost,materials:-units*materialUnit,cash:-laborCost});
      factory.inputs-=units;capacity-=units;
      receiveStock(state,`production:${state.absoluteWeek}:${factory.facilityId}:${p.id}`,p.id,facility.cityId,[{quantity:units,unitCost}]);
      production.push({facilityId:facility.id,productId:p.id,units,cost:units*unitCost,materialCost,laborCost});
    }
  }
  const salesCapacity=Object.fromEntries(state.companies.map(c=>[c.id,state.staff[c.id].sales*HR_RULES.unitsPerSeller]));
  for(const cell of demand)for(const allocation of cell.allocations){
    const p=state.products.find(p=>p.id===allocation.productId)!;
    const accessible=state.facilities.some(f=>f.companyId===p.companyId&&f.cityId===cell.cityId&&f.kind==='store');
    const units=accessible?Math.min(allocation.desired,localStock(state,p.id,cell.cityId),salesCapacity[p.companyId]):0;
    salesCapacity[p.companyId]-=units;
    const cargo=consumeStock(state,p.id,cell.cityId,units);
    const revenue=units*p.price,cogs=cargo.reduce((n,l)=>n+l.quantity*l.unitCost,0);
    post(state,p.companyId,'Fulfilled sales',{cash:revenue,revenue:-revenue});
    post(state,p.companyId,'Cost of fulfilled goods',{cogs,inventory:-cogs});
    sales.push({cityId:cell.cityId,segment:cell.segment,productId:p.id,desired:allocation.desired,units,revenue,cogs});
  }
  const fulfilled=sales.reduce((n,s)=>n+s.units,0);events.push(`${fulfilled} units fulfilled from local stock; ${sales.reduce((n,s)=>n+s.desired-s.units,0)} preferred orders unfilled.`);
  return {sales,production};
}
export function inventoryValue(state:Pick<GameState,'stocks'|'projects'|'products'>,companyId:string):number{
  const owned=(id:string)=>state.products.some(p=>p.id===id&&p.companyId===companyId);
  return state.stocks.filter(l=>owned(l.productId)).reduce((n,l)=>n+l.quantity*l.unitCost,0)+state.projects.filter(p=>p.kind==='shipment'&&p.status==='active'&&p.companyId===companyId).reduce((n,p)=>n+(p.cargo||[]).reduce((m,l)=>m+l.quantity*l.unitCost,0),0);
}
export function validateOperations(state:GameState){
  if(!Array.isArray(state.stocks)||!Array.isArray(state.factories)||new Set(state.stocks.map(l=>l.id)).size!==state.stocks.length||new Set(state.factories.map(f=>f.facilityId)).size!==state.factories.length)throw new Error('Invalid operations state');
  for(const lot of state.stocks)if(!lot.id||!state.products.some(p=>p.id===lot.productId)||!state.cities.some(c=>c.id===lot.cityId)||!Number.isSafeInteger(lot.quantity)||lot.quantity<=0||!Number.isSafeInteger(lot.unitCost)||lot.unitCost<0)throw new Error('Invalid inventory lot');
  for(const p of state.products)if(p.inventory!==state.stocks.filter(l=>l.productId===p.id).reduce((n,l)=>n+l.quantity,0))throw new Error('Inventory aggregate mismatch');
  for(const f of state.factories)if(!state.facilities.some(x=>x.id===f.facilityId&&x.kind==='factory')||![f.capacity,f.workers,f.inputs].every(n=>Number.isSafeInteger(n)&&n>=0))throw new Error('Invalid factory');
  for(const p of state.projects)if(p.kind==='shipment'&&p.status==='active'&&(p.cargo||[]).reduce((n,l)=>n+l.quantity,0)!==p.quantity)throw new Error('Invalid cargo');
}
export function productStock(state:GameState,product:Product){return state.stocks.filter(l=>l.productId===product.id);}
