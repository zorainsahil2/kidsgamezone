/**
 * KidsGameZone: Puppy Care
 * Virtual pet simulator with 4 needs meters, programmatic vector animations, 120s timer, and Web Audio sounds.
 */

const STORAGE_KEY = 'kgz_highscore_puppy-care';

// DOM selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const timerVal = document.getElementById('timerVal');

// Needs Bars
const hungerBar = document.getElementById('hungerBar');
const happyBar = document.getElementById('happyBar');
const cleanBar = document.getElementById('cleanBar');
const energyBar = document.getElementById('energyBar');

// Action Buttons
const feedBtn = document.getElementById('feedBtn');
const playBtn = document.getElementById('playBtn');
const bathBtn = document.getElementById('bathBtn');
const sleepBtn = document.getElementById('sleepBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');
const endTitle = document.getElementById('endTitle');
const endMessage = document.getElementById('endMessage');

// Web Audio System
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

    if (type === 'bark') {
        // High pitch happy double bark
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);

        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(740, audioCtx.currentTime + 0.08);
            gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc2.start(audioCtx.currentTime);
            osc2.stop(audioCtx.currentTime + 0.1);
        }, 120);
    } else if (type === 'chomp') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.setValueAtTime(140, now + 0.05);
        osc.frequency.setValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'splash') {
        // Water bubbles sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'snore') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.4);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'whine') {
        // Warning whimpering
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(550, now + 0.25);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// Game State Values
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let timeLeft = 120;
let gameStarted = false;
let gameOver = false;

let hunger = 100;
let happy = 100;
let clean = 100;
let energy = 100;

// Action states
let puppyAction = 'idle'; // 'idle', 'eat', 'play', 'bath', 'sleep'
let actionTimer = 0; // frames remaining for active actions
let animTicks = 0;
let clockTimer = null;

// Hearts & Bubble animations particles
let particles = []; // {x, y, vx, vy, type, size, alpha}

highScoreVal.textContent = highScore;

// Spawns particles (hearts for food/play, bubbles for bath, Zzz for sleep)
function spawnParticles(x, y, type, count = 3) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -0.8 - Math.random() * 1.5,
            type: type, // 'heart', 'bubble', 'zzz'
            size: 6 + Math.random() * 6,
            alpha: 1
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'heart') {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(p.x - p.size/2, p.y, p.size/2, 0, Math.PI * 2);
            ctx.arc(p.x + p.size/2, p.y, p.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(p.x - p.size, p.y + p.size/6);
            ctx.lineTo(p.x, p.y + p.size * 1.1);
            ctx.lineTo(p.x + p.size, p.y + p.size/6);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'bubble') {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Highlight sparkle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x - p.size/3, p.y - p.size/3, p.size/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'zzz') {
            ctx.fillStyle = '#a855f7';
            ctx.font = `bold ${Math.floor(p.size * 1.2)}px 'Fredoka'`;
            ctx.fillText('Zzz', p.x, p.y);
        }
        ctx.restore();
    });
}

