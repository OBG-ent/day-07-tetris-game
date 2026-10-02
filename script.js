// ============================================================
//  TETRIS — vanilla JS, no libraries
//  Day 7 featured build of my daily coding journey.
//  Open index.html in a browser and play.
// ============================================================

// ---- Constants ----
const COLS = 10, ROWS = 20, BLOCK = 30;
const boardCanvas = document.getElementById("board");
const bctx = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nctx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const hctx = holdCanvas.getContext("2d");

// Tetromino shapes as matrices + their colors
const SHAPES = {
  I: { m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], c: "#22d3ee" },
  J: { m: [[1,0,0],[1,1,1],[0,0,0]],                 c: "#3b82f6" },
  L: { m: [[0,0,1],[1,1,1],[0,0,0]],                 c: "#f59e0b" },
  O: { m: [[1,1],[1,1]],                             c: "#eab308" },
  S: { m: [[0,1,1],[1,1,0],[0,0,0]],                 c: "#22c55e" },
  T: { m: [[0,1,0],[1,1,1],[0,0,0]],                 c: "#a855f7" },
  Z: { m: [[1,1,0],[0,1,1],[0,0,0]],                 c: "#ef4444" },
};
const KEYS = Object.keys(SHAPES);
// Classic-ish line-clear scores, multiplied by level
const LINE_POINTS = [0, 100, 300, 500, 800];

// ---- Game state ----
let board, bag, current, next, held, canHold;
let score, level, lines, best, dropCounter, lastTime, gameOver, paused;

// ---- Helpers ----
// Empty 10x20 grid (0 = empty, otherwise a color string)
function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// "Bag" randomizer: shuffle all 7 pieces so each appears before any repeat
function newBag() {
  const b = [...KEYS];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function spawnPiece() {
  if (bag.length === 0) bag = newBag();
  const key = bag.pop();
  current = {
    key,
    matrix: SHAPES[key].m.map(r => [...r]),
    color: SHAPES[key].c,
    row: 0,
    // center horizontally
    col: Math.floor(COLS / 2) - Math.ceil(SHAPES[key].m[0].length / 2),
  };
  canHold = true;
  // Piece spawned overlapping blocks = game over
  if (collides(board, current.matrix, current.row, current.col)) {
    gameOver = true;
    showOverlay();
  }
}

// Does `matrix` at (row, col) hit a wall, the floor, or locked blocks?
function collides(grid, matrix, row, col) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const nr = row + r, nc = col + c;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true; // walls & floor
      if (nr >= 0 && grid[nr][nc]) return true;            // locked block
    }
  }
  return false;
}

// Rotate a matrix 90° clockwise
function rotateMatrix(m) {
  return m[0].map((_, c) => m.map(row => row[c]).reverse());
}

// Rotate with simple "wall kicks": try shifting left/right if rotation collides
function rotateCurrent() {
  const rotated = rotateMatrix(current.matrix);
  for (const dx of [0, -1, 1, -2, 2]) {
    if (!collides(board, rotated, current.row, current.col + dx)) {
      current.matrix = rotated;
      current.col += dx;
      return;
    }
  }
}

// Stamp the piece into the board, then clear full lines
function lockPiece() {
  current.matrix.forEach((row, r) => row.forEach((v, c) => {
    if (v) board[current.row + r][current.col + c] = current.color;
  }));
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell)) {
      board.splice(r, 1);                    // remove the full row
      board.unshift(Array(COLS).fill(0));    // add empty row on top
      cleared++;
      r++; // re-check this index since rows shifted down
    }
  }
  if (cleared) {
    lines += cleared;
    score += LINE_POINTS[cleared] * level;
    // Level up every 10 lines -> pieces fall faster
    level = Math.floor(lines / 10) + 1;
    if (score > best) { best = score; localStorage.setItem("tetris-best", best); }
  }
  updateStats();
  spawnPiece();
}

// Hold mechanic: swap current piece with the held one (once per drop)
function holdPiece() {
  if (!canHold || gameOver || paused) return;
  const key = current.key;
  if (!held) {
    held = key;
    spawnPiece();
  } else {
    [held, current.key] = [key, held];
    current.matrix = SHAPES[current.key].m.map(r => [...r]);
    current.color = SHAPES[current.key].c;
    current.row = 0;
    current.col = Math.floor(COLS / 2) - Math.ceil(current.matrix[0].length / 2);
    if (collides(board, current.matrix, current.row, current.col)) {
      gameOver = true; showOverlay();
    }
  }
  canHold = false;
  drawMini(hctx, held);
}

// ---- Movement ----
function move(dx, dy) {
  if (!collides(board, current.matrix, current.row + dy, current.col + dx)) {
    current.row += dy; current.col += dx;
    return true;
  }
  return false;
}
function hardDrop() {
  while (move(0, 1)) { score += 2; } // bonus points for hard drops
  lockPiece();
}

