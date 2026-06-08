/**
 * KidsGameZone: Balloon Pop
 * Beautiful floating balloons, pop particles, sine wiggles, and client-side audio synth pop sounds.
 */

const STORAGE_KEY = 'kgz_highscore_balloon-pop';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const missedVal = document.getElementById('missedVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreVal = document.getElementById('finalScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');

// Game State
let score = 0;
let missed = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;
let balloons = [];
let particles = [];
let spawnTimer = 0;
let spawnInterval = 60; // in frames
let baseSpeed = 1.5;

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

    if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'miss') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.15);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Set initial high score display
highScoreVal.textContent = highScore;

// Types of balloons
const BALLOON_TYPES = [
    { color: '#e53e3e', accent: '#feb2b2', points: 10, weight: 65, radius: 24 }, // Red (Common)
    { color: '#3182ce', accent: '#90cdf4', points: 20, weight: 25, radius: 22 }, // Blue (Medium)
    { color: '#ecc94b', accent: '#fef08a', points: 50, weight: 10, radius: 18 }  // Gold (Rare/Fast)
];

function spawnBalloon() {
    if (gameOver || !gameStarted) return;

    // Weighted random selection
    const rand = Math.random() * 100;
    let spec = BALLOON_TYPES[0];
    if (rand > 65 && rand <= 90) {
        spec = BALLOON_TYPES[1];
    } else if (rand > 90) {
        spec = BALLOON_TYPES[2];
    }

    const x = spec.radius + Math.random() * (canvas.width - spec.radius * 2);
    const y = canvas.height + spec.radius + 10;
    const speed = baseSpeed + (spec.points === 50 ? 2 : spec.points === 20 ? 0.8 : 0) + Math.random() * 0.5;

    balloons.push({
        x: x,
        y: y,
        startX: x,
        radius: spec.radius,
        color: spec.color,
        accent: spec.accent,
        points: spec.points,
        speed: speed,
        wiggleRange: 15 + Math.random() * 15,
        wiggleSpeed: 0.02 + Math.random() * 0.03,
        wiggleAngle: Math.random() * Math.PI * 2
    });
}

function spawnPopParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 3,
            color: color,
            alpha: 1,
            decay: 0.03 + Math.random() * 0.03
        });
    }
}

// Game Update Logic
function update() {
    if (!gameStarted || gameOver) return;

    // Spawn controller
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnBalloon();
        spawnTimer = 0;
        // speed up rate of spawning slightly as score increases
        spawnInterval = Math.max(25, 60 - Math.floor(score / 150) * 5);
    }

    // Move balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        b.y -= b.speed;
        b.wiggleAngle += b.wiggleSpeed;
        b.x = b.startX + Math.sin(b.wiggleAngle) * b.wiggleRange;

        // Check if reached top of screen
        if (b.y < -b.radius) {
            balloons.splice(i, 1);
            missed++;
            missedVal.textContent = missed;
            playSound('miss');

            if (missed >= 5) {
                endGame();
            }
        }
    }

    // Particles update
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Progressively speed up base speeds
    baseSpeed = 1.5 + (score / 300) * 0.5;
}

// Render Logic
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cloud backgrounds (vector drawings)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    // Cloud 1
    ctx.beginPath();
    ctx.arc(80, 100, 30, 0, Math.PI*2);
    ctx.arc(120, 90, 40, 0, Math.PI*2);
    ctx.arc(160, 100, 30, 0, Math.PI*2);
    ctx.arc(120, 120, 30, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Cloud 2
    ctx.beginPath();
    ctx.arc(280, 250, 20, 0, Math.PI*2);
    ctx.arc(310, 240, 28, 0, Math.PI*2);
    ctx.arc(340, 250, 20, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Draw pop particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw balloons
    balloons.forEach(b => {
        ctx.save();

        // 1. Balloon String
        ctx.strokeStyle = '#a0aec0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius);
        ctx.quadraticCurveTo(b.x - 5, b.y + b.radius + 15, b.x + 2, b.y + b.radius + 35);
        ctx.stroke();

        // 2. Balloon bottom knot (small triangle)
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius - 2);
        ctx.lineTo(b.x - 5, b.y + b.radius + 6);
        ctx.lineTo(b.x + 5, b.y + b.radius + 6);
        ctx.closePath();
        ctx.fill();

        // 3. Main balloon body (oval)
        const gradient = ctx.createRadialGradient(
            b.x - b.radius * 0.3,
            b.y - b.radius * 0.3,
            b.radius * 0.1,
            b.x,
            b.y,
            b.radius
        );
        gradient.addColorStop(0, b.accent);
        gradient.addColorStop(1, b.color);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Drawing slightly elongated oval
        ctx.ellipse(b.x, b.y, b.radius * 0.9, b.radius * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. White shine accent reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(b.x - b.radius * 0.4, b.y - b.radius * 0.4, b.radius * 0.25, b.radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// User Action - click/tap triggers pop
function checkPop(clickX, clickY) {
    if (!gameStarted || gameOver) return;

    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        // simple circle distance formula
        const dist = Math.sqrt((clickX - b.x) ** 2 + (clickY - b.y) ** 2);
        if (dist <= b.radius * 1.2) { // 1.2 multiplier to make tapping friendly
            // Popped!
            playSound('pop');
            score += b.points;
            scoreVal.textContent = score;

            spawnPopParticles(b.x, b.y, b.color);
            balloons.splice(i, 1);
            break; // pop one at a time per tap
        }
    }
}

// Inputs
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    checkPop(clickX, clickY);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    checkPop(clickX, clickY);
}, { passive: false });

// Game Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    missed = 0;
    baseSpeed = 1.5;
    scoreVal.textContent = score;
    missedVal.textContent = missed;

    balloons = [];
    particles = [];
    spawnTimer = 0;
    spawnInterval = 60;

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

startBtn.addEventListener('click', startGame);
overlayRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start looping
gameLoop();
