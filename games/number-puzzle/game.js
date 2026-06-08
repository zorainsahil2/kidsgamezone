/**
 * KidsGameZone: Number Puzzle (2048)
 * Matrix transpositions slide engine, touch/keyboard, Web Audio chimes, and local storage high scores.
 */

const STORAGE_KEY = 'kgz_highscore_number-puzzle';

// DOM Selectors
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const tileContainer = document.getElementById('tileContainer');
const swipeArea = document.getElementById('swipeArea');
const restartBtn = document.getElementById('restartBtn');

// Overlays
const winOverlay = document.getElementById('winOverlay');
const keepPlayingBtn = document.getElementById('keepPlayingBtn');
const winRestartBtn = document.getElementById('winRestartBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Game State
let board = [];
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let hasReached2048 = false;
let continuePlaying = false;
let gameOver = false;

// Audio System
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'slide') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'merge') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// Initialize Board
highScoreVal.textContent = highScore;

function initGame() {
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    scoreVal.textContent = score;
    hasReached2048 = false;
    continuePlaying = false;
    gameOver = false;

    winOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    spawnTile();
    spawnTile();
    renderBoard();
}

// Spawn random tile (2 or 4)
function spawnTile() {
    let emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }

    if (emptyCells.length > 0) {
        const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }
    return false;
}

// Render active grid cells on UI
function renderBoard() {
    tileContainer.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = board[r][c];
            if (val > 0) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${val <= 2048 ? val : 'super'}`;
                tile.textContent = val;

                // Positioning coordinates calculations
                // Box fits inside 300x300, gap is 10px, tile is 67.5px. Offset = 77.5px per step.
                tile.style.left = `${c * 77.5}px`;
                tile.style.top = `${r * 77.5}px`;

                tileContainer.appendChild(tile);
            }
        }
    }
}

// Move slide calculations
function compress(row) {
    let newRow = row.filter(val => val !== 0);
    while (newRow.length < 4) {
        newRow.push(0);
    }
    return newRow;
}

function merge(row) {
    let mergedAny = false;
    for (let i = 0; i < 3; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
            mergedAny = true;
            playSound('merge');
        }
    }
    return { row, mergedAny };
}

// Slide row left
function slideRowLeft(row) {
    let compressed1 = compress(row);
    let mergeRes = merge(compressed1);
    let compressed2 = compress(mergeRes.row);
    return { row: compressed2, moved: JSON.stringify(row) !== JSON.stringify(compressed2) };
}

// Board direction controllers
function slideLeft() {
    let movedAny = false;
    for (let r = 0; r < 4; r++) {
        const res = slideRowLeft(board[r]);
        board[r] = res.row;
        if (res.moved) movedAny = true;
    }
    return movedAny;
}

function reverseBoard() {
    for (let r = 0; r < 4; r++) {
        board[r].reverse();
    }
}

function transposeBoard() {
    let temp = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            temp[c][r] = board[r][c];
        }
    }
    board = temp;
}

// Slide triggers
function moveLeft() {
    return slideLeft();
}

function moveRight() {
    reverseBoard();
    const moved = slideLeft();
    reverseBoard();
    return moved;
}

function moveUp() {
    transposeBoard();
    const moved = slideLeft();
    transposeBoard();
    return moved;
}

function moveDown() {
    transposeBoard();
    const moved = moveRight(); // slides right on transposed = slides down
    transposeBoard();
    return moved;
}

// Action Dispatcher
function makeMove(direction) {
    if (gameOver) return;

    let moved = false;
    if (direction === 'left') moved = moveLeft();
    if (direction === 'right') moved = moveRight();
    if (direction === 'up') moved = moveUp();
    if (direction === 'down') moved = moveDown();

    if (moved) {
        playSound('slide');
        spawnTile();
        renderBoard();
        scoreVal.textContent = score;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_KEY, highScore);
            highScoreVal.textContent = highScore;
        }

        checkWinAndLoss();
    }
}

function checkWinAndLoss() {
    // 1. Check for 2048 tile win
    if (!hasReached2048 && !continuePlaying) {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (board[r][c] === 2048) {
                    hasReached2048 = true;
                    playSound('win');
                    winOverlay.classList.add('active');
                    return;
                }
            }
        }
    }

    // 2. Check for lose condition
    // A board is lost if no empty cells exist AND no adjacent cell matches values
    let movesLeft = false;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) {
                movesLeft = true;
                break;
            }
            if (r < 3 && board[r][c] === board[r + 1][c]) {
                movesLeft = true;
                break;
            }
            if (c < 3 && board[r][c] === board[r][c + 1]) {
                movesLeft = true;
                break;
            }
        }
    }

    if (!movesLeft) {
        gameOver = true;
        playSound('gameover');
        failScoreVal.textContent = score;
        gameOverOverlay.classList.add('active');
    }
}

// Keyboard Bindings
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault(); // restrict screen jumping scrolls
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') makeMove('left');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') makeMove('right');
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') makeMove('up');
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') makeMove('down');
});

// Mobile Swiping Listeners
let touchStartX = 0;
let touchStartY = 0;

swipeArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

swipeArea.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // Minimum swipe distance threshold
    if (Math.max(absDiffX, absDiffY) > 30) {
        if (absDiffX > absDiffY) {
            if (diffX > 0) makeMove('right');
            else makeMove('left');
        } else {
            if (diffY > 0) makeMove('down');
            else makeMove('up');
        }
    }
    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

// UI Action Triggers
restartBtn.addEventListener('click', initGame);
keepPlayingBtn.addEventListener('click', () => {
    continuePlaying = true;
    winOverlay.classList.remove('active');
});
winRestartBtn.addEventListener('click', initGame);
failRestartBtn.addEventListener('click', initGame);

// Run init
initGame();
