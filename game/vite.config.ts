import { defineConfig } from "vitest/config";

// base "./" so the same build works from a web server sub-path and inside Capacitor's webview
export default defineConfig({
  base: "./",
  build: { outDir: "dist", target: "es2022" },
  test: { include: ["tests/**/*.test.ts"] },
});
