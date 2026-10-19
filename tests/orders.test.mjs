import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame as initialGame,advanceWeek,serializeGame,deserializeGame} from '../src/engine/game.ts';
const createInitialGame=()=>{const s=initialGame();s.facilities=s.facilities.filter(f=>f.kind!=='store');return s;};
const order=(s,projects=[],policy)=>({id:'player-'+s.absoluteWeek,expectedWeek:s.absoluteWeek,projects,policy});
test('review commit is atomic, persistent and rejects duplicate/stale turns',()=>{
 const s=createInitialGame(),before=serializeGame(s),policy={...s.policies.player,prices:{nova:260},production:{nova:90}};
 const command=order(s,[{kind:'construction',cityId:'north',facilityKind:'store'}],policy);
 const next=advanceWeek(s,command);
 assert.equal(serializeGame(s),before);assert.equal(next.products[0].price,260);assert.equal(next.projects[0].remaining,3);assert.equal(next.companies[0].cash,s.companies[0].cash-40000-next.reports.at(-1).financials.find(f=>f.companyId===s.playerId).expenses);
 assert.throws(()=>advanceWeek(next,command),/Stale|duplicate/);
 assert.deepEqual(advanceWeek(next).policies.player,policy);
 assert.throws(()=>advanceWeek(s,order(s,[...command.projects,...command.projects])),/already|present/);assert.equal(serializeGame(s),before);
});
test('queues progress exactly once and resume identically across save/load',()=>{
 let state=createInitialGame();state=advanceWeek(state,order(state,[{kind:'construction',cityId:'north',facilityKind:'store'},{kind:'research',productId:'nova'}]));
 for(let i=0;i<5;i++){
  const resumed=advanceWeek(deserializeGame(serializeGame(state))),direct=advanceWeek(state);assert.deepEqual(resumed,direct);state=direct;
 }
 assert.equal(state.projects[0].status,'completed');assert.equal(state.projects[1].status,'completed');assert.equal(state.facilities.filter(f=>f.companyId==='player'&&f.cityId==='north').length,1);
});
test('shipping reserves goods in transit and releases exactly once at destination deadline',()=>{
 let s=createInitialGame();s.facilities.push({id:'warehouse-north',name:'Warehouse',cityId:'north',companyId:'player',kind:'warehouse'});
 const next=advanceWeek(s,order(s,[{kind:'shipment',originId:'central',cityId:'north',productId:'nova',quantity:25}]));
 assert.equal(next.products[0].inventory,400);assert.equal(next.projects[0].status,'completed');assert.equal(advanceWeek(next).products[0].inventory,400);
 assert.throws(()=>advanceWeek(s,order(s,[{kind:'shipment',originId:'central',cityId:'north',productId:'nova',quantity:401}])),/inventory/);
});
test('legacy migration preserves game progress and rejects unknown versions or corrupt queues',()=>{
 const s=initialGame();const legacy=structuredClone(s);legacy.version=1;delete legacy.policies;delete legacy.projects;delete legacy.commandHistory;delete legacy.stocks;delete legacy.factories;
 const migrated=deserializeGame(JSON.stringify(legacy));assert.deepEqual(migrated,s);
 assert.throws(()=>deserializeGame(JSON.stringify({...s,version:999})),/schema/);
 const next=advanceWeek(s,order(s,[{kind:'research',productId:'nova'}]));next.projects[0].remaining=100;assert.throws(()=>deserializeGame(JSON.stringify(next)),/project/);
});