// Tick loop running once every second
function onSecondTick() {
    if (gameOver || !gameStarted) return;

    // Decay rates
    hunger = Math.max(0, hunger - 1.8);
    happy = Math.max(0, happy - 2.5);
    clean = Math.max(0, clean - 1.4);

    if (puppyAction === 'sleep') {
        energy = Math.min(100, energy + 12.0);
        spawnParticles(240, 100, 'zzz', 1);
        playSound('snore');
    } else {
        energy = Math.max(0, energy - 1.0);
    }

    // Update progress bars visual UI
    hungerBar.style.width = `${hunger}%`;
    happyBar.style.width = `${happy}%`;
    cleanBar.style.width = `${clean}%`;
    energyBar.style.width = `${energy}%`;

    // Scoring & alerts
    const minNeed = Math.min(hunger, happy, clean, energy);
    if (minNeed === 0) {
        score = Math.max(0, score - 4); // Deduct for neglect
        playSound('whine');
    } else if (minNeed < 25) {
        score = Math.max(0, score - 1);
        playSound('whine');
    } else {
        score += 2; // Tick bonus
    }
    scoreVal.textContent = score;

    // Timer countdown
    timeLeft--;
    timerVal.textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

// Action Trigger Functions
function actionFeed() {
    if (puppyAction === 'sleep' || gameOver || !gameStarted) return;
    hunger = Math.min(100, hunger + 25);
    hungerBar.style.width = `${hunger}%`;
    puppyAction = 'eat';
    actionTimer = 90; // 90 frames = 1.5 seconds
    playSound('chomp');
    spawnParticles(200, 240, 'heart', 4);
}

function actionPlay() {
    if (puppyAction === 'sleep' || gameOver || !gameStarted) return;
    happy = Math.min(100, happy + 20);
    happyBar.style.width = `${happy}%`;
    puppyAction = 'play';
    actionTimer = 90;
    playSound('bark');
    spawnParticles(200, 180, 'heart', 4);
}

function actionBath() {
    if (puppyAction === 'sleep' || gameOver || !gameStarted) return;
    clean = Math.min(100, clean + 30);
    cleanBar.style.width = `${clean}%`;
    puppyAction = 'bath';
    actionTimer = 90;
    playSound('splash');
    spawnParticles(200, 200, 'bubble', 6);
}

function actionSleep() {
    if (gameOver || !gameStarted) return;
    if (puppyAction === 'sleep') {
        // Wake up manually
        puppyAction = 'idle';
        actionTimer = 0;
        playSound('bark');
    } else {
        // Fall asleep
        puppyAction = 'sleep';
        actionTimer = 240; // Sleeps for 4s max or until button clicked again
    }
}

// Event Listeners
feedBtn.addEventListener('click', actionFeed);
playBtn.addEventListener('click', actionPlay);
bathBtn.addEventListener('click', actionBath);
sleepBtn.addEventListener('click', actionSleep);

// Canvas Vector Drawer Loop
function drawPuppy() {
    // 1. Draw floor room background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fed7aa'; // light wooden floor
    ctx.fillRect(0, 220, canvas.width, canvas.height - 220);

    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 220); ctx.lineTo(canvas.width, 220);
    ctx.stroke();

    // Floor lines
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.15)';
    ctx.beginPath();
    ctx.moveTo(80, 220); ctx.lineTo(40, canvas.height);
    ctx.moveTo(200, 220); ctx.lineTo(200, canvas.height);
    ctx.moveTo(320, 220); ctx.lineTo(360, canvas.height);
    ctx.stroke();

    // 2. Base Coordinates
    const px = 200;
    const py = 190;

    const isSad = Math.min(hunger, happy, clean, energy) < 28;

    ctx.save();

    if (puppyAction === 'sleep') {
        // Draw Lying Down Sleeping Puppy
        drawSleepingPuppy(ctx, px, py);
    } else if (puppyAction === 'eat') {
        // Eating Puppy
        drawEatingPuppy(ctx, px, py, isSad);
    } else if (puppyAction === 'play') {
        // Bouncing/Playing Puppy
        drawPlayingPuppy(ctx, px, py);
    } else if (puppyAction === 'bath') {
        // Bathing Tub Puppy
        drawBathingPuppy(ctx, px, py, isSad);
    } else {
        // Idle sitting Puppy
        drawSittingPuppy(ctx, px, py, isSad);
    }

    ctx.restore();

    // Draw bubbles, hearts, or letters
    drawParticles();
}

