/**
 * KidsGameZone: Alphabet Adventure
 * A-Z emoji database matching, progress dots tracer, hints overlays,
 * first-attempt scoring, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_alphabet-adventure';

// Alphabet Dataset (26 Letters)
const alphabet = [
    { letter: 'A', correctLabel: 'apple', correctEmoji: '🍎', hint: 'A is for Apple 🍎', choices: [
        { emoji: '🍎', label: 'apple' }, { emoji: '🍌', label: 'banana' }, { emoji: '🥕', label: 'carrot' }, { emoji: '🍩', label: 'donut' }
    ]},
    { letter: 'B', correctLabel: 'bee', correctEmoji: '🐝', hint: 'B is for Bee 🐝', choices: [
        { emoji: '🍎', label: 'apple' }, { emoji: '🐝', label: 'bee' }, { emoji: '🐱', label: 'cat' }, { emoji: '🐶', label: 'dog' }
    ]},
    { letter: 'C', correctLabel: 'cat', correctEmoji: '🐱', hint: 'C is for Cat 🐱', choices: [
        { emoji: '🦊', label: 'fox' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🐱', label: 'cat' }, { emoji: '🐴', label: 'horse' }
    ]},
    { letter: 'D', correctLabel: 'dog', correctEmoji: '🐶', hint: 'D is for Dog 🐶', choices: [
        { emoji: '🍉', label: 'watermelon' }, { emoji: '🍓', label: 'strawberry' }, { emoji: '🍊', label: 'orange' }, { emoji: '🐶', label: 'dog' }
    ]},
    { letter: 'E', correctLabel: 'egg', correctEmoji: '🥚', hint: 'E is for Egg 🥚', choices: [
        { emoji: '🥚', label: 'egg' }, { emoji: '🍒', label: 'cherry' }, { emoji: '🍋', label: 'lemon' }, { emoji: '🍍', label: 'pineapple' }
    ]},
    { letter: 'F', correctLabel: 'fox', correctEmoji: '🦊', hint: 'F is for Fox 🦊', choices: [
        { emoji: '🍌', label: 'banana' }, { emoji: '🦊', label: 'fox' }, { emoji: '🧅', label: 'onion' }, { emoji: '🥔', label: 'potato' }
    ]},
    { letter: 'G', correctLabel: 'grapes', correctEmoji: '🍇', hint: 'G is for Grapes 🍇', choices: [
        { emoji: '🍐', label: 'pear' }, { emoji: '🍑', label: 'peach' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🥝', label: 'kiwi' }
    ]},
    { letter: 'H', correctLabel: 'horse', correctEmoji: '🐴', hint: 'H is for Horse 🐴', choices: [
        { emoji: '🍉', label: 'watermelon' }, { emoji: '🥕', label: 'carrot' }, { emoji: '🐴', label: 'horse' }, { emoji: '🍦', label: 'ice cream' }
    ]},
    { letter: 'I', correctLabel: 'ice cream', correctEmoji: '🍦', hint: 'I is for Ice Cream 🍦', choices: [
        { emoji: '🍦', label: 'ice cream' }, { emoji: '🍊', label: 'orange' }, { emoji: '🍓', label: 'strawberry' }, { emoji: '🍒', label: 'cherry' }
    ]},
    { letter: 'J', correctLabel: 'juice', correctEmoji: '🧃', hint: 'J is for Juice 🧃', choices: [
        { emoji: '🍌', label: 'banana' }, { emoji: '🧅', label: 'onion' }, { emoji: '🍍', label: 'pineapple' }, { emoji: '🧃', label: 'juice' }
    ]},
    { letter: 'K', correctLabel: 'kiwi', correctEmoji: '🥝', hint: 'K is for Kiwi 🥝', choices: [
        { emoji: '🥝', label: 'kiwi' }, { emoji: '🍎', label: 'apple' }, { emoji: '🐝', label: 'bee' }, { emoji: '🐱', label: 'cat' }
    ]},
    { letter: 'L', correctLabel: 'lemon', correctEmoji: '🍋', hint: 'L is for Lemon 🍋', choices: [
        { emoji: '🍋', label: 'lemon' }, { emoji: '🥚', label: 'egg' }, { emoji: '🦊', label: 'fox' }, { emoji: '🍇', label: 'grapes' }
    ]},
    { letter: 'M', correctLabel: 'monkey', correctEmoji: '🐒', hint: 'M is for Monkey 🐒', choices: [
        { emoji: '🐒', label: 'monkey' }, { emoji: '🐱', label: 'cat' }, { emoji: '🐶', label: 'dog' }, { emoji: '🦊', label: 'fox' }
    ]},
    { letter: 'N', correctLabel: 'nut', correctEmoji: '🥜', hint: 'N is for Nut 🥜', choices: [
        { emoji: '🍎', label: 'apple' }, { emoji: '🍉', label: 'watermelon' }, { emoji: '🥜', label: 'nut' }, { emoji: '🍊', label: 'orange' }
    ]},
    { letter: 'O', correctLabel: 'orange', correctEmoji: '🍊', hint: 'O is for Orange 🍊', choices: [
        { emoji: '🍊', label: 'orange' }, { emoji: '🍋', label: 'lemon' }, { emoji: '🍒', label: 'cherry' }, { emoji: '🍌', label: 'banana' }
    ]},
    { letter: 'P', correctLabel: 'pineapple', correctEmoji: '🍍', hint: 'P is for Pineapple 🍍', choices: [
        { emoji: '🍍', label: 'pineapple' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🍓', label: 'strawberry' }, { emoji: '🍐', label: 'pear' }
    ]},
    { letter: 'Q', correctLabel: 'queen', correctEmoji: '👑', hint: 'Q is for Queen 👑', choices: [
        { emoji: '🦊', label: 'fox' }, { emoji: '👑', label: 'queen' }, { emoji: '🐱', label: 'cat' }, { emoji: '🐴', label: 'horse' }
    ]},
    { letter: 'R', correctLabel: 'robot', correctEmoji: '🤖', hint: 'R is for Robot 🤖', choices: [
        { emoji: '🍦', label: 'ice cream' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🤖', label: 'robot' }, { emoji: '🐝', label: 'bee' }
    ]},
    { letter: 'S', correctLabel: 'strawberry', correctEmoji: '🍓', hint: 'S is for Strawberry 🍓', choices: [
        { emoji: '🍓', label: 'strawberry' }, { emoji: '🍉', label: 'watermelon' }, { emoji: '🍒', label: 'cherry' }, { emoji: '🍍', label: 'pineapple' }
    ]},
    { letter: 'T', correctLabel: 'T-Rex', correctEmoji: '🦖', hint: 'T is for T-Rex 🦖', choices: [
        { emoji: '🦊', label: 'fox' }, { emoji: '🥚', label: 'egg' }, { emoji: '🦖', label: 'T-Rex' }, { emoji: '🐴', label: 'horse' }
    ]},
    { letter: 'U', correctLabel: 'umbrella', correctEmoji: '☂️', hint: 'U is for Umbrella ☂️', choices: [
        { emoji: '☂️', label: 'umbrella' }, { emoji: '🍌', label: 'banana' }, { emoji: '🍋', label: 'lemon' }, { emoji: '🥝', label: 'kiwi' }
    ]},
    { letter: 'V', correctLabel: 'violin', correctEmoji: '🎻', hint: 'V is for Violin 🎻', choices: [
        { emoji: '🍇', label: 'grapes' }, { emoji: '🧃', label: 'juice' }, { emoji: '🎻', label: 'violin' }, { emoji: '🥜', label: 'nut' }
    ]},
    { letter: 'W', correctLabel: 'watermelon', correctEmoji: '🍉', hint: 'W is for Watermelon 🍉', choices: [
        { emoji: '🍉', label: 'watermelon' }, { emoji: '🍊', label: 'orange' }, { emoji: '🍓', label: 'strawberry' }, { emoji: '🍒', label: 'cherry' }
    ]},
    { letter: 'X', correctLabel: 'X-ray', correctEmoji: '🦴', hint: 'X is for X-ray 🦴', choices: [
        { emoji: '🥚', label: 'egg' }, { emoji: '🐝', label: 'bee' }, { emoji: '🦊', label: 'fox' }, { emoji: '🦴', label: 'X-ray' }
    ]},
    { letter: 'Y', correctLabel: 'yo-yo', correctEmoji: '🪀', hint: 'Y is for Yo-Yo 🪀', choices: [
        { emoji: '🍋', label: 'lemon' }, { emoji: '🪀', label: 'yo-yo' }, { emoji: '🍇', label: 'grapes' }, { emoji: '🍍', label: 'pineapple' }
    ]},
    { letter: 'Z', correctLabel: 'zebra', correctEmoji: '🦓', hint: 'Z is for Zebra 🦓', choices: [
        { emoji: '🐱', label: 'cat' }, { emoji: '🦊', label: 'fox' }, { emoji: '🦓', label: 'zebra' }, { emoji: '🐴', label: 'horse' }
    ]}
];

// DOM elements
const targetLetter = document.getElementById('targetLetter');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const progressTrack = document.getElementById('progressTrack');
const hintBtn = document.getElementById('hintBtn');
const hintText = document.getElementById('hintText');
const restartBtn = document.getElementById('restartBtn');
const letterBox = document.getElementById('letterBox');
const choiceCards = document.querySelectorAll('.choice-card');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Game State variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let currentIdx = 0;
let firstTryThisLetter = true;
let gameStarted = false;
let gameOver = false;
let isAcceptingInput = false;

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

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // C6
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    }
}

highScoreVal.textContent = highScore;

// Start Game Loop
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    currentIdx = 0;
    gameOver = false;
    gameStarted = true;

    scoreVal.textContent = score;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    loadLetter();
}

// Load current letter options
function loadLetter() {
    isAcceptingInput = true;
    firstTryThisLetter = true;
    hintText.textContent = '';

    const data = alphabet[currentIdx];
    targetLetter.textContent = data.letter;

    // Build progress track dots
    progressTrack.innerHTML = '';
    for (let i = 0; i < 26; i++) {
        const dot = document.createElement('div');
        dot.className = 'prog-dot';
        if (i < currentIdx) {
            dot.classList.add('passed');
        } else if (i === currentIdx) {
            dot.classList.add('active');
        }
        progressTrack.appendChild(dot);
    }

    // Shuffle options array for display
    let choices = [...data.choices];
    choices.sort(() => Math.random() - 0.5);

    // Bind choices details
    choiceCards.forEach((card, idx) => {
        const item = choices[idx];
        card.querySelector('.emoji').textContent = item.emoji;
        card.querySelector('.label').textContent = item.label;
        card.className = 'choice-card';
        card.setAttribute('data-label', item.label);
    });
}

// Match logic trigger
choiceCards.forEach(card => {
    card.addEventListener('click', () => {
        if (!isAcceptingInput || gameOver) return;

        const data = alphabet[currentIdx];
        const selectedLabel = card.getAttribute('data-label');

        if (selectedLabel === data.correctLabel) {
            // Correct answer
            isAcceptingInput = false;
            playSound('correct');
            card.classList.add('correct');
            letterBox.classList.add('bounce-success');

            if (firstTryThisLetter) {
                score++;
                scoreVal.textContent = score;
            }

            setTimeout(() => {
                card.classList.remove('correct');
                letterBox.classList.remove('bounce-success');

                if (currentIdx < 25) {
                    currentIdx++;
                    loadLetter();
                } else {
                    endGame();
                }
            }, 800);
        } else {
            // Wrong answer
            playSound('wrong');
            card.classList.add('wrong');
            letterBox.classList.add('shake-error');
            firstTryThisLetter = false;

            isAcceptingInput = false;
            setTimeout(() => {
                card.classList.remove('wrong');
                letterBox.classList.remove('shake-error');
                isAcceptingInput = true;
            }, 800);
        }
    });
});

// Hint Trigger
hintBtn.addEventListener('click', () => {
    if (gameOver || !gameStarted) return;
    const data = alphabet[currentIdx];
    hintText.textContent = data.hint;
});

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

// Action hooks
startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
