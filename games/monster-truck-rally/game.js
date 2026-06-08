// Monster Truck Rally - KidsGameZone Game Logic

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
let timeElapsed = 0; // count up timer

let trackName = "Muddy Hills";
let trackColor = "#854d0e"; // Brown

// Physics constants
const GRAVITY = 0.4;
const TRUCK_DRAW_X = 150; // Truck visual center

let truck = {
    x: 100, // World X coordinate
    y: 100, // World Y coordinate
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    isAirborne: false,
    w: 52,
    h: 30,
    wheelRadius: 12
};

// Track objects (World coordinates)
let cars = [];
let boostPads = [];
let mudPits = [];

// Controls state
let keys = {};
let activeButtons = {};

// Particles
let particles = [];

// Audio Synthesizer
let audioCtx = null;
let engineOsc = null;
let engineGain = null;

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

function startEngineSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        engineOsc = audioCtx.createOscillator();
        engineGain = audioCtx.createGain();
        engineOsc.type = "sawtooth";
        engineOsc.frequency.setValueAtTime(45, audioCtx.currentTime);
        engineGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        engineOsc.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
    } catch(e){}
}

function stopEngineSound() {
    try {
        if (engineOsc) {
            engineOsc.stop();
            engineOsc = null;
        }
    } catch(e){}
}

function updateEnginePitch() {
    if (!engineOsc) return;
    // Map speed vx to pitch
    const pitch = 45 + Math.min(Math.abs(truck.vx) * 12, 100);
    engineOsc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
}

// Terrain elevation formulas
function getGroundY(worldX) {
    if (trackName === "Muddy Hills") {
        return Math.sin(worldX * 0.004) * 60 + Math.sin(worldX * 0.01) * 20 + 230;
    } else if (trackName === "Desert Dunes") {
        return Math.sin(worldX * 0.003) * 75 + Math.cos(worldX * 0.007) * 30 + 220;
    } else {
        // Snow Mountain (steeper hills)
        return Math.sin(worldX * 0.005) * 55 + Math.cos(worldX * 0.012) * 30 + Math.sin(worldX * 0.001) * 80 + 220;
    }
}

function selectTrack(name, color) {
    trackName = name;
    trackColor = color;
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
}

function initGame() {
    score = 0;
    lives = 3;
    timeElapsed = 0;
    
    truck.x = 100;
    truck.y = getGroundY(100) - 40;
    truck.vx = 0;
    truck.vy = 0;
    truck.angle = 0;
    truck.spin = 0;
    truck.isAirborne = false;

    // Generate elements along 15,000 unit track length (1500 meters)
    cars = [];
    boostPads = [];
    mudPits = [];
    particles = [];

    // Squashable Cars every ~250m
    for (let x = 2000; x < 14000; x += 1800) {
        cars.push({
            x: x + (Math.random() - 0.5) * 400,
            y: 0, // set dynamically in ground loop
            w: 42,
            h: 16,
            squashed: false
        });
    }

    // Boost Pads
    for (let x = 1200; x < 14000; x += 2200) {
        boostPads.push({ x: x, w: 45 });
    }

    // Mud Pits
    for (let x = 3000; x < 14000; x += 3500) {
        mudPits.push({ x: x, w: 100 });
    }

    stopEngineSound();
    startEngineSound();
    updateUI();
}

function updateUI() {
    document.getElementById("timeVal").textContent = timeElapsed.toFixed(1) + "s";
    
    const distanceMeters = Math.min(1500, Math.floor(truck.x / 10));
    document.getElementById("distVal").textContent = `${distanceMeters}m / 1500m`;

    let heartStr = "";
    for (let i = 0; i < lives; i++) heartStr += "❤️";
    if (heartStr === "") heartStr = "💀";
    document.getElementById("livesVal").textContent = heartStr;
}

class CrunchSpark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 5 - 1;
        this.size = Math.random() * 4 + 2;
        this.alpha = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.25; // gravity
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

