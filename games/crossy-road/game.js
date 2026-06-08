/**
 * KidsGameZone: Crossy Chicken (Crossy Road Clone)
 * Smooth camera interpolation scrollers, river log riding math, vehicle hit tests, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_crossy-road';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Controls
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

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

    if (type === 'hop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'splash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'splat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// Grid Settings
const GRID_SIZE = 50;
const COLS = 9; // 450px width
const ROWS_IN_VIEW = 10; // 500px height

// State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Camera scroll tracking
let cameraY = 0; // smooth visual offset
let targetCameraY = 0; // step target offset

// Player positioning
let playerX = 4 * GRID_SIZE + GRID_SIZE / 2; // pixel coordinates
let playerY = 8 * GRID_SIZE + GRID_SIZE / 2;
let playerRowIdx = 8; // Row index relative to world array

// World Rows Array (Index 0 is far ahead, increases downward)
let worldRows = [];
const ROW_TYPES = ['grass', 'road', 'river'];

highScoreVal.textContent = highScore;

// Generate row specs
function createRow(index) {
    // Row index 0, 1, 2 are grass initially
    let type = 'grass';
    if (index < -2) {
        // Random row selection
        const rand = Math.random();
        type = rand < 0.35 ? 'grass' : rand < 0.7 ? 'road' : 'river';
    }

    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = 1.0 + Math.random() * 1.5;
    const obstacles = [];

    // Populate objects based on type
    if (type === 'road') {
        // Spawn 2 spaced cars
        obstacles.push({ x: Math.random() * 150, w: 55, h: 28, color: '#f56565' });
        obstacles.push({ x: 220 + Math.random() * 150, w: 55, h: 28, color: '#3182ce' });
    } else if (type === 'river') {
        // Spawn 2 spaced wooden logs
        obstacles.push({ x: Math.random() * 120, w: 100, h: 32, color: '#744210' });
        obstacles.push({ x: 230 + Math.random() * 120, w: 100, h: 32, color: '#744210' });
    }

    return {
        index: index,
        type: type,
        speed: speed,
        direction: direction,
        obstacles: obstacles
    };
}

function initWorld() {
    worldRows = [];
    cameraY = 0;
    targetCameraY = 0;
    score = 0;
    scoreVal.textContent = score;

    // Start player at index 8 (safe grass)
    playerRowIdx = 8;
    playerX = 4 * GRID_SIZE + GRID_SIZE / 2;
    playerY = 8 * GRID_SIZE + GRID_SIZE / 2;

    // Generate initial row set (15 rows: 10 in view, 3 buffer top, 2 buffer bottom)
    for (let i = -6; i <= 9; i++) {
        worldRows.push(createRow(i));
    }
}

// Move Player trigger grid steps
function movePlayer(dx, dy) {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }

    playSound('hop');

    if (dx !== 0) {
        // Left/Right
        playerX += dx * GRID_SIZE;
        // boundary check left/right
        playerX = Math.max(GRID_SIZE / 2, Math.min(canvas.width - GRID_SIZE / 2, playerX));
    }

    if (dy !== 0) {
        // Up/Down
        playerRowIdx += dy;
        playerY += dy * GRID_SIZE;

        // Shift world rows if player moves far up (scrolling camera trigger)
        // Keep camera centered around player
        if (dy < 0) {
            // Player moved up
            // Check if player goes beyond row threshold (e.g. index 3 from top of screen)
            const viewY = playerY - cameraY;
            if (viewY < 200) {
                targetCameraY -= GRID_SIZE;

                // Pre-generate a new row at top
                const firstRowIdx = worldRows[0].index;
                worldRows.unshift(createRow(firstRowIdx - 1));
                // Pop off bottom to prevent array grow infinite
                worldRows.pop();
            }

            // Score tracks max rows traversed
            const traversed = 8 - playerRowIdx;
            if (traversed > score) {
                score = traversed;
                scoreVal.textContent = score;
            }
        } else {
            // Player moved down (limited to not go off screen bottom)
            const viewY = playerY - cameraY;
            if (viewY > canvas.height - 50) {
                playerRowIdx -= dy;
                playerY -= dy * GRID_SIZE;
            }
        }
    }
}

// Calculations update
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Smooth camera Y slide
    cameraY += (targetCameraY - cameraY) * 0.16;

    // Find current active row player is standing on
    const activeRow = worldRows.find(r => r.index === playerRowIdx);

    // 2. Move row obstacles (cars/logs)
    worldRows.forEach(row => {
        row.obstacles.forEach(obs => {
            obs.x += row.speed * row.direction;

            // wrap around borders
            if (row.direction === 1 && obs.x > canvas.width) {
                obs.x = -obs.w;
            } else if (row.direction === -1 && obs.x < -obs.w) {
                obs.x = canvas.width;
            }
        });
    });

    if (activeRow) {
        if (activeRow.type === 'river') {
            // River log riding check
            let riding = false;
            activeRow.obstacles.forEach(log => {
                // Check if player center X is inside log bounds
                if (playerX >= log.x && playerX <= log.x + log.w) {
                    riding = true;
                    // Slide player along with log speed
                    playerX += activeRow.speed * activeRow.direction;
                }
            });

            // Fall in water or drift offscreen checks
            if (!riding || playerX < 0 || playerX > canvas.width) {
                triggerDeath(true); // Splash!
            }
        } else if (activeRow.type === 'road') {
            // Car hit check
            activeRow.obstacles.forEach(car => {
                // Check collision boxes overlap
                const pxMin = playerX - 12;
                const pxMax = playerX + 12;
                const pyMin = playerY - 12;
                const pyMax = playerY + 12;

                const rowY = getRowVisualY(activeRow.index);
                const cxMin = car.x;
                const cxMax = car.x + car.w;
                const cyMin = rowY + (GRID_SIZE - car.h)/2;
                const cyMax = cyMin + car.h;

                if (pxMax > cxMin && pxMin < cxMax && pyMax > cyMin && pyMin < cyMax) {
                    triggerDeath(false); // Splat!
                }
            });
        }
    }
}

function getRowVisualY(rowIdx) {
    // Index 8 is row index 8. Calculate visual Y based on grid index and camera offset
    // playerRowIdx = 8 corresponds to playerY = 8 * 50 + 25 = 425
    return rowIdx * GRID_SIZE;
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, -cameraY);

    // 1. Draw World Rows
    worldRows.forEach(row => {
        const y = getRowVisualY(row.index);

        // skip drawing if off-screen buffer bounds
        if (y - cameraY > canvas.height + 50 || y - cameraY < -50) return;

        if (row.type === 'grass') {
            ctx.fillStyle = '#2f855a'; // Green grass
            ctx.fillRect(0, y, canvas.width, GRID_SIZE);
            // Draw a few grass blades details
            ctx.fillStyle = '#276749';
            ctx.fillRect(40, y + 10, 4, 8);
            ctx.fillRect(200, y + 30, 4, 8);
            ctx.fillRect(360, y + 15, 4, 8);
        } else if (row.type === 'road') {
            ctx.fillStyle = '#4a5568'; // Dark asphalt gray
            ctx.fillRect(0, y, canvas.width, GRID_SIZE);
            // yellow center stripes
            ctx.fillStyle = '#ecc94b';
            for (let x = 10; x < canvas.width; x += 40) {
                ctx.fillRect(x, y + GRID_SIZE / 2 - 1.5, 15, 3);
            }
        } else if (row.type === 'river') {
            ctx.fillStyle = '#3182ce'; // Water Blue
            ctx.fillRect(0, y, canvas.width, GRID_SIZE);
        }

        // Draw Row borders line
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // 2. Draw row obstacles (cars/logs)
        row.obstacles.forEach(obs => {
            ctx.save();
            ctx.fillStyle = obs.color;
            const obsY = y + (GRID_SIZE - obs.h) / 2;
            ctx.fillRect(obs.x, obsY, obs.w, obs.h);

            // Details on obstacles
            if (row.type === 'road') {
                // Wheels on cars
                ctx.fillStyle = '#000000';
                ctx.fillRect(obs.x + 8, obsY - 2, 8, 3);
                ctx.fillRect(obs.x + obs.w - 16, obsY - 2, 8, 3);
                ctx.fillRect(obs.x + 8, obsY + obs.h - 1, 8, 3);
                ctx.fillRect(obs.x + obs.w - 16, obsY + obs.h - 1, 8, 3);

                // Windshield window
                ctx.fillStyle = '#ebf8ff';
                if (row.direction === 1) {
                    ctx.fillRect(obs.x + obs.w - 15, obsY + 3, 6, obs.h - 6);
                } else {
                    ctx.fillRect(obs.x + 9, obsY + 3, 6, obs.h - 6);
                }
            } else if (row.type === 'river') {
                // Wood ring logs lines
                ctx.strokeStyle = '#5c3e35';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x + 4, obsY + 2, obs.w - 8, obs.h - 4);
            }
            ctx.restore();
        });
    });

    // 3. Draw Player (Cute chicken)
    if (!gameOver) {
        ctx.save();
        ctx.translate(playerX, playerY);

        // Body shape (white circle)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Beak (orange triangle facing up)
        ctx.fillStyle = '#dd6b20';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-4, -16);
        ctx.lineTo(4, -16);
        ctx.closePath();
        ctx.fill();

        // Comb red crown on head
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(-2, -10, 4, 0, Math.PI * 2);
        ctx.arc(2, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-4, -4, 1.8, 0, Math.PI * 2);
        ctx.arc(4, -4, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Key actions bindings
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        movePlayer(0, -1);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        movePlayer(0, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePlayer(-1, 0);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePlayer(1, 0);
    }
});

// Mobile virtual D-Pad buttons click binders
btnUp.addEventListener('click', () => movePlayer(0, -1));
btnDown.addEventListener('click', () => movePlayer(0, 1));
btnLeft.addEventListener('click', () => movePlayer(-1, 0));
btnRight.addEventListener('click', () => movePlayer(1, 0));

// State Flow
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    scoreVal.textContent = score;

    initWorld();

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameOver = false;
    gameStarted = true;
}

function triggerDeath(waterSplash) {
    gameOver = true;
    if (waterSplash) {
        playSound('splash');
        winnerText.textContent = 'SPLAT! Drowned!';
        winnerText.style.color = '#3182ce';
    } else {
        playSound('splat');
        winnerText.textContent = 'SPLAT! Hit by car!';
        winnerText.style.color = '#ff6b6b';
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

function resetGame() {
    startGame();
}

startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start
gameLoop();
