/**
 * KidsGameZone: Word Search
 * 10x10 pre-baked letter grids, mouse/touch drag highlights, animal checklists,
 * stopwatch timers, and Web Audio chimes.
 */

const STORAGE_KEY = 'kgz_highscore_word-search';

// Grids Definition (10x10)
const levels = [
    {
        // Level 1: CAT, DOG, FISH, BIRD, LION, BEAR, FROG, DUCK
        grid: [
            ['C', 'R', 'E', 'A', 'L', 'I', 'O', 'N', 'Z', 'P'],
            ['A', 'B', 'I', 'R', 'D', 'W', 'E', 'X', 'O', 'I'],
            ['T', 'K', 'J', 'H', 'G', 'F', 'D', 'S', 'A', 'Q'],
            ['Y', 'U', 'I', 'O', 'F', 'I', 'S', 'H', 'W', 'E'],
            ['R', 'T', 'D', 'Y', 'B', 'U', 'I', 'O', 'P', 'A'],
            ['S', 'D', 'O', 'F', 'G', 'E', 'H', 'J', 'K', 'D'],
            ['Z', 'X', 'G', 'C', 'V', 'B', 'A', 'N', 'M', 'U'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'R', 'I', 'C'],
            ['O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
            ['L', 'K', 'F', 'R', 'O', 'G', 'X', 'C', 'V', 'B']
        ],
        words: [
            { text: 'CAT', coords: [[0,0], [1,0], [2,0]], found: false },
            { text: 'BIRD', coords: [[1,1], [1,2], [1,3], [1,4]], found: false },
            { text: 'LION', coords: [[0,4], [0,5], [0,6], [0,7]], found: false },
            { text: 'FISH', coords: [[3,4], [3,5], [3,6], [3,7]], found: false },
            { text: 'DOG', coords: [[4,2], [5,2], [6,2]], found: false },
            { text: 'BEAR', coords: [[4,4], [5,5], [6,6], [7,7]], found: false },
            { text: 'DUCK', coords: [[5,9], [6,9], [7,9], [8,9]], found: false },
            { text: 'FROG', coords: [[9,2], [9,3], [9,4], [9,5]], found: false }
        ]
    },
    {
        // Level 2: GOAT, DEER, WOLF, OWL, BULL, FOX, HORSE, SHEEP
        grid: [
            ['Z', 'G', 'O', 'A', 'T', 'Q', 'W', 'E', 'R', 'T'],
            ['Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'W'],
            ['D', 'F', 'G', 'H', 'H', 'O', 'R', 'S', 'E', 'O'],
            ['E', 'J', 'K', 'L', 'Z', 'B', 'X', 'C', 'V', 'L'],
            ['E', 'F', 'M', 'N', 'O', 'U', 'P', 'Q', 'R', 'F'],
            ['R', 'S', 'O', 'T', 'U', 'L', 'V', 'W', 'X', 'Y'],
            ['Z', 'A', 'B', 'C', 'O', 'W', 'L', 'D', 'E', 'F'],
            ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
            ['Q', 'R', 'S', 'H', 'E', 'E', 'P', 'S', 'T', 'U'],
            ['V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E']
        ],
        words: [
            { text: 'GOAT', coords: [[0,1], [0,2], [0,3], [0,4]], found: false },
            { text: 'WOLF', coords: [[1,9], [2,9], [3,9], [4,9]], found: false },
            { text: 'DEER', coords: [[2,0], [3,0], [4,0], [5,0]], found: false },
            { text: 'HORSE', coords: [[2,4], [2,5], [2,6], [2,7], [2,8]], found: false },
            { text: 'BULL', coords: [[3,5], [4,5], [5,5], [6,5]], found: false },
            { text: 'FOX', coords: [[4,1], [5,2], [6,3]], found: false },
            { text: 'OWL', coords: [[6,4], [6,5], [6,6]], found: false },
            { text: 'SHEEP', coords: [[8,2], [8,3], [8,4], [8,5], [8,6]], found: false }
        ]
    },
    {
        // Level 3: SHARK, SEAL, CRAB, WHALE, TIGER, MONKEY, SNAKE, ZEBRA
        grid: [
            ['A', 'B', 'S', 'H', 'A', 'R', 'K', 'C', 'D', 'E'],
            ['S', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
            ['E', 'O', 'P', 'Q', 'W', 'H', 'A', 'L', 'E', 'R'],
            ['A', 'T', 'I', 'G', 'E', 'R', 'S', 'T', 'U', 'C'],
            ['L', 'V', 'W', 'X', 'Y', 'Z', 'A', 'M', 'B', 'R'],
            ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'O', 'J', 'A'],
            ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'N', 'R', 'B'],
            ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'K', 'Z', 'A'],
            ['B', 'C', 'S', 'N', 'A', 'K', 'E', 'E', 'D', 'F'],
            ['G', 'Z', 'E', 'B', 'R', 'A', 'H', 'Y', 'I', 'J']
        ],
        words: [
            { text: 'SHARK', coords: [[0,2], [0,3], [0,4], [0,5], [0,6]], found: false },
            { text: 'SEAL', coords: [[1,0], [2,0], [3,0], [4,0]], found: false },
            { text: 'WHALE', coords: [[2,4], [2,5], [2,6], [2,7], [2,8]], found: false },
            { text: 'TIGER', coords: [[3,1], [3,2], [3,3], [3,4], [3,5]], found: false },
            { text: 'CRAB', coords: [[3,9], [4,9], [5,9], [6,9]], found: false },
            { text: 'MONKEY', coords: [[4,7], [5,7], [6,7], [7,7], [8,7], [9,7]], found: false },
            { text: 'SNAKE', coords: [[8,2], [8,3], [8,4], [8,5], [8,6]], found: false },
            { text: 'ZEBRA', coords: [[9,1], [9,2], [9,3], [9,4], [9,5]], found: false }
        ]
    }
];

