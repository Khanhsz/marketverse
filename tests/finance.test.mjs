import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame,advanceWeek,deserializeGame,serializeGame} from '../src/engine/game.ts';
import {initializeFinance,validateFinance} from '../src/engine/finance.ts';
import {syncInventory} from '../src/engine/operations.ts';
const plan=(s,projects=[],financing)=>({id:'finance-'+s.absoluteWeek,expectedWeek:s.absoluteWeek,projects,financing});
test('every journal balances and net worth changes by recognized profit; capex is an asset',()=>{
 let s=createInitialGame(),opening=s.finance.player.balances;
 const worth=opening.cash+opening.inventory+opening.fixedAssets+opening.debt;
 s=advanceWeek(s,plan(s,[{kind:'construction',cityId:'north',facilityKind:'warehouse'}]));
 const report=s.reports.at(-1).financials.find(f=>f.companyId==='player');
 assert.equal(report.capex,60000);assert.equal(s.finance.player.balances.construction,60000);assert.equal(report.netWorth,worth+report.profit);assert.notEqual(report.profit,report.cashChange);
 for(let i=0;i<4;i++)s=advanceWeek(s);
 assert.equal(s.finance.player.balances.construction,0);assert.ok(s.finance.player.balances.fixedAssets>=220000);assert.doesNotThrow(()=>validateFinance(s));
 for(const entry of s.ledger)assert.equal(entry.lines.reduce((n,l)=>n+l.amount,0),0);
});
test('loans move cash and debt without creating operating profit; limits and repayment are enforced',()=>{
 const s=createInitialGame(),base=advanceWeek(s),borrowed=advanceWeek(s,plan(s,[],{borrow:100000,repay:0}));
 assert.equal(borrowed.companies[0].debt,100000);assert.equal(borrowed.companies[0].cash-base.companies[0].cash,99900);
 assert.equal(borrowed.reports.at(-1).financials[0].profit-base.reports.at(-1).financials[0].profit,-100);
 assert.throws(()=>advanceWeek(s,plan(s,[],{borrow:500001,repay:0})),/limit/);
 const repaid=advanceWeek(borrowed,plan(borrowed,[],{borrow:0,repay:100000}));assert.equal(repaid.companies[0].debt,0);assert.equal(repaid.reports.at(-1).financials[0].repayment,100000);
});
test('unpaid bills become payables, cash stays nonnegative, prolonged default triggers bankruptcy',()=>{
 let s=createInitialGame();s.stocks=[];syncInventory(s);s.companies[0].cash=0;s.finance=initializeFinance(s);
 for(let i=0;i<4;i++)s=advanceWeek(s);
 assert.equal(s.companies[0].cash,0);assert.equal(s.finance.player.bankrupt,true);assert.ok(s.finance.player.balances.payable<0);
 assert.throws(()=>advanceWeek(s,plan(s,[{kind:'research',productId:'nova'}])),/Bankrupt/);assert.doesNotThrow(()=>validateFinance(s));
});
test('tampered cash/journal is rejected and JSON resume has identical journals and reports',()=>{
 const s=advanceWeek(createInitialGame()),tampered=structuredClone(s);tampered.companies[0].cash++;assert.throws(()=>deserializeGame(JSON.stringify(tampered)),/reconciliation/);
 tampered.companies[0].cash--;tampered.ledger[0].lines[0].amount++;assert.throws(()=>deserializeGame(JSON.stringify(tampered)),/journal/);
 assert.deepEqual(advanceWeek(deserializeGame(serializeGame(s))),advanceWeek(s));
});
