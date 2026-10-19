import { Modal } from './Modal';
import type { GameState } from '../engine/game';
export function CampaignResult({
  game,
  onClose,
  onExport,
}: {
  game: GameState;
  onClose: () => void;
  onExport: () => void;
}) {
  return (
    <Modal titleId="result-title" onClose={onClose}>
      <div className="plannerHead">
        <h2 id="result-title">
          {game.campaign.status === 'completed' ? 'Campaign complete' : 'Company insolvent'}
        </h2>
        <button autoFocus onClick={onClose}>
          Review map
        </button>
      </div>
      <p>
        {game.absoluteWeek - game.campaign.startWeek} business weeks completed. Final multi-axis
        score: <strong>{game.campaign.score?.total}/100</strong>.
      </p>
      <table className="scoreTable">
        <caption>Campaign objectives</caption>
        <thead>
          <tr>
            <th>Objective</th>
            <th>Result</th>
            <th>Target</th>
            <th>Achieved</th>
          </tr>
        </thead>
        <tbody>
          {game.campaign.score?.axes.map((a) => (
            <tr key={a.name}>
              <th scope="row">{a.name}</th>
              <td>{a.value.toFixed(2)}</td>
              <td>{a.target}</td>
              <td>{a.met ? 'Yes' : 'Not yet'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Your map and financial reports remain available. Export this campaign before starting
        another.
      </p>
      <button onClick={onExport}>Export completed campaign</button>
    </Modal>
  );
}
