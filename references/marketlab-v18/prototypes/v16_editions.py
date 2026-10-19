"""V16 independently authored edition scenarios layered over MarketLab V15 Bikes.
NOT Marketplace source, hidden algorithms, or a reproduction of official scoring.
Edition settings determine simulation length, seed capital, decision permissions,
capital policy and the custom multi-KPI ending, using ONE V10 settlement per quarter.
"""
from __future__ import annotations
import copy, math
from dataclasses import dataclass
from v15_bikes import GameController as BikesController, GameError, validate_draft

@dataclass(frozen=True)
class Edition:
    key: str
    title: str
    rounds: int
    seed_bonus: float
    earliest_equity: int
    earliest_debt: int
    quality_quarter: int
    rd_quarter: int
    emphasis: str
    weights: tuple[float,float,float]

EDITIONS = {
  'venture':Edition('venture','Venture Strategy',6,0,5,3,5,3,'startup runway / capital',(.28,.52,.20)),
  'strategic':Edition('strategic','Strategic Management',6,40000,5,3,5,3,'market positioning / strategy',(.55,.25,.20)),
  'business':Edition('business','Business Management',8,100000,5,2,4,3,'cross-functional profit',(.30,.50,.20)),
  'corporate':Edition('corporate','Strategic Corporate Management',8,180000,5,2,4,3,'enterprise scorecard / resilience',(.25,.35,.40)),
}

def edition_rules(edition:str):
    try:return EDITIONS[edition]
    except KeyError:raise GameError('Unknown V16 edition')

