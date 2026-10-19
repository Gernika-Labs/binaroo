import { FACTS } from "./content";
import { fits } from "./rules/board";
import { HINT_COST, HINT_IDLE_MS, N, TIMEOUT_PENALTY } from "./rules/constants";
import {
  type Hint,
  chargeHint,
  commitClear,
  currentLevel,
  findHint,
  newGame,
  placeShape,
  planClear,
  tickTimers,
} from "./rules/game";
import { levelName, rowSeconds } from "./rules/levels";
import { pick } from "./rules/rng";
import { SHAPES } from "./rules/shapes";
import { loadBest, loadSound, loadTheme, saveBest, saveSound, saveTheme } from "./settings/storage";
import { type ThemeChoice, applyTheme, watchSystemTheme } from "./theme/theme";
import { initAudio, isSoundEnabled, setSoundEnabled, tone } from "./ui/audio";
import { buildCelebration, celebrate } from "./ui/celebration";
import { byId } from "./ui/dom";
import { bindInput } from "./ui/input";
import { bindSettings } from "./ui/settings";
import { toast } from "./ui/toast";
import { type Preview, buildBoard, buildPicker, drawTimers, render as renderView } from "./ui/view";

const CLEAR_STEP_MS = 45;
const CLEAR_TAIL_MS = 400;
const TICK_MS = 100;

