/** What the player picks in Settings. "system" follows the phone's light/dark setting. */
export type ThemeChoice = "system" | "dark" | "light";
export type Theme = "dark" | "light";

export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "dark", "light"];

export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): Theme {
  if (choice === "system") return systemPrefersDark ? "dark" : "light";
  return choice;
}

const query = (): MediaQueryList | null =>
  typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;

/** Sets data-theme on <html> (the tokens switch on it) and the browser bar colour. */
export function applyTheme(choice: ThemeChoice): Theme {
  const theme = resolveTheme(choice, query()?.matches ?? true);
  document.documentElement.dataset.theme = theme;
  const color = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  return theme;
}

/** Calls `onChange` when the phone switches between light and dark. */
export function watchSystemTheme(onChange: () => void): void {
  query()?.addEventListener("change", onChange);
}
