import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame,advanceWeek} from '../src/engine/game.ts';
import {calculateDemand,productUtility,allocatePreference} from '../src/engine/demand.ts';
const desired=s=>calculateDemand(s).filter(c=>c.cityId==='central').flatMap(c=>c.allocations).filter(a=>a.productId==='nova').reduce((n,a)=>n+a.desired,0);
test('price response is elastic and quality/target fit affect willingness to purchase',()=>{
 const low=createInitialGame(),high=createInitialGame();low.products[0].price=150;high.products[0].price=400;assert.ok(desired(low)>desired(high));
 const p=low.products[0],city=low.cities[1];assert.ok(productUtility({...p,quality:90},city,'premium')>productUtility({...p,quality:30},city,'premium'));
 assert.ok(productUtility({...p,segment:'value'},city,'value')>productUtility({...p,segment:'premium'},city,'value'));
});
test('market conservation includes outside choice and is invariant to entity order',()=>{
 const s=createInitialGame(),first=calculateDemand(s);assert.deepEqual(calculateDemand(s),first);
 for(const cell of first)assert.equal(cell.outside+cell.allocations.reduce((n,a)=>n+a.desired,0),cell.potential);
 s.products.reverse();s.cities.reverse();assert.deepEqual(calculateDemand(s),first);
 assert.deepEqual(allocatePreference(7,[{id:'a',weight:1},{id:'b',weight:1}]),{a:4,b:3});
});
test('unserved cities have only no-purchase and preferences do not create revenue',()=>{
 const s=createInitialGame();s.facilities=s.facilities.filter(f=>f.kind!=='store');for(const c of calculateDemand(s)){assert.equal(c.outside,c.potential);assert.deepEqual(c.allocations,[]);}
 const next=advanceWeek(s);assert.deepEqual(next.companies,s.companies);assert.deepEqual(next.products,s.products);
});
