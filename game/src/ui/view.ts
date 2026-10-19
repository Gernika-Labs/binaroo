import { fitsAnywhere, isDead, rowValue } from "../rules/board";
import { MAX_STRIKES, N, ROWS_PER_LEVEL } from "../rules/constants";
import { type GameState, type Hint, currentLevel } from "../rules/game";
import { levelName, levelProgress } from "../rules/levels";
import { type Shape, SHAPES, bbox, placementPoints, tierOf } from "../rules/shapes";
import { byId } from "./dom";

export interface Preview {
  cells: [number, number][];
  valid: boolean;
  r0: number;
  c0: number;
}

export interface ViewModel {
  state: GameState;
  best: number;
  selected: number | null;
  preview: Preview | null;
  hint: Hint | null;
  /** "row,col" -> animation delay in ms for cells that are flashing away. */
  clearing: ReadonlyMap<string, number> | null;
}

let cellEls: HTMLElement[][] = [];
let sideEls: HTMLElement[] = [];

function shapeIsFilled(shape: Shape, r: number, c: number): boolean {
  return shape.some(([sr, sc]) => sr === r && sc === c);
}

/** Creates the place-value header, the 8x8 cells and each row's readout. */
export function buildBoard(): void {
  const cells = byId("cells");
  const labels = byId("labels");
  cells.innerHTML = "";
  labels.innerHTML = "";
  cellEls = [];
  sideEls = [];
  for (const v of [128, 64, 32, 16, 8, 4, 2, 1]) {
    const s = document.createElement("span");
    s.textContent = String(v);
    labels.appendChild(s);
  }
  const t = document.createElement("span");
  t.textContent = "live / target";
  t.style.fontSize = "9px";
  labels.appendChild(t);
  for (let r = 0; r < N; r++) {
    cellEls.push([]);
    for (let c = 0; c < N; c++) {
      const d = document.createElement("div");
      d.className = "cell";
      cells.appendChild(d);
      cellEls[r]!.push(d);
    }
    const side = document.createElement("div");
    side.className = "side";
    side.innerHTML = '<span class="v"></span><span class="b"></span><span class="tb"><u></u></span>';
    cells.appendChild(side);
    sideEls.push(side);
  }
}

/** The shape picker: every shape, with its points. */
export function buildPicker(): void {
  const tray = byId("tray");
  tray.innerHTML = "";
  SHAPES.forEach((shape, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.i = String(i);
    const { w, h } = bbox(shape);
    const pc = document.createElement("div");
    pc.className = "pc";
    pc.style.gridTemplateColumns = `repeat(${w},11px)`;
    pc.style.gridAutoRows = "11px";
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const q = document.createElement("i");
        if (!shapeIsFilled(shape, r, c)) q.className = "e";
        pc.appendChild(q);
      }
    }
    const pts = document.createElement("span");
    pts.className = `pt t${tierOf(shape)}`;
    pts.textContent = `+${placementPoints(shape)}`;
    slot.appendChild(pc);
    slot.appendChild(pts);
    tray.appendChild(slot);
  });
}

/** Draws the ghost that follows the pointer while a shape is dragged. */
export function buildGhost(shape: Shape): void {
  const g = geometry();
  const { w, h } = bbox(shape);
  const ghost = byId("ghost");
  ghost.style.display = "grid";
  ghost.style.gridTemplateColumns = `repeat(${w},${g.w}px)`;
  ghost.style.gridAutoRows = `${g.w}px`;
  ghost.style.gap = `${g.sx - g.w}px`;
  ghost.innerHTML = "";
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const q = document.createElement("i");
      if (!shapeIsFilled(shape, r, c)) q.className = "e";
      ghost.appendChild(q);
    }
  }
}

export function drawTimers(state: GameState): void {
  for (let r = 0; r < N; r++) {
    const fraction = Math.max(0, state.rowTime[r]! / state.rowTimeMax[r]!);
    const bar = sideEls[r]!.children[2] as HTMLElement;
    (bar.firstChild as HTMLElement).style.width = `${fraction * 100}%`;
    bar.className = `tb${fraction < 0.25 ? " crit" : fraction < 0.5 ? " warn" : ""}`;
  }
}

