import { CampaignResult } from './CampaignResult';
import { DepartmentRail, DepartmentPanel } from './VisualUX';
import type { Department } from './VisualUX';
import { downloadJson, readGameFile } from './saveFiles';
import { Guide } from './Guide';
import { createNationalCampaign, scoreCampaign } from '../engine/campaign';
import { ReportsPanel } from './ReportsPanel';
import { mapMetrics } from '../engine/analytics';
import { brandKey } from '../engine/people';
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { localStock } from '../engine/operations';
import { WeeklyPlanner } from './WeeklyPlanner';
const CountryMap = lazy(() =>
  import('./CountryMap').then((module) => ({ default: module.CountryMap })),
);
import { advanceWeek, deserializeGame, SAVE_KEY, serializeGame } from '../engine/game';
import { FACILITY_KINDS, placementError, resolveSelection } from '../engine/entities';
import type { Selection } from '../engine/entities';
import {
  cityEntities,
  cityOperationalStats,
  facilityOperationalStats,
} from '../engine/entityStats';
const number = (v: number) => new Intl.NumberFormat('en-US').format(v);
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        return { game: deserializeGame(raw), recovery: '' };
      } catch {
        return { game: createNationalCampaign(), recovery: raw };
      }
    }
  } catch {
    return { game: createNationalCampaign(), recovery: 'Storage is unavailable' };
  }
  return { game: createNationalCampaign(), recovery: '' };
}
export function App() {
  const panelRef = useRef<HTMLElement>(null);
  const [department, setDepartment] = useState<Department>('operations');
  const [plannerStart, setPlannerStart] = useState<
    'products' | 'marketing' | 'finance' | 'projects'
  >('products');
  const planFor = (section: 'products' | 'marketing' | 'finance' | 'projects') => {
    setPlannerStart(section);
    setPlannerOpen(true);
  };
  const resetGame = () => {
    if (
      window.confirm(
        'Bắt đầu lại với 8 thành phố? Save hiện tại sẽ bị thay thế. Hãy xuất file lưu game trước nếu muốn giữ tiến trình cũ.',
      )
    ) {
      setGame(createNationalCampaign());
      setSelection({ kind: 'city', id: 'central' });
      setRecovery('');
      committedWeek.current = 0;
      announcedResult.current = '';
    }
  };
  const startEightCities = () => {
    if (
      window.confirm(
        'Chuyển sang quốc gia 8 thành phố (National Campaign 104 tuần)? Tiến trình hiện tại sẽ bị thay thế. Hãy xuất file lưu game trước để có thể khôi phục.',
      )
    ) {
      setGame(createNationalCampaign());
      setSelection({ kind: 'city', id: 'central' });
      setRecovery('');
      committedWeek.current = 0;
      announcedResult.current = '';
    }
  };
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [weeklyChangesOpen, setWeeklyChangesOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false),
    [importing, setImporting] = useState(false),
    [importError, setImportError] = useState('');
  const announcedResult = useRef('');
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth > 849),
    [guideOpen, setGuideOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      return localStorage.getItem('marketverse:shortcuts') !== 'off';
    } catch {
      return true;
    }
  });
  const [reportsOpen, setReportsOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const committedWeek = useRef(0);
  const [loaded] = useState(loadGame);
  const [game, setGame] = useState(loaded.game);
  const [recovery, setRecovery] = useState(loaded.recovery);
  const [storageError, setStorageError] = useState('');
  const [selection, setSelection] = useState<Selection>({ kind: 'city', id: 'central' });
  useEffect(() => {
    if (recovery) return;
    try {
      localStorage.setItem(SAVE_KEY, serializeGame(game));
      setStorageError('');
    } catch {
      setStorageError('Local save failed. Export your game before closing this page.');
    }
  }, [game, recovery]);
  const context =
    resolveSelection(game, selection) ||
    resolveSelection(game, { kind: 'city', id: game.cities[0].id })!;
  const cityId =
    context.kind === 'city'
      ? context.entity.id
      : context.kind === 'world'
        ? context.entity.cityId
        : context.kind === 'facility'
          ? context.entity.cityId
          : game.facilities.find((f) => f.companyId === context.entity.id)?.cityId;
  const city = game.cities.find((c) => c.id === cityId) || game.cities[0];
  const player = game.companies.find((c) => c.id === game.playerId)!;
  useEffect(() => {
    if (
      game.campaign.mode === 'national' &&
      game.campaign.status !== 'active' &&
      !plannerOpen &&
      !reportsOpen &&
      !guideOpen &&
      announcedResult.current !== game.gameId + game.absoluteWeek
    ) {
      announcedResult.current = game.gameId + game.absoluteWeek;
      setResultOpen(true);
    }
  }, [game, plannerOpen, reportsOpen, guideOpen]);
  const metrics = useMemo(() => mapMetrics(game), [game]);
  const campaignScore = useMemo(() => game.campaign.score || scoreCampaign(game), [game]);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [selection, game.campaign.mode]);
  useEffect(() => {
    try {
      localStorage.setItem('marketverse:shortcuts', shortcuts ? 'on' : 'off');
    } catch {}
  }, [shortcuts]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        !shortcuts ||
        plannerOpen ||
        reportsOpen ||
        guideOpen ||
        resultOpen ||
        target.matches('input,select,textarea') ||
        target.isContentEditable ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (event.key.toLowerCase() === 'n' && !recovery && game.campaign.status === 'active') {
        event.preventDefault();
        setPlannerOpen(true);
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setReportsOpen(true);
      }
      if (event.key === '?') {
        event.preventDefault();
        setGuideOpen(true);
      }
      if (event.key === '[') {
        event.preventDefault();
        setPanelOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [shortcuts, plannerOpen, reportsOpen, guideOpen, resultOpen, recovery, game.campaign.status]);
  const choose = (value: Selection) => {
    if (resolveSelection(game, value)) {
      setSelection(value);
      setQuickActionsOpen(department === 'insight');
      if (window.innerWidth <= 849) setPanelOpen(false);
    }
  };
  const cityButton = (id: string) => (
    <button className="entityLink" key={id} onClick={() => choose({ kind: 'city', id })}>
      {game.cities.find((c) => c.id === id)?.name}
    </button>
  );
  const ownerButton = (id: string) => (
    <button className="entityLink" onClick={() => choose({ kind: 'company', id })}>
      {game.companies.find((c) => c.id === id)?.name}
    </button>
  );
  const exportGame = () =>
    downloadJson(
      recovery || serializeGame(game),
      recovery ? 'marketverse-recovery.json' : 'marketverse-save.json',
    );
  const exportReplay = () =>
    downloadJson(
      JSON.stringify({ type: 'marketverse-replay', replay: game.replay }),
      'marketverse-replay.json',
    );
  const importGame = async (file: File) => {
    setImporting(true);
    setImportError('');
    try {
      const loaded = await readGameFile(file);
      if (
        window.confirm(
          `Import week ${loaded.absoluteWeek} of ${loaded.campaign.mode}? This replaces the current game; export first if needed.`,
        )
      ) {
        setGame(loaded);
        setRecovery('');
        setSelection({
          kind: 'city',
          id: loaded.cities.find((c) => c.id === 'central')?.id || loaded.cities[0].id,
        });
        committedWeek.current = 0;
        announcedResult.current = '';
        announcedResult.current = '';
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  };
  return (
    <div className="app commandVisual">
      <header className="header">
        <div className="logo commandLogo">
          <div>
            ⬡ <strong>MARKETVERSE</strong>
          </div>
          <span>COUNTRY STRATEGY MAP</span>
        </div>
        <div className="metrics">
          <div>
            <small>THỜI GIAN</small>
            <b>
              Y{game.year.toString().padStart(2, '0')} · W{game.week.toString().padStart(2, '0')}
            </b>
          </div>
          <div>
            <small>TIỀN MẶT</small>
            <b>{number(player.cash)}</b>
          </div>
          <div>
            <small>CITIES</small>
            <b>{game.cities.length}</b>
          </div>
        </div>
      </header>
      <div className={`workspace ${panelOpen ? '' : 'panelCollapsed'}`}>
        <DepartmentRail
          active={department}
          onChange={(id) => {
            setDepartment(id);
            setPanelOpen(true);
            setQuickActionsOpen(false);
            if (id === 'reports') setReportsOpen(true);
          }}
        />
        <main className="mapArea">
          <div className="overlay commandMapHeader">
            {department === 'operations'
              ? 'OPERATIONS · CÔNG SUẤT & TỒN KHO'
              : department === 'insight'
                ? 'CITY INTELLIGENCE'
                : department.toUpperCase() + ' · COUNTRY STRATEGY'}
          </div>
          <div className="commandNational">NATIONAL</div>
          <Suspense
            fallback={
              <p className="mapLoading" role="status">
                Loading country map…
              </p>
            }
          >
            <CountryMap
              cities={game.cities}
              facilities={game.facilities}
              companies={game.companies}
              selectedCityId={city.id}
              selection={selection}
              metrics={metrics}
              products={game.products}
              stocks={game.stocks}
              factories={game.factories}
              playerId={game.playerId}
              activeLayer={
                department === 'operations' || department === 'projects'
                  ? 'Operations'
                  : department === 'logistics'
                    ? 'Logistics'
                    : department === 'finance'
                      ? 'Economy'
                      : department === 'products' || department === 'marketing'
                        ? 'Market'
                        : department === 'people' || department === 'settings'
                          ? 'Operations'
                          : 'Competition'
              }
              onSelect={choose}
            />
          </Suspense>
          {quickActionsOpen && (
            <section className="mapQuickCard" aria-label="Map quick actions">
              <button
                className="quickClose"
                aria-label="Dismiss map actions"
                onClick={() => setQuickActionsOpen(false)}
              >
                ×
              </button>
              <small>{context.kind.toUpperCase()} · SELECTED</small>
              <h2>{context.entity.name}</h2>
              <p>
                {city.name} · {number(city.population)} residents ·{' '}
                {game.facilities.filter((f) => f.cityId === city.id).length} facilities
              </p>
              <div className="quickActions">
                <button
                  onClick={() => {
                    setPanelOpen(true);
                    setQuickActionsOpen(false);
                  }}
                >
                  Inspect
                </button>
                <button
                  onClick={() => {
                    setPlannerOpen(true);
                    setQuickActionsOpen(false);
                  }}
                >
                  Plan actions
                </button>
                <button
                  onClick={() => {
                    setReportsOpen(true);
                    setQuickActionsOpen(false);
                  }}
                >
                  Reports
                </button>
              </div>
            </section>
          )}
          {weeklyChangesOpen && game.reports.length > 0 && (
            <section className="weeklyChanges" aria-label="Latest weekly events">
              <button
                className="quickClose"
                aria-label="Dismiss weekly events"
                onClick={() => setWeeklyChangesOpen(false)}
              >
                ×
              </button>
              <strong>Week {game.absoluteWeek} · Economy update</strong>
              {game.reports
                .at(-1)!
                .events.slice(0, 3)
                .map((event, i) => (
                  <p key={i}>{event}</p>
                ))}
              <button
                onClick={() => {
                  setReportsOpen(true);
                  setWeeklyChangesOpen(false);
                }}
              >
                Full report →
              </button>
            </section>
          )}
          <div className="mapFoot commandMapHint">Chọn cơ sở để xem dữ liệu và thao tác</div>
        </main>
        <aside
          ref={panelRef}
          id="selection-panel"
          className="panel"
          hidden={!panelOpen}
          aria-label="Selection details"
          data-selection={`${context.kind}:${context.entity.id}`}
        >
          <button
            className="mobilePanelClose"
            aria-label="Close details"
            onClick={() => setPanelOpen(false)}
          >
            ×
          </button>
          {department !== 'insight' && (
            <DepartmentPanel
              game={game}
              city={city}
              selection={selection}
              department={department}
              onPlan={planFor}
              onSelect={choose}
              onReports={() => setReportsOpen(true)}
              onGuide={() => setGuideOpen(true)}
              onExport={exportGame}
              onReset={resetGame}
              onStartNational={startEightCities}
              onInspect={() => setDepartment('insight')}
            />
          )}
          <div className="detailPanelContent" hidden={department !== 'insight'}>
            <small>{context.kind.toUpperCase()} INTELLIGENCE</small>
            <h1>{context.entity.name}</h1>
            {context.kind === 'city' && (
              <>
                <p className="muted">Regional economic overview</p>
                <hr />
                <div className="stat">
                  POPULATION <b>{number(context.entity.population)}</b>
                </div>
                <div className="stat">
                  PURCHASING POWER <b>{context.entity.power.toFixed(2)}×</b>
                </div>
                <div className="stat">
                  TRANSPORT LINKS <b>{context.entity.links.length}</b>
                </div>
                <hr />
                <h3>CONSUMER SEGMENTS</h3>
                {Object.entries(context.entity.segments).map(([name, share]) => (
                  <div className="segment" key={name}>
                    <div>
                      {name.toUpperCase()} <b>{Math.round(share * 100)}%</b>
                    </div>
                    <div className="bar">
                      <i style={{ width: share * 100 + '%' }} />
                    </div>
                  </div>
                ))}
                <hr />
                <h3>TRANSPORT CONNECTIONS</h3>
                {context.entity.links.length ? (
                  context.entity.links.map(cityButton)
                ) : (
                  <p className="muted">No direct connections</p>
                )}
                <h3>BUSINESS PRESENCE</h3>
                {game.facilities
                  .filter((f) => f.cityId === city.id)
                  .map((f) => (
                    <div className="facility" key={f.id}>
                      <button
                        className="entityLink"
                        onClick={() => choose({ kind: 'facility', id: f.id })}
                      >
                        {f.name}
                      </button>
                      <small>{f.kind.toUpperCase()}</small>
                      {ownerButton(f.companyId)}
                    </div>
                  ))}
                <h3>PLAYER PLACEMENT CHECK</h3>
                <p className="muted">
                  One facility per kind and company in each city; one HQ per company. Use Next Week
                  to review construction orders.
                </p>
                {FACILITY_KINDS.map((kind) => (
                  <div className="stat" key={kind}>
                    {kind.toUpperCase()}{' '}
                    <span>
                      {placementError(game, { companyId: player.id, cityId: city.id, kind })
                        ? 'Already established'
                        : 'Site available'}
                    </span>
                  </div>
                ))}
              </>
            )}
            {context.kind === 'facility' && (
              <>
                <p className="muted">
                  {context.entity.kind.toUpperCase()} ·{' '}
                  {context.entity.companyId === player.id ? 'Player owned' : 'Competitor owned'}
                </p>
                <hr />
                <h3>OWNER</h3>
                {ownerButton(context.entity.companyId)}
                <h3>LOCATION</h3>
                {cityButton(context.entity.cityId)}
                <h3>TRANSPORT CONNECTIONS</h3>
                {city.links.map(cityButton)}
                <div className="notice">
                  Select the company to inspect its products. Production requires workforce,
                  component kits and cash; every shipment has an arrival week.
                </div>
              </>
            )}
            {context.kind === 'world' && (
              <>
                <p className="muted">
                  {context.entity.kind.toUpperCase()} · {context.entity.status.toUpperCase()} ·
                  public infrastructure
                </p>
                <hr />
                <div className="stat">
                  LEVEL <b>{context.entity.stats.level}</b>
                </div>
                <div className="stat">
                  CONDITION <b>{context.entity.stats.condition}%</b>
                </div>
                <div className="stat">
                  WORKFORCE <b>{number(context.entity.stats.workforce)}</b>
                </div>
                <div className="stat">
                  CAPACITY <b>{number(context.entity.stats.capacity)}</b>
                </div>
                <div className="stat">
                  WEEKLY UPKEEP <b>{number(context.entity.stats.weeklyUpkeep)} CR</b>
                </div>
                <h3>LOCAL EFFECTS</h3>
                <div className="stat">
                  DEMAND <b>+{(context.entity.stats.demandBoost * 100).toFixed(1)}%</b>
                </div>
                <div className="stat">
                  LOGISTICS <b>+{(context.entity.stats.logisticsBoost * 100).toFixed(1)}%</b>
                </div>
                <div className="stat">
                  PRODUCTIVITY <b>+{(context.entity.stats.productivityBoost * 100).toFixed(1)}%</b>
                </div>
                <div className="stat">
                  RETAIL <b>+{(context.entity.stats.retailBoost * 100).toFixed(1)}%</b>
                </div>
                <h3>LOCATION</h3>
                {cityButton(context.entity.cityId)}
              </>
            )}
            {context.kind === 'facility' &&
              (() => {
                const stats = facilityOperationalStats(context.entity, city);
                return (
                  <>
                    <h3>OPERATING STATS</h3>
                    <div className="stat">
                      LEVEL <b>{stats.level}</b>
                    </div>
                    <div className="stat">
                      CONDITION <b>{stats.condition}%</b>
                    </div>
                    <div className="stat">
                      WORKFORCE <b>{number(stats.workforce)}</b>
                    </div>
                    <div className="stat">
                      CAPACITY <b>{number(stats.capacity)}</b>
                    </div>
                    <div className="stat">
                      EFFICIENCY <b>{stats.efficiency}%</b>
                    </div>
                    <div className="stat">
                      WEEKLY COST <b>{number(stats.weeklyCost)} CR</b>
                    </div>
                  </>
                );
              })()}
            {context.kind === 'city' &&
              (() => {
                const stats = cityOperationalStats(context.entity);
                return (
                  <>
                    <h3>CITY OPERATING PROFILE</h3>
                    <div className="stat">
                      SECTOR <b>{stats.sector}</b>
                    </div>
                    <div className="stat">
                      ANNUAL GROWTH <b>{(stats.growthRate * 100).toFixed(1)}%</b>
                    </div>
                    <div className="stat">
                      INFRASTRUCTURE <b>{stats.infrastructure}/100</b>
                    </div>
                    <div className="stat">
                      TALENT <b>{stats.talentIndex}/100</b>
                    </div>
                    <div className="stat">
                      WAGE / RENT{' '}
                      <b>
                        {stats.wageIndex.toFixed(2)}× / {stats.rentIndex.toFixed(2)}×
                      </b>
                    </div>
                    <div className="stat">
                      TAX RATE <b>{(stats.taxRate * 100).toFixed(0)}%</b>
                    </div>
                    <h3>PUBLIC ENTITIES · {stats.entityCount}</h3>
                    {cityEntities(context.entity.id).map((entity) => (
                      <button
                        className="commandListCard"
                        key={entity.id}
                        onClick={() => choose({ kind: 'world', id: entity.id })}
                      >
                        <strong>{entity.name}</strong>
                        <small>
                          {entity.kind.toUpperCase()} · L{entity.stats.level} ·{' '}
                          {entity.stats.condition}%
                        </small>
                      </button>
                    ))}
                  </>
                );
              })()}
            {context.kind === 'company' && (
              <>
                <p className="muted">
                  {context.entity.control === 'human' ? 'Player company' : 'AI competitor'} ·{' '}
                  {context.entity.id}
                </p>
                <hr />
                <div className="stat">
                  CASH <b>{number(context.entity.cash)}</b>
                </div>
                <div className="stat">
                  DEBT <b>{number(context.entity.debt)}</b>
                </div>
                <h3>PRODUCT PORTFOLIO</h3>
                {game.products
                  .filter((p) => p.companyId === context.entity.id)
                  .map((p) => (
                    <div className="productCard" key={p.id}>
                      <strong>{p.name}</strong>
                      <p>
                        R{p.revision} · {p.lifecycle} · {p.segment}
                      </p>
                      <p>
                        Price {p.price} · unit cost {p.cost} · stock {p.inventory}
                      </p>
                      <p>
                        Quality {p.quality} · Design {p.attributes.design} · Performance{' '}
                        {p.attributes.performance} · Durability {p.attributes.durability}
                      </p>
                    </div>
                  ))}
                <h3>FACILITIES</h3>
                {game.facilities
                  .filter((f) => f.companyId === context.entity.id)
                  .map((f) => (
                    <div className="facility" key={f.id}>
                      <button
                        className="entityLink"
                        onClick={() => choose({ kind: 'facility', id: f.id })}
                      >
                        {f.name}
                      </button>
                      {cityButton(f.cityId)}
                    </div>
                  ))}
                {context.entity.strategy && <p>Strategy: {context.entity.strategy}</p>}
                <h3>COMPANY REGISTER</h3>
                {game.companies.map((c) => (
                  <div key={c.id}>{ownerButton(c.id)}</div>
                ))}
              </>
            )}
            {game.reports.at(-1)?.demand && (
              <details className="demandReport">
                <summary>Market demand · {city.name}</summary>
                {game.reports
                  .at(-1)!
                  .demand!.filter((d) => d.cityId === city.id)
                  .map((d) => (
                    <p className="muted" key={d.segment}>
                      {d.segment}: {d.potential} potential ·{' '}
                      {d.allocations.reduce((n, a) => n + a.desired, 0)} preferred units ·{' '}
                      {d.outside} no purchase
                    </p>
                  ))}
                <p className="muted">
                  Preferences are potential orders; realized sales require local stock.
                </p>
              </details>
            )}
            <h3>LOCAL INVENTORY · {city.name}</h3>
            {game.products
              .filter((p) => p.companyId === player.id || localStock(game, p.id, city.id) > 0)
              .map((p) => (
                <p className="muted" key={p.id}>
                  {p.name}: {localStock(game, p.id, city.id)} units
                </p>
              ))}
            {game.reports.at(-1)?.financials && (
              <details className="financialReport" open>
                <summary>Financial results · last week</summary>
                {game.reports
                  .at(-1)!
                  .financials!.filter((f) => f.companyId === player.id)
                  .map((f) => (
                    <div key={f.companyId}>
                      <p>
                        Revenue {number(f.revenue)} · COGS {number(f.cogs)}
                      </p>
                      <p>
                        Expenses {number(f.expenses)} · Profit {number(f.profit)}
                      </p>
                      <p>
                        Cash change {number(f.cashChange)} · Capex {number(f.capex)}
                      </p>
                      <p>
                        Payables {number(f.payables)} · Net worth {number(f.netWorth)}
                      </p>
                    </div>
                  ))}
              </details>
            )}
            <details className="staffReport">
              <summary>People and brand</summary>
              <p>
                Production {game.staff[player.id].production} · Sales {game.staff[player.id].sales}{' '}
                · Research {game.staff[player.id].research}
              </p>
              {(['value', 'mainstream', 'premium'] as const).map((segment) => (
                <p key={segment}>
                  {segment} awareness in {city.name}:{' '}
                  {Math.round((game.brand[brandKey(player.id, city.id, segment)] || 0) * 100)}%
                </p>
              ))}
            </details>
            <details className="macroReport">
              <summary>Economy and events</summary>
              <p>
                Purchasing-power index {game.macro.index.toFixed(3)} · Seasonal demand{' '}
                {game.macro.seasonal.toFixed(3)}×
              </p>
              {game.macro.events.slice(-2).map((e) => (
                <p key={e.id}>
                  Week {e.week}: {e.title} · {(e.delta * 100).toFixed(1)} index points
                </p>
              ))}
            </details>
            <h3>PROJECT QUEUE</h3>
            {game.projects
              .filter((p) => p.companyId === player.id && p.status === 'active')
              .map((p) => (
                <p className="queueItem" key={p.id}>
                  {p.kind} · {p.remaining} weeks left · ready W{p.dueWeek}
                </p>
              ))}
            {game.reports.length > 0 && (
              <details>
                <summary>Last weekly report</summary>
                {game.reports.at(-1)!.events.map((e, i) => (
                  <p className="muted" key={i}>
                    {e}
                  </p>
                ))}
                <p>Cash change: {game.reports.at(-1)!.cashDelta[player.id]}</p>
              </details>
            )}
            <div className="notice">
              Sales use local stock; shipments require owned facilities at both ends. Production
              requires a factory and a persistent target.
            </div>
            <details className="campaignReport" open>
              <summary>
                {game.campaign.mode === 'national'
                  ? '104-week national campaign'
                  : 'Foundation sandbox'}
              </summary>
              {game.campaign.mode === 'national' && (
                <>
                  <p>
                    Completed {game.absoluteWeek - game.campaign.startWeek} / 104 weeks ·{' '}
                    {game.campaign.status}
                  </p>
                  <p>Multi-axis score: {campaignScore.total}/100</p>
                  {campaignScore.axes.map((a) => (
                    <p key={a.name}>
                      {a.name}: {a.value.toFixed(2)} / {a.target} {a.met ? '✓' : ''}
                    </p>
                  ))}
                </>
              )}
              <button className="entityLink" onClick={startEightCities}>
                Start national campaign
              </button>
            </details>
            <button className="entityLink" onClick={exportGame}>
              Export save
            </button>
            <button className="entityLink" disabled={!!recovery} onClick={exportReplay}>
              Export replay from week {JSON.parse(game.replay.origin).absoluteWeek}
            </button>
            <label className="importLabel">
              Import save or replay
              <input
                aria-label="Import save or replay"
                type="file"
                accept=".json,application/json"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importGame(file);
                  e.target.value = '';
                }}
              />
            </label>
            {importing && <p role="status">Checking saved game and replay…</p>}
            {importError && (
              <p role="alert">Import failed: {importError}. Current progress is preserved.</p>
            )}
          </div>
        </aside>
      </div>
      {(recovery || storageError) && (
        <div className="saveWarning" role="alert">
          <strong>
            {recovery
              ? 'Saved game could not be loaded. Original data is preserved; gameplay is paused.'
              : storageError}
          </strong>
          <button onClick={exportGame}>{recovery ? 'Export original save' : 'Export save'}</button>
          <span>Use Reset only when you are ready to discard the saved game.</span>
        </div>
      )}
      <button
        className="mobilePlanFab"
        onClick={() => setPlannerOpen(true)}
        disabled={!!recovery || game.campaign.status !== 'active'}
        aria-label="Open weekly planner"
      >
        Plan week →
      </button>
      <nav className="mobileNav" aria-label="Mobile game navigation">
        <button
          onClick={() => {
            setSelection({ kind: 'city', id: city.id });
            setPanelOpen(false);
          }}
        >
          ⌖ <span>Map</span>
        </button>
        <button onClick={() => choose({ kind: 'company', id: player.id })}>
          ▦ <span>Company</span>
        </button>
        <button onClick={() => setReportsOpen(true)}>
          ≋ <span>Reports</span>
        </button>
        <button onClick={() => setPanelOpen((v) => !v)}>
          ☷ <span>Details</span>
        </button>
      </nav>
      <footer className="footer commandFooter">
        <div className="weeklyPlanStatus">
          <strong>
            Kế hoạch tuần {String(game.week).padStart(2, '0')} ·{' '}
            {game.projects.filter((p) => p.companyId === player.id && p.status === 'active').length}{' '}
            dự án đang chạy
          </strong>
          <span>Thay đổi có hiệu lực sau khi xác nhận tuần</span>
        </div>
        <button
          className="roundAdvance"
          title="Mở kế hoạch tuần"
          aria-label="Mở kế hoạch tuần"
          onClick={() => planFor('projects')}
          disabled={!!recovery || game.campaign.status !== 'active'}
        >
          ↓
        </button>
        <button
          className="next commandNext"
          onClick={() => planFor('projects')}
          disabled={!!recovery || game.campaign.status !== 'active'}
        >
          Xem kế hoạch tuần <span>→</span>
        </button>
      </footer>
      {resultOpen && (
        <CampaignResult game={game} onClose={() => setResultOpen(false)} onExport={exportGame} />
      )}
      {guideOpen && (
        <Guide
          onClose={() => setGuideOpen(false)}
          shortcuts={shortcuts}
          onShortcuts={setShortcuts}
        />
      )}
      {reportsOpen && <ReportsPanel game={game} onClose={() => setReportsOpen(false)} />}
      {plannerOpen && (
        <WeeklyPlanner
          game={game}
          cityId={city.id}
          initialSection={plannerStart}
          onClose={() => setPlannerOpen(false)}
          onCommit={(orders) => {
            if (committedWeek.current === orders.expectedWeek)
              throw new Error('Week already committed');
            const next = advanceWeek(game, orders);
            committedWeek.current = orders.expectedWeek;
            setGame(next);
            setPlannerOpen(false);
            setWeeklyChangesOpen(true);
          }}
        />
      )}
    </div>
  );
}
