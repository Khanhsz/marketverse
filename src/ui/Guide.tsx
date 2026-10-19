import { Modal } from './Modal';
export function Guide({
  onClose,
  shortcuts,
  onShortcuts,
}: {
  onClose: () => void;
  shortcuts: boolean;
  onShortcuts: (enabled: boolean) => void;
}) {
  return (
    <Modal titleId="guide-title" onClose={onClose}>
      <div className="plannerHead">
        <h2 id="guide-title">Build a company, one week at a time</h2>
        <button autoFocus onClick={onClose}>
          Close guide
        </button>
      </div>
      <ol className="guideSteps">
        <li>
          Select a city on the map or in the city selector. Inspect its customers, purchasing power
          and transport links.
        </li>
        <li>
          Open your company to inspect products, costs and stock. Use the national campaign for
          eight cities and four rival strategies.
        </li>
        <li>
          Choose Next Week to review prices, production, media, hiring and projects. Policies
          persist until changed. Commit advances exactly one business week.
        </li>
        <li>
          Production needs a factory, hired production staff, component kits and cash. Sales need a
          store, stock in that city and sales staff. Cargo in transit cannot be sold.
        </li>
        <li>
          Build stores before shipping to new cities. Construction, research and hiring take weeks.
          Advertising builds awareness over time and remains a recurring expense.
        </li>
        <li>
          Read Reports to trace revenue, lot costs, expenses and cash. High sales do not guarantee
          profit, and unsold stock ties up cash.
        </li>
        <li>
          Complete 104 weeks and pursue profit, liquidity, market share, innovation, brand and
          reach. Export saves before replacing a campaign.
        </li>
      </ol>
      <h3>Keyboard and map</h3>
      <p>
        Tab moves through controls. In the focused map, arrow keys pan, +/− zoom and Home fits the
        country. City and entity buttons provide keyboard alternatives to map markers. Escape closes
        dialogs.
      </p>
      <p>
        Optional shortcuts: N opens weekly review, R opens reports, ? opens this guide, and [
        toggles the detail panel.
      </p>
      <label className="checkLabel">
        <input
          type="checkbox"
          checked={shortcuts}
          onChange={(e) => onShortcuts(e.target.checked)}
        />{' '}
        Enable single-key shortcuts
      </label>
      <p>
        Your game is saved in this browser. Use Export save for a backup. Export replay records
        actions from the stated checkpoint; importing it verifies the simulation in a background
        worker. Imported files replace progress only after validation and confirmation. No online
        purchase or external account is required to play.
      </p>
    </Modal>
  );
}
