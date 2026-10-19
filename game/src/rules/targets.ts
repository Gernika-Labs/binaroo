import { popcount } from "./board";
import type { Rng } from "./rng";
import { pick } from "./rng";

export interface TargetQuery {
  /** Bits already filled in the row, so the new target is still reachable. */
  filled: number;
  /** Targets other rows already use. */
  used: readonly number[];
  level: number;
  rng: Rng;
}

/**
 * A target (1..255) that the row can still reach: a superset of the filled bits, different from
 * them, and not used by another row. Prefers targets with few set bits at low levels
 * (2 bits at level 0, one more per level); falls back to any reachable target.
 * Returns undefined when none exists (the row is completely full).
 */
export function pickTarget({ filled, used, level, rng }: TargetQuery): number | undefined {
  const maxBits = Math.min(8, 2 + level);
  const preferred: number[] = [];
  const reachable: number[] = [];
  for (let t = 1; t < 256; t++) {
    if (used.includes(t) || (filled & ~t) !== 0 || t === filled) continue;
    reachable.push(t);
    if (popcount(t) <= maxBits) preferred.push(t);
  }
  return pick(preferred.length ? preferred : reachable, rng);
}
