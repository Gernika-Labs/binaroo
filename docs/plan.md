# Plan

Decisions (2026-10-18):
- App name: **Binaroo**. Repo: `Gernika-Labs/binaroo` (private).
- Path: **Capacitor** (see `mobile-engine-comparison.md`). Godot stays an option only if the webview feels bad or Bit Beats goes ahead.
- Design: **1A Terminal** with a light mode in Settings (see `design-direction.md`).
- Language: **TypeScript** for the rules module, Vite for the build, no UI framework.
- Monetization: **undecided**. First builds are free with no ads.
- A Mac is available for iOS builds.

## Phases

| # | Phase | State |
|---|---|---|
| 1 | Scaffold the repo, move the prototype into `game/` unchanged | done |
| 2 | Design doc updated so tested rules override the export | done |
| 3 | Split the prototype into modules (`rules/`, `ui/`, `theme/`, `settings/`) and add rule tests | next |
| 4 | Restyle to 1A dark, add light mode and the Settings screen | |
| 5 | Add Capacitor, bundle ID, icons and splash, safe areas, haptics, offline; run on real phones | |
| 6 | Marketing site and privacy policy | |
| 7 | Store assets and listings | |
| 8 | Beta (TestFlight, Play closed testing), then CI release jobs, then launch | |

## Still needed

- **Bundle ID / application ID** (for example `com.gernikalabs.binaroo`). It cannot change after the first store release, so decide it before phase 5.
- **Domain** for the site and privacy policy.
- **License.**

## Store notes

- **Apple:** Developer Program is US$99 a year. A Mac with Xcode is needed. Apple can reject apps that are only a website in a wrapper (guideline 4.2), so the app needs real behaviour: offline play, haptics, native splash, saved progress.
- **Google:** US$25 one-time. New personal developer accounts may have to run a closed test with a minimum number of testers for a minimum number of days before production. Check the current rule in Play Console before planning dates.
- Both stores need a privacy policy URL.
