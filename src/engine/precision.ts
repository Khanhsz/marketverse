/** Persisted continuous state uses nine decimal places; money and goods stay integers. */
export const SIMULATION_SCALE = 1_000_000_000;
export function roundSimulation(value: number) {
  return Math.round(value * SIMULATION_SCALE) / SIMULATION_SCALE || 0;
}
