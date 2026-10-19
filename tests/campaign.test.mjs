import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceWeek,validateState,serializeGame,deserializeGame} from '../src/engine/game.ts';
import {createNationalCampaign,scoreCampaign} from '../src/engine/campaign.ts';
import {route} from '../src/engine/orders.ts';
test('national scenario has eight distinct connected cities, four rivals and 104 valid turns',()=>{
 let s=createNationalCampaign(99);assert.doesNotThrow(()=>validateState(s));assert.equal(s.cities.length,8);assert.equal(new Set(s.companies.filter(c=>c.control==='ai').map(c=>c.strategy)).size,4);
 for(const a of s.cities)for(const b of s.cities)assert.ok(route(s,a.id,b.id));
 for(let i=0;i<104;i++){const direct=advanceWeek(s);if(i%13===0)assert.equal(serializeGame(advanceWeek(deserializeGame(serializeGame(s)))),serializeGame(direct));s=direct;}
 assert.equal(s.absoluteWeek,105);assert.equal(s.year,3);assert.equal(s.week,1);assert.equal(s.campaign.status,'completed');assert.ok(s.campaign.score.total>=0&&s.campaign.score.total<=100);assert.equal(s.campaign.score.axes.length,6);
 assert.ok(s.reports.every(r=>r.demand.length===24));assert.throws(()=>advanceWeek(s),/Campaign ended/);assert.equal(serializeGame(deserializeGame(serializeGame(s))),serializeGame(s));
});
test('cash alone cannot win a campaign and score includes reach, innovation, brand and operating results',()=>{
 const s=createNationalCampaign();s.companies[0].cash=1000000000;const score=scoreCampaign(s);assert.ok(score.total<50);assert.deepEqual(score.axes.map(a=>a.name),['profit','liquidity','share','innovation','brand','reach']);
});
