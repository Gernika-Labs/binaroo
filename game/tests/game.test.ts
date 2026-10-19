import { beforeEach, describe, expect, it } from "vitest";
import { isDead, rowValue } from "../src/rules/board";
import { MAX_STRIKES, N, TIMEOUT_PENALTY } from "../src/rules/constants";
import {
  type GameState,
  chargeHint,
  commitClear,
  currentLevel,
  expireRow,
  findHint,
  newGame,
  placeShape,
  planClear,
  tickTimers,
} from "../src/rules/game";
import { mulberry32 } from "../src/rules/rng";
import { SHAPES } from "../src/rules/shapes";

const single = SHAPES[0]!;
const line4 = SHAPES.find((s) => s.length === 4 && s.every((c) => c[0] === 0))!;

let state: GameState;
let rng = mulberry32(42);
beforeEach(() => {
  rng = mulberry32(42);
  state = newGame(rng);
});

/** Places singles to spell `value` in a row. */
function spell(row: number, value: number) {
  for (let c = 0; c < N; c++) if (value & (128 >> c)) placeShape(state, single, row, c);
}

describe("newGame", () => {
  it("starts empty with distinct targets and full timers", () => {
    expect(state.grid.every((r) => r.every((c) => c === 0))).toBe(true);
    expect(new Set(state.targets).size).toBe(N);
    expect(state.targets.every((t) => t >= 1 && t <= 255)).toBe(true);
    expect(state.rowTime).toEqual(new Array(N).fill(60_000));
    expect(state).toMatchObject({ score: 0, exactRows: 0, streak: 0, strikes: 0, over: false });
  });
});

describe("placeShape", () => {
  it("fills cells and pays the shape's points", () => {
    expect(placeShape(state, line4, 0, 0)).toBe(true);
    expect(rowValue(state.grid, 0)).toBe(0b11110000);
    expect(state.score).toBe(8);
  });
  it("changes nothing when the shape does not fit", () => {
    placeShape(state, single, 0, 0);
    const score = state.score;
    expect(placeShape(state, line4, 0, 0)).toBe(false);
    expect(placeShape(state, line4, 0, 6)).toBe(false);
    expect(state.score).toBe(score);
    expect(rowValue(state.grid, 0)).toBe(128);
  });
});

describe("clearing", () => {
  it("clears a row only on an exact match", () => {
    state.targets[3] = 0b101;
    spell(3, 0b100);
    expect(planClear(state)).toBeNull();
    spell(3, 0b001);
    const plan = planClear(state)!;
    expect(plan.rows).toEqual([3]);
    // 50 + floor(5/5) + 30 for a full timer
    expect(plan.gain).toBe(81);
  });

  it("does NOT clear a row filled completely with the wrong target (the single-square exploit)", () => {
    state.targets[0] = 1;
    for (let c = 0; c < N; c++) placeShape(state, single, 0, c);
    expect(rowValue(state.grid, 0)).toBe(255);
    expect(planClear(state)).toBeNull();
  });

  it("does NOT clear a full column", () => {
    state.targets = [3, 5, 6, 9, 10, 12, 17, 18];
    for (let r = 0; r < N; r++) placeShape(state, single, r, 5);
    expect(planClear(state)).toBeNull();
  });

  it("pays a time bonus that shrinks as the timer runs down", () => {
    state.targets[1] = 1;
    state.rowTime[1] = state.rowTimeMax[1]! / 2;
    spell(1, 1);
    expect(planClear(state)!.gain).toBe(50 + 0 + 15);
  });

  it("commits: clears the row, scores, counts it, retargets reachably, resets the timer", () => {
    state.targets[2] = 1;
    state.rowTime[2] = 1000;
    spell(2, 1);
    const scoreBefore = state.score;
    const plan = planClear(state)!;
    const { leveledUp } = commitClear(state, plan, rng);
    expect(leveledUp).toBe(false);
    expect(rowValue(state.grid, 2)).toBe(0);
    expect(state.score).toBe(scoreBefore + plan.gain);
    expect(state.exactRows).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.targets[2]).not.toBe(1);
    expect(new Set(state.targets).size).toBe(N);
    expect(state.rowTime[2]).toBe(60_000);
  });

  it("raises the streak bonus on consecutive clears", () => {
    state.targets[0] = 1;
    spell(0, 1);
    commitClear(state, planClear(state)!, rng);
    state.targets[0] = 1;
    state.rowTime[0] = state.rowTimeMax[0]!;
    spell(0, 1);
    expect(planClear(state)!.gain).toBe(Math.round(80 * 1.1));
  });

  it("multiplies rows cleared at once", () => {
    state.targets[0] = 1;
    state.targets[1] = 2;
    spell(0, 1);
    spell(1, 2);
    const plan = planClear(state)!;
    expect(plan.rows).toEqual([0, 1]);
    expect(plan.gain).toBe((80 + 80) * 2);
  });

  it("levels up on the 5th exact row and switches to the next level's time", () => {
    state.exactRows = 4;
    state.targets[0] = 1;
    spell(0, 1);
    const { leveledUp } = commitClear(state, planClear(state)!, rng);
    expect(leveledUp).toBe(true);
    expect(currentLevel(state)).toBe(1);
    expect(state.rowTime[0]).toBe(45_000);
  });
});

