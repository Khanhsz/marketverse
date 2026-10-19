"""MarketLab V18 original deep editions. Independent, inspectable business mechanics.

These are NEW stand-alone financial settlement pipelines, NOT overlays that book
sales or money after the V10 engine settles a quarter. PC designs and segments
are reused from V14; V17 modes remain playable unchanged via v17_launcher.py.
The monetary units, regional labels and parameters are synthetic.
"""
from __future__ import annotations
from copy import deepcopy
from math import exp, isfinite
from v14_game import build_pc_spec, make_segments, PC14_FIELDS

class RuleError(ValueError): pass

def numeric(x,lo,hi,name):
    if type(x) not in (int,float) or not isfinite(x) or not lo<=x<=hi:raise RuleError(f'{name} must be within {lo}..{hi}')
    return float(x)

def whole(x,lo,hi,name):
    if type(x) is not int or not lo<=x<=hi:raise RuleError(f'{name} must be integer {lo}..{hi}')
    return x

def money(x):return round(x+0.,2)

def default_decisions(mode):
    if mode=='pc_operations':return {'price_alpha':1190.,'price_pro':1720.,'build_alpha':200,'build_pro':0,
        'buy_parts':200,'workers':10,'overtime':False,'expand_cells':0,'marketing':3500.,'cpu_alpha':'business','cpu_pro':'pro'}
    if mode=='supply_network':return {'supplier_ask':140.,'supplier_capacity':330,'buyer_bid':135.,'buyer_qty':260,
        'buyer_accept':False,'retail_price':248.,'marketing':1800.,'supplier_reliability':.91}
    if mode=='global_treasury':return {'north_price':1050.,'atlantic_price':990.,'pacific_price':1120.,
        'atlantic_exposure':.80,'pacific_exposure':.75,'atlantic_hedge':.30,'pacific_hedge':.30,
        'atlantic_tariff':.05,'pacific_tariff':.08,'marketing':3000.}
    raise RuleError('Unknown deep edition')

MODES={
 'pc_operations':{'title':'PC Operations & Inventory','rounds':8,'subtitle':'Component purchasing, production schedules, changeovers, inventory and GAAP-style cost recognition'},
 'supply_network':{'title':'Supplier ↔ Reseller Negotiation','rounds':6,'subtitle':'Two business roles, price offers, one-quarter acceptance, delayed deliveries and bilateral cash flow'},
 'global_treasury':{'title':'International Treasury','rounds':8,'subtitle':'Three economies, two foreign currencies, forward hedging, import costs and tariffs'}
}

PART_PRICES={'cpu':128.,'memory':66.,'storage':95.,'chassis':335.}
RECIPE={'Alpha':{'cpu':1,'memory':1,'storage':1,'chassis':1},'Alpha Pro':{'cpu':1,'memory':2,'storage':2,'chassis':1}}
ASSEMBLY={'Alpha':75.,'Alpha Pro':125.}

def pc_price(brand):return sum(PART_PRICES[k]*v for k,v in RECIPE[brand].items())+ASSEMBLY[brand]

def pc_forecast(d,q):
    """5x2 demand signals reuse V14 segment definitions and V14's component scores.
    Rival attractiveness explicitly appears in denominators; no hidden formulas.
    """
    x={**PC14_FIELDS,'pc_type':'laptop','pc14_cpu':d['cpu_alpha']}
    a=build_pc_spec(x)['features']
    x['pc14_second_cpu']=d['cpu_pro']
    b=build_pc_spec(x,secondary=True)['features']
    units={'Alpha':0,'Alpha Pro':0};cells=[]
    for s in make_segments():
        fit=[]
        for brand,feat,price in [('Alpha',a,d['price_alpha']),('Alpha Pro',b,d['price_pro'])]:
            affinity=sum(feat.get(k,0)*v for k,v in s.needs.items())
            value=max(.07, 1+.95*(affinity-.47))
            desirability=value*exp(-s.price_sensitivity*max(-.5,min(1.5,(price/s.reference_price-1))))
            if brand=='Alpha Pro' and q<3:desirability=0.
            fit.append(desirability)
        rival=.95 # synthetic competitors; their demand is not counted as Player sales.
        buyers=round(s.audience*(.085+.003*q))
        norm=rival+sum(fit)
        sold=[round(buyers*z/norm) for z in fit]
        units['Alpha']+=sold[0];units['Alpha Pro']+=sold[1]
        cells.append({'region':s.region,'segment':s.name,'available_buyers':buyers,
                      'alpha_demand':sold[0],'pro_demand':sold[1]})
    return units,cells

