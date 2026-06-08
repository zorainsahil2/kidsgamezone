// Snake Classic Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Game Constants
const GRID_COUNT = 20; // 20x20 grid
const GRID_SIZE = canvas.width / GRID_COUNT; // 20px per cell
const HIGH_SCORE_KEY = 'kgz_highscore_snake-classic';

// Game state variables
let state = 'MENU';
let score = 0;
let highScore = localStorage.getItem(HIGH_SCORE_KEY) ? parseInt(localStorage.getItem(HIGH_SCORE_KEY)) : 0;
highScoreVal.innerText = highScore;

// Snake properties
let snake = [];
let dir = { x: 1, y: 0 }; // Moving right initially
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };

// Frame speed ticks regulation (Run game loop at ~10 FPS instead of 60 FPS)
let frameCount = 0;
const GAME_SPEED = 7; // Update every 7 frames (~8.5 FPS)

// Touch swipe variables
let touchStartX = 0;
let touchStartY = 0;

// Reset Game state
function resetGame() {
    score = 0;
    scoreVal.innerText = score;
    
    // Initial snake (3 blocks in center)
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    
    spawnFood();
}

// Spawns food at random grid coordinate excluding snake body
function spawnFood() {
    let attempts = 0;
    while (attempts < 100) {
        let rx = Math.floor(Math.random() * GRID_COUNT);
        let ry = Math.floor(Math.random() * GRID_COUNT);
        
        // Check if overlaps snake
        let overlap = snake.some(seg => seg.x === rx && seg.y === ry);
        if (!overlap) {
            food = { x: rx, y: ry };
            return;
        }
        attempts++;
    }
    // Fallback in case snake is huge
    food = { x: 1, y: 1 };
}

// User Actions
function handleDirection(dx, dy) {
    if (state === 'MENU') {
        state = 'PLAYING';
        resetGame();
    } else if (state === 'PLAYING') {
        // Prevent 180 degree turns (going backward into self)
        if ((dx !== 0 && dir.x === 0) || (dy !== 0 && dir.y === 0)) {
            nextDir = { x: dx, y: dy };
        }
    } else if (state === 'GAME_OVER') {
        state = 'PLAYING';
        resetGame();
    }
}

// Keyboard keydowns
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            e.preventDefault();
            handleDirection(0, -1);
            break;
        case 'ArrowDown':
        case 'KeyS':
            e.preventDefault();
            handleDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'KeyA':
            e.preventDefault();
            handleDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'KeyD':
            e.preventDefault();
            handleDirection(1, 0);
            break;
        case 'Space':
            e.preventDefault();
            if (state !== 'PLAYING') {
                state = 'PLAYING';
                resetGame();
            }
            break;
    }
});

// Mobile Swipe gestures mapping
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.changedTouches.length === 1) {
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;

        let diffX = touchEndX - touchStartX;
        let diffY = touchEndY - touchStartY;

        // If swipe distance is above threshold
        if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal Swipe
                if (diffX > 0) {
                    handleDirection(1, 0); // Right
                } else {
                    handleDirection(-1, 0); // Left
                }
            } else {
                // Vertical Swipe
                if (diffY > 0) {
                    handleDirection(0, 1); // Down
                } else {
                    handleDirection(0, -1); // Up
                }
            }
        } else {
            // Tap counts as general trigger (like restart or start)
            if (state !== 'PLAYING') {
                state = 'PLAYING';
                resetGame();
            }
        }
    }
}, { passive: false });

restartBtn.addEventListener('click', () => {
    state = 'PLAYING';
    resetGame();
});

// Game logic tick
function update() {
    if (state !== 'PLAYING') return;

    // Apply next queued direction
    dir = nextDir;

    // Calculate new head coordinate
    let head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };

    // Border Collision Check
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        gameOver();
        return;
    }

    // Self Collision Check
    let collideSelf = snake.some(seg => seg.x === head.x && seg.y === head.y);
    if (collideSelf) {
        gameOver();
        return;
    }

    // Insert new head
    snake.unshift(head);

    // Food collision check
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreVal.innerText = score;
        spawnFood();
    } else {
        // Pop tail if no food eaten
        snake.pop();
    }
}

function gameOver() {
    state = 'GAME_OVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreVal.innerText = highScore;
    }
}

// Drawing canvas elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid lines in background
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // 2. Draw Food (Red circle)
    ctx.fillStyle = '#E53E3E'; // Red
    ctx.beginPath();
    let pad = 2;
    let centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    let centerY = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.arc(centerX, centerY, GRID_SIZE / 2 - pad, 0, Math.PI * 2);
    ctx.fill();

    // Cute green leaf on top of red apple/food
    ctx.fillStyle = '#48BB78';
    ctx.beginPath();
    ctx.ellipse(centerX + 3, centerY - 8, 4, 2, Math.PI/4, 0, Math.PI*2);
    ctx.fill();

    // 3. Draw Snake (Green blocks with a detailed head)
    snake.forEach((seg, idx) => {
        let isHead = idx === 0;
        ctx.fillStyle = isHead ? '#48BB78' : '#38A169'; // light/dark green
        ctx.strokeStyle = '#1a202c';
        ctx.lineWidth = 2;

        let rx = seg.x * GRID_SIZE;
        let ry = seg.y * GRID_SIZE;
        
        ctx.fillRect(rx + 1, ry + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.strokeRect(rx, ry, GRID_SIZE, GRID_SIZE);

        if (isHead) {
            // Draw eyes on head based on direction
            ctx.fillStyle = '#FFFFFF';
            if (dir.x !== 0) {
                // Horizontal eyes
                ctx.fillRect(rx + (dir.x > 0 ? 12 : 4), ry + 3, 4, 4);
                ctx.fillRect(rx + (dir.x > 0 ? 12 : 4), ry + 13, 4, 4);
                ctx.fillStyle = '#000';
                ctx.fillRect(rx + (dir.x > 0 ? 14 : 4), ry + 4, 2, 2);
                ctx.fillRect(rx + (dir.x > 0 ? 14 : 4), ry + 14, 2, 2);
            } else {
                // Vertical eyes
                ctx.fillRect(rx + 3, ry + (dir.y > 0 ? 12 : 4), 4, 4);
                ctx.fillRect(rx + 13, ry + (dir.y > 0 ? 12 : 4), 4, 4);
                ctx.fillStyle = '#000';
                ctx.fillRect(rx + 4, ry + (dir.y > 0 ? 14 : 4), 2, 2);
                ctx.fillRect(rx + 14, ry + (dir.y > 0 ? 14 : 4), 2, 2);
            }
        }
    });

    // Overlays
    if (state === 'MENU') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4ECDC4';
        ctx.font = "800 2.2rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('Snake Classic', canvas.width/2, canvas.height/2 - 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1rem 'Nunito', sans-serif";
        ctx.fillText('Press Arrows/WASD or Swipe to Start!', canvas.width/2, canvas.height/2 + 20);
    } else if (state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF6B35';
        ctx.font = "800 2.5rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1.1rem 'Nunito', sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 35);
        ctx.fillText('Press SPACE/Arrows or Swipe to Restart!', canvas.width/2, canvas.height/2 + 65);
    }
}

// Master frame loop ticker
function loop() {
    frameCount++;
    if (frameCount >= GAME_SPEED) {
        update();
        frameCount = 0;
    }
    draw();
    requestAnimationFrame(loop);
}

// Boot
resetGame();
loop();
