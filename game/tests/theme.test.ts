import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_CHOICES, resolveTheme } from "../src/theme/theme";

describe("resolveTheme", () => {
  it("follows the phone for System", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("ignores the phone for an explicit choice", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("offers System, Dark and Light", () => {
    expect(THEME_CHOICES).toEqual(["system", "dark", "light"]);
  });
});

/* WCAG contrast of the real tokens, so a colour tweak can't make text unreadable */
const css = readFileSync(new URL("../src/theme/tokens.css", import.meta.url), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]!] = m[2]!.trim();
  return tokens;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const themes = {
  dark: block(':root[data-theme="dark"]'),
  light: block(':root[data-theme="light"]'),
};

// [text token, background token, minimum ratio]. 4.5 is the WCAG AA bar for small text.
const pairs: [string, string, number][] = [
  ["ink", "bg", 7],
  ["dim", "bg", 4.5],
  ["dim", "board", 4.5],
  ["dim", "surf", 4.5],
  ["ink", "surf2", 4.5],
  ["dim", "surf2", 4.5],
  ["on-ink", "fill", 4.5], // the 1 in a filled cell
  ["acc-ink", "acc", 4.5], // button labels
  ["ok", "board", 4.5], // "✓ match"
  ["warn", "board", 4.5], // "✗ impossible"
  ["bad", "board", 4.5],
  ["on-ink", "warn", 4.5], // the 1 in a dead row
  ["off-ink", "cell", 1.5], // the 0 is meant to be quiet, but still visible
];

describe("theme contrast", () => {
  for (const [name, tokens] of Object.entries(themes)) {
    for (const [fg, bg, min] of pairs) {
      it(`${name}: ${fg} on ${bg} is at least ${min}:1`, () => {
        expect(tokens[fg], `--${fg} defined`).toBeDefined();
        expect(tokens[bg], `--${bg} defined`).toBeDefined();
        expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
      });
    }
  }

  it("defines the same tokens in both themes", () => {
    expect(Object.keys(themes.light).sort()).toEqual(Object.keys(themes.dark).sort());
  });
});
