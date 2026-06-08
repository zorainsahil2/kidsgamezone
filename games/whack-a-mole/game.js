/**
 * KidsGameZone: Whack-A-Mole
 * Dynamic pop-ups, golden bonus targets, bomb hazards, retro Audio context synth, and canvas-free floating text FX.
 */

const STORAGE_KEY = 'kgz_highscore_whack-a-mole';

// Elements
const holes = document.querySelectorAll('.hole-card');
const scoreVal = document.getElementById('scoreVal');
const timeVal = document.getElementById('timeVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreVal = document.getElementById('finalScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');

// State
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let timeLeft = 30;
let gameInterval = null;
let timerInterval = null;
let activeMoles = new Map(); // holeIndex -> {timeoutId, type}
let isPlaying = false;

// Audio Synth
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

    if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'whack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'gold') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'buzzer') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(120, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Init display
highScoreVal.textContent = highScore;

// Floating Point FX
function spawnFloatingText(parentEl, text, isNegative = false) {
    const floating = document.createElement('div');
    floating.textContent = text;
    floating.style.position = 'absolute';
    floating.style.top = '30%';
    floating.style.left = '50%';
    floating.style.transform = 'translate(-50%, -50%)';
    floating.style.fontFamily = '"Fredoka", cursive';
    floating.style.fontSize = '1.3rem';
    floating.style.fontWeight = '800';
    floating.style.color = isNegative ? '#e53e3e' : '#ecc94b';
    floating.style.textShadow = '2px 2px 0px #000';
    floating.style.zIndex = '5';
    floating.style.pointerEvents = 'none';
    floating.style.transition = 'all 0.6s ease';

    parentEl.appendChild(floating);

    // Trigger animation frame
    setTimeout(() => {
        floating.style.top = '0%';
        floating.style.opacity = '0';
    }, 10);

    setTimeout(() => {
        floating.remove();
    }, 600);
}

// Pick random vacant hole
function getRandomHole() {
    const vacantIndices = [];
    holes.forEach((_, idx) => {
        if (!activeMoles.has(idx)) {
            vacantIndices.push(idx);
        }
    });

    if (vacantIndices.length === 0) return null;
    const rand = Math.floor(Math.random() * vacantIndices.length);
    return vacantIndices[rand];
}

// Spawn Moles
function spawn() {
    if (!isPlaying) return;

    const holeIndex = getRandomHole();
    if (holeIndex === null) return;

    const holeCard = holes[holeIndex];
    const moleEl = holeCard.querySelector('.mole');

    // Decide type
    // 70% normal mole, 15% gold mole, 15% bomb
    const roll = Math.random();
    let type = 'normal';
    let content = '🐹';

    if (roll < 0.15) {
        type = 'gold';
        content = '👑';
    } else if (roll < 0.3) {
        type = 'bomb';
        content = '💣';
    }

    moleEl.textContent = content;
    moleEl.className = `mole up ${type}`;
    playSound('pop');

    // progressive speed based on time left
    let displayDuration = 1000;
    if (timeLeft < 10) {
        displayDuration = 650;
    } else if (timeLeft < 20) {
        displayDuration = 800;
    }
    if (type === 'gold') displayDuration *= 0.6; // Gold retreats much faster

    const timeoutId = setTimeout(() => {
        retract(holeIndex);
    }, displayDuration);

    activeMoles.set(holeIndex, { timeoutId, type });
}

function retract(holeIndex) {
    if (activeMoles.has(holeIndex)) {
        const { timeoutId } = activeMoles.get(holeIndex);
        clearTimeout(timeoutId);
        activeMoles.delete(holeIndex);
    }
    const holeCard = holes[holeIndex];
    const moleEl = holeCard.querySelector('.mole');
    moleEl.classList.remove('up');
}

// Whack Action
function whack(holeCard, holeIndex) {
    if (!isPlaying) return;

    if (activeMoles.has(holeIndex)) {
        const { type } = activeMoles.get(holeIndex);
        retract(holeIndex);

        if (type === 'normal') {
            score += 10;
            playSound('whack');
            spawnFloatingText(holeCard, '+10', false);
        } else if (type === 'gold') {
            score += 30;
            playSound('gold');
            spawnFloatingText(holeCard, '+30', false);
        } else if (type === 'bomb') {
            score = Math.max(0, score - 20);
            playSound('wrong');
            spawnFloatingText(holeCard, '-20', true);
        }
        scoreVal.textContent = score;
    } else {
        // Miss whack penalty
        score = Math.max(0, score - 5);
        scoreVal.textContent = score;
        playSound('wrong');
        spawnFloatingText(holeCard, '-5', true);
    }
}

// Bind Grid Clicks
holes.forEach((hole, index) => {
    hole.addEventListener('mousedown', () => {
        whack(hole, index);
    });
    // touch equivalent
    hole.addEventListener('touchstart', (e) => {
        e.preventDefault(); // prevent double triggers on mobile
        whack(hole, index);
    });
});

// Timer Logic
function updateTimer() {
    timeLeft--;
    timeVal.textContent = timeLeft;

    if (timeLeft <= 0) {
        endGame();
    }
}

// Game Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    score = 0;
    timeLeft = 30;
    scoreVal.textContent = score;
    timeVal.textContent = timeLeft;

    // Reset modals
    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    // Clean active moles
    activeMoles.forEach((_, idx) => retract(idx));
    activeMoles.clear();

    isPlaying = true;

    // Spawn Loop
    let spawnRate = 850;
    gameInterval = setInterval(() => {
        spawn();
        // progressively lower interval (done manually on tick)
    }, spawnRate);

    // Clock Timer Loop
    timerInterval = setInterval(updateTimer, 1000);
}

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    playSound('buzzer');

    // High Score preservation
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    // Modal populate
    finalScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// Event hooks
startBtn.addEventListener('click', startGame);
overlayRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
