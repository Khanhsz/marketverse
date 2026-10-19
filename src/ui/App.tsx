import { useState, useEffect, useRef } from 'react';
import { WeeklyPlanner } from './WeeklyPlanner';
import { CountryMap } from './CountryMap';
import { advanceWeek, createInitialGame, deserializeGame, SAVE_KEY, serializeGame } from '../engine/game';
import { FACILITY_KINDS, placementError, resolveSelection } from '../engine/entities';
import type { Selection } from '../engine/entities';
const number = (v: number) => new Intl.NumberFormat('en-US').format(v);
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try { return { game: deserializeGame(raw), recovery: '' }; }
      catch { return { game: createInitialGame(), recovery: raw }; }
    }
  } catch { return { game: createInitialGame(), recovery: 'Storage is unavailable' }; }
  return { game: createInitialGame(), recovery: '' };
}
export function App() {
  const [plannerOpen,setPlannerOpen]=useState(false);
  const committedWeek=useRef(0);
  const [loaded] = useState(loadGame);
  const [game, setGame] = useState(loaded.game);
  const [recovery, setRecovery] = useState(loaded.recovery);
  const [storageError, setStorageError] = useState('');
  const [selection, setSelection] = useState<Selection>({ kind: 'city', id: 'central' });
  useEffect(() => {
    if (recovery) return;
    try { localStorage.setItem(SAVE_KEY, serializeGame(game)); setStorageError(''); }
    catch { setStorageError('Local save failed. Export your game before closing this page.'); }
  }, [game, recovery]);
  const context = resolveSelection(game, selection) || resolveSelection(game, { kind: 'city', id: game.cities[0].id })!;
  const cityId = context.kind === 'city' ? context.entity.id : context.kind === 'facility' ? context.entity.cityId : game.facilities.find(f => f.companyId === context.entity.id)?.cityId;
  const city = game.cities.find(c => c.id === cityId) || game.cities[0];
  const player = game.companies.find(c => c.id === game.playerId)!;
  const choose = (value: Selection) => { if (resolveSelection(game, value)) setSelection(value); };
  const cityButton = (id: string) => <button className="entityLink" key={id} onClick={() => choose({kind:'city',id})}>{game.cities.find(c=>c.id===id)?.name}</button>;
  const ownerButton = (id: string) => <button className="entityLink" onClick={() => choose({kind:'company',id})}>{game.companies.find(c=>c.id===id)?.name}</button>;
  const exportGame = () => {
    const url=URL.createObjectURL(new Blob([recovery || serializeGame(game)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=recovery?'marketverse-recovery.json':'marketverse-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div className="app">
    <header className="header"><div className="logo">◆ MARKETVERSE <span>COUNTRY STRATEGY</span></div>
      <div className="metrics"><div><small>PERIOD</small><b>Y{game.year.toString().padStart(2,'0')} · W{game.week.toString().padStart(2,'0')}</b></div><div><small>CASH</small><b>{number(player.cash)}</b></div><div><small>CITIES</small><b>{game.cities.length}</b></div></div>
    </header>
    <div className="workspace"><nav className="rail"><button aria-label="Map" aria-pressed={context.kind==='city'} onClick={()=>choose({kind:'city',id:city.id})}>⌖</button><button aria-label="Company" aria-pressed={context.kind==='company'} onClick={()=>choose({kind:'company',id:player.id})}>▦</button></nav>
      <main className="mapArea"><div className="overlay">COUNTRY STRATEGY MAP</div>
        <CountryMap cities={game.cities} facilities={game.facilities} companies={game.companies} selectedCityId={city.id} selection={selection} onSelect={choose}/>
        <div className="mapFoot">{game.cities.length} CITIES · {game.companies.length} COMPANIES · NO FOG · MAP-FIRST</div>
      </main>
      <aside className="panel" aria-label="Selection details" data-selection={`${context.kind}:${context.entity.id}`}>
        <small>{context.kind.toUpperCase()} INTELLIGENCE</small><h1>{context.entity.name}</h1>
        {context.kind === 'city' && <>
          <p className="muted">Regional economic overview</p><hr/>
          <div className="stat">POPULATION <b>{number(context.entity.population)}</b></div><div className="stat">PURCHASING POWER <b>{context.entity.power.toFixed(2)}×</b></div><div className="stat">TRANSPORT LINKS <b>{context.entity.links.length}</b></div>
          <hr/><h3>CONSUMER SEGMENTS</h3>{Object.entries(context.entity.segments).map(([name,share])=><div className="segment" key={name}><div>{name.toUpperCase()} <b>{Math.round(share*100)}%</b></div><div className="bar"><i style={{width:(share*100)+'%'}}/></div></div>)}
          <hr/><h3>TRANSPORT CONNECTIONS</h3>{context.entity.links.length ? context.entity.links.map(cityButton) : <p className="muted">No direct connections</p>}
          <h3>BUSINESS PRESENCE</h3>{game.facilities.filter(f=>f.cityId===city.id).map(f=><div className="facility" key={f.id}><button className="entityLink" onClick={()=>choose({kind:'facility',id:f.id})}>{f.name}</button><small>{f.kind.toUpperCase()}</small>{ownerButton(f.companyId)}</div>)}
          <h3>PLAYER PLACEMENT CHECK</h3><p className="muted">One facility per kind and company in each city; one HQ per company. Use Next Week to review construction orders.</p>
          {FACILITY_KINDS.map(kind=><div className="stat" key={kind}>{kind.toUpperCase()} <span>{placementError(game,{companyId:player.id,cityId:city.id,kind}) ? 'Already established' : 'Site available'}</span></div>)}
        </>}
        {context.kind === 'facility' && <>
          <p className="muted">{context.entity.kind.toUpperCase()} · {context.entity.companyId===player.id?'Player owned':'Competitor owned'}</p><hr/>
          <h3>OWNER</h3>{ownerButton(context.entity.companyId)}<h3>LOCATION</h3>{cityButton(context.entity.cityId)}
          <h3>TRANSPORT CONNECTIONS</h3>{city.links.map(cityButton)}
          <div className="notice">Existing asset. Capacity, localized inventory and operating costs arrive in subsequent simulation sprints.</div>
        </>}
        {context.kind === 'company' && <>
          <p className="muted">{context.entity.control==='human'?'Player company':'AI competitor'} · {context.entity.id}</p><hr/>
          <div className="stat">CASH <b>{number(context.entity.cash)}</b></div><div className="stat">DEBT <b>{number(context.entity.debt)}</b></div>
          <h3>FACILITIES</h3>{game.facilities.filter(f=>f.companyId===context.entity.id).map(f=><div className="facility" key={f.id}><button className="entityLink" onClick={()=>choose({kind:'facility',id:f.id})}>{f.name}</button>{cityButton(f.cityId)}</div>)}
          <h3>COMPANY REGISTER</h3>{game.companies.map(c=><div key={c.id}>{ownerButton(c.id)}</div>)}
        </>}
        {game.reports.at(-1)?.demand&&<details className="demandReport" open><summary>Market demand · {city.name}</summary>{game.reports.at(-1)!.demand!.filter(d=>d.cityId===city.id).map(d=><p className="muted" key={d.segment}>{d.segment}: {d.potential} potential · {d.allocations.reduce((n,a)=>n+a.desired,0)} preferred units · {d.outside} no purchase</p>)}<p className="muted">Preferences are potential orders; realized sales require local stock.</p></details>}
        <h3>PROJECT QUEUE</h3>{game.projects.filter(p=>p.companyId===player.id&&p.status==='active').map(p=><p className="queueItem" key={p.id}>{p.kind} · {p.remaining} weeks left · ready W{p.dueWeek}</p>)}
        {game.reports.length>0&&<details><summary>Last weekly report</summary>{game.reports.at(-1)!.events.map((e,i)=><p className="muted" key={i}>{e}</p>)}<p>Cash change: {game.reports.at(-1)!.cashDelta[player.id]}</p></details>}
        <div className="notice">Demand, production and sales are introduced by the next simulation sprints.</div>
        <button className="entityLink" onClick={exportGame}>Export save</button>
      </aside>
    </div>
    {(recovery || storageError) && <div className="saveWarning" role="alert"><strong>{recovery?'Saved game could not be loaded. Original data is preserved; gameplay is paused.':storageError}</strong><button onClick={exportGame}>{recovery?'Export original save':'Export save'}</button><span>Use Reset only when you are ready to discard the saved game.</span></div>}
    <footer className="footer"><div>● {recovery || storageError?'SAVE NEEDS ATTENTION':'LOCAL SAVE'} <span>· Weekly engine active · Business simulation pending</span></div><div className="actions"><button onClick={()=>{if(window.confirm('Reset game? This discards the existing save.')){setGame(createInitialGame());setSelection({kind:'city',id:'central'});setRecovery('');committedWeek.current=0;}}}>RESET</button><button className="next" disabled={!!recovery} onClick={()=>setPlannerOpen(true)}>NEXT WEEK →</button></div></footer>
    {plannerOpen&&<WeeklyPlanner game={game} cityId={city.id} onClose={()=>setPlannerOpen(false)} onCommit={orders=>{if(committedWeek.current===orders.expectedWeek)throw new Error('Week already committed');const next=advanceWeek(game,orders);committedWeek.current=orders.expectedWeek;setGame(next);setPlannerOpen(false);}}/>}
  </div>;
}