// DOM Selectors
const searchGrid = document.getElementById('searchGrid');
const wordChecklist = document.getElementById('wordChecklist');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const timerVal = document.getElementById('timerVal');
const restartBtn = document.getElementById('restartBtn');

// Tabs
const levelBtns = document.querySelectorAll('.level-btn');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Game State
let currentLevel = 0;
let score = 1000;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let seconds = 0;
let gameStarted = false;
let gameOver = false;
let timerClock = null;

// Drag state
let isDragging = false;
let startCell = null;
let selectedCells = [];

// Audio Setup
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

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'found') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
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
    }
}

// Initialize Board UI
highScoreVal.textContent = highScore;

function initLevel() {
    searchGrid.innerHTML = '';
    wordChecklist.innerHTML = '';
    seconds = 0;
    score = 1000;
    gameOver = false;

    timerVal.textContent = seconds;
    scoreVal.textContent = score;

    winOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    // Retrieve Level Data
    const levelData = levels[currentLevel];
    // Reset found flags
    levelData.words.forEach(w => w.found = false);

    // Build 10x10 Grid cells
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = levelData.grid[r][c];
            cell.setAttribute('data-r', r);
            cell.setAttribute('data-c', c);
            searchGrid.appendChild(cell);
        }
    }

    // Build Word Checklist UI
    levelData.words.forEach((w, idx) => {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        item.id = `word-item-${idx}`;
        item.innerHTML = `<span>${w.text}</span> <span class="chk-status">🔍</span>`;
        wordChecklist.appendChild(item);
    });

    if (timerClock) clearInterval(timerClock);
    if (gameStarted) {
        timerClock = setInterval(updateTimer, 1000);
    }
}

// Timer Ticks
function updateTimer() {
    if (gameOver) return;
    seconds++;
    timerVal.textContent = seconds;
    score = Math.max(100, 1000 - seconds);
    scoreVal.textContent = score;
}

// Grid cells Selection Handlers
function getCellCoords(el) {
    if (!el || !el.classList.contains('cell')) return null;
    return {
        r: parseInt(el.getAttribute('data-r')),
        c: parseInt(el.getAttribute('data-c'))
    };
}

function selectCellRange(start, end) {
    // Clear old drag highlighting
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => c.classList.remove('selected'));

    const dr = end.r - start.r;
    const dc = end.c - start.c;

    // Check if points form straight horizontal, vertical, or diagonal lines
    const isHorizontal = dr === 0;
    const isVertical = dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc);

    if (!isHorizontal && !isVertical && !isDiagonal) return;

    selectedCells = [];
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / steps;
    const stepC = dc === 0 ? 0 : dc / steps;

    for (let i = 0; i <= steps; i++) {
        const currR = start.r + i * stepR;
        const currC = start.c + i * stepC;
        const el = document.querySelector(`.cell[data-r='${currR}'][data-c='${currC}']`);
        if (el) {
            el.classList.add('selected');
            selectedCells.push({ r: currR, c: currC, el: el });
        }
    }
}

function handleDown(e) {
    if (gameOver || !gameStarted) return;
    const target = e.touches ? document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : e.target;
    const coords = getCellCoords(target);
    if (coords) {
        isDragging = true;
        startCell = coords;
        selectCellRange(startCell, startCell);
        playSound('click');
    }
}

function handleMove(e) {
    if (!isDragging || !startCell) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const target = document.elementFromPoint(clientX, clientY);
    const coords = getCellCoords(target);
    if (coords) {
        selectCellRange(startCell, coords);
    }
}

function handleUp() {
    if (!isDragging) return;
    isDragging = false;

    // Form sequence string
    let seq = '';
    selectedCells.forEach(cell => seq += cell.el.textContent);

    const reversedSeq = seq.split('').reverse().join('');
    const levelData = levels[currentLevel];
    let matchedWord = null;

    // Match against target level word list
    levelData.words.forEach((w, idx) => {
        if (!w.found && (seq === w.text || reversedSeq === w.text)) {
            w.found = true;
            matchedWord = w;

            // Highlight checklist item as green
            const item = document.getElementById(`word-item-${idx}`);
            item.className = 'checklist-item found';
            item.querySelector('.chk-status').textContent = '✅';
        }
    });

    if (matchedWord) {
        // Lock grid cells to green found status
        selectedCells.forEach(cell => {
            cell.el.classList.add('found');
        });
        playSound('found');
        checkWin();
    } else {
        playSound('wrong');
    }

    // Clear yellow highlights
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => c.classList.remove('selected'));
    startCell = null;
    selectedCells = [];
}

function checkWin() {
    const levelData = levels[currentLevel];
    const allFound = levelData.words.every(w => w.found);
    if (allFound) {
        gameOver = true;
        clearInterval(timerClock);
        playSound('win');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_KEY, highScore);
            highScoreVal.textContent = highScore;
        }

        failScoreVal.textContent = score;
        overlayHighScoreVal.textContent = highScore;
        gameOverOverlay.classList.add('active');
    }
}

// Mouse Event Hooks
searchGrid.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

// Touch Event Hooks
searchGrid.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDown(e);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
}, { passive: false });

window.addEventListener('touchend', handleUp);

// Level selector buttons
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = parseInt(btn.getAttribute('data-level'));
        playSound('click');
        initLevel();
    });
});

// Action buttons
restartBtn.addEventListener('click', initLevel);
startBtn.addEventListener('click', () => {
    startOverlay.classList.remove('active');
    gameStarted = true;
    timerClock = setInterval(updateTimer, 1000);
});
failRestartBtn.addEventListener('click', () => {
    initLevel();
});

// Run
initLevel();
