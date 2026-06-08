// Rocket Launch - KidsGameZone Game Logic

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
let currentRound = 1;

// Phase Types
const PHASE_LAUNCH = "LAUNCH";
const PHASE_FLIGHT = "FLIGHT";
const PHASE_TRANSITION = "TRANSITION";
const PHASE_WIN = "WIN";

let gamePhase = PHASE_LAUNCH;

// Fuel Meter variables
let fuelVal = 0;
let fuelSpeed = 0.06;
let fuelTimer = 0;

// Rocket Flight variables
const ROCKET_W = 28;
const ROCKET_H = 50;
let rocket = {
    x: canvas.width / 2 - ROCKET_W / 2,
    y: 380,
    w: ROCKET_W,
    h: ROCKET_H,
    vx: 0,
    speedMultiplier: 1.0
};

// Asteroids
let asteroids = [];
let asteroidSpawnTimer = 0;
let flightTimer = 300; // 5 seconds at 60fps

// Transition
let destinationPlanet = null;
let planetY = -150;
let planetScale = 1.0;
let transitionTimer = 0;

// Stars background
let stars = [];
for (let i = 0; i < 30; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 1,
        speed: Math.random() * 2 + 1
    });
}

// Planets list
const PLANETS = [
    { name: "Mars", color: "#ef4444", features: "craters", label: "Mars (Rnd 1/5)" },
    { name: "Jupiter", color: "#fb923c", features: "stripes", label: "Jupiter (Rnd 2/5)" },
    { name: "Saturn", color: "#fef08a", features: "rings", label: "Saturn (Rnd 3/5)" },
    { name: "Neptune", color: "#38bdf8", features: "storms", label: "Neptune (Rnd 4/5)" },
    { name: "Kepler-22b", color: "#34d399", features: "clouds", label: "Kepler-22b (Rnd 5/5)" }
];

// Controls
let keys = {};
let touchDirection = 0;

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
    lives = 3;
    currentRound = 1;
    gamePhase = PHASE_LAUNCH;
    fuelTimer = 0;
    particles = [];
    touchDirection = 0;
    updateUI();
    setupLaunchPhase();
}

function setupLaunchPhase() {
    gamePhase = PHASE_LAUNCH;
    rocket.x = canvas.width / 2 - ROCKET_W / 2;
    rocket.y = 380;
    rocket.vx = 0;
    asteroids = [];
    updateUI();
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    let heartStr = "";
    for (let i = 0; i < lives; i++) heartStr += "❤️";
    if (heartStr === "") heartStr = "💀";
    document.getElementById("livesVal").textContent = heartStr;
    
    if (currentRound <= 5) {
        document.getElementById("destPlanetVal").textContent = PLANETS[currentRound - 1].label;
    }
}

class Asteroid {
    constructor() {
        this.w = Math.random() * 25 + 18;
        this.h = this.w;
        this.x = Math.random() * (canvas.width - this.w);
        this.y = -50;
        this.vy = Math.random() * 3 + 4 + (currentRound * 0.5);
        this.vx = (Math.random() - 0.5) * 1.5;
        this.angle = Math.random() * Math.PI;
        this.spin = (Math.random() - 0.5) * 0.05;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.spin;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.angle);
        ctx.fillStyle = "#64748b"; // rocky grey
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2.5;
        // Jagged circle
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let offsetAngle = (i * Math.PI) / 4;
            let offsetRadius = this.w / 2 + (Math.sin(i * 12 + this.angle) * 3);
            ctx.lineTo(Math.cos(offsetAngle) * offsetRadius, Math.sin(offsetAngle) * offsetRadius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Spark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2;
        this.alpha = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
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

function handleLaunch() {
    if (gameState !== STATE_PLAYING || gamePhase !== PHASE_LAUNCH) return;

    // Check fuelVal
    if (fuelVal >= 60 && fuelVal <= 80) {
        // PERFECT!
        score += 100;
        rocket.speedMultiplier = 1.4;
        playTone(392, "sine", 0.15, 783.99); // high perfect chime
        startFlight("PERFECT LAUNCH! ☄️");
    } else if ((fuelVal >= 40 && fuelVal < 60) || (fuelVal > 80 && fuelVal <= 90)) {
        // GOOD!
        score += 50;
        rocket.speedMultiplier = 1.0;
        playTone(330, "sine", 0.15, 523.25);
        startFlight("GOOD LAUNCH! 👍");
    } else {
        // CRASH / FAIL
        lives--;
        playTone(150, "sawtooth", 0.4, 70);
        updateUI();
        
        // Spawn crash explosion
        for (let i = 0; i < 15; i++) {
            particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H/2, "#ef4444"));
            particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H/2, "#f97316"));
        }

        if (lives <= 0) {
            triggerGameOver("You crashed on the launchpad!");
        } else {
            // Respawn
            setupLaunchPhase();
        }
    }
}

