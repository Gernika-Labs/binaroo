import { describe, expect, it } from "vitest";
import { SHAPES, bbox, placementPoints, tierOf } from "../src/rules/shapes";

const find = (rows: string[]) =>
  SHAPES.find((s) => {
    const cells = new Set(s.map(([r, c]) => `${r},${c}`));
    const want = new Set<string>();
    rows.forEach((line, r) => [...line].forEach((ch, c) => ch === "#" && want.add(`${r},${c}`)));
    return cells.size === want.size && [...want].every((k) => cells.has(k));
  })!;

describe("shapes", () => {
  it("has 16 distinct shapes, all normalised to the top-left", () => {
    expect(SHAPES).toHaveLength(16);
    const keys = SHAPES.map((s) =>
      s.map(([r, c]) => `${r},${c}`).sort().join("|"),
    );
    expect(new Set(keys).size).toBe(16);
    for (const s of SHAPES) {
      expect(Math.min(...s.map((c) => c[0]))).toBe(0);
      expect(Math.min(...s.map((c) => c[1]))).toBe(0);
    }
  });

  it("is ordered from easy to super hard", () => {
    const pts = SHAPES.map(placementPoints);
    expect(pts).toEqual([1, 3, 3, 5, 5, 6, 6, 6, 6, 8, 8, 8, 12, 12, 12, 12]);
  });

  it("assigns difficulty tiers", () => {
    expect(tierOf(find(["#"]))).toBe(0);
    expect(tierOf(find(["##"]))).toBe(1);
    expect(tierOf(find(["###"]))).toBe(1);
    expect(tierOf(find(["####"]))).toBe(2);
    expect(tierOf(find(["##", "##"]))).toBe(2);
    expect(tierOf(find(["#.", "##"]))).toBe(2); // small L
    expect(tierOf(find(["#.", "#.", "##"]))).toBe(3); // big L
  });

  it("pays 1 point for a single square and more for harder shapes", () => {
    expect(placementPoints(find(["#"]))).toBe(1);
    expect(placementPoints(find(["####"]))).toBe(8);
    expect(placementPoints(find(["#.", "#.", "##"]))).toBe(12);
  });

  it("measures the bounding box", () => {
    expect(bbox(find(["####"]))).toEqual({ w: 4, h: 1 });
    expect(bbox(find(["#.", "#.", "##"]))).toEqual({ w: 2, h: 3 });
  });
});
