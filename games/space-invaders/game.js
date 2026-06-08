/**
 * KidsGameZone: Space Invaders
 * Classic vertical rows movements, descending shifts, bullet/laser collision lines, destructible covers, and audio.
 */

const STORAGE_KEY = 'kgz_highscore_space-invaders';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const livesVal = document.getElementById('livesVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

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

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(90, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'victory') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Config
const CANNON_Y = 440;
const CANNON_W = 38;
const CANNON_H = 18;

// Game State
let score = 0;
let lives = 3;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Objects
let playerX = 280;
let playerSpeed = 4.2;
let playerBullet = null; // {x, y, w, h, vy}
let alienLasers = []; // list of {x, y, w, h, vy}
let aliens = []; // list of {x, y, w, h, row, score, active, animFrame}
let shields = []; // list of {x, y, w, h, health} individual block units
let explosionParticles = [];

// Movement switches
const keys = { Left: false, Right: false };

highScoreVal.textContent = highScore;

// Alien Grid builder
function initAliens() {
    aliens = [];
    const rows = 4;
    const cols = 11;
    const spacingX = 40;
    const spacingY = 32;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const alienScore = (r === 0) ? 30 : (r === 1 || r === 2) ? 20 : 10;
            aliens.push({
                x: 60 + c * spacingX,
                y: 60 + r * spacingY,
                w: 24,
                h: 18,
                row: r,
                score: alienScore,
                active: true,
                animFrame: 0
            });
        }
    }
}

// Destructible covers initialization
function initShields() {
    shields = [];
    const shieldCount = 4;
    const spaceBetween = 110;
    const startX = 70;
    const shieldY = 380;

    // A single shield is made of a 6x4 block grid of pixels
    const blockW = 8;
    const blockH = 6;

    for (let s = 0; s < shieldCount; s++) {
        const offsetLeft = startX + s * spaceBetween;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 6; c++) {
                // cutout bottom center arch for shape
                if (r === 3 && (c === 2 || c === 3)) continue;
                shields.push({
                    x: offsetLeft + c * blockW,
                    y: shieldY + r * blockH,
                    w: blockW,
                    h: blockH,
                    active: true
                });
            }
        }
    }
}

// Spawn particles on explosion
function spawnExplosion(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        explosionParticles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.04 + Math.random() * 0.03,
            radius: 1.5 + Math.random() * 1.5,
            color
        });
    }
}

// Physics logic updates
let direction = 1; // 1 = right, -1 = left
let alienMoveTimer = 0;
let fireTimer = 0;

