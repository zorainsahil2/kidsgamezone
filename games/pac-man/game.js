// Pac-Man Simplified Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Grid Configuration
const GRID_SIZE = 19;
const CELL_SIZE = canvas.width / GRID_SIZE; // 20px per cell
const HIGH_SCORE_KEY = 'kgz_highscore_pac-man';

// Game state variables
let state = 'MENU';
let score = 0;
let highScore = localStorage.getItem(HIGH_SCORE_KEY) ? parseInt(localStorage.getItem(HIGH_SCORE_KEY)) : 0;
highScoreVal.innerText = highScore;

// Map templates
// 1 = Wall, 2 = Dot, 3 = Power Pellet, 0 = Empty/Path
let originalMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = [];

// Pacman configuration
let pacman = {
    x: 9,
    y: 14,
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0,
    mouthAngle: 0.2,
    mouthDir: 0.02
};

// Ghosts
let ghosts = [];
const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']; // Blinky, Pinky, Inky, Clyde

// Frightened Timer (for eating ghosts)
let frightenedTimer = 0;

// Grid checks
let totalDots = 0;
let eatenDots = 0;

// Speed regulator
let frameCount = 0;
const GAME_SPEED = 8; // Ticks update every 8 frames (~7.5 FPS)

// Touch swipes
let touchStartX = 0;
let touchStartY = 0;

// Reset Game
function resetGame() {
    score = 0;
    scoreVal.innerText = score;
    eatenDots = 0;
    frightenedTimer = 0;

    // Deep copy original map
    map = JSON.parse(JSON.stringify(originalMap));

    // Calculate total dots
    totalDots = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (map[r][c] === 2 || map[r][c] === 3) {
                totalDots++;
            }
        }
    }

    // Reset Pac-Man
    pacman.x = 9;
    pacman.y = 14;
    pacman.dx = -1; // start moving left
    pacman.dy = 0;
    pacman.nextDx = -1;
    pacman.nextDy = 0;

    // Reset Ghosts
    ghosts = [
        { x: 8, y: 10, color: GHOST_COLORS[0], dx: 0, dy: -1 },
        { x: 9, y: 10, color: GHOST_COLORS[1], dx: 0, dy: -1 },
        { x: 10, y: 10, color: GHOST_COLORS[2], dx: 0, dy: -1 },
        { x: 9, y: 8, color: GHOST_COLORS[3], dx: -1, dy: 0 }
    ];
}

// Direction Handler
function handleDirection(dx, dy) {
    if (state === 'MENU') {
        state = 'PLAYING';
        resetGame();
    } else if (state === 'PLAYING') {
        pacman.nextDx = dx;
        pacman.nextDy = dy;
    } else if (state === 'GAME_OVER' || state === 'WIN') {
        state = 'PLAYING';
        resetGame();
    }
}

// Keys binding
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

// Mobile Swipes
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
        let diffX = e.changedTouches[0].clientX - touchStartX;
        let diffY = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(diffX) > 25 || Math.abs(diffY) > 25) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) handleDirection(1, 0);
                else handleDirection(-1, 0);
            } else {
                if (diffY > 0) handleDirection(0, 1);
                else handleDirection(0, -1);
            }
        } else {
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

// Helper check wall collision
function isWall(gx, gy) {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) {
        return true;
    }
    return map[gy][gx] === 1;
}

