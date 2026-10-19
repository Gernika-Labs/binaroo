import { SHAPES } from "../rules/shapes";
import { byId } from "./dom";
import { anchorAt, buildGhost, geometry } from "./view";
import { bbox } from "../rules/shapes";

/** What the pointer handling needs from the game controller. */
export interface InputHost {
  /** False while a clear animation plays, the game is paused or it is over. */
  interactive(): boolean;
  selected(): number | null;
  /** A shape slot was pressed. Returns whether it was already selected. */
  press(i: number): boolean;
  /** Show where shape `i` would land with its top-left cell at (r0, c0). */
  hover(i: number, r0: number, c0: number): void;
  /** A drag ended over the board: place if the preview is valid, otherwise just redraw. */
  drop(i: number): void;
  /** A press on a slot ended without a drag. */
  release(wasSelected: boolean): void;
  cancel(): void;
  leave(): void;
  canPlace(i: number, r0: number, c0: number): boolean;
  /** A tap on the board with a shape selected, where it fits. */
  tap(i: number, r0: number, c0: number): void;
  reject(): void;
}

interface Drag {
  i: number;
  wasSelected: boolean;
  startX: number;
  startY: number;
  moved: boolean;
  touch: boolean;
  id: number;
}

const DRAG_THRESHOLD = 8;
/** Touch drags lift the ghost above the finger so it stays visible. */
const TOUCH_LIFT_CELLS = 2.2;

export function bindInput(host: InputHost): { dragging(): boolean } {
  const tray = byId("tray");
  const board = byId("board");
  const ghost = byId("ghost");
  let drag: Drag | null = null;

  const hideGhost = () => {
    ghost.style.display = "none";
  };

  tray.addEventListener("pointerdown", (e) => {
    if (!host.interactive()) return;
    const slot = (e.target as HTMLElement).closest<HTMLElement>(".slot");
    if (!slot) return;
    const i = Number(slot.dataset.i);
    const wasSelected = host.press(i);
    drag = {
      i,
      wasSelected,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      touch: e.pointerType !== "mouse",
      id: e.pointerId,
    };
    try {
      slot.setPointerCapture(e.pointerId);
    } catch {
      /* some browsers refuse capture; the window listeners still work */
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      buildGhost(SHAPES[drag.i]!);
    }
    const g = geometry();
    const { w, h } = bbox(SHAPES[drag.i]!);
    const lift = drag.touch ? g.w * TOUCH_LIFT_CELLS : 0;
    const gw = w * g.sx - (g.sx - g.w);
    const gh = h * g.sy - (g.sy - g.w);
    const left = e.clientX - gw / 2;
    const top = e.clientY - lift - gh / 2;
    ghost.style.left = `${left}px`;
    ghost.style.top = `${top}px`;
    host.hover(drag.i, Math.round((top - g.y0) / g.sy), Math.round((left - g.x0) / g.sx));
  });

  window.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    hideGhost();
    if (d.moved) host.drop(d.i);
    else host.release(d.wasSelected);
  });

  window.addEventListener("pointercancel", () => {
    drag = null;
    hideGhost();
    host.cancel();
  });

  // hover preview for a selected shape (mouse)
  board.addEventListener("pointermove", (e) => {
    const sel = host.selected();
    if (drag || !host.interactive() || sel === null) return;
    const a = anchorAt(e.clientX, e.clientY, SHAPES[sel]!);
    host.hover(sel, a.r0, a.c0);
  });
  board.addEventListener("pointerleave", () => {
    if (!drag) host.leave();
  });

  // tap to place
  board.addEventListener("click", (e) => {
    const sel = host.selected();
    if (!host.interactive() || sel === null) return;
    const a = anchorAt(e.clientX, e.clientY, SHAPES[sel]!);
    if (host.canPlace(sel, a.r0, a.c0)) host.tap(sel, a.r0, a.c0);
    else host.reject();
  });

  return { dragging: () => drag !== null };
}