function startFlight(bannerText) {
    gamePhase = PHASE_FLIGHT;
    flightTimer = 300; // 5 seconds
    asteroids = [];
    
    // Spawn launch smoke
    for (let i = 0; i < 20; i++) {
        particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H, "#94a3b8"));
    }
    
    // Banner indicator
    ctx.font = "bold 20px Nunito";
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    // Background Stars scroll down
    stars.forEach(star => {
        let speed = star.speed;
        if (gamePhase === PHASE_FLIGHT) speed *= 3 * rocket.speedMultiplier;
        star.y += speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    if (gamePhase === PHASE_LAUNCH) {
        // Oscillate fuel indicator
        fuelTimer += fuelSpeed;
        fuelVal = 50 + Math.sin(fuelTimer) * 50;
    } else if (gamePhase === PHASE_FLIGHT) {
        // Flight mechanics
        flightTimer--;

        // Horizontal steer
        if (keys["ArrowLeft"] || keys["KeyA"] || touchDirection === -1) {
            rocket.vx = -4.5;
        } else if (keys["ArrowRight"] || keys["KeyD"] || touchDirection === 1) {
            rocket.vx = 4.5;
        } else {
            rocket.vx *= 0.85;
        }

        rocket.x += rocket.vx;

        // Contain boundaries
        if (rocket.x < 10) rocket.x = 10;
        if (rocket.x > canvas.width - ROCKET_W - 10) rocket.x = canvas.width - ROCKET_W - 10;

        // Thrust flame particles
        if (Math.random() < 0.4) {
            particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H, "#f97316"));
        }

        // Spawn Asteroids
        asteroidSpawnTimer++;
        if (asteroidSpawnTimer > Math.max(12, 35 - currentRound * 4)) {
            asteroids.push(new Asteroid());
            asteroidSpawnTimer = 0;
        }

        // Update Asteroids
        asteroids.forEach((ast, index) => {
            ast.update();
            // Collision test
            const hitX = (rocket.x < ast.x + ast.w && rocket.x + ROCKET_W > ast.x);
            const hitY = (rocket.y < ast.y + ast.h && rocket.y + ROCKET_H > ast.y);
            if (hitX && hitY) {
                // Collided! Fails flight
                asteroids.splice(index, 1);
                lives--;
                playTone(150, "sawtooth", 0.4, 70);
                updateUI();

                // Explode particles
                for (let i = 0; i < 15; i++) {
                    particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H/2, "#ef4444"));
                    particles.push(new Spark(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H/2, "#f97316"));
                }

                if (lives <= 0) {
                    triggerGameOver("An asteroid struck your rocket!");
                } else {
                    setupLaunchPhase();
                }
                return;
            }

            // Remove off-screen
            if (ast.y > canvas.height + 50) {
                asteroids.splice(index, 1);
                score += 5; // points for dodging
                updateUI();
            }
        });

        // Arrival!
        if (flightTimer <= 0) {
            startTransition();
        }
    } else if (gamePhase === PHASE_TRANSITION) {
        // Rocket flies center and goes up towards the planet
        const targetX = canvas.width / 2 - ROCKET_W / 2;
        rocket.x += (targetX - rocket.x) * 0.1;
        rocket.y -= 4; // lift up off screen

        planetY += (canvas.height/2 - 100 - planetY) * 0.05;

        transitionTimer--;
        if (transitionTimer <= 0) {
            // Arrived!
            score += 200;
            currentRound++;
            updateUI();

            if (currentRound > 5) {
                triggerWin();
            } else {
                setupLaunchPhase();
            }
        }
    }
}

function startTransition() {
    gamePhase = PHASE_TRANSITION;
    transitionTimer = 180; // 3 seconds
    planetY = -150;
    destinationPlanet = PLANETS[currentRound - 1];
    playTone(392, "sine", 0.2);
    setTimeout(() => playTone(523, "sine", 0.3), 150);
}

function triggerGameOver(msg) {
    gameState = STATE_GAMEOVER;
    playTone(180, "sawtooth", 0.5, 90);
    
    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_rocket-launch", highScore);
    
    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("failMessage").textContent = msg;
    document.getElementById("gameOverOverlay").classList.add("active");
}

