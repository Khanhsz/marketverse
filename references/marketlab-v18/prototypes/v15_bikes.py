"""V15 Bikes scenario for MarketLab. Original, independently authored model.
Uses V6 consumer choice, V7 media, V10 single manufacturing & finance settlement,
V13 three real rival firms. It is NOT Marketplace source or calibrated coefficients.
"""
from __future__ import annotations
import copy, hashlib, json, math
from dataclasses import replace
from v13_game import GameController as BaseController, GameError, validate_draft as base_validate
from market_engine_v6 import Segment
from marketing_engine import SocialPlan

BIKE_SEGMENTS=('Youth','Work','Recreation','Mountain','Speed')
REGIONS={'North':'Northport','South':'Southgate'}
FRAMES=('urban','comfort','trail','aero','junior')
CARBON=('standard','reinforced','ultralight')
TIRES=('city','hybrid','mountain','race')
GEARS=('single','7_speed','18_speed','22_speed')
BRAKES=('standard','disc','hydraulic')
SADDLES=('basic','comfort','sport')
SUSPENSIONS=('rigid','front','full')
ACCESSORIES=('none','safety','cargo','computer')
CLAIMS=('none','comfort','trail_ready','lightweight','safety','fast','bestseller')
DEFAULT_BIKE={
 'bike_target':'Recreation','bike_frame':'comfort','bike_carbon':'standard',
 'bike_tires':'hybrid','bike_gears':'7_speed','bike_brakes':'disc',
 'bike_saddle':'comfort','bike_suspension':'rigid','bike_accessories':'safety',
 'bike_main_north':True,'bike_main_south':True,
 'bike_coverage_north':.74,'bike_coverage_south':.63,
 'bike_second_enabled':False,'bike_second_frame':'trail','bike_second_tires':'mountain',
 'bike_second_gears':'18_speed','bike_second_carbon':'reinforced',
 'bike_second_target':'Mountain','bike_second_price':1450.,
 'bike_second_north':True,'bike_second_south':False,
 'bike_second_coverage_north':.65,'bike_second_coverage_south':.58,
 'bike_claim':'none','bike_claim_brand':'Alpha','bike_claim_region':'North',
 'bike_claim_target':'Recreation'
}
PLAN_FIELDS=('offline_insertions','rebate_north','social_budget_north','social_budget_south',
 'seo_budget_north','seo_budget_south','ppc_bid_north','ppc_bid_south',
 'ppc_budget_north','ppc_budget_south')
MAPPED_SEGMENTS={'Budget':'Youth','Professional':'Recreation','Mobile':'Speed'}


def validate_draft(d):
    if type(d) is not dict:raise GameError('Decision draft must be object')
    base=base_validate(d)
    x={**DEFAULT_BIKE,**{k:d[k] for k in DEFAULT_BIKE if k in d}}
    enums={'bike_target':BIKE_SEGMENTS,'bike_frame':FRAMES,'bike_carbon':CARBON,
           'bike_tires':TIRES,'bike_gears':GEARS,'bike_brakes':BRAKES,
           'bike_saddle':SADDLES,'bike_suspension':SUSPENSIONS,'bike_accessories':ACCESSORIES,
           'bike_second_frame':FRAMES,'bike_second_tires':TIRES,'bike_second_gears':GEARS,
           'bike_second_carbon':CARBON,'bike_second_target':BIKE_SEGMENTS,
           'bike_claim':CLAIMS,'bike_claim_brand':('Alpha','Alpha Pro'),
           'bike_claim_region':tuple(REGIONS),'bike_claim_target':BIKE_SEGMENTS}
    for field,opts in enums.items():
        if x[field] not in opts:raise GameError(f'Invalid bike decision {field}')
    for field in ('bike_main_north','bike_main_south','bike_second_enabled','bike_second_north','bike_second_south'):
        if type(x[field]) is not bool:raise GameError(f'{field}: requires boolean')
    for field in ('bike_coverage_north','bike_coverage_south',
                  'bike_second_coverage_north','bike_second_coverage_south'):
        value=x[field]
        if type(value) not in (int,float) or not math.isfinite(value) or not 0<=value<=1:
            raise GameError(f'{field}: expected 0..1')
        x[field]=float(value)
    price=x['bike_second_price']
    if type(price) not in (int,float) or not math.isfinite(price) or not 400<=price<=3500:
        raise GameError('Secondary bicycle price outside 400–3500')
    x['bike_second_price']=float(price)
    if not (x['bike_main_north'] or x['bike_main_south'] or x['bike_second_enabled']):
        raise GameError('At least one bike brand must remain for sale')
    return {**base,**x}


