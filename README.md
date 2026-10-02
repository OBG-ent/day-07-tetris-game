# Tetris 🟪

The classic block-stacking game, rebuilt from scratch in vanilla JavaScript — with scoring, levels, hold, ghost preview, and a persistent high score.

**Day 7 · featured build of my daily coding journey** — I'm shipping one coding project every day. Follow the streak!

## Features

- 🎮 Full Tetris gameplay — 7 tetrominoes, rotation with wall kicks
- 👻 **Ghost preview** showing where your piece will land
- 🔄 **Hold piece** (press `C`) to stash a piece for later
- 👀 **Next piece** preview
- 📈 **Levels** — the stack falls faster every 10 lines cleared
- 🏆 **High score** saved in your browser (localStorage)
- ⏸ Pause / resume, game-over screen with one-click restart
- 📱 Touch controls on mobile

## Run it in 30 seconds

No build step, no dependencies. Just open the file:

1. Download or clone this repo
2. Open `index.html` in any browser
3. Stack blocks. Clear lines. Chase the high score. ✅

## Controls

| Key | Action |
|---|---|
| ← → | Move piece |
| ↓ | Soft drop (+1 pt per row) |
| ↑ | Rotate |
| Space | Hard drop (+2 pts per row) |
| C | Hold / swap piece |
| P | Pause |

## Scoring

Clearing multiple lines at once pays more: 1 line = 100, 2 = 300, 3 = 500, **Tetris (4) = 800** — all multiplied by your level.

## What I practiced

- The **game loop** with `requestAnimationFrame` and delta-time gravity
- **Collision detection** against walls, floor, and locked blocks
- Matrix rotation with simple **wall kicks**
- The "bag" randomizer so every piece appears fairly
- Separating game state, logic, and rendering

---
Built with plain HTML, CSS & JavaScript. Day 7 of 365. 🚀