// Sitting Idle Puppy
function drawSittingPuppy(ctx, px, py, isSad) {
    const earsBounce = Math.sin(animTicks * 0.08) * 3;
    const headBob = Math.sin(animTicks * 0.04) * 2.5;

    // Tail (wagging based on happiness!)
    ctx.save();
    ctx.translate(px - 28, py + 45);
    let tailWag = Math.sin(animTicks * 0.15) * 0.35;
    if (isSad) tailWag = 0.05; // droopy tail
    else tailWag *= (happy / 50); // fast wag if happy
    ctx.rotate(Math.PI / 4 + tailWag);
    ctx.fillStyle = '#eab308'; // Golden retriever gold
    ctx.fillRect(-6, -30, 10, 36);
    ctx.restore();

    // Back legs paws
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(px - 25, py + 48, 12, 0, Math.PI * 2);
    ctx.arc(px + 25, py + 48, 12, 0, Math.PI * 2);
    ctx.fill();

    // Main Body
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 28, py + 5, 56, 50);
    // Chest fluff
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(px - 14, py + 5);
    ctx.quadraticCurveTo(px, py + 30, px + 14, py + 5);
    ctx.closePath();
    ctx.fill();

    // Front paws
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 18, py + 35, 10, 24);
    ctx.fillRect(px + 8, py + 35, 10, 24);

    // Head (with vertical bobbing)
    const hy = py - 30 + headBob;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, hy, 32, 0, Math.PI * 2);
    ctx.fill();

    // Ears (droop down if sad, bounce if happy)
    ctx.fillStyle = '#d97706';
    if (isSad) {
        // Drooping low
        ctx.fillRect(px - 36, hy - 10, 10, 34);
        ctx.fillRect(px + 26, hy - 10, 10, 34);
    } else {
        // Floppy bounce
        ctx.fillRect(px - 35, hy - 15 + earsBounce, 10, 28);
        ctx.fillRect(px + 25, hy - 15 + earsBounce, 10, 28);
    }

    // Snout
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(px, hy + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 4, hy + 5, 8, 5);

    // Eyes
    ctx.fillStyle = '#1e293b';
    if (isSad) {
        // Sad look
        ctx.beginPath();
        ctx.arc(px - 10, hy - 4, 3, Math.PI, 0);
        ctx.arc(px + 10, hy - 4, 3, Math.PI, 0);
        ctx.stroke();
    } else {
        // Cute circles
        ctx.beginPath();
        ctx.arc(px - 11, hy - 4, 4.5, 0, Math.PI * 2);
        ctx.arc(px + 11, hy - 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px - 12, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.arc(px + 10, hy - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Panting tongue if happy
    if (!isSad && happy > 40) {
        ctx.fillStyle = '#f43f5e'; // pink tongue
        ctx.beginPath();
        ctx.ellipse(px, hy + 22 + headBob * 0.2, 5, 8 + headBob * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Eating/Chomping Puppy
function drawEatingPuppy(ctx, px, py, isSad) {
    // Leans forward towards bowl
    const eatCycle = Math.sin(animTicks * 0.3) * 6;

    // Food bowl
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.ellipse(px, py + 55, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // food pellets inside
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px - 14, py + 46, 28, 8);

    // Sitting body
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 28, py + 5, 56, 45);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 16, py + 30, 8, 22);
    ctx.fillRect(px + 8, py + 30, 8, 22);

    // Head leaning down to bowl
    const hy = py - 18 + eatCycle;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, hy, 30, 0, Math.PI * 2);
    ctx.fill();

    // Ears flapping
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px - 34, hy - 12 - eatCycle*0.4, 8, 26);
    ctx.fillRect(px + 26, hy - 12 - eatCycle*0.4, 8, 26);

    // Snout & nose
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(px, hy + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 3, hy + 7, 6, 4);

    // Eyes closed eating happily
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px - 15, hy - 2);
    ctx.quadraticCurveTo(px - 10, hy - 6, px - 6, hy - 2);
    ctx.moveTo(px + 6, hy - 2);
    ctx.quadraticCurveTo(px + 10, hy - 6, px + 15, hy - 2);
    ctx.stroke();

    // Chew crumbs particles
    if (animTicks % 12 === 0) {
        spawnParticles(px, py + 35, 'heart', 1);
    }
}

// Bouncing/Playing Puppy
function drawPlayingPuppy(ctx, px, py) {
    // bouncing bounce calculations
    const bounce = -18 * Math.abs(Math.sin(animTicks * 0.22));
    const by = py + bounce;

    // Tail wagging crazy fast
    ctx.save();
    ctx.translate(px - 26, by + 40);
    ctx.rotate(-Math.PI / 4 + Math.sin(animTicks * 0.6) * 0.8);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-6, -26, 8, 28);
    ctx.restore();

    // Main Body flying
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 25, by + 2, 50, 44);

    // Flying front/back paws
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 22, by + 30, 8, 20);
    ctx.fillRect(px + 14, by + 30, 8, 20);

    // Bouncing Head
    const hy = by - 32;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, hy, 32, 0, Math.PI * 2);
    ctx.fill();

    // Flying ears
    ctx.fillStyle = '#d97706';
    ctx.save();
    ctx.translate(px - 28, hy - 10);
    ctx.rotate(Math.sin(animTicks * 0.2) * 0.2 - 0.2);
    ctx.fillRect(-8, 0, 8, 24);
    ctx.restore();
    ctx.save();
    ctx.translate(px + 28, hy - 10);
    ctx.rotate(-Math.sin(animTicks * 0.2) * 0.2 + 0.2);
    ctx.fillRect(0, 0, 8, 24);
    ctx.restore();

    // Snout & nose
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(px, hy + 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 3, hy + 4, 6, 4);

    // Sparkly eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(px - 10, hy - 5, 5, 0, Math.PI * 2);
    ctx.arc(px + 10, hy - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 11, hy - 7, 2, 2);
    ctx.fillRect(px + 9, hy - 7, 2, 2);

    // Red ball bouncing
    const bx = px + 45 + Math.sin(animTicks * 0.1) * 15;
    const ballY = py + 35 + Math.cos(animTicks * 0.2) * 12;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bx, ballY, 12, 0, Math.PI*2);
    ctx.fill();
    // ball details
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, ballY, 12, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    if (animTicks % 15 === 0) {
        spawnParticles(px, hy, 'heart', 1);
    }
}