function handleCrash() {
    lives--;
    playTone(150, "sawtooth", 0.4, 75);
    updateUI();

    // Spawn explosion debris
    for (let i = 0; i < 15; i++) {
        particles.push(new CrunchSpark(TRUCK_DRAW_X, truck.y, "#ea580c"));
        particles.push(new CrunchSpark(TRUCK_DRAW_X, truck.y, "#ef4444"));
    }

    if (lives <= 0) {
        triggerGameOver(false);
    } else {
        // Reset truck slightly back, upright
        truck.x = Math.max(100, truck.x - 200);
        truck.y = getGroundY(truck.x) - 50;
        truck.vx = 0;
        truck.vy = 0;
        truck.angle = 0;
        truck.spin = 0;
    }
}

function triggerGameOver(finished = true) {
    gameState = STATE_GAMEOVER;
    stopEngineSound();
    
    if (finished) {
        // Win!
        playTone(392, "sine", 0.15);
        setTimeout(() => playTone(523.25, "sine", 0.3), 100);
        
        // Score: time taken penalty + squash bonuses
        const timeBonus = Math.max(0, 10000 - Math.floor(timeElapsed * 100));
        score += timeBonus;
        document.getElementById("endTitle").textContent = "Race Completed! 🏆";
        document.getElementById("failMessage").textContent = `You finished the rally in ${timeElapsed.toFixed(1)}s!`;
    } else {
        // Lose
        playTone(120, "sawtooth", 0.5, 60);
        document.getElementById("endTitle").textContent = "Rally Wrecked! 💥";
        document.getElementById("failMessage").textContent = "Your monster truck collapsed or crashed!";
    }

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_monster-truck-rally", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("gameOverOverlay").classList.add("active");
}

