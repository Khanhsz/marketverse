import { marketingBudget, STAFF_ROLES } from './people.ts';
import { HR_RULES } from '../data/rules.ts';
import type { GameState } from './game.ts';
import { inventoryValue } from './operations.ts';
import { BUILD_RULES, FINANCE_RULES } from '../data/rules.ts';
import { cityOperationalStats, facilityOperationalStats } from './entityStats.ts';
export const ACCOUNTS = [
  'cash',
  'inventory',
  'materials',
  'fixedAssets',
  'construction',
  'debt',
  'payable',
  'equity',
  'revenue',
  'cogs',
  'payroll',
  'rent',
  'marketing',
  'research',
  'freight',
  'interest',
] as const;
export type Account = (typeof ACCOUNTS)[number];
export type Balances = Record<Account, number>;
export type Journal = {
  id: string;
  week: number;
  companyId: string;
  memo: string;
  lines: { account: Account; amount: number }[];
};
export type Finance = {
  opening: Balances;
  balances: Balances;
  missedWeeks: number;
  bankrupt: boolean;
};
export type FinancialReport = {
  companyId: string;
  revenue: number;
  cogs: number;
  expenses: number;
  profit: number;
  cashChange: number;
  capex: number;
  borrowing: number;
  repayment: number;
  closingCash: number;
  inventory: number;
  netWorth: number;
  payables: number;
};
const zero = (): Balances => Object.fromEntries(ACCOUNTS.map((a) => [a, 0])) as Balances;
export function initializeFinance(
  state: Pick<
    GameState,
    'companies' | 'products' | 'stocks' | 'projects' | 'facilities' | 'factories'
  >,
): Record<string, Finance> {
  return Object.fromEntries(
    state.companies.map((c) => {
      const opening = zero();
      opening.cash = c.cash;
      opening.inventory = inventoryValue(state, c.id);
      opening.materials = state.factories
        .filter((f) => state.facilities.find((x) => x.id === f.facilityId)?.companyId === c.id)
        .reduce((n, f) => n + f.inputs * FINANCE_RULES.inputUnit, 0);
      opening.fixedAssets = state.facilities
        .filter((f) => f.companyId === c.id)
        .reduce((n, f) => n + BUILD_RULES[f.kind].cost, 0);
      opening.construction = state.projects
        .filter((p) => p.kind === 'construction' && p.status === 'active' && p.companyId === c.id)
        .reduce((n, p) => n + p.cost, 0);
      opening.debt = -c.debt || 0;
      opening.equity = -Object.values(opening).reduce((n, v) => n + v, 0) || 0;
      return [c.id, { opening, balances: { ...opening }, missedWeeks: 0, bankrupt: false }];
    }),
  );
}
export function post(
  state: GameState,
  companyId: string,
  memo: string,
  changes: Partial<Balances>,
) {
  const lines = Object.entries(changes)
    .filter(([, v]) => v !== 0)
    .map(([account, amount]) => ({ account: account as Account, amount: amount! }));
  if (!lines.length) return;
  if (
    lines.some((l) => !ACCOUNTS.includes(l.account) || !Number.isSafeInteger(l.amount)) ||
    lines.reduce((n, l) => n + l.amount, 0) !== 0
  )
    throw new Error('Unbalanced journal');
  const finance = state.finance[companyId];
  if (!finance) throw new Error('Missing company ledger');
  for (const line of lines) finance.balances[line.account] += line.amount;
  if (finance.balances.cash < 0) throw new Error('Cash budget exceeded');
  state.ledger.push({
    id: `journal:${state.absoluteWeek}:${state.ledger.length}`,
    week: state.absoluteWeek,
    companyId,
    memo,
    lines,
  });
  const company = state.companies.find((c) => c.id === companyId)!;
  company.cash = finance.balances.cash;
  company.debt = -finance.balances.debt || 0;
}
export function projectPayment(state: GameState, companyId: string, kind: string, cost: number) {
  post(state, companyId, `${kind} committed`, {
    cash: -cost,
    [kind === 'construction'
      ? 'construction'
      : kind === 'research'
        ? 'research'
        : kind === 'hiring'
          ? 'payroll'
          : 'freight']: cost,
  });
}
export function financing(state: GameState, companyId: string, borrow: number, repay: number) {
  const c = state.companies.find((c) => c.id === companyId)!;
  if (
    ![borrow, repay].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    c.debt + borrow > FINANCE_RULES.debtLimit ||
    repay > c.debt + borrow ||
    repay > c.cash + borrow
  )
    throw new Error('Invalid financing or debt limit');
  if (state.finance[companyId].bankrupt && (borrow || repay))
    throw new Error('Bankrupt company cannot issue financing');
  post(state, companyId, 'Loan drawdown', { cash: borrow, debt: -borrow });
  post(state, companyId, 'Loan principal repayment', { cash: -repay, debt: repay });
}
export function settleExpenses(state: GameState, events: string[]) {
  for (const company of state.companies) {
    const f = state.finance[company.id];
    let missed = false;
    const wageCity = state.cities.find(
      (city) =>
        city.id ===
        (state.facilities.find((asset) => asset.companyId === company.id && asset.kind === 'hq')
          ?.cityId || state.facilities.find((asset) => asset.companyId === company.id)?.cityId),
    );
    const wageIndex = wageCity ? cityOperationalStats(wageCity).wageIndex : 1;
    const payroll = Math.round(
      STAFF_ROLES.reduce((n, r) => n + state.staff[company.id][r] * HR_RULES.wages[r], 0) *
        wageIndex,
    );
    const bills: { account: Account; amount: number }[] = [
      { account: 'payroll', amount: payroll },
      {
        account: 'rent',
        amount: state.facilities
          .filter((x) => x.companyId === company.id)
          .reduce(
            (n, facility) =>
              n +
              facilityOperationalStats(
                facility,
                state.cities.find((city) => city.id === facility.cityId)!,
              ).weeklyCost,
            0,
          ),
      },
      { account: 'marketing', amount: marketingBudget(state.policies[company.id]) },
      { account: 'interest', amount: Math.ceil(company.debt * FINANCE_RULES.weeklyInterest) },
    ];
    // Repay arrears before new bills. Expenses are recognized when incurred.
    const arrears = Math.min(company.cash, -f.balances.payable);
    post(state, company.id, 'Settle arrears', { cash: -arrears, payable: arrears });
    for (const bill of bills) {
      const paid = Math.min(company.cash, bill.amount),
        unpaid = bill.amount - paid;
      post(state, company.id, `Weekly ${bill.account}`, {
        [bill.account]: bill.amount,
        cash: -paid,
        payable: -unpaid,
      });
      if (unpaid) missed = true;
    }
    f.missedWeeks = missed ? f.missedWeeks + 1 : 0;
    if (f.missedWeeks >= FINANCE_RULES.defaultWeeks) {
      f.bankrupt = true;
      events.push(
        `${company.name}: bankruptcy after ${f.missedWeeks} weeks of unpaid obligations.`,
      );
    }
  }
}
export function financialReports(
  state: GameState,
  openingCash: Record<string, number>,
): FinancialReport[] {
  return state.companies.map((c) => {
    const rows = state.ledger.filter((e) => e.companyId === c.id && e.week === state.absoluteWeek),
      sum = (a: Account) =>
        rows
          .flatMap((e) => e.lines)
          .filter((l) => l.account === a)
          .reduce((n, l) => n + l.amount, 0);
    const revenue = -sum('revenue') || 0,
      cogs = sum('cogs'),
      expenses = (
        ['payroll', 'rent', 'marketing', 'research', 'freight', 'interest'] as Account[]
      ).reduce((n, a) => n + sum(a), 0),
      b = state.finance[c.id].balances;
    const borrowing = rows
      .filter((e) => e.memo === 'Loan drawdown')
      .flatMap((e) => e.lines)
      .filter((l) => l.account === 'cash')
      .reduce((n, l) => n + l.amount, 0);
    const repayment =
      0 -
      rows
        .filter((e) => e.memo === 'Loan principal repayment')
        .flatMap((e) => e.lines)
        .filter((l) => l.account === 'cash')
        .reduce((n, l) => n + l.amount, 0);
    return {
      companyId: c.id,
      revenue,
      cogs,
      expenses,
      profit: revenue - cogs - expenses,
      cashChange: c.cash - openingCash[c.id],
      capex: Math.max(0, sum('construction') + sum('fixedAssets')),
      borrowing,
      repayment,
      closingCash: c.cash,
      inventory: b.inventory,
      netWorth:
        b.cash + b.inventory + b.materials + b.fixedAssets + b.construction + b.debt + b.payable,
      payables: 0 - b.payable,
    };
  });
}
export function validateFinance(state: GameState) {
  if (
    !state.finance ||
    !Array.isArray(state.ledger) ||
    new Set(state.ledger.map((e) => e.id)).size !== state.ledger.length
  )
    throw new Error('Invalid ledger');
  for (const entry of state.ledger)
    if (
      !state.companies.some((c) => c.id === entry.companyId) ||
      !Number.isSafeInteger(entry.week) ||
      entry.week < 1 ||
      entry.week >= state.absoluteWeek ||
      !entry.lines.length ||
      entry.lines.some((l) => !ACCOUNTS.includes(l.account) || !Number.isSafeInteger(l.amount)) ||
      entry.lines.reduce((n, l) => n + l.amount, 0) !== 0
    )
      throw new Error('Unbalanced journal');
  for (const c of state.companies) {
    const f = state.finance[c.id];
    if (
      !f ||
      !Number.isSafeInteger(f.missedWeeks) ||
      f.missedWeeks < 0 ||
      typeof f.bankrupt !== 'boolean'
    )
      throw new Error('Invalid finance');
    const rebuilt = { ...f.opening };
    if (
      ACCOUNTS.some((a) => !Number.isSafeInteger(rebuilt[a])) ||
      Object.values(rebuilt).reduce((n, v) => n + v, 0) !== 0
    )
      throw new Error('Invalid opening balance');
    for (const e of state.ledger.filter((e) => e.companyId === c.id))
      for (const l of e.lines) rebuilt[l.account] += l.amount;
    if (
      ACCOUNTS.some((a) => !Number.isSafeInteger(f.balances[a]) || rebuilt[a] !== f.balances[a]) ||
      f.balances.payable > 0 ||
      f.balances.debt > 0 ||
      ['inventory', 'materials', 'fixedAssets', 'construction'].some(
        (a) => f.balances[a as Account] < 0,
      ) ||
      f.balances.construction !==
        state.projects
          .filter((p) => p.kind === 'construction' && p.status === 'active' && p.companyId === c.id)
          .reduce((n, p) => n + p.cost, 0) ||
      Object.values(f.balances).reduce((n, v) => n + v, 0) !== 0 ||
      c.cash !== f.balances.cash ||
      c.debt !== -f.balances.debt ||
      c.cash < 0 ||
      f.balances.inventory !== inventoryValue(state, c.id)
    )
      throw new Error('Ledger reconciliation failed');
  }
}
