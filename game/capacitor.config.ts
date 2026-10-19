import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gernikalabs.binaroo",
  appName: "Binaroo",
  webDir: "dist",
  backgroundColor: "#070d1a",
  ios: {
    contentInset: "never",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#070d1a",
      showSpinner: false,
    },
  },
};

export default config;
