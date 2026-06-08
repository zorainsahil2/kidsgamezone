/**
 * KidsGameZone: Memory Match (Card Flipping Memory Game)
 * High-performance 3D flip card interactions, matching validation loops, high score saving, and web audio sounds.
 */

const STORAGE_KEY = 'kgz_highscore_memory-match-cards';

// List of cute animal emojis (8 pairs)
const EMOJIS = ['🦊', '🐯', '🦁', '🐸', '🐵', '🐼', '🐨', '🐷'];

// Elements
const cardsGrid = document.getElementById('cardsGrid');
const scoreVal = document.getElementById('scoreVal');
const movesVal = document.getElementById('movesVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modal
const winOverlay = document.getElementById('winOverlay');
const finalMovesVal = document.getElementById('finalMovesVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');

// State
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let boardLocked = false;
let highScore = localStorage.getItem(STORAGE_KEY) || null;

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

    if (type === 'flip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'match') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'mismatch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(147, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'victory') {
        // Joyful fanfare arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const oscN = audioCtx.createOscillator();
            const gainN = audioCtx.createGain();
            oscN.connect(gainN);
            gainN.connect(audioCtx.destination);
            oscN.type = 'sine';
            oscN.frequency.setValueAtTime(freq, now + idx * 0.12);
            gainN.gain.setValueAtTime(0.1, now + idx * 0.12);
            gainN.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);
            oscN.start(now + idx * 0.12);
            oscN.stop(now + idx * 0.12 + 0.3);
        });
    }
}

// Display high score
function updateHighScoreUI() {
    if (highScore) {
        highScoreVal.textContent = `${highScore} moves`;
        overlayHighScoreVal.textContent = `${highScore} moves`;
    } else {
        highScoreVal.textContent = '--';
        overlayHighScoreVal.textContent = '--';
    }
}
updateHighScoreUI();

// Shuffle Cards Utility
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize / Build Grid
function initGame() {
    // Lock board until initialization finishes
    boardLocked = true;
    matchedPairs = 0;
    moves = 0;
    flippedCards = [];
    scoreVal.textContent = '0';
    movesVal.textContent = '0';
    winOverlay.classList.remove('active');

    // Create 16-card set (8 pairs)
    const deck = [...EMOJIS, ...EMOJIS];
    shuffle(deck);

    // Render cards
    cardsGrid.innerHTML = '';
    cards = deck.map((emoji, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.emoji = emoji;
        cardEl.dataset.index = index;

        cardEl.innerHTML = `
            <div class="card-back">?</div>
            <div class="card-front">${emoji}</div>
        `;

        cardEl.addEventListener('click', () => handleCardClick(cardEl));
        cardEl.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent double triggers on mobile browsers
            handleCardClick(cardEl);
        });

        cardsGrid.appendChild(cardEl);
        return cardEl;
    });

    boardLocked = false;
}

// Flip trigger handler
function handleCardClick(cardEl) {
    if (boardLocked) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    playSound('flip');
    cardEl.classList.add('flipped');
    flippedCards.push(cardEl);

    if (flippedCards.length === 2) {
        moves++;
        movesVal.textContent = moves;
        checkMatch();
    }
}

// Matching rules checks
function checkMatch() {
    boardLocked = true;
    const [card1, card2] = flippedCards;
    const emoji1 = card1.dataset.emoji;
    const emoji2 = card2.dataset.emoji;

    if (emoji1 === emoji2) {
        // It's a MATCH!
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            scoreVal.textContent = matchedPairs * 10;
            playSound('match');

            flippedCards = [];
            boardLocked = false;

            // Check Win condition (8 pairs)
            if (matchedPairs === EMOJIS.length) {
                endGame();
            }
        }, 300);
    } else {
        // No match
        setTimeout(() => {
            card1.classList.add('shake');
            card2.classList.add('shake');
            playSound('mismatch');
        }, 200);

        setTimeout(() => {
            card1.classList.remove('flipped', 'shake');
            card2.classList.remove('flipped', 'shake');
            flippedCards = [];
            boardLocked = false;
        }, 1000);
    }
}

// End / Restart
function endGame() {
    playSound('victory');
    finalMovesVal.textContent = moves;

    // Check if new record (Lower is better!)
    if (highScore === null || moves < parseInt(highScore)) {
        highScore = moves;
        localStorage.setItem(STORAGE_KEY, highScore);
        updateHighScoreUI();
    }

    winOverlay.classList.add('active');
}

// Event hooks
restartBtn.addEventListener('click', initGame);
overlayRestartBtn.addEventListener('click', initGame);

// Launch
initGame();
