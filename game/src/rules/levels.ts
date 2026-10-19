import { LEVEL_NAMES, ROWS_PER_LEVEL, ROW_SECONDS } from "./constants";

/** Level index from the number of exact rows cleared (0-based; the UI shows level + 1). */
export function levelOf(exactRows: number): number {
  return Math.floor(exactRows / ROWS_PER_LEVEL);
}

/** Named tiers stop at "Super hard"; higher levels keep that name. */
const named = (level: number): number => Math.min(level, LEVEL_NAMES.length - 1);

export function levelName(level: number): string {
  return LEVEL_NAMES[named(level)]!;
}

export function rowSeconds(level: number): number {
  return ROW_SECONDS[named(level)]!;
}

export function rowTimeMs(level: number): number {
  return rowSeconds(level) * 1000;
}

/** Exact rows done toward the next level, 0..ROWS_PER_LEVEL-1. */
export function levelProgress(exactRows: number): number {
  return exactRows % ROWS_PER_LEVEL;
}
