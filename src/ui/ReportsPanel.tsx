import { useState } from 'react';
import type { GameState } from '../engine/game';
import { aggregateReports, profitBridge, weeklyInsights } from '../engine/analytics';
export function ReportsPanel({game,onClose}:{game:GameState;onClose:()=>void}){
  const [width,setWidth]=useState(1),[offset,setOffset]=useState(0);
  const last=Math.max(1,game.absoluteWeek-1),index=Math.max(0,Math.floor((last-1)/width)-offset),start=index*width+1,end=start+width-1;
  const summary=aggregateReports(game,game.playerId,start,end),history=game.reports.slice(-13),latest=game.reports.at(-1);
  const owned=(id:string)=>game.products.find(p=>p.id===id)?.companyId===game.playerId;
  const rows=latest?.sales?.filter(s=>owned(s.productId))||[];
  const profitPoints=history.map(r=>r.financials?.find(f=>f.companyId===game.playerId)?.profit||0);
  const scale=Math.max(1,...profitPoints.map(Math.abs)),points=profitPoints.map((v,i)=>`${30+i*600/Math.max(1,profitPoints.length-1)},${90-v/scale*65}`).join(' ');
  return <div className="modalShade" onKeyDown={e=>{if(e.key==='Escape')onClose();}}><section className="planner reports" role="dialog" aria-modal="true" aria-labelledby="reports-title"><div className="plannerHead"><h2 id="reports-title">Business reports</h2><button autoFocus onClick={onClose}>Close reports</button></div>
    <div className="formRow"><label>Report period<select aria-label="Report period" value={width} onChange={e=>{setWidth(Number(e.target.value));setOffset(0);}}><option value="1">Week</option><option value="13">Quarter · 13 weeks</option><option value="52">Year · 52 weeks</option></select></label><button disabled={index===0} onClick={()=>setOffset(offset+1)}>Previous period</button><button disabled={offset===0} onClick={()=>setOffset(offset-1)}>Next period</button><span>Weeks {start}–{end} · {summary.covered}/{width} reported · {summary.complete?'Complete':'Partial period'}</span></div>
    <div className="reportTotals"><p>Revenue <b>{summary.revenue.toLocaleString()}</b></p><p>COGS <b>{summary.cogs.toLocaleString()}</b></p><p>Expenses <b>{summary.expenses.toLocaleString()}</b></p><p>Profit <b>{summary.profit.toLocaleString()}</b></p><p>Cash change <b>{summary.cashChange.toLocaleString()}</b></p><p>Units <b>{summary.units}</b></p><p>Realized share <b>{summary.share===null?'No sales':(summary.share*100).toFixed(1)+'%'}</b></p></div>
    <h3>Last week profit bridge</h3><table><caption>Recognized profit components</caption><thead><tr><th scope="col">Component</th><th scope="col">Credits</th></tr></thead><tbody>{profitBridge(latest,game.playerId).map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.value.toLocaleString()}</td></tr>)}</tbody></table>
    <h3>Recent weekly profit</h3><svg viewBox="0 0 660 180" role="img" aria-label="Profit over the last thirteen completed weeks"><line x1="25" x2="635" y1="90" y2="90" stroke="#afc1b7"/><polyline points={points} fill="none" stroke="#265b4d" strokeWidth="3"/>{profitPoints.map((p,i)=><circle key={i} cx={30+i*600/Math.max(1,profitPoints.length-1)} cy={90-p/scale*65} r="4" fill="#265b4d"><title>Week {history[i].week}: {p} credits profit</title></circle>)}</svg>
    <table><caption>Last week product, city and segment fulfillment</caption><thead><tr><th scope="col">Product</th><th scope="col">City</th><th scope="col">Segment</th><th scope="col">Preferred</th><th scope="col">Fulfilled</th><th scope="col">Revenue</th><th scope="col">Segment share</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{game.products.find(p=>p.id===r.productId)?.name}</td><td>{game.cities.find(c=>c.id===r.cityId)?.name}</td><td>{r.segment}</td><td>{r.desired}</td><td>{r.units}</td><td>{r.revenue}</td><td>{((r.units/Math.max(1,(latest?.sales||[]).filter(a=>a.cityId===r.cityId&&a.segment===r.segment).reduce((n,a)=>n+a.units,0)))*100).toFixed(1)}%</td></tr>)}</tbody></table>
    {weeklyInsights(game,game.playerId).map(text=><p key={text}>{text}</p>)}
  </section></div>;
}
