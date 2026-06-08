/**
 * KidsGameZone: Underwater Adventure
 * Auto-scrolling swimming engine, oxygen depletion logs, AABB item checking,
 * hazard collision zaps, sandbox seabed decors, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_underwater-adventure';

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const hpBar = document.getElementById('hpBar');
const oxygenBar = document.getElementById('oxygenBar');

// Mobile Buttons
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');
const failMessage = document.getElementById('failMessage');

// Game State
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let hp = 100;
let oxygen = 100;
let itemsScore = 0;
let scrollX = 0;
let gameStarted = false;
let gameOver = false;
let animTicks = 0;

// Diver Position
let diver = { x: 100, y: 150, vx: 0, vy: 0, w: 38, h: 20 };

// Scrollable lists
let elements = []; // items / hazards: { type, x, y, r, speed, collected, hit }
let decors = [];   // seabed decor: { type, x, y, w, h }

// Keyboard Inputs
let inputs = { up: false, down: false, left: false, right: false };

// Audio Setup
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

    if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'collect') {
        // High twinkle arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'hurt') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.22);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

highScoreVal.textContent = highScore;

// Start Swimming Session
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    hp = 100;
    oxygen = 100;
    itemsScore = 0;
    scrollX = 0;
    score = 0;
    animTicks = 0;

    elements = [];
    decors = [];

    diver.x = 100;
    diver.y = 150;
    diver.vx = 0;
    diver.vy = 0;

    hpBar.style.width = '100%';
    oxygenBar.style.width = '100%';
    scoreVal.textContent = score;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    gameOver = false;
    gameStarted = true;

    // Seed initial decorations
    spawnInitialDecors();
}

function spawnInitialDecors() {
    for (let x = 80; x < canvas.width; x += 150) {
        decors.push({
            type: Math.random() < 0.5 ? 'seaweed' : 'coral',
            x: x,
            y: 280,
            w: 20 + Math.random() * 15,
            h: 35 + Math.random() * 25
        });
    }
}

// Spawns items / obstacles scrolling from right side
function spawnElement() {
    const roll = Math.random();
    let type = 'coin';
    let r = 8;

    if (roll < 0.24) {
        type = 'coin'; r = 7;
    } else if (roll < 0.40) {
        type = 'pearl'; r = 6;
    } else if (roll < 0.50) {
        type = 'chest'; r = 12;
    } else if (roll < 0.68) {
        type = 'jellyfish'; r = 11;
    } else if (roll < 0.78) {
        type = 'mine'; r = 10;
    } else if (roll < 0.84) {
        type = 'shark'; r = 24; // Big boss shark!
    } else {
        type = 'bubble'; r = 8;
    }

    elements.push({
        type: type,
        x: canvas.width + 30,
        y: 25 + Math.random() * 230,
        r: r,
        speed: 1.5 + Math.random() * 1.0,
        collected: false,
        hit: false
    });
}

function spawnSeabedDecor() {
    const type = Math.random() < 0.4 ? 'rock' : (Math.random() < 0.5 ? 'seaweed' : 'coral');
    let w = 24;
    let h = 30;
    if (type === 'rock') { w = 25; h = 16; }
    if (type === 'seaweed') { w = 18; h = 60; }
    if (type === 'coral') { w = 30; h = 35; }

    decors.push({
        type: type,
        x: canvas.width + 30,
        y: 280,
        w: w,
        h: h
    });
}

// Physics Loop clock ticks
function updatePhysics() {
    if (!gameStarted || gameOver) return;

    animTicks++;
    scrollX += 1.2;

    // 1. Apply swimming forces inputs
    const swimForce = 0.22;
    if (inputs.up) diver.vy -= swimForce;
    if (inputs.down) diver.vy += swimForce;
    if (inputs.left) diver.vx -= swimForce;
    if (inputs.right) diver.vx += swimForce;

    // Water Drag Friction
    diver.vx *= 0.91;
    diver.vy *= 0.91;

    diver.x += diver.vx;
    diver.y += diver.vy;

    // Canvas boundary clamps
    diver.x = Math.max(10, Math.min(canvas.width - diver.w, diver.x));
    diver.y = Math.max(10, Math.min(270 - diver.h, diver.y)); // ground level

    // 2. Oxygen levels ticks
    oxygen = Math.max(0, oxygen - 0.08);
    if (oxygen <= 0) {
        hp = Math.max(0, hp - 0.22); // Suffocation damage
        if (animTicks % 35 === 0) playSound('hurt');
    }
    oxygenBar.style.width = `${oxygen}%`;
    hpBar.style.width = `${hp}%`;

    if (hp <= 0) {
        endGame('Your HP reached 0! Avoid hazards and keep oxygen high!');
    }

    // 3. Move scrolling elements
    const scrollSpeed = 1.6;

    // Spawn new elements periodically
    if (animTicks % 85 === 0) {
        spawnElement();
    }
    if (animTicks % 120 === 0) {
        spawnSeabedDecor();
    }

    // Move decors
    for (let i = decors.length - 1; i >= 0; i--) {
        const d = decors[i];
        d.x -= scrollSpeed;
        if (d.x < -40) {
            decors.splice(i, 1);
        }
    }

    // Move items/hazards & check collision AABB
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        el.x -= el.speed;

        // check collision overlap
        if (!el.collected && !el.hit) {
            const dx = Math.abs((diver.x + diver.w/2) - el.x);
            const dy = Math.abs((diver.y + diver.h/2) - el.y);

            // Simple circle-capsule collider check
            if (dx < diver.w/2 + el.r && dy < diver.h/2 + el.r) {
                // COLLISION!
                handleCollision(el);
            }
        }

        if (el.x < -50) {
            elements.splice(i, 1);
        }
    }

    // Update score (distance + items points)
    score = Math.floor(scrollX / 10) + itemsScore;
    scoreVal.textContent = score;
}

function handleCollision(el) {
    const type = el.type;

    if (type === 'coin') {
        itemsScore += 5;
        el.collected = true;
        playSound('collect');
    }
    else if (type === 'pearl') {
        itemsScore += 10;
        el.collected = true;
        playSound('collect');
    }
    else if (type === 'chest') {
        itemsScore += 50;
        el.collected = true;
        playSound('collect');
    }
    else if (type === 'bubble') {
        oxygen = Math.min(100, oxygen + 28);
        el.collected = true;
        playSound('bubble');
    }
    else if (type === 'jellyfish') {
        hp = Math.max(0, hp - 20);
        el.hit = true;
        playSound('hurt');
        hpBar.style.width = `${hp}%`;
    }
    else if (type === 'mine') {
        hp = Math.max(0, hp - 50);
        el.hit = true;
        playSound('hurt');
        hpBar.style.width = `${hp}%`;
    }
    else if (type === 'shark') {
        hp = 0;
        el.hit = true;
        hpBar.style.width = '0%';
        endGame('A shark got you! Watch out for big sea monsters!');
    }
}

function endGame(msg = '') {
    gameOver = true;
    gameStarted = false;
    playSound('gameover');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failMessage.textContent = msg || 'Your HP or Oxygen reached 0!';
    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// --- Render Engine ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep water radial sky gradient (drawn via CSS on canvas background, but let's reinforce)
    const radial = ctx.createRadialGradient(250, 160, 40, 250, 160, 250);
    radial.addColorStop(0, '#0ea5e9'); // light teal
    radial.addColorStop(0.6, '#0284c7');
    radial.addColorStop(1, '#0369a1'); // deep blue
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw seabed sand
    ctx.fillStyle = '#fef08a'; // sandy yellow
    ctx.fillRect(0, 280, canvas.width, 40);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, 280, canvas.width, 3); // edge

    // Draw decors
    decors.forEach(d => {
        ctx.save();
        if (d.type === 'rock') {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI, true); // half dome rock
            ctx.fill();
        } else if (d.type === 'seaweed') {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            // Draw wavy line representing seaweed strand
            const wave = Math.sin(animTicks * 0.05 + d.x * 0.1) * 6;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.quadraticCurveTo(d.x + wave, d.y - d.h/2, d.x + wave * 1.5, d.y - d.h);
            ctx.stroke();
        } else if (d.type === 'coral') {
            ctx.fillStyle = '#fda4af';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y - d.h);
            ctx.moveTo(d.x, d.y - d.h/2); ctx.quadraticCurveTo(d.x - 12, d.y - d.h * 0.8, d.x - 12, d.y - d.h);
            ctx.moveTo(d.x, d.y - d.h/2.5); ctx.quadraticCurveTo(d.x + 12, d.y - d.h * 0.7, d.x + 12, d.y - d.h * 0.9);
            ctx.stroke();
        }
        ctx.restore();
    });

    // Draw elements
    elements.forEach(el => {
        if (el.collected || el.hit) return;

        ctx.save();
        ctx.translate(el.x, el.y);

        if (el.type === 'coin') {
            ctx.fillStyle = '#eab308';
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, el.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // inner outline
            ctx.fillStyle = '#ca8a04';
            ctx.font = 'bold 9px Nunito';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('¢', 0, 0);
        }
        else if (el.type === 'pearl') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, el.r, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // glint
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.arc(-el.r/3, -el.r/3, el.r/3, 0, Math.PI*2);
            ctx.fill();
        }
        else if (el.type === 'chest') {
            ctx.fillStyle = '#78350f'; // wood
            ctx.fillRect(-el.r, -el.r * 0.7, el.r * 2, el.r * 1.4);
            ctx.fillStyle = '#fbbf24'; // gold band
            ctx.fillRect(-el.r, -el.r * 0.7, el.r * 2, 4);
            ctx.fillStyle = '#ca8a04'; // latch
            ctx.fillRect(-2, -2, 4, 6);
        }
        else if (el.type === 'bubble') {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, el.r, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-el.r/3, -el.r/3, el.r/4, 0, Math.PI*2);
            ctx.fill();
        }
        else if (el.type === 'jellyfish') {
            ctx.fillStyle = 'rgba(236, 72, 153, 0.75)'; // translucent pink dome
            ctx.beginPath();
            ctx.arc(0, 0, el.r, Math.PI, 0); // half dome
            ctx.lineTo(el.r, el.r * 0.3);
            ctx.quadraticCurveTo(0, el.r * 0.6, -el.r, el.r * 0.3);
            ctx.closePath();
            ctx.fill();
            // tentacles
            ctx.strokeStyle = '#db2777';
            ctx.lineWidth = 1.5;
            const w = Math.sin(animTicks * 0.1 + el.x * 0.1) * 3;
            ctx.beginPath();
            ctx.moveTo(-el.r * 0.6, el.r * 0.3); ctx.quadraticCurveTo(-el.r*0.6 + w, el.r * 1.1, -el.r*0.4, el.r * 1.4);
            ctx.moveTo(0, el.r * 0.4); ctx.quadraticCurveTo(w, el.r * 1.2, 0, el.r * 1.5);
            ctx.moveTo(el.r * 0.6, el.r * 0.3); ctx.quadraticCurveTo(el.r*0.6 + w, el.r * 1.1, el.r*0.4, el.r * 1.4);
            ctx.stroke();
        }
        else if (el.type === 'mine') {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, 0, el.r - 2, 0, Math.PI*2);
            ctx.fill();
            // spikes
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * el.r, Math.sin(a) * el.r);
                ctx.stroke();
            }
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI*2);
            ctx.fill();
        }
        else if (el.type === 'shark') {
            // Big grey-blue shark
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(0, 0, el.r, el.r * 0.5, 0, 0, Math.PI*2);
            ctx.fill();
            // dorsal fin
            ctx.beginPath();
            ctx.moveTo(-el.r/4, -el.r * 0.4);
            ctx.lineTo(-el.r/2, -el.r * 1.1);
            ctx.lineTo(0, -el.r * 0.4);
            ctx.fill();
            // tail fin
            ctx.beginPath();
            ctx.moveTo(el.r, 0);
            ctx.lineTo(el.r + 14, -el.r * 0.7);
            ctx.lineTo(el.r + 8, 0);
            ctx.lineTo(el.r + 14, el.r * 0.7);
            ctx.closePath();
            ctx.fill();
            // white belly
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(0, el.r * 0.25, el.r * 0.7, el.r * 0.25, 0, 0, Math.PI);
            ctx.fill();
            // eye
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(-el.r * 0.5, -el.r * 0.1, 2.5, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Draw scuba diver
    if (gameStarted && !gameOver) {
        drawDiver(ctx, diver.x, diver.y);
    }
}

function drawDiver(ctx, dx, dy) {
    ctx.save();
    ctx.translate(dx + diver.w/2, dy + diver.h/2);

    // Horizontal swimming bob wiggles
    const wiggle = Math.sin(animTicks * 0.14) * 2;
    ctx.translate(0, wiggle);

    // 1. Oxygen Tank (Yellow capsule on back top)
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-14, -13, 20, 9, 4); // tank drawn flat on top
    ctx.fill();
    ctx.stroke();

    // 2. Main Wetsuit Body (Cyan horizontal capsule)
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -6, 32, 14, 6);
    ctx.fill();
    ctx.stroke();

    // Mask strap
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, -4); ctx.lineTo(16, -4);
    ctx.stroke();

    // 3. Diving Goggles mask (black face glass)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(10, -5, 8, 8, 2);
    ctx.fill();

    // 4. Flippers (black fins on feet left)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-26, -3 + wiggle);
    ctx.lineTo(-24, 7 + wiggle);
    ctx.closePath();
    ctx.fill();

    // Ambient diver bubbles trail
    if (animTicks % 25 === 0) {
        bubblesTrail();
    }

    ctx.restore();
}

function bubblesTrail() {
    // Generate small bubble particle
    bubbles.push({
        x: diver.x - 5,
        y: diver.y + 8,
        r: 3 + Math.random() * 3,
        speed: 1.0,
        isBonus: false,
        popped: false,
        popTimer: 0
    });
}

// Controller listeners
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowUp' || e.key === 'w') inputs.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') inputs.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') inputs.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') inputs.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') inputs.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') inputs.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') inputs.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') inputs.right = false;
});

// Mobile button listeners
btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); inputs.up = true; }, { passive: false });
btnUp.addEventListener('touchend', () => inputs.up = false);
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); inputs.down = true; }, { passive: false });
btnDown.addEventListener('touchend', () => inputs.down = false);
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); inputs.left = true; }, { passive: false });
btnLeft.addEventListener('touchend', () => inputs.left = false);
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); inputs.right = true; }, { passive: false });
btnRight.addEventListener('touchend', () => inputs.right = false);

// Action triggers
startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);

// Core clock ticking loop
function gameLoop() {
    updatePhysics();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
gameLoop();
