// Penguin Jump - KidsGameZone Game Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;

// Physics Config
const GRAVITY = 0.35;
const JUMP_VELOCITY = -9.5;
const BOUNCE_VELOCITY = -15;
const PENGUIN_WIDTH = 28;
const PENGUIN_HEIGHT = 32;

let penguin = {
    x: canvas.width / 2 - PENGUIN_WIDTH / 2,
    y: canvas.height - 100,
    vx: 0,
    vy: 0,
    w: PENGUIN_WIDTH,
    h: PENGUIN_HEIGHT,
    dir: 1 // 1 = right, -1 = left
};

// Platform System
let platforms = [];
const PLATFORM_WIDTH = 65;
const PLATFORM_HEIGHT = 12;

// Collectibles & Hazards
let items = []; // Fish, Snowflakes
let hazards = []; // Polar Bears

// Camera
let scrollOffset = 0;
let keys = {};
let touchDirection = 0; // -1 = left, 1 = right, 0 = none

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
    scrollOffset = 0;
    touchDirection = 0;
    
    penguin.x = canvas.width / 2 - PENGUIN_WIDTH / 2;
    penguin.y = canvas.height - 100;
    penguin.vx = 0;
    penguin.vy = JUMP_VELOCITY;
    
    // Initial platforms
    platforms = [];
    items = [];
    hazards = [];

    // Safe base platform right below penguin
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        type: "normal",
        broken: false,
        fade: 1.0
    });

    // Generate starter stack
    for (let i = 0; i < 9; i++) {
        generatePlatformAbove(canvas.height - 120 - i * 65);
    }

    updateUI();
}

