import { roundSimulation } from './precision.ts';
import type { GameState } from './game.ts';
import { createRng } from './game.ts';
import { MACRO_RULES } from '../data/rules.ts';
export type MacroEvent = {
  id: string;
  week: number;
  title: string;
  before: number;
  after: number;
  delta: number;
};
export type Macro = {
  originWeek: number;
  index: number;
  seasonal: number;
  base: Record<string, { population: number; power: number }>;
  events: MacroEvent[];
};
export function initializeMacro(state: Pick<GameState, 'absoluteWeek' | 'cities'>): Macro {
  return {
    originWeek: state.absoluteWeek,
    index: 1,
    seasonal: 1,
    base: Object.fromEntries(
      state.cities.map((c) => [c.id, { population: c.population, power: c.power }]),
    ),
    events: [],
  };
}
const bound = (v: number) =>
  roundSimulation(Math.max(MACRO_RULES.minIndex, Math.min(MACRO_RULES.maxIndex, v)));
export function resolveMacro(state: GameState, events: string[]) {
  const rng = createRng((state.seed ^ Math.imul(state.absoluteWeek, 0x9e3779b1)) >>> 0),
    macro = state.macro;
  macro.index = bound(macro.index + (rng() - 0.5) * MACRO_RULES.weeklyNoise);
  macro.seasonal = roundSimulation(
    1 + MACRO_RULES.seasonalAmplitude * Math.sin((2 * Math.PI * (state.absoluteWeek - 1)) / 52),
  );
  if (state.absoluteWeek % MACRO_RULES.eventsEvery === 0) {
    const shock = MACRO_RULES.shocks[Math.floor(rng() * MACRO_RULES.shocks.length)],
      before = macro.index;
    macro.index = bound(before + shock.delta);
    const event = {
      id: `macro:${state.seed}:${state.absoluteWeek}`,
      week: state.absoluteWeek,
      title: shock.title,
      before,
      after: macro.index,
      delta: roundSimulation(macro.index - before),
    };
    macro.events.push(event);
    events.push(
      `${event.title}: purchasing-power index ${before.toFixed(3)} → ${macro.index.toFixed(3)} (${event.delta >= 0 ? '+' : ''}${(event.delta * 100).toFixed(1)} index points).`,
    );
  }
  for (const city of state.cities) {
    const base = macro.base[city.id],
      hash = [...city.id].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), state.seed),
      local = createRng(hash)();
    const annualGrowth = MACRO_RULES.annualGrowthMin + local * MACRO_RULES.annualGrowthRange,
      years = (state.absoluteWeek - macro.originWeek + 1) / 52;
    city.population = Math.max(1, Math.round(base.population * Math.pow(1 + annualGrowth, years)));
    city.power = roundSimulation(base.power * macro.index * (1 + annualGrowth * 0.25 * years));
  }
  events.push(
    `Market index ${macro.index.toFixed(3)}; seasonal purchase multiplier ${macro.seasonal.toFixed(3)}.`,
  );
}
export function validateMacro(state: GameState) {
  const m = state.macro;
  if (
    !m ||
    !Number.isSafeInteger(m.originWeek) ||
    m.originWeek < 1 ||
    m.originWeek > state.absoluteWeek ||
    !Number.isFinite(m.index) ||
    m.index < 0.75 ||
    m.index > 1.25 ||
    !Number.isFinite(m.seasonal) ||
    m.seasonal < 0.879999 ||
    m.seasonal > 1.120001 ||
    !Array.isArray(m.events)
  )
    throw new Error('Invalid macro state');
  for (const city of state.cities) {
    const b = m.base[city.id];
    if (
      !b ||
      !Number.isSafeInteger(b.population) ||
      b.population < 1 ||
      !Number.isFinite(b.power) ||
      b.power <= 0
    )
      throw new Error('Invalid city baseline');
  }
  if (new Set(m.events.map((e) => e.id)).size !== m.events.length)
    throw new Error('Duplicate macro event');
  for (const e of m.events)
    if (
      !e.id ||
      !Number.isSafeInteger(e.week) ||
      e.week < 1 ||
      e.week >= state.absoluteWeek ||
      Math.abs(e.after - e.before - e.delta) > 1e-10 ||
      Math.abs(e.delta) > 0.040001 ||
      e.after < 0.75 ||
      e.after > 1.25
    )
      throw new Error('Invalid macro event');
}
