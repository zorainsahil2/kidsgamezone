/**
 * KidsGameZone: Zombie Survival Arena
 * Top-down twin-stick shooter, polar coordinate shoots, zombie path chases, green splat particles, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_zombie-shooter';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const livesVal = document.getElementById('livesVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');
const waveAlertEl = document.getElementById('waveAlert');

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

    if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'splat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'wave') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

// Config
const PLAYER_R = 10;
const ZOMBIE_R = 9;
const BULLET_R = 3;

// State Variables
let score = 0;
let lives = 3;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Entities
let playerX = 250;
let playerY = 250;
let playerSpeed = 3.2;
let bullets = []; // list of {x, y, vx, vy, r}
let zombies = []; // list of {x, y, r, speed, hp, maxHp}
let splatParticles = [];

// Wave details
let currentWave = 0;
let waveZombiesTotal = 0;
let waveZombiesSpawned = 0;
let waveBreakTimer = 0; // frames
let isWaveBreak = false;
let spawnTimer = 0;

// Movement inputs
const keys = { w: false, a: false, s: false, d: false };
let aimAngle = 0;

highScoreVal.textContent = highScore;

// Spawning Zombies randomly around outer border edges
function spawnZombie() {
    if (gameOver || isWaveBreak) return;

    // Pick edge randomly
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 20;

    if (edge === 0) { // Top
        x = Math.random() * canvas.width;
        y = -margin;
    } else if (edge === 1) { // Right
        x = canvas.width + margin;
        y = Math.random() * canvas.height;
    } else if (edge === 2) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + margin;
    } else { // Left
        x = -margin;
        y = Math.random() * canvas.height;
    }

    // Progression speed scales slightly per wave
    const speed = 0.8 + (currentWave * 0.05);

    zombies.push({
        x: x,
        y: y,
        r: ZOMBIE_R,
        speed: speed,
        active: true
    });

    waveZombiesSpawned++;
}

// Visual splat creation
function spawnSplat(x, y, count = 12) {
    const colors = ['#48bb78', '#38a169', '#2f855a', '#ecc94b']; // Greenish slime colors
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.5;
        splatParticles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.03,
            radius: 1.5 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

// Start wave chime break
function startNextWave() {
    currentWave++;
    waveZombiesTotal = 5 + (currentWave - 1) * 3;
    waveZombiesSpawned = 0;
    isWaveBreak = true;
    waveBreakTimer = 180; // 3 seconds at 60fps

    waveAlertEl.textContent = `Wave ${currentWave} Incoming!`;
    waveAlertEl.style.display = 'block';
    playSound('wave');
}

// Invul frame ticks
let invulFrames = 0;

// Calculations updates
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Move Player
    let dx = 0;
    let dy = 0;
    if (keys.w) dy = -1;
    if (keys.s) dy = 1;
    if (keys.a) dx = -1;
    if (keys.d) dx = 1;

    // Normalize diagonal velocity vectors
    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    playerX += dx * playerSpeed;
    playerY += dy * playerSpeed;

    // Canvas boundary clamp player
    playerX = Math.max(PLAYER_R + 8, Math.min(canvas.width - PLAYER_R - 8, playerX));
    playerY = Math.max(PLAYER_R + 8, Math.min(canvas.height - PLAYER_R - 8, playerY));

    if (invulFrames > 0) invulFrames--;

    // 2. Wave break clocks
    if (isWaveBreak) {
        waveBreakTimer--;
        if (waveBreakTimer <= 0) {
            isWaveBreak = false;
            waveAlertEl.style.display = 'none';
        }
    }

    // 3. Spawn controller
    if (!isWaveBreak && waveZombiesSpawned < waveZombiesTotal) {
        spawnTimer++;
        const spawnDelay = Math.max(30, 90 - currentWave * 6);
        if (spawnTimer >= spawnDelay) {
            spawnZombie();
            spawnTimer = 0;
        }
    }

    // 4. Move Zombies towards player
    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        if (!z.active) continue;

        const pathX = playerX - z.x;
        const pathY = playerY - z.y;
        const dist = Math.sqrt(pathX * pathX + pathY * pathY);

        if (dist > 1.5) {
            z.x += (pathX / dist) * z.speed;
            z.y += (pathY / dist) * z.speed;
        }

        // Touch Player checks
        if (invulFrames === 0 && dist < PLAYER_R + z.r) {
            playSound('hit');
            lives--;
            livesVal.textContent = lives;
            invulFrames = 90; // 1.5 seconds invulnerability

            // Push active zombies away to give space
            zombies.forEach(oth => {
                const odx = oth.x - playerX;
                const ody = oth.y - playerY;
                const odist = Math.sqrt(odx * odx + ody * ody);
                if (odist > 0) {
                    oth.x += (odx / odist) * 55;
                    oth.y += (ody / odist) * 55;
                }
            });

            if (lives <= 0) {
                endGame();
            }
            continue;
        }
    }

    // 5. Move Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // check hits zombie
        let hit = false;
        for (let j = zombies.length - 1; j >= 0; j--) {
            const z = zombies[j];
            if (z.active) {
                const zdx = b.x - z.x;
                const zdy = b.y - z.y;
                const zdist = Math.sqrt(zdx * zdx + zdy * zdy);

                if (zdist < b.r + z.r) {
                    // Dead!
                    z.active = false;
                    zombies.splice(j, 1);
                    hit = true;
                    playSound('splat');
                    spawnSplat(z.x, z.y);
                    score += 10;
                    scoreVal.textContent = score;
                    break;
                }
            }
        }

        if (hit) {
            bullets.splice(i, 1);
            continue;
        }

        // clean out of bounds
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // 6. Splat particles update
    for (let i = splatParticles.length - 1; i >= 0; i--) {
        const p = splatParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            splatParticles.splice(i, 1);
        }
    }

    // 7. Check Wave Cleared
    if (!isWaveBreak && waveZombiesSpawned >= waveZombiesTotal && zombies.length === 0) {
        startNextWave();
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Green Splat Splashes on ground
    splatParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 2. Draw active player (bubbly blue face)
    if (invulFrames === 0 || Math.floor(invulFrames / 6) % 2 === 0) {
        ctx.save();
        ctx.translate(playerX, playerY);
        ctx.rotate(aimAngle);

        ctx.fillStyle = '#3182ce'; // Blue body
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gun gun-barrel point
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(4, -3, 9, 6);
        ctx.strokeRect(4, -3, 9, 6);

        // Eyes dots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, -3, 2, 0, Math.PI * 2);
        ctx.arc(3, 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 3. Draw Zombies (green blocks with red eyes)
    zombies.forEach(z => {
        if (!z.active) return;
        ctx.save();
        ctx.fillStyle = '#48bb78'; // cartoon green
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22543d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Angled eyes (glow red dots)
        ctx.fillStyle = '#f56565';
        ctx.beginPath();
        ctx.arc(z.x - 2, z.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(z.x + 2, z.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // 4. Draw Bullets
    ctx.fillStyle = '#FFE66D';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Shoot trigger function
function fireBullet(targetX, targetY) {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }
    if (isWaveBreak) return; // wait for waves

    playSound('shoot');
    const angle = Math.atan2(targetY - playerY, targetX - playerX);
    const speed = 7.5;

    bullets.push({
        x: playerX + Math.cos(angle) * PLAYER_R,
        y: playerY + Math.sin(angle) * PLAYER_R,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: BULLET_R
    });
}

// Control Input bindings
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = false;
});

// Mouse direction tracking
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    aimAngle = Math.atan2(mY - playerY, mX - playerX);
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    fireBullet(clickX, clickY);
});

// Mobile virtual pad drag moves + taps shoots
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    if (clickX < 200) {
        // Touch move pad starts
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    } else {
        // Shoot pointer towards touch coordinate
        aimAngle = Math.atan2(clickY - playerY, clickX - playerX);
        fireBullet(clickX, clickY);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;

    if (clickX < 200) {
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        // Map movement keys simulated
        keys.w = (dy < -20);
        keys.s = (dy > 20);
        keys.a = (dx < -20);
        keys.d = (dx > 20);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    // Reset key simulations
    keys.w = false;
    keys.s = false;
    keys.a = false;
    keys.d = false;
});

// Game state controllers
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    lives = 3;
    currentWave = 0;
    playerX = 250;
    playerY = 250;

    scoreVal.textContent = score;
    livesVal.textContent = lives;

    bullets = [];
    zombies = [];
    splatParticles = [];

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    gameOver = false;
    gameStarted = true;
    startNextWave();
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

// Start looping
gameLoop();