def validate(mode,d):
    if type(d) is not dict:raise RuleError('Decision must be an object')
    required=default_decisions(mode)
    if set(d)!=set(required):raise RuleError('Decision fields do not match mode')
    z=dict(d)
    if mode=='pc_operations':
        for k in ('price_alpha','price_pro'):z[k]=numeric(z[k],400,3500,k)
        for k in ('build_alpha','build_pro','buy_parts'):z[k]=whole(z[k],0,3000,k)
        z['workers']=whole(z['workers'],0,35,'workers')
        z['expand_cells']=whole(z['expand_cells'],0,3,'expand_cells')
        z['marketing']=numeric(z['marketing'],0,50000,'marketing')
        if type(z['overtime']) is not bool:raise RuleError('overtime must be boolean')
        for k in ('cpu_alpha','cpu_pro'):
            if z[k] not in ('entry','business','pro','extreme'):raise RuleError(k+' invalid')
    elif mode=='supply_network':
        for k in ('supplier_ask','buyer_bid'):z[k]=numeric(z[k],50,450,k)
        z['retail_price']=numeric(z['retail_price'],80,700,'retail_price')
        z['supplier_capacity']=whole(z['supplier_capacity'],0,800,'supplier_capacity')
        z['buyer_qty']=whole(z['buyer_qty'],0,800,'buyer_qty')
        z['marketing']=numeric(z['marketing'],0,15000,'marketing')
        z['supplier_reliability']=numeric(z['supplier_reliability'],.50,1.,'supplier_reliability')
        if type(z['buyer_accept']) is not bool:raise RuleError('buyer_accept must be boolean')
    else:
        for k in ('north_price','atlantic_price','pacific_price'):z[k]=numeric(z[k],300,3500,k)
        for k in ('atlantic_exposure','pacific_exposure','atlantic_hedge','pacific_hedge'):z[k]=numeric(z[k],0,1,k)
        for k in ('atlantic_tariff','pacific_tariff'):z[k]=numeric(z[k],0,.5,k)
        z['marketing']=numeric(z['marketing'],0,50000,'marketing')
    return z


def new_state(mode):
    if mode not in MODES:raise RuleError('Unknown mode')
    s={'mode':mode,'quarter':1,'finished':False,'history':[],'submissions':{},'draft':default_decisions(mode)}
    if mode=='pc_operations':
        parts={k:420 for k in PART_PRICES}
        s.update({'cash':480000.,'paid_equity':480000.+200000.+sum(parts[k]*PART_PRICES[k] for k in parts),
            'retained':0.,'parts':parts,'pending_parts':[],'finished_goods':{'Alpha':0,'Alpha Pro':0},
            'finished_cost':{'Alpha':pc_price('Alpha'),'Alpha Pro':pc_price('Alpha Pro')},
            'cells':2,'pending_cells':[],'equipment':200000.,'cumulative_sales':0,'lost_sales':0})
    elif mode=='supply_network':
        s.update({'supplier_cash':310000.,'buyer_cash':290000.,'supplier_equity':310000.,'buyer_equity':290000.,
            'supplier_profit':0.,'buyer_profit':0.,'inventory_qty':0,'inventory_value':0.,'offers':[],
            'shipments':[],'cumulative_sales':0,'wholesale_transfers':0.})
    else:
        s.update({'cash_dom':500000.,'equity':500000.,'profit':0.,'cumulative_sales':0,
                  'currency_exposures':{'ATL':0.,'PAC':0.},'hedge_settlements':0.})
    return s

def _asset_pc(s):
    return money(s['cash']+s['equipment']+sum(s['parts'][k]*PART_PRICES[k] for k in PART_PRICES)
       +sum(x['qty']*PART_PRICES[x['part']] for x in s['pending_parts'])
       +sum(s['finished_goods'][k]*s['finished_cost'][k] for k in RECIPE))