export function render(vm: ViewModel): void {
  const { state, preview, hint, clearing } = vm;
  const add = new Array<number>(N).fill(0);
  const previewCells = new Set<string>();
  if (preview) {
    for (const [r, c] of preview.cells) {
      previewCells.add(`${r},${c}`);
      if (preview.valid) add[r]! |= 128 >> c;
    }
  }
  for (let r = 0; r < N; r++) {
    const v = rowValue(state.grid, r);
    const t = state.targets[r]!;
    const withPreview = v | add[r]!;
    const status = withPreview === t ? "hit" : isDead(withPreview, t) ? "over" : "";
    const rowDead = isDead(v, t);
    for (let c = 0; c < N; c++) {
      const el = cellEls[r]![c]!;
      const key = `${r},${c}`;
      const filled = state.grid[r]![c] === 1;
      let cls = "cell";
      if (filled) cls += ` f${rowDead ? " over" : ""}`;
      if (previewCells.has(key) && preview) {
        cls += " pv";
        if (!preview.valid) cls += " invalid";
        else if (status === "hit") cls += " hit";
        else if (status === "over") cls += " bust";
      }
      if (hint && hint.row === r && hint.mask & (128 >> c) && !filled) cls += " hint";
      const delay = clearing?.get(key);
      if (delay !== undefined) {
        cls += " clr";
        el.style.setProperty("--d", `${delay}ms`);
      } else {
        el.style.removeProperty("--d");
      }
      const bit = filled || previewCells.has(key) ? "1" : "0";
      if (el.textContent !== bit) el.textContent = bit;
      el.className = cls;
    }
    const side = sideEls[r]!;
    side.className = `side ${status}`;
    side.children[0]!.innerHTML = `${withPreview}<i>/${t}</i>`;
    side.children[1]!.textContent = status === "over" ? "✗ impossible" : status === "hit" ? "✓ match" : "";
  }

  byId("score").textContent = String(state.score);
  byId("best").textContent = String(vm.best);
  const level = currentLevel(state);
  byId("lvl").textContent = levelName(level);
  byId("lvlL").textContent = `Lv ${level + 1} · ${levelProgress(state.exactRows)}/${ROWS_PER_LEVEL} rows`;
  let strikes = "";
  for (let k = 0; k < MAX_STRIKES; k++) strikes += k < state.strikes ? "✕" : "○";
  byId("strikes").textContent = strikes;

  Array.from(byId("tray").children).forEach((slot, i) => {
    slot.classList.toggle("sel", i === vm.selected);
    slot.classList.toggle("nofit", !fitsAnywhere(state.grid, SHAPES[i]!));
  });
  drawTimers(state);
}

/* geometry of the rendered board, used to map the pointer to cells */
export interface Geometry {
  x0: number;
  y0: number;
  sx: number;
  sy: number;
  w: number;
}

export function geometry(): Geometry {
  const a = cellEls[0]![0]!.getBoundingClientRect();
  const b = cellEls[0]![1]!.getBoundingClientRect();
  const c = cellEls[1]![0]!.getBoundingClientRect();
  return { x0: a.left, y0: a.top, sx: b.left - a.left, sy: c.top - a.top, w: a.width };
}

/** The top-left cell of `shape` when its centre is over the pointer at (x, y). */
export function anchorAt(x: number, y: number, shape: Shape): { r0: number; c0: number } {
  const g = geometry();
  const { w, h } = bbox(shape);
  const c = Math.floor((x - g.x0 + (g.sx - g.w) / 2) / g.sx);
  const r = Math.floor((y - g.y0 + (g.sy - g.w) / 2) / g.sy);
  return { r0: r - Math.floor(h / 2), c0: c - Math.floor(w / 2) };
}
