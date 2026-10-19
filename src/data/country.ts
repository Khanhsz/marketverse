import type { City } from '../engine/game.ts';
export function nationalCities():City[]{
  const cities:City[]=[
    {id:'north',name:'Northport',x:390,y:160,population:660000,power:1.12,segments:{value:.29,mainstream:.48,premium:.23},links:[]},
    {id:'central',name:'Central City',x:550,y:300,population:1120000,power:1,segments:{value:.34,mainstream:.49,premium:.17},links:[]},
    {id:'south',name:'South Bay',x:670,y:440,population:840000,power:.92,segments:{value:.42,mainstream:.46,premium:.12},links:[]},
    {id:'west',name:'Westridge',x:325,y:310,population:540000,power:.85,segments:{value:.48,mainstream:.4,premium:.12},links:[]},
    {id:'east',name:'Eastgate',x:720,y:245,population:980000,power:1.18,segments:{value:.24,mainstream:.48,premium:.28},links:[]},
    {id:'river',name:'Riverbend',x:465,y:420,population:430000,power:.9,segments:{value:.45,mainstream:.43,premium:.12},links:[]},
    {id:'lake',name:'Lakeview',x:530,y:165,population:720000,power:1.3,segments:{value:.2,mainstream:.45,premium:.35},links:[]},
    {id:'harbor',name:'Sunhaven',x:620,y:495,population:790000,power:1.05,segments:{value:.33,mainstream:.47,premium:.2},links:[]},
  ];
  for(const [a,b] of [['north','central'],['central','south'],['north','lake'],['lake','east'],['east','central'],['central','west'],['west','river'],['river','south'],['south','harbor'],['harbor','east'],['lake','central']]){cities.find(c=>c.id===a)!.links.push(b);cities.find(c=>c.id===b)!.links.push(a);}
  return cities;
}
export const CAMPAIGN_RULES = {length:104,targets:{profit:300000,liquidity:500000,share:.15,innovation:3,brand:.25,reach:4},weights:{profit:.2,liquidity:.15,share:.2,innovation:.15,brand:.15,reach:.15}};
