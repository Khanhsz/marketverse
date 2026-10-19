import type { GameState } from './game.ts';
import { createInitialGame } from './game.ts';
import { nationalCities, CAMPAIGN_RULES } from '../data/country.ts';
import { initializeStocks, refreshFactories } from './operations.ts';
import { initializeStaff } from './people.ts';
import { initialPolicies } from './orders.ts';
import { initializeFinance } from './finance.ts';
import { initializeMacro } from './macro.ts';
import { aggregateReports } from './analytics.ts';
export type Score = {total:number;axes:{name:keyof typeof CAMPAIGN_RULES.targets;value:number;target:number;progress:number;met:boolean}[]};
export type Campaign = {mode:'foundation'|'national';startWeek:number;length:number;status:'active'|'completed'|'bankrupt';score:Score|null};
export function foundationCampaign(week=1):Campaign{return {mode:'foundation',startWeek:week,length:0,status:'active',score:null};}
export function createNationalCampaign(seed=20261020):GameState{
  const s=createInitialGame(seed);s.cities=nationalCities();
  for(const [id,name,strategy,cityId,price,cost,quality,segment] of [
    ['region','CIRCUIT GROUP','regional-specialist','east',245,120,65,'mainstream'],
    ['expand','ORBIT CONSUMER','aggressive-expander','south',199,105,55,'value'],
  ] as const){s.companies.push({id,name,control:'ai',cash:2400000,debt:0,strategy});s.products.push({...structuredClone(s.products[0]),id:`sku-${id}`,companyId:id,name:`${name} / 01`,price,cost,quality,inventory:500,segment,attributes:{quality,design:quality,performance:quality,durability:quality}});void cityId;}
  const homes:Record<string,string>={player:'central',value:'west',premium:'north',region:'east',expand:'south'};
  s.facilities=[];
  for(const company of s.companies)for(const kind of ['hq','store','factory','warehouse'] as const)s.facilities.push({id:company.id==='player'?(kind==='hq'?'hq':kind==='store'?'store':`player-${kind}`):`${company.id}-${kind}`,name:company.id==='player'?(kind==='hq'?'NOVA HQ':kind==='store'?'NOVA Flagship':`NOVA ${kind.toUpperCase()}`):`${company.name} ${kind.toUpperCase()}`,kind,companyId:company.id,cityId:homes[company.id]});
  s.policies=initialPolicies(s);s.factories=[];refreshFactories(s);s.staff=initializeStaff(s);
  for(const company of s.companies){s.staff[company.id]={production:4,sales:4,research:1};for(const p of s.products.filter(p=>p.companyId===company.id))s.policies[company.id].production[p.id]=150;}
  s.stocks=initializeStocks(s);s.finance=initializeFinance(s);s.ledger=[];s.macro=initializeMacro(s);s.brand={};
  s.campaign={mode:'national',startWeek:1,length:CAMPAIGN_RULES.length,status:'active',score:null};
  return s;
}
export function scoreCampaign(state:GameState):Score{
  const p=state.playerId,report=aggregateReports(state,p,state.campaign.startWeek,Math.max(state.campaign.startWeek,state.absoluteWeek-1));
  const own=state.products.filter(x=>x.companyId===p),brandKeys=Object.keys(state.brand).filter(k=>k.startsWith(p+'|'));
  const values={profit:report.profit,liquidity:state.companies.find(c=>c.id===p)!.cash,share:report.share||0,innovation:Math.max(0,...own.map(x=>x.revision-1)),brand:brandKeys.length?brandKeys.reduce((n,k)=>n+state.brand[k],0)/brandKeys.length:0,reach:new Set(state.facilities.filter(f=>f.companyId===p&&f.kind==='store').map(f=>f.cityId)).size};
  const axes=(Object.keys(CAMPAIGN_RULES.targets) as (keyof typeof values)[]).map(name=>({name,value:values[name],target:CAMPAIGN_RULES.targets[name],progress:Math.max(0,Math.min(1,values[name]/CAMPAIGN_RULES.targets[name])),met:values[name]>=CAMPAIGN_RULES.targets[name]}));
  return {total:Math.round(100*axes.reduce((n,a)=>n+a.progress*CAMPAIGN_RULES.weights[a.name],0)),axes};
}
export function updateCampaign(state:GameState){
  if(state.campaign.mode!=='national')return;
  if(state.finance[state.playerId].bankrupt)state.campaign.status='bankrupt';
  else if(state.absoluteWeek-state.campaign.startWeek>=state.campaign.length)state.campaign.status='completed';
  if(state.campaign.status!=='active')state.campaign.score=scoreCampaign(state);
}
export function validateCampaign(state:GameState){
  const c=state.campaign;if(!c||!['foundation','national'].includes(c.mode)||!['active','completed','bankrupt'].includes(c.status)||!Number.isSafeInteger(c.startWeek)||c.startWeek<1||c.startWeek>state.absoluteWeek||!Number.isSafeInteger(c.length)||c.length<0)throw new Error('Invalid campaign');
  if(c.mode==='national'&&(c.length!==104||state.cities.length!==8||state.companies.filter(c=>c.control==='ai').length!==4))throw new Error('Invalid national scenario');
  if(c.status==='completed'&&state.absoluteWeek-c.startWeek!==c.length)throw new Error('Invalid campaign deadline');
  if(c.score&&(c.score.total<0||c.score.total>100||!Number.isFinite(c.score.total)))throw new Error('Invalid campaign score');
}
