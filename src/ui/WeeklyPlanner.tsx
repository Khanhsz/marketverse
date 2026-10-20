import { Modal } from './Modal';
import { STAFF_ROLES } from '../engine/people';
import { HR_RULES } from '../data/rules';
import { adjustHiringPlan, plannedHires, mediaBudgetLimit } from './plannerModel';
import type { StaffRole } from '../engine/people';
import { ATTRIBUTE_NAMES, defaultUpgrade } from '../engine/products';
import type { Attributes } from '../engine/products';
import type { Segment } from '../engine/game';
import { useState } from 'react';
import type { GameState, Facility } from '../engine/game';
import { applyOrders, quoteProject } from '../engine/orders';
import type { ProjectRequest, TurnOrders } from '../engine/orders';
import { FACILITY_KINDS } from '../engine/entities';
import { BUILD_RULES, RESEARCH_RULE } from '../data/rules';
type Props = {
  game: GameState;
  cityId: string;
  onCommit: (orders: TurnOrders) => void;
  onClose: () => void;
  initialSection?: 'products' | 'marketing' | 'finance' | 'projects';
};
export function WeeklyPlanner({
  game,
  cityId,
  onCommit,
  onClose,
  initialSection = 'products',
}: Props) {
  const [section, setSection] = useState<'products' | 'marketing' | 'finance' | 'projects'>(
    initialSection,
  );
  const [policy, setPolicy] = useState(() => structuredClone(game.policies[game.playerId]));
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [destination, setDestination] = useState(cityId);
  const [origin, setOrigin] = useState(cityId);
  const [kind, setKind] = useState<Facility['kind']>('store');
  const owned = game.products.filter((p) => p.companyId === game.playerId);
  const researchable = owned.filter((p) => p.lifecycle === 'active');
  const [productId, setProductId] = useState(researchable[0]?.id || '');
  const [attributes, setAttributes] = useState<Attributes>(() =>
    defaultUpgrade(researchable[0] || owned[0]),
  );
  const [segment, setSegment] = useState<Segment>((researchable[0] || owned[0]).segment);
  const [quantity, setQuantity] = useState(10);
  const [mediaSegment, setMediaSegment] = useState<Segment>('mainstream');
  const [mediaCity, setMediaCity] = useState(cityId);
  const [borrow, setBorrow] = useState(0),
    [repay, setRepay] = useState(0);
  const [error, setError] = useState('');
  const orders: TurnOrders = {
    id: `player-${game.absoluteWeek}`,
    expectedWeek: game.absoluteWeek,
    policy,
    projects,
    financing: { borrow, repay },
  };
  let reviewError = '',
    cost = 0;
  try {
    const preview = structuredClone(game);
    applyOrders(preview, game.playerId, orders, []);
    cost =
      game.companies.find((c) => c.id === game.playerId)!.cash -
      preview.companies.find((c) => c.id === game.playerId)!.cash;
  } catch (e) {
    reviewError = String(e instanceof Error ? e.message : e);
  }
  const add = (request: ProjectRequest) => {
    setError('');
    setProjects((old) => [...old, request]);
  };
  const cityOptions = game.cities.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ));
  const player = game.companies.find((c) => c.id === game.playerId)!;
  const activeMedia = game.policies[game.playerId].media?.[mediaCity] ?? {};
  const runningMedia = Object.values(activeMedia).reduce((sum, value) => sum + (value || 0), 0);
  const mediaSpend = policy.media?.[mediaCity]?.[mediaSegment] ?? 0;
  const affordableMedia = mediaBudgetLimit(player.cash - cost, policy, mediaCity, mediaSegment);
  const pendingHires = (role: StaffRole) =>
    game.projects
      .filter(
        (p) =>
          p.companyId === game.playerId &&
          p.kind === 'hiring' &&
          p.status === 'active' &&
          p.role === role,
      )
      .reduce((sum, p) => sum + (p.kind === 'hiring' ? p.quantity : 0), 0);
  const hireCount = STAFF_ROLES.reduce((sum, role) => sum + plannedHires(projects, role), 0);
  const hireSalary = STAFF_ROLES.reduce(
    (sum, role) => sum + plannedHires(projects, role) * HR_RULES.wages[role],
    0,
  );
  const setMediaSpend = (amount: number) => {
    const next = Number.isFinite(amount) ? Math.max(0, Math.min(affordableMedia, Math.floor(amount))) : 0;
    setPolicy((previous) => ({
      ...previous,
      media: {
        ...previous.media,
        [mediaCity]: {
          ...previous.media?.[mediaCity],
          [mediaSegment]: next,
        },
      },
    }));
  };
  const adjustHires = (role: StaffRole, delta: -1 | 1) => {
    setError('');
    setProjects((previous) => adjustHiringPlan(previous, role, delta));
  };
  const formatCredits = (value: number) => value.toLocaleString('en-US') + ' CR';
  return (
    <Modal titleId="planner-title" onClose={onClose} className={section === 'marketing' ? 'plannerWide' : ''}>
      <div className="plannerHead">
        <h2 id="planner-title">Review week {game.absoluteWeek}</h2>
        <button onClick={onClose} autoFocus>
          Cancel
        </button>
      </div>
      <p>
        Policies persist until changed. New projects reserve cash immediately and progress one week
        per committed turn.
      </p>
      <nav className="plannerTabs" aria-label="Decision sections">
        {(
          [
            ['products', 'Products'],
            ['marketing', 'Marketing & staff'],
            ['finance', 'Finance'],
            ['projects', 'Projects & review'],
          ] as const
        ).map(([id, name]) => (
          <button key={id} aria-pressed={section === id} onClick={() => setSection(id)}>
            {name}
          </button>
        ))}
      </nav>
      <div className={section === 'products' ? '' : 'plannerSectionInactive'}>
        <h3>Product policies</h3>
        {owned.map((p) => (
          <div className="formRow" key={p.id}>
            <strong>{p.name}</strong>
            <label>
              Price ({p.id})
              <input
                type="number"
                min="1"
                step="1"
                value={policy.prices[p.id] ?? p.price}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    prices: { ...policy.prices, [p.id]: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Production target ({p.id})
              <input
                type="number"
                min="0"
                step="1"
                value={policy.production[p.id] ?? 0}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    production: { ...policy.production, [p.id]: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        ))}
      </div>
      <div className={section === 'marketing' ? 'mediaPeopleSection' : 'plannerSectionInactive'}>
        <div className="mediaPeopleGrid">
          <section className="plannerControlCard" aria-labelledby="media-panel-title">
            <div className="plannerCardTitle">
              <div>
                <h3 id="media-panel-title">Media</h3>
                <p>Adjust your weekly media investment in the selected city.</p>
              </div>
              <label className="mediaCityControl">
                City
                <select aria-label="Media city" value={mediaCity} onChange={(e) => setMediaCity(e.target.value)}>
                  {cityOptions}
                </select>
              </label>
            </div>
            <div className="mediaCurrentStrip">
              <div>
                <span>Current weekly spend</span>
                <strong>{formatCredits(runningMedia)}</strong>
              </div>
              <div>
                <span>Current segment</span>
                <strong>{mediaSegment} · {formatCredits(activeMedia[mediaSegment] ?? 0)}</strong>
              </div>
            </div>
            <fieldset className="mediaSegmentPicker">
              <legend>Audience segment</legend>
              {(['value', 'mainstream', 'premium'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={item === mediaSegment}
                  onClick={() => setMediaSegment(item)}
                >
                  {item === 'value' ? 'Value' : item === 'mainstream' ? 'Mainstream' : 'Premium'}
                </button>
              ))}
            </fieldset>
            <div className="mediaBudgetHead">
              <label htmlFor="media-budget-slider">Weekly media budget</label>
              <strong>{formatCredits(mediaSpend)}</strong>
            </div>
            <input
              id="media-budget-slider"
              className="mediaBudgetSlider"
              type="range"
              aria-label="Media budget slider"
              min={0}
              max={affordableMedia}
              step={1}
              value={Math.min(mediaSpend, affordableMedia)}
              disabled={affordableMedia === 0}
              onChange={(e) => setMediaSpend(Number(e.target.value))}
              style={{ '--media-progress': affordableMedia > 0 ? (Math.min(mediaSpend, affordableMedia) / affordableMedia) * 100 + '%' : '0%' } as React.CSSProperties}
            />
            <div className="mediaBudgetScale">
              <span>0 CR</span>
              <span>Available budget: {formatCredits(affordableMedia)}</span>
            </div>
            <label className="mediaExactBudget">
              Precise amount
              <input
                type="number"
                aria-label="Weekly media budget"
                min={0}
                max={affordableMedia}
                step={1}
                value={mediaSpend}
                onChange={(e) => setMediaSpend(Number(e.target.value))}
              />
            </label>
            {mediaSpend > affordableMedia && (
              <p role="alert">This allocation exceeds available cash. Reduce it to continue.</p>
            )}
            <p className="plannerInfoLine">
              Changes take effect on the next committed week and persist until changed.
            </p>
          </section>
          <section className="plannerControlCard" aria-labelledby="team-panel-title">
            <div className="plannerCardTitle">
              <div>
                <h3 id="team-panel-title">Team</h3>
                <p>Current staff and new hires. No fixed team-size slots.</p>
              </div>
            </div>
            <div className="teamHireList">
              {STAFF_ROLES.map((staffRole) => {
                const name = staffRole === 'production' ? 'Production' : staffRole === 'sales' ? 'Sales' : 'R&D';
                const pending = pendingHires(staffRole);
                const added = plannedHires(projects, staffRole);
                return (
                  <div className="teamHireRow" key={staffRole}>
                    <div className="teamRole">
                      <strong>{name}</strong>
                      <span>Current {game.staff[game.playerId][staffRole]}{pending ? ' · ' + pending + ' incoming' : ''}</span>
                    </div>
                    <div className="teamHireStepper" aria-label={name + ' hiring plan'}>
                      <button
                        type="button"
                        aria-label={'Decrease ' + name + ' hires'}
                        disabled={added === 0}
                        onClick={() => adjustHires(staffRole, -1)}
                      >
                        −
                      </button>
                      <output aria-label={name + ' planned hires'}>+{added}</output>
                      <button
                        type="button"
                        aria-label={'Increase ' + name + ' hires'}
                        onClick={() => adjustHires(staffRole, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="teamHireTotals">
              <div><span>Planned hires</span><strong>+{hireCount}</strong></div>
              <div><span>Upfront recruitment</span><strong>{formatCredits(hireCount * HR_RULES.hiringCost)}</strong></div>
              <div><span>Added weekly payroll</span><strong>{formatCredits(hireSalary)}</strong></div>
            </div>
            <p className="plannerInfoLine">
              New hires arrive in {HR_RULES.hiringWeeks} weeks. Minus removes only planned hires, not existing employees.
            </p>
          </section>
        </div>
        {(reviewError || error) && <p className="plannerReviewError" role="alert">{reviewError || error}</p>}
      </div>
      <div className={section === 'finance' ? '' : 'plannerSectionInactive'}>
        <h3>Financing</h3>
        <div className="formRow">
          <label>
            Borrow credits
            <input
              type="number"
              min="0"
              value={borrow}
              onChange={(e) => setBorrow(Number(e.target.value))}
            />
          </label>
          <label>
            Repay principal
            <input
              type="number"
              min="0"
              value={repay}
              onChange={(e) => setRepay(Number(e.target.value))}
            />
          </label>
          <span>Debt limit 500,000 · Weekly interest 0.1%</span>
        </div>
      </div>
      <div className={section === 'projects' ? '' : 'plannerSectionInactive'}>
        <h3>New projects</h3>
        <div className="formRow">
          <label>
            Destination
            <select
              aria-label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {cityOptions}
            </select>
          </label>
          <label>
            Facility kind
            <select
              aria-label="Facility kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as Facility['kind'])}
            >
              {FACILITY_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => add({ kind: 'construction', cityId: destination, facilityKind: kind })}
          >
            Add construction
          </button>
          <span>
            {BUILD_RULES[kind].cost.toLocaleString()} credits · {BUILD_RULES[kind].weeks} weeks
          </span>
        </div>
        <div className="formRow">
          <label>
            Product
            <select
              aria-label="Product"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setAttributes(defaultUpgrade(owned.find((p) => p.id === e.target.value)!));
              }}
            >
              {researchable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => add({ kind: 'research', productId, attributes, segment })}>
            Add research
          </button>
          <span>
            {RESEARCH_RULE.cost.toLocaleString()} credits · {RESEARCH_RULE.weeks} weeks
          </span>
        </div>
        <div className="formRow">
          {ATTRIBUTE_NAMES.map((name) => (
            <label key={name}>
              Design {name}
              <input
                type="number"
                min="0"
                max="100"
                value={attributes[name]}
                onChange={(e) => setAttributes({ ...attributes, [name]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label>
            Target segment
            <select
              aria-label="Target segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
            >
              <option>value</option>
              <option>mainstream</option>
              <option>premium</option>
            </select>
          </label>
        </div>
        <div className="formRow">
          <label>
            Shipment origin
            <select
              aria-label="Shipment origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              {cityOptions}
            </select>
          </label>
          <label>
            Units
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <button
            onClick={() =>
              add({ kind: 'shipment', productId, originId: origin, cityId: destination, quantity })
            }
          >
            Add shipment
          </button>
        </div>
        <ul className="orderList">
          {projects.map((p, i) => {
            let quote = '';
            try {
              const q = quoteProject(game, game.playerId, p);
              quote = `${q.cost.toLocaleString()} credits · ${q.weeks} weeks`;
            } catch {}
            return (
              <li key={i}>
                {p.kind} ·{' '}
                {'cityId' in p
                  ? game.cities.find((c) => c.id === p.cityId)?.name
                  : p.kind === 'hiring'
                    ? p.role
                    : p.productId}{' '}
                · {quote}
                <button
                  aria-label={`Remove order ${i + 1}`}
                  onClick={() => setProjects(projects.filter((_, index) => index !== i))}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
        <p>
          <strong>Upfront project cost: {cost.toLocaleString()} credits</strong> · Available cash:{' '}
          {game.companies.find((c) => c.id === game.playerId)!.cash.toLocaleString()}
        </p>
        {(reviewError || error) && <p role="alert">{reviewError || error}</p>}
      </div>
      <div className="plannerActions">
        <button onClick={onClose}>Keep planning</button>
        <button
          className="primary"
          disabled={!!reviewError}
          onClick={() => {
            try {
              onCommit(orders);
            } catch (e) {
              setError(String(e instanceof Error ? e.message : e));
            }
          }}
        >
          Commit week
        </button>
      </div>
    </Modal>
  );
}
