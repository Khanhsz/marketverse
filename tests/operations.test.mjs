import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame,advanceWeek,serializeGame,deserializeGame} from '../src/engine/game.ts';
import {localStock,syncInventory,refreshFactories} from '../src/engine/operations.ts';
import {initializeFinance} from '../src/engine/finance.ts';
const empty=s=>{s.stocks=[];syncInventory(s);s.finance=initializeFinance(s);s.ledger=[];};
test('local fulfillment cannot sell absent or in-transit inventory and never makes negative stock',()=>{
 let s=createInitialGame();empty(s);let n=advanceWeek(s);assert.ok(n.reports.at(-1).sales.every(r=>r.units===0));assert.ok(n.reports.at(-1).financials.every(f=>f.revenue===0));
 s=createInitialGame();s.facilities.push({id:'north-wh',name:'WH',kind:'warehouse',companyId:'player',cityId:'north'});
 s.facilities.push({id:'south-store',name:'Store',kind:'store',companyId:'player',cityId:'south'});
 s.stocks.find(l=>l.productId==='nova').cityId='north';
 n=advanceWeek(s,{id:'ship',expectedWeek:1,projects:[{kind:'shipment',productId:'nova',originId:'north',cityId:'south',quantity:400}]});
 assert.equal(n.projects[0].remaining,1);assert.equal(n.products[0].inventory,0);assert.ok(n.reports.at(-1).sales.filter(r=>r.productId==='nova').every(r=>r.units===0));
 const resumed=advanceWeek(deserializeGame(serializeGame(n)));assert.equal(resumed.projects[0].status,'completed');assert.ok(resumed.reports.at(-1).sales.some(r=>r.productId==='nova'&&r.cityId==='south'&&r.units>0));
 const sold=resumed.reports.at(-1).sales.filter(r=>r.productId==='nova').reduce((x,r)=>x+r.units,0);assert.equal(resumed.products[0].inventory+sold,400);assert.ok(resumed.stocks.every(l=>l.quantity>0));
});
test('factory output obeys target, labor capacity, material spending and cash budget',()=>{
 const s=createInitialGame();s.facilities=s.facilities.filter(f=>f.kind!=='store');empty(s);s.facilities.push({id:'factory',name:'Factory',kind:'factory',companyId:'player',cityId:'central'});refreshFactories(s);
 s.policies.player.production.nova=180;s.staff.player.production=2;
 let n=advanceWeek(s);assert.equal(n.reports.at(-1).production[0].units,100);assert.equal(localStock(n,'nova','central'),100);assert.equal(s.companies[0].cash-n.companies[0].cash,100*124+n.reports.at(-1).financials.find(f=>f.companyId===s.playerId).expenses);
 s.factories[0].workers=0;s.staff.player.production=0;n=advanceWeek(s);assert.equal(n.reports.at(-1).production.length,0);
 s.factories[0].workers=4;s.staff.player.production=4;s.companies[0].cash=500;s.finance=initializeFinance(s);n=advanceWeek(s);assert.equal(n.reports.at(-1).production[0].units,4);assert.ok(n.companies[0].cash>=0);
});
test('sales cost basis comes from consumed lots and revenue equals fulfilled quantity times price',()=>{
 const s=createInitialGame();const n=advanceWeek(s);for(const sale of n.reports.at(-1).sales){const p=s.products.find(p=>p.id===sale.productId);assert.equal(sale.revenue,sale.units*n.products.find(x=>x.id===p.id).price);assert.equal(sale.cogs,sale.units*p.cost);assert.ok(sale.units<=sale.desired);}
});
