import type { GameState } from './game.ts';
import { advanceWeek } from './game.ts';
import { createNationalCampaign } from './campaign.ts';
import { localStock } from './operations.ts';
import type { TurnOrders, ProjectRequest } from './orders.ts';
import { aggregateReports } from './analytics.ts';
export const STRATEGIES = ['margin','volume','innovator','expander','brand'] as const;
export type PlayerStrategy = typeof STRATEGIES[number];
export function scenarioOrders(s:GameState,strategy:PlayerStrategy):TurnOrders{
  const company=s.companies.find(c=>c.id===s.playerId)!,policy=structuredClone(s.policies[s.playerId]),projects:ProjectRequest[]=[];
  const product=s.products.filter(p=>p.companyId===s.playerId&&p.lifecycle==='active').at(-1)!;
  const markup={margin:2.6,volume:1.55,innovator:2.5,expander:1.9,brand:2.1}[strategy];
  for(const p of s.products.filter(p=>p.companyId===s.playerId)){policy.prices[p.id]=Math.max(1,Math.round(p.cost*markup));policy.production[p.id]=p.id===product.id?(strategy==='volume'||strategy==='expander'?200:strategy==='margin'?100:140):0;}
  policy.marketing=strategy==='brand'?6000:strategy==='innovator'?1500:700;
  const reserve=200000;
  if(company.cash>reserve+30000&&strategy==='innovator'&&(s.absoluteWeek-1)%26===0&&product.quality<100&&!s.projects.some(p=>p.kind==='research'&&p.status==='active'&&p.companyId===s.playerId))projects.push({kind:'research',productId:product.id});
  if(strategy==='expander'&&(s.absoluteWeek-1)%26===0&&company.cash>reserve+40000){
    const city=s.cities.filter(c=>!s.facilities.some(f=>f.companyId===s.playerId&&f.kind==='store'&&f.cityId===c.id)&&!s.projects.some(p=>p.kind==='construction'&&p.status==='active'&&p.companyId===s.playerId&&p.cityId===c.id)).sort((a,b)=>b.population*b.power-a.population*a.power)[0];
    if(city)projects.push({kind:'construction',cityId:city.id,facilityKind:'store'});
  }
  const factory=s.facilities.find(f=>f.companyId===s.playerId&&f.kind==='factory')!;
  for(const store of s.facilities.filter(f=>f.companyId===s.playerId&&f.kind==='store'&&f.cityId!==factory.cityId))if(localStock(s,product.id,store.cityId)<20&&!s.projects.some(p=>p.kind==='shipment'&&p.status==='active'&&p.companyId===s.playerId&&p.cityId===store.cityId&&p.productId===product.id)){
    const available=localStock(s,product.id,factory.cityId),quantity=Math.min(80,Math.floor(available/2));
    if(quantity>0&&company.cash>reserve+5000){projects.push({kind:'shipment',productId:product.id,originId:factory.cityId,cityId:store.cityId,quantity});break;}
  }
  return {id:`scenario:${strategy}:${s.absoluteWeek}`,expectedWeek:s.absoluteWeek,policy,projects};
}
export function auditTransition(before:GameState,after:GameState){
  if(after.absoluteWeek!==before.absoluteWeek+1)throw new Error('Turn count invariant failed');
  const report=after.reports.at(-1)!;
  const stock=(s:GameState,id:string)=>s.stocks.filter(l=>l.productId===id).reduce((n,l)=>n+l.quantity,0)+s.projects.filter(p=>p.kind==='shipment'&&p.productId===id&&p.status==='active').reduce((n,p)=>n+(p.kind==='shipment'?p.quantity:0),0);
  for(const p of after.products){const production=(report.production||[]).filter(r=>r.productId===p.id).reduce((n,r)=>n+r.units,0),sales=(report.sales||[]).filter(r=>r.productId===p.id).reduce((n,r)=>n+r.units,0);if(stock(after,p.id)!==stock(before,p.id)+production-sales)throw new Error('Physical conservation failed: '+p.id);}
  for(const c of after.companies){
    const cashDelta=after.ledger.filter(e=>e.week===before.absoluteWeek&&e.companyId===c.id).flatMap(e=>e.lines).filter(l=>l.account==='cash').reduce((n,l)=>n+l.amount,0);
    if(c.cash-before.companies.find(x=>x.id===c.id)!.cash!==cashDelta||c.cash<0)throw new Error('Cash flow invariant failed');
  }
  for(const sale of report.sales||[]){const p=after.products.find(p=>p.id===sale.productId)!;if(sale.units<0||sale.units>sale.desired||sale.revenue!==sale.units*p.price||sale.lostStock+sale.lostStaff+sale.units!==sale.desired)throw new Error('Fulfillment invariant failed');}
}
export function runScenario(seed:number,strategy:PlayerStrategy,length=104){
  let state=createNationalCampaign(seed),stockouts=0,produced=0,sold=0;const durations:number[]=[];
  for(let i=0;i<length&&state.campaign.status==='active';i++){
    const start=performance.now(),next=advanceWeek(state,scenarioOrders(state,strategy));durations.push(performance.now()-start);auditTransition(state,next);state=next;
    const own=(id:string)=>state.products.find(p=>p.id===id)?.companyId===state.playerId;
    stockouts+=state.reports.at(-1)!.sales!.filter(r=>own(r.productId)).reduce((n,r)=>n+r.desired-r.units,0);
    produced+=state.reports.at(-1)!.production!.filter(r=>own(r.productId)).reduce((n,r)=>n+r.units,0);sold+=state.reports.at(-1)!.sales!.filter(r=>own(r.productId)).reduce((n,r)=>n+r.units,0);
  }
  const report=aggregateReports(state,state.playerId,1,Math.max(1,state.absoluteWeek-1)),sorted=durations.sort((a,b)=>a-b),company=state.companies[0];
  return {seed,strategy,turns:state.absoluteWeek-1,status:state.campaign.status,score:state.campaign.score?.total??0,profit:report.profit,closingCash:company.cash,netWorth:state.reports.at(-1)?.financials?.find(f=>f.companyId===state.playerId)?.netWorth||0,bankrupt:state.finance[state.playerId].bankrupt,stockouts,produced,sold,endingStock:state.products.filter(p=>p.companyId===state.playerId).reduce((n,p)=>n+p.inventory,0),p95TurnMs:sorted[Math.floor((sorted.length-1)*.95)]||0,maxTurnMs:sorted.at(-1)||0};
}
