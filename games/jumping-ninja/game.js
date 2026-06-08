/**
 * KidsGameZone: Jumping Ninja
 * Variable-height jump loops, left platform scrolling, custom stick-figure leg runs, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_jumping-ninja';

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

    if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(380, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'star') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.45);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    }
}

// Config
const GRAVITY = 0.28;
const MAX_FALL = 9;

// State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Physics objects
let ninja = {
    x: 80,
    y: 100,
    w: 16,
    h: 26,
    vy: 0,
    onGround: false,
    isJumping: false,
    jumpTimer: 0,
    runFrame: 0
};

let platforms = []; // list of {x, y, w, h, speed, hasStar, starX, starY, starCollected, landed}
let baseSpeed = 2.2;
let spawnGap = 120; // frame distance
let animTicks = 0;

highScoreVal.textContent = highScore;

// Platforms generator
function spawnPlatform(startX = null) {
    const minW = 80;
    const maxW = 160;
    const w = minW + Math.random() * (maxW - minW);

    // Height offset from last platform
    let y = 200 + Math.random() * 60; // 200 to 260
    if (platforms.length > 0) {
        const last = platforms[platforms.length - 1];
        const offset = (Math.random() - 0.5) * 80; // +/- 40px
        y = Math.max(140, Math.min(270, last.y + offset));
    }

    const x = startX !== null ? startX : canvas.width + 20;

    const hasStar = Math.random() < 0.45; // 45% star spawn chance

    platforms.push({
        x: x,
        y: y,
        w: w,
        h: 14,
        landed: false,
        hasStar: hasStar,
        starX: x + w / 2,
        starY: y - 30,
        starCollected: false
    });
}

function initLevel() {
    platforms = [];
    baseSpeed = 2.4;
    // Initial start platform
    platforms.push({
        x: 40,
        y: 200,
        w: 180,
        h: 14,
        landed: true,
        hasStar: false,
        starX: 0,
        starY: 0,
        starCollected: true
    });

    // Populate initial scrolling rows
    spawnPlatform(280);
    spawnPlatform(460);

    ninja.x = 90;
    ninja.y = 150;
    ninja.vy = 0;
    ninja.onGround = false;
    ninja.isJumping = false;
    ninja.jumpTimer = 0;
}

// Controller inputs
let isSpaceHeld = false;

// Calculations updates
function update() {
    if (!gameStarted || gameOver) return;

    animTicks++;

    // 1. Move Ninja (gravity + ground limits)
    ninja.vy += GRAVITY;
    if (ninja.vy > MAX_FALL) ninja.vy = MAX_FALL;

    // Handle variable jump force hold
    if (isSpaceHeld && ninja.isJumping) {
        ninja.jumpTimer++;
        if (ninja.jumpTimer < 14) { // allow adding float force for 14 frames
            ninja.vy -= 0.28;
        }
    }

    ninja.y += ninja.vy;
    const oldOnGround = ninja.onGround;
    ninja.onGround = false;

    // platform collision
    platforms.forEach(p => {
        // AABB check top surface only
        if (ninja.x + ninja.w > p.x && ninja.x < p.x + p.w) {
            // Check if falling down on it
            if (ninja.vy > 0 &&
                ninja.y + ninja.h >= p.y &&
                ninja.y + ninja.h - ninja.vy <= p.y + 6) {

                ninja.y = p.y - ninja.h;
                ninja.vy = 0;
                ninja.onGround = true;
                ninja.isJumping = false;
                ninja.jumpTimer = 0;

                // Award point for landing
                if (!p.landed) {
                    p.landed = true;
                    score++;
                    scoreVal.textContent = score;
                }
            }
        }

        // Star collision
        if (p.hasStar && !p.starCollected) {
            const starCenterDist = Math.sqrt((ninja.x + ninja.w/2 - p.starX) ** 2 + (ninja.y + ninja.h/2 - p.starY) ** 2);
            if (starCenterDist < ninja.h/2 + 8) {
                p.starCollected = true;
                score += 10;
                scoreVal.textContent = score;
                playSound('star');
            }
        }
    });

    // 2. Move Platforms left
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        p.x -= baseSpeed;
        if (p.hasStar) {
            p.starX -= baseSpeed;
        }

        // Offscreen delete
        if (p.x + p.w < -10) {
            platforms.splice(i, 1);
        }
    }

    // Spawn new platforms automatically
    if (platforms.length > 0) {
        const last = platforms[platforms.length - 1];
        if (last.x + last.w < canvas.width - 20) {
            // spawn random gap
            const gap = 80 + Math.random() * 80;
            if (last.x + last.w < canvas.width - gap) {
                spawnPlatform();
            }
        }
    }

    // Speed progression
    baseSpeed = 2.4 + (score / 120) * 0.4;

    // Check Fall Death
    if (ninja.y > canvas.height) {
        endGame();
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Night Background details (Stars & Moon)
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(420, 60, 24, 0, Math.PI * 2);
    ctx.fill();
    // crescent cutout shadow
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(430, 56, 24, 0, Math.PI * 2);
    ctx.fill();

    // Draw star sparkles
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(80, 50, 2, 2);
    ctx.fillRect(150, 110, 3, 3);
    ctx.fillRect(220, 40, 2, 2);
    ctx.fillRect(310, 90, 3, 3);

    // Draw platforms (blocks with wood-edge gradient styling)
    platforms.forEach(p => {
        ctx.save();
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Top grass/snow snow-cap line
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(p.x, p.y, p.w, 4);

        // platform border highlight
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        // Draw Star if exists
        if (p.hasStar && !p.starCollected) {
            ctx.fillStyle = '#ecc94b';
            ctx.strokeStyle = '#b7791f';
            ctx.lineWidth = 1;
            // Draw star polygon
            ctx.beginPath();
            const cx = p.starX;
            const cy = p.starY;
            const spikes = 5;
            const outerRadius = 8;
            const innerRadius = 4;
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    });

    // Draw Ninja stick figure
    ctx.save();
    ctx.translate(ninja.x + ninja.w / 2, ninja.y + ninja.h / 2);

    // Head
    ctx.fillStyle = '#1a202c'; // Dark black hood
    ctx.beginPath();
    ctx.arc(0, -8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mask slit (peach skin eyes showing)
    ctx.fillStyle = '#ecc94b';
    ctx.fillRect(1, -10, 4, 3);

    // Red Headband tails (waves in sine wave)
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    const wave = Math.sin(animTicks * 0.15) * 5;
    ctx.quadraticCurveTo(-12, -7 + wave / 2, -18, -6 + wave);
    ctx.stroke();

    // Body trunk torso
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Legs animation
    ctx.lineWidth = 3;
    if (ninja.onGround) {
        // running feet scissor angles
        const angle = Math.sin(animTicks * 0.25) * 6;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-4 + angle, 13);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(4 - angle, 13);
        ctx.stroke();
    } else {
        // jump tuck legs
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-3, 11);
        ctx.moveTo(0, 6);
        ctx.lineTo(3, 11);
        ctx.stroke();
    }

    // Arms
    ctx.beginPath();
    if (ninja.onGround) {
        ctx.moveTo(0, 0);
        ctx.lineTo(5, 4);
    } else {
        // arms fly up
        ctx.moveTo(0, 0);
        ctx.lineTo(6, -6);
    }
    ctx.stroke();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Key actions listeners
function triggerJump() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }

    if (ninja.onGround) {
        ninja.vy = -4.8;
        ninja.onGround = false;
        ninja.isJumping = true;
        playSound('jump');
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        isSpaceHeld = true;
        triggerJump();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        isSpaceHeld = false;
    }
});

// Touch controls variables jump
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isSpaceHeld = true;
    triggerJump();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    isSpaceHeld = false;
});

// Game state controllers
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    scoreVal.textContent = score;

    initLevel();

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