def bike_spec(d,secondary=False):
    if secondary:
        frame=d['bike_second_frame'];carbon=d['bike_second_carbon'];tires=d['bike_second_tires'];
        gears=d['bike_second_gears'];brakes='hydraulic';saddle='sport';susp='front';extra='none'
    else:
        frame=d['bike_frame'];carbon=d['bike_carbon'];tires=d['bike_tires'];
        gears=d['bike_gears'];brakes=d['bike_brakes'];saddle=d['bike_saddle'];
        susp=d['bike_suspension'];extra=d['bike_accessories']
    prices={
        'frame':{'urban':175,'comfort':205,'trail':250,'aero':310,'junior':150},
        'carbon':{'standard':175,'reinforced':240,'ultralight':325},
        'tires':{'city':44,'hybrid':65,'mountain':90,'race':120},
        'gears':{'single':28,'7_speed':70,'18_speed':125,'22_speed':195},
        'brakes':{'standard':35,'disc':80,'hydraulic':140},
        'saddle':{'basic':24,'comfort':53,'sport':75},
        'susp':{'rigid':15,'front':95,'full':195},
        'extra':{'none':0,'safety':35,'cargo':57,'computer':95}
    }
    unit_cost=round(100+sum(table[val] for table,val in zip(prices.values(),(frame,carbon,tires,gears,brakes,saddle,susp,extra))),2)
    scores={
        'comfort':.18+(.36 if frame=='comfort' else .1 if frame=='urban' else 0)+(.20 if saddle=='comfort' else 0)+(.10 if tires=='hybrid' else 0)+(.13 if susp!='rigid' else 0),
        'speed':.14+(.40 if frame=='aero' else .2 if frame=='trail' else 0)+(.20 if tires=='race' else 0)+(.15 if gears=='22_speed' else .07 if gears=='18_speed' else 0)+(.09 if carbon=='ultralight' else 0),
        'offroad':.12+(.34 if frame=='trail' else 0)+(.30 if tires=='mountain' else 0)+(.17 if susp in ('front','full') else 0)+(.09 if carbon=='reinforced' else 0),
        'safety':.28+(.24 if brakes=='disc' else .39 if brakes=='hydraulic' else 0)+(.25 if extra=='safety' else 0)+(.11 if tires in ('hybrid','city') else 0),
        'practical':.25+(.35 if frame in ('urban','comfort') else 0)+(.25 if extra=='cargo' else .12 if extra=='safety' else 0)+(.1 if gears=='7_speed' else 0),
        'durability':.32+(.28 if carbon=='reinforced' else .16 if carbon=='standard' else 0)+(.15 if tires=='mountain' else 0)+(.09 if brakes=='hydraulic' else 0),
        'lightweight':.22+(.46 if carbon=='ultralight' else .24 if carbon=='standard' else .07)+(.22 if frame=='aero' else .13 if frame=='junior' else 0),
        'youth':.10+(.56 if frame=='junior' else 0)+(.16 if brakes=='standard' else .10)+(.1 if extra=='safety' else 0),
        'value':max(.12,min(.96,1.16-unit_cost/1600.))
    }
    return {'unit_cost':float(unit_cost),'features':{k:round(min(1.,v),4) for k,v in scores.items()},
            'components':{'frame':frame,'carbon':carbon,'tires':tires,'gears':gears,'brakes':brakes,
                          'saddle':saddle,'suspension':susp,'accessories':extra}}


def make_segments():
    # ORIGINAL illustrative populations, prices and needs: not Marketplace data.
    profile={
      'Youth':(1450,880,1.4,{'value':.25,'safety':.25,'youth':.32,'durability':.1,'practical':.08}),
      'Work':(1340,1070,1.2,{'value':.27,'practical':.32,'durability':.23,'comfort':.12,'safety':.06}),
      'Recreation':(1650,1260,1.0,{'comfort':.32,'practical':.12,'safety':.18,'durability':.15,'value':.23}),
      'Mountain':(1120,1530,.86,{'offroad':.43,'durability':.24,'safety':.11,'speed':.12,'value':.1}),
      'Speed':(900,1990,.65,{'speed':.41,'lightweight':.27,'durability':.12,'value':.08,'safety':.12})}
    return [Segment(name,r,round(pop*fac),price*pf,ps,needs)
            for r,fac,pf in [('North',1.,1.),('South',.76,.92)]
            for name,(pop,price,ps,needs) in profile.items()]


