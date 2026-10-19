"""Independent MarketLab V17 scenario packs layered over V16/V10.

Not Marketplace closed-source algorithms, data, financial grading or official edition replicas.
All monetary and fulfillment effects enter the ONE existing V10 quarter settlement.
V17 scenario metrics are diagnostics, not extra unbooked revenue or cash entries.
"""
from __future__ import annotations
import copy
import hashlib
import json
import math
from dataclasses import dataclass, replace
from v16_editions import GameController as V16Controller, GameError
from v15_bikes import validate_draft as bikes_validate

@dataclass(frozen=True)
class Mode:
    key:str
    title:str
    edition:str
    description:str
    mission:str

MODES={
    'ecommerce':Mode('ecommerce','E-Commerce Business Strategy','venture','Digital conversion, paid acquisition and storefront performance','conversion readiness'),
    'international':Mode('international','International Corporate Management','corporate','International demand/FX scenario with optional hedging','foreign-market resilience'),
    'channel':Mode('channel','Supply Chain & Channel Strategy','venture','Supplier contracts, allocation and just-in-time planning','fulfillment efficiency'),
    'conscious':Mode('conscious','Conscious Capitalism','venture','Stakeholder commitments influence costs, employee stability and brand value','stakeholder balance'),
}
FIELDS={'v17_web_quality':.50,'v17_email_budget':0.,'v17_channel_mix':'hybrid',
        'v17_foreign_exposure':.50,'v17_hedge':0.,'v17_procurement':'none',
        'v17_contract_units':200,'v17_lean':.50,'v17_people':.50,
        'v17_environment':.50,'v17_governance':.50}
MODE_FIELDS={
 'ecommerce':('v17_web_quality','v17_email_budget','v17_channel_mix'),
 'international':('v17_foreign_exposure','v17_hedge'),
 'channel':('v17_procurement','v17_contract_units','v17_lean'),
 'conscious':('v17_people','v17_environment','v17_governance'),
}


def mode_rules(mode):
    if mode not in MODES:raise GameError('Unknown V17 mode')
    return MODES[mode]

def validate_v17(d,mode):
    if type(d) is not dict:raise GameError('V17 decisions must be an object')
    base=bikes_validate(d)
    vals={k:d.get(k,v) for k,v in FIELDS.items()}
    allowed={'v17_channel_mix':('direct','retail','hybrid'),
             'v17_procurement':('none','standard','assured')}
    for k,options in allowed.items():
        if type(vals[k]) is not str or vals[k] not in options:raise GameError('Invalid '+k)
    for k in ('v17_web_quality','v17_foreign_exposure','v17_hedge','v17_lean','v17_people','v17_environment','v17_governance'):
        v=vals[k]
        if type(v) not in (int,float) or not math.isfinite(v) or not 0<=v<=1:raise GameError('Invalid '+k+' (expected 0–1)')
        vals[k]=float(v)
    v=vals['v17_email_budget']
    if type(v) not in (int,float) or not math.isfinite(v) or not 0<=v<=16000:raise GameError('Invalid email budget')
    vals['v17_email_budget']=float(v)
    v=vals['v17_contract_units']
    if type(v) is not int or not 0<=v<=600:raise GameError('Invalid contract units (integer 0–600)')
    for k in FIELDS:
        if k not in MODE_FIELDS[mode] and vals[k]!=FIELDS[k]:raise GameError(f'{k} unavailable in {mode}')
    return {**base,**vals}

def signature(quarter,validated):
    return hashlib.sha256(json.dumps({'quarter':quarter,'draft':validated},sort_keys=True,ensure_ascii=False,allow_nan=False).encode()).hexdigest()