function checkGroundCollisions() {
    const currentGroundY = getGroundY(truck.x);
    
    // Truck Y offsets from center chassis to wheel centers
    const chassisBottomY = truck.y + 12;

    if (chassisBottomY >= currentGroundY) {
        // On Ground
        if (truck.isAirborne) {
            // Landed check: was truck flipped?
            const wrappedAngle = Math.abs(truck.angle % (Math.PI * 2));
            if (wrappedAngle > 1.25 && wrappedAngle < Math.PI * 2 - 1.25) {
                // Upside down landing -> CRASH!
                handleCrash();
                return;
            }
            truck.isAirborne = false;
        }

        // Align truck angle with the ground slope
        const aheadGroundY = getGroundY(truck.x + 10);
        const slope = Math.atan2(aheadGroundY - currentGroundY, 10);
        
        // Smoothly interpolate truck angle to slope
        truck.angle += (slope - truck.angle) * 0.2;

        truck.y = currentGroundY - 12;
        truck.vy = 0;
        
        // Apply normal physics friction
        truck.vx *= 0.985;
    } else {
        // Airborne
        truck.isAirborne = true;
        truck.vy += GRAVITY;
        truck.y += truck.vy;
    }
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    timeElapsed += 1 / 60; // elapsed seconds
    updateUI();

    // Check Finish Line (15,000 units / 1500m)
    if (truck.x >= 15000) {
        triggerGameOver(true);
        return;
    }

    // Horizontal controls
    const isForward = keys["ArrowRight"] || keys["KeyD"] || activeButtons["forward"];
    const isReverse = keys["ArrowLeft"] || keys["KeyA"] || activeButtons["reverse"];

    // Speed limits inside mud pits
    let inMud = false;
    mudPits.forEach(pit => {
        if (truck.x >= pit.x && truck.x <= pit.x + pit.w) {
            inMud = true;
        }
    });

    if (isForward) {
        truck.vx += inMud ? 0.08 : 0.22;
    } else if (isReverse) {
        truck.vx -= inMud ? 0.08 : 0.15;
    }

    // Limit maximum speed
    const maxSpeed = inMud ? 2.2 : 9.5;
    if (truck.vx > maxSpeed) truck.vx = maxSpeed;
    if (truck.vx < -maxSpeed / 2) truck.vx = -maxSpeed / 2;

    // Apply speed X
    truck.x += truck.vx;

    // Boost Pad check
    boostPads.forEach(pad => {
        if (truck.x >= pad.x && truck.x <= pad.x + pad.w) {
            truck.vx = 14; // massive push forward
            playTone(450, "sine", 0.18, 900);
            
            // spawn golden sparks
            for (let i = 0; i < 5; i++) {
                particles.push(new CrunchSpark(TRUCK_DRAW_X, truck.y + 10, "#fbbf24"));
            }
        }
    });

    // Squashable Cars check
    cars.forEach(car => {
        car.y = getGroundY(car.x) - car.h;
        if (!car.squashed) {
            const overlapX = (truck.x + truck.w/2 > car.x && truck.x - truck.w/2 < car.x + car.w);
            const overlapY = (truck.y + truck.h/2 >= car.y);
            if (overlapX && overlapY) {
                car.squashed = true;
                score += 25;
                playTone(120, "sawtooth", 0.12);
                
                // Spawn crunch metal sparks
                for (let i = 0; i < 8; i++) {
                    particles.push(new CrunchSpark(TRUCK_DRAW_X + (car.x - truck.x), car.y, "#94a3b8"));
                }
            }
        }
    });

    // Rotation tilting controls (Airborne / landing adjustments)
    const isTiltLeft = keys["ArrowUp"] || keys["KeyW"] || activeButtons["tiltL"];
    const isTiltRight = keys["ArrowDown"] || keys["KeyS"] || activeButtons["tiltR"];

    if (isTiltLeft) {
        truck.spin = -0.055;
    } else if (isTiltRight) {
        truck.spin = 0.055;
    } else {
        truck.spin = 0;
    }

    // Apply spin
    truck.angle += truck.spin;

    // Ground check & gravity
    checkGroundCollisions();

    // Engine hum modulation
    updateEnginePitch();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Rendering
function drawBackground() {
    // Gradient sky
    let bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (trackName === "Muddy Hills") {
        bg.addColorStop(0, "#0c4a6e"); // Forest blue
        bg.addColorStop(1, "#0284c7");
    } else if (trackName === "Desert Dunes") {
        bg.addColorStop(0, "#7c2d12"); // Orange sunset
        bg.addColorStop(1, "#c2410c");
    } else {
        bg.addColorStop(0, "#0f172a"); // Arctic twilight
        bg.addColorStop(1, "#312e81");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun / Moon
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(380, 70, 40, 0, Math.PI*2);
    ctx.fill();
}

function drawTerrain() {
    ctx.fillStyle = trackColor;
    ctx.beginPath();

    // Begin path on left of canvas
    ctx.moveTo(0, canvas.height);
    
    // Draw ground line relative to camera scroll
    for (let screenX = 0; screenX <= canvas.width; screenX += 5) {
        const worldX = truck.x - TRUCK_DRAW_X + screenX;
        const groundY = getGroundY(worldX);
        ctx.lineTo(screenX, groundY);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Draw mud pit textures
    mudPits.forEach(pit => {
        const screenL = pit.x - (truck.x - TRUCK_DRAW_X);
        const screenR = screenL + pit.w;
        
        if (screenR > 0 && screenL < canvas.width) {
            ctx.fillStyle = "#166534"; // green mud
            ctx.beginPath();
            ctx.moveTo(Math.max(0, screenL), canvas.height);
            for (let x = Math.max(0, screenL); x <= Math.min(canvas.width, screenR); x += 5) {
                const worldX = truck.x - TRUCK_DRAW_X + x;
                ctx.lineTo(x, getGroundY(worldX) + 4);
            }
            ctx.lineTo(Math.min(canvas.width, screenR), canvas.height);
            ctx.closePath();
            ctx.fill();
        }
    });

    // Draw Boost Pads
    boostPads.forEach(pad => {
        const screenL = pad.x - (truck.x - TRUCK_DRAW_X);
        if (screenL + pad.w > 0 && screenL < canvas.width) {
            ctx.fillStyle = "#eab308"; // Golden boost arrow
            ctx.beginPath();
            const gy = getGroundY(pad.x);
            ctx.moveTo(screenL, gy - 2);
            ctx.lineTo(screenL + pad.w, gy - 2);
            ctx.lineTo(screenL + pad.w / 2, gy - 8);
            ctx.closePath();
            ctx.fill();
        }
    });

    // Draw Cars
    cars.forEach(car => {
        const screenL = car.x - (truck.x - TRUCK_DRAW_X);
        if (screenL + car.w > 0 && screenL < canvas.width) {
            ctx.fillStyle = car.squashed ? "#475569" : "#dc2626"; // squashed grey vs bright red
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (car.squashed) {
                ctx.roundRect(screenL, car.y + 11, car.w, 5, 2);
            } else {
                ctx.roundRect(screenL, car.y, car.w, car.h, 4);
            }
            ctx.fill();
            ctx.stroke();

            // Wheels
            ctx.fillStyle = "#000000";
            if (!car.squashed) {
                ctx.beginPath();
                ctx.arc(screenL + 8, car.y + car.h, 4, 0, Math.PI*2);
                ctx.arc(screenL + car.w - 8, car.y + car.h, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
    });

    // Finish Line flag (1500m)
    const finishL = 15000 - (truck.x - TRUCK_DRAW_X);
    if (finishL + 30 > 0 && finishL < canvas.width) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(finishL, getGroundY(15000) - 80, 4, 80);
        // Checkered flag banner
        ctx.fillStyle = "#000000";
        ctx.fillRect(finishL + 4, getGroundY(15000) - 80, 24, 16);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(finishL + 4, getGroundY(15000) - 80, 12, 8);
        ctx.fillRect(finishL + 16, getGroundY(15000) - 72, 12, 8);
    }
}

function drawTruck() {
    ctx.save();
    ctx.translate(TRUCK_DRAW_X, truck.y);
    ctx.rotate(truck.angle);

    // 1. Suspension bars
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, 4); ctx.lineTo(-16, 14);
    ctx.moveTo(16, 4); ctx.lineTo(16, 14);
    ctx.stroke();

    // 2. Chassis body (Green/Orange boxy muscle car frame)
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(-26, -14, 52, 18);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-26, -14, 52, 18);

    // Windshield
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.lineTo(22, -6);
    ctx.lineTo(12, -6);
    ctx.closePath();
    ctx.fill();

    // Cute decals (chassis details)
    ctx.fillStyle = "#eab308";
    ctx.font = "bold 10px Nunito";
    ctx.fillText("50", -10, 0);

    // 3. Large Chibi Wheels (drawn rotating!)
    ctx.restore(); // Undo chassis rotate to spin wheels independently

    ctx.save();
    ctx.translate(TRUCK_DRAW_X, truck.y);
    
    // Draw wheels rotating relative to World X distance
    const wheelRotate = (truck.x / 14);
    
    // Front wheel
    ctx.save();
    // rotate wheel visually by translating to wheel center first
    const wheelFrontX = 16 * Math.cos(truck.angle) - 14 * Math.sin(truck.angle);
    const wheelFrontY = 16 * Math.sin(truck.angle) + 14 * Math.cos(truck.angle);
    ctx.translate(wheelFrontX, wheelFrontY);
    ctx.rotate(wheelRotate);
    drawWheel();
    ctx.restore();

    // Back wheel
    ctx.save();
    const wheelBackX = -16 * Math.cos(truck.angle) - 14 * Math.sin(truck.angle);
    const wheelBackY = -16 * Math.sin(truck.angle) + 14 * Math.cos(truck.angle);
    ctx.translate(wheelBackX, wheelBackY);
    ctx.rotate(wheelRotate);
    drawWheel();
    ctx.restore();

    ctx.restore();
}

function drawWheel() {
    ctx.fillStyle = "#000000"; // Black tire
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, truck.wheelRadius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Silver rim Spokes
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-truck.wheelRadius + 2, 0); ctx.lineTo(truck.wheelRadius - 2, 0);
    ctx.moveTo(0, -truck.wheelRadius + 2); ctx.lineTo(0, truck.wheelRadius - 2);
    ctx.stroke();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    
    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
        drawTerrain();
        drawTruck();
        particles.forEach(p => p.draw());
    }

    updateGame();
    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Bind virtual touch buttons
function setupTouchButton(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("mousedown", () => activeButtons[key] = true);
    btn.addEventListener("mouseup", () => activeButtons[key] = false);
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        activeButtons[key] = true;
    }, { passive: false });
    btn.addEventListener("touchend", () => activeButtons[key] = false);
}

setupTouchButton("btnLeft", "reverse");
setupTouchButton("btnRight", "forward");
setupTouchButton("btnTiltBack", "tiltL");
setupTouchButton("btnTiltFwd", "tiltR");

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_MENU;
    document.getElementById("startOverlay").classList.add("active");
});

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_monster-truck-rally"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start loop
gameLoop();
