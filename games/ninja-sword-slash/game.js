// Ninja Sword Slash - KidsGameZone Game Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;
let lives = 3;

// Ninja configuration
const NINJA_X = 80;
const GROUND_Y = 250;
const NINJA_HEIGHT = 45;
const NINJA_WIDTH = 30;

let ninja = {
    x: NINJA_X,
    y: GROUND_Y - NINJA_HEIGHT,
    w: NINJA_WIDTH,
    h: NINJA_HEIGHT,
    isSlashing: false,
    slashTimer: 0,
    slashCooldown: 0,
    runFrame: 0,
    damageFlash: 0
};

// Powerups
let goldenSwordTimer = 0; // in frames (60fps)
let lastScoreMilestone = 0;

// Enemies
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnRate = 120; // spawn every 120 frames initially

// Particles
let particles = [];
let screenShake = 0;
let runDistance = 0;

// Audio Synthesizer
let audioCtx = null;
function playTone(freq, type, duration, targetFreq = null) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (targetFreq) {
            osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function initGame() {
    score = 0;
    lives = 3;
    enemies = [];
    particles = [];
    goldenSwordTimer = 0;
    lastScoreMilestone = 0;
    enemySpawnTimer = 0;
    enemySpawnRate = 120;
    runDistance = 0;
    ninja.damageFlash = 0;
    ninja.isSlashing = false;
    ninja.slashTimer = 0;
    updateUI();
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    let heartStr = "";
    for (let i = 0; i < lives; i++) heartStr += "❤️";
    if (heartStr === "") heartStr = "💀";
    document.getElementById("livesVal").textContent = heartStr;
}

class Enemy {
    constructor(type) {
        this.type = type; // "walker", "jumper", "bird"
        this.x = canvas.width + 50;
        this.w = 32;
        this.h = 32;
        this.speed = 3 + Math.min(score * 0.05, 5); // speed scales with score
        
        if (this.type === "walker") {
            this.y = GROUND_Y - this.h;
            this.color = "#ef4444"; // Red ninja
        } else if (this.type === "jumper") {
            this.y = GROUND_Y - this.h;
            this.color = "#a855f7"; // Purple jumping ninja
            this.jumpTime = 0;
            this.jumpHeight = 70 + Math.random() * 40;
        } else if (this.type === "bird") {
            this.y = GROUND_Y - NINJA_HEIGHT - 35 - Math.random() * 30; // bird flies higher
            this.color = "#3b82f6"; // Blue bird
            this.w = 26;
            this.h = 20;
        }
        this.slashed = false;
    }

    update() {
        this.x -= this.speed;

        if (this.type === "jumper") {
            this.jumpTime += 0.08;
            // Parabolic jump path
            const jumpOffset = Math.sin(this.jumpTime) * this.jumpHeight;
            if (jumpOffset > 0) {
                this.y = (GROUND_Y - this.h) - jumpOffset;
            } else {
                this.y = GROUND_Y - this.h;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        if (this.type === "bird") {
            // Draw a cute bird shape
            ctx.beginPath();
            ctx.ellipse(this.x + this.w/2, this.y + this.h/2, this.w/2, this.h/2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Wing flapping
            ctx.fillStyle = "#60a5fa";
            ctx.beginPath();
            ctx.ellipse(this.x + this.w/2, this.y + this.h/2 - 2, 6, 8 * Math.sin(runDistance * 0.2), Math.PI/4, 0, Math.PI*2);
            ctx.fill();
        } else {
            // Draw chibi enemy ninja
            ctx.fillRect(this.x, this.y, this.w, this.h);
            // Mask headband
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(this.x, this.y + 6, this.w, 8);
            ctx.fillStyle = "#ffffff";
            // Angry eye slits
            ctx.fillRect(this.x + 6, this.y + 8, 5, 3);
            ctx.fillRect(this.x + 18, this.y + 8, 5, 3);
        }
    }
}

class SlashParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.size = Math.random() * 4 + 2;
        this.alpha = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.alpha -= 0.03;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

function spawnEnemy() {
    const types = ["walker", "jumper", "bird"];
    // Unlock jumpers and birds as score grows
    let pool = ["walker"];
    if (score >= 20) pool.push("jumper");
    if (score >= 50) pool.push("bird");

    const randType = pool[Math.floor(Math.random() * pool.length)];
    enemies.push(new Enemy(randType));
}

function triggerSlash() {
    if (ninja.slashCooldown > 0 && goldenSwordTimer <= 0) return;
    
    ninja.isSlashing = true;
    ninja.slashTimer = 8; // Slasher duration in frames
    if (goldenSwordTimer <= 0) {
        ninja.slashCooldown = 15; // Cooldown frames
        playTone(600, "triangle", 0.08, 900);
    } else {
        // Instant/rapid slashes
        playTone(900, "sine", 0.05, 1200);
    }
}

function checkCollisions() {
    const isGolden = goldenSwordTimer > 0;
    const slashRange = isGolden ? 120 : 65;

    enemies.forEach((enemy, index) => {
        // 1. Sword Slash collision check
        if (ninja.isSlashing) {
            // Slash hits in front of Ninja
            const inSlashRangeX = (enemy.x >= ninja.x && enemy.x <= ninja.x + slashRange);
            const inSlashRangeY = (enemy.y + enemy.h >= ninja.y - 30 && enemy.y <= ninja.y + ninja.h + 20);

            if (inSlashRangeX && inSlashRangeY) {
                // Defeated!
                enemies.splice(index, 1);
                score += 10;
                updateUI();
                playTone(400, "sine", 0.1, 700);

                // Spawn splash particles
                for (let i = 0; i < 8; i++) {
                    particles.push(new SlashParticle(enemy.x + enemy.w/2, enemy.y + enemy.h/2, enemy.color));
                }

                // Check Golden Sword milestone activation
                if (score > 0 && score % 100 === 0 && score > lastScoreMilestone) {
                    goldenSwordTimer = 180; // 3 seconds at 60fps
                    lastScoreMilestone = score;
                    playTone(500, "sawtooth", 0.5, 1000);
                }
                return;
            }
        }

        // 2. Ninja Body collision check
        const bodyHitX = (enemy.x + 5 < ninja.x + ninja.w && enemy.x + enemy.w - 5 > ninja.x);
        const bodyHitY = (enemy.y + 5 < ninja.y + ninja.h && enemy.y + enemy.h - 5 > ninja.y);

        if (bodyHitX && bodyHitY) {
            // Take damage
            enemies.splice(index, 1);
            if (goldenSwordTimer <= 0) {
                lives--;
                ninja.damageFlash = 20;
                screenShake = 12;
                playTone(180, "sawtooth", 0.3, 70);
                updateUI();

                if (lives <= 0) {
                    triggerGameOver();
                }
            } else {
                // Golden sword block
                score += 10;
                updateUI();
                playTone(600, "sine", 0.1, 800);
            }
        }
    });
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    playTone(150, "sawtooth", 0.6, 60);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_ninja-sword-slash", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("gameOverOverlay").classList.add("active");
}

function drawBackground() {
    // Cave Background
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, "#1c1414");
    skyGradient.addColorStop(1, "#070404");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Moonlight/Cave glowing rocks
    ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
    ctx.beginPath();
    ctx.arc(400, 100, 120, 0, Math.PI * 2);
    ctx.fill();

    // Floor lines scrolling
    ctx.strokeStyle = "#450a0a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = "#2d0808";
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // Scroll lines
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 1.5;
    let groundOffsetX = (runDistance * 4) % 60;
    for (let i = -60; i < canvas.width + 60; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i - groundOffsetX, GROUND_Y);
        ctx.lineTo(i - groundOffsetX - 30, canvas.height);
        ctx.stroke();
    }
}

function drawNinja() {
    ctx.save();
    
    // Apply damage flash color
    if (ninja.damageFlash > 0 && Math.floor(ninja.damageFlash / 3) % 2 === 0) {
        ctx.fillStyle = "#ef4444";
    } else {
        ctx.fillStyle = "#0f172a"; // Blue-dark ninja suit
    }

    // Chibi body
    ctx.fillRect(ninja.x, ninja.y, ninja.w, ninja.h);

    // Mask/band
    ctx.fillStyle = "#dc2626"; // Crimson sash/headband
    ctx.fillRect(ninja.x, ninja.y + 8, ninja.w, 9);
    
    // Eyes (white slits)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ninja.x + 18, ninja.y + 11, 6, 3);

    // Draw sash tail (wiggles while running)
    const wiggle = Math.sin(runDistance * 0.4) * 8;
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(ninja.x, ninja.y + 12);
    ctx.lineTo(ninja.x - 18, ninja.y + 12 + wiggle);
    ctx.lineTo(ninja.x, ninja.y + 17);
    ctx.fill();

    // Slash sword effect
    if (ninja.isSlashing) {
        const isGolden = goldenSwordTimer > 0;
        ctx.strokeStyle = isGolden ? "#fef08a" : "rgba(255,255,255,0.85)";
        ctx.lineWidth = isGolden ? 8 : 4;
        ctx.lineCap = "round";

        // Draw slash crescent arc
        ctx.beginPath();
        const startArcX = ninja.x + ninja.w;
        const startArcY = ninja.y - 15;
        const endArcX = ninja.x + ninja.w + (isGolden ? 100 : 50);
        const endArcY = ninja.y + ninja.h + 10;
        
        ctx.moveTo(startArcX, startArcY);
        ctx.quadraticCurveTo(endArcX + 15, (startArcY + endArcY) / 2, startArcX, endArcY);
        ctx.stroke();

        // Extra outer gold aura
        if (isGolden) {
            ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
            ctx.lineWidth = 15;
            ctx.stroke();
        }
    }

    ctx.restore();
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    runDistance += 1.5;

    // Apply Screen Shake decay
    if (screenShake > 0) screenShake -= 0.5;

    // Slash triggers
    if (ninja.isSlashing) {
        ninja.slashTimer--;
        if (ninja.slashTimer <= 0) {
            ninja.isSlashing = false;
        }
    }
    if (ninja.slashCooldown > 0) {
        ninja.slashCooldown--;
    }

    // Damage flash timer
    if (ninja.damageFlash > 0) {
        ninja.damageFlash--;
    }

    // Golden Sword Timer update
    if (goldenSwordTimer > 0) {
        goldenSwordTimer--;
        document.getElementById("powerupTimerContainer").style.opacity = "1";
        document.getElementById("powerupTimerVal").textContent = (goldenSwordTimer / 60).toFixed(1) + "s";
        
        // Auto-slash in golden sword state
        if (goldenSwordTimer % 6 === 0) {
            triggerSlash();
        }
    } else {
        document.getElementById("powerupTimerContainer").style.opacity = "0";
    }

    // Enemy spawn controller
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
        // spawn faster as score grows
        enemySpawnRate = Math.max(45, 120 - Math.floor(score * 0.5));
    }

    // Update Enemies
    enemies.forEach((enemy, index) => {
        enemy.update();
        // remove off-screen
        if (enemy.x < -60) {
            enemies.splice(index, 1);
        }
    });

    // Collision tests
    checkCollisions();

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply screen shake
    if (screenShake > 0 && gameState === STATE_PLAYING) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
    }

    drawBackground();

    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
        drawNinja();
        enemies.forEach(enemy => enemy.draw());
        particles.forEach(p => p.draw());
    }

    ctx.restore();

    updateGame();

    requestAnimationFrame(gameLoop);
}

// User Actions
function handleAction() {
    if (gameState === STATE_MENU) {
        gameState = STATE_PLAYING;
        document.getElementById("startOverlay").classList.remove("active");
        initGame();
    } else if (gameState === STATE_PLAYING) {
        triggerSlash();
    }
}

// Event Bindings
document.getElementById("startBtn").addEventListener("click", () => {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
});

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_PLAYING;
    initGame();
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleAction();
}, { passive: false });

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    handleAction();
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        handleAction();
    }
});

// Load High Score
highScore = parseInt(localStorage.getItem("kgz_highscore_ninja-sword-slash"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Boot Loop
gameLoop();
