import { EXACT_ROW_BASE, MAX_TIME_BONUS, STREAK_CAP, STREAK_STEP } from "./constants";

/** Points for one exact row: base + target/5 + up to 30 for the time left (0..1). */
export function exactRowPoints(target: number, timeLeft: number): number {
  return EXACT_ROW_BASE + Math.floor(target / 5) + Math.round(MAX_TIME_BONUS * timeLeft);
}

/**
 * Total for rows cleared together: the rows' points, doubled/tripled... by the number of rows
 * when there are two or more, then raised by the streak of earlier exact rows.
 */
export function clearPoints(rowPoints: readonly number[], streak: number): number {
  let gain = rowPoints.reduce((a, b) => a + b, 0);
  if (rowPoints.length >= 2) gain *= rowPoints.length;
  return Math.round(gain * (1 + STREAK_STEP * Math.min(streak, STREAK_CAP)));
}