// Bathing/Water shake Puppy
function drawBathingPuppy(ctx, px, py, isSad) {
    const shake = Math.sin(animTicks * 0.5) * 4;

    // Bathtub outline (front layer)
    ctx.fillStyle = '#bae6fd'; // light blue water tub
    ctx.fillRect(px - 60, py + 22, 120, 45);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(px - 64, py + 20, 128, 6); // rim

    // Puppy sitting inside tub shaking head
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 22 + shake, py + 10, 44, 25);

    // Head wiggling
    const hy = py - 20;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px + shake, hy, 28, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(px + shake, hy + 8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 3 + shake, hy + 4, 6, 3);

    // Splashing eyes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 12 + shake, hy - 2); ctx.lineTo(px - 6 + shake, hy - 5);
    ctx.moveTo(px + 6 + shake, hy - 5); ctx.lineTo(px + 12 + shake, hy - 2);
    ctx.stroke();

    // Soap bubbles piling on head!
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(px - 8 + shake, hy - 26, 8, 0, Math.PI * 2);
    ctx.arc(px + 8 + shake, hy - 26, 8, 0, Math.PI * 2);
    ctx.arc(px + shake, hy - 32, 10, 0, Math.PI * 2);
    ctx.fill();

    // Spawn bubs
    if (animTicks % 10 === 0) {
        spawnParticles(px + shake, py + 10, 'bubble', 1);
    }
}

// Sleeping horizontally Puppy
function drawSleepingPuppy(ctx, px, py) {
    const sleepBreath = Math.sin(animTicks * 0.05) * 1.5;

    // Pillow
    ctx.fillStyle = '#fda4af'; // light pink pillow
    ctx.fillRect(px - 50, py + 30, 40, 24);

    // Horizontal laying down body
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 38, py + 18 - sleepBreath, 76, 28);

    // Front/Back paws stretched out
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 34, py + 36, 12, 10);
    ctx.fillRect(px + 20, py + 36, 12, 10);

    // Head resting on pillow
    const hx = px - 35;
    const hy = py + 15;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(hx, hy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Floppy ears laying flat
    ctx.fillStyle = '#d97706';
    ctx.fillRect(hx - 22, hy - 6, 8, 22);

    // Sleeping closed eyes line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx - 12, hy + 2);
    ctx.quadraticCurveTo(hx - 8, hy + 6, hx - 4, hy + 2);
    ctx.stroke();

    // Rest of snout
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(hx - 8, hy + 10, 6, 0, Math.PI*2);
    ctx.fill();

    // Tail tucked in
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(px + 36, py + 32, 10, Math.PI, Math.PI*2);
    ctx.stroke();
}

// Game loop clock timer
function gameLoop() {
    animTicks++;

    // Track active special actions timer limits
    if (puppyAction !== 'idle' && puppyAction !== 'sleep') {
        actionTimer--;
        if (actionTimer <= 0) {
            puppyAction = 'idle';
        }
    } else if (puppyAction === 'sleep') {
        actionTimer--;
        if (actionTimer <= 0) {
            // wake up automatically
            puppyAction = 'idle';
        }
    }

    updateParticles();
    drawPuppy();
    requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    timeLeft = 120;
    gameOver = false;
    gameStarted = true;

    hunger = 100;
    happy = 100;
    clean = 100;
    energy = 100;

    puppyAction = 'idle';
    actionTimer = 0;
    particles = [];

    scoreVal.textContent = score;
    timerVal.textContent = timeLeft;

    // Reset UI bars
    hungerBar.style.width = '100%';
    happyBar.style.width = '100%';
    cleanBar.style.width = '100%';
    energyBar.style.width = '100%';

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(onSecondTick, 1000);
}

// End Game Complete
function endGame() {
    gameOver = true;
    gameStarted = false;
    if (clockTimer) clearInterval(clockTimer);

    // Save high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    // Determine final message based on how well they cared
    const minNeed = Math.min(hunger, happy, clean, energy);
    if (minNeed > 65) {
        endTitle.textContent = "Super Pet Master! 🏆";
        endMessage.textContent = "Your puppy is in perfect health and absolutely adores you!";
    } else if (minNeed > 35) {
        endTitle.textContent = "Happy Puppy! 🐶";
        endMessage.textContent = "Great job caring for your virtual puppy!";
    } else {
        endTitle.textContent = "Tired Puppy! 💤";
        endMessage.textContent = "Your puppy completed the care session but needs a lot of rest!";
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// Event hooks
startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);

// Start loop
gameLoop();
