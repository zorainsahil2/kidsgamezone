/**
 * KidsGameZone: Bike Stunt Rider (Prehistoric Jungle Edition)
 * Infinite terrain profile evaluator, rigid-body physics loop,
 * angular momentum flips tracking, camera scrolling viewport, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_bike-stunt-rider';

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const livesVal = document.getElementById('livesVal');
const stuntMsg = document.getElementById('stuntMsg');
const levelButtons = document.querySelectorAll('.level-btn');

// Mobile Buttons
const btnGas = document.getElementById('btnGas');
const btnBrake = document.getElementById('btnBrake');
const btnTiltBack = document.getElementById('btnTiltBack');
const btnTiltForward = document.getElementById('btnTiltForward');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Physics Configuration
const GRAVITY = 0.16;

// Game State
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let lives = 3;
let currentLevel = 0;
let flipsCount = 0;
let gameStarted = false;
let gameOver = false;
let animTicks = 0;

// Camera
let cameraX = 0;

// Bike Object
let bike = {
    x: 100, y: 120,
    vx: 0, vy: 0,
    theta: 0, omega: 0, // angle & angular velocity
    radius: 15,
    grounded: false,
    cumulativeAirRotation: 0,
    lastTheta: 0
};

// Inputs
let isGas = false;
let isBrake = false;
let isLeanBack = false;
let isLeanForward = false;

// Entities & Particles
let coins = [];
let obstacles = [];
let particles = [];
let wheelRotation = 0;
let wheelieTimer = 0;

// Assets Preloading
const Assets = {};
const assetSources = {
    bg_skyline: 'assets/bg_skyline.png',
    bike_chassis: 'assets/bike_chassis.png',
    bike_wheel: 'assets/bike_wheel.png',
    rider: 'assets/rider.png',
    egg: 'assets/Golden_Dino_Egg.png',
    cactus: 'assets/Prehistoric_Cactus.png'
};

let assetsLoaded = 0;
const totalAssets = Object.keys(assetSources).length;

function loadAssets(callback) {
    for (const [key, src] of Object.entries(assetSources)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                callback();
            }
        };
        img.onerror = () => {
            console.error('Failed to load asset: ' + src);
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                callback();
            }
        };
        Assets[key] = img;
    }
}

// Audio Configuration
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let engineOsc = null;
let engineGain = null;

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

    if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.45);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    } else if (type === 'level') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

function startEngineSound() {
    if (!audioCtx || engineOsc) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
    engineGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    engineOsc.start();
}

function updateEngineFrequency() {
    if (!engineOsc) return;
    const speed = Math.abs(bike.vx);
    const targetFreq = 50 + (isGas ? 45 : 0) + speed * 6;
    engineOsc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
    engineGain.gain.setValueAtTime(isGas ? 0.022 : 0.008, audioCtx.currentTime);
}

function stopEngineSound() {
    if (engineOsc) {
        try { engineOsc.stop(); } catch(e){}
        engineOsc = null;
        engineGain = null;
    }
}

// Slope Mathematics Evaluation
function getTerrainHeight(x) {
    if (currentLevel === 0) {
        return 210 + Math.sin(x * 0.015) * 35;
    }
    else if (currentLevel === 1) {
        let base = 210 + Math.sin(x * 0.02) * 45;
        if (x >= 320 && x <= 380) {
            base -= (x - 320) * 1.5;
        } else if (x > 380 && x < 440) {
            base = 330; // gap valley
        }
        if (x >= 920 && x <= 980) {
            base -= (x - 920) * 1.8;
        } else if (x > 980 && x < 1040) {
            base = 330;
        }
        return base;
    }
    else {
        let base = 210 + Math.sin(x * 0.01) * 25;
        if (x >= 450 && x <= 550) {
            base -= (x - 450) * 2.3;
        } else if (x > 550 && x < 670) {
            base = 340; // Mega jump drop
        }
        if (x >= 1200 && x <= 1300) {
            base -= (x - 1200) * 2.6;
        } else if (x > 1300 && x < 1440) {
            base = 340;
        }
        return base;
    }
}

// Initialize Level Collectibles and Hazards
function initLevelEntities() {
    coins = [];
    obstacles = [];
    
    if (currentLevel === 0) {
        for (let x = 300; x < 2000; x += 180) {
            coins.push({ x: x, y: getTerrainHeight(x) - 25, collected: false });
        }
        obstacles.push({ x: 500, y: getTerrainHeight(500), hit: false });
        obstacles.push({ x: 900, y: getTerrainHeight(900), hit: false });
        obstacles.push({ x: 1400, y: getTerrainHeight(1400), hit: false });
    } else if (currentLevel === 1) {
        for (let x = 250; x < 2000; x += 150) {
            const y = getTerrainHeight(x);
            if (y < 300) {
                const isRampPeak = (x > 340 && x < 420) || (x > 940 && x < 1020);
                const coinY = isRampPeak ? y - 60 : y - 25;
                coins.push({ x: x, y: coinY, collected: false });
            }
        }
        obstacles.push({ x: 280, y: getTerrainHeight(280), hit: false });
        obstacles.push({ x: 600, y: getTerrainHeight(600), hit: false });
        obstacles.push({ x: 800, y: getTerrainHeight(800), hit: false });
        obstacles.push({ x: 1150, y: getTerrainHeight(1150), hit: false });
    } else {
        for (let x = 200; x < 2000; x += 120) {
            const y = getTerrainHeight(x);
            if (y < 300) {
                const isMegaPeak = (x > 480 && x < 620) || (x > 1230 && x < 1390);
                const coinY = isMegaPeak ? y - 100 : y - 25;
                coins.push({ x: x, y: coinY, collected: false });
            }
        }
        obstacles.push({ x: 400, y: getTerrainHeight(400), hit: false });
        obstacles.push({ x: 750, y: getTerrainHeight(750), hit: false });
        obstacles.push({ x: 1100, y: getTerrainHeight(1100), hit: false });
        obstacles.push({ x: 1600, y: getTerrainHeight(1600), hit: false });
    }
}

// Particle Engine
function addParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            color: color,
            alpha: 1,
            size: Math.random() * 4 + 2,
            life: Math.random() * 20 + 20
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// Start Level Session
highScoreVal.textContent = highScore;

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    lives = 3;
    score = 0;
    flipsCount = 0;
    gameOver = false;
    gameStarted = true;
    particles = [];

    livesVal.textContent = lives;
    scoreVal.textContent = score;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    resetBike();
    startEngineSound();
}

function resetBike() {
    bike.x = 100;
    bike.y = getTerrainHeight(100) - 30;
    bike.vx = 0;
    bike.vy = 0;
    bike.theta = 0;
    bike.omega = 0;
    bike.grounded = false;
    bike.cumulativeAirRotation = 0;
    bike.lastTheta = 0;
    cameraX = 0;
    wheelRotation = 0;
    wheelieTimer = 0;
    initLevelEntities();
}

// Trigger Stunt popups
function showStuntMsg(text) {
    stuntMsg.textContent = text;
    stuntMsg.classList.remove('active');
    void stuntMsg.offsetWidth; // trigger reflow
    stuntMsg.classList.add('active');
}

// Physics Loop Clock updates
function updatePhysics() {
    if (!gameStarted || gameOver) return;

    animTicks++;

    // 1. Inputs forces checks
    if (bike.grounded) {
        if (isGas) {
            bike.vx += Math.cos(bike.theta) * 0.16;
            bike.vy += Math.sin(bike.theta) * 0.16;
            
            // Ground dust trails
            if (Math.random() < 0.3) {
                const rx = bike.x - Math.cos(bike.theta) * 20;
                const ry = bike.y - Math.sin(bike.theta) * 20;
                addParticles(rx, ry + 10, '#854d0e', 1);
            }
        }
        if (isBrake) {
            bike.vx *= 0.94;
        }
    } else {
        if (isLeanBack) {
            bike.omega -= 0.0045;
        }
        if (isLeanForward) {
            bike.omega += 0.0045;
        }
    }

    // Continuous exhaust smoke particles
    if (Math.random() < 0.15) {
        const sx = bike.x - Math.cos(bike.theta) * 15 + Math.sin(bike.theta) * 10;
        const sy = bike.y - Math.sin(bike.theta) * 15 - Math.cos(bike.theta) * 10;
        particles.push({
            x: sx, y: sy,
            vx: -Math.cos(bike.theta) * 1 - 0.5 + Math.random() * 0.5,
            vy: -Math.sin(bike.theta) * 1 - 0.5 + Math.random() * 0.5,
            color: '#94a3b8',
            alpha: 0.6,
            size: Math.random() * 3 + 1,
            life: 35
        });
    }

    // 2. Apply Gravity & Velocity
    bike.vy += GRAVITY;

    bike.vx = Math.max(-2, Math.min(8.5, bike.vx));
    bike.vy = Math.max(-10, Math.min(10, bike.vy));

    bike.x += bike.vx;
    bike.y += bike.vy;

    // Rotate wheels relative to bike velocity
    wheelRotation += bike.vx * 0.08;

    // 3. Ground Collision
    const gy = getTerrainHeight(bike.x);
    if (bike.y >= gy - bike.radius) {
        let normTheta = bike.theta % (Math.PI * 2);
        if (normTheta > Math.PI) normTheta -= Math.PI * 2;
        if (normTheta < -Math.PI) normTheta += Math.PI * 2;

        if (Math.abs(normTheta) > Math.PI * 0.6 && !bike.grounded) {
            triggerCrash();
        } else {
            // Safe land
            bike.y = gy - bike.radius;
            bike.vy = 0;

            // Landing smoke effect
            if (!bike.grounded) {
                addParticles(bike.x, bike.y + 10, '#ffffff', 6);
                
                // Stunt score validation
                const totalAngle = Math.abs(bike.cumulativeAirRotation);
                if (totalAngle >= Math.PI * 1.85) {
                    const flips = Math.floor(totalAngle / (Math.PI * 1.95));
                    if (flips > 0) {
                        flipsCount += flips;
                        score += flips * 50;
                        playSound('flip');
                        showStuntMsg(flips === 1 ? 'BACKFLIP! +50' : `DOUBLE FLIP! +${flips * 50}`);
                    }
                }
            }

            bike.grounded = true;
            bike.cumulativeAirRotation = 0;
            bike.omega = 0;

            // Align chassis to slope
            const sampleDist = 8;
            const slope = Math.atan2(getTerrainHeight(bike.x + sampleDist) - getTerrainHeight(bike.x - sampleDist), sampleDist * 2);
            bike.theta = bike.theta * 0.7 + slope * 0.3;
            bike.vx *= 0.992;

            // Wheelie stunt tracking
            const relAngle = bike.theta - slope;
            if (relAngle < -0.15 && isGas) {
                wheelieTimer++;
                if (wheelieTimer > 25 && wheelieTimer % 15 === 0) {
                    score += 15;
                    playSound('flip');
                    showStuntMsg("WHEELIE BONUS! +15");
                }
            } else {
                wheelieTimer = 0;
            }
        }
    } else {
        bike.grounded = false;
        bike.omega *= 0.95;
        bike.theta += bike.omega;

        let diff = bike.theta - bike.lastTheta;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        bike.cumulativeAirRotation += diff;
        wheelieTimer = 0;
    }

    bike.lastTheta = bike.theta;

    // Boundary fall check
    if (bike.y > 340) {
        triggerCrash();
    }

    // Camera follow slider
    cameraX = cameraX * 0.9 + (bike.x - 120) * 0.1;

    // Collectibles Egg Collisions check
    coins.forEach(c => {
        if (!c.collected) {
            const dist = Math.hypot(bike.x - c.x, bike.y - c.y);
            if (dist < bike.radius + 15) {
                c.collected = true;
                score += 100;
                playSound('flip');
                showStuntMsg("GOLDEN EGG! +100");
                addParticles(c.x, c.y, '#FFE66D', 8);
            }
        }
    });

    // Obstacles Cactus Collision check
    obstacles.forEach(o => {
        if (!o.hit) {
            const dist = Math.hypot(bike.x - o.x, bike.y - (o.y - 12));
            if (dist < bike.radius + 15) {
                o.hit = true;
                triggerCrash();
            }
        }
    });

    // Score calculations
    const baseScore = Math.max(0, Math.floor(bike.x - 100)) + flipsCount * 50;
    if (baseScore > score) {
        score = baseScore;
        scoreVal.textContent = score;
    }

    // Course completion
    if (bike.x >= 2000) {
        playSound('level');
        score += 150;
        scoreVal.textContent = score;
        if (currentLevel < 2) {
            currentLevel++;
            levelButtons.forEach((b, i) => {
                if (i === currentLevel) b.classList.add('active');
                else b.classList.remove('active');
            });
            showStuntMsg("LEVEL COMPLETE! NEXT LEVEL!");
            resetBike();
        } else {
            endGame();
        }
    }

    updateEngineFrequency();
    updateParticles();
}

function triggerCrash() {
    lives--;
    livesVal.textContent = lives;
    playSound('crash');
    showStuntMsg("💥 CRASH!");
    addParticles(bike.x, bike.y, '#ef4444', 12); // Red crash particles

    if (lives <= 0) {
        endGame();
    } else {
        resetBike();
    }
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    stopEngineSound();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// --- Renderer ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Parallax Background (Skyline)
    if (Assets.bg_skyline) {
        const bgW = 800;
        const bgOffset = -(cameraX * 0.3) % bgW;
        ctx.drawImage(Assets.bg_skyline, bgOffset, 0, bgW, 300);
        ctx.drawImage(Assets.bg_skyline, bgOffset + bgW, 0, bgW, 300);
    } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#064e3b');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Distance Hills (Parallax forest silhouette)
    ctx.save();
    ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 10) {
        const hx = x + cameraX * 0.45;
        const hy = 240 + Math.sin(hx * 0.006) * 45;
        ctx.lineTo(x, hy);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
    ctx.restore();

    // 3. Draw Collectibles Eggs
    coins.forEach(c => {
        if (!c.collected && c.x - cameraX > -50 && c.x - cameraX < canvas.width + 50) {
            if (Assets.egg) {
                const bob = Math.sin(animTicks * 0.1) * 3;
                ctx.drawImage(Assets.egg, c.x - cameraX - 12, c.y + bob - 12, 24, 24);
            } else {
                ctx.fillStyle = '#FFE66D';
                ctx.beginPath(); ctx.arc(c.x - cameraX, c.y, 8, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    // 4. Draw Cacti Obstacles
    obstacles.forEach(o => {
        if (o.x - cameraX > -50 && o.x - cameraX < canvas.width + 50) {
            if (Assets.cactus) {
                ctx.drawImage(Assets.cactus, o.x - cameraX - 15, o.y - 32, 30, 32);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(o.x - cameraX - 8, o.y - 20, 16, 20);
            }
        }
    });

    // 5. Draw Active Slopes
    ctx.save();
    ctx.fillStyle = '#22c55e'; // Prehistoric Jungle bright grass green
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 8) {
        const worldX = x + cameraX;
        const hy = getTerrainHeight(worldX);
        ctx.lineTo(x, hy);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
    ctx.stroke();

    // Draw under-soil dirt
    ctx.fillStyle = '#451a03'; // Dark clay dirt
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 12) {
        const worldX = x + cameraX;
        const hy = getTerrainHeight(worldX) + 12;
        ctx.lineTo(x, hy);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
    ctx.restore();

    // 6. Draw Level Finish banner (at X=2000)
    const fx = 2000 - cameraX;
    if (fx > -50 && fx < canvas.width + 50) {
        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx, getTerrainHeight(2000));
        ctx.lineTo(fx, getTerrainHeight(2000) - 100);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx, getTerrainHeight(2000) - 100, 30, 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, getTerrainHeight(2000) - 100, 15, 10);
        ctx.fillRect(fx + 15, getTerrainHeight(2000) - 90, 15, 10);
        ctx.restore();
    }

    // 7. Draw Bike
    if (gameStarted && !gameOver) {
        drawBike(ctx, bike.x - cameraX, bike.y);
    }

    // 8. Draw Particles
    drawParticles();
}

function drawBike(ctx, bx, by) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bike.theta);

    const wx = 20;

    // 1. Back Wheel (left)
    ctx.save();
    ctx.translate(-wx, 0);
    ctx.rotate(wheelRotation);
    if (Assets.bike_wheel) {
        ctx.drawImage(Assets.bike_wheel, -13, -13, 26, 26);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // 2. Front Wheel (right)
    ctx.save();
    ctx.translate(wx, 0);
    ctx.rotate(wheelRotation);
    if (Assets.bike_wheel) {
        ctx.drawImage(Assets.bike_wheel, -13, -13, 26, 26);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // 3. Chassis (frame)
    ctx.save();
    if (Assets.bike_chassis) {
        ctx.drawImage(Assets.bike_chassis, -26, -24, 52, 34);
    } else {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-wx, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(wx, 0);
        ctx.stroke();
    }
    ctx.restore();

    // 4. Rider
    ctx.save();
    if (Assets.rider) {
        ctx.drawImage(Assets.rider, -20, -42, 32, 38);
    } else {
        const sx = -6;
        const sy = -22;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx + 4, sy - 28, 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
}

// Physics Loop clock ticks
function gameLoop() {
    updatePhysics();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controller listeners
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowRight') isGas = true;
    if (e.key === 'ArrowLeft') isBrake = true;
    if (e.key === 'ArrowUp') isLeanBack = true;
    if (e.key === 'ArrowDown') isLeanForward = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') isGas = false;
    if (e.key === 'ArrowLeft') isBrake = false;
    if (e.key === 'ArrowUp') isLeanBack = false;
    if (e.key === 'ArrowDown') isLeanForward = false;
});

// Mobile Controls triggers
btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); isGas = true; }, { passive: false });
btnGas.addEventListener('touchend', () => { isGas = false; });
btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); isBrake = true; }, { passive: false });
btnBrake.addEventListener('touchend', () => { isBrake = false; });
btnTiltBack.addEventListener('touchstart', (e) => { e.preventDefault(); isLeanBack = true; }, { passive: false });
btnTiltBack.addEventListener('touchend', () => { isLeanBack = false; });
btnTiltForward.addEventListener('touchstart', (e) => { e.preventDefault(); isLeanForward = true; }, { passive: false });
btnTiltForward.addEventListener('touchend', () => { isLeanForward = false; });

// Level switcher buttons
levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        levelButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = parseInt(btn.getAttribute('data-lvl'));
        playSound('level');
        resetBike();
    });
});

// Action triggers
startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);

// Fullscreen Toggle Logic
const btnFullscreen = document.getElementById('btnFullscreen');
const container = document.querySelector('.game-container');

if (btnFullscreen && container) {
    function toggleFullscreen() {
        const doc = window.document;
        const docEl = container;

        const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            if (requestFullScreen) {
                requestFullScreen.call(docEl);
                btnFullscreen.textContent = '📺 Exit Full';
            }
        } else {
            if (cancelFullScreen) {
                cancelFullScreen.call(doc);
                btnFullscreen.textContent = '📺 Fullscreen';
            }
        }
    }

    btnFullscreen.addEventListener('click', toggleFullscreen);

    // Sync button text when exiting fullscreen via ESC key
    const changeHandler = () => {
        const doc = window.document;
        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            btnFullscreen.textContent = '📺 Fullscreen';
        }
    };
    document.addEventListener('fullscreenchange', changeHandler);
    document.addEventListener('webkitfullscreenchange', changeHandler);
    document.addEventListener('mozfullscreenchange', changeHandler);
    document.addEventListener('MSFullscreenChange', changeHandler);
}

// Start Game after loading assets
loadAssets(() => {
    initLevelEntities();
    highScoreVal.textContent = highScore;
    gameLoop();
});
