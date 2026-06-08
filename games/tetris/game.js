// Tetris Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const linesVal = document.getElementById('linesVal');
const levelVal = document.getElementById('levelVal');
const restartBtn = document.getElementById('restartBtn');

// Board constants
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 24; // 240x480 canvas
const HIGH_SCORE_KEY = 'kgz_highscore_tetris';

// Colors & Shapes
const SHAPES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ]
};

const COLORS = {
    I: '#00ced1', // Cyan
    O: '#ffe66d', // Yellow
    T: '#a855f7', // Purple
    S: '#4ecdc4', // Turquoise
    Z: '#ff4a4a', // Red
    J: '#3b82f6', // Blue
    L: '#ff6b35'  // Orange
};

const SHAPE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// State variables
let state = 'MENU';
let score = 0;
let highScore = localStorage.getItem(HIGH_SCORE_KEY) ? parseInt(localStorage.getItem(HIGH_SCORE_KEY)) : 0;
highScoreVal.innerText = highScore;

let linesCleared = 0;
let level = 1;
let grid = [];

// Piece properties
let currentPiece = null;
let nextPiece = null;

// Falling rates
let dropCounter = 0;
let dropInterval = 1000; // in milliseconds, start at 1000ms
let lastTime = 0;

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;
let swipeTriggered = false;

// Create clean board grid representation
function createGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid.push(new Array(COLS).fill(0));
    }
}

// Generate new random piece
function randomPiece() {
    const rand = Math.floor(Math.random() * SHAPE_KEYS.length);
    const key = SHAPE_KEYS[rand];
    return {
        matrix: JSON.parse(JSON.stringify(SHAPES[key])),
        color: COLORS[key],
        x: Math.floor((COLS - SHAPES[key][0].length) / 2),
        y: key === 'I' ? -1 : 0
    };
}

// Reset Game
function resetGame() {
    score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 1000;
    
    scoreVal.innerText = score;
    linesVal.innerText = linesCleared;
    levelVal.innerText = level;
    
    createGrid();
    
    nextPiece = randomPiece();
    spawnPiece();
}

// Spawns the next block into the game grid
function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    
    // Check game over on spawn
    if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        gameOver();
    }
    
    drawNextPiece();
}

// Collision boundary checks
function checkCollision(matrix, px, py) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
                let nextX = px + c;
                let nextY = py + r;
                
                // Out of boundaries
                if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
                    return true;
                }
                
                // Overlap with static grid
                if (nextY >= 0 && grid[nextY][nextX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Lock active piece elements into board grid
function lockPiece() {
    const matrix = currentPiece.matrix;
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
                // If it locks above screen, it's game over
                if (currentPiece.y + r < 0) {
                    gameOver();
                    return;
                }
                grid[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
            }
        }
    }
    
    clearLines();
    spawnPiece();
}

// Clears complete rows, triggers scoring multiplier
function clearLines() {
    let rowsClearedThisTurn = 0;
    
    outer: for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 0) {
                continue outer;
            }
        }
        
        // Remove line and add empty row at top
        grid.splice(r, 1);
        grid.unshift(new Array(COLS).fill(0));
        
        rowsClearedThisTurn++;
        r++; // Offset r because we shifted rows
    }
    
    if (rowsClearedThisTurn > 0) {
        // Scoring system: 1=100, 2=300, 3=500, 4=800 points
        const pointsMap = [0, 100, 300, 500, 800];
        let basePoints = pointsMap[rowsClearedThisTurn] || 800;
        score += basePoints * level;
        scoreVal.innerText = score;
        
        linesCleared += rowsClearedThisTurn;
        linesVal.innerText = linesCleared;
        
        // Level up every 10 lines
        let newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel !== level) {
            level = newLevel;
            levelVal.innerText = level;
            // Reduce interval: faster fall speed
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

// Input actions
function moveLeft() {
    currentPiece.x--;
    if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        currentPiece.x++;
    }
}

function moveRight() {
    currentPiece.x++;
    if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        currentPiece.x--;
    }
}

