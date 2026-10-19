#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const state=JSON.parse(readFileSync('docs/AUTOPILOT_STATE.json','utf8'));
assert.equal(state.schemaVersion,1,'state schema');
assert.equal(state.repository,'Khanhsz/marketverse','repository identity');
assert.ok(Number.isInteger(state.activeSprint)&&state.activeSprint>=1&&state.activeSprint<=16,'valid sprint');
assert.ok(Array.isArray(state.completedSprints),'completedSprints array');
const done=state.completedSprints;
assert.deepEqual(done,[...done].sort((a,b)=>a-b),'ordered completed');
assert.equal(new Set(done).size,done.length,'unique completed');
for(let i=0;i<done.length;i++)assert.equal(done[i],i+1,'sprints completed in order');
const expected=done.length===16?16:done.length+1;
assert.equal(state.activeSprint,expected,'no skipped sprint');
assert.ok(['awaiting_validation','in_progress','blocked','ready_to_advance','alpha_candidate'].includes(state.status),'supported status');
assert.equal(state.automation.requiresOpenAIApiKey,false,'API-free requirement');
assert.ok(state.automation.runner==='unconfigured'||state.automation.runner==='configured','runner indicator');
if(done.length===16)assert.equal(state.status,'alpha_candidate','alpha is terminal');
console.log('MarketVerse state contract validated: sprint',state.activeSprint,'completed',done.length);
