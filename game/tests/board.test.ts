import { describe, expect, it } from "vitest";
import { emptyGrid, fits, fitsAnywhere, isDead, popcount, rowValue, stamp } from "../src/rules/board";
import { SHAPES } from "../src/rules/shapes";

const single = SHAPES[0]!;
const line4 = SHAPES.find((s) => s.length === 4 && s.every((c) => c[0] === 0))!;

describe("rowValue", () => {
  it("reads column 0 as 128 and column 7 as 1", () => {
    const g = emptyGrid();
    g[2]![0] = 1;
    expect(rowValue(g, 2)).toBe(128);
    g[2]![7] = 1;
    expect(rowValue(g, 2)).toBe(129);
    g[2]!.fill(1);
    expect(rowValue(g, 2)).toBe(255);
  });
});

describe("isDead", () => {
  it("is dead when a filled bit is missing from the target", () => {
    expect(isDead(3, 18)).toBe(true); // 00000011 vs 00010010: the 1 bit
    expect(isDead(14, 34)).toBe(true); // 00001110 vs 00100010
    expect(isDead(2, 5)).toBe(true); // smaller than the target but wrong bit
  });
  it("is alive when the filled bits are a subset of the target, or equal to it", () => {
    expect(isDead(0, 37)).toBe(false);
    expect(isDead(32, 37)).toBe(false);
    expect(isDead(37, 37)).toBe(false);
  });
  it("treats a full row as dead unless the target is 255", () => {
    expect(isDead(255, 254)).toBe(true);
    expect(isDead(255, 255)).toBe(false);
  });
});

describe("placement", () => {
  it("rejects out-of-bounds and overlapping placements", () => {
    const g = emptyGrid();
    expect(fits(g, line4, 0, 4)).toBe(true);
    expect(fits(g, line4, 0, 5)).toBe(false); // runs off the right edge
    expect(fits(g, single, -1, 0)).toBe(false);
    expect(fits(g, single, 8, 0)).toBe(false);
    stamp(g, single, 0, 4);
    expect(fits(g, line4, 0, 4)).toBe(false);
    expect(fits(g, line4, 0, 0)).toBe(true);
  });

  it("finds whether a shape fits anywhere", () => {
    const g = emptyGrid();
    expect(fitsAnywhere(g, line4)).toBe(true);
    for (const row of g) row.fill(1);
    expect(fitsAnywhere(g, single)).toBe(false);
  });
});

describe("popcount", () => {
  it("counts set bits", () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(255)).toBe(8);
    expect(popcount(0b1010)).toBe(2);
  });
});