class GameController(BikesController):
    def __init__(self,edition='venture'):
        self.edition = edition_rules(edition).key
        super().__init__()

    @property
    def profile(self)->Edition:return edition_rules(self.edition)

    def reset(self):
        super().reset()
        self.config['edition'] = self.edition
        self.config['v16_objective'] = 'balanced'
        self.config['v16_submission_quarters'] = {}
        # Seed-capital uplift is equity injection, not operating revenue.
        for f in self.state.finances.values():
            f.cash += self.profile.seed_bonus
            f.paid_in_equity += self.profile.seed_bonus

    def setup(self,c):
        if type(c) is not dict:raise GameError('Invalid edition setup')
        if c.get('edition',self.edition)!=self.edition:
            raise GameError('Cannot change edition in this save slot; launch a new edition')
        objective=c.get('objective','balanced')
        if objective not in ('balanced','growth','profit','resilience'):
            raise GameError('Unknown strategic objective')
        out=super().setup(c)
        self.config['edition']=self.edition
        self.config['v16_objective']=objective
        return self.snapshot()

    def effective_weights(self):
        weights=list(self.profile.weights)
        objective=self.config.get('v16_objective','balanced')
        target={'growth':0,'profit':1,'resilience':2}.get(objective)
        if target is not None:
            for i in range(3):weights[i]+=0.10 if i==target else -0.05
        return tuple(weights)

    def _check_edition(self,d):
        q=self.state.world.quarter; p=self.profile
        if q>p.rounds:raise GameError('Edition already complete')
        d=validate_draft(d)
        if q!=p.earliest_equity and d['finance_equity']>0:
            raise GameError(f'Equity funding unlocked in Q{p.earliest_equity} for {p.title}')
        if q<p.earliest_debt and d['finance_borrow']>0:
            raise GameError(f'Borrowing unlocked in Q{p.earliest_debt} for {p.title}')
        if q<p.rd_quarter and d['rd_feature']!='none':
            raise GameError(f'R&D unlocked in Q{p.rd_quarter}')
        if q<p.quality_quarter and any(d[k] for k in (
            'quality_variance_north','quality_variance_south',
            'quality_source_north','quality_source_south',
            'quality_improve_north','quality_improve_south')):
            raise GameError(f'Quality studies unlock in Q{p.quality_quarter}')
        if q<p.quality_quarter:
            for region in ('North','South'):
                key=f'quality_inspection_{region.lower()}'
                if d[key]!=(self.state.advanced.quality['PLAYER',region].inspection if self.state.advanced else 0):
                    raise GameError(f'Inspection investment unlocks in Q{p.quality_quarter}')
        if self.edition=='venture' and q<4 and d['license_project']!='none':
            raise GameError('Venture licensing unlocks after initial market entry')
        # Enforce per-round seed financing limits for this synthetic edition design.
        debt_caps={'venture':180000,'strategic':120000,'business':220000,'corporate':250000}
        if d['finance_equity']>150000 or d['finance_borrow']>debt_caps[self.edition]:
            raise GameError('Funding request exceeds edition policy cap')
        return d

    def snapshot(self):
        s=super().snapshot();p=self.profile
        completed=self.state.world.quarter>p.rounds
        s['max_rounds']=p.rounds
        s['finished']=completed
        s['v16']={'edition':self.edition,'title':p.title,'rounds':p.rounds,
          'emphasis':p.emphasis,'objective':self.config.get('v16_objective','balanced'),
          'seed_bonus':p.seed_bonus,'score_weights':dict(zip(('market','profit','resilience'),self.effective_weights())),
          'permissions':{'equity':s['quarter']==p.earliest_equity and not completed,
                         'borrow':s['quarter']>=p.earliest_debt and not completed,
                         'quality':s['quarter']>=p.quality_quarter and not completed,
                         'rd':s['quarter']>=p.rd_quarter and not completed}}
        s['unlocks']['rd']=s['quarter']>=p.rd_quarter
        s['unlocks']['quality']=s['quarter']>=p.quality_quarter
        if completed:
            s['draft']=None
            s['endgame']=self.endgame()
        return s

    def preview(self,draft):
        self._check_edition(draft)
        return super().preview(draft)

    def submit(self,quarter,submission_id,draft):
        # Replay remains idempotent across restart without rechecking current Q.
        if submission_id in self.commit_ids:
            if quarter != self.config.get('v16_submission_quarters',{}).get(submission_id):
                raise GameError('Repeated submission ID with wrong quarter')
            self._check_saved_replay(submission_id,draft)
            return copy.deepcopy(self.commit_ids[submission_id][1])
        if quarter!=self.state.world.quarter or quarter>self.profile.rounds:
            raise GameError('Quarter is stale or edition is finished')
        clean=self._check_edition(draft)
        out=super().submit(quarter,submission_id,clean)
        self.config.setdefault('v16_submission_quarters',{})[submission_id]=quarter
        row=self.history[-1]
        row['v16']={'edition':self.edition,'phase':self._phase(quarter),
            'criterion':'Original multi-KPI ranking; not Marketplace score formula'}
        out['result']=copy.deepcopy(row)
        if quarter==self.profile.rounds:
            out['endgame']=self.endgame()
        fp,_=self.commit_ids[submission_id]
        self.commit_ids[submission_id]=(fp,copy.deepcopy(out))
        return out

    def _check_saved_replay(self,submission_id,draft):
        # V15 persisted a separate input hash for Bikes. Keep that invariant.
        import hashlib,json
        cleaned=validate_draft(draft)
        digest=hashlib.sha256(json.dumps({'quarter':self._quarter_of_id(submission_id),
            'draft':cleaned},sort_keys=True,ensure_ascii=False,allow_nan=False).encode()).hexdigest()
        if self.bike_commit_hash.get(submission_id)!=digest:
            raise GameError('Repeated submission ID with different decision payload')

    def _quarter_of_id(self,sid):
        return self.config.get('v16_submission_quarters',{}).get(sid,-1)

    def _phase(self,q):
        if q<=2:return 'foundation'
        if q<=4:return 'launch-and-optimize'
        return 'expansion-and-review'

    def endgame(self):
        if len(self.history)<self.profile.rounds:return None
        firms=sorted(self.state.finances)
        units={f:sum(row.get('all_firm_sales',{}).get(f,0) for row in self.history) for f in firms}
        earnings={f:self.state.finances[f].retained_earnings for f in firms}
        resilience={f:max(0.,min(1.,(self.state.finances[f].paid_in_equity+
            self.state.finances[f].retained_earnings)/max(1.,self.state.finances[f].cash+self.state.finances[f].equipment_net))) for f in firms}
        def scale(v):
            lo=min(v.values());hi=max(v.values())
            return {f: (v[f]-lo)/(hi-lo) if hi>lo else .5 for f in firms}
        sales_s=scale(units); profit_s=scale(earnings)
        wm,wp,wr=self.effective_weights()
        points={f:round(wm*sales_s[f]+wp*profit_s[f]+wr*resilience[f],6) for f in firms}
        ranking=sorted(firms,key=lambda f:(-points[f],f))
        rank=ranking.index('PLAYER')+1
        return {'rank':rank,'won':rank==1,'rankings':[{'firm':f,'units_sold':units[f],
                   'score':points[f],'retained_earnings':round(earnings[f],2)} for f in ranking],
                'total_sales':units['PLAYER'],'average_score':round(sum(r['score'] for r in self.history)/len(self.history),6),
                'company_name':self.config['company_name'],
                'criterion':f'V16 synthetic edition score — {self.profile.title}: market {wm:.0%}, profit {wp:.0%}, resilience {wr:.0%}',
                'edition':self.edition,'total_rounds':self.profile.rounds}
