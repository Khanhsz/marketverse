import { deserializeGame } from '../engine/game';
import type { GameState } from '../engine/game';
import type { Replay } from '../engine/replay';
export function downloadJson(value: string, name: string) {
  const url = URL.createObjectURL(new Blob([value], { type: 'application/json' })),
    link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readGameFile(file: File): Promise<GameState> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Save file exceeds 20 MB');
  const raw = await file.text(),
    parsed = JSON.parse(raw);
  if (parsed?.type !== 'marketverse-replay') return deserializeGame(raw);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./replay.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Replay exceeded its time budget'));
    }, 120000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (e) => {
      finish();
      try {
        if (!e.data.ok) throw new Error(e.data.error);
        resolve(deserializeGame(e.data.save));
      } catch (error) {
        reject(error);
      }
    };
    worker.onerror = () => {
      finish();
      reject(new Error('Replay could not be verified'));
    };
    worker.postMessage(parsed.replay as Replay);
  });
}
