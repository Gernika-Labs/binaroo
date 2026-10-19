// Draws the app icon and splash sources into resources/ (run via `npm run assets`).
// The mark is a 2x2 grid of bits (0 1 / 1 0) in the 1A Terminal colours.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BG = "#070d1a";
const LIT = "#7aa2ff";
const DIM = "#16233d";
const DIM_INK = "#3a4d78";
mkdirSync("resources", { recursive: true });

const one = (cx, cy, ink) => `
  <rect x="${cx - 23}" y="${cy - 85}" width="46" height="170" fill="${ink}"/>
  <polygon points="${cx - 62},${cy - 52} ${cx - 23},${cy - 85} ${cx - 23},${cy - 30}" fill="${ink}"/>
  <rect x="${cx - 58}" y="${cy + 51}" width="116" height="34" fill="${ink}"/>`;
const zero = (cx, cy, ink) =>
  `<rect x="${cx - 52}" y="${cy - 82}" width="104" height="164" rx="52" fill="none" stroke="${ink}" stroke-width="38"/>`;

/** The mark on a 1024 canvas, scaled about the centre. */
function mark(scale) {
  const size = 330, gap = 40, total = size * 2 + gap, o = (1024 - total) / 2;
  const cell = (col, row, lit, digit) => {
    const x = o + col * (size + gap), y = o + row * (size + gap), cx = x + size / 2, cy = y + size / 2;
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="40" fill="${lit ? LIT : DIM}"/>` +
      (digit === 1 ? one(cx, cy, lit ? BG : DIM_INK) : zero(cx, cy, lit ? BG : DIM_INK));
  };
  return `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${cell(0, 0, false, 0)}${cell(1, 0, true, 1)}${cell(0, 1, true, 1)}${cell(1, 1, false, 0)}</g>`;
}

const svg = (w, h, inner, bg) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${inner}</svg>`);
const png = (name, buf) => sharp(buf).png().toFile(`resources/${name}`);

await png("icon-only.png", svg(1024, 1024, mark(1), BG));
await png("icon-foreground.png", svg(1024, 1024, mark(0.62)));
await png("icon-background.png", svg(1024, 1024, "", BG));
// splash: the mark centred on a 2732 canvas at about a fifth of its width
const splashInner = `<g transform="translate(${(2732 - 1024 * 0.55) / 2} ${(2732 - 1024 * 0.55) / 2}) scale(0.55)">${mark(1)}</g>`;
await png("splash.png", svg(2732, 2732, splashInner, BG));
await png("splash-dark.png", svg(2732, 2732, splashInner, BG));
console.log("resources written");
