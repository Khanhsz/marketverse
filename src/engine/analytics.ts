import type { GameState, WeekReport } from './game.ts';
export type CityMetrics = {cityId:string;potential:number;sold:number;playerShare:number|null;stock:number;produced:number;incoming:number};
export function mapMetrics(state:GameState):CityMetrics[]{
  const report=state.reports.at(-1),owned=(id:string)=>state.products.find(p=>p.id===id)?.companyId===state.playerId;
  return state.cities.map(city=>{
    const sales=report?.sales?.filter(s=>s.cityId===city.id)||[],sold=sales.reduce((n,s)=>n+s.units,0),player=sales.filter(s=>owned(s.productId)).reduce((n,s)=>n+s.units,0);
    return {cityId:city.id,potential:report?.demand?.filter(d=>d.cityId===city.id).reduce((n,d)=>n+d.potential,0)||0,sold,playerShare:sold?player/sold:null,stock:state.stocks.filter(l=>l.cityId===city.id&&owned(l.productId)).reduce((n,l)=>n+l.quantity,0),produced:report?.production?.filter(p=>owned(p.productId)&&state.facilities.find(f=>f.id===p.facilityId)?.cityId===city.id).reduce((n,p)=>n+p.units,0)||0,incoming:state.projects.filter(p=>p.kind==='shipment'&&p.cityId===city.id&&p.companyId===state.playerId&&p.status==='active').reduce((n,p)=>n+(p.kind==='shipment'?p.quantity:0),0)};
  });
}
export function aggregateReports(state:GameState,companyId:string,start:number,end:number){
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<1||end<start)throw new Error('Invalid report window');
  const reports=state.reports.filter(r=>r.week>=start&&r.week<=end&&r.financials?.some(f=>f.companyId===companyId));
  const financials=reports.map(r=>r.financials!.find(f=>f.companyId===companyId)!);
  const sales=reports.flatMap(r=>r.sales||[]),owned=(id:string)=>state.products.find(p=>p.id===id)?.companyId===companyId;
  const units=sales.filter(s=>owned(s.productId)).reduce((n,s)=>n+s.units,0),market=sales.reduce((n,s)=>n+s.units,0);
  return {start,end,covered:reports.length,complete:reports.length===end-start+1,revenue:financials.reduce((n,f)=>n+f.revenue,0),cogs:financials.reduce((n,f)=>n+f.cogs,0),expenses:financials.reduce((n,f)=>n+f.expenses,0),profit:financials.reduce((n,f)=>n+f.profit,0),cashChange:financials.reduce((n,f)=>n+f.cashChange,0),units,share:market?units/market:null,lostDemand:sales.filter(s=>owned(s.productId)).reduce((n,s)=>n+s.desired-s.units,0),rows:financials};
}
export function profitBridge(report:WeekReport|undefined,companyId:string){
  const financial=report?.financials?.find(f=>f.companyId===companyId);
  return financial?[{label:'Fulfilled revenue',value:financial.revenue},{label:'Cost of sold lots',value:-financial.cogs},{label:'Operating and financing expenses',value:-financial.expenses},{label:'Profit',value:financial.profit}]:[];
}
export function weeklyInsights(state:GameState,companyId:string){
  const report=state.reports.at(-1);if(!report)return ['No completed week yet.'];
  const sales=(report.sales||[]).filter(s=>state.products.find(p=>p.id===s.productId)?.companyId===companyId);
  const stock=sales.reduce((n,s)=>n+(s.lostStock??Math.max(0,s.desired-s.units)),0),staff=sales.reduce((n,s)=>n+(s.lostStaff||0),0),sold=sales.reduce((n,s)=>n+s.units,0);
  return [`Measured: ${sold} units fulfilled from local inventory.`,`Measured: ${stock} preferred units lost to local stock limits; ${staff} additional units lost to sales staffing limits.`,`Accounting: realized revenue less consumed lot cost and recognized expenses equals reported profit. Price and brand effects on preferences are model estimates, not measured causal revenue.`];
}