// Ghost Move AI
function moveGhost(ghost) {
    // Generate valid directions (no 180-deg reversal unless blocked)
    const dirs = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    let validMoves = [];
    dirs.forEach(d => {
        let nx = ghost.x + d.x;
        let ny = ghost.y + d.y;
        
        // Prevent going opposite direction unless absolutely blocked
        let opposite = d.x === -ghost.dx && d.y === -ghost.dy;
        if (!isWall(nx, ny) && !opposite) {
            validMoves.push(d);
        }
    });

    // Fallback if blocked
    if (validMoves.length === 0) {
        dirs.forEach(d => {
            let nx = ghost.x + d.x;
            let ny = ghost.y + d.y;
            if (!isWall(nx, ny)) {
                validMoves.push(d);
            }
        });
    }

    if (validMoves.length > 0) {
        let chosen;
        if (frightenedTimer > 0) {
            // Frightened: Random pathing
            let idx = Math.floor(Math.random() * validMoves.length);
            chosen = validMoves[idx];
        } else {
            // Standard Chase AI: minimize Euclidean distance to Pac-man
            let minDistance = Infinity;
            validMoves.forEach(d => {
                let testX = ghost.x + d.x;
                let testY = ghost.y + d.y;
                let dist = Math.pow(testX - pacman.x, 2) + Math.pow(testY - pacman.y, 2);
                if (dist < minDistance) {
                    minDistance = dist;
                    chosen = d;
                }
            });
        }
        
        if (chosen) {
            ghost.dx = chosen.x;
            ghost.dy = chosen.y;
            ghost.x += chosen.x;
            ghost.y += chosen.y;
        }
    }
}

// Ticker logic
function update() {
    if (state !== 'PLAYING') return;

    // Frightened timer cooldown
    if (frightenedTimer > 0) {
        frightenedTimer--;
    }

    // Try applying next direction input
    let nextX = pacman.x + pacman.nextDx;
    let nextY = pacman.y + pacman.nextDy;
    if (!isWall(nextX, nextY)) {
        pacman.dx = pacman.nextDx;
        pacman.dy = pacman.nextDy;
    }

    // Execute Move
    let targetX = pacman.x + pacman.dx;
    let targetY = pacman.y + pacman.dy;
    
    if (!isWall(targetX, targetY)) {
        pacman.x = targetX;
        pacman.y = targetY;
        
        // Wrap-around portal check (sides of map)
        if (pacman.x < 0) pacman.x = GRID_SIZE - 1;
        if (pacman.x >= GRID_SIZE) pacman.x = 0;
    }

    // Eating check
    let currentCell = map[pacman.y][pacman.x];
    if (currentCell === 2) {
        // Eat Dot
        map[pacman.y][pacman.x] = 0;
        score += 10;
        eatenDots++;
        scoreVal.innerText = score;
    } else if (currentCell === 3) {
        // Eat Power Pellet
        map[pacman.y][pacman.x] = 0;
        score += 50;
        eatenDots++;
        scoreVal.innerText = score;
        frightenedTimer = 40; // 40 ticks (~5 seconds)
    }

    // Win condition check
    if (eatenDots >= totalDots) {
        state = 'WIN';
        saveHighScore();
        return;
    }

    // Move Ghosts
    ghosts.forEach(ghost => {
        moveGhost(ghost);

        // Collision check
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            if (frightenedTimer > 0) {
                // Eat Ghost
                score += 200;
                scoreVal.innerText = score;
                // Respawn ghost at center
                ghost.x = 9;
                ghost.y = 10;
                ghost.dx = 0;
                ghost.dy = -1;
            } else {
                // Game Over
                gameOver();
            }
        }
    });

    // Mouth animation speed updates
    pacman.mouthAngle += pacman.mouthDir;
    if (pacman.mouthAngle > 0.4 || pacman.mouthAngle < 0.05) {
        pacman.mouthDir = -pacman.mouthDir;
    }
}

function gameOver() {
    state = 'GAME_OVER';
    saveHighScore();
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreVal.innerText = highScore;
    }
}

