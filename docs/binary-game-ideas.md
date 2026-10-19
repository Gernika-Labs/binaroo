# Binary game ideas

## Original recommendations

If you're focused on binary specifically, here are the strongest options, ranked by how fun they're likely to be. I've included the four ideas from earlier plus three new ones that fit binary especially well. The fun ratings are my judgment, so treat them as hypotheses to playtest.

| Rank | Game | How it plays | Teaches | Fun | Build effort | Competition |
|---|---|---|---|---|---|---|
| 1 | **Byte Blast** (Block Blast style) | Place blocks on an 8-wide grid; rows clear when they equal a target number | Place values, decimal → binary | ⭐⭐⭐⭐⭐ | 🟢🟡 Easy–Medium | Low |
| 2 | **Bit Beats** (Magic Tiles style, new) | Notes fall in 8 lanes, one per bit; tap the right lanes together to "play" a byte on the beat | Reading binary fast, by feel | ⭐⭐⭐⭐⭐ | 🟡 Medium (timing and music sync) | Very low |
| 3 | **Bit Blaster** (arcade shooter, new) | Enemies carry numbers; flip the 8 bits on your ship to match one and zap it before it reaches you | Decimal → binary under pressure | ⭐⭐⭐⭐ | 🟡 Medium | Medium (Flippy Bit does this with hex) |
| 4 | **Defuse the Byte** (puzzle/party, new) | Timed bomb puzzles: cut wires and flip switches whose bits must add up to a code | Binary logic, conversions | ⭐⭐⭐⭐ | 🟢🟡 Easy–Medium | Low |
| 5 | **Bit Merge** (2048 style) | Merge equal tiles; each tile shows its binary form, so doubling visibly shifts the 1 left | Powers of two, shifting | ⭐⭐⭐ | 🟢 Easy | High (2048 clones) |
| 6 | **Binary Message Sudoku** | Fill a 0/1 logic grid; finished rows decode to letters that spell a hidden message | ASCII, binary rows | ⭐⭐⭐ | 🟢🟡 Easy–Medium | Medium (0h h1, Takuzu) |
| 7 | **Bit Rings** (Rotate Rings style) | Rotate and flip a ring of 8 bits with AND, OR, XOR to match a target | Bitwise operations | ⭐⭐ (great for CS students, niche for others) | 🟡 Medium | Low |

**My take**

**Byte Blast is still the best overall.** It's built on one of the most popular game mechanics right now, it teaches through every move, it's cheap to prototype, and nothing quite like it exists.

**Bit Beats is the most exciting new idea.** Rhythm games are very fun, and "playing" bytes as chords across 8 lanes is a fresh hook that nobody seems to be doing. The catch is that rhythm games need good music and tight timing, which makes them harder to get right.

**Bit Blaster and Defuse the Byte are great secondary modes.** Both would work well as extra modes inside Byte Blast later, which keeps one app instead of several.

**Skip Bit Merge as a standalone game.** It's fun, but 2048 clones are everywhere, so it's hard to stand out.

If you want to compare before committing, I can build quick browser prototypes of Byte Blast and Bit Beats so you can play both on your phone and see which one you keep coming back to.

---

## Re-evaluation after prototyping Byte Blast (2026-10-18)

Based on the Byte Blast prototype (`index.html`) as it stands now. Nobody but the author has playtested it yet, and the competition column wasn't re-researched, so treat all of this as hypotheses too.

### What the prototype taught us

| Original assumption | What happened |
|---|---|
| "Block Blast style" is the core | It broke the core. Random pieces plus "row equals target" made rows impossible and left players stuck. We replaced the random tray with a **full shape picker**, with points by difficulty (1-square = 1 point, big L = 12). |
| Easy–Medium to build | The base was quick, but **balancing took the real effort**: impossible-row detection, per-row timers, 3 strikes as the lose condition, row-based levels, and removing the "full row clears" shortcut. Treat the effort as Medium. |
| It teaches through every move | It does, but only once clears are exact. When any full row or column cleared, the single square let players skip the binary entirely. Only exact matches clear now. |
| Binary is shown next to the grid | Showing **0 in every empty cell and 1 in every filled cell** ties the grid to the number better than a binary readout at the side. |

Net: Byte Blast is now less "Block Blast with numbers" and more a **target-matching puzzle under a per-row clock**. That is a different game from the one ranked #1, and it's the part nobody else has.

### Updated ranking

| Rank | Game | Change | Why |
|---|---|---|---|
| 1 | **Byte Blast** | same | Still the best bet, but its fun is unproven. Playtest before building more. |
| 2 | **Bit Blaster** | ↑ from 3 | Byte Blast already has most of it: row targets, countdown timers, strikes, and level pacing. A "target comes at you" mode is mostly a new skin. Effort drops from Medium to Easy–Medium. |
| 3 | **Defuse the Byte** | ↑ from 4 | Timed targets and strikes already exist. A bomb-defusal wrapper is cheap. |
| 4 | **Bit Beats** | ↓ from 2 | Still the most exciting idea, but it's the only one that needs audio, beat sync and music. It shares almost no code with Byte Blast, so it's a separate bet. |
| 5 | **Binary Message Sudoku** | ↑ from 6 | The 0/1 grid display is now shared. Reasonable as a calm, no-timer mode. |
| 6 | **Bit Merge** | ↓ from 5 | Same verdict: skip as a standalone game. |
| 7 | **Bit Rings** | same | Niche. Skip for now. |

### Open questions to playtest in Byte Blast

1. **Is the 1-square spam a problem?** It's the safest piece but the slowest. Check whether the time pressure and the point values keep people choosing bigger shapes.
2. **Are the timers right?** They're 60 / 45 / 35 / 25 / 18 s from Easy to Super hard. They were slowed after "level 1 felt too fast", but they haven't been tested beyond one player.
3. **Is 5 exact rows per level the right pace?** It's one constant (`ROWS_PER_LEVEL`).
4. **Do 3 strikes feel fair?** The strikes rule was added only because the free picker made "no moves left" impossible.
5. **Do the 0/1 cells actually help people learn the place values?** Test with someone who doesn't already know binary.

### Suggested next step

Finish playtesting Byte Blast with 3 to 5 people before starting Bit Beats. If the timer and picker design holds up, **Bit Blaster** is the cheapest next mode and doesn't need a new app.
