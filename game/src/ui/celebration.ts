import { CHEERS } from "../content";
import { N } from "../rules/constants";
import { pick } from "../rules/rng";
import { byId } from "./dom";
import { tone } from "./audio";

const PALETTE = ["#4cc9f0", "#4ade80", "#ffb703", "#ff6bd6", "#b388ff"];
const SHOW_MS = 2800;

/** Builds the wave of cells and the confetti once; `celebrate` just replays the animation. */
export function buildCelebration(): void {
  const grid = byId("lvGrid");
  const overlay = byId("lvOv");
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement("i");
      cell.style.setProperty("--d", `${(r + c) * 70}ms`);
      cell.style.setProperty("--k", PALETTE[(r + c) % PALETTE.length]!);
      grid.appendChild(cell);
    }
  }
  for (let n = 0; n < 28; n++) {
    const piece = document.createElement("b");
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--d", `${Math.random() * 1.8}s`);
    piece.style.setProperty("--t", `${1.6 + Math.random() * 1.4}s`);
    piece.style.setProperty("--k", PALETTE[n % PALETTE.length]!);
    overlay.appendChild(piece);
  }
}

export interface LevelUp {
  /** 1-based level number to show. */
  number: number;
  name: string;
  seconds: number;
}

/** Full-screen "Level N" celebration. Calls `done` when it ends or the player taps it. */
export function celebrate(level: LevelUp, done: () => void): void {
  const overlay = byId("lvOv");
  let finished = false;
  byId("lvNum").textContent = `Level ${level.number}`;
  byId("lvName").textContent = `${level.name} · ${level.seconds}s per row`;
  byId("lvMsg").textContent = pick(CHEERS, Math.random) ?? "";
  overlay.hidden = false;
  overlay.classList.remove("go");
  void overlay.offsetWidth; // restart the animations
  overlay.classList.add("go");
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.1), i * 110));
  const end = () => {
    if (finished) return;
    finished = true;
    overlay.hidden = true;
    overlay.classList.remove("go");
    done();
  };
  overlay.onclick = end;
  setTimeout(end, SHOW_MS);
}
