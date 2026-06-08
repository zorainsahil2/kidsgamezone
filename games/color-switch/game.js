/**
 * KidsGameZone: Color Switch
 * Vertical single-screen bouncing loops, rotating 4-color arc segments, angle normalization checks, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_color-switch';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

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

    if (type === 'bounce') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
    } else if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(990, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// Color Codes (4 sections matching circles)
const COLORS = [
    '#ff6b6b', // Red (0)
    '#4ECDC4', // Blue (1)
    '#FFE66D', // Yellow (2)
    '#a855f7'  // Purple/Green (3)
];

// Configuration
const RING_Y = 240;
const RING_OUTER = 76;
const RING_INNER = 60;
const BALL_X = 200;

// State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Physics objects
let ball = { y: 450, vy: 0, r: 8, colorIdx: 0 };
let ringAngle = 0;
let ringSpeed = 0.016; // base rotation speed

let switcher = { y: RING_Y, r: 12, active: true };
let splashParticles = [];

highScoreVal.textContent = highScore;

function randomizeBallColor() {
    ball.colorIdx = Math.floor(Math.random() * 4);
}

function spawnSplash(color) {
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.5;
        splashParticles.push({
            x: BALL_X,
            y: ball.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.04,
            radius: 2 + Math.random() * 2,
            color
        });
    }
}

// Collision Matching logic
function checkColorCollision() {
    const distY = Math.abs(ball.y - RING_Y);

    // If ball lies inside the outer and inner bounds of the ring vertically
    if (distY >= RING_INNER && distY <= RING_OUTER) {
        // Calculate collision angle
        // Ball is at BALL_X = 200, ring is at 200. dx is roughly 0.
        // angle is either roughly Math.PI/2 (bottom hit) or -Math.PI/2 (top hit)
        const angle = Math.atan2(ball.y - RING_Y, 0); // direction from ring center

        // Normalize angle to [0, 2*PI]
        let normAngle = angle;
        if (normAngle < 0) normAngle += Math.PI * 2;

        // Subtract current ring rotation angle
        let relativeAngle = (normAngle - ringAngle) % (Math.PI * 2);
        if (relativeAngle < 0) relativeAngle += Math.PI * 2;

        // Divide into 4 quadrants corresponding to the 4 colors:
        // Quadrant 0: [0, PI/2]
        // Quadrant 1: [PI/2, PI]
        // Quadrant 2: [PI, 3*PI/2]
        // Quadrant 3: [3*PI/2, 2*PI]
        const quadIdx = Math.floor(relativeAngle / (Math.PI / 2));

        if (quadIdx !== ball.colorIdx) {
            triggerDeath();
        }
    }
}

// Calculations Loop
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Move Ball
    ball.vy += 0.16; // gravity
    ball.y += ball.vy;

    // Ceiling check
    if (ball.y < ball.r + 10) {
        ball.y = ball.r + 10;
        ball.vy = 0.5; // bounce down
    }

    // Floor death
    if (ball.y > canvas.height + 20) {
        triggerDeath();
    }

    // 2. Rotate Obstacle Ring
    ringAngle = (ringAngle + ringSpeed) % (Math.PI * 2);

    // 3. Collision: Ball vs Ring Arcs
    checkColorCollision();

    // 4. Collision: Ball vs Switcher orb (center of ring)
    if (switcher.active) {
        const dist = Math.abs(ball.y - switcher.y);
        if (dist < ball.r + switcher.r) {
            // Collect switcher!
            playSound('collect');
            score++;
            scoreVal.textContent = score;
            spawnSplash('#ffffff');

            randomizeBallColor();
            switcher.active = false;

            // Speed up
            ringSpeed = 0.016 + Math.floor(score / 5) * 0.005;
        }
    } else {
        // Reactivate switcher once player leaves the circle center range (to bounce through again)
        const dist = Math.abs(ball.y - switcher.y);
        if (dist > 100) {
            switcher.active = true;
        }
    }

    // 5. Particles splash updates
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        const p = splashParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            splashParticles.splice(i, 1);
        }
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Obstacle Ring (4 arcs)
    ctx.save();
    ctx.lineWidth = 14;
    ctx.lineCap = 'butt';

    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = COLORS[i];
        ctx.beginPath();
        const start = ringAngle + i * (Math.PI / 2);
        const end = start + (Math.PI / 2);
        ctx.arc(200, RING_Y, (RING_OUTER + RING_INNER) / 2, start, end);
        ctx.stroke();
    }
    ctx.restore();

    // Draw Switcher Orb (center)
    if (switcher.active) {
        ctx.save();
        // Drawing a small 4-color wheel
        const subRadius = switcher.r;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = COLORS[i];
            ctx.beginPath();
            ctx.moveTo(200, switcher.y);
            ctx.arc(200, switcher.y, subRadius, i * (Math.PI/2), (i + 1) * (Math.PI/2));
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw Ball
    ctx.save();
    ctx.fillStyle = COLORS[ball.colorIdx];
    ctx.beginPath();
    ctx.arc(BALL_X, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Glare shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(BALL_X - 2, ball.y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Splash particles
    splashParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
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

// User action tap bounce
function bounce() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }

    playSound('bounce');
    ball.vy = -3.8;
}

canvas.addEventListener('mousedown', bounce);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    bounce();
}, { passive: false });

// State flow
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    scoreVal.textContent = score;
    ringSpeed = 0.016;
    ringAngle = 0;

    ball.y = 450;
    ball.vy = -3.8;
    randomizeBallColor();

    switcher.active = true;
    splashParticles = [];

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameOver = false;
    gameStarted = true;
}

function triggerDeath() {
    gameOver = true;
    playSound('crash');

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

// Play
gameLoop();
