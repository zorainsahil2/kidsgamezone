/**
 * KidsGameZone: Fruit Slicer (Fruit Ninja Clone)
 * Implements high-performance physics, particle splashes, fruit slicing math, swipe blade trails, and web audio.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// DOM Lives indicators
const xMarks = [
    document.getElementById('x1'),
    document.getElementById('x2'),
    document.getElementById('x3')
];

const STORAGE_KEY = 'kgz_highscore_fruit-ninja';

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

    if (type === 'swoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'splat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'bomb') {
        // White noise-like rumble
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'gameover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(240, now + 0.15);
        osc.frequency.setValueAtTime(180, now + 0.3);
        osc.frequency.linearRampToValueAtTime(120, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

// Configuration
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

// Game State variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;

// Objects
let fruits = [];
let particles = [];
let swipeTrail = []; // contains {x, y, age}
const gravity = 0.22;

highScoreVal.textContent = highScore;

// Fruit Definition helper
const FRUIT_TYPES = [
    { name: 'Watermelon', color: '#2ecc71', innerColor: '#e74c3c', seedColor: '#2c3e50', radius: 32, isBomb: false },
    { name: 'Apple', color: '#e74c3c', innerColor: '#f1c40f', seedColor: '#7f8c8d', radius: 24, isBomb: false },
    { name: 'Orange', color: '#e67e22', innerColor: '#f39c12', seedColor: '#ffffff', radius: 24, isBomb: false },
    { name: 'Banana', color: '#f1c40f', innerColor: '#f39c12', seedColor: '#f1c40f', radius: 18, isBomb: false },
    { name: 'Coconut', color: '#795548', innerColor: '#f5f5f5', seedColor: '#795548', radius: 26, isBomb: false },
    { name: 'Bomb', color: '#2c3e50', innerColor: '#e74c3c', seedColor: '#f1c40f', radius: 24, isBomb: true }
];

// Mouse/Touch Drag states
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Update UI hearts/crosses
function updateLivesUI() {
    xMarks.forEach((mark, index) => {
        if (index < (3 - lives)) {
            mark.classList.add('active');
        } else {
            mark.classList.remove('active');
        }
    });
}

// Particle Splash Creator
function spawnSplash(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 5,
            color: color,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}

// Spawn Fruits
let spawnTimer = 0;
function spawnWave() {
    if (gameOver) return;
    const amount = 1 + Math.floor(Math.random() * 3);
    const hasBomb = Math.random() < 0.28; // 28% bomb spawn chance

    for (let i = 0; i < amount; i++) {
        const index = Math.floor(Math.random() * (FRUIT_TYPES.length - 1)); // no bomb first
        createFruit(FRUIT_TYPES[index]);
    }
    if (hasBomb) {
        createFruit(FRUIT_TYPES[FRUIT_TYPES.length - 1]); // Bomb
    }
}

function createFruit(spec) {
    const margin = 60;
    const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
    const y = CANVAS_HEIGHT + spec.radius;

    // Direct fruit towards center
    const targetX = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 150;
    const dx = targetX - x;
    const timeToApex = 40 + Math.random() * 20;

    const vx = dx / timeToApex;
    const vy = -Math.sqrt(2 * gravity * (CANVAS_HEIGHT - 60 - Math.random() * 80));

    fruits.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: spec.radius,
        color: spec.color,
        innerColor: spec.innerColor,
        seedColor: spec.seedColor,
        name: spec.name,
        isBomb: spec.isBomb,
        sliced: false,
        sliceAngle: 0,
        halfOffset: 0,
        rotation: (Math.random() - 0.5) * 0.1,
        angle: Math.random() * Math.PI
    });
}

// Splitting line intersection math
function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;

    // Projection scalar
    const u = ((cx - x1) * dx + (cy - y1) * dy) / (len * len);
    const clampedU = Math.max(0, Math.min(1, u));

    // Closest point on line segment
    const closestX = x1 + clampedU * dx;
    const closestY = y1 + clampedU * dy;

    const distSq = (closestX - cx) * (closestX - cx) + (closestY - cy) * (closestY - cy);
    return distSq <= r * r;
}

// Slice detection loop
function checkSlices(x1, y1, x2, y2) {
    if (gameOver) return;

    fruits.forEach(fruit => {
        if (!fruit.sliced) {
            if (lineIntersectsCircle(x1, y1, x2, y2, fruit.x, fruit.y, fruit.radius)) {
                sliceFruit(fruit, x2, y2);
            }
        }
    });
}

function sliceFruit(fruit, hitX, hitY) {
    fruit.sliced = true;
    // Determine slice angle from direction of hit
    fruit.sliceAngle = Math.atan2(hitY - fruit.y, hitX - fruit.x) + Math.PI / 2;

    if (fruit.isBomb) {
        playSound('bomb');
        spawnSplash(fruit.x, fruit.y, '#e53e3e', 35);
        lives = 0;
        updateLivesUI();
        endGame();
    } else {
        playSound('splat');
        score += 10;
        scoreVal.textContent = score;
        spawnSplash(fruit.x, fruit.y, fruit.innerColor, 15);
        spawnSplash(fruit.x, fruit.y, fruit.color, 10);
    }
}

// Game Core Update Loops
function update() {
    if (!gameStarted) return;

    // Fruits update
    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += gravity;
        f.angle += f.rotation;

        if (f.sliced) {
            f.halfOffset += 4; // halves drift apart
            // Remove sliced fruits once they fall
            if (f.y > CANVAS_HEIGHT + 100) {
                fruits.splice(i, 1);
            }
        } else {
            // Un-sliced falls off
            if (f.y > CANVAS_HEIGHT + f.radius && f.vy > 0) {
                fruits.splice(i, 1);
                if (!f.isBomb && !gameOver) {
                    lives--;
                    updateLivesUI();
                    if (lives <= 0) {
                        endGame();
                    }
                }
            }
        }
    }

    // Particles update
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Swipe Trail update
    swipeTrail.forEach(pt => pt.age--);
    swipeTrail = swipeTrail.filter(pt => pt.age > 0);

    // Spawn waves
    spawnTimer++;
    if (spawnTimer >= 100) {
        spawnWave();
        spawnTimer = 0;
    }
}

// Render Loops
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background stripes/shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Splashes on wood
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw Fruits
    fruits.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);

        if (!f.sliced) {
            // Draw whole fruit
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner gloss
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(-f.radius / 3, -f.radius / 3, f.radius / 3, 0, Math.PI * 2);
            ctx.fill();

            // Bomb details
            if (f.isBomb) {
                // Spark wick
                ctx.strokeStyle = '#e67e22';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -f.radius);
                ctx.quadraticCurveTo(10, -f.radius - 10, 5, -f.radius - 20);
                ctx.stroke();

                // Spark yellow star
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(5, -f.radius - 20, 4, 0, Math.PI*2);
                ctx.fill();
            }
        } else {
            // Sliced Halves
            ctx.rotate(f.sliceAngle);

            // Left half
            ctx.save();
            ctx.translate(-f.halfOffset, 0);
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, Math.PI * 0.5, Math.PI * 1.5);
            ctx.fill();

            // Inner flesh
            ctx.fillStyle = f.innerColor;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius - 3, Math.PI * 0.5, Math.PI * 1.5);
            ctx.fill();
            ctx.restore();

            // Right half
            ctx.save();
            ctx.translate(f.halfOffset, 0);
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, Math.PI * 1.5, Math.PI * 0.5);
            ctx.fill();

            // Inner flesh
            ctx.fillStyle = f.innerColor;
            ctx.beginPath();
            ctx.arc(0, 0, f.radius - 3, Math.PI * 1.5, Math.PI * 0.5);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    });

    // Draw Blade Swipe Trail
    if (swipeTrail.length > 1) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00e5ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < swipeTrail.length; i++) {
            const p1 = swipeTrail[i - 1];
            const p2 = swipeTrail[i];
            const width = (p1.age / 12) * 5; // taper trail
            ctx.lineWidth = Math.max(1, width);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Screens / Overlays
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFE66D';
        ctx.font = '800 36px "Fredoka", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px "Nunito", sans-serif';
        ctx.fillText(`Fruits Sliced: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);

        ctx.fillStyle = '#a0aec0';
        ctx.font = '600 13px "Nunito", sans-serif';
        ctx.fillText('Click / Drag to Try Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);
    } else if (!gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFE66D';
        ctx.font = '800 32px "Fredoka", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('FRUIT SLICER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 15px "Nunito", sans-serif';
        ctx.fillText('Drag / Swipe to slash flying fruits!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('Do NOT slice the black BOMBS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);

        ctx.fillStyle = '#4ECDC4';
        ctx.font = '800 18px "Fredoka", cursive';
        ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
}

// Game Loop coordinator
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event Bindings
function startSwipe(x, y) {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }
    isDrawing = true;
    lastX = x;
    lastY = y;
    swipeTrail.push({ x, y, age: 12 });
}

function moveSwipe(x, y) {
    if (!isDrawing) return;
    swipeTrail.push({ x, y, age: 12 });

    if (swipeTrail.length % 2 === 0) {
        playSound('swoosh');
    }

    checkSlices(lastX, lastY, x, y);
    lastX = x;
    lastY = y;
}

function stopSwipe() {
    isDrawing = false;
}

// Event Listeners (Mouse)
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Translate mouse coordinates to canvas dimensions
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    startSwipe(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    moveSwipe(x, y);
});

window.addEventListener('mouseup', stopSwipe);

// Event Listeners (Touch)
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    startSwipe(x, y);
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    moveSwipe(x, y);
}, { passive: true });

window.addEventListener('touchend', stopSwipe);

// Game Control triggers
function startGame() {
    gameStarted = true;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function endGame() {
    gameOver = true;
    playSound('gameover');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    fruits = [];
    particles = [];
    swipeTrail = [];
    spawnTimer = 0;
    scoreVal.textContent = score;
    updateLivesUI();
    gameOver = false;
    startGame();
}

restartBtn.addEventListener('click', resetGame);

// Kickoff
gameLoop();
