import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialGame,advanceWeek,serializeGame,deserializeGame} from '../src/engine/game.ts';
import {observeMarket,planAI} from '../src/engine/ai.ts';
import {calculateDemand} from '../src/engine/demand.ts';
test('seeded events, population and seasonal demand are bounded, narrated and replayable',()=>{
 let a=createInitialGame(42),b=createInitialGame(42),c=createInitialGame(43);const before=a.cities.map(c=>c.population),started=performance.now();
 for(let i=0;i<52;i++){a=advanceWeek(a);b=advanceWeek(b);c=advanceWeek(c);assert.ok(a.macro.index>=.75&&a.macro.index<=1.25);assert.ok(a.macro.seasonal>=.88-1e-9&&a.macro.seasonal<=1.12+1e-9);}
 assert.equal(serializeGame(a),serializeGame(b));assert.notDeepEqual(a.macro,c.macro);assert.equal(a.macro.events.length,4);assert.ok(a.cities.every((city,i)=>city.population>before[i]));
 for(const e of a.macro.events){assert.ok(Math.abs(e.delta)<=.040001);assert.ok(a.reports.find(r=>r.week===e.week).events.some(text=>text.includes(e.title)));}
 assert.deepEqual(advanceWeek(deserializeGame(serializeGame(a))),advanceWeek(a));assert.ok(performance.now()-started<20000);
});
test('seasonality moves potential buyers and AI responds to previous public macro information',()=>{
 const s=createInitialGame(),low=structuredClone(s),high=structuredClone(s);low.macro.seasonal=.88;high.macro.seasonal=1.12;
 const total=x=>calculateDemand(x).reduce((n,c)=>n+c.potential,0);assert.ok(total(high)>total(low));
 s.facilities.push({id:'test-factory',kind:'factory',cityId:'south',companyId:'value',name:'factory'});
 const o=observeMarket(s,'value'),normal=planAI(o);o.macro={index:.8,seasonal:.9};const weak=planAI(o);assert.ok(weak.policy.production.vectra<normal.policy.production.vectra);
});