class GameController(V16Controller):
    """V17 four active Bikes gameplay modes on the V16 edition lifecycle."""
    def __init__(self,mode='ecommerce'):
        self.mode=mode_rules(mode).key
        self._v17_active=None
        super().__init__(mode_rules(mode).edition)

    def reset(self):
        super().reset()
        self.config['v17_mode']=self.mode
        self.config['v17_commits']={}
        self.config['v17_latest']=copy.deepcopy(FIELDS)
        self.config['v17_indicators']=[]

    def snapshot(self):
        s=super().snapshot();m=mode_rules(self.mode)
        s['v17']={'mode':m.key,'title':m.title,'description':m.description,
            'mission':m.mission,'storyline':'carbon-bikes','active_fields':list(MODE_FIELDS[self.mode]),
            'indicators':copy.deepcopy(self.config.get('v17_indicators',[])),
            'next_fx':round(self.forecast_fx(s['quarter']),4) if self.mode=='international' else None,
            'source':'independent synthetic rules; not Marketplace formulas'}
        if s['draft'] is not None:s['draft'].update(copy.deepcopy(self.config.get('v17_latest',FIELDS)))
        return s

    def setup(self,c):
        if type(c) is not dict:raise GameError('Expected setup object')
        if c.get('v17_mode',self.mode)!=self.mode:raise GameError('Scenario cannot change in existing save')
        super().setup(c)
        self.config['v17_mode']=self.mode
        self.config.setdefault('v17_commits',{})
        self.config.setdefault('v17_latest',copy.deepcopy(FIELDS))
        self.config.setdefault('v17_indicators',[])
        return self.snapshot()

    @staticmethod
    def forecast_fx(q):
        values=(1.00,1.14,.89,1.21,.92,1.08,1.17,.94)
        return values[(q-1)%len(values)]

    def _apply_product_and_ad(self,d,quarter,actual):
        # One only: V15 prepares brands, V13 handles rival strategy, V10 settles economics.
        super()._apply_product_and_ad(d,quarter,actual)
        x=self._v17_active or self.config.get('v17_latest',FIELDS)
        if self.mode=='ecommerce':
            ux=x['v17_web_quality']; mix=x['v17_channel_mix']
            bonus=(ux-.50)*.30 + {'direct':.07,'hybrid':.035,'retail':-.035}[mix]
            self.state.world.offers=[replace(o,message_fit={k:min(1,max(.05,v+bonus)) for k,v in o.message_fit.items()},
                     distribution={r:min(1,max(0,level+.24*(ux-.5)+{'direct':.055,'hybrid':.02,'retail':-.035}[mix])) for r,level in o.distribution.items()})
                      if o.firm=='PLAYER' else o for o in self.state.world.offers]
        elif self.mode=='international':
            fx=self.forecast_fx(quarter)
            exposure=x['v17_foreign_exposure'];hedge=x['v17_hedge']
            effective=1+(fx-1)*(1-.85*hedge)
            # South acts as foreign proxy, North is the domestic region.
            self.state.world.segments=[replace(s,audience=max(1,round(s.audience*(1+exposure*(effective-1)*.65))),
                   reference_price=s.reference_price*(1+exposure*(effective-1)*.55)) if s.region=='South' else s
                for s in self.state.world.segments]
            # FX import costs and hedge premiums enter COGS, NOT post-settlement cash edits.
            marginal=max(-.20,min(.25,exposure*(1-effective)*.35+.025*hedge))
            self.state.world.offers=[replace(o,unit_cost=round(o.unit_cost*(1+marginal),2))
                if o.firm=='PLAYER' else o for o in self.state.world.offers]
        elif self.mode=='channel':
            lean=x['v17_lean']
            # Lower process waste, but pushing too hard harms reliability of customer service.
            boost=.08*(lean-.5)
            self.state.world.offers=[replace(o,unit_cost=round(o.unit_cost*(1-.08*lean),2),
                message_fit={k:min(1,max(.05,v+boost)) for k,v in o.message_fit.items()})
                if o.firm=='PLAYER' else o for o in self.state.world.offers]
        else:
            people=x['v17_people'];env=x['v17_environment'];gov=x['v17_governance']
            # Environment is paid as higher unit cost. Good employee policy is paid through
            # actual salaries/training (see decision adapter), not off-ledger fictitious CSR costs.
            self.state.world.offers=[replace(o,unit_cost=round(o.unit_cost*(1+.045*env),2),
                message_fit={k:min(1,max(.05,v+.05*(env+gov-1))) for k,v in o.message_fit.items()})
                if o.firm=='PLAYER' else o for o in self.state.world.offers]

    def _adapt(self,full):
        d={k:v for k,v in full.items() if k not in FIELDS}
        x=full
        if self.mode=='ecommerce':
            # Real marketing expenses travel through the V7 marketing accounting.
            split={'direct':(.63,.37),'retail':(.32,.68),'hybrid':(.50,.50)}[x['v17_channel_mix']]
            for region,portion in zip(('north','south'),split):
                k='social_budget_'+region
                d[k]=min(50000,d[k]+x['v17_email_budget']*portion)
        elif self.mode=='channel':
            tier=x['v17_procurement']
            if tier!='none' and x['v17_contract_units']>0:
                if d['supplier_vendor']!='none':raise GameError('Use either V17 procurement or V10 supplier request, not both')
                d.update({'supplier_vendor':'VEND-A' if tier=='standard' else 'VEND-B',
                    'supplier_units':x['v17_contract_units'],'supplier_region':'South',
                    'supplier_unit_surcharge':30 if tier=='standard' else 43,
                    'supplier_reservation_fee':900 if tier=='standard' else 1750})
            # Lean scheduling changes overtime cost AND fulfilled units through V10.
            if x['v17_lean']>.75:d['overtime_south']=min(4,d['overtime_south']+1)
        elif self.mode=='conscious':
            care=x['v17_people']
            for r in ('north','south'):
                # Wage level is owned by V10 and directly increases payroll.
                d['salary_'+r]=min(15000,round(d['salary_'+r]*(1+.06*care),2))
                d['training_'+r]=min(50000,d['training_'+r]+round(1600*care))
            d['risk_mitigation']=max(d['risk_mitigation'],x['v17_governance']*.6)
        # International has no extra cash booked outside V10; FX enters physical unit cost.
        return d

    def preview(self,draft):
        x=validate_v17(draft,self.mode)
        self._v17_active=x
        try:
            result=super().preview(self._adapt(x))
            result['v17_scenario']={'mode':self.mode,'decisions':{k:x[k] for k in MODE_FIELDS[self.mode]},'forecast_only':True}
            return result
        finally:self._v17_active=None

    def submit(self,quarter,submission_id,draft):
        x=validate_v17(draft,self.mode)
        digest=signature(quarter,x)
        past=self.config.get('v17_commits',{})
        if submission_id in past:
            if past[submission_id]!=digest:raise GameError('Same submission ID, different V17 decisions')
            return super().submit(quarter,submission_id,self._adapt(x))
        if submission_id in self.commit_ids:raise GameError('Inconsistent saved submission ID')
        if quarter!=self.state.world.quarter:raise GameError('Stale V17 quarter')
        adapted=self._adapt(x)
        self._v17_active=x
        try:
            out=super().submit(quarter,submission_id,adapted)
            # All financial and physical settlement has already happened ONCE through V10.
            row=self.history[-1]
            # Revert next-quarter media plan to the player's BASE amount after current-quarter
            # expense was settled; this avoids silently compounding the same email budget.
            if self.mode=='ecommerce':
                self.plans['social']=[replace(p,budget=x['social_budget_'+p.region.lower()])
                    if p.brand=='Alpha' and p.region in ('North','South') else p for p in self.plans['social']]
                self.bike_design.update({k:x[k] for k in ('social_budget_north','social_budget_south')})
            indicator=self._indicator(x,quarter,row)
            row['v17']={'mode':self.mode,'decisions':{k:x[k] for k in MODE_FIELDS[self.mode]},'indicator':indicator}
            self.config['v17_latest']=copy.deepcopy({k:x[k] for k in FIELDS})
            self.config['v17_commits'][submission_id]=digest
            self.config['v17_indicators'].append({'quarter':quarter,**indicator})
            out['result']=copy.deepcopy(row)
            if quarter==self.profile.rounds:out['endgame']=self.endgame()
            old=self.commit_ids[submission_id][0]
            self.commit_ids[submission_id]=(old,copy.deepcopy(out))
            return out
        finally:self._v17_active=None

    def _indicator(self,d,q,row):
        if self.mode=='ecommerce':
            return {'digital_readiness':round(.62*d['v17_web_quality']+.38*min(1,d['v17_email_budget']/12000),4),
                    'marketing_spend':round(row.get('marketing_cost',0),2),
                    'fulfillment':round(row['sales']/max(1,row['demand']),4)}
        if self.mode=='international':
            fx=self.forecast_fx(q);he=d['v17_hedge']
            return {'fx_index':round(fx,3),'effective_fx':round(1+(fx-1)*(1-.85*he),4),
                    'foreign_exposure':d['v17_foreign_exposure'],'hedge_coverage':he}
        if self.mode=='channel':
            return {'fill_rate':round(row['sales']/max(1,row['demand']),4),
                    'stockouts':row['stockout'],'lean_index':d['v17_lean'],
                    'supplier_tier':d['v17_procurement'],
                    'supplier_events':len(row.get('supplier_events',[]))}
        return {'stakeholder_index':round(.35*d['v17_people']+.35*d['v17_environment']+.30*d['v17_governance'],4),
                'training_commitment':round(d['v17_people']*3200,2),
                'environment_commitment':d['v17_environment'],
                'governance_commitment':d['v17_governance']}

    def endgame(self):
        base=super().endgame()
        if base is None:return None
        indicators=self.config.get('v17_indicators',[])
        metric={'ecommerce':'digital_readiness','international':'hedge_coverage',
                'channel':'fill_rate','conscious':'stakeholder_index'}[self.mode]
        avg=sum(i.get(metric,0) for i in indicators)/max(1,len(indicators))
        # Transparent additional pass/fail mission: do NOT claim official Marketplace scoring.
        threshold={'ecommerce':.56,'international':.35,'channel':.75,'conscious':.62}[self.mode]
        base['v17_mission']={'metric':metric,'average':round(avg,4),'threshold':threshold,
                             'passed':avg>=threshold,'source':'original V17 rule'}
        base['v17_mode']=self.mode
        base['won']=base['rank']==1 and avg>=threshold
        base['criterion']+='; V17 additional mission criterion (independently authored)'
        return base
