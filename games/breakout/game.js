/**
 * KidsGameZone: Breakout Classic (Brick Breaker)
 * Multi-ball engine arrays, brick collision solvers, falling powerups, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_breakout';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const livesVal = document.getElementById('livesVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');
const activePowerupEl = document.getElementById('activePowerup');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const winOverlay = document.getElementById('winOverlay');
const winScoreVal = document.getElementById('winScoreVal');
const winHighScoreVal = document.getElementById('winHighScoreVal');
const winPlayAgainBtn = document.getElementById('winPlayAgainBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Audio Synth
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

    if (type === 'hit_paddle') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'hit_brick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'powerup') {
        // Magical chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(784, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'lost') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Config
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 7;
const BRICK_COLS = 10;
const BRICK_ROWS = 8;
const BRICK_W = 50;
const BRICK_H = 16;
const BRICK_GAP = 5;

// State Variables
let score = 0;
let lives = 3;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Physics objects
let paddle = { x: 250, y: 370, w: 90, h: PADDLE_HEIGHT, speed: 5.5 };
let balls = []; // Multiple balls (Multi-ball power-up)
let bricks = []; // list of {x, y, row, col, type, health, color, active}
let powerups = []; // falling powerups
let activePowerupTimer = 0;
let activePowerupType = null;

const keys = { Left: false, Right: false };

highScoreVal.textContent = highScore;

// Brick Grid setup
function initBricks() {
    bricks = [];
    const offsetLeft = 25;
    const offsetTop = 45;

    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            // Rows 0-1: Red (3 hits), 2-4: Green (2 hits), 5-7: Yellow (1 hit)
            let type = 'yellow';
            let health = 1;
            let color = '#ecc94b';

            if (r < 2) {
                type = 'red';
                health = 3;
                color = '#f56565';
            } else if (r >= 2 && r < 5) {
                type = 'green';
                health = 2;
                color = '#48bb78';
            }

            bricks.push({
                x: offsetLeft + c * (BRICK_W + BRICK_GAP),
                y: offsetTop + r * (BRICK_H + BRICK_GAP),
                row: r,
                col: c,
                type: type,
                health: health,
                maxHealth: health,
                color: color,
                active: true
            });
        }
    }
}

function resetPaddlesAndBall() {
    paddle.w = 90;
    paddle.x = (canvas.width - paddle.w) / 2;
    balls = [{
        x: canvas.width / 2,
        y: 350,
        vx: 3 + Math.random() * 2 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4,
        r: BALL_RADIUS
    }];
    powerups = [];
    activePowerupTimer = 0;
    activePowerupType = null;
    activePowerupEl.style.display = 'none';
}

// Spawning Power-ups
const POWERUP_TYPES = [
    { type: 'wide', label: '🔵 Wide Paddle', color: '#3182ce' },
    { type: 'multi', label: '🟠 Multi-Ball', color: '#dd6b20' },
    { type: 'slow', label: '🟢 Slow Ball', color: '#38a169' }
];

function spawnPowerup(x, y) {
    if (Math.random() > 0.08) return; // 8% drop chance
    const spec = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    powerups.push({
        x: x,
        y: y,
        type: spec.type,
        label: spec.label,
        color: spec.color,
        w: 15,
        h: 15,
        vy: 2
    });
}

function checkBallBrickCollision(ball) {
    for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (!b.active) continue;

        // AABB vs Circle
        const closestX = Math.max(b.x, Math.min(ball.x, b.x + BRICK_W));
        const closestY = Math.max(b.y, Math.min(ball.y, b.y + BRICK_H));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ball.r) {
            // Hit!
            playSound('hit_brick');
            b.health--;

            if (b.health <= 0) {
                b.active = false;
                score += (b.type === 'red' ? 30 : b.type === 'green' ? 20 : 10);
                scoreVal.textContent = score;

                // Spawn Powerup drop
                spawnPowerup(b.x + BRICK_W/2, b.y + BRICK_H);
            } else {
                // Dim color relative to health
                if (b.type === 'red') {
                    b.color = b.health === 2 ? '#feb2b2' : '#fed7d7';
                } else if (b.type === 'green') {
                    b.color = '#c6f6d5';
                }
            }

            // Bounce direction resolution
            const overlapX = ball.r - Math.abs(dx);
            const overlapY = ball.r - Math.abs(dy);

            if (overlapX < overlapY) {
                ball.vx = -ball.vx;
            } else {
                ball.vy = -ball.vy;
            }
            break; // collision with one brick per frame
        }
    }
}

// Calculations update
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Move paddle (keyboard)
    if (keys.Left && paddle.x > 8) {
        paddle.x -= paddle.speed;
    }
    if (keys.Right && paddle.x < canvas.width - paddle.w - 8) {
        paddle.x += paddle.speed;
    }

    // 2. Move active balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Side walls bounces
        if (ball.x < ball.r + 6) {
            ball.x = ball.r + 6;
            ball.vx = -ball.vx;
        } else if (ball.x > canvas.width - ball.r - 6) {
            ball.x = canvas.width - ball.r - 6;
            ball.vx = -ball.vx;
        }

        // Top ceiling bounce
        if (ball.y < ball.r + 6) {
            ball.y = ball.r + 6;
            ball.vy = -ball.vy;
        }

        // Paddle Collision
        if (ball.vy > 0 &&
            ball.x + ball.r >= paddle.x && ball.x - ball.r <= paddle.x + paddle.w &&
            ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h) {

            playSound('hit_paddle');
            // Calculate elastic bounce angle
            const paddleCenter = paddle.x + paddle.w / 2;
            const hitOffset = (ball.x - paddleCenter) / (paddle.w / 2); // -1 to 1
            const baseSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

            ball.vx = hitOffset * 4.2;
            ball.vy = -Math.sqrt(Math.max(12, baseSpeed * baseSpeed - ball.vx * ball.vx));
        }

        // Brick collision checks
        checkBallBrickCollision(ball);

        // Fall out of bottom checks
        if (ball.y > canvas.height + 10) {
            balls.splice(i, 1);
        }
    }

    // 3. Spared no balls left?
    if (balls.length === 0) {
        lives--;
        livesVal.textContent = lives;
        playSound('lost');

        if (lives <= 0) {
            endGame(false);
        } else {
            resetPaddlesAndBall();
        }
    }

    // 4. Power-up status timers
    if (activePowerupTimer > 0) {
        activePowerupTimer--;
        if (activePowerupTimer <= 0) {
            // Reset powerup effects
            paddle.w = 90;
            activePowerupEl.style.display = 'none';
        }
    }

    // 5. Falling powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pup = powerups[i];
        pup.y += pup.vy;

        // Catch by paddle
        if (pup.x + pup.w >= paddle.x && pup.x <= paddle.x + paddle.w &&
            pup.y + pup.h >= paddle.y && pup.y <= paddle.y + paddle.h) {

            playSound('powerup');
            applyPowerup(pup.type, pup.label);
            powerups.splice(i, 1);
            continue;
        }

        if (pup.y > canvas.height + 10) {
            powerups.splice(i, 1);
        }
    }

    // Check Victory
    const activeBricks = bricks.filter(b => b.active).length;
    if (activeBricks === 0) {
        endGame(true);
    }
}

// Powerups Actions
function applyPowerup(type, label) {
    activePowerupType = type;
    activePowerupEl.textContent = label + " Active!";
    activePowerupEl.style.display = 'block';

    if (type === 'wide') {
        paddle.w = 135;
        activePowerupTimer = 480; // 8 seconds at 60fps
    } else if (type === 'multi') {
        // Spawn 2 extra balls
        if (balls.length > 0) {
            const first = balls[0];
            balls.push({
                x: first.x,
                y: first.y,
                vx: -first.vx,
                vy: first.vy,
                r: BALL_RADIUS
            });
            balls.push({
                x: first.x,
                y: first.y,
                vx: first.vx * 0.5,
                vy: -first.vy * 0.8,
                r: BALL_RADIUS
            });
        }
    } else if (type === 'slow') {
        // Slow speed of all balls
        balls.forEach(b => {
            b.vx *= 0.65;
            b.vy *= 0.65;
        });
        activePowerupTimer = 480;
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw curbs
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, 8, canvas.height);
    ctx.fillRect(canvas.width - 8, 0, 8, canvas.height);
    ctx.fillRect(0, 0, canvas.width, 8);

    // Draw Bricks
    bricks.forEach(b => {
        if (!b.active) return;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
        ctx.strokeStyle = '#1a202c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, BRICK_W, BRICK_H);
        ctx.restore();
    });

    // Draw Paddle
    ctx.fillStyle = '#3182ce'; // Blue paddle
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Draw Balls
    ctx.fillStyle = '#ffffff';
    balls.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Power-ups
    powerups.forEach(pup => {
        ctx.save();
        ctx.fillStyle = pup.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pup.x + pup.w/2, pup.y + pup.h/2, pup.w/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inputs
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = false;
    }
});

// Mouse coordinates tracker
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    paddle.x = clickX - paddle.w / 2;
    // clamp
    if (paddle.x < 8) paddle.x = 8;
    if (paddle.x > canvas.width - paddle.w - 8) {
        paddle.x = canvas.width - paddle.w - 8;
    }
});

// Mobile Swipe controls
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    paddle.x = clickX - paddle.w / 2;
    if (paddle.x < 8) paddle.x = 8;
    if (paddle.x > canvas.width - paddle.w - 8) {
        paddle.x = canvas.width - paddle.w - 8;
    }
}, { passive: false });

// Game State Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    lives = 3;
    scoreVal.textContent = score;
    livesVal.textContent = lives;

    initBricks();
    resetPaddlesAndBall();

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    winOverlay.classList.remove('active');

    gameOver = false;
    gameStarted = true;
}

function endGame(won) {
    gameOver = true;
    if (won) {
        playSound('win');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_KEY, highScore);
            highScoreVal.textContent = highScore;
        }
        winScoreVal.textContent = score;
        winHighScoreVal.textContent = highScore;
        winOverlay.classList.add('active');
    } else {
        playSound('lost');
        failScoreVal.textContent = score;
        gameOverOverlay.classList.add('active');
    }
}

startBtn.addEventListener('click', startGame);
winPlayAgainBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Play
gameLoop();
