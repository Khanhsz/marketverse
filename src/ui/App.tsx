import { useState,useEffect } from 'react';
import { CountryMap } from './CountryMap';
import { advanceWeek,createInitialGame,deserializeGame,SAVE_KEY,serializeGame } from '../engine/game';
import type {GameState} from '../engine/game';
const number=(v:number)=>new Intl.NumberFormat('en-US').format(v);
export function App(){
 const [game,setGame]=useState<GameState>(()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(raw)return deserializeGame(raw);}catch{}return createInitialGame();});
 const [selected,setSelected]=useState('central');
 const [tab,setTab]=useState<'map'|'company'>('map');
 useEffect(()=>{localStorage.setItem(SAVE_KEY,serializeGame(game));},[game]);
 const city=game.cities.find(x=>x.id===selected)||game.cities[0],player=game.companies.find(x=>x.id===game.playerId)!;
 const facilities=game.facilities.filter(f=>f.cityId===city.id);
 return <div className="app">
   <header className="header"><div className="logo">◆ MARKETVERSE <span>COUNTRY STRATEGY</span></div>
    <div className="metrics"><div><small>PERIOD</small><b>Y{game.year.toString().padStart(2,'0')} · W{game.week.toString().padStart(2,'0')}</b></div><div><small>CASH</small><b>{number(player.cash)}</b></div><div><small>CITIES</small><b>{game.cities.length}</b></div></div>
   </header>
   <div className="workspace"><nav className="rail"><button aria-label="Map" aria-pressed={tab==='map'} onClick={()=>setTab('map')}>⌖</button><button aria-label="Company" aria-pressed={tab==='company'} onClick={()=>setTab('company')}>▦</button></nav>
     <main className="mapArea"><div className="overlay">COUNTRY STRATEGY MAP <span> / {tab.toUpperCase()}</span></div><CountryMap cities={game.cities} facilities={game.facilities} selectedCityId={city.id} onSelect={id=>{setSelected(id);setTab('map');}}/>
      {tab==='company'&&<div className="floating"><small>COMPANY REGISTER</small><h2>{player.name}</h2><p>Capital: {number(player.cash)}. Product design, market demand and AI will be added in future sprints.</p></div>}
      <div className="mapFoot">3 CITIES · 3 COMPANIES · NO FOG · MAP-FIRST</div>
     </main>
     <aside className="panel"><small>CITY INTELLIGENCE</small><h1>{city.name}</h1><p className="muted">Regional economic overview</p><hr/><div className="stat">POPULATION <b>{number(city.population)}</b></div><div className="stat">PURCHASING POWER <b>{city.power.toFixed(2)}×</b></div><div className="stat">TRANSPORT LINKS <b>{city.links.length}</b></div><hr/><h3>CONSUMER SEGMENTS</h3>
      {Object.entries(city.segments).map(([name,share])=><div className="segment" key={name}><div>{name.toUpperCase()} <b>{Math.round(share*100)}%</b></div><div className="bar"><i style={{width:(share*100)+'%'}}/></div></div>)}
      <hr/><h3>BUSINESS PRESENCE</h3>{facilities.map(f=><div className="facility" key={f.id}>{f.name} <small>{f.kind}</small></div>)}
      <div className="notice">Sprint 01: finances, demand, and sales are intentionally not simulated.</div>
     </aside>
   </div>
   <footer className="footer"><div>● LOCAL SAVE <span>· Weekly engine active · Business simulation pending</span></div><div className="actions"><button onClick={()=>{if(window.confirm('Reset game?')){localStorage.removeItem(SAVE_KEY);setGame(createInitialGame());setSelected('central');}}}>RESET</button><button className="next" onClick={()=>setGame(old=>advanceWeek(old))}>NEXT WEEK →</button></div></footer>
 </div>;
}
