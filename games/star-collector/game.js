// Star Collector - KidsGameZone Game Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;
let lives = 5;

// Ship Catcher
const SHIP_Y = 410;
const BASE_SHIP_W = 60;
const SHIP_H = 20;

let ship = {
    x: canvas.width / 2 - BASE_SHIP_W / 2,
    y: SHIP_Y,
    w: BASE_SHIP_W,
    h: SHIP_H,
    speed: 6.5
};

// Powerups
let magnetTimer = 0; // in frames (60fps)

// Stars array
let starsList = [];
let starSpawnTimer = 0;

// Keys
let keys = {};

// Background stars
let bgStars = [];
for (let i = 0; i < 25; i++) {
    bgStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI
    });
}

// Particles
let particles = [];

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
    lives = 5;
    starsList = [];
    particles = [];
    magnetTimer = 0;
    starSpawnTimer = 0;
    ship.w = BASE_SHIP_W;
    ship.x = canvas.width / 2 - ship.w / 2;
    updateUI();
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    let heartStr = "";
    for (let i = 0; i < lives; i++) heartStr += "❤️";
    if (heartStr === "") heartStr = "💀";
    document.getElementById("livesVal").textContent = heartStr;
}

class FallStar {
    constructor() {
        this.w = 20;
        this.h = 20;
        this.x = Math.random() * (canvas.width - this.w);
        this.y = -30;
        this.vy = 2.0 + Math.min(score * 0.04, 4.5); // speed scales
        this.angle = Math.random() * Math.PI;
        this.spin = (Math.random() - 0.5) * 0.06;
        
        // Randomize Type
        const roll = Math.random();
        if (roll < 0.70) {
            this.type = "normal"; // Yellow star (+10)
            this.color = "#fef08a";
        } else if (roll < 0.85) {
            this.type = "gold"; // Shiny gold (+50)
            this.color = "#fbbf24";
        } else if (roll < 0.93) {
            this.type = "rainbow"; // Cycling colors (+100)
            this.color = "rainbow";
        } else {
            this.type = "magnet"; // Wide catcher powerup
            this.color = "#38bdf8";
        }
    }

    update() {
        this.y += this.vy;
        this.angle += this.spin;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.angle);

        let finalColor = this.color;
        if (this.color === "rainbow") {
            // cycle colors
            finalColor = `hsl(${Math.floor(Date.now() * 0.3) % 360}, 90%, 65%)`;
        }

