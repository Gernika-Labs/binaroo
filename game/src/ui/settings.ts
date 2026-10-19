import { THEME_CHOICES, type ThemeChoice } from "../theme/theme";
import { byId } from "./dom";

export interface SettingsHost {
  theme(): ThemeChoice;
  setTheme(choice: ThemeChoice): void;
  sound(): boolean;
  setSound(on: boolean): void;
  /** The screen opened: pause the game. */
  opened(): void;
  /** The screen closed: resume. */
  closed(): void;
}

/** The Settings screen: theme (System / Dark / Light) and sound. */
export function bindSettings(host: SettingsHost): void {
  const overlay = byId("setOv");
  const seg = byId("themeSeg");
  const sound = byId("soundBtn");

  const sync = () => {
    const current = host.theme();
    seg.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.choice === current));
    });
    sound.setAttribute("aria-pressed", String(host.sound()));
    sound.textContent = host.sound() ? "On" : "Off";
  };

  const open = () => {
    sync();
    overlay.hidden = false;
    host.opened();
    byId("setClose").focus();
  };
  const close = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    host.closed();
  };

  byId("settingsBtn").onclick = open;
  byId("setClose").onclick = close;
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  seg.addEventListener("click", (e) => {
    const choice = (e.target as HTMLElement).closest("button")?.dataset.choice;
    const picked = THEME_CHOICES.find((c) => c === choice);
    if (!picked) return;
    host.setTheme(picked);
    sync();
  });
  sound.onclick = () => {
    host.setSound(!host.sound());
    sync();
  };
}
