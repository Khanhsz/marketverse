import { canonicalJson } from './json.ts';
import type { GameState } from './game.ts';
import { advanceWeek, deserializeGame } from './game.ts';
import type { TurnOrders } from './orders.ts';
export type Replay = { rulesVersion: 1; origin: string; commands: TurnOrders[] };
export function resetReplay(state: GameState) {
  const snapshot: Partial<GameState> = { ...state };
  delete snapshot.replay;
  state.replay = { rulesVersion: 1, origin: canonicalJson(snapshot), commands: [] };
}
export function validateReplay(state: GameState) {
  const replay = state.replay;
  if (
    !replay ||
    replay.rulesVersion !== 1 ||
    typeof replay.origin !== 'string' ||
    replay.origin.length > 20 * 1024 * 1024 ||
    !Array.isArray(replay.commands) ||
    replay.commands.length > 10000
  )
    throw new Error('Invalid replay');
  const base = JSON.parse(replay.origin);
  if (
    !base ||
    base.version !== state.version ||
    base.gameId !== state.gameId ||
    base.seed !== state.seed ||
    !Number.isSafeInteger(base.absoluteWeek) ||
    base.absoluteWeek + replay.commands.length !== state.absoluteWeek ||
    'replay' in base
  )
    throw new Error('Replay baseline mismatch');
  const ids = new Set<string>();
  for (const [i, command] of replay.commands.entries()) {
    if (
      !command ||
      typeof command.id !== 'string' ||
      ids.has(command.id) ||
      command.expectedWeek !== base.absoluteWeek + i ||
      !Array.isArray(command.projects)
    )
      throw new Error('Invalid replay command');
    ids.add(command.id);
  }
}
export function replayGame(replay: Replay): GameState {
  if (
    !replay ||
    replay.rulesVersion !== 1 ||
    !Array.isArray(replay.commands) ||
    replay.commands.length > 10000
  )
    throw new Error('Unsupported replay');
  const base = JSON.parse(replay.origin);
  if (!base || 'replay' in base) throw new Error('Invalid replay origin');
  let state = deserializeGame(
    JSON.stringify({ ...base, replay: { rulesVersion: 1, origin: replay.origin, commands: [] } }),
  );
  for (const command of replay.commands) state = advanceWeek(state, command);
  return state;
}
