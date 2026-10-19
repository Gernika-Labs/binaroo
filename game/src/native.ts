import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import type { Theme } from "./theme/theme";

/**
 * Everything that only exists inside the iOS / Android app. On the web every function here is a
 * no-op (or uses the browser equivalent), so the rest of the game never checks the platform.
 */
export const isNative = Capacitor.isNativePlatform();

let hapticsEnabled = true;
export const setHapticsEnabled = (on: boolean): void => {
  hapticsEnabled = on;
};
export const isHapticsEnabled = (): boolean => hapticsEnabled;

/** Haptics must never break a move: ignore any failure. */
const fire = (action: () => Promise<void>): void => {
  if (isNative && hapticsEnabled) void action().catch(() => {});
};

/** A shape was placed. */
export const hapticTap = (): void => fire(() => Haptics.impact({ style: ImpactStyle.Light }));
/** A row matched its target. */
export const hapticSuccess = (): void => fire(() => Haptics.notification({ type: NotificationType.Success }));
/** A row timed out. */
export const hapticWarning = (): void => fire(() => Haptics.notification({ type: NotificationType.Warning }));
/** The game ended. */
export const hapticError = (): void => fire(() => Haptics.notification({ type: NotificationType.Error }));

/** Light text on the dark theme, dark text on the light theme. */
export function setStatusBarTheme(theme: Theme): void {
  if (!isNative) return;
  const color = theme === "dark" ? "#070d1a" : "#f4f6fb";
  void (async () => {
    try {
      await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
      if (Capacitor.getPlatform() === "android") await StatusBar.setBackgroundColor({ color });
    } catch {
      /* status bar control isn't available everywhere (e.g. edge-to-edge Android) */
    }
  })();
}

/** The splash stays up until the first frame is drawn, then fades out. */
export function hideSplash(): void {
  if (isNative) void SplashScreen.hide().catch(() => {});
}

/** Calls `onBackground` when the player leaves the app, so the game can pause. */
export function onBackground(onBackground: () => void): void {
  if (isNative) {
    void App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) onBackground();
    });
  } else {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onBackground();
    });
  }
}