function generatePlatformAbove(y) {
    const types = ["normal", "normal", "bouncy", "cracked"];
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Ensure we don't have too many cracked platforms early on
    if (score < 100 && type === "cracked") {
        type = "normal";
    }

    const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
    const plat = {
        x: x,
        y: y,
        type: type,
        broken: false,
        fade: 1.0
    };
    platforms.push(plat);

    // Chance to spawn item on normal/bouncy platforms
    if (type !== "cracked" && Math.random() < 0.35) {
        const itemType = Math.random() < 0.3 ? "fish" : "snowflake";
        items.push({
            x: x + PLATFORM_WIDTH / 2 - 10,
            y: y - 22,
            type: itemType,
            w: 18,
            h: 18,
            collected: false
        });
    }

    // Chance to spawn polar bear on normal platforms at higher score
    if (type === "normal" && score > 200 && Math.random() < 0.2) {
        hazards.push({
            x: x + 10,
            y: y - 26,
            w: 24,
            h: 24,
            vx: 0.5,
            patrolWidth: PLATFORM_WIDTH - 24,
            startX: x + 10
        });
    }
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    // Horizontal Movement
    if (keys["ArrowLeft"] || keys["KeyA"] || touchDirection === -1) {
        penguin.vx = -4.5;
        penguin.dir = -1;
    } else if (keys["ArrowRight"] || keys["KeyD"] || touchDirection === 1) {
        penguin.vx = 4.5;
        penguin.dir = 1;
    } else {
        penguin.vx *= 0.82; // slide friction
    }

    penguin.x += penguin.vx;

    // Screen border wrap
    if (penguin.x < -PENGUIN_WIDTH) {
        penguin.x = canvas.width;
    } else if (penguin.x > canvas.width) {
        penguin.x = -PENGUIN_WIDTH;
    }

    // Gravity & Vertical Physics
    penguin.vy += GRAVITY;
    penguin.y += penguin.vy;

    // Platform collisions (only when falling down)
    if (penguin.vy > 0) {
        platforms.forEach(plat => {
            if (plat.broken) return;

            const checkX = (penguin.x + penguin.w > plat.x && penguin.x < plat.x + PLATFORM_WIDTH);
            const checkY = (penguin.y + penguin.h >= plat.y && penguin.y + penguin.h <= plat.y + PLATFORM_HEIGHT + penguin.vy);

            if (checkX && checkY) {
                // Land!
                penguin.y = plat.y - penguin.h;
                
                if (plat.type === "normal") {
                    penguin.vy = JUMP_VELOCITY;
                    playTone(260, "sine", 0.1, 400);
                } else if (plat.type === "bouncy") {
                    penguin.vy = BOUNCE_VELOCITY;
                    playTone(300, "triangle", 0.15, 650);
                    // Add spring particles
                    spawnSpringParticles(plat.x + PLATFORM_WIDTH/2, plat.y);
                } else if (plat.type === "cracked") {
                    penguin.vy = JUMP_VELOCITY;
                    plat.broken = true;
                    playTone(180, "sawtooth", 0.1);
                }
            }
        });
    }

    // Camera scrolls when penguin goes above middle screen
    const targetCenter = canvas.height / 2;
    if (penguin.y < targetCenter) {
        const diff = targetCenter - penguin.y;
        penguin.y = targetCenter;
        scrollOffset += diff;

        // Scroll platforms, items, and hazards down
        platforms.forEach(plat => plat.y += diff);
        items.forEach(item => item.y += diff);
        hazards.forEach(h => {
            h.y += diff;
            h.startX += 0; // absolute coordinates don't drift
        });

        // Increase Height Score
        const heightScore = Math.floor(scrollOffset / 5);
        if (heightScore > score) {
            score = heightScore;
            updateUI();
        }
    }

    // Generate new platforms at the top
    platforms.forEach((plat, index) => {
        if (plat.y > canvas.height) {
            platforms.splice(index, 1);
            // Spawn a replacement at the top
            const topY = platforms.reduce((min, p) => p.y < min ? p.y : min, canvas.height);
            generatePlatformAbove(topY - 65);
        }
    });

    // Handle Item Collections
    items.forEach((item, index) => {
        if (item.y > canvas.height) {
            items.splice(index, 1);
            return;
        }

        const hitX = (penguin.x + penguin.w > item.x && penguin.x < item.x + item.w);
        const hitY = (penguin.y + penguin.h > item.y && penguin.y < item.y + item.h);

        if (hitX && hitY && !item.collected) {
            item.collected = true;
            if (item.type === "fish") {
                score += 10;
                playTone(523.25, "sine", 0.12, 659.25); // high chord
            } else {
                score += 5;
                playTone(587.33, "sine", 0.08, 698.46);
            }
            updateUI();
            items.splice(index, 1);
        }
    });

    // Update sleepy Polar Bears (Hazards)
    hazards.forEach((h, index) => {
        if (h.y > canvas.height) {
            hazards.splice(index, 1);
            return;
        }

        // Patrol walk on platform
        h.x += h.vx;
        if (h.x > h.startX + h.patrolWidth || h.x < h.startX) {
            h.vx *= -1;
        }

        // Collision with bear
        const hitX = (penguin.x + penguin.w - 4 > h.x && penguin.x + 4 < h.x + h.w);
        const hitY = (penguin.y + penguin.h > h.y && penguin.y < h.y + h.h);

        if (hitX && hitY) {
            // Bump down
            penguin.vy = 4; // slide down
            playTone(180, "triangle", 0.2);
        }
    });

    // Death check
    if (penguin.y > canvas.height) {
        triggerGameOver();
    }
}

