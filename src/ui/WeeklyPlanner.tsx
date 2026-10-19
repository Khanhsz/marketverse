import { useState } from 'react';
import type { GameState, Facility } from '../engine/game';
import { applyOrders, quoteProject } from '../engine/orders';
import type { ProjectRequest, TurnOrders } from '../engine/orders';
import { FACILITY_KINDS } from '../engine/entities';
import { BUILD_RULES, RESEARCH_RULE } from '../data/rules';
type Props = { game: GameState; cityId: string; onCommit: (orders: TurnOrders) => void; onClose: () => void };
export function WeeklyPlanner({game,cityId,onCommit,onClose}:Props) {
  const [policy,setPolicy]=useState(()=>structuredClone(game.policies[game.playerId]));
  const [projects,setProjects]=useState<ProjectRequest[]>([]);
  const [destination,setDestination]=useState(cityId);
  const [origin,setOrigin]=useState(cityId);
  const [kind,setKind]=useState<Facility['kind']>('store');
  const owned=game.products.filter(p=>p.companyId===game.playerId);
  const [productId,setProductId]=useState(owned[0]?.id || '');
  const [quantity,setQuantity]=useState(10);
  const [borrow,setBorrow]=useState(0),[repay,setRepay]=useState(0);
  const [error,setError]=useState('');
  const orders:TurnOrders={id:`player-${game.absoluteWeek}`,expectedWeek:game.absoluteWeek,policy,projects,financing:{borrow,repay}};
  let reviewError='',cost=0;
  try { const preview=structuredClone(game);applyOrders(preview,game.playerId,orders,[]);cost=game.companies.find(c=>c.id===game.playerId)!.cash-preview.companies.find(c=>c.id===game.playerId)!.cash; }catch(e){reviewError=String(e instanceof Error?e.message:e);}
  const add=(request:ProjectRequest)=>{setError('');setProjects(old=>[...old,request]);};
  const cityOptions=game.cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>);
  return <div className="modalShade" onKeyDown={event=>{if(event.key==='Escape')onClose();}}><section className="planner" role="dialog" aria-modal="true" aria-labelledby="planner-title">
    <div className="plannerHead"><h2 id="planner-title">Review week {game.absoluteWeek}</h2><button onClick={onClose} autoFocus>Cancel</button></div>
    <p>Policies persist until changed. New projects reserve cash immediately and progress one week per committed turn.</p>
    <h3>Product policies</h3>
    {owned.map(p=><div className="formRow" key={p.id}><strong>{p.name}</strong><label>Price ({p.id})<input type="number" min="1" step="1" value={policy.prices[p.id]??p.price} onChange={e=>setPolicy({...policy,prices:{...policy.prices,[p.id]:Number(e.target.value)}})}/></label><label>Production target ({p.id})<input type="number" min="0" step="1" value={policy.production[p.id]??0} onChange={e=>setPolicy({...policy,production:{...policy.production,[p.id]:Number(e.target.value)}})}/></label></div>)}
    <h3>Financing</h3><div className="formRow"><label>Borrow credits<input type="number" min="0" value={borrow} onChange={e=>setBorrow(Number(e.target.value))}/></label><label>Repay principal<input type="number" min="0" value={repay} onChange={e=>setRepay(Number(e.target.value))}/></label><span>Debt limit 500,000 · Weekly interest 0.1%</span></div><h3>New projects</h3><div className="formRow"><label>Destination<select aria-label="Destination" value={destination} onChange={e=>setDestination(e.target.value)}>{cityOptions}</select></label><label>Facility kind<select aria-label="Facility kind" value={kind} onChange={e=>setKind(e.target.value as Facility['kind'])}>{FACILITY_KINDS.map(k=><option key={k}>{k}</option>)}</select></label><button onClick={()=>add({kind:'construction',cityId:destination,facilityKind:kind})}>Add construction</button><span>{BUILD_RULES[kind].cost.toLocaleString()} credits · {BUILD_RULES[kind].weeks} weeks</span></div>
    <div className="formRow"><label>Product<select aria-label="Product" value={productId} onChange={e=>setProductId(e.target.value)}>{owned.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button onClick={()=>add({kind:'research',productId})}>Add research</button><span>{RESEARCH_RULE.cost.toLocaleString()} credits · {RESEARCH_RULE.weeks} weeks</span></div>
    <div className="formRow"><label>Shipment origin<select aria-label="Shipment origin" value={origin} onChange={e=>setOrigin(e.target.value)}>{cityOptions}</select></label><label>Units<input type="number" min="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label><button onClick={()=>add({kind:'shipment',productId,originId:origin,cityId:destination,quantity})}>Add shipment</button></div>
    <ul className="orderList">{projects.map((p,i)=>{let quote='';try{const q=quoteProject(game,game.playerId,p);quote=`${q.cost.toLocaleString()} credits · ${q.weeks} weeks`;}catch{}return <li key={i}>{p.kind} · {'cityId'in p?game.cities.find(c=>c.id===p.cityId)?.name:p.productId} · {quote}<button aria-label={`Remove order ${i+1}`} onClick={()=>setProjects(projects.filter((_,index)=>index!==i))}>Remove</button></li>;})}</ul>
    <p><strong>Upfront project cost: {cost.toLocaleString()} credits</strong> · Available cash: {game.companies.find(c=>c.id===game.playerId)!.cash.toLocaleString()}</p>
    {(reviewError||error)&&<p role="alert">{reviewError||error}</p>}
    <div className="plannerActions"><button onClick={onClose}>Keep planning</button><button className="primary" disabled={!!reviewError} onClick={()=>{try{onCommit(orders);}catch(e){setError(String(e instanceof Error?e.message:e));}}}>Commit week</button></div>
  </section></div>;
}
