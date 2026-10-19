import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame,advanceWeek} from '../src/engine/game.ts';
import {aggregateReports,profitBridge,mapMetrics,weeklyInsights} from '../src/engine/analytics.ts';
test('13/52 week aggregations reconcile to ledger and incomplete periods are explicit',()=>{
 let s=createInitialGame();for(let i=0;i<16;i++)s=advanceWeek(s);
 const q=aggregateReports(s,'player',1,13),year=aggregateReports(s,'player',1,52);assert.equal(q.covered,13);assert.equal(q.complete,true);assert.equal(year.complete,false);assert.equal(year.covered,16);assert.equal(q.revenue-q.cogs-q.expenses,q.profit);
 const revenue=-s.ledger.filter(e=>e.companyId==='player'&&e.week<=13).flatMap(e=>e.lines).filter(l=>l.account==='revenue').reduce((n,l)=>n+l.amount,0);assert.equal(q.revenue,revenue);
 const bridge=profitBridge(s.reports.at(-1),'player');assert.equal(bridge.slice(0,3).reduce((n,r)=>n+r.value,0),bridge[3].value);
});
test('map metrics and loss explanations reflect recorded flows without double-counting lost orders',()=>{
 let s=advanceWeek(createInitialGame());const report=s.reports.at(-1),metrics=mapMetrics(s);
 assert.equal(metrics.reduce((n,m)=>n+m.sold,0),report.sales.reduce((n,r)=>n+r.units,0));
 for(const sale of report.sales)assert.equal(sale.units+sale.lostStock+sale.lostStaff,sale.desired);
 assert.ok(weeklyInsights(s,'player').every(t=>/Measured|Accounting/.test(t)));
 assert.equal(aggregateReports(s,'player',1,1).share>=0,true);
});
