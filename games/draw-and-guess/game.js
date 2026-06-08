/**
 * KidsGameZone: Draw & Guess
 * Freehand canvas doodle loop, brush size toggles, color palettes,
 * 60s countdown timer, self-rating overlays, sessionStorage gallery caching, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_draw-and-guess';
const GALLERY_KEY = 'kgz_draw_gallery';

// 16 Kid-friendly Colors
const paletteColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#06b6d4', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
    '#d946ef', '#ec4899', '#f43f5e', '#78350f'
];

// Emojis/Words Prompt list (20 items)
const words = [
    'Tree', 'House', 'Car', 'Flower', 'Cat', 'Dog', 'Star', 'Sun', 'Fish', 'Bird', 
    'Boat', 'Bike', 'Ice Cream', 'Smile', 'Cake', 'Apple', 'Butterfly', 'Balloon', 'Hat', 'Book'
];

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const timerVal = document.getElementById('timerVal');
const promptWord = document.getElementById('promptWord');
const ratingWord = document.getElementById('ratingWord');
const paletteGrid = document.getElementById('paletteGrid');
const galleryStrip = document.getElementById('galleryStrip');

// Tools & Brush sizes
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const sizeSm = document.getElementById('size-sm');
const sizeMd = document.getElementById('size-md');
const sizeLg = document.getElementById('size-lg');
const clearBtn = document.getElementById('clearBtn');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const ratingOverlay = document.getElementById('ratingOverlay');
const thumbsUpBtn = document.getElementById('thumbsUpBtn');
const thumbsDownBtn = document.getElementById('thumbsDownBtn');

// State Configs
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let timeLeft = 60;
let currentWord = '';
let gameStarted = false;
let gameOver = false;
let isDrawing = false;
let activeTool = 'pencil';
let brushSize = 8;
let activeColor = '#ef4444';
let lastX = 0;
let lastY = 0;
let timerClock = null;

// Audio Configuration
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let brushSoundOsc = null;
let brushSoundGain = null;

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
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'yes') {
        // Melodic success arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'no') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

function startBrushSound() {
    if (!audioCtx || brushSoundOsc) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    brushSoundOsc = audioCtx.createOscillator();
    brushSoundGain = audioCtx.createGain();
    brushSoundOsc.connect(brushSoundGain);
    brushSoundGain.connect(audioCtx.destination);

    brushSoundOsc.type = 'sine';
    brushSoundOsc.frequency.setValueAtTime(140, audioCtx.currentTime); // soft slide whistle
    brushSoundGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    brushSoundOsc.start();
}

function stopBrushSound() {
    if (brushSoundOsc) {
        try {
            brushSoundOsc.stop();
        } catch(e){}
        brushSoundOsc = null;
        brushSoundGain = null;
    }
}

// Clear canvas base
function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initialize palette swatch DOMs
paletteColors.forEach((color, idx) => {
    const swatch = document.createElement('div');
    swatch.className = `color-swatch ${idx === 0 ? 'selected' : ''}`;
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        activeColor = color;
        playSound('click');
    });
    paletteGrid.appendChild(swatch);
});

// Render Gallery Cache thumbnails
function renderGallery() {
    galleryStrip.innerHTML = '';
    const cache = sessionStorage.getItem(GALLERY_KEY);
    if (!cache) {
        galleryStrip.innerHTML = '<div class="empty-gallery">No drawings saved yet!</div>';
        return;
    }

    try {
        const list = JSON.parse(cache);
        if (list.length === 0) {
            galleryStrip.innerHTML = '<div class="empty-gallery">No drawings saved yet!</div>';
            return;
        }
        list.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'gallery-thumb';
            galleryStrip.appendChild(img);
        });
    } catch(e) {
        galleryStrip.innerHTML = '<div class="empty-gallery">No drawings saved yet!</div>';
    }
}

// Push to Gallery cache list
function saveToGalleryCache(dataURL) {
    let list = [];
    const cache = sessionStorage.getItem(GALLERY_KEY);
    if (cache) {
        try { list = JSON.parse(cache); } catch(e){}
    }

    list.unshift(dataURL); // push to front
    if (list.length > 3) list = list.slice(0, 3); // cap at last 3

    sessionStorage.setItem(GALLERY_KEY, JSON.stringify(list));
    renderGallery();
}

// Start Game Flow
highScoreVal.textContent = highScore;
renderGallery();

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    scoreVal.textContent = score;
    gameOver = false;
    gameStarted = true;

    startOverlay.classList.remove('active');
    ratingOverlay.classList.remove('active');

    nextDoodle();
}

function nextDoodle() {
    clearCanvas();
    timeLeft = 60;
    timerVal.textContent = timeLeft;

    // Pick random word
    currentWord = words[Math.floor(Math.random() * words.length)];
    promptWord.textContent = currentWord;

    if (timerClock) clearInterval(timerClock);
    timerClock = setInterval(onSecondTick, 1000);
}

function onSecondTick() {
    if (gameOver) return;
    timeLeft--;
    timerVal.textContent = timeLeft;

    if (timeLeft <= 0) {
        clearInterval(timerClock);
        stopBrushSound();
        isDrawing = false;

        // Prompt self-rating modal
        ratingWord.textContent = currentWord;
        ratingOverlay.classList.add('active');
    }
}

// Drawing Logic Coordinate calculators
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleDown(e) {
    if (gameOver || !gameStarted || ratingOverlay.classList.contains('active')) return;
    const coords = getCanvasCoords(e);
    isDrawing = true;
    lastX = coords.x;
    lastY = coords.y;
    startBrushSound();
    drawStroke(coords.x, coords.y);
}

function handleMove(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    drawStroke(coords.x, coords.y);
}

function handleUp() {
    isDrawing = false;
    stopBrushSound();
}

function drawStroke(x, y) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (activeTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
    } else {
        ctx.strokeStyle = activeColor;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    lastX = x;
    lastY = y;
}

// Event Listeners for drawing
canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDown(e);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
}, { passive: false });

window.addEventListener('touchend', handleUp);

// Tools Selection Action Buttons
pencilTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    pencilTool.classList.add('active');
    activeTool = 'pencil';
    playSound('click');
});

eraserTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    eraserTool.classList.add('active');
    activeTool = 'eraser';
    playSound('click');
});

// Sizes Selection Action Buttons
const sizeBtns = [sizeSm, sizeMd, sizeLg];
sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        brushSize = parseInt(btn.getAttribute('data-size'));
        playSound('click');
    });
});

clearBtn.addEventListener('click', () => {
    clearCanvas();
    playSound('click');
});

// Self-rating overlays responses
thumbsUpBtn.addEventListener('click', () => {
    // Approved! Add +10 points
    ratingOverlay.classList.remove('active');
    playSound('yes');

    score += 10;
    scoreVal.textContent = score;

    // Save screenshot
    const src = canvas.toDataURL('image/png');
    saveToGalleryCache(src);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    nextDoodle();
});

thumbsDownBtn.addEventListener('click', () => {
    // Rejected. Skip without points
    ratingOverlay.classList.remove('active');
    playSound('no');
    nextDoodle();
});

// Start button trigger
startBtn.addEventListener('click', startGame);
