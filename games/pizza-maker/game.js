/**
 * KidsGameZone: Pizza Maker
 * Canvas pizza base drawing, coordinate placement maps, order recipe set checks, timer loops, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_pizza-maker';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const orderCountVal = document.getElementById('orderCountVal');
const timerVal = document.getElementById('timerVal');
const highScoreVal = document.getElementById('highScoreVal');
const requiredToppingsText = document.getElementById('requiredToppingsText');

const clearBtn = document.getElementById('clearBtn');
const serveBtn = document.getElementById('serveBtn');
const shelfItems = document.querySelectorAll('.toppings-shelf .shelf-item');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Ingredients Specs
const TOPPING_TYPES = ['sauce', 'cheese', 'pepperoni', 'mushroom', 'peppers', 'olives'];

// Game State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let currentOrderCount = 1;
let timeLeft = 30;
let gameOver = false;
let gameStarted = false;

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

    if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Config
const PIZZA_CENTER_X = 150;
const PIZZA_CENTER_Y = 150;
const PIZZA_RADIUS = 105;

// Active placement coordinates
let placedToppings = []; // list of {x, y, type}
let activeToppingType = 'sauce'; // default select
let requiredToppings = []; // set of names

let timerInterval = null;

highScoreVal.textContent = highScore;

// Generate random target recipe
function generateOrderRecipe() {
    requiredToppings = [];

    // Sauce and Cheese included 85% of time
    if (Math.random() < 0.85) requiredToppings.push('sauce');
    if (Math.random() < 0.85) requiredToppings.push('cheese');

    // Pick 1 to 3 random toppings from remaining
    const pool = ['pepperoni', 'mushroom', 'peppers', 'olives'];
    const count = 1 + Math.floor(Math.random() * 3); // 1 to 3 extra toppings
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < count; i++) {
        requiredToppings.push(pool[i]);
    }

    // Filter unique
    requiredToppings = Array.from(new Set(requiredToppings));

    // Update UI card description
    requiredToppingsText.textContent = requiredToppings.map(t => capitalize(t)).join(', ');
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Select shelf toppings
function selectToppingShelf(type) {
    activeToppingType = type;
    shelfItems.forEach(item => {
        if (item.dataset.topping === type) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

shelfItems.forEach(item => {
    item.addEventListener('click', () => {
        selectToppingShelf(item.dataset.topping);
    });
});

// Canvas placements click handlers
function handlePlacementClick(clickX, clickY) {
    if (gameOver || !gameStarted) return;

    // Check if within circular pizza dough boundary range
    const dist = Math.sqrt((clickX - PIZZA_CENTER_X) ** 2 + (clickY - PIZZA_CENTER_Y) ** 2);
    if (dist > PIZZA_RADIUS - 8) return; // out of base boundary

    playSound('tap');

    // Limit maximum toppings on pizza base (keep from cluttering)
    if (placedToppings.length < 90) {
        placedToppings.push({
            x: clickX,
            y: clickY,
            type: activeToppingType
        });
    }

    drawPizza();
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    handlePlacementClick(clickX, clickY);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    handlePlacementClick(clickX, clickY);
}, { passive: false });

clearBtn.addEventListener('click', () => {
    playSound('tap');
    placedToppings = [];
    drawPizza();
});

// Renderer drawing helper
function drawPizza() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wood table board base circle
    ctx.fillStyle = '#b7791f';
    ctx.beginPath();
    ctx.arc(PIZZA_CENTER_X, PIZZA_CENTER_Y, PIZZA_RADIUS + 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#744210';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw Pizza Crust Golden Dough
    ctx.fillStyle = '#fbd38d';
    ctx.beginPath();
    ctx.arc(PIZZA_CENTER_X, PIZZA_CENTER_Y, PIZZA_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // inner sauce base outline
    ctx.strokeStyle = '#edd5be';
    ctx.lineWidth = 12;
    ctx.stroke();

    // 1. Draw placed sauce toppings (drawn first in order)
    placedToppings.forEach(t => {
        if (t.type === 'sauce') {
            ctx.fillStyle = '#e53e3e'; // red sauce blob
            ctx.beginPath();
            ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 2. Draw cheese toppings
    placedToppings.forEach(t => {
        if (t.type === 'cheese') {
            ctx.save();
            ctx.strokeStyle = '#ecc94b'; // yellow cheese shred line
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(t.x - 6, t.y - 2);
            ctx.lineTo(t.x + 6, t.y + 2);
            ctx.moveTo(t.x - 2, t.y + 4);
            ctx.lineTo(t.x + 4, t.y - 4);
            ctx.stroke();
            ctx.restore();
        }
    });

    // 3. Draw solid ingredients pepperoni, mushrooms, peppers, olives
    placedToppings.forEach(t => {
        ctx.save();
        if (t.type === 'pepperoni') {
            ctx.fillStyle = '#c53030';
            ctx.strokeStyle = '#742a2a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // red fat spots
            ctx.fillStyle = '#9b2c2c';
            ctx.fillRect(t.x - 3, t.y - 3, 2, 2);
            ctx.fillRect(t.x + 2, t.y + 1, 2, 2);
        } else if (t.type === 'mushroom') {
            ctx.fillStyle = '#cbd5e0';
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 1;
            // Draw simple mushroom cap + stem
            ctx.beginPath();
            ctx.arc(t.x, t.y, 7, Math.PI, 0); // cap
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // stem
            ctx.fillRect(t.x - 2, t.y, 4, 6);
        } else if (t.type === 'peppers') {
            ctx.strokeStyle = '#48bb78'; // green pepper ring segment
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (t.type === 'olives') {
            ctx.strokeStyle = '#1a202c'; // black olive ring
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });
}

// Deliver click check order accuracy
function verifyPizzaServe() {
    if (gameOver || !gameStarted) return;

    // Check unique set of placed toppings matching recipe set
    const placedSet = new Set(placedToppings.map(t => t.type));
    const reqSet = new Set(requiredToppings);

    let match = true;

    // 1. All required toppings must exist on placed pizza
    reqSet.forEach(t => {
        if (!placedSet.has(t)) {
            match = false;
        }
    });

    // 2. No un-required topping can exist on placed pizza
    placedSet.forEach(t => {
        if (!reqSet.has(t)) {
            match = false;
        }
    });

    // 3. Minimum counts check (must have placed at least 1 item for each if required)
    if (match) {
        reqSet.forEach(t => {
            const count = placedToppings.filter(item => item.type === t).length;
            if (count < 1) match = false;
        });
    }

    deliverResult(match);
}

function deliverResult(correct) {
    clearInterval(timerInterval);

    if (correct) {
        playSound('correct');
        score += 100;
        scoreVal.textContent = score;
    } else {
        playSound('wrong');
        score = Math.max(0, score - 50);
        scoreVal.textContent = score;
    }

    gameOver = true; // lock

    setTimeout(() => {
        currentOrderCount++;
        if (currentOrderCount <= 5) {
            orderCountVal.textContent = currentOrderCount;
            placedToppings = [];
            drawPizza();
            generateOrderRecipe();
            resetTimer();
            gameOver = false; // unlock
        } else {
            endGame();
        }
    }, 1100);
}

function resetTimer() {
    timeLeft = 30;
    timerVal.textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerVal.textContent = timeLeft;
        if (timeLeft <= 0) {
            deliverResult(false); // timeout wrong penalty
        }
    }, 1000);
}

// State Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    currentOrderCount = 1;
    scoreVal.textContent = score;
    orderCountVal.textContent = currentOrderCount;

    placedToppings = [];
    drawPizza();
    generateOrderRecipe();

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    selectToppingShelf('sauce');
    resetTimer();

    gameOver = false;
    gameStarted = true;
}

function endGame() {
    gameOver = true;
    clearInterval(timerInterval);
    playSound('win');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

serveBtn.addEventListener('click', verifyPizzaServe);
startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start initial table drawing
drawPizza();
