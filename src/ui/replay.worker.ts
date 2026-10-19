import { replayGame } from '../engine/replay';
import type { Replay } from '../engine/replay';
import { serializeGame } from '../engine/game';
const scope = self as unknown as {
  onmessage: (event: MessageEvent<Replay>) => void;
  postMessage: (message: unknown) => void;
};
scope.onmessage = (event) => {
  try {
    scope.postMessage({ ok: true, save: serializeGame(replayGame(event.data)) });
  } catch (error) {
    scope.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