// Drawing canvas elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Maze Walls and Dots
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let cell = map[r][c];
            let rx = c * CELL_SIZE;
            let ry = r * CELL_SIZE;

            if (cell === 1) {
                // Draw Wall (Retro Blue)
                ctx.fillStyle = '#1D4ED8';
                ctx.fillRect(rx, ry, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(rx, ry, CELL_SIZE, CELL_SIZE);
            } else if (cell === 2) {
                // Draw Dot (Orange-Peach)
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath();
                ctx.arc(rx + CELL_SIZE/2, ry + CELL_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell === 3) {
                // Draw Power Pellet (Flashing yellow circle)
                if (Math.floor(Date.now() / 250) % 2 === 0) {
                    ctx.fillStyle = '#FFE66D';
                    ctx.beginPath();
                    ctx.arc(rx + CELL_SIZE/2, ry + CELL_SIZE/2, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // 2. Draw Pac-Man (Yellow circle with animated mouth)
    let px = pacman.x * CELL_SIZE + CELL_SIZE/2;
    let py = pacman.y * CELL_SIZE + CELL_SIZE/2;
    let radius = CELL_SIZE/2 - 1;

    ctx.fillStyle = '#FFE66D';
    ctx.beginPath();
    
    // Rotate mouth orientation based on direction (dx, dy)
    let rotation = 0;
    if (pacman.dx === 1) rotation = 0;
    else if (pacman.dy === 1) rotation = 0.5;
    else if (pacman.dx === -1) rotation = 1;
    else if (pacman.dy === -1) rotation = 1.5;

    let startAngle = (rotation + pacman.mouthAngle) * Math.PI;
    let endAngle = (rotation + 2 - pacman.mouthAngle) * Math.PI;

    ctx.arc(px, py, radius, startAngle, endAngle);
    ctx.lineTo(px, py);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    let eyeOffset = pacman.dy !== 0 ? { x: 3, y: 0 } : { x: 0, y: -4 };
    ctx.arc(px + eyeOffset.x, py + eyeOffset.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Ghosts
    ghosts.forEach(ghost => {
        let gx = ghost.x * CELL_SIZE + 2;
        let gy = ghost.y * CELL_SIZE + 2;
        let gSize = CELL_SIZE - 4;

        ctx.fillStyle = frightenedTimer > 0 ? (frightenedTimer < 10 && Math.floor(Date.now() / 150) % 2 === 0 ? '#FFFFFF' : '#3B82F6') : ghost.color;
        
        // Draw head dome
        ctx.beginPath();
        ctx.arc(gx + gSize/2, gy + gSize/2, gSize/2, Math.PI, 0, false);
        ctx.lineTo(gx + gSize, gy + gSize);
        // Draw wavy skirt
        ctx.lineTo(gx + (gSize*3)/4, gy + gSize - 3);
        ctx.lineTo(gx + gSize/2, gy + gSize);
        ctx.lineTo(gx + gSize/4, gy + gSize - 3);
        ctx.lineTo(gx, gy + gSize);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx + 6, gy + 7, 3, 0, Math.PI * 2);
        ctx.arc(gx + gSize - 6, gy + 7, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = frightenedTimer > 0 ? '#FF6B35' : '#000000';
        ctx.beginPath();
        let lookX = frightenedTimer > 0 ? 0 : ghost.dx * 1.5;
        let lookY = frightenedTimer > 0 ? 0 : ghost.dy * 1.5;
        ctx.arc(gx + 6 + lookX, gy + 7 + lookY, 1.2, 0, Math.PI * 2);
        ctx.arc(gx + gSize - 6 + lookX, gy + 7 + lookY, 1.2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Overlays
    if (state === 'MENU') {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFE66D';
        ctx.font = "800 2.2rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('Pac-Man', canvas.width/2, canvas.height/2 - 15);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1rem 'Nunito', sans-serif";
        ctx.fillText('Press Arrow keys or Swipe to start!', canvas.width/2, canvas.height/2 + 20);
    } else if (state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF4A4A';
        ctx.font = "800 2.5rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1.1rem 'Nunito', sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 25);
        ctx.fillText('Press SPACE or TAP to retry!', canvas.width/2, canvas.height/2 + 55);
    } else if (state === 'WIN') {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4ECDC4';
        ctx.font = "800 2.8rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN! 🎉', canvas.width/2, canvas.height/2 - 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1.1rem 'Nunito', sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 25);
        ctx.fillText('Press SPACE or TAP to play again!', canvas.width/2, canvas.height/2 + 55);
    }
}

// Master frame loop
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