describe("timers", () => {
  it("counts down without expiring early", () => {
    expect(tickTimers(state, 1000, rng)).toEqual([]);
    expect(state.rowTime[0]).toBe(59_000);
  });

  it("expires a row: -25 points (not below 0), a strike, streak reset, reachable new target", () => {
    state.score = 10;
    state.streak = 3;
    state.targets[4] = 64;
    spell(4, 0b00000011); // dead against 64
    state.rowTime[4] = 50;
    const expired = tickTimers(state, 100, rng);
    expect(expired).toEqual([4]);
    expect(state.score).toBe(0);
    expect(state.strikes).toBe(1);
    expect(state.streak).toBe(0);
    expect(isDead(rowValue(state.grid, 4), state.targets[4]!)).toBe(false);
    expect(state.targets[4]).not.toBe(rowValue(state.grid, 4));
    expect(state.rowTime[4]).toBe(60_000);
  });

  it("takes exactly the penalty from a bigger score", () => {
    state.score = 100;
    expireRow(state, 0, rng);
    expect(state.score).toBe(100 - TIMEOUT_PENALTY);
  });

  it("wipes a completely full row, since no target can match it", () => {
    for (let c = 0; c < N; c++) placeShape(state, single, 6, c);
    expireRow(state, 6, rng);
    expect(rowValue(state.grid, 6)).toBe(0);
    expect(state.targets[6]).toBeGreaterThan(0);
  });

  it("ends the game on the third strike and stops ticking", () => {
    for (let i = 0; i < MAX_STRIKES - 1; i++) expireRow(state, i, rng);
    expect(state.over).toBe(false);
    state.rowTime.fill(1);
    const expired = tickTimers(state, 10, rng);
    expect(state.strikes).toBe(MAX_STRIKES);
    expect(state.over).toBe(true);
    expect(expired).toHaveLength(1);
  });
});

describe("hints", () => {
  it("points at the reachable row with the fewest missing bits", () => {
    state.targets = [0b111, 0b11, 0b1000, 0b10, 0b100, 0b1, 0b1100, 0b11000];
    spell(0, 0b001);
    spell(1, 0b01); // missing one bit of two
    expect(findHint(state)).toEqual({ row: 1, mask: 0b10 });
  });

  it("ignores dead and already-matched rows", () => {
    state.targets = [1, 2, 4, 8, 16, 32, 64, 128];
    for (let r = 0; r < N; r++) placeShape(state, single, r, (r + 1) % N); // a wrong bit in every row
    expect(findHint(state)).toBeNull();
    // a matched row is not a hint either
    state = newGame(rng);
    state.targets[0] = 1;
    spell(0, 1);
    state.targets.fill(0, 1); // other rows: target 0 never matches, but keep them out of play
    state.targets = [1, ...state.targets.slice(1).map((_, i) => 200 + i)];
    placeShape(state, single, 1, 0); // row 1 = 128, target 200 = 11001000 contains 128: reachable
    expect(findHint(state)?.row).toBe(1);
  });

  it("charges 15 points but never below zero", () => {
    state.score = 20;
    chargeHint(state);
    expect(state.score).toBe(5);
    chargeHint(state);
    expect(state.score).toBe(0);
  });
});
