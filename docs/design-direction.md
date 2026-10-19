# Design direction: 1A "Terminal"

Decision (2026-10-18), for the app now named **Binaroo**: we use direction **1A, Terminal · full readout**, with a **light mode that the player turns on in Settings**.

Source: the Claude Design export `Mobile app design form.zip` (`Byte Blast Mobile.dc.html`, `ByteBlastApp.dc.html`). It shows three directions on a 402×874 iPhone frame: 1a Terminal, 1b Circuit, 1c Bright. Only 1a is kept. The 1b and 1c looks are not used.

## What 1A is

"Monospace throughout, cells print 1/0. Each row shows value, target and the 8-bit string." Dark navy background, mint green as the action colour, soft blue pieces, square-ish corners (radius 3 to 6 px).

### Dark palette (from the design file)

| Token | Value | Use |
|---|---|---|
| `bg` | `#070d1a` | Screen |
| `surf` / `surf2` | `#0d1628` / `#132038` | Cards, bars |
| `line` | `#1f2e4c` | Borders |
| `ink` / `dim` | `#d6e2ff` / `#8493b6` | Text |
| `board` | `#0a1222` | Board background |
| `cell` | `#121d33` | Empty cell |
| `offInk` / `onInk` | `#2b3b5e` / `#0a1222` | The 0 and 1 digits in cells |
| `fill` / `piece` | `#7aa2ff` | Filled cell, piece |
| `ok` / `acc` | `#5cf2a6` | Match, primary buttons |
| `warn` | `#ffb547` | Over, impossible |
| `flash` | `#eafff4` | Clear flash |
| `chip` | `#16233d` | Chips |
| Font | JetBrains Mono (everything) | |
| Radii | cell 3, panel 6, card 6, button 4 | |

### Screens in the design

- **Home:** BYTE BLAST logo with an 8-bit "01000010 = B" strip, level badge ("LVL 07" with a progress bar), a big "MODE 01 · CLASSIC / Endless run" card with a RUN button, "Puzzle levels" and "Nibble tutorial" cards, dashed "coming soon" rows (Daily Byte, Hex), and a "// BIT FACT" card.
- **Puzzle levels:** Chapter 01 "First Bytes", a 3-column grid of level cards that show each level in binary with stars. Chapter 02 "Reverse" is locked.
- **Stats / progress:** reached from the tab bar.
- **Game:** 8×8 board with rows showing value, target and bit string, plus a piece tray.

## Light mode (built)

The design export has no light version of Terminal (1c "Bright" is a different look), so the light palette is ours: same shapes and type as 1A, paper background, blue ink. It lives in `game/src/theme/tokens.css` next to the dark set.

| Token | Dark (from the export) | Light |
|---|---|---|
| `bg` | `#070d1a` | `#f4f6fb` |
| `surf` / `surf2` | `#0d1628` / `#132038` | `#ffffff` / `#e8edf7` |
| `line` | `#1f2e4c` | `#cfd8ea` |
| `ink` / `dim` | `#d6e2ff` / `#8493b6` | `#0d1628` / `#54648a` |
| `board` / `cell` | `#0a1222` / `#121d33` | `#e9eef9` / `#dbe3f4` |
| `off-ink` / `on-ink` (the 0 / the 1) | `#2b3b5e` / `#0a1222` | `#8fa1c6` / `#ffffff` |
| `fill` | `#7aa2ff` | `#2f5fe0` |
| `ok` / `acc` | `#5cf2a6` | `#08733f` |
| `warn` | `#ffb547` | `#9a5a00` |
| `bad` | `#ff6b6b` | `#c62f2f` |

The light values were tuned until every text pair passed WCAG AA (4.5:1) in `tests/theme.test.ts`, which reads the real `tokens.css`. Still open: a design review of the light look.

**Settings** (gear button in the header): Theme **System / Dark / Light** (default System, follows the phone) and Sound. Opening Settings pauses the game; closing it resumes. The choice is saved on the device and applied before the first paint, so there is no flash. The level-up celebration is dark in both themes on purpose.

**Fonts** are bundled (`@fontsource/jetbrains-mono`), so the app makes no network requests and works offline.

## Decided rules (tested in the prototype, these override the design export)

The export was drawn before the prototype was playtested. Where they disagree, **the prototype wins**. The mobile UI must be built from this table, not from the export's copy.

| Topic | Export (1a) said | Decided |
|---|---|---|
| Clearing | Rows clear on an exact target or at 255; columns clear when full | **Only an exact match clears a row.** A full row or full column does nothing special. Filling a row with single squares used to clear it without matching, so that rule was removed. |
| Impossible rows | Not covered | A row is **impossible** when it has a filled bit its target doesn't contain (bits can't be removed). It shows `✗ impossible` and amber cells. It stays until its timer runs out, when it gets a new target that still contains the filled bits, or is wiped if it is completely full. |
| Cells | Cells print 1/0 | Same. Every empty cell shows a dim `0`, every filled cell a bold `1`, and the drag preview shows `1`. |
| Row readout | Value, target **and the 8-bit string** | **Value and target only** (`15/130`, large), plus a status line (`✓ match`, `✗ impossible`) and the timer bar. The bit string was removed because the 0/1 cells already show it. |
| Placement | Tap-to-place, 3-piece random tray | **Free picker of all 16 shapes**, always available. Tap or drag. A selected shape **stays selected** after placing; tapping it again deselects. Shapes that fit nowhere are dimmed. |
| Shape points | Handout table | Points by difficulty. Easy: 1-square, +1. Normal: lines of 2 or 3, cells x 1.5. Hard: line of 4, 2x2, small L, cells x 2. Super hard: big L, cells x 3. The picker shows `+N` on each shape. |
| Timers | None | **A countdown per row**, shown as a bar under the row readout (green, then amber, then red). Time per row: Easy 60 s, Normal 45 s, Hard 35 s, Expert 25 s, Super hard 18 s. |
| Timeout | None | **-25 points**, the row gets a new reachable target, the streak resets, and the player gets a strike. |
| Lives | None | **3 strikes** end the game (shown as `○○○`, filling with `✕`). |
| Levels | "LVL 07" with an XP bar | **5 exact rows per level.** Header shows `Lv 2 · 3/5 rows` and the level name (Easy, Normal, Hard, Expert, Super hard). Targets get more bits set as the level rises. |
| Level-up | Not designed | **Celebration screen:** full-board colour wave, confetti, a big "Level N", the level name and time per row, a random cheer, and a rising jingle. Game and timers freeze for about 2.8 s. Tap to skip. |
| Scoring | Handout table | Points per placed piece (above) + exact-row bonus 50 + target/5 + up to 30 for time left, multiplied by the streak (up to +50%). Streak = consecutive exact rows without a timeout. A timeout costs 25. |
| Hints | Not designed | After 10 s idle, the closest reachable row glows; costs 15 points. |
| Settings | None | **Settings screen:** Theme (System / Dark / Light) and Sound. Built. |
| Modes | Classic, Puzzle levels, Nibble tutorial; Daily Byte and Hex as "soon" | Build **Classic first**. The other modes follow later. |

### Design work still needed

The export doesn't show these, so they need designing in the 1A style:
- Game screen with the picker, row timer bars, strikes and level progress in the header.
- Level-up celebration screen.
- Game-over screen ("Time's up").
- Light-mode review of every screen.

## Next steps

1. Split the prototype into modules and test the rules (see `plan.md`).
2. Restyle to the 1A dark tokens, then add the light tokens and the Settings screen.
3. Wrap it with Capacitor (see `mobile-engine-comparison.md`) and test on real phones.