function update() {
    if (!gameStarted || gameOver) return;

    // 1. Move Player
    if (keys.Left && playerX > 10) {
        playerX -= playerSpeed;
    }
    if (keys.Right && playerX < canvas.width - CANNON_W - 10) {
        playerX += playerSpeed;
    }

    // 2. Move Player Bullet
    if (playerBullet) {
        playerBullet.y += playerBullet.vy;
        if (playerBullet.y < -10) {
            playerBullet = null;
        }
    }

    // 3. Move Alien lasers
    for (let i = alienLasers.length - 1; i >= 0; i--) {
        const laser = alienLasers[i];
        laser.y += laser.vy;

        // check hits player
        if (laser.x + laser.w > playerX && laser.x < playerX + CANNON_W &&
            laser.y + laser.h > CANNON_Y && laser.y < CANNON_Y + CANNON_H) {
            // Hit!
            playSound('hit');
            spawnExplosion(playerX + CANNON_W/2, CANNON_Y + CANNON_H/2, '#48bb78');
            alienLasers.splice(i, 1);
            lives--;
            livesVal.textContent = lives;

            if (lives <= 0) {
                endGame(false);
            } else {
                playerX = 280; // reset center
            }
            continue;
        }

        if (laser.y > canvas.height + 10) {
            alienLasers.splice(i, 1);
        }
    }

    // 4. Move Aliens Grid
    alienMoveTimer++;
    // Speed updates: fewer aliens = faster rate of movement
    const activeCount = aliens.filter(a => a.active).length;
    const moveRate = Math.max(4, Math.floor((activeCount / 44) * 45));

    if (alienMoveTimer >= moveRate) {
        alienMoveTimer = 0;
        let changeDir = false;

        // Shift position
        aliens.forEach(a => {
            if (!a.active) return;
            a.x += direction * 8;
            a.animFrame = 1 - a.animFrame; // swap leg frame

            // Reach bounds?
            if (direction === 1 && a.x > canvas.width - a.w - 10) {
                changeDir = true;
            } else if (direction === -1 && a.x < 10) {
                changeDir = true;
            }
        });

        if (changeDir) {
            direction = -direction;
            aliens.forEach(a => {
                if (!a.active) return;
                a.y += 15; // Shift down
                if (a.y + a.h >= CANNON_Y - 20) {
                    endGame(false); // Aliens landed!
                }
            });
        }
    }

    // 5. Alien Fires Laser
    fireTimer++;
    if (fireTimer >= 45 && activeCount > 0) {
        fireTimer = 0;
        // Shoot from a random active alien column (bottom-most)
        const columns = {};
        aliens.forEach(a => {
            if (a.active) {
                const colIdx = Math.floor(a.x / 40);
                if (!columns[colIdx] || columns[colIdx].y < a.y) {
                    columns[colIdx] = a;
                }
            }
        });

        const activeCols = Object.values(columns);
        if (activeCols.length > 0 && alienLasers.length < 3) {
            const shooter = activeCols[Math.floor(Math.random() * activeCols.length)];
            alienLasers.push({
                x: shooter.x + shooter.w / 2 - 1,
                y: shooter.y + shooter.h,
                w: 2,
                h: 12,
                vy: 4.5
            });
        }
    }

    // 6. Collision: Player Bullet vs Aliens
    if (playerBullet) {
        for (let i = 0; i < aliens.length; i++) {
            const a = aliens[i];
            if (a.active &&
                playerBullet.x + playerBullet.w > a.x && playerBullet.x < a.x + a.w &&
                playerBullet.y + playerBullet.h > a.y && playerBullet.y < a.y + a.h) {
                // Hit!
                a.active = false;
                playSound('explode');
                spawnExplosion(a.x + a.w/2, a.y + a.h/2, '#e53e3e');
                score += a.score;
                scoreVal.textContent = score;
                playerBullet = null;
                break;
            }
        }
    }

    // 7. Collision: Bullets / Lasers vs Shields
    shields.forEach(sh => {
        if (!sh.active) return;

        // Player bullet
        if (playerBullet &&
            playerBullet.x + playerBullet.w > sh.x && playerBullet.x < sh.x + sh.w &&
            playerBullet.y + playerBullet.h > sh.y && playerBullet.y < sh.y + sh.h) {
            sh.active = false;
            playerBullet = null;
        }

        // Alien lasers
        for (let i = alienLasers.length - 1; i >= 0; i--) {
            const laser = alienLasers[i];
            if (laser.x + laser.w > sh.x && laser.x < sh.x + sh.w &&
                laser.y + laser.h > sh.y && laser.y < sh.y + sh.h) {
                sh.active = false;
                alienLasers.splice(i, 1);
            }
        }
    });

    // 8. Explosion Particles update
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const p = explosionParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            explosionParticles.splice(i, 1);
        }
    }

    // Check Win
    if (activeCount === 0) {
        endGame(true);
    }
}