function rotatePiece() {
    const matrix = currentPiece.matrix;
    const n = matrix.length;
    // Transpose
    let temp = [];
    for (let r = 0; r < n; r++) {
        temp.push([]);
        for (let c = 0; c < n; c++) {
            temp[r].push(matrix[c][r]);
        }
    }
    // Reverse rows
    for (let r = 0; r < n; r++) {
        temp[r].reverse();
    }
    
    // Wall kick simple check
    let originalX = currentPiece.x;
    let originalMatrix = currentPiece.matrix;
    currentPiece.matrix = temp;
    
    let offset = 0;
    while (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y) && offset < 3) {
        currentPiece.x += (currentPiece.x > COLS / 2) ? -1 : 1;
        offset++;
    }
    
    // Revert if collides still after offset kicks
    if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        currentPiece.matrix = originalMatrix;
        currentPiece.x = originalX;
    }
}

function softDrop() {
    currentPiece.y++;
    if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        currentPiece.y--;
        lockPiece();
    }
    dropCounter = 0; // reset drop timer
}

function hardDrop() {
    while (!checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    }
    lockPiece();
    dropCounter = 0;
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
    if (state !== 'PLAYING') {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            state = 'PLAYING';
            resetGame();
        }
        return;
    }
    
    switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            rotatePiece();
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            softDrop();
            break;
        case 'Space':
            e.preventDefault();
            hardDrop();
            break;
    }
});

// Mobile Gestures Swipe logic
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swipeTriggered = false;
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (state !== 'PLAYING' || e.touches.length !== 1 || swipeTriggered) return;
    
    let diffX = e.touches[0].clientX - touchStartX;
    let diffY = e.touches[0].clientY - touchStartY;
    
    if (Math.abs(diffX) > 25) {
        if (diffX > 0) {
            moveRight();
        } else {
            moveLeft();
        }
        swipeTriggered = true;
    } else if (diffY > 35) {
        softDrop();
        swipeTriggered = true;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    // A quick tap rotates the piece
    if (!swipeTriggered) {
        if (state === 'PLAYING') {
            rotatePiece();
        } else {
            state = 'PLAYING';
            resetGame();
        }
    }
}, { passive: false });

restartBtn.addEventListener('click', () => {
    state = 'PLAYING';
    resetGame();
});

function gameOver() {
    state = 'GAME_OVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreVal.innerText = highScore;
    }
}

// Drawing canvas methods
function drawBlock(cContext, x, y, color, size) {
    cContext.fillStyle = color;
    cContext.fillRect(x, y, size, size);
    
    // Borders
    cContext.strokeStyle = 'rgba(0,0,0,0.3)';
    cContext.lineWidth = 1.5;
    cContext.strokeRect(x, y, size, size);
    
    // Bubbly reflection look
    cContext.fillStyle = 'rgba(255,255,255,0.2)';
    cContext.fillRect(x + 2, y + 2, size - 4, 3);
    cContext.fillRect(x + 2, y + 5, 3, size - 7);
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    
    const matrix = nextPiece.matrix;
    const size = 16; // smaller blocks for next box
    const offX = (nextCanvas.width - matrix[0].length * size) / 2;
    const offY = (nextCanvas.height - matrix.length * size) / 2;
    
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
                drawBlock(nextCtx, offX + c * size, offY + r * size, nextPiece.color, size);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw static locked blocks in grid
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] !== 0) {
                drawBlock(ctx, c * BLOCK_SIZE, r * BLOCK_SIZE, grid[r][c], BLOCK_SIZE);
            }
        }
    }
    
    // Draw active falling piece
    if (state === 'PLAYING' && currentPiece) {
        const matrix = currentPiece.matrix;
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] !== 0) {
                    drawBlock(ctx, (currentPiece.x + c) * BLOCK_SIZE, (currentPiece.y + r) * BLOCK_SIZE, currentPiece.color, BLOCK_SIZE);
                }
            }
        }
    }
    
    // Draw state overlays
    if (state === 'MENU') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFE66D';
        ctx.font = "800 1.8rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('TETRIS', canvas.width/2, canvas.height/2 - 10);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 0.85rem 'Nunito', sans-serif";
        ctx.fillText('Press SPACE or TAP to Play!', canvas.width/2, canvas.height/2 + 25);
    } else if (state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FF6B35';
        ctx.font = "800 2.2rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 0.95rem 'Nunito', sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 25);
        ctx.fillText('Press SPACE or TAP to restart', canvas.width/2, canvas.height/2 + 55);
    }
}

// Master frame loop ticker with elapsed delta updates
function updateFrame(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (state === 'PLAYING') {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            softDrop();
        }
    }
    
    draw();
    requestAnimationFrame(updateFrame);
}

// Reset data and run loop
resetGame();
updateFrame();
