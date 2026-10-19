import { N } from "./constants";
import type { Shape } from "./shapes";

/** grid[row][col] is 1 when filled. */
export type Grid = number[][];

export function emptyGrid(): Grid {
  return Array.from({ length: N }, () => new Array<number>(N).fill(0));
}

export function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/** The byte a row spells: column 0 is 128, column 7 is 1. */
export function rowValue(grid: Grid, row: number): number {
  let v = 0;
  for (let c = 0; c < N; c++) if (grid[row]![c]) v |= 128 >> c;
  return v;
}

/**
 * A row can no longer reach its target when it has a filled bit the target lacks:
 * bits can't be removed, so only a timeout resets it.
 */
export function isDead(value: number, target: number): boolean {
  return (value & ~target) !== 0;
}

export function fits(grid: Grid, shape: Shape, r0: number, c0: number): boolean {
  for (const [dr, dc] of shape) {
    const r = r0 + dr;
    const c = c0 + dc;
    if (r < 0 || c < 0 || r >= N || c >= N || grid[r]![c]) return false;
  }
  return true;
}

export function fitsAnywhere(grid: Grid, shape: Shape): boolean {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(grid, shape, r, c)) return true;
  return false;
}

/** Fills the shape's cells. The caller must have checked `fits`. */
export function stamp(grid: Grid, shape: Shape, r0: number, c0: number): void {
  for (const [dr, dc] of shape) grid[r0 + dr]![c0 + dc] = 1;
}
