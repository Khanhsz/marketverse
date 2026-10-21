import type { Facility, GameState } from './game.ts';
import { worldEntity } from '../data/worldEntities.ts';
export type Selection = { kind: 'city' | 'company' | 'facility' | 'world'; id: string };
export const FACILITY_KINDS = ['hq', 'store', 'factory', 'warehouse', 'rd'] as const;
export function resolveSelection(state: GameState, selection: Selection) {
  if (selection.kind === 'city') {
    const city = state.cities.find((c) => c.id === selection.id);
    return city ? { kind: 'city' as const, entity: city } : undefined;
  }
  if (selection.kind === 'company') {
    const company = state.companies.find((c) => c.id === selection.id);
    return company ? { kind: 'company' as const, entity: company } : undefined;
  }
  if (selection.kind === 'world') {
    const entity = worldEntity(selection.id);
    return entity ? { kind: 'world' as const, entity } : undefined;
  }
  if (selection.kind !== 'facility') return undefined;
  const facility = state.facilities.find((f) => f.id === selection.id);
  return facility ? { kind: 'facility' as const, entity: facility } : undefined;
}
/** One facility of each kind per company/city; one HQ per company nationally. */
export function placementError(
  state: Pick<GameState, 'cities' | 'companies' | 'facilities'>,
  proposal: Pick<Facility, 'companyId' | 'cityId' | 'kind'>,
  excludeId?: string,
): string | undefined {
  if (!state.companies.some((c) => c.id === proposal.companyId)) return 'Unknown company';
  if (!state.cities.some((c) => c.id === proposal.cityId)) return 'Unknown city';
  if (!FACILITY_KINDS.includes(proposal.kind)) return 'Unknown facility kind';
  const existing = state.facilities.filter(
    (f) => f.id !== excludeId && f.companyId === proposal.companyId,
  );
  if (proposal.kind === 'hq' && existing.some((f) => f.kind === 'hq'))
    return 'Company already has an HQ';
  if (existing.some((f) => f.cityId === proposal.cityId && f.kind === proposal.kind))
    return 'Facility kind already present for this company in this city';
  return undefined;
}
