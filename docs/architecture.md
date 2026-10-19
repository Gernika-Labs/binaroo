# Architecture (game/)

TypeScript + Vite, no UI framework. The rules know nothing about the page; the UI only draws state and forwards input.

```
game/src/
├─ rules/        pure logic, no DOM, fully unit-tested
│  ├─ constants.ts   board size, timers, penalties, scoring numbers (tune the game here)
│  ├─ shapes.ts      the 16 shapes, difficulty tiers, placement points
│  ├─ board.ts       grid, row value, impossible-row check, fits/stamp
│  ├─ targets.ts     picks a new reachable target for a row
│  ├─ scoring.ts     exact-row points, time bonus, combo, streak
│  ├─ levels.ts      level from exact rows, names, time per row
│  ├─ game.ts        GameState and the moves: place, plan/commit a clear, timers, expiry, hints
│  └─ rng.ts         injectable random source (seeded for tests, and later a daily puzzle)
├─ ui/           everything that touches the page
│  ├─ view.ts        builds and renders the board, picker and header from a ViewModel
│  ├─ input.ts       pointer handling: select, drag, tap to place
│  ├─ celebration.ts level-up screen
│  ├─ audio.ts, toast.ts, dom.ts, styles.css
├─ theme/        design tokens (tokens.css: dark now, light with Settings)
├─ settings/     saved best score and sound (guarded localStorage)
├─ content.ts    bit facts and cheers
├─ app.ts        controller: owns the state, animations, timer tick, overlays
└─ main.ts       entry
game/tests/      vitest, one file per rules module
```

## Rules of the game, as code

- A row clears **only** when its value equals its target (`planClear`). Full rows and columns do nothing.
- A row is dead when it has a bit its target lacks (`isDead`); only a timeout fixes it (`expireRow`).
- A timeout costs 25 points and a strike, resets the streak, and gives the row a target it can still reach. Three strikes end the game.
- Five exact rows make a level (`levelOf`); each named level has its own row time.

## Flow of a move

`input.ts` -> `app.ts` `place()` -> `placeShape` (rules) -> `planClear` -> animate -> `commitClear` -> celebration if `leveledUp` -> `planClear` again for chains.

## Testing

`npm test` runs the rules tests. The UI is checked by hand in a browser. Add UI tests when the 1A restyle lands.
