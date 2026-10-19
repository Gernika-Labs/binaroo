import { describe, expect, it } from "vitest";
import { popcount } from "../src/rules/board";
import { mulberry32 } from "../src/rules/rng";
import { pickTarget } from "../src/rules/targets";

describe("pickTarget", () => {
  it("never repeats a target another row uses", () => {
    const rng = mulberry32(1);
    const used = [1, 2, 3, 4, 5, 6, 7];
    for (let i = 0; i < 200; i++) {
      const t = pickTarget({ filled: 0, used, level: 0, rng })!;
      expect(used).not.toContain(t);
    }
  });

  it("keeps the filled bits reachable and differs from them", () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 300; i++) {
      const filled = Math.floor(rng() * 255);
      const t = pickTarget({ filled, used: [], level: 3, rng })!;
      expect(filled & ~t).toBe(0);
      expect(t).not.toBe(filled);
    }
  });

  it("prefers few set bits at low levels and allows more as the level rises", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 200; i++) {
      expect(popcount(pickTarget({ filled: 0, used: [], level: 0, rng })!)).toBeLessThanOrEqual(2);
    }
    let sawFive = false;
    for (let i = 0; i < 400; i++) {
      const t = pickTarget({ filled: 0, used: [], level: 3, rng })!;
      expect(popcount(t)).toBeLessThanOrEqual(5);
      if (popcount(t) === 5) sawFive = true;
    }
    expect(sawFive).toBe(true);
  });

  it("falls back to any reachable target when the filled bits already exceed the preference", () => {
    const rng = mulberry32(4);
    const t = pickTarget({ filled: 0b0111, used: [], level: 0, rng })!; // 3 bits, preference is 2
    expect(0b0111 & ~t).toBe(0);
    expect(t).not.toBe(0b0111);
  });

  it("returns undefined for a full row, which can't reach any other target", () => {
    expect(pickTarget({ filled: 255, used: [], level: 0, rng: mulberry32(5) })).toBeUndefined();
  });
});
