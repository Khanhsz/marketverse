import { initializeFinance, validateFinance, settleExpenses, financialReports } from './finance.ts';
import type { Finance, Journal, FinancialReport } from './finance.ts';
import { initializeStocks, simulateOperations, validateOperations } from './operations.ts';
import type { StockLot, Factory, Sale, Production } from './operations.ts';
import { calculateDemand } from './demand.ts';
import type { DemandCell } from './demand.ts';
import { initialPolicies, applyOrders, progressProjects, validateOrdersState } from './orders.ts';
import type { Policy, Project, TurnOrders } from './orders.ts';
import { placementError } from './entities.ts';
export const SCHEMA_VERSION = 4;
export const WEEKS_PER_YEAR = 52;
export type Segment = 'value' | 'mainstream' | 'premium';
export type City = { id:string; name:string; x:number; y:number; population:number; power:number; segments:Record<Segment,number>; links:string[] };
export type Company = { id:string; name:string; control:'human'|'ai'; cash:number; debt:number };
export type Product = { id:string; companyId:string; name:string; price:number; cost:number; quality:number; inventory:number; segment:Segment };
export type Facility = { id:string; companyId:string; cityId:string; kind:'hq'|'store'|'factory'|'warehouse'|'rd'; name:string };
export type WeekReport = { week:number; events:string[]; cashDelta:Record<string,number>; placeholder:boolean; demand?:DemandCell[]; sales?:Sale[]; production?:Production[]; financials?:FinancialReport[] };
export type GameState = { version:4; gameId:string; seed:number; absoluteWeek:number; year:number; week:number; playerId:string; cities:City[]; companies:Company[]; products:Product[]; facilities:Facility[]; reports:WeekReport[]; policies:Record<string,Policy>; projects:Project[]; commandHistory:string[]; stocks:StockLot[]; factories:Factory[]; finance:Record<string,Finance>; ledger:Journal[] };
export function calendarOf(absoluteWeek:number) {
  if (!Number.isSafeInteger(absoluteWeek)||absoluteWeek<1) throw new RangeError('Invalid week');
  return { year:Math.floor((absoluteWeek-1)/WEEKS_PER_YEAR)+1, week:((absoluteWeek-1)%WEEKS_PER_YEAR)+1 };
}
export function createInitialGame(seed=20261020):GameState {
  const cities:City[]=[
    {id:'north',name:'Northport',x:390,y:160,population:660000,power:1.12,segments:{value:.29,mainstream:.48,premium:.23},links:['central']},
    {id:'central',name:'Central City',x:550,y:300,population:1120000,power:1,segments:{value:.34,mainstream:.49,premium:.17},links:['north','south']},
    {id:'south',name:'South Bay',x:670,y:440,population:840000,power:.92,segments:{value:.42,mainstream:.46,premium:.12},links:['central']}
  ];
  const companies:Company[]=[
    {id:'player',name:'NOVA INDUSTRIES',control:'human',cash:2500000,debt:0},
    {id:'value',name:'VECTRA',control:'ai',cash:3200000,debt:200000},
    {id:'premium',name:'ATLAS LABS',control:'ai',cash:4100000,debt:0}
  ];
  const products:Product[]=[
    {id:'nova',companyId:'player',name:'NOVA AIR / 01',price:239,cost:124,quality:68,inventory:400,segment:'mainstream'},
    {id:'vectra',companyId:'value',name:'VECTRA BASIC',price:179,cost:100,quality:53,inventory:800,segment:'value'},
    {id:'atlas',companyId:'premium',name:'ATLAS PURE',price:379,cost:202,quality:86,inventory:320,segment:'premium'}
  ];
  const facilities:Facility[]=[
    {id:'hq',companyId:'player',cityId:'central',kind:'hq',name:'NOVA HQ'},
    {id:'store',companyId:'player',cityId:'central',kind:'store',name:'NOVA Flagship'},
    {id:'vectra-store',companyId:'value',cityId:'south',kind:'store',name:'Vectra Retail'},
    {id:'atlas-store',companyId:'premium',cityId:'north',kind:'store',name:'Atlas Showroom'}
  ];
  const state:GameState={version:4,gameId:'marketverse-'+seed,seed,absoluteWeek:1,year:1,week:1,playerId:'player',cities,companies,products,facilities,reports:[],policies:initialPolicies({companies,products}),projects:[],commandHistory:[],stocks:initializeStocks({products,facilities,cities}),factories:[],finance:{},ledger:[]};
  state.finance=initializeFinance(state);validateState(state);return state;
}
export function createRng(seed:number):()=>number {
  if(!Number.isSafeInteger(seed))throw new RangeError('Invalid seed');
  let n=seed>>>0;return ()=>{n=(n+0x6d2b79f5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function validateState(s:GameState):void {
  if(!s||typeof s!=='object')throw new Error('Invalid state');
  if(s.version!==SCHEMA_VERSION)throw new Error('Invalid schema');
  if(!Number.isSafeInteger(s.seed)||!s.gameId)throw new Error('Invalid game identity');
  const c=calendarOf(s.absoluteWeek);
  if(c.year!==s.year||c.week!==s.week)throw new Error('Invalid calendar');
  if(![s.cities,s.companies,s.products,s.facilities,s.reports].every(Array.isArray))throw new Error('Invalid entity collections');
  const unique=(ids:string[])=>ids.every(id=>typeof id==='string'&&id.length>0)&&new Set(ids).size===ids.length;
  if(!unique(s.cities.map(x=>x.id))||!unique(s.companies.map(x=>x.id))||!unique(s.products.map(x=>x.id))||!unique(s.facilities.map(x=>x.id)))throw new Error('Duplicate entity');
  const cityIds=new Set(s.cities.map(x=>x.id)), companyIds=new Set(s.companies.map(x=>x.id));
  if(!companyIds.has(s.playerId)||s.companies.filter(x=>x.control==='human').length!==1||s.companies.find(x=>x.id===s.playerId)?.control!=='human')throw new Error('Invalid player');
  for(const city of s.cities) {
    if(!city.name||!Number.isSafeInteger(city.population)||!(city.population>0)||!Number.isFinite(city.power)||!(city.power>0)||!Number.isFinite(city.x)||!Number.isFinite(city.y))throw new Error('Invalid city');
    if(!city.segments||Object.keys(city.segments).length!==3||!['value','mainstream','premium'].every(k=>Object.hasOwn(city.segments,k))||Object.values(city.segments).some(v=>!Number.isFinite(v)||v<0||v>1)||Math.abs(Object.values(city.segments).reduce((a,b)=>a+b,0)-1)>1e-6)throw new Error('Invalid segment weights');
    if(!Array.isArray(city.links)||new Set(city.links).size!==city.links.length||city.links.some(id=>id===city.id||!cityIds.has(id)||!s.cities.find(c=>c.id===id)?.links?.includes(city.id)))throw new Error('Invalid transport link');
  }
  for(const p of s.products)if(!p.name||!companyIds.has(p.companyId)||!Number.isSafeInteger(p.inventory)||p.inventory<0||![p.price,p.cost,p.quality].every(v=>Number.isFinite(v)&&v>=0)||p.quality>100||!['value','mainstream','premium'].includes(p.segment))throw new Error('Invalid product');
  for(const f of s.facilities){const error=placementError(s,f,f.id);if(!f.name||error)throw new Error('Invalid facility: '+(error||'missing name'));}
  validateOrdersState(s);
  validateOperations(s);
  validateFinance(s);
  for(const co of s.companies)if(!co.name||!['human','ai'].includes(co.control)||!Number.isFinite(co.cash)||!Number.isFinite(co.debt)||co.debt<0)throw new Error('Invalid finance');
}
export function advanceWeek(current:GameState, orders?:TurnOrders):GameState {
  validateState(current);
  const next=structuredClone(current),events:string[]=[];
  applyOrders(next,next.playerId,orders||{id:`turn-${current.absoluteWeek}`,expectedWeek:current.absoluteWeek,projects:[]},events);
  progressProjects(next,events);
  const demand=calculateDemand(next);
  const operations=simulateOperations(next,demand,events);
  settleExpenses(next,events);
  const financials=financialReports(next,Object.fromEntries(current.companies.map(c=>[c.id,c.cash])));
  const cashDelta=Object.fromEntries(next.companies.map(c=>[c.id,c.cash-current.companies.find(old=>old.id===c.id)!.cash]));
  next.reports.push({week:current.absoluteWeek,events:events.length?events:['No new orders; policies retained.'],cashDelta,placeholder:false,demand,...operations,financials});
  next.absoluteWeek++;Object.assign(next,calendarOf(next.absoluteWeek));
  validateState(next);return next;
}
export const SAVE_KEY='marketverse:sprint01:state';
export function serializeGame(s:GameState):string {validateState(s);return JSON.stringify(s);}
export function deserializeGame(raw:string):GameState {const s=JSON.parse(raw);if(!s||typeof s!=='object')throw new Error('Invalid save');if(s.version===1){s.version=2;s.policies=initialPolicies(s);s.projects=[];s.commandHistory=[];}if(s.version===2){s.version=3;s.stocks=initializeStocks(s);s.factories=[];for(const p of s.projects)if(p.kind==='shipment'&&p.status==='active')p.cargo=[{quantity:p.quantity,unitCost:s.products.find((x:Product)=>x.id===p.productId)?.cost||0}];}if(s.version===3){s.version=4;s.finance=initializeFinance(s);s.ledger=[];}validateState(s as GameState);return s as GameState;}
