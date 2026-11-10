/**
 * Market simulation primitives — American odds stepping and tick scheduling.
 *
 * Dependency-free on purpose: pure functions, unit-testable in plain Node.
 */

/** Tick step in American-odds points. */
export const ODDS_STEP = 5;
/** Per-cycle tick probability. 36 buttons × 0.15 / 1.65s mean cycle ≈ 3.3 ticks/s board-wide. */
export const TICK_PROBABILITY = 0.15;
export const TICK_MIN_MS = 800;
export const TICK_MAX_MS = 2500;
/** Flash timing (seconds): hold at peak, then decay to rest. */
export const FLASH_HOLD = 0.15;
export const FLASH_DECAY = 0.45;
/** Drift band: beyond this distance (in points) from the anchor price, steps revert. */
export const DRIFT_BAND = 40;

export type TickDirection = 1 | -1;

/**
 * Implied probability from American odds.
 *   O < 0 → |O| / (|O| + 100)
 *   O > 0 → 100 / (O + 100)
 */
export function impliedProbability(odds: number): number {
  return odds < 0 ? Math.abs(odds) / (Math.abs(odds) + 100) : 100 / (odds + 100);
}

/** True when `odds` lies in the valid American domain (≤ −100 or ≥ +100). */
export function isValidAmerican(odds: number): boolean {
  return odds <= -100 || odds >= 100;
}

/**
 * Step American odds by ±5 points along the number line, skipping the
 * invalid dead zone (−99 … +99).
 *
 * `dir = +1` moves toward longer odds (implied probability DOWN):
 *   −110 → −105 → −100 → +105 → +110
 * `dir = −1` moves toward shorter odds (implied probability UP):
 *   +110 → +105 → +100 → −105 → −110
 *
 * −100 and +100 are both even money, so crossing zero jumps straight to the
 * first price on the far side (±105). Every step therefore changes P.
 */
export function stepAmerican(odds: number, dir: TickDirection, step = ODDS_STEP): number {
  const next = odds + dir * step;
  if (isValidAmerican(next)) return next;
  return dir > 0 ? 100 + step : -(100 + step);
}

/** Signed distance on the American number line with the dead zone collapsed. */
function americanDistance(from: number, to: number): number {
  const collapse = (o: number) => (o < 0 ? o + 100 : o - 100);
  return collapse(to) - collapse(from);
}

/**
 * Mean-reverting direction draw: a fair coin near the anchor, biased back
 * toward it as the price drifts, hard-reverting outside DRIFT_BAND.
 */
export function drawDirection(current: number, anchor: number, rand = Math.random): TickDirection {
  const dist = americanDistance(anchor, current); // > 0 → drifted long
  const pressure = Math.max(-1, Math.min(1, dist / DRIFT_BAND));
  const pLong = 0.5 - 0.4 * pressure;
  return rand() < pLong ? 1 : -1;
}

export function nextTickDelay(rand = Math.random): number {
  return TICK_MIN_MS + rand() * (TICK_MAX_MS - TICK_MIN_MS);
}
