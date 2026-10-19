import { describe, expect, it } from "vitest";
import { mulberry32, pick } from "../src/rules/rng";

describe("mulberry32", () => {
  it("is deterministic per seed and stays in [0, 1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(mulberry32(7)()).not.toBe(mulberry32(8)());
  });
  it("pick returns undefined for an empty list", () => {
    expect(pick([], mulberry32(1))).toBeUndefined();
    expect(pick(["x"], mulberry32(1))).toBe("x");
  });
});
