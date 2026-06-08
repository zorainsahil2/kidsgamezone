/**
 * KidsGameZone: Cube Runner (Geometry Dash Clone)
 * Auto-running loops, rotating square draw matrix, spike triangle AABB overlap checks, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_geometry-dash';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelVal = document.getElementById('levelVal');
const progressVal = document.getElementById('progressVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');
const lvlNameEl = document.getElementById('lvlName');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const levelWinOverlay = document.getElementById('levelWinOverlay');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const gameWinOverlay = document.getElementById('gameWinOverlay');
const winScoreVal = document.getElementById('winScoreVal');
const winHighScoreVal = document.getElementById('winHighScoreVal');
const winPlayAgainBtn = document.getElementById('winPlayAgainBtn');
const crashOverlay = document.getElementById('crashOverlay');
const crashOkBtn = document.getElementById('crashOkBtn');

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

    if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'victory') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    }
}

// Config
const GROUND_Y = 220;
const CUBE_SIZE = 30;
const GRAVITY = 0.28;

// Levels details
const LEVEL_SPECS = {
    1: {
        name: 'Level 1 - Neon Beginnings',
        length: 2600,
        bgColor: '#000c1e', // Dark Blue
        gridColor: '#1e3a8a',
        spikes: [500, 800, 1100, 1125, 1450, 1750, 2050, 2075, 2350],
        blocks: [
            { x: 1300, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 1700, y: GROUND_Y - 30, w: 60, h: 30 }
        ]
    },
    2: {
        name: 'Level 2 - Cyber Ascent',
        length: 3000,
        bgColor: '#12001e', // Dark Purple
        gridColor: '#581c87',
        spikes: [600, 900, 925, 1200, 1500, 1800, 1825, 2100, 2125, 2400, 2700],
        blocks: [
            { x: 1050, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 1350, y: GROUND_Y - 60, w: 60, h: 60 },
            { x: 1650, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 2200, y: GROUND_Y - 30, w: 120, h: 30 }
        ]
    },
    3: {
        name: 'Level 3 - Crimson Blitz',
        length: 3400,
        bgColor: '#1e0004', // Dark Red
        gridColor: '#991b1b',
        spikes: [500, 750, 775, 1000, 1250, 1275, 1300, 1500, 1800, 2100, 2125, 2400, 2700, 2725, 2750, 3100],
        blocks: [
            { x: 900, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 1150, y: GROUND_Y - 60, w: 60, h: 60 },
            { x: 1400, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 1950, y: GROUND_Y - 30, w: 90, h: 30 },
            { x: 2040, y: GROUND_Y - 60, w: 90, h: 60 },
            { x: 2500, y: GROUND_Y - 30, w: 120, h: 30 },
            { x: 2900, y: GROUND_Y - 30, w: 60, h: 30 }
        ]
    }
};

// State Variables
let currentLevel = 1;
let playerX = 0;
let playerY = GROUND_Y - CUBE_SIZE;
let playerVy = 0;
let onGround = true;
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Physics properties
let runSpeed = 4.2;
let rotationAngle = 0;
let isSpaceHeld = false;

// Active level objects
let activeSpikes = [];
let activeBlocks = [];
let crashParticles = [];

highScoreVal.textContent = highScore;

function initLevel(lvlNum) {
    currentLevel = lvlNum;
    levelVal.textContent = currentLevel;

    const spec = LEVEL_SPECS[lvlNum];
    lvlNameEl.textContent = spec.name;

    playerX = 0;
    playerY = GROUND_Y - CUBE_SIZE;
    playerVy = 0;
    onGround = true;
    rotationAngle = 0;

    activeSpikes = spec.spikes.map(x => ({ x, y: GROUND_Y, w: 20, h: 22 }));
    activeBlocks = spec.blocks.map(b => ({ ...b }));
    crashParticles = [];

    // Calculate score accumulated
    progressVal.textContent = '0';
}

function spawnCrashParticles() {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        crashParticles.push({
            x: 100 + CUBE_SIZE/2,
            y: playerY + CUBE_SIZE/2,
            vx: Math.cos(angle) * speed - runSpeed * 0.4, // float back slightly
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.04,
            radius: 2 + Math.random() * 3
        });
    }
}

// Calculations update
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Auto-run scroll
    playerX += runSpeed;

    // 2. Gravity & Jump
    playerVy += GRAVITY;
    if (playerVy > 9) playerVy = 9;
    playerY += playerVy;

    onGround = false;

    // Floor boundary check
    if (playerY >= GROUND_Y - CUBE_SIZE) {
        playerY = GROUND_Y - CUBE_SIZE;
        playerVy = 0;
        onGround = true;
    }

    // Block collisions
    activeBlocks.forEach(b => {
        // Translate world X to screen relative position (player is fixed at screen X = 100)
        const screenX = b.x - playerX + 100;

        // Player is at X = 100, Y = playerY, size = 30
        if (screenX < 100 + CUBE_SIZE && screenX + b.w > 100) {
            // Check top landing
            if (playerVy > 0 &&
                playerY + CUBE_SIZE >= b.y &&
                playerY + CUBE_SIZE - playerVy <= b.y + 6) {

                playerY = b.y - CUBE_SIZE;
                playerVy = 0;
                onGround = true;
            }
            // Check frontal crash
            else if (playerY + CUBE_SIZE > b.y + 2 && playerY < b.y + b.h) {
                // If overlap in X occurs, player crashes!
                if (100 + CUBE_SIZE > screenX && 100 < screenX + b.w) {
                    triggerCrash();
                }
            }
        }
    });

    // Auto-jump if held
    if (isSpaceHeld && onGround) {
        playerVy = -5.6;
        onGround = false;
        playSound('jump');
    }

    // Cube rotation spin when flying
    if (!onGround) {
        rotationAngle += 0.09;
    } else {
        // Snap to nearest 90 deg rotation angle on landing
        const deg90 = Math.PI / 2;
        rotationAngle = Math.round(rotationAngle / deg90) * deg90;
    }

    // 3. Spike Collisions check
    activeSpikes.forEach(sp => {
        const screenX = sp.x - playerX + 100;
        // Bounding box collision checks
        if (screenX < 100 + CUBE_SIZE - 4 && screenX + sp.w > 100 + 4 &&
            playerY + CUBE_SIZE > sp.y - sp.h) {
            triggerCrash();
        }
    });

    // Update Progress percentage
    const spec = LEVEL_SPECS[currentLevel];
    const pct = Math.min(100, Math.floor((playerX / spec.length) * 100));
    progressVal.textContent = pct;

    // Check level clear
    if (playerX >= spec.length) {
        clearLevel();
    }

    // Update crash particles
    for (let i = crashParticles.length - 1; i >= 0; i--) {
        const p = crashParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            crashParticles.splice(i, 1);
        }
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const spec = LEVEL_SPECS[currentLevel];
    ctx.fillStyle = spec.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines (Scrolling background effect)
    ctx.strokeStyle = spec.gridColor;
    ctx.lineWidth = 1;
    const gridOffset = -playerX % 40;
    for (let x = gridOffset; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GROUND_Y);
        ctx.stroke();
    }
    for (let y = 0; y < GROUND_Y; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw ground
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.strokeStyle = '#48bb78'; // Green neon ground line
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    // Draw Blocks
    ctx.fillStyle = '#4a5568';
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    activeBlocks.forEach(b => {
        const screenX = b.x - playerX + 100;
        if (screenX + b.w > 0 && screenX < canvas.width) {
            ctx.fillRect(screenX, b.y, b.w, b.h);
            ctx.strokeRect(screenX, b.y, b.w, b.h);
        }
    });

    // Draw Spikes
    ctx.fillStyle = '#ff6b6b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    activeSpikes.forEach(sp => {
        const screenX = sp.x - playerX + 100;
        if (screenX + sp.w > 0 && screenX < canvas.width) {
            ctx.beginPath();
            ctx.moveTo(screenX, sp.y);
            ctx.lineTo(screenX + sp.w / 2, sp.y - sp.h);
            ctx.lineTo(screenX + sp.w, sp.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    });

    // Draw Player (Neon square cube)
    if (!gameOver || crashParticles.length > 0) {
        ctx.save();
        ctx.translate(100 + CUBE_SIZE / 2, playerY + CUBE_SIZE / 2);
        ctx.rotate(rotationAngle);

        ctx.fillStyle = '#FFE66D'; // Yellow neon body
        ctx.fillRect(-CUBE_SIZE / 2, -CUBE_SIZE / 2, CUBE_SIZE, CUBE_SIZE);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-CUBE_SIZE / 2, -CUBE_SIZE / 2, CUBE_SIZE, CUBE_SIZE);

        // Face eyes slots (icon style)
        ctx.fillStyle = '#000000';
        ctx.fillRect(-8, -8, 5, 5);
        ctx.fillRect(3, -8, 5, 5);
        ctx.fillRect(-8, 2, 16, 4);

        ctx.restore();
    }

    // Draw Crash particles
    crashParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controls listeners
function jump() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        return;
    }
    if (onGround) {
        playerVy = -5.6;
        onGround = false;
        playSound('jump');
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        isSpaceHeld = true;
        jump();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        isSpaceHeld = false;
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isSpaceHeld = true;
    jump();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    isSpaceHeld = false;
});

// State Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    startOverlay.classList.remove('active');
    levelWinOverlay.classList.remove('active');
    gameWinOverlay.classList.remove('active');
    crashOverlay.classList.remove('active');

    initLevel(1);
    gameOver = false;
    gameStarted = true;
}

function triggerCrash() {
    gameOver = true;
    playSound('crash');
    spawnCrashParticles();

    // Accumulate score based on progress
    const spec = LEVEL_SPECS[currentLevel];
    const progressPct = Math.min(100, Math.floor((playerX / spec.length) * 100));
    const scoreEarned = (currentLevel - 1) * 500 + progressPct * 5;
    score = Math.max(score, scoreEarned);

    setTimeout(() => {
        crashOverlay.classList.add('active');
    }, 800);
}

function retryLevel() {
    crashOverlay.classList.remove('active');
    initLevel(currentLevel);
    gameOver = false;
}

function clearLevel() {
    gameOver = true;
    playSound('victory');

    score = currentLevel * 500; // completion points

    setTimeout(() => {
        if (currentLevel < 3) {
            levelWinOverlay.classList.add('active');
        } else {
            showFinalVictory();
        }
    }, 800);
}

function loadNextLevel() {
    levelWinOverlay.classList.remove('active');
    initLevel(currentLevel + 1);
    gameOver = false;
}

function showFinalVictory() {
    gameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }
    winScoreVal.textContent = score;
    winHighScoreVal.textContent = highScore;
    gameWinOverlay.classList.add('active');
}

startBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', loadNextLevel);
crashOkBtn.addEventListener('click', retryLevel);
winPlayAgainBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start looping
gameLoop();
