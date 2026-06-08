/**
 * KidsGameZone: Sweet Match-3 (Candy Crush Clone)
 * Grid swapping algorithms, recursive cascades check, combo multiplier lines, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_candy-crush';

const candyGrid = document.getElementById('candyGrid');
const scoreVal = document.getElementById('scoreVal');
const comboVal = document.getElementById('comboVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Emojis mapping
const CANDY_TYPES = [
    { emoji: '🍬', name: 'Wrapped Candy', bg: 'rgba(235, 104, 76, 0.15)' },
    { emoji: '🍭', name: 'Lollipop', bg: 'rgba(78, 205, 196, 0.15)' },
    { emoji: '🍫', name: 'Chocolate Bar', bg: 'rgba(121, 85, 72, 0.15)' },
    { emoji: '🍡', name: 'Dango Skewer', bg: 'rgba(72, 187, 120, 0.15)' },
    { emoji: '🧁', name: 'Cupcake', bg: 'rgba(168, 85, 247, 0.15)' },
    { emoji: '🍰', name: 'Shortcake', bg: 'rgba(237, 100, 166, 0.15)' }
];

const GRID_SIZE = 8;

// State Variables
let board = []; // 8x8 2D grid containing color indices
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let combo = 1;
let selectedCell = null; // {row, col}
let isProcessing = false;

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

    if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'swap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'match') {
        // Double tone twinkle chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
    } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// Init display
highScoreVal.textContent = highScore;

// Generate Grid with NO pre-existing matches
function initBoard() {
    board = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        board[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            let possibleColors = [0, 1, 2, 3, 4, 5];

            // Filter out colors that would make 3-in-a-row horizontally
            if (c >= 2) {
                const h1 = board[r][c - 1];
                const h2 = board[r][c - 2];
                if (h1 === h2) {
                    possibleColors = possibleColors.filter(idx => idx !== h1);
                }
            }

            // Filter out colors that would make 3-in-a-row vertically
            if (r >= 2) {
                const v1 = board[r - 1][c];
                const v2 = board[r - 2][c];
                if (v1 === v2) {
                    possibleColors = possibleColors.filter(idx => idx !== v1);
                }
            }

            // Select random remaining color
            const randColor = possibleColors[Math.floor(Math.random() * possibleColors.length)];
            board[r][c] = randColor;
        }
    }
}

// Render Board DOM
function drawBoard() {
    candyGrid.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'candy-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            const colorIdx = board[r][c];
            if (colorIdx !== null) {
                const spec = CANDY_TYPES[colorIdx];
                cell.textContent = spec.emoji;
                cell.style.backgroundColor = spec.bg;
            }

            if (selectedCell && selectedCell.row === r && selectedCell.col === c) {
                cell.classList.add('selected');
            }

            // Click listener
            cell.addEventListener('mousedown', () => selectCell(r, c));
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectCell(r, c);
            }, { passive: false });

            candyGrid.appendChild(cell);
        }
    }
}

// Handle Select/Swap Actions
function selectCell(r, c) {
    if (isProcessing) return;

    playSound('select');

    if (selectedCell === null) {
        // First selection
        selectedCell = { row: r, col: c };
        drawBoard();
    } else {
        // Second selection
        const rDiff = Math.abs(selectedCell.row - r);
        const cDiff = Math.abs(selectedCell.col - c);

        // Check if adjacent
        if ((rDiff === 1 && cDiff === 0) || (rDiff === 0 && cDiff === 1)) {
            // Swap!
            swapCells(selectedCell.row, selectedCell.col, r, c);
            selectedCell = null;
        } else {
            // Cancel/reselect
            selectedCell = { row: r, col: c };
            drawBoard();
        }
    }
}

function swapCells(r1, c1, r2, c2) {
    isProcessing = true;
    playSound('swap');

    // Swap values
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;

    drawBoard();

    // Check matches
    setTimeout(() => {
        const matches = checkAllMatches();
        if (matches.length > 0) {
            combo = 1;
            comboVal.textContent = `x${combo}`;
            processMatches(matches);
        } else {
            // Swap back if no match
            playSound('fail');
            const restore = board[r1][c1];
            board[r1][c1] = board[r2][c2];
            board[r2][c2] = restore;
            drawBoard();
            isProcessing = false;
        }
    }, 200);
}

// Match Finding Algorithm
function checkAllMatches() {
    const matchedCoords = [];
    const hMatched = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false));
    const vMatched = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false));

    // 1. Horizontal checks
    for (let r = 0; r < GRID_SIZE; r++) {
        let matchLength = 1;
        for (let c = 0; c < GRID_SIZE; c++) {
            const current = board[r][c];
            const next = (c < GRID_SIZE - 1) ? board[r][c + 1] : null;

            if (current !== null && current === next) {
                matchLength++;
            } else {
                if (matchLength >= 3) {
                    for (let colIdx = c - matchLength + 1; colIdx <= c; colIdx++) {
                        hMatched[r][colIdx] = true;
                    }
                }
                matchLength = 1;
            }
        }
    }

    // 2. Vertical checks
    for (let c = 0; c < GRID_SIZE; c++) {
        let matchLength = 1;
        for (let r = 0; r < GRID_SIZE; r++) {
            const current = board[r][c];
            const next = (r < GRID_SIZE - 1) ? board[r + 1][c] : null;

            if (current !== null && current === next) {
                matchLength++;
            } else {
                if (matchLength >= 3) {
                    for (let rowIdx = r - matchLength + 1; rowIdx <= r; rowIdx++) {
                        vMatched[rowIdx][c] = true;
                    }
                }
                matchLength = 1;
            }
        }
    }

    // 3. Assemble unique matching coordinates
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (hMatched[r][c] || vMatched[r][c]) {
                matchedCoords.push({ row: r, col: c });
            }
        }
    }

    return matchedCoords;
}

// Process popped elements and drop cascades
function processMatches(matches) {
    playSound('match');

    // Display POP animation in DOM (add CSS class 'pop')
    matches.forEach(m => {
        const cellDOM = candyGrid.querySelector(`[data-row="${m.row}"][data-col="${m.col}"]`);
        if (cellDOM) cellDOM.classList.add('pop');
    });

    // Award Points
    let ptsGained = matches.length * 10 * combo;
    score += ptsGained;
    scoreVal.textContent = score;

    // High Score check
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    setTimeout(() => {
        // Clear cells in board model
        matches.forEach(m => {
            board[m.row][m.col] = null;
        });

        // Cascading fall logic
        applyCascades();
        drawBoard();

        // Check if cascade forms further matches
        setTimeout(() => {
            const cascadeMatches = checkAllMatches();
            if (cascadeMatches.length > 0) {
                combo++;
                comboVal.textContent = `x${combo}`;
                processMatches(cascadeMatches);
            } else {
                isProcessing = false;
            }
        }, 300);
    }, 250);
}

// Shift items down and insert new ones at top
function applyCascades() {
    for (let c = 0; c < GRID_SIZE; c++) {
        // Read active column tiles, filter out nulls
        const columnColors = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            if (board[r][c] !== null) {
                columnColors.push(board[r][c]);
            }
        }

        // Fill remaining top items with random colors
        const needed = GRID_SIZE - columnColors.length;
        for (let i = 0; i < needed; i++) {
            columnColors.unshift(Math.floor(Math.random() * CANDY_TYPES.length));
        }

        // Reassign column colors to board
        for (let r = 0; r < GRID_SIZE; r++) {
            board[r][c] = columnColors[r];
        }
    }
}

// State controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    combo = 1;
    scoreVal.textContent = score;
    comboVal.textContent = `x${combo}`;

    initBoard();
    selectedCell = null;
    isProcessing = false;
    drawBoard();
}

restartBtn.addEventListener('click', startGame);

// Kickoff
startGame();