// Render loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Shields
    ctx.fillStyle = '#4ECDC4';
    shields.forEach(sh => {
        if (sh.active) {
            ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
        }
    });

    // Draw Player cannon (nice green retro ship)
    ctx.fillStyle = '#48bb78';
    // main body
    ctx.fillRect(playerX, CANNON_Y + 6, CANNON_W, CANNON_H - 6);
    // turret
    ctx.fillRect(playerX + CANNON_W / 2 - 4, CANNON_Y, 8, 6);
    // wheels details
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(playerX + 4, CANNON_Y + CANNON_H - 3, 6, 4);
    ctx.fillRect(playerX + CANNON_W - 10, CANNON_Y + CANNON_H - 3, 6, 4);

    // Draw Player Bullet
    if (playerBullet) {
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(playerBullet.x, playerBullet.y, playerBullet.w, playerBullet.h);
    }

    // Draw Alien Lasers
    ctx.fillStyle = '#ecc94b';
    alienLasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
    });

    // Draw Aliens
    aliens.forEach(a => {
        if (!a.active) return;
        ctx.save();

        // Pixel graphics styles depending on Row value
        ctx.fillStyle = (a.row === 0) ? '#a855f7' : (a.row === 1 || a.row === 2) ? '#3182ce' : '#dd6b20';

        // Draw alien shape
        ctx.fillRect(a.x + 2, a.y + 2, a.w - 4, a.h - 6);

        // Legs animated based on frame toggle
        if (a.animFrame === 0) {
            ctx.fillRect(a.x + 3, a.y + a.h - 4, 4, 4);
            ctx.fillRect(a.x + a.w - 7, a.y + a.h - 4, 4, 4);
        } else {
            ctx.fillRect(a.x, a.y + a.h - 4, 4, 4);
            ctx.fillRect(a.x + a.w - 4, a.y + a.h - 4, 4, 4);
        }

        // Eyes (pixel dots)
        ctx.fillStyle = '#000000';
        ctx.fillRect(a.x + 6, a.y + 6, 3, 3);
        ctx.fillRect(a.x + a.w - 9, a.y + 6, 3, 3);

        ctx.restore();
    });

    // Draw Explosion Particles
    explosionParticles.forEach(p => {
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

// Shoot action trigger
function fireBullet() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }
    if (playerBullet) return; // restrict to single active bullet

    playSound('shoot');
    playerBullet = {
        x: playerX + CANNON_W / 2 - 1.5,
        y: CANNON_Y - 8,
        w: 3,
        h: 10,
        vy: -7.5
    };
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = true;
    } else if (e.key === ' ') {
        fireBullet();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = false;
    }
});

// Mobile Taps aim controls
canvas.addEventListener('mousedown', (e) => {
    if (!gameStarted || gameOver) {
        fireBullet();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    if (clickX < 150) {
        // move left
        playerX = Math.max(10, playerX - 30);
    } else if (clickX > 450) {
        // move right
        playerX = Math.min(canvas.width - CANNON_W - 10, playerX + 30);
    } else {
        fireBullet();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted || gameOver) {
        fireBullet();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    if (clickX < 150) {
        playerX = Math.max(10, playerX - 30);
    } else if (clickX > 450) {
        playerX = Math.min(canvas.width - CANNON_W - 10, playerX + 30);
    } else {
        fireBullet();
    }
}, { passive: false });

// Game Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    lives = 3;
    playerX = 280;
    scoreVal.textContent = score;
    livesVal.textContent = lives;

    playerBullet = null;
    alienLasers = [];
    explosionParticles = [];

    initAliens();
    initShields();

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    winOverlay.classList.remove('active');

    gameOver = false;
    gameStarted = true;
}

function endGame(won) {
    gameOver = true;
    if (won) {
        playSound('victory');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_KEY, highScore);
            highScoreVal.textContent = highScore;
        }
        winScoreVal.textContent = score;
        winHighScoreVal.textContent = highScore;
        winOverlay.classList.add('active');
    } else {
        playSound('gameover');
        failScoreVal.textContent = score;
        gameOverOverlay.classList.add('active');
    }
}

function resetGame() {
    startGame();
}

startBtn.addEventListener('click', startGame);
winPlayAgainBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start looping
gameLoop();