def _stock_check_pc(s):
    if min([*s['parts'].values(),*s['finished_goods'].values()])<0:raise AssertionError('Negative inventory')
    if abs(_asset_pc(s) - (s['paid_equity']+s['retained']))>.05:
        raise AssertionError(f'PC ledger not balanced: assets={_asset_pc(s)}, equity={s["paid_equity"]+s["retained"]}')

def settle_pc(s,d):
    q=s['quarter']; events=[]
    due=[x for x in s['pending_parts'] if x['due']<=q]
    s['pending_parts']=[x for x in s['pending_parts'] if x['due']>q]
    for po in due:s['parts'][po['part']]+=po['qty'];events.append({'type':'parts_received',**po})
    ready=[x for x in s['pending_cells'] if x['due']<=q]
    s['pending_cells']=[x for x in s['pending_cells'] if x['due']>q]
    for x in ready:s['cells']+=x['count'];events.append({'type':'cells_operational',**x})
    purchase=sum(PART_PRICES.values())*d['buy_parts']
    for part in PART_PRICES:s['pending_parts'].append({'part':part,'qty':d['buy_parts'],'due':q+1})
    if d['expand_cells']:s['pending_cells'].append({'count':d['expand_cells'],'due':q+1})
    expansion=d['expand_cells']*34000.
    s['equipment']+=expansion
    base_capacity=min(s['cells']*230,d['workers']*48)+(90 if d['overtime'] else 0)
    changeover=30 if d['build_alpha'] and d['build_pro'] else 0
    capacity=max(0,base_capacity-changeover)
    produced={k:0 for k in RECIPE}
    for brand,target in (('Alpha',d['build_alpha']),('Alpha Pro',d['build_pro'])):
        if brand=='Alpha Pro' and q<3 and target:raise RuleError('Alpha Pro unlocks in Q3')
        feasible=min([target,capacity]+[s['parts'][part]//qty for part,qty in RECIPE[brand].items()])
        produced[brand]=feasible;capacity-=feasible
        for part,qty in RECIPE[brand].items():s['parts'][part]-=feasible*qty
        oldn=s['finished_goods'][brand];oldcost=s['finished_cost'][brand]
        newcost=pc_price(brand)+{'entry':-40.,'business':0.,'pro':95.,'extreme':205.}[d['cpu_alpha' if brand=='Alpha' else 'cpu_pro']]
        s['finished_goods'][brand]+=feasible
        if oldn+feasible:s['finished_cost'][brand]=(oldn*oldcost+feasible*newcost)/(oldn+feasible)
    assemble=sum(produced[b]*(ASSEMBLY[b]+{'entry':-40.,'business':0.,'pro':95.,'extreme':205.}[d['cpu_alpha' if b=='Alpha' else 'cpu_pro']]) for b in RECIPE)
    orders,cells=pc_forecast(d,q)
    sold={b:min(orders[b],s['finished_goods'][b]) for b in RECIPE}
    cogs=money(sum(sold[b]*s['finished_cost'][b] for b in RECIPE))
    revenue=money(sold['Alpha']*d['price_alpha']+sold['Alpha Pro']*d['price_pro'])
    for b in RECIPE:s['finished_goods'][b]-=sold[b]
    holding=money(.005*sum(s['parts'][k]*PART_PRICES[k] for k in PART_PRICES)
                  +.012*sum(s['finished_goods'][b]*s['finished_cost'][b] for b in RECIPE))
    payroll=d['workers']*1800.+(3400. if d['overtime'] else 0.)
    other=money(payroll+d['marketing']+holding)
    profit=money(revenue-cogs-other)
    s['cash']=money(s['cash']+revenue-purchase-expansion-assemble-other)
    s['retained']=money(s['retained']+profit)
    s['cumulative_sales']+=sum(sold.values());s['lost_sales']+=sum(orders[b]-sold[b] for b in RECIPE)
    _stock_check_pc(s)
    return {'quarter':q,'demand':orders,'produced':produced,'sold':sold,'lost':{b:orders[b]-sold[b] for b in RECIPE},
        'capacity_before_changeover':base_capacity,'changeover_units':changeover,'revenue':revenue,'cogs':cogs,
        'component_order_cash':money(purchase),'assembly_cash':money(assemble),'payroll':money(payroll),
        'holding_cost':holding,'marketing':money(d['marketing']),'net_income':profit,'cash':s['cash'],
        'retained':s['retained'],'assets':_asset_pc(s),'reconciled':True,'market_cells':cells,'events':events}


def _asset_supplier(s):return money(s['supplier_cash'])
def _asset_buyer(s):return money(s['buyer_cash']+s['inventory_value'])

def settle_supply(s,d):
    q=s['quarter']; events=[];deliveries=[]
    for shipment in s['shipments']:
        if shipment['due']!=q:continue
        factor=[1.,.93,.74,.85,1.,.88][(q-1)%6] # independent synthetic service shocks
        actual=min(shipment['qty'],d['supplier_capacity'],int(shipment['qty']*d['supplier_reliability']*factor))
        price=shipment['price'];invoice=money(actual*price)
        fee=money((shipment['qty']-actual)*.15*price)
        cost=money(actual*88.)
        s['supplier_cash']=money(s['supplier_cash']+invoice-fee-cost)
        s['buyer_cash']=money(s['buyer_cash']-invoice+fee)
        s['inventory_qty']+=actual;s['inventory_value']=money(s['inventory_value']+invoice)
        s['wholesale_transfers']=money(s['wholesale_transfers']+invoice)
        s['supplier_profit']=money(s['supplier_profit']+invoice-fee-cost)
        s['buyer_profit']=money(s['buyer_profit']+fee)
        deliveries.append({'units':actual,'contracted':shipment['qty'],'wholesale':invoice,'penalty':fee,'production_cost':cost})
    s['shipments']=[x for x in s['shipments'] if x['due']>q]
    # Negotiation is genuinely inter-quarter; cannot accept a new same-quarter offer.
    pending=[x for x in s['offers'] if x['quarter']<q]
    if d['buyer_accept']:
        eligible=next((o for o in reversed(pending) if d['buyer_bid']>=o['ask'] and o['status']=='open'),None)
        if eligible is None:raise RuleError('No previous-quarter quote at an acceptable buyer bid')
        qty=min(d['buyer_qty'],eligible['qty'])
        s['shipments'].append({'due':q+1,'qty':qty,'price':eligible['ask'],'accepted':q})
        eligible['status']='accepted';events.append({'type':'agreement','qty':qty,'price':eligible['ask'],'delivery_quarter':q+1})
    s['offers'].append({'quarter':q,'ask':d['supplier_ask'],'qty':d['supplier_capacity'],'status':'open'})
    # Buyer sells only physical goods in stock; cost basis is weighted average.
    potential=round(175+24*q+max(-85,min(85,(260-d['retail_price'])*1.0))+d['marketing']/90)
    sold=min(s['inventory_qty'],max(0,potential))
    unit_cost=s['inventory_value']/s['inventory_qty'] if s['inventory_qty'] else 0
    cogs=money(sold*unit_cost);revenue=money(sold*d['retail_price'])
    s['inventory_qty']-=sold;s['inventory_value']=money(s['inventory_value']-cogs)
    hold=money(.01*s['inventory_value']);expenses=money(d['marketing']+hold)
    s['buyer_cash']=money(s['buyer_cash']+revenue-expenses)
    s['buyer_profit']=money(s['buyer_profit']+revenue-cogs-expenses)
    s['cumulative_sales']+=sold
    supplier_ok=abs(_asset_supplier(s)-(s['supplier_equity']+s['supplier_profit']))<.05
    buyer_ok=abs(_asset_buyer(s)-(s['buyer_equity']+s['buyer_profit']))<.05
    if not (supplier_ok and buyer_ok):raise AssertionError('Bilateral ledger broken')
    return {'quarter':q,'offer':events,'deliveries':deliveries,'pending_quotes':sum(o['status']=='open' for o in s['offers']),
        'pending_shipments':len(s['shipments']),'retail_demand':potential,'retail_sales':sold,
        'inventory':s['inventory_qty'],'invoice_total':money(sum(x['wholesale'] for x in deliveries)),
        'penalties':money(sum(x['penalty'] for x in deliveries)),
        'supplier_cash':s['supplier_cash'],'buyer_cash':s['buyer_cash'],
        'supplier_profit':s['supplier_profit'],'buyer_profit':s['buyer_profit'],
        'supplier_reconciled':supplier_ok,'buyer_reconciled':buyer_ok,'cumulative_sales':s['cumulative_sales']}

FX_PATHS={'ATL':[1.02,1.18,.86,1.23,.92,1.10,1.16,.94],
          'PAC':[.91,.82,1.13,.96,1.28,.89,1.05,1.20]}

def settle_fx(s,d):
    q=s['quarter']; detail=[];revenue=0;cost=0;units=0;hedge_gain=0;tariff_sum=0
    for country,currency,base,price,expo,hedge,tariff in (
        ('Northland','DOM',270,d['north_price'],1.,0.,0.),
        ('Atlantica','ATL',235,d['atlantic_price'],d['atlantic_exposure'],d['atlantic_hedge'],d['atlantic_tariff']),
        ('Pacifica','PAC',245,d['pacific_price'],d['pacific_exposure'],d['pacific_hedge'],d['pacific_tariff'])):
        spot=1. if currency=='DOM' else FX_PATHS[currency][(q-1)%8]
        # Foreign demand is sensitive to purchasing power, country-specific retail pricing
        # and market-entry exposure. A percentage hedge stabilizes proceeds at forward 1.0.
        order=max(0,round(base*(1+.05*(q-1))*expo*exp(-max(-.5,min(1.,price/1100.-1.)))*
                (1 if currency=='DOM' else (1+.30*(spot-1)))))
        invoice_foreign=order*price
        domestic_spot=invoice_foreign*spot
        domestic_hedged=invoice_foreign*(spot*(1-hedge)+hedge*1.0)
        fx_benefit=domestic_hedged-domestic_spot
        production=order*560. # domestic production asset consumed in current quarter
        border_tax=production*tariff if currency!='DOM' else 0.
        hedge_premium=invoice_foreign*hedge*.008 if currency!='DOM' else 0.
        revenue+=domestic_hedged;cost+=production+border_tax+hedge_premium
        units+=order;hedge_gain+=fx_benefit;tariff_sum+=border_tax
        if currency!='DOM':s['currency_exposures'][currency]+=invoice_foreign
        detail.append({'country':country,'currency':currency,'spot':spot,'hedge':hedge,
             'local_revenue':money(invoice_foreign),'domestic_revenue':money(domestic_hedged),
             'hedge_gain':money(fx_benefit),'tariff':money(border_tax),'units':order})
    revenue=money(revenue);cost=money(cost);overhead=money(42000.+d['marketing'])
    profit=money(revenue-cost-overhead)
    s['cash_dom']=money(s['cash_dom']+profit)
    s['profit']=money(s['profit']+profit)
    s['cumulative_sales']+=units
    s['hedge_settlements']=money(s['hedge_settlements']+hedge_gain)
    reconciled=abs(s['cash_dom']-(s['equity']+s['profit']))<.05
    if not reconciled:raise AssertionError('FX reporting ledger broken')
    return {'quarter':q,'countries':detail,'revenue_dom':revenue,'production_import_tariff_cost_dom':cost,
      'overhead_dom':overhead,'profit_dom':profit,'cash_dom':s['cash_dom'],
      'hedge_gain_dom':money(hedge_gain),'tariff_dom':money(tariff_sum),
      'units':units,'cumulative_sales':s['cumulative_sales'],'reconciled':True}


def advance(state,raw):
    """Single authoritative quarter settlement, suitable for transactional persistence."""
    if state['finished']:raise RuleError('This scenario has ended')
    if state['quarter']!=len(state['history'])+1:raise RuleError('Quarter history mismatch')
    d=validate(state['mode'],raw)
    s=deepcopy(state)
    result={'pc_operations':settle_pc,'supply_network':settle_supply,'global_treasury':settle_fx}[s['mode']](s,d)
    s['history'].append(result);s['quarter']+=1;s['finished']=len(s['history'])>=MODES[s['mode']]['rounds'];s['draft']=d
    return s,result
