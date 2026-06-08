/**
 * KidsGameZone: Animal Jigsaw
 * 4x4 drag-and-snap puzzle, programmatic vector graphics, clip path segment renders,
 * green snap flashes, celebratory fireworks particles, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_jigsaw-puzzle';

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');
const animalButtons = document.querySelectorAll('.animal-btn');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');

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

    if (type === 'drag') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'win') {
        // High pitch melodic chime arpeggio
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(587.33, now + 0.05); // D5
        osc2.frequency.setValueAtTime(698.46, now + 0.15); // F5
        osc2.frequency.setValueAtTime(880.00, now + 0.25); // A5
        osc2.frequency.setValueAtTime(1174.66, now + 0.35); // D6
        gain2.gain.setValueAtTime(0.06, now + 0.05);
        gain2.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.6);
    }
}

// Game State
let score = 1000;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameStarted = false;
let gameOver = false;
let selectedAnimal = 'lion';

// 4x4 Grid parameters
const boardX = 140;
const boardY = 40;
const boardSize = 320;
const pieceSize = 80;

let pieces = []; // List of { id, x, y, targetX, targetY, row, col, isLocked, isDragging }
let draggedPiece = null;
let dragOffset = { x: 0, y: 0 };
let clockTimer = null;
let animTicks = 0;

// Visual feedback helpers
let flashTimer = 0;
let flashX = 0;
let flashY = 0;
let fireworks = []; // Particles array {x, y, vx, vy, color, size, alpha}

highScoreVal.textContent = highScore;

// Assemble or scramble jigsaw board
function initPuzzle() {
    pieces = [];
    draggedPiece = null;
    fireworks = [];
    flashTimer = 0;

    // Create 16 pieces
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const targetX = boardX + c * pieceSize;
            const targetY = boardY + r * pieceSize;

            pieces.push({
                id: r * 4 + c,
                x: targetX,
                y: targetY,
                targetX: targetX,
                targetY: targetY,
                row: r,
                col: c,
                isLocked: false,
                isDragging: false
            });
        }
    }

    scramblePieces();
}

function scramblePieces() {
    pieces.forEach(p => {
        p.isLocked = false;
        p.isDragging = false;

        // Spread randomly along margins, keeping completely away from the board area
        let valid = false;
        let rx = 0;
        let ry = 0;

        while (!valid) {
            // Roll anywhere on canvas
            rx = 10 + Math.random() * (canvas.width - pieceSize - 20);
            ry = 10 + Math.random() * (canvas.height - pieceSize - 20);

            // Verify piece is NOT overlapping target board (130 to 470 X, 30 to 370 Y)
            const overlapX = (rx + pieceSize > boardX - 10) && (rx < boardX + boardSize + 10);
            const overlapY = (ry + pieceSize > boardY - 10) && (ry < boardY + boardSize + 10);

            if (!(overlapX && overlapY)) {
                valid = true;
            }
        }

        p.x = rx;
        p.y = ry;
    });

    score = 1000;
    scoreVal.textContent = score;
    gameOver = false;
}

// Animal Tab select triggers
animalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        animalButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAnimal = btn.getAttribute('data-animal');
        playSound('drag');
        initPuzzle();
    });
});

// Timer clock ticking
function onSecondTick() {
    if (gameOver || !gameStarted) return;
    score = Math.max(100, score - 1);
    scoreVal.textContent = score;
}

// Start Game Controllers
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    initPuzzle();
    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameStarted = true;
    gameOver = false;

    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(onSecondTick, 1000);
}

function checkWin() {
    const allLocked = pieces.every(p => p.isLocked);
    if (allLocked && !gameOver) {
        endGame();
    }
}

function endGame() {
    gameOver = true;
    if (clockTimer) clearInterval(clockTimer);
    playSound('win');

    // Spawn win sparks particles
    for (let i = 0; i < 70; i++) {
        fireworks.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: -2 - Math.random() * 5,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            size: 4 + Math.random() * 6,
            alpha: 1
        });
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = score;
    overlayHighScoreVal.textContent = highScore;

    setTimeout(() => {
        gameOverOverlay.classList.add('active');
    }, 2000);
}

// Sparkles rendering
function updateParticles() {
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.08; // gravity
        f.alpha -= 0.012;
        if (f.alpha <= 0) {
            fireworks.splice(i, 1);
        }
    }
}

// --- Drag & Drop mouse/touch input system ---
function getCanvasMouseCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleDown(e) {
    if (gameOver || !gameStarted) return;
    const m = getCanvasMouseCoords(e);

    // Pick top piece (reverse array check)
    for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        if (!p.isLocked) {
            if (m.x >= p.x && m.x <= p.x + pieceSize &&
                m.y >= p.y && m.y <= p.y + pieceSize) {

                draggedPiece = p;
                dragOffset.x = m.x - p.x;
                dragOffset.y = m.y - p.y;
                p.isDragging = true;

                // Move clicked piece to top of rendering stack
                pieces.splice(i, 1);
                pieces.push(p);

                playSound('drag');
                break;
            }
        }
    }
}

function handleMove(e) {
    if (!draggedPiece) return;
    const m = getCanvasMouseCoords(e);
    draggedPiece.x = m.x - dragOffset.x;
    draggedPiece.y = m.y - dragOffset.y;
}

function handleUp(e) {
    if (!draggedPiece) return;
    draggedPiece.isDragging = false;

    // Check target alignment snap logic
    const dist = Math.sqrt((draggedPiece.x - draggedPiece.targetX) ** 2 + (draggedPiece.y - draggedPiece.targetY) ** 2);
    if (dist < 18) {
        draggedPiece.x = draggedPiece.targetX;
        draggedPiece.y = draggedPiece.targetY;
        draggedPiece.isLocked = true;

        // Trigger green snap flash coords
        flashX = draggedPiece.targetX;
        flashY = draggedPiece.targetY;
        flashTimer = 16;

        playSound('snap');
        checkWin();
    }

    draggedPiece = null;
}

// Mouse Listeners
canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

// Touch Listeners
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDown(e);
}, { passive: false });
window.addEventListener('touchmove', handleMove);
window.addEventListener('touchend', handleUp);


// --- Core Drawing Router ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animTicks++;

    // 1. Draw Board outline placement slots
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(boardX, boardY, boardSize, boardSize);

    // Board grids gridlines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(boardX + i * pieceSize, boardY);
        ctx.lineTo(boardX + i * pieceSize, boardY + boardSize);
        ctx.moveTo(boardX, boardY + i * pieceSize);
        ctx.lineTo(boardX + boardSize, boardY + i * pieceSize);
        ctx.stroke();
    }

    // Board perimeter border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(boardX, boardY, boardSize, boardSize);

    // Faint preview underlay of the selected animal (helps kids!)
    ctx.save();
    ctx.globalAlpha = 0.08;
    drawAnimal(ctx, selectedAnimal);
    ctx.restore();

    // 2. Draw Jigsaw pieces (Locked ones first, then floating)
    pieces.forEach(p => {
        ctx.save();

        // Drop shadow for floating pieces
        if (!p.isLocked) {
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = p.isDragging ? 8 : 3;
        }

        // Setup clipping mask path around the piece square boundaries
        ctx.beginPath();
        ctx.rect(p.x, p.y, pieceSize, pieceSize);
        ctx.clip();

        // Translate drawing offset to render segment
        ctx.translate(p.x - p.targetX, p.y - p.targetY);

        // Render full animal vectors inside piece segment
        drawAnimal(ctx, selectedAnimal);

        ctx.restore();

        // Draw boundaries borders overlay
        ctx.save();
        if (p.isLocked) {
            // Blends in cleanly (thin faint outline)
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x, p.y, pieceSize, pieceSize);
        } else {
            // Drag indicators dashed lines
            ctx.strokeStyle = p.isDragging ? '#eab308' : '#64748b';
            ctx.lineWidth = p.isDragging ? 2.5 : 1.5;
            if (!p.isDragging) ctx.setLineDash([4, 4]);
            ctx.strokeRect(p.x, p.y, pieceSize, pieceSize);
        }
        ctx.restore();
    });

    // 3. Render snap feedback green flash overlay
    if (flashTimer > 0) {
        flashTimer--;
        ctx.save();
        ctx.strokeStyle = `rgba(34, 197, 94, ${flashTimer / 16})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(flashX, flashY, pieceSize, pieceSize);
        ctx.restore();
    }

    // 4. Render win sparkles
    if (gameOver) {
        updateParticles();
        fireworks.forEach(f => {
            ctx.save();
            ctx.globalAlpha = f.alpha;
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

// --- Animal Vectors Drawer helpers ---
// Drawn on base board coordinate space: X (140 to 460), Y (40 to 360)
function drawAnimal(ctx, name) {
    const bx = boardX + boardSize / 2; // 300
    const by = boardY + boardSize / 2; // 200

    ctx.save();

    if (name === 'lion') {
        // Large puffy mane (dark orange circles)
        ctx.fillStyle = '#b45309';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
            const mx = bx + Math.cos(a) * 80;
            const my = by + Math.sin(a) * 80;
            ctx.beginPath();
            ctx.arc(mx, my, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ears
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bx - 55, by - 55, 20, 0, Math.PI * 2);
        ctx.arc(bx + 55, by - 55, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(bx - 55, by - 55, 10, 0, Math.PI * 2);
        ctx.arc(bx + 55, by - 55, 10, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#f59e0b'; // golden yellow face
        ctx.beginPath();
        ctx.arc(bx, by, 72, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(bx - 24, by - 12, 8, 0, Math.PI * 2);
        ctx.arc(bx + 24, by - 12, 8, 0, Math.PI * 2);
        ctx.fill();
        // shines
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx - 26, by - 15, 3, 0, Math.PI * 2);
        ctx.arc(bx + 22, by - 15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(bx, by + 18, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.moveTo(bx - 8, by + 10);
        ctx.lineTo(bx + 8, by + 10);
        ctx.lineTo(bx, by + 18);
        ctx.closePath();
        ctx.fill();

        // Whiskers mouth lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx, by + 18);
        ctx.quadraticCurveTo(bx - 8, by + 28, bx - 14, by + 22);
        ctx.moveTo(bx, by + 18);
        ctx.quadraticCurveTo(bx + 8, by + 28, bx + 14, by + 22);
        ctx.stroke();

        // Crown on head
        ctx.fillStyle = '#eab308'; // yellow gold
        ctx.beginPath();
        ctx.moveTo(bx - 20, by - 70);
        ctx.lineTo(bx - 26, by - 92);
        ctx.lineTo(bx - 8, by - 80);
        ctx.lineTo(bx, by - 100); // high center
        ctx.lineTo(bx + 8, by - 80);
        ctx.lineTo(bx + 26, by - 92);
        ctx.lineTo(bx + 20, by - 70);
        ctx.closePath();
        ctx.fill();
    }
    else if (name === 'elephant') {
        // Large body
        ctx.fillStyle = '#64748b'; // slate grey
        ctx.beginPath();
        ctx.arc(bx, by + 40, 95, 0, Math.PI * 2);
        ctx.fill();

        // Giant ears
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(bx - 85, by - 15, 45, 65, Math.PI/12, 0, Math.PI * 2);
        ctx.ellipse(bx + 85, by - 15, 45, 65, -Math.PI/12, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(bx, by - 10, 72, 0, Math.PI * 2);
        ctx.fill();

        // Ear inner folds (pink blushes)
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.ellipse(bx - 82, by - 10, 20, 40, Math.PI/12, 0, Math.PI * 2);
        ctx.ellipse(bx + 82, by - 10, 20, 40, -Math.PI/12, 0, Math.PI * 2);
        ctx.fill();

        // Tusks
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(bx - 25, by + 30);
        ctx.quadraticCurveTo(bx - 45, by + 35, bx - 50, by + 18);
        ctx.quadraticCurveTo(bx - 38, by + 45, bx - 18, by + 42);
        ctx.closePath();
        ctx.moveTo(bx + 25, by + 30);
        ctx.quadraticCurveTo(bx + 45, by + 35, bx + 50, by + 18);
        ctx.quadraticCurveTo(bx + 38, by + 45, bx + 18, by + 42);
        ctx.closePath();
        ctx.fill();

        // Trunk
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by + 15);
        ctx.quadraticCurveTo(bx - 5, by + 75, bx - 25, by + 85);
        ctx.quadraticCurveTo(bx - 45, by + 90, bx - 40, by + 65);
        ctx.stroke();

        // Happy eyes
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(bx - 25, by - 15, 8, Math.PI, 0);
        ctx.arc(bx + 25, by - 15, 8, Math.PI, 0);
        ctx.stroke();
    }
    else if (name === 'giraffe') {
        // Sky details (dappled green leaves)
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(boardX + boardSize - 10, boardY + 10, 30, 0, Math.PI * 2);
        ctx.arc(boardX + boardSize - 35, boardY + 25, 20, 0, Math.PI * 2);
        ctx.fill();

        // Neck (long vertical pillar)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(bx - 18, by - 30, 36, 190);

        // Giraffe spots (brown rings)
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(bx - 2, by + 10, 10, 0, Math.PI * 2);
        ctx.arc(bx + 8, by + 50, 12, 0, Math.PI * 2);
        ctx.arc(bx - 6, by + 95, 9, 0, Math.PI * 2);
        ctx.arc(bx + 4, by + 130, 11, 0, Math.PI * 2);
        ctx.fill();

        // Head (horizontal oval)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(bx, by - 60, 36, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(bx, by - 48, 25, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns (sticks + brown heads)
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by - 80); ctx.lineTo(bx - 18, by - 102);
        ctx.moveTo(bx + 12, by - 80); ctx.lineTo(bx + 18, by - 102);
        ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(bx - 18, by - 102, 6, 0, Math.PI * 2);
        ctx.arc(bx + 18, by - 102, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ears sticking out
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(bx - 40, by - 66, 16, 7, -Math.PI/6, 0, Math.PI * 2);
        ctx.ellipse(bx + 40, by - 66, 16, 7, Math.PI/6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(bx - 14, by - 66, 5, 0, Math.PI * 2);
        ctx.arc(bx + 14, by - 66, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx - 15, by - 68, 1.5, 0, Math.PI * 2);
        ctx.arc(bx + 13, by - 68, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Smile mouth and nostrils
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by - 48, 6, 0, Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(bx - 6, by - 52, 2, 0, Math.PI * 2);
        ctx.arc(bx + 6, by - 52, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// Animation rendering clock loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// Event Triggers
restartBtn.addEventListener('click', () => {
    playSound('drag');
    initPuzzle();
});

startBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);

// Run loop
gameLoop();