        if (this.type === "magnet") {
            // Draw magnet shape
            ctx.fillStyle = "#ef4444"; // red magnet ends
            ctx.fillRect(-8, -8, 6, 16);
            ctx.fillRect(2, -8, 6, 16);
            ctx.fillStyle = "#38bdf8"; // blue curve top
            ctx.fillRect(-8, -8, 16, 5);
        } else {
            // Draw star shape
            ctx.fillStyle = finalColor;
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = 11;
            const innerRadius = 5;
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;

            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
                let x = Math.cos(rot) * outerRadius;
                let y = Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = Math.cos(rot) * innerRadius;
                y = Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(0, -outerRadius);
            ctx.closePath();
            ctx.fill();

            // Gold aura
            if (this.type === "gold" || this.type === "rainbow") {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

class CatchSpark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.size = Math.random() * 3.5 + 1.5;
        this.alpha = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.025;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    // Movement controls (Keyboard)
    if (keys["ArrowLeft"] || keys["KeyA"]) {
        ship.x -= ship.speed;
    } else if (keys["ArrowRight"] || keys["KeyD"]) {
        ship.x += ship.speed;
    }

    // Keep ship bounded
    if (ship.x < 10) ship.x = 10;
    if (ship.x > canvas.width - ship.w - 10) ship.x = canvas.width - ship.w - 10;

    // Magnet timer tick
    if (magnetTimer > 0) {
        magnetTimer--;
        ship.w = BASE_SHIP_W * 2; // double size
        document.getElementById("magnetTimerContainer").style.opacity = "1";
        document.getElementById("magnetTimerVal").textContent = (magnetTimer / 60).toFixed(1) + "s";
    } else {
        ship.w = BASE_SHIP_W;
        document.getElementById("magnetTimerContainer").style.opacity = "0";
    }

    // Spawning falling stars
    starSpawnTimer++;
    if (starSpawnTimer > Math.max(25, 50 - Math.floor(score * 0.05))) {
        starsList.push(new FallStar());
        starSpawnTimer = 0;
    }

    // Update Stars
    starsList.forEach((star, index) => {
        star.update();

        // Catcher collision check
        const overlapX = (star.x + star.w > ship.x && star.x < ship.x + ship.w);
        const overlapY = (star.y + star.h >= ship.y && star.y <= ship.y + ship.h);

        if (overlapX && overlapY) {
            // CAUGHT!
            starsList.splice(index, 1);

            let sparkColor = star.color === "rainbow" ? "#a855f7" : star.color;
            if (star.type === "magnet") sparkColor = "#38bdf8";

            // Spawn sparks
            for (let i = 0; i < 8; i++) {
                particles.push(new CatchSpark(star.x + star.w/2, star.y + star.h/2, sparkColor));
            }

            // Apply points
            if (star.type === "normal") {
                score += 10;
                playTone(440, "sine", 0.08, 660);
            } else if (star.type === "gold") {
                score += 50;
                playTone(523.25, "sine", 0.12, 783.99); // C5 -> G5
            } else if (star.type === "rainbow") {
                score += 100;
                playTone(587.33, "sine", 0.15, 880);
            } else if (star.type === "magnet") {
                magnetTimer = 300; // 5 seconds
                playTone(392, "sine", 0.1);
                setTimeout(() => playTone(523.25, "sine", 0.12), 60);
                setTimeout(() => playTone(659.25, "sine", 0.15), 120);
            }
            updateUI();
            return;
        }

        // Missed bottom check
        if (star.y > canvas.height) {
            starsList.splice(index, 1);
            if (star.type !== "magnet") {
                lives--;
                playTone(180, "sawtooth", 0.3, 80); // damage sliding low
                updateUI();

                if (lives <= 0) {
                    triggerGameOver();
                }
            }
        }
    });

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    playTone(150, "sawtooth", 0.5, 90);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_star-collector", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Rendering
function drawBackground() {
    // Stars twinkling
    ctx.fillStyle = "#ffffff";
    bgStars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.abs(Math.sin(Date.now() * 0.002 + star.twinkle)) * 0.6;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x + ship.w/2, ship.y + ship.h/2);

    // Glowing aura if magnet is active
    if (magnetTimer > 0) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.beginPath();
        ctx.ellipse(0, 0, ship.w/2 + 8, ship.h + 10, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw Spaceship catcher
    ctx.fillStyle = "#cbd5e1"; // metallic silver
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-ship.w/2, -ship.h/2, ship.w, ship.h, 6);
    ctx.fill();
    ctx.stroke();

    // Cyan force field collection net on top
    ctx.fillStyle = "rgba(34, 211, 238, 0.4)";
    ctx.fillRect(-ship.w/2 + 6, -ship.h/2 - 4, ship.w - 12, 4);

    // Thruster engine glow
    ctx.fillStyle = Math.random() < 0.5 ? "#f97316" : "#ef4444";
    ctx.fillRect(-12, ship.h/2, 6, 5);
    ctx.fillRect(6, ship.h/2, 6, 5);

    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
        drawShip();
        starsList.forEach(star => star.draw());
        particles.forEach(p => p.draw());
    }

    updateGame();
    requestAnimationFrame(gameLoop);
}

// Controls
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

// Dragging
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameState === STATE_MENU) {
        startGame();
        return;
    }
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    // Map center of touch directly to center of ship
    ship.x = touchX - ship.w / 2;
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    ship.x = touchX - ship.w / 2;
}, { passive: false });

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

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_star-collector"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start Loop
gameLoop();
