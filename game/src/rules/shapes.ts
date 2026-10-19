import { TIER_MULTIPLIER } from "./constants";

export type Cell = readonly [row: number, col: number];
export type Shape = readonly Cell[];
/** 0 single, 1 short line, 2 long line / square / small L, 3 big L. */
export type Tier = 0 | 1 | 2 | 3;

function normalize(cells: readonly Cell[]): Cell[] {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC] as const);
}

function rotate(cells: readonly Cell[]): Cell[] {
  return normalize(cells.map(([r, c]) => [c, -r] as const));
}

function fromRows(rows: readonly string[]): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((line, r) => {
    for (let c = 0; c < line.length; c++) if (line[c] === "#") cells.push([r, c]);
  });
  return cells;
}

const keyOf = (cells: readonly Cell[]): string =>
  cells
    .map(([r, c]) => `${r},${c}`)
    .sort()
    .join("|");

export function bbox(shape: Shape): { w: number; h: number } {
  return {
    w: Math.max(...shape.map((c) => c[1])) + 1,
    h: Math.max(...shape.map((c) => c[0])) + 1,
  };
}

export function tierOf(shape: Shape): Tier {
  const { w, h } = bbox(shape);
  const n = shape.length;
  if (n === 1) return 0;
  if (w === 1 || h === 1) return n <= 3 ? 1 : 2;
  return (n === 4 && w === 2 && h === 2) || n === 3 ? 2 : 3;
}

/** Points for placing the shape. */
export function placementPoints(shape: Shape): number {
  return Math.round(shape.length * TIER_MULTIPLIER[tierOf(shape)]);
}

function buildShapes(): Shape[] {
  const out: Cell[][] = [];
  const add = (rows: string[]) => out.push(normalize(fromRows(rows)));
  add(["#"]);
  add(["##"]);
  add(["#", "#"]);
  add(["###"]);
  add(["#", "#", "#"]);
  add(["####"]);
  add(["#", "#", "#", "#"]);
  add(["##", "##"]);
  const ls: Cell[][] = [
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
  ];
  for (const base of ls) {
    let cells = base;
    for (let i = 0; i < 4; i++) {
      if (!out.some((s) => keyOf(s) === keyOf(cells))) out.push(cells);
      cells = rotate(cells);
    }
  }
  // easiest first (stable sort keeps the generation order for ties)
  return out.sort((a, b) => placementPoints(a) - placementPoints(b) || a.length - b.length);
}

/** Every shape the player can pick, ordered from easy to super hard. */
export const SHAPES: readonly Shape[] = buildShapes();
