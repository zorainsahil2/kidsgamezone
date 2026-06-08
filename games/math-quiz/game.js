/**
 * KidsGameZone: Math Quiz Blitz
 * Dynamic difficulty arithmetic generator, color flash feedback, Web Audio chimes, and local storage high scores.
 */

const STORAGE_KEY = 'kgz_highscore_math-quiz';

// DOM Selectors
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const timerVal = document.getElementById('timerVal');
const questionTitle = document.getElementById('questionTitle');
const encouragementText = document.getElementById('encouragementText');
const gameFrame = document.getElementById('gameFrame');
const choiceButtons = document.querySelectorAll('.choice-btn');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

// Game State
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let timeLeft = 30;
let correctCount = 0;
let questionCount = 0; // counts total questions generated
let currentAnswer = null;
let currentChoices = [];
let gameStarted = false;
let gameOver = false;
let timerClock = null;
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
        // High pitch happy ding
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'wrong') {
        // Low pitch buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
    } else if (type === 'gameover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Encourage messages
const praises = [
    "Great job! 🌟",
    "You are a math genius! 🚀",
    "Way to go! 🎉",
    "Super smart! 👍",
    "Awesome answer! 💡",
    "Splendid! ⭐"
];

highScoreVal.textContent = highScore;

// Start Quiz Session
function startQuiz() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    timeLeft = 30;
    correctCount = 0;
    questionCount = 0;
    gameOver = false;
    gameStarted = true;

    scoreVal.textContent = score;
    timerVal.textContent = timeLeft;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    nextQuestion();

    if (timerClock) clearInterval(timerClock);
    timerClock = setInterval(onSecondTick, 1000);
}

function onSecondTick() {
    if (gameOver) return;
    timeLeft--;
    timerVal.textContent = timeLeft;

    if (timeLeft <= 0) {
        endQuiz();
    }
}

// Generate Next Question (Difficulty increases over count)
function nextQuestion() {
    isAcceptingInput = true;
    questionCount++;

    let num1 = 0;
    let num2 = 0;
    let op = '+';
    let answer = 0;

    // Difficulty curve
    if (questionCount <= 3) {
        // Level 1: +/- under 10
        num1 = 1 + Math.floor(Math.random() * 8); // 1-8
        num2 = 1 + Math.floor(Math.random() * 8); // 1-8
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '-') {
            // No negative answers for kids
            if (num1 < num2) {
                const temp = num1;
                num1 = num2;
                num2 = temp;
            }
            answer = num1 - num2;
        } else {
            answer = num1 + num2;
        }
    }
    else if (questionCount <= 7) {
        // Level 2: +/- under 20
        num1 = 5 + Math.floor(Math.random() * 14); // 5-18
        num2 = 2 + Math.floor(Math.random() * 10); // 2-11
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '-') {
            if (num1 < num2) {
                const temp = num1;
                num1 = num2;
                num2 = temp;
            }
            answer = num1 - num2;
        } else {
            answer = num1 + num2;
        }
    }
    else {
        // Level 3: * under 12
        num1 = 2 + Math.floor(Math.random() * 10); // 2-11
        num2 = 2 + Math.floor(Math.random() * 10); // 2-11
        op = '×';
        answer = num1 * num2;
    }

    currentAnswer = answer;

    // Display equation text
    const displayOp = op === '*' ? '×' : op;
    questionTitle.textContent = `${num1} ${displayOp} ${num2} = ?`;

    // Generate choices options (3 wrong close distractors)
    let choices = [answer];
    while (choices.length < 4) {
        const offset = -5 + Math.floor(Math.random() * 11); // -5 to +5
        const candidate = answer + offset;
        if (candidate > 0 && !choices.includes(candidate)) {
            choices.push(candidate);
        }
    }

    // Shuffle options
    choices.sort(() => Math.random() - 0.5);
    currentChoices = choices;

    // Bind choices to buttons
    choiceButtons.forEach((btn, idx) => {
        btn.textContent = choices[idx];
        btn.className = `choice-btn ${getOptionColorClass(idx)}`;
    });
}

function getOptionColorClass(idx) {
    if (idx === 0) return 'option-purple';
    if (idx === 1) return 'option-teal';
    if (idx === 2) return 'option-orange';
    return 'option-pink';
}

// Choice submission check
choiceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isAcceptingInput || gameOver) return;
        isAcceptingInput = false;

        const idx = parseInt(btn.getAttribute('data-idx'));
        const submitted = currentChoices[idx];

        if (submitted === currentAnswer) {
            // Correct!
            correctCount++;
            score = correctCount * 10;
            scoreVal.textContent = score;
            playSound('correct');

            btn.classList.add('correct-glow');
            const qContainer = document.querySelector('.question-container');
            qContainer.classList.add('flash-correct');
            encouragementText.textContent = praises[Math.floor(Math.random() * praises.length)];

            setTimeout(() => {
                btn.classList.remove('correct-glow');
                qContainer.classList.remove('flash-correct');
                encouragementText.textContent = '';
                nextQuestion();
            }, 600);
        } else {
            // Wrong
            playSound('wrong');
            btn.classList.add('wrong-glow');
            const qContainer = document.querySelector('.question-container');
            qContainer.classList.add('flash-wrong');
            encouragementText.textContent = `Correct was: ${currentAnswer} 💡`;

            // Glow correct button to help learning
            choiceButtons.forEach(b => {
                if (parseInt(b.textContent) === currentAnswer) {
                    b.classList.add('correct-glow');
                }
            });

            setTimeout(() => {
                btn.classList.remove('wrong-glow');
                choiceButtons.forEach(b => b.classList.remove('correct-glow'));
                qContainer.classList.remove('flash-wrong');
                encouragementText.textContent = '';
                nextQuestion();
            }, 900);
        }
    });
});

function endQuiz() {
    gameOver = true;
    clearInterval(timerClock);
    playSound('gameover');

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// Action listeners
startBtn.addEventListener('click', startQuiz);
failRestartBtn.addEventListener('click', startQuiz);
