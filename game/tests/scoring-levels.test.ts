import { describe, expect, it } from "vitest";
import { levelName, levelOf, levelProgress, rowSeconds, rowTimeMs } from "../src/rules/levels";
import { clearPoints, exactRowPoints } from "../src/rules/scoring";

describe("exactRowPoints", () => {
  it("is 50 + target/5 + up to 30 for time left", () => {
    expect(exactRowPoints(37, 1)).toBe(50 + 7 + 30);
    expect(exactRowPoints(37, 0.5)).toBe(50 + 7 + 15);
    expect(exactRowPoints(37, 0)).toBe(50 + 7);
    expect(exactRowPoints(1, 1)).toBe(80);
  });
});

describe("clearPoints", () => {
  it("returns the row points with no streak", () => {
    expect(clearPoints([87], 0)).toBe(87);
  });
  it("adds 10% per streak step, capped at 5", () => {
    expect(clearPoints([87], 2)).toBe(Math.round(87 * 1.2));
    expect(clearPoints([87], 5)).toBe(Math.round(87 * 1.5));
    expect(clearPoints([87], 20)).toBe(Math.round(87 * 1.5));
  });
  it("multiplies by the number of rows cleared together", () => {
    expect(clearPoints([87, 87], 0)).toBe(348);
    expect(clearPoints([10, 20, 30], 0)).toBe(180);
  });
});

describe("levels", () => {
  it("rises every 5 exact rows", () => {
    expect(levelOf(0)).toBe(0);
    expect(levelOf(4)).toBe(0);
    expect(levelOf(5)).toBe(1);
    expect(levelOf(24)).toBe(4);
    expect(levelOf(25)).toBe(5);
    expect(levelProgress(7)).toBe(2);
  });
  it("names the first five levels and keeps the last name after that", () => {
    expect([0, 1, 2, 3, 4].map(levelName)).toEqual(["Easy", "Normal", "Hard", "Expert", "Super hard"]);
    expect(levelName(9)).toBe("Super hard");
  });
  it("gives each row 60/45/35/25/18 seconds and stops shrinking", () => {
    expect([0, 1, 2, 3, 4, 8].map(rowSeconds)).toEqual([60, 45, 35, 25, 18, 18]);
    expect(rowTimeMs(1)).toBe(45_000);
  });
});
