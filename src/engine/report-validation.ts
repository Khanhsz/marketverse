import type { GameState } from './game.ts';
const integer = (v: number, min = Number.MIN_SAFE_INTEGER) => Number.isSafeInteger(v) && v >= min;
export function validateReports(state: GameState) {
  if (state.reports.length !== state.absoluteWeek - 1) throw new Error('Incomplete weekly history');
  const companies = new Set(state.companies.map((c) => c.id)),
    products = new Set(state.products.map((p) => p.id)),
    cities = new Set(state.cities.map((c) => c.id));
  const journalByWeek = new Map<string, Record<string, number>>();
  for (const entry of state.ledger) {
    const key = `${entry.week}|${entry.companyId}`,
      totals = journalByWeek.get(key) || {};
    for (const line of entry.lines)
      totals[line.account] = (totals[line.account] || 0) + line.amount;
    journalByWeek.set(key, totals);
  }
  for (const [i, report] of state.reports.entries()) {
    if (
      !report ||
      report.week !== i + 1 ||
      typeof report.placeholder !== 'boolean' ||
      !Array.isArray(report.events) ||
      report.events.some((e) => typeof e !== 'string') ||
      !report.cashDelta ||
      Object.values(report.cashDelta).some((v) => !integer(v))
    )
      throw new Error('Invalid weekly report');
    if (report.financials) {
      if (
        !Array.isArray(report.financials) ||
        new Set(report.financials.map((f) => f.companyId)).size !== state.companies.length
      )
        throw new Error('Invalid financial report collection');
      for (const f of report.financials) {
        if (
          !companies.has(f.companyId) ||
          [
            'revenue',
            'cogs',
            'expenses',
            'profit',
            'cashChange',
            'capex',
            'borrowing',
            'repayment',
            'closingCash',
            'inventory',
            'netWorth',
            'payables',
          ].some((key) => !integer((f as unknown as Record<string, number>)[key])) ||
          Object.entries(f).some(([key, v]) => key !== 'companyId' && !integer(v as number)) ||
          f.revenue < 0 ||
          f.cogs < 0 ||
          f.expenses < 0 ||
          f.profit !== f.revenue - f.cogs - f.expenses ||
          f.cashChange !== report.cashDelta[f.companyId]
        )
          throw new Error('Invalid financial report');
        const ledger = journalByWeek.get(`${report.week}|${f.companyId}`) || {},
          revenue = 0 - (ledger.revenue || 0),
          cogs = ledger.cogs || 0,
          expenses = ['payroll', 'rent', 'marketing', 'research', 'freight', 'interest'].reduce(
            (n, a) => n + (ledger[a] || 0),
            0,
          );
        if (
          f.revenue !== revenue ||
          f.cogs !== cogs ||
          f.expenses !== expenses ||
          f.cashChange !== (ledger.cash || 0)
        )
          throw new Error('Report does not reconcile to journal');
      }
    }
    if (report.demand) {
      if (
        !Array.isArray(report.demand) ||
        new Set(report.demand.map((d) => d.cityId + '|' + d.segment)).size !== report.demand.length
      )
        throw new Error('Invalid demand report');
      for (const d of report.demand)
        if (
          !cities.has(d.cityId) ||
          !['value', 'mainstream', 'premium'].includes(d.segment) ||
          !integer(d.potential, 0) ||
          !integer(d.outside, 0) ||
          !Array.isArray(d.allocations) ||
          d.allocations.some((a) => !products.has(a.productId) || !integer(a.desired, 0)) ||
          d.outside + d.allocations.reduce((n, a) => n + a.desired, 0) !== d.potential
        )
          throw new Error('Demand conservation failed');
    }
    if (report.sales) {
      if (!Array.isArray(report.sales)) throw new Error('Invalid sales report');
      for (const s of report.sales)
        if (
          !cities.has(s.cityId) ||
          !products.has(s.productId) ||
          !integer(s.desired, 0) ||
          !integer(s.units, 0) ||
          s.units > s.desired ||
          !integer(s.revenue, 0) ||
          !integer(s.cogs, 0) ||
          (s.lostStock !== undefined &&
            (!integer(s.lostStock, 0) ||
              !integer(s.lostStaff, 0) ||
              s.units + s.lostStock + s.lostStaff !== s.desired))
        )
          throw new Error('Invalid fulfillment report');
    }
    if (report.production) {
      if (!Array.isArray(report.production)) throw new Error('Invalid production report');
      for (const p of report.production)
        if (
          !products.has(p.productId) ||
          !state.facilities.some((f) => f.id === p.facilityId) ||
          ![p.units, p.cost, p.materialCost, p.laborCost].every((v) => integer(v, 0))
        )
          throw new Error('Invalid production report');
    }
  }
}