// Where would the piece land? (for the ghost preview)
function ghostRow() {
  let r = current.row;
  while (!collides(board, current.matrix, r + 1, current.col)) r++;
  return r;
}

// ---- Drawing ----
function drawBlock(ctx, x, y, size, color, ghost = false) {
  ctx.fillStyle = ghost ? "rgba(255,255,255,0.15)" : color;
  ctx.fillRect(x * size, y * size, size, size);
  ctx.strokeStyle = ghost ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
}

function draw() {
  bctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  // locked blocks
  board.forEach((row, r) => row.forEach((cell, c) => {
    if (cell) drawBlock(bctx, c, r, BLOCK, cell);
  }));
  if (!gameOver && current) {
    // ghost preview
    const gr = ghostRow();
    current.matrix.forEach((row, r) => row.forEach((v, c) => {
      if (v) drawBlock(bctx, current.col + c, gr + r, BLOCK, null, true);
    }));
    // active piece
    current.matrix.forEach((row, r) => row.forEach((v, c) => {
      if (v && current.row + r >= 0)
        drawBlock(bctx, current.col + c, current.row + r, BLOCK, current.color);
    }));
  }
}

// Draw the small NEXT / HOLD previews, centered
function drawMini(ctx, key) {
  ctx.clearRect(0, 0, 120, 120);
  if (!key) return;
  const { m, c } = SHAPES[key];
  const size = 24;
  const ox = (120 - m[0].length * size) / 2 / size;
  const oy = (120 - m.length * size) / 2 / size;
  m.forEach((row, r) => row.forEach((v, cc) => {
    if (v) drawBlock(ctx, ox + cc, oy + r, size, c);
  }));
}

// ---- UI ----
function updateStats() {
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("level").textContent = level;
  document.getElementById("lines").textContent = lines;
}
function showOverlay() {
  document.getElementById("overlay-title").textContent = gameOver ? "GAME OVER" : "PAUSED";
  document.getElementById("overlay-score").textContent =
    `Score: ${score} · Level ${level} · ${lines} lines`;
  document.getElementById("overlay").classList.remove("hidden");
}
function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}

// ---- Game loop ----
// Pieces fall faster as the level rises: 800ms at L1 down to 80ms floor
function dropInterval() { return Math.max(800 - (level - 1) * 70, 80); }

function loop(time = 0) {
  if (gameOver || paused) return;
  const dt = time - lastTime;
  lastTime = time;
  dropCounter += dt;
  if (dropCounter > dropInterval()) {
    dropCounter = 0;
    if (!move(0, 1)) lockPiece(); // hit bottom -> lock & spawn next
  }
  // Show the upcoming piece in the preview box
  drawMini(nctx, bag[bag.length - 1]);
  draw();
  requestAnimationFrame(loop);
}

// ---- Controls ----
const ACTIONS = {
  left:   () => move(-1, 0),
  right:  () => move(1, 0),
  down:   () => { if (move(0, 1)) { score += 1; updateStats(); } }, // soft-drop point
  rotate: () => rotateCurrent(),
  drop:   () => hardDrop(),
};

document.addEventListener("keydown", e => {
  if (["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(e.key)) e.preventDefault();
  if (gameOver || paused) {
    if (e.key === "p" || e.key === "P") togglePause();
    return;
  }
  switch (e.key) {
    case "ArrowLeft":  ACTIONS.left(); break;
    case "ArrowRight": ACTIONS.right(); break;
    case "ArrowDown":  ACTIONS.down(); break;
    case "ArrowUp":    ACTIONS.rotate(); break;
    case " ":          ACTIONS.drop(); break;
    case "c": case "C": holdPiece(); break;
    case "p": case "P": togglePause(); break;
  }
  draw();
});

// Touch buttons
document.querySelectorAll(".touch button").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!gameOver && !paused) { ACTIONS[btn.dataset.k](); draw(); }
  });
});

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (paused) showOverlay(); else { hideOverlay(); lastTime = performance.now(); requestAnimationFrame(loop); }
  document.getElementById("pause-btn").textContent = paused ? "▶ Resume" : "⏸ Pause";
}
document.getElementById("pause-btn").addEventListener("click", togglePause);
document.getElementById("restart-btn").addEventListener("click", init);

// ---- Start / restart ----
function init() {
  board = emptyBoard();
  bag = newBag();
  held = null;
  score = 0; level = 1; lines = 0;
  best = parseInt(localStorage.getItem("tetris-best") || "0", 10);
  dropCounter = 0; lastTime = performance.now();
  gameOver = false; paused = false;
  hideOverlay();
  document.getElementById("pause-btn").textContent = "⏸ Pause";
  updateStats();
  drawMini(hctx, null);
  spawnPiece();
  requestAnimationFrame(loop);
}

init();
