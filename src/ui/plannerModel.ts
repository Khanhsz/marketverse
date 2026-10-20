import type { Segment } from '../engine/game';
import type { StaffRole } from '../engine/people';
import type { Policy, ProjectRequest } from '../engine/orders';

/** Show only people requested this week; never re-label existing staff as "planned". */
export function plannedHires(projects: ProjectRequest[], role: StaffRole): number {
  return projects.reduce(
    (sum, item) => sum + (item.kind === 'hiring' && item.role === role ? item.quantity : 0),
    0,
  );
}

/** The engine accepts hiring in batches of up to 100; that is not a team capacity cap. */
export function adjustHiringPlan(
  projects: ProjectRequest[],
  role: StaffRole,
  delta: -1 | 1,
): ProjectRequest[] {
  const target = Math.max(0, plannedHires(projects, role) + delta);
  const unchanged = projects.filter((item) => !(item.kind === 'hiring' && item.role === role));
  let remaining = target;
  const batches: ProjectRequest[] = [];
  while (remaining > 0) {
    const quantity = Math.min(100, remaining);
    batches.push({ kind: 'hiring', role, quantity });
    remaining -= quantity;
  }
  return [...unchanged, ...batches];
}

/** Slider funds come from cash remaining after queued projects and other weekly media spend. */
export function mediaBudgetLimit(
  cashAfterProjects: number,
  policy: Policy,
  cityId: string,
  segment: Segment,
): number {
  const otherMedia = Object.entries(policy.media ?? {}).reduce(
    (total, [id, segments]) =>
      total +
      Object.entries(segments).reduce(
        (sum, [name, spend]) => sum + (id === cityId && name === segment ? 0 : (spend ?? 0)),
        0,
      ),
    0,
  );
  return Math.max(0, Math.floor(cashAfterProjects - policy.marketing - otherMedia));
}
