/**
 * KidsGameZone: Bubble Shooter
 * Full hexagons coordinates snapping grid, flood-fill recursions, floating islands check, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_bubble-shooter';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const shotsLeftVal = document.getElementById('shotsLeftVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreVal = document.getElementById('finalScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');

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

    if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'descent') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(110, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

// Config
const BUBBLE_RADIUS = 16;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROW_SPACING = 27.7; // Hex grid vertical spacing: sqrt(3)/2 * diameter
const GRID_ROWS = 14;
const GRID_COLS = 12;

const BUBBLE_COLORS = [
    '#e53e3e', // Red
    '#3182ce', // Blue
    '#ecc94b', // Yellow
    '#38a169', // Green
    '#805ad5', // Purple
    '#dd6b20'  // Orange
];

// State
let score = 0;
let shotsLeft = 10;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;
let grid = []; // 2D array: grid[row][col] = colorIndex or null

let bullet = null; // {x, y, vx, vy, colorIndex}
let currentShooterColor = 0;
let nextShooterColor = 0;
let aimAngle = -Math.PI / 2;
let particles = [];

highScoreVal.textContent = highScore;

// Math helpers
function getBubbleCoords(row, col) {
    const isOdd = (row % 2 !== 0);
    const x = col * BUBBLE_DIAMETER + BUBBLE_RADIUS + (isOdd ? BUBBLE_RADIUS : 0);
    const y = row * ROW_SPACING + BUBBLE_RADIUS;
    return { x, y };
}

// Setup Grid
function initGrid() {
    grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < GRID_COLS; c++) {
            // odd rows only have 11 columns effectively to prevent overflow
            if (r % 2 !== 0 && c === GRID_COLS - 1) {
                grid[r][c] = null;
                continue;
            }

            if (r < 5) {
                // Spawn random colors in top 5 rows
                grid[r][c] = Math.floor(Math.random() * BUBBLE_COLORS.length);
            } else {
                grid[r][c] = null;
            }
        }
    }
}

function getAvailableColors() {
    const activeColors = new Set();
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (grid[r][c] !== null) {
                activeColors.add(grid[r][c]);
            }
        }
    }
    // Fallback if empty
    if (activeColors.size === 0) {
        return [0];
    }
    return Array.from(activeColors);
}

function randomizeShooterColors() {
    const avail = getAvailableColors();
    currentShooterColor = avail[Math.floor(Math.random() * avail.length)];
    nextShooterColor = avail[Math.floor(Math.random() * avail.length)];
}

function cycleShooterColor() {
    currentShooterColor = nextShooterColor;
    const avail = getAvailableColors();
    nextShooterColor = avail[Math.floor(Math.random() * avail.length)];
}

// Spawn pop particles
function spawnPopParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 2,
            color: color,
            alpha: 1,
            decay: 0.03 + Math.random() * 0.03
        });
    }
}

// Check adjacent hex neighbors
function getNeighbors(row, col) {
    const neighbors = [];
    const isOdd = (row % 2 !== 0);

    // Direction offsets depending on odd/even row
    const offsets = isOdd ? [
        {r: -1, c: 0}, {r: -1, c: 1},
        {r: 0, c: -1}, {r: 0, c: 1},
        {r: 1, c: 0}, {r: 1, c: 1}
    ] : [
        {r: -1, c: -1}, {r: -1, c: 0},
        {r: 0, c: -1}, {r: 0, c: 1},
        {r: 1, c: -1}, {r: 1, c: 0}
    ];

    offsets.forEach(off => {
        const nr = row + off.r;
        const nc = col + off.c;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
            neighbors.push({ r: nr, c: nc });
        }
    });

    return neighbors;
}

// Match-3 Flood Fill
function findMatches(row, col, colorIndex) {
    const matches = [];
    const visited = new Set();
    const queue = [{ r: row, c: col }];
    visited.add(`${row},${col}`);

    while (queue.length > 0) {
        const current = queue.shift();
        matches.push(current);

        const neighbors = getNeighbors(current.r, current.c);
        neighbors.forEach(n => {
            const key = `${n.r},${n.c}`;
            if (!visited.has(key) && grid[n.r][n.c] === colorIndex) {
                visited.add(key);
                queue.push(n);
            }
        });
    }

    return matches;
}

// Float Island Drop Detection
function dropFloatingBubbles() {
    // 1. Traverse from the top row and mark all reachable bubbles
    const connected = new Set();
    const queue = [];

    // Initialize with all bubbles in top row
    for (let c = 0; c < GRID_COLS; c++) {
        if (grid[0][c] !== null) {
            queue.push({ r: 0, c: c });
            connected.add(`0,${c}`);
        }
    }

    while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = getNeighbors(current.r, current.c);
        neighbors.forEach(n => {
            const key = `${n.r},${n.c}`;
            if (!connected.has(key) && grid[n.r][n.c] !== null) {
                connected.add(key);
                queue.push(n);
            }
        });
    }

    // 2. Drop any bubble that was not marked connected
    let droppedCount = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (grid[r][c] !== null && !connected.has(`${r},${c}`)) {
                const coords = getBubbleCoords(r, c);
                spawnPopParticles(coords.x, coords.y, BUBBLE_COLORS[grid[r][c]], 4);
                grid[r][c] = null;
                droppedCount++;
            }
        }
    }

    if (droppedCount > 0) {
        score += droppedCount * 15;
        scoreVal.textContent = score;
        playSound('drop');
    }
}

// Descent rows shift
function descendGrid() {
    // Shift rows down
    for (let r = GRID_ROWS - 1; r > 0; r--) {
        grid[r] = [...grid[r - 1]];
    }

    // Insert new top row
    grid[0] = [];
    for (let c = 0; c < GRID_COLS; c++) {
        grid[0][c] = Math.floor(Math.random() * BUBBLE_COLORS.length);
    }

    // Correct odd column count limit on odd row
    // If row 1 shifted to row 2, and row 0 is odd etc, correct odd row bounds
    // Keep borders tidy:
    for (let r = 0; r < GRID_ROWS; r++) {
        if (r % 2 !== 0) {
            grid[r][GRID_COLS - 1] = null; // force clear last column for odd rows
        }
    }

    shotsLeft = 10;
    shotsLeftVal.textContent = shotsLeft;
    playSound('descent');

    // Check if bubbles hit bottom row limit
    checkLoseCondition();
}

function checkLoseCondition() {
    // Game over if any bubble exists in rows 13 or 14 (y > 400px roughly)
    for (let c = 0; c < GRID_COLS; c++) {
        // row 12 is near bottom of canvas
        if (grid[12][c] !== null) {
            endGame();
            break;
        }
    }
}

// Handle Bullet Snap to Grid
function snapBullet(bx, by, colorIndex) {
    let closestRow = 0;
    let closestCol = 0;
    let minDist = Infinity;

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            // skip illegal odd row column
            if (r % 2 !== 0 && c === GRID_COLS - 1) continue;

            const coords = getBubbleCoords(r, c);
            const dist = Math.sqrt((bx - coords.x) ** 2 + (by - coords.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closestRow = r;
                closestCol = c;
            }
        }
    }

    // Assign snapped cell
    grid[closestRow][closestCol] = colorIndex;

    // Check Matches
    const matches = findMatches(closestRow, closestCol, colorIndex);
    if (matches.length >= 3) {
        playSound('pop');
        matches.forEach(m => {
            const coords = getBubbleCoords(m.r, m.c);
            spawnPopParticles(coords.x, coords.y, BUBBLE_COLORS[colorIndex], 8);
            grid[m.r][m.c] = null;
        });

        score += matches.length * 10;
        scoreVal.textContent = score;

        // Clean floating bubble islands
        dropFloatingBubbles();
    } else {
        // Just snap and check if player hits limit
        checkLoseCondition();
    }

    bullet = null;

    // Descent countdown
    shotsLeft--;
    shotsLeftVal.textContent = shotsLeft;
    if (shotsLeft <= 0) {
        descendGrid();
    }

    cycleShooterColor();
}

// Frame loops updates
function update() {
    if (!gameStarted || gameOver) return;

    // Projectile physics
    if (bullet) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Wall bounces
        if (bullet.x < BUBBLE_RADIUS) {
            bullet.x = BUBBLE_RADIUS;
            bullet.vx = -bullet.vx;
        } else if (bullet.x > canvas.width - BUBBLE_RADIUS) {
            bullet.x = canvas.width - BUBBLE_RADIUS;
            bullet.vx = -bullet.vx;
        }

        // Top ceiling collision
        if (bullet.y <= BUBBLE_RADIUS) {
            snapBullet(bullet.x, bullet.y, bullet.colorIndex);
        } else {
            // Collision with grid bubbles
            let collided = false;
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (grid[r][c] !== null) {
                        const coords = getBubbleCoords(r, c);
                        const dist = Math.sqrt((bullet.x - coords.x) ** 2 + (bullet.y - coords.y) ** 2);
                        // radius + radius = diameter. Clamping slightly smaller (28px) makes hits slide in hex gaps better.
                        if (dist < BUBBLE_DIAMETER - 5) {
                            collided = true;
                            break;
                        }
                    }
                }
                if (collided) break;
            }

            if (collided) {
                // Backtrack bullet one frame and snap it
                snapBullet(bullet.x - bullet.vx, bullet.y - bullet.vy, bullet.colorIndex);
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw active Grid Bubbles
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (grid[r][c] !== null) {
                const { x, y } = getBubbleCoords(r, c);

                // Bubble ball drawing
                ctx.save();
                const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_RADIUS);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, BUBBLE_COLORS[grid[r][c]]);
                grad.addColorStop(1, '#000000');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // Draw Particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw Shooter Guide line (Dotted)
    if (!bullet && gameStarted && !gameOver) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(200, 460);
        // Draw aim vector line
        ctx.lineTo(200 + Math.cos(aimAngle) * 120, 460 + Math.sin(aimAngle) * 120);
        ctx.stroke();
        ctx.restore();
    }

    // Draw Shooter Stand
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(200, 480, 30, Math.PI, 0);
    ctx.fill();

    // Draw Shooter Turret (Arrow indicator)
    ctx.save();
    ctx.translate(200, 470);
    ctx.rotate(aimAngle + Math.PI / 2);
    ctx.fillStyle = '#cbd5e0';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.lineTo(6, -30);
    ctx.lineTo(12, -30);
    ctx.lineTo(0, -45);
    ctx.lineTo(-12, -30);
    ctx.lineTo(-6, -30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw Ammo Bullet loaded
    if (!bullet && gameStarted && !gameOver) {
        ctx.save();
        const x = 200;
        const y = 470;
        const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_RADIUS);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, BUBBLE_COLORS[currentShooterColor]);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw Next loaded bubble (Preview)
        const nextX = 260;
        const nextY = 475;
        const nextGrad = ctx.createRadialGradient(nextX - 3, nextY - 3, 1, nextX, nextY, BUBBLE_RADIUS * 0.7);
        nextGrad.addColorStop(0, '#ffffff');
        nextGrad.addColorStop(0.3, BUBBLE_COLORS[nextShooterColor]);
        nextGrad.addColorStop(1, '#000000');
        ctx.fillStyle = nextGrad;
        ctx.beginPath();
        ctx.arc(nextX, nextY, BUBBLE_RADIUS * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw Flying Bullet
    if (bullet) {
        ctx.save();
        const grad = ctx.createRadialGradient(bullet.x - 5, bullet.y - 5, 2, bullet.x, bullet.y, BUBBLE_RADIUS);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, BUBBLE_COLORS[bullet.colorIndex]);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw Red Shooter Row Alert Line
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(canvas.width, 420);
    ctx.stroke();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Input listeners (Mouse / Touch angle tracking)
function updateAim(x, y) {
    // Calculate angle from shooter stand (200, 470)
    const dx = x - 200;
    const dy = y - 470;
    let angle = Math.atan2(dy, dx);

    // Limit turret from rotating backwards (allow only pointing up)
    if (angle > -0.15 && angle < Math.PI / 2) {
        angle = -0.15;
    } else if (angle >= Math.PI / 2 && angle < -Math.PI + 0.15) {
        angle = -Math.PI + 0.15;
    }
    aimAngle = angle;
}

function fireBubble() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }
    if (bullet) return; // wait for shot to settle

    playSound('shoot');
    const speed = 9;
    bullet = {
        x: 200,
        y: 470,
        vx: Math.cos(aimAngle) * speed,
        vy: Math.sin(aimAngle) * speed,
        colorIndex: currentShooterColor
    };
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    updateAim(x, y);
});

canvas.addEventListener('mousedown', fireBubble);

// Mobile touch controls aim + shoot
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    updateAim(x, y);
}, { passive: false });

canvas.addEventListener('touchend', fireBubble);

// State Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    shotsLeft = 10;
    scoreVal.textContent = score;
    shotsLeftVal.textContent = shotsLeft;

    initGrid();
    randomizeShooterColors();
    bullet = null;
    particles = [];

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameOver = false;
    gameStarted = true;
}

function endGame() {
    gameOver = true;
    playSound('gameover');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    finalScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

function resetGame() {
    startGame();
}

startBtn.addEventListener('click', startGame);
overlayRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start
gameLoop();