def verify_claim(x,offers,prior,q):
    claim=x['bike_claim']
    if claim=='none':return
    if q<2:raise GameError('Creative unlocked at Q2')
    brand=x['bike_claim_brand'];region=x['bike_claim_region']
    o=next((v for v in offers if v.brand==brand and v.firm=='PLAYER'),None)
    if not o or region not in o.active_regions or o.distribution.get(region,0)<=0:
        raise GameError('Cannot advertise a bike that is unavailable in this city')
    if claim=='bestseller':
        if prior is None:raise GameError('Historical bestseller claim requires previous-quarter data')
        sales={p.brand:prior.brand_units(p.brand) for p in offers}
        if sales[brand] <= 0 or sales[brand] < max(sales.values()):
            raise GameError('Bestseller claim contradicted by previous-quarter sales')
        return
    attribute,threshold={'comfort':('comfort',.72),'trail_ready':('offroad',.72),
         'lightweight':('lightweight',.70),'safety':('safety',.70),'fast':('speed',.70)}[claim]
    if o.features.get(attribute,0)<threshold:raise GameError('Advertising claim not supported by bicycle components')


class GameController(BaseController):
    def reset(self):
        super().reset()
        self.bike_design=copy.deepcopy(DEFAULT_BIKE)
        self.bike_commit_hash={}
        self._bike_active=None
        self._replace_market()

    def _replace_market(self):
        self.state.world.segments=make_segments()
        specs={'Alpha':bike_spec(DEFAULT_BIKE),
               'Beta':bike_spec({**DEFAULT_BIKE,'bike_frame':'trail','bike_tires':'mountain','bike_suspension':'front'}),
               'Gamma':bike_spec({**DEFAULT_BIKE,'bike_frame':'urban','bike_gears':'single','bike_accessories':'cargo'}),
               'Delta':bike_spec({**DEFAULT_BIKE,'bike_frame':'aero','bike_tires':'race',
                                   'bike_gears':'22_speed','bike_carbon':'ultralight'})}
        target={'Alpha':'Recreation','Beta':'Mountain','Gamma':'Work','Delta':'Speed'}
        self.state.world.offers=[replace(o,features=specs[o.brand]['features'],unit_cost=specs[o.brand]['unit_cost'],
          message_fit={s:(.87 if s==target[o.brand] else .65) for s in BIKE_SEGMENTS},
          media_fit={s:(.79 if s==target[o.brand] else .66) for s in BIKE_SEGMENTS})
          for o in self.state.world.offers]
        for ch in ('offline','social','ppc','rebates','search_pools'):
            self.plans[ch]=[replace(p,segment=MAPPED_SEGMENTS.get(p.segment,p.segment)) for p in self.plans[ch]]

    def setup(self,c):
        if type(c) is not dict:raise GameError('Invalid setup')
        target=c.get('primary_segment','Recreation')
        if target not in BIKE_SEGMENTS:raise GameError('Invalid Bikes segment')
        legacy={'Youth':'Budget','Work':'Professional','Recreation':'Professional',
                'Mountain':'Professional','Speed':'Mobile'}[target]
        BaseController.setup(self,{**c,'primary_segment':legacy})
        self.config['scenario']='carbon-bikes-8q';self.config['bike_target']=target
        return self.snapshot()

    def snapshot(self):
        snap=BaseController.snapshot(self)
        snap['v15']={'version':'15.0','scenario':'Carbon Fiber Bikes',
          'segments':list(BIKE_SEGMENTS),'manufacturing':'Made to order — no finished-goods inventory',
          'printer_units_per_quarter':520,
          'cities':[{'id':r,'name':REGIONS[r],
                     'audience':sum(s.audience for s in self.state.world.segments if s.region==r)} for r in REGIONS],
          'portfolio':[{'brand':o.brand,'unit_cost':o.unit_cost,'price':o.price,
                        'cities':[r for r in o.active_regions if o.distribution.get(r,0)>0],
                        'features':dict(o.features)} for o in self.state.world.offers if o.firm=='PLAYER'],
          'current_spec':bike_spec(self.bike_design),
          'second_unlocked':snap['quarter']>=3}
        if snap['draft'] is not None:snap['draft'].update(copy.deepcopy(self.bike_design))
        return snap

    def _apply_product_and_ad(self,d,quarter,actual):
        # V13 is responsible for Rival AI and V10 economic settlement, only once.
        BaseController._apply_product_and_ad(self,d,quarter,actual)
        x=self._bike_active or {**d,**self.bike_design}
        s=bike_spec(x)
        features=s['features']
        for p in self.state.projects.values():
            if p.firm=='PLAYER' and p.status=='completed' and p.feature in features:
                features[p.feature]=min(1.,features[p.feature]+p.improvement)
        regions=frozenset(r for r in REGIONS if x[f'bike_main_{r.lower()}'])
        self.state.world.offers=[replace(o,unit_cost=s['unit_cost'],features=features,
             active_regions=regions,distribution={r:x[f'bike_coverage_{r.lower()}'] if r in regions else 0 for r in REGIONS},
             message_fit={seg:(.90 if seg==x['bike_target'] else .60) for seg in BIKE_SEGMENTS})
             if o.firm=='PLAYER' and o.brand=='Alpha' else o for o in self.state.world.offers]
        self.state.world.offers=[o for o in self.state.world.offers if not (o.firm=='PLAYER' and o.brand=='Alpha Pro')]
        for channel in ('offline','social','seo','ppc','rebates'):
            self.plans[channel]=[p for p in self.plans[channel] if p.brand!='Alpha' or p.region in regions]
        self.plans['social']=[p for p in self.plans['social'] if p.brand!='Alpha Pro']
        if x['bike_second_enabled']:
            if quarter<3:raise GameError('Second brand unlocked in Q3')
            sec_regions=frozenset(r for r in REGIONS if x[f'bike_second_{r.lower()}'])
            if not sec_regions:raise GameError('Second brand needs a retail city')
            base=next(o for o in self.state.world.offers if o.firm=='PLAYER' and o.brand=='Alpha')
            sec=bike_spec(x,True)
            self.state.world.offers.append(replace(base,brand='Alpha Pro',price=x['bike_second_price'],
                 unit_cost=sec['unit_cost'],features=sec['features'],active_regions=sec_regions,
                 distribution={r:x[f'bike_second_coverage_{r.lower()}'] if r in sec_regions else 0 for r in REGIONS},
                 message_fit={seg:(.91 if seg==x['bike_second_target'] else .53) for seg in BIKE_SEGMENTS}))
            for r in sec_regions:
                self.plans['social'].append(SocialPlan('Alpha Pro',r,x['bike_second_target'],2300,13,.83,.82))
        self.state.world.priorities['PLAYER']=('Alpha','Alpha Pro')
        verify_claim(x,self.state.world.offers,self.state.world.last_report,quarter)
        if x['bike_claim']!='none':
            self.state.world.offers=[replace(o,message_fit={**o.message_fit,
                  x['bike_claim_target']:min(1.,o.message_fit.get(x['bike_claim_target'],.6)+.12)})
                 if o.firm=='PLAYER' and o.brand==x['bike_claim_brand'] else o for o in self.state.world.offers]

    def preview(self,draft):
        with self._lock:
            d=validate_draft(draft)
            self._bike_active=d
            try:return BaseController.preview(self,d)
            finally:self._bike_active=None

    def submit(self,quarter,submission_id,draft):
        with self._lock:
            d=validate_draft(draft)
            finger=hashlib.sha256(json.dumps({'quarter':quarter,'draft':d},sort_keys=True,ensure_ascii=False,allow_nan=False).encode()).hexdigest()
            if submission_id in self.bike_commit_hash:
                if self.bike_commit_hash[submission_id]!=finger:raise GameError('Submit ID already used for different Bikes decisions')
                return BaseController.submit(self,quarter,submission_id,d)
            if submission_id in self.commit_ids:raise GameError('Submit ID inconsistent with saved Bikes history')
            self._bike_active=d
            try:
                out=BaseController.submit(self,quarter,submission_id,d)
                market=self.state.world.last_report
                rows=[{'city':REGIONS[r.region],'region':r.region,'segment':r.segment,'brand':r.brand,
                    'demand':r.net_demand,'sold':r.units_sold,'stockout':r.stockout,'revenue':round(r.revenue,2)}
                    for r in market.rows if r.firm=='PLAYER']
                self.history[-1]['v15_rows']=rows
                self.history[-1]['v15_brands']={b:{'demand':sum(r['demand'] for r in rows if r['brand']==b),
                    'sales':sum(r['sold'] for r in rows if r['brand']==b)} for b in sorted({r['brand'] for r in rows})}
                self.history[-1]['v15_inventory']=0
                self.bike_design={k:d[k] for k in (*DEFAULT_BIKE,*PLAN_FIELDS)}
                self.bike_commit_hash[submission_id]=finger
                out['result']=copy.deepcopy(self.history[-1])
                base_finger,_=self.commit_ids[submission_id]
                self.commit_ids[submission_id]=(base_finger,copy.deepcopy(out))
                return out
            finally:self._bike_active=None
