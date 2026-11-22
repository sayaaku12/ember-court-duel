# Ember Court — Duel of the Lantern Spirits

[![Make the best card game](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/sayaaku12/ember-court-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/sayaaku12/ember-court-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original turn-based duel card battler for the [make.fun "Make the best card game" bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Ember Fox, duelling Mistral the Owl Sage across a lantern-lit table. Reduce his 30 life to zero before he reduces yours.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step, no install.

- **Mana** grows by 1 each turn, up to 10. Cards cost mana.
- **Minions** take the table (up to 5 a side). A minion played this turn rests (💤); from your next turn it strikes the foe across from it — or the hero, if none stands there.
- **Elements** decide the duel: 🔥 Ember beats 🌿 Thorn, 🌿 Thorn beats 💧 Tide, 💧 Tide beats 🔥 Ember, and 🗿 Stone fears nothing. Winning the element duel deals +2 damage.
- **Spells**: Ember Bolt (deal 4 to a minion or the hero — click your target), Mend Lantern (+7 life), Lantern Surge (draw 2), Quake (2 to all enemy minions).
- **Controls**: click a card to play it (or keys `1–7`), `Space` ends your turn, `Enter` starts a new duel.

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.
- `game/index.html` — the table. `game/style.css` — all art is CSS + emoji. `game/cards.js` — the 14-card catalogue and the element wheel. `game/game.js` — turns, combat and spells. `game/ai.js` — the Owl Sage's greedy strategy. `game/render.js` — DOM painting. `game/main.js` — boot, input and the `?shot=` demo states used for screenshots.
- `screenshots/` — real Playwright renders of the game: `1-table.jpg` (cover: mid-duel table), `2-title.jpg` (title screen), `3-win.jpg` (victory) and `4-loss.jpg` (defeat).

## Build & check

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node kit/best-card-game-20261122-1826-kit/cli/makefun.mjs check --help
```

## License

MIT — see `LICENSE`.
