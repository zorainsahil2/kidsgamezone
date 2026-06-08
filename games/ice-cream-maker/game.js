/**
 * KidsGameZone: Ice Cream Maker
 * Ingredient sequencing stacks, recipe matching engines, happy/sad face state triggers, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_ice-cream-maker';

// Elements
const scoreVal = document.getElementById('scoreVal');
const customerCountVal = document.getElementById('customerCountVal');
const highScoreVal = document.getElementById('highScoreVal');
const customerAvatar = document.getElementById('customerAvatar');
const orderRecipeText = document.getElementById('orderRecipeText');
const activeIcecreamBuild = document.getElementById('activeIcecreamBuild');

const clearBtn = document.getElementById('clearBtn');
const serveBtn = document.getElementById('serveBtn');
const ingBtns = document.querySelectorAll('.ing-btn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Ingredients Specs
const FLAVORS = ['vanilla', 'chocolate', 'strawberry', 'mint'];
const BASES = ['waffle-cone', 'paper-cup'];
const TOPPINGS = ['sprinkles', 'chocolate-sauce', 'cherry', 'whipped-cream'];

const AVATARS = ['👧', '👦', '👩', '🧔', '👵', '🦁', '🐱', '🐶'];

// Game State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let currentCustomer = 1;
let gameOver = false;
let gameStarted = false;

// Active Recipe and Build
let activeRecipe = null; // { base, scoops: [], topping }
let activeBuild = { base: null, scoops: [], toppings: [] };

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

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
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
        osc.frequency.setValueAtTime(130, now);
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

// Set display
highScoreVal.textContent = highScore;

// Generate random customer order
function generateOrder() {
    // Pick random base container
    const base = BASES[Math.floor(Math.random() * BASES.length)];

    // Pick 1 or 2 random scoops
    const scoopCount = Math.random() > 0.5 ? 2 : 1;
    const scoops = [];
    for (let i = 0; i < scoopCount; i++) {
        scoops.push(FLAVORS[Math.floor(Math.random() * FLAVORS.length)]);
    }

    // Pick 1 optional topping (75% chance)
    const hasTopping = Math.random() < 0.75;
    const topping = hasTopping ? TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)] : null;

    activeRecipe = { base, scoops, topping };

    // Format speech bubble recipe description text
    let desc = "";
    if (base === 'waffle-cone') desc += "🍦 Cone + ";
    else desc += "🍧 Cup + ";

    if (scoopCount === 2) {
        if (scoops[0] === scoops[1]) {
            desc += `2 Scoops ${capitalize(scoops[0])}`;
        } else {
            desc += `Scoop ${capitalize(scoops[0])} + Scoop ${capitalize(scoops[1])}`;
        }
    } else {
        desc += `Scoop ${capitalize(scoops[0])}`;
    }

    if (topping) {
        desc += ` + ${capitalizeTopping(topping)}`;
    }

    orderRecipeText.textContent = desc;

    // Load random face avatar
    customerAvatar.textContent = AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalizeTopping(t) {
    if (t === 'chocolate-sauce') return 'Chocolate Sauce';
    if (t === 'whipped-cream') return 'Whipped Cream';
    return capitalize(t);
}

// Assemble visual Stacks
function renderBuildStack() {
    activeIcecreamBuild.innerHTML = '';

    // 1. Container Base
    if (activeBuild.base) {
        const baseDiv = document.createElement('div');
        baseDiv.className = `stacked-base ${activeBuild.base === 'waffle-cone' ? 'cone' : 'cup'}`;
        activeIcecreamBuild.appendChild(baseDiv);
    }

    // 2. Scoops
    activeBuild.scoops.forEach((flavor, idx) => {
        const scoopDiv = document.createElement('div');
        scoopDiv.className = `stacked-scoop ${flavor}`;
        // Adjust z-index of layers
        scoopDiv.style.zIndex = idx + 1;
        activeIcecreamBuild.appendChild(scoopDiv);
    });

    // 3. Toppings
    activeBuild.toppings.forEach(top => {
        const topDiv = document.createElement('div');
        topDiv.className = 'stacked-topping';
        let emoji = '✨';
        if (top === 'chocolate-sauce') emoji = '🤎';
        else if (top === 'cherry') emoji = '🍒';
        else if (top === 'whipped-cream') emoji = '🧁';

        topDiv.textContent = emoji;
        activeIcecreamBuild.appendChild(topDiv);
    });
}

// Add items to build stack
function addIngredient(type, value) {
    if (gameOver || !gameStarted) return;
    playSound('click');

    if (type === 'base') {
        // Set base (overrides if already set)
        activeBuild.base = value;
    } else if (type === 'scoop') {
        // Limit max 2 scoops
        if (activeBuild.scoops.length < 2) {
            activeBuild.scoops.push(value);
        }
    } else if (type === 'topping') {
        // Limit max 1 topping
        if (activeBuild.toppings.length < 1) {
            activeBuild.toppings.push(value);
        }
    }

    renderBuildStack();
}

ingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        addIngredient(btn.dataset.type, btn.dataset.val);
    });
});

clearBtn.addEventListener('click', () => {
    playSound('click');
    activeBuild = { base: null, scoops: [], toppings: [] };
    renderBuildStack();
});

// Serve Verification matching logic
function verifyServeOrder() {
    if (gameOver || !gameStarted) return;

    // Check Base
    if (activeBuild.base !== activeRecipe.base) {
        serveResult(false);
        return;
    }

    // Check Scoops (Must contain exact counts regardless of sequence order)
    const reqScoops = [...activeRecipe.scoops].sort();
    const buildScoops = [...activeBuild.scoops].sort();

    if (reqScoops.length !== buildScoops.length) {
        serveResult(false);
        return;
    }

    for (let i = 0; i < reqScoops.length; i++) {
        if (reqScoops[i] !== buildScoops[i]) {
            serveResult(false);
            return;
        }
    }

    // Check Toppings
    const reqTopping = activeRecipe.topping;
    const buildTopping = activeBuild.toppings.length > 0 ? activeBuild.toppings[0] : null;

    if (reqTopping !== buildTopping) {
        serveResult(false);
        return;
    }

    // Passed!
    serveResult(true);
}

function serveResult(correct) {
    if (correct) {
        playSound('correct');
        score += 100;
        scoreVal.textContent = score;
        customerAvatar.textContent = '🤩'; // super happy face
    } else {
        playSound('wrong');
        score = Math.max(0, score - 50);
        scoreVal.textContent = score;
        customerAvatar.textContent = '😢'; // sad face
    }

    // Lock board, transition to next customer after 1s
    gameOver = true; // temporary lock trigger

    setTimeout(() => {
        currentCustomer++;
        if (currentCustomer <= 5) {
            customerCountVal.textContent = currentCustomer;
            activeBuild = { base: null, scoops: [], toppings: [] };
            renderBuildStack();
            generateOrder();
            gameOver = false; // unlock
        } else {
            endGame();
        }
    }, 1100);
}

serveBtn.addEventListener('click', verifyServeOrder);

// Game State Controls
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    currentCustomer = 1;
    scoreVal.textContent = score;
    customerCountVal.textContent = currentCustomer;

    activeBuild = { base: null, scoops: [], toppings: [] };
    renderBuildStack();
    generateOrder();

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameOver = false;
    gameStarted = true;
}

function endGame() {
    gameOver = true;
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

startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