/** Wires the rules to the page: input, animations, timers, overlays. */
export function startApp(): void {
  const rng = Math.random;
  let state = newGame(rng);
  let best = loadBest();
  let busy = false;
  let paused = false;
  let selected: number | null = null;
  let preview: Preview | null = null;
  let hint: Hint | null = null;
  let clearing: Map<string, number> | null = null;
  let idleTimer: number | undefined;
  let lastTick = Date.now();

  const render = () => renderView({ state, best, selected, preview, hint, clearing });
  const interactive = () => !busy && !state.over && !paused;

  function syncBest(): void {
    if (state.score > best) {
      best = state.score;
      saveBest(best);
    }
  }

  function makePreview(i: number, r0: number, c0: number): Preview {
    const shape = SHAPES[i]!;
    return {
      cells: shape
        .map(([dr, dc]) => [r0 + dr, c0 + dc] as [number, number])
        .filter(([r, c]) => r >= 0 && c >= 0 && r < N && c < N),
      valid: fits(state.grid, shape, r0, c0),
      r0,
      c0,
    };
  }

  /* hints: after a while without a move, the closest reachable row glows (at a cost) */
  function clearHint(): void {
    hint = null;
    armHint();
  }
  function armHint(): void {
    clearTimeout(idleTimer);
    if (state.over || paused) return;
    idleTimer = window.setTimeout(() => {
      if (busy || input.dragging()) {
        armHint();
        return;
      }
      const found = findHint(state);
      if (!found) return;
      hint = found;
      chargeHint(state);
      toast(`Hint  −${HINT_COST}`, true);
      render();
    }, HINT_IDLE_MS);
  }

  /* placing and clearing */
  function place(i: number, r0: number, c0: number): void {
    placeShape(state, SHAPES[i]!, r0, c0);
    preview = null;
    hint = null;
    tone(330, 0.05, "triangle");
    resolveClears();
  }

  function resolveClears(): void {
    const plan = planClear(state);
    if (!plan) {
      render();
      armHint();
      return;
    }
    busy = true;
    toast(`Exact! +${plan.gain}${plan.rows.length >= 2 ? `  ×${plan.rows.length} combo` : ""}`);
    clearing = new Map();
    for (const r of plan.rows) {
      for (let c = 0; c < N; c++) {
        clearing.set(`${r},${c}`, c * CLEAR_STEP_MS);
        if (state.grid[r]![c]) {
          const freq = 220 * Math.pow(2, (7 - c) / 4);
          setTimeout(() => tone(freq, 0.09, "sine", 0.12), c * CLEAR_STEP_MS);
        }
      }
    }
    render();
    setTimeout(() => {
      clearing = null;
      const { leveledUp } = commitClear(state, plan, rng);
      syncBest();
      const next = () => {
        busy = false;
        resolveClears();
      };
      if (leveledUp) {
        const level = currentLevel(state);
        celebrate({ number: level + 1, name: levelName(level), seconds: rowSeconds(level) }, next);
      } else {
        next();
      }
    }, N * CLEAR_STEP_MS + CLEAR_TAIL_MS);
  }

  /* row timers */
  function tick(): void {
    const now = Date.now();
    const dt = Math.min(250, now - lastTick); // a backgrounded tab shouldn't burn the timers
    lastTick = now;
    if (state.over || paused || busy) return;
    const expired = tickTimers(state, dt, rng);
    if (!expired.length) {
      drawTimers(state);
      return;
    }
    hint = null;
    tone(140, 0.25, "sawtooth", 0.1);
    toast(`Time's up  −${TIMEOUT_PENALTY} · row reset`, true);
    render();
    if (state.over) endGame();
  }

  function endGame(): void {
    syncBest();
    render();
    byId("finalScore").textContent = String(state.score);
    byId("fact").textContent = `Bit fact: ${pick(FACTS, rng) ?? ""}`;
    setTimeout(() => {
      byId("overOv").hidden = false;
    }, 500);
  }

  function restart(): void {
    state = newGame(rng);
    busy = false;
    paused = false;
    selected = null;
    preview = null;
    hint = null;
    clearing = null;
    byId("overOv").hidden = true;
    byId("pauseOv").hidden = true;
    render();
    armHint();
  }

  /* input */
  const input = bindInput({
    interactive,
    selected: () => selected,
    press(i) {
      initAudio();
      clearHint();
      const was = selected === i;
      selected = i;
      render();
      return was;
    },
    hover(i, r0, c0) {
      preview = makePreview(i, r0, c0);
      render();
    },
    drop(i) {
      const p = preview;
      preview = null;
      if (p?.valid) place(i, p.r0, p.c0);
      else render();
    },
    release(wasSelected) {
      if (wasSelected) selected = null;
      render();
    },
    cancel() {
      preview = null;
      render();
    },
    leave() {
      if (preview) {
        preview = null;
        render();
      }
    },
    canPlace: (i, r0, c0) => fits(state.grid, SHAPES[i]!, r0, c0),
    tap(i, r0, c0) {
      preview = null;
      clearHint();
      place(i, r0, c0);
    },
    reject: () => toast("Doesn't fit there", true),
  });

  /* settings */
  let theme: ThemeChoice = loadTheme();
  let pausedBeforeSettings = false;
  bindSettings({
    theme: () => theme,
    setTheme(choice) {
      theme = choice;
      saveTheme(choice);
      applyTheme(choice);
    },
    sound: isSoundEnabled,
    setSound(on) {
      initAudio();
      setSoundEnabled(on);
      saveSound(on);
    },
    opened() {
      pausedBeforeSettings = paused;
      paused = true;
      clearTimeout(idleTimer);
    },
    closed() {
      paused = pausedBeforeSettings;
      if (!paused) armHint();
    },
  });
  watchSystemTheme(() => {
    if (theme === "system") applyTheme("system");
  });

  /* header buttons and overlays */
  byId("pause").onclick = () => {
    if (state.over || busy) return;
    paused = true;
    clearTimeout(idleTimer);
    byId("pauseOv").hidden = false;
  };
  byId("resume").onclick = () => {
    paused = false;
    byId("pauseOv").hidden = true;
    armHint();
  };
  byId("restartP").onclick = restart;
  byId("restart").onclick = restart;
  window.addEventListener("resize", render);

  setSoundEnabled(loadSound());
  applyTheme(theme);
  buildBoard();
  buildPicker();
  buildCelebration();
  render();
  armHint();
  setInterval(tick, TICK_MS);
}
