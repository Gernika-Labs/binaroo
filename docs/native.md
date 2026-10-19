# Building the iOS and Android apps

The apps are the web game in `game/` wrapped with Capacitor 8. App ID (both stores): **`com.gernikalabs.binaroo`**. Name: **Binaroo**. Version 1.0 (build/versionCode 1). Minimum: iOS 15, Android 7 (API 24). Phones are locked to portrait.

How to test on emulators and real phones: see `testing.md`.

## Everyday commands (from `game/`)

| Command | What it does |
|---|---|
| `npm run dev` | Web dev server, for most work. |
| `npm run sync` | Builds the web app and copies it into `ios/` and `android/`. Run after changing web code. |
| `npm run ios` | Sync, then open Xcode. Press Run to start the simulator or a device. |
| `npm run android` | Sync, then open Android Studio. |
| `npm run ios:sim` | Builds, installs and launches on an iOS simulator (`-- "iPhone 17e"` to pick another). |
| `npm run android:emu` | Builds the APK, starts an emulator if needed, installs and launches. |
| `npm run assets` | Redraws the icon and splash (`scripts/make-resources.mjs`) and regenerates every size for both platforms. |

Step-by-step manual commands, with a troubleshooting table, are in `testing.md`.

## What the native layer does (`game/src/native.ts`)

On the web every one of these is a no-op, so the game code never checks the platform.

- **Haptics:** a light tap when a shape is placed, success when a row matches, warning on a timeout, error at game over. A Haptics toggle appears in Settings only in the apps.
- **Status bar:** follows the theme (light text on dark, dark text on light).
- **Splash:** shown until the first frame is drawn, then hidden.
- **Auto-pause:** leaving the app pauses the game, like the pause button.
- **Offline:** everything, including the font, is bundled. The app makes no network requests.

Why this matters for review: Apple can reject apps that are only a website in a wrapper (guideline 4.2). Offline play, haptics, a native splash, auto-pause and saved settings are the "real app" behaviour we have so far.

## Verified (2026-10-19)

- iOS: builds and runs on the iPhone 17 simulator (iOS 27) in light and dark. Splash hides within about 2 seconds of launch. Header sits below the Dynamic Island.
- Android: debug APK builds (Gradle 8.14, Java 26) and runs on the Pixel 9 emulator (Android 17). Real touch taps select a shape, place it and clear a row.

## Not verified yet

- A physical iPhone or Android phone. Haptics can't be felt in a simulator.
- Dragging on a real touchscreen (only taps were exercised on Android).
- Release builds and signing (below).
- Small screens and tablets.

## Before the first store release

1. **Android signing:** create an upload keystore (keep it out of git; `*.jks` and `*.keystore` are ignored), enrol in Play App Signing, build an AAB with `./gradlew bundleRelease`.
2. **iOS signing:** in Xcode set the team on the `App` target (automatic signing is fine to start), then Product > Archive and upload to App Store Connect / TestFlight.
3. **Versions:** bump `versionCode` / `versionName` in `android/app/build.gradle` and `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in Xcode for every upload. Consider driving both from one number later.
4. **Store listing, screenshots, privacy policy URL** (phases 6 and 7).
5. **Privacy answers:** with no ads, analytics or accounts the app collects no data, and both stores' privacy forms can say so. Re-answer them if monetization changes.
6. **Icon and splash are placeholders** drawn by `scripts/make-resources.mjs`. Replace the files in `game/resources/` with real artwork and run `npm run assets`.

## Notes

- `android/` and `ios/` are committed (normal for Capacitor). Build output and signing files are ignored.
- iOS uses Swift Package Manager (no CocoaPods needed).
- iPad keeps all four orientations; only iPhone and Android phones are locked to portrait.
