import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGame, validateState, serializeGame, deserializeGame } from '../src/engine/game.ts';
import { resolveSelection, placementError, FACILITY_KINDS } from '../src/engine/entities.ts';
test('stable city/company/facility selections survive save roundtrip and array reorder',()=>{
 const state=deserializeGame(serializeGame(createInitialGame()));
 state.cities.reverse();state.companies.reverse();state.facilities.reverse();
 for(const [kind,id,name] of [['city','central','Central City'],['company','player','NOVA INDUSTRIES'],['facility','hq','NOVA HQ']])assert.equal(resolveSelection(state,{kind,id}).entity.name,name);
 for(const kind of ['city','company','facility','unknown'])assert.equal(resolveSelection(state,{kind,id:'missing'}),undefined);
});
test('schema accepts eight cities while preserving the three-city starter',()=>{
 const state=createInitialGame();assert.equal(state.cities.length,3);
 for(let i=3;i<8;i++)state.cities.push({...structuredClone(state.cities[0]),id:`city-${i}`,name:`City ${i}`,links:[]});
 assert.doesNotThrow(()=>validateState(state));assert.equal(deserializeGame(serializeGame(state)).cities.length,8);
});
test('placement rejects bad references, duplicate kind and duplicate HQ; all kinds use stable city references',()=>{
 const state=createInitialGame(),proposal={companyId:'player',cityId:'north',kind:'store'};
 assert.equal(placementError(state,proposal),undefined);
 assert.match(placementError(state,{...proposal,cityId:'missing'}),/Unknown city/);
 assert.match(placementError(state,{...proposal,companyId:'missing'}),/Unknown company/);
 assert.match(placementError(state,{...proposal,kind:'invalid'}),/Unknown facility/);
 assert.match(placementError(state,{...proposal,cityId:'central'}),/already present/);
 assert.match(placementError(state,{...proposal,kind:'hq'}),/already has an HQ/);
 for(const kind of FACILITY_KINDS){const cityId=kind==='hq'?'central':'north';const id=kind==='hq'?'hq':`new-${kind}`;assert.equal(placementError(state,{...proposal,cityId,kind},kind==='hq'?'hq':undefined),undefined);if(kind!=='hq')state.facilities.push({id,name:id,cityId,companyId:'player',kind});}
 assert.doesNotThrow(()=>validateState(state));
});
test('malformed entities, ownership and transport references are rejected on load',()=>{
 const corrupt=[s=>s.facilities[0].cityId='missing',s=>s.facilities[0].companyId='missing',s=>s.facilities[0].kind='unknown',s=>s.cities[0].links.push('missing'),s=>s.cities[0].links=[],s=>s.cities[0].segments.value=-.1,s=>s.products[0].inventory=NaN,s=>s.companies[0].control='ai',s=>s.facilities.push({...s.facilities[0],id:'second-hq'})];
 for(const mutate of corrupt){const s=createInitialGame();mutate(s);assert.throws(()=>deserializeGame(JSON.stringify(s)));}
});