function spawnSpringParticles(x, y) {
    // Visual springs
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    playTone(200, "sine", 0.5, 80);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_penguin-jump", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Rendering
function drawBackground() {
    let bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#083344");
    bg.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars/Snowflakes drift
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 15; i++) {
        let starX = (Math.sin(i * 123 + scrollOffset * 0.05) + 1.0) * 0.5 * canvas.width;
        let starY = (i * 35) % canvas.height;
        ctx.beginPath();
        ctx.arc(starX, starY, 1.5, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawPlatforms() {
    platforms.forEach(plat => {
        if (plat.broken && plat.type === "cracked") {
            // Fall animation for broken
            plat.y += 4;
            plat.fade -= 0.05;
        }
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, plat.fade);

        if (plat.type === "normal") {
            ctx.fillStyle = "#f1f5f9"; // White ice
            ctx.strokeStyle = "#cbd5e1";
        } else if (plat.type === "bouncy") {
            ctx.fillStyle = "#0284c7"; // Blue ice
            ctx.strokeStyle = "#0c4a6e";
        } else if (plat.type === "cracked") {
            ctx.fillStyle = "#94a3b8"; // Grey rock ice
            ctx.strokeStyle = "#475569";
        }

        // Draw rounded plat
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 5);
        ctx.fill();
        ctx.stroke();

        // Draw cracked lines if cracked
        if (plat.type === "cracked") {
            ctx.strokeStyle = "#1e293b";
            ctx.beginPath();
            ctx.moveTo(plat.x + 20, plat.y);
            ctx.lineTo(plat.x + 25, plat.y + PLATFORM_HEIGHT / 2);
            ctx.lineTo(plat.x + 35, plat.y + PLATFORM_HEIGHT);
            ctx.stroke();
        }

        ctx.restore();
    });
}

function drawItems() {
    items.forEach(item => {
        ctx.fillStyle = item.type === "fish" ? "#f97316" : "#38bdf8"; // Fish orange, snowflake cyan
        if (item.type === "fish") {
            // Cute fish shape
            ctx.beginPath();
            ctx.ellipse(item.x + item.w/2, item.y + item.h/2, item.w/2, item.h/3, 0, 0, Math.PI*2);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(item.x, item.y + item.h/2);
            ctx.lineTo(item.x - 4, item.y + item.h/2 - 5);
            ctx.lineTo(item.x - 4, item.y + item.h/2 + 5);
            ctx.closePath();
            ctx.fill();
        } else {
            // Snowflake asterisk
            ctx.strokeStyle = "#e0f2fe";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(item.x, item.y + item.h/2); ctx.lineTo(item.x + item.w, item.y + item.h/2);
            ctx.moveTo(item.x + item.w/2, item.y); ctx.lineTo(item.x + item.w/2, item.y + item.h);
            ctx.stroke();
        }
    });
}

function drawHazards() {
    hazards.forEach(h => {
        ctx.fillStyle = "#f8fafc"; // White polar bear
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        // Bear head circle
        ctx.beginPath();
        ctx.roundRect(h.x, h.y, h.w, h.h, 6);
        ctx.fill();
        ctx.stroke();
        // Ears
        ctx.beginPath();
        ctx.arc(h.x + 4, h.y, 4, 0, Math.PI * 2);
        ctx.arc(h.x + h.w - 4, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Nose dot
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(h.x + h.w/2, h.y + h.h - 6, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPenguin() {
    ctx.save();
    ctx.translate(penguin.x + penguin.w/2, penguin.y + penguin.h/2);
    if (penguin.dir === -1) {
        ctx.scale(-1, 1); // flip left
    }

    // Body (Black egg shape)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(0, 0, penguin.w/2, penguin.h/2, 0, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 3, penguin.w/3, penguin.h/3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orange beak
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(12, -2);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(3, -7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(4, -7, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Orange feet
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(-5, penguin.h/2 - 2, 4, 0, Math.PI * 2);
    ctx.arc(5, penguin.h/2 - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawPlatforms();
    drawItems();
    drawHazards();
    drawPenguin();

    updateGame();

    requestAnimationFrame(gameLoop);
}

// User Controls
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space" && gameState === STATE_MENU) {
        e.preventDefault();
        startGame();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Touch handles
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameState === STATE_MENU) {
        startGame();
        return;
    }
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (touchX < canvas.clientWidth / 2) {
        touchDirection = -1; // move left
    } else {
        touchDirection = 1; // move right
    }
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    touchDirection = 0;
});

function startGame() {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
}

document.getElementById("startBtn").addEventListener("click", () => {
    startGame();
});

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_PLAYING;
    initGame();
});

// Load high score
highScore = parseInt(localStorage.getItem("kgz_highscore_penguin-jump"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Run Core Loop
gameLoop();
