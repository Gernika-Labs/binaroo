import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/jetbrains-mono/latin-800.css";
import "./theme/tokens.css";
import "./ui/styles.css";
import { startApp } from "./app";

// A game screen should never zoom. The viewport tag covers most cases; iOS WebViews can still
// start a pinch, so cancel those gesture events too.
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(type, (e) => e.preventDefault());
}

startApp();
