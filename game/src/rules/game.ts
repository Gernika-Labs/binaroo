import {
  type Grid,
  emptyGrid,
  fits,
  isDead,
  popcount,
  rowValue,
  stamp,
} from "./board";
import { HINT_COST, MAX_STRIKES, N, TIMEOUT_PENALTY } from "./constants";
import { levelOf, rowTimeMs } from "./levels";
import type { Rng } from "./rng";
import { clearPoints, exactRowPoints } from "./scoring";
import { type Shape, placementPoints } from "./shapes";
import { pickTarget } from "./targets";

export interface GameState {
  grid: Grid;
  /** Target number per row. */
  targets: number[];
  /** Milliseconds left per row, and the full time it started with. */
  rowTime: number[];
  rowTimeMax: number[];
  score: number;
  /** Exact rows cleared so far; drives the level. */
  exactRows: number;
  /** Consecutive exact rows without a timeout. */
  streak: number;
  strikes: number;
  over: boolean;
}

export interface ClearPlan {
  rows: number[];
  gain: number;
}

export interface Hint {
  row: number;
  /** Bits (as a byte) still missing from the row. */
  mask: number;
}

export const currentLevel = (state: GameState): number => levelOf(state.exactRows);

function resetTimer(state: GameState, row: number): void {
  state.rowTime[row] = state.rowTimeMax[row] = rowTimeMs(currentLevel(state));
}

export function newGame(rng: Rng): GameState {
  const state: GameState = {
    grid: emptyGrid(),
    targets: new Array<number>(N).fill(0),
    rowTime: new Array<number>(N).fill(0),
    rowTimeMax: new Array<number>(N).fill(0),
    score: 0,
    exactRows: 0,
    streak: 0,
    strikes: 0,
    over: false,
  };
  for (let r = 0; r < N; r++) {
    state.targets[r] = pickTarget({ filled: 0, used: state.targets, level: 0, rng })!;
    resetTimer(state, r);
  }
  return state;
}

/** Places a shape if it fits and awards its points. Returns whether it was placed. */
export function placeShape(state: GameState, shape: Shape, r0: number, c0: number): boolean {
  if (!fits(state.grid, shape, r0, c0)) return false;
  stamp(state.grid, shape, r0, c0);
  state.score += placementPoints(shape);
  return true;
}

/** Rows that exactly match their target and what clearing them is worth. Null when none do. */
export function planClear(state: GameState): ClearPlan | null {
  const rows: number[] = [];
  const points: number[] = [];
  for (let r = 0; r < N; r++) {
    if (rowValue(state.grid, r) !== state.targets[r]) continue;
    rows.push(r);
    points.push(exactRowPoints(state.targets[r]!, state.rowTime[r]! / state.rowTimeMax[r]!));
  }
  return rows.length ? { rows, gain: clearPoints(points, state.streak) } : null;
}

/** Clears the planned rows, pays out, and gives them fresh targets and timers. */
export function commitClear(state: GameState, plan: ClearPlan, rng: Rng): { leveledUp: boolean } {
  const before = currentLevel(state);
  for (const r of plan.rows) state.grid[r]!.fill(0);
  state.score += plan.gain;
  state.exactRows += plan.rows.length;
  state.streak += 1;
  for (const r of plan.rows) state.targets[r] = 0;
  for (const r of plan.rows) {
    state.targets[r] = pickTarget({ filled: 0, used: state.targets, level: currentLevel(state), rng })!;
    resetTimer(state, r);
  }
  return { leveledUp: currentLevel(state) > before };
}

/**
 * A row's timer ran out: -25 points, a strike, the streak resets, and the row gets a new target
 * it can still reach. A completely full row can't reach any target, so it is wiped first.
 */
export function expireRow(state: GameState, row: number, rng: Rng): void {
  state.score = Math.max(0, state.score - TIMEOUT_PENALTY);
  state.strikes += 1;
  state.streak = 0;
  state.targets[row] = 0;
  const level = currentLevel(state);
  let target = pickTarget({ filled: rowValue(state.grid, row), used: state.targets, level, rng });
  if (target === undefined) {
    state.grid[row]!.fill(0);
    target = pickTarget({ filled: 0, used: state.targets, level, rng })!;
  }
  state.targets[row] = target;
  resetTimer(state, row);
  if (state.strikes >= MAX_STRIKES) state.over = true;
}

/** Advances every row's timer. Returns the rows that timed out (stops once the game is over). */
export function tickTimers(state: GameState, dtMs: number, rng: Rng): number[] {
  const expired: number[] = [];
  for (let r = 0; r < N && !state.over; r++) {
    state.rowTime[r]! -= dtMs;
    if (state.rowTime[r]! <= 0) {
      expireRow(state, r, rng);
      expired.push(r);
    }
  }
  return expired;
}

/** The reachable row that is closest to its target, or null if every row is matched or dead. */
export function findHint(state: GameState): Hint | null {
  let best: Hint | null = null;
  let bestMissing = Infinity;
  for (let r = 0; r < N; r++) {
    const v = rowValue(state.grid, r);
    const t = state.targets[r]!;
    if (isDead(v, t) || v === t) continue;
    const missing = popcount(t & ~v);
    if (missing < bestMissing) {
      bestMissing = missing;
      best = { row: r, mask: t & ~v };
    }
  }
  return best;
}

export function chargeHint(state: GameState): void {
  state.score = Math.max(0, state.score - HINT_COST);
}