function triggerWin() {
    gameState = STATE_GAMEOVER;
    playTone(523.25, "sine", 0.2);
    setTimeout(() => playTone(659.25, "sine", 0.2), 100);
    setTimeout(() => playTone(783.99, "sine", 0.2), 200);
    setTimeout(() => playTone(1046.50, "sine", 0.5), 300);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_rocket-launch", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("failMessage").textContent = "CONGRATULATIONS! You completed all 5 Space Missions successfully!";
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Rendering
function drawStars() {
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.size / 2.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });
}

function drawFuelMeter() {
    const meterX = 350;
    const meterY = 150;
    const meterW = 24;
    const meterH = 200;

    // Background block
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(meterX, meterY, meterW, meterH);

    // Zones
    // Red (top: 0 to 40 px -> 80% to 100% fuel)
    ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
    ctx.fillRect(meterX, meterY, meterW, 40); // 80-100%
    ctx.fillRect(meterX, meterY + 160, meterW, 40); // 0-20%

    // Yellow
    ctx.fillStyle = "rgba(234, 179, 8, 0.4)";
    ctx.fillRect(meterX, meterY + 40, meterW, 40); // 60-80%
    ctx.fillRect(meterX, meterY + 120, meterW, 40); // 20-40%

    // Green (Perfect center: 40% to 60% fuel, or let's match zones: Green 60-80%, Yellow 40-60 & 80-90, Red <40 or >90)
    // Wait, let's maps 0-100 fuel value to meter height (0 = bottom, 100 = top)
    // Map values:
    // Green: 60-80% (top offset: 20% to 40% from top, which is meterY + 40 to meterY + 80)
    // Yellow: 40-60% (meterY + 80 to meterY + 120) & 80-90% (meterY + 20 to meterY + 40)
    // Red: <40% (meterY + 120 to meterY + 200) & >90% (meterY + 0 to meterY + 20)
    ctx.fillStyle = "rgba(239, 68, 68, 0.55)"; // Red bottom (0-40%)
    ctx.fillRect(meterX, meterY + 120, meterW, 80);
    ctx.fillStyle = "rgba(234, 179, 8, 0.55)"; // Yellow (40-60%)
    ctx.fillRect(meterX, meterY + 80, meterW, 40);
    ctx.fillStyle = "rgba(74, 222, 128, 0.55)"; // Green (60-80%)
    ctx.fillRect(meterX, meterY + 40, meterW, 40);
    ctx.fillStyle = "rgba(234, 179, 8, 0.55)"; // Yellow (80-90%)
    ctx.fillRect(meterX, meterY + 20, meterW, 20);
    ctx.fillStyle = "rgba(239, 68, 68, 0.55)"; // Red top (90-100%)
    ctx.fillRect(meterX, meterY, meterW, 20);

    // Frame
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.strokeRect(meterX, meterY, meterW, meterH);

    // Fuel indicator arrow
    const pointerY = meterY + meterH - (fuelVal / 100 * meterH);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(meterX - 10, pointerY - 6);
    ctx.lineTo(meterX - 2, pointerY);
    ctx.lineTo(meterX - 10, pointerY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text tag
    ctx.font = "bold 14px Fredoka";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("FUEL", meterX - 5, meterY - 10);
}

function drawRocket() {
    ctx.save();
    ctx.translate(rocket.x + ROCKET_W/2, rocket.y + ROCKET_H/2);

    // Draw fire flame if flight or launch perfect
    if (gamePhase === PHASE_FLIGHT || gamePhase === PHASE_TRANSITION) {
        ctx.fillStyle = Math.random() < 0.5 ? "#f97316" : "#ef4444";
        ctx.beginPath();
        ctx.moveTo(-6, ROCKET_H/2);
        ctx.lineTo(0, ROCKET_H/2 + 18 + Math.random() * 8);
        ctx.lineTo(6, ROCKET_H/2);
        ctx.closePath();
        ctx.fill();
    }

    // Rocket body
    ctx.fillStyle = "#e2e8f0"; // White-grey metal
    ctx.beginPath();
    ctx.moveTo(0, -ROCKET_H/2); // nose cone
    ctx.lineTo(ROCKET_W/2, -ROCKET_H/4);
    ctx.lineTo(ROCKET_W/2, ROCKET_H/2);
    ctx.lineTo(-ROCKET_W/2, ROCKET_H/2);
    ctx.lineTo(-ROCKET_W/2, -ROCKET_H/4);
    ctx.closePath();
    ctx.fill();

    // Red fins/nose tip
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    // Nose tip cone
    ctx.moveTo(0, -ROCKET_H/2);
    ctx.lineTo(ROCKET_W/3, -ROCKET_H/3);
    ctx.lineTo(-ROCKET_W/3, -ROCKET_H/3);
    ctx.closePath();
    ctx.fill();

    // Left fin
    ctx.beginPath();
    ctx.moveTo(-ROCKET_W/2, ROCKET_H/4);
    ctx.lineTo(-ROCKET_W/2 - 8, ROCKET_H/2);
    ctx.lineTo(-ROCKET_W/2, ROCKET_H/2);
    ctx.closePath();
    ctx.fill();

    // Right fin
    ctx.beginPath();
    ctx.moveTo(ROCKET_W/2, ROCKET_H/4);
    ctx.lineTo(ROCKET_W/2 + 8, ROCKET_H/2);
    ctx.lineTo(ROCKET_W/2, ROCKET_H/2);
    ctx.closePath();
    ctx.fill();

    // Porthole window
    ctx.fillStyle = "#38bdf8";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function drawLaunchpad() {
    // Ground platform
    ctx.fillStyle = "#334155";
    ctx.fillRect(50, 430, canvas.width - 100, 30);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 430, canvas.width - 100, 30);

    // Gantry tower support
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(110, 430);
    ctx.lineTo(110, 320);
    ctx.lineTo(170, 350);
    ctx.moveTo(110, 360);
    ctx.lineTo(170, 380);
    ctx.stroke();
}

function drawDestinationPlanet() {
    if (!destinationPlanet) return;
    
    ctx.save();
    ctx.translate(canvas.width / 2, planetY);

    // Draw rings if Saturn
    if (destinationPlanet.name === "Saturn") {
        ctx.strokeStyle = "rgba(254, 240, 138, 0.4)";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, 70, 20, -Math.PI / 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw main body
    ctx.fillStyle = destinationPlanet.color;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();

    // Details
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    if (destinationPlanet.features === "stripes") {
        ctx.fillRect(-45, -20, 90, 8);
        ctx.fillRect(-45, 10, 90, 10);
    } else if (destinationPlanet.features === "craters") {
        ctx.beginPath();
        ctx.arc(-20, -15, 8, 0, Math.PI * 2);
        ctx.arc(15, 15, 10, 0, Math.PI * 2);
        ctx.arc(10, -20, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars();
    particles.forEach(p => p.draw());

    if (gamePhase === PHASE_LAUNCH) {
        drawLaunchpad();
        drawFuelMeter();
        drawRocket();
    } else if (gamePhase === PHASE_FLIGHT) {
        drawRocket();
        asteroids.forEach(ast => ast.draw());
        
        // Draw flight timer overlay
        ctx.font = "bold 16px Nunito";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Gliding safely: ${(flightTimer / 60).toFixed(1)}s`, 20, 80);
    } else if (gamePhase === PHASE_TRANSITION) {
        drawDestinationPlanet();
        drawRocket();

        // Print text banner
        ctx.font = "bold 24px Fredoka";
        ctx.fillStyle = "#eab308";
        ctx.textAlign = "center";
        ctx.fillText(`Arrived at ${destinationPlanet.name}!`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.font = "bold 16px Nunito";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("+200 Planet Bonus", canvas.width / 2, canvas.height / 2 + 80);
        ctx.textAlign = "left"; // reset
    }

    updateGame();
    requestAnimationFrame(gameLoop);
}

// Controls handlers
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") {
        e.preventDefault();
        if (gameState === STATE_MENU) {
            gameState = STATE_PLAYING;
            document.getElementById("startOverlay").classList.remove("active");
            initGame();
        } else if (gamePhase === PHASE_LAUNCH) {
            handleLaunch();
        }
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameState === STATE_MENU) {
        gameState = STATE_PLAYING;
        document.getElementById("startOverlay").classList.remove("active");
        initGame();
        return;
    }

    if (gamePhase === PHASE_LAUNCH) {
        handleLaunch();
    } else if (gamePhase === PHASE_FLIGHT) {
        const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        if (touchX < canvas.clientWidth / 2) {
            touchDirection = -1;
        } else {
            touchDirection = 1;
        }
    }
}, { passive: false });

canvas.addEventListener("touchend", () => {
    touchDirection = 0;
});

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

// Load High Score
highScore = parseInt(localStorage.getItem("kgz_highscore_rocket-launch"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start Loop
gameLoop();
