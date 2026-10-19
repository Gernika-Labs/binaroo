import { byId } from "./dom";

/** A short message that floats up from the board. `bad` colours it as a warning. */
export function toast(message: string, bad = false): void {
  const el = byId("toast");
  el.textContent = message;
  el.style.color = bad ? "var(--over)" : "var(--exact)";
  el.classList.remove("show");
  void el.offsetWidth; // restart the animation
  el.classList.add("show");
}
