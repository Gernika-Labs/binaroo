# Binaroo

A mobile puzzle game that teaches binary. Fill an 8-wide board so each row's bits add up to its target number, before the row's timer runs out.

> Working title was "Byte Blast". Older docs and the design export still use that name.

## Repo layout

| Folder | What it is |
|---|---|
| `game/` | The app: TypeScript + Vite, wrapped for Android and iOS with Capacitor. One codebase builds the web demo and both apps. |
| `site/` | Marketing website (static), including a playable web build, privacy policy and support pages. |
| `store/` | App Store and Google Play listing text, screenshots, graphics and the privacy policy source. |
| `design/` | The design export (direction 1A, Terminal) and tokens. |
| `docs/` | Plan, design decisions, engine comparison, game ideas, game design handout. |
| `.github/workflows/` | CI. |

## Develop

Requires Node 20+.

```sh
cd game
npm install
npm run dev        # local dev server
npm run typecheck
npm test
npm run build      # outputs game/dist
```

See `docs/architecture.md` for how `game/src` is organised, and `docs/native.md` for building the iOS and Android apps (`npm run ios`, `npm run android`).

## Status

Prototype playable. Not yet published. Monetization undecided: the first builds are free with no ads.

## License

Not decided yet. Until a license is added, all rights are reserved.
