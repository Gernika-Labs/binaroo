/** Board is N x N; a row's cells are the bits of a byte, column 0 = 128 ... column 7 = 1. */
export const N = 8;

export const LEVEL_NAMES = ["Easy", "Normal", "Hard", "Expert", "Super hard"] as const;
/** Seconds each row gets before it times out, per named level (levels past the last reuse it). */
export const ROW_SECONDS = [60, 45, 35, 25, 18] as const;
/** Exact rows needed to reach the next level. */
export const ROWS_PER_LEVEL = 5;

export const MAX_STRIKES = 3;
/** Points lost when a row's timer runs out. */
export const TIMEOUT_PENALTY = 25;
export const HINT_COST = 15;
export const HINT_IDLE_MS = 10_000;

/** Placement points = cells x multiplier of the shape's difficulty tier (0 easy ... 3 super hard). */
export const TIER_MULTIPLIER = [1, 1.5, 2, 3] as const;

export const EXACT_ROW_BASE = 50;
/** Extra points for an exact row when it is cleared with all of its time left. */
export const MAX_TIME_BONUS = 30;
/** Each consecutive exact row adds 10% to a clear, up to 5 of them. */
export const STREAK_STEP = 0.1;
export const STREAK_CAP = 5;
