// Castle Stacker - KidsGameZone Game Code

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;

// Game Config
const BLOCK_HEIGHT = 40;
const BASE_WIDTH = 120;
const SWING_Y = 80;
const BASE_Y = canvas.height - 20;

// Audio Synthesizer
let audioCtx = null;
function playTone(freq, type, duration, targetFreq = null) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (targetFreq) {
            osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

// Entities
let stack = [];
let currentBlock = null;
let fallingBlock = null;
let debrisList = [];
let cameraY = 0;
let targetCameraY = 0;
let time = 0;

// Clouds
let clouds = [
    { x: 50, y: 150, scale: 0.8, speed: 0.1 },
    { x: 250, y: 280, scale: 1.2, speed: 0.15 },
    { x: 100, y: 400, scale: 0.6, speed: 0.08 }
];

function initGame() {
    score = 0;
    cameraY = 0;
    targetCameraY = 0;
    stack = [
        {
            x: canvas.width / 2 - BASE_WIDTH / 2,
            y: BASE_Y - BLOCK_HEIGHT,
            width: BASE_WIDTH,
            height: BLOCK_HEIGHT,
            color: "#64748b" // Base stone
        }
    ];
    spawnNewBlock();
    debrisList = [];
    document.getElementById("scoreVal").textContent = score;
}

function spawnNewBlock() {
    const topBlock = stack[stack.length - 1];
    // Pendulum block starts
    currentBlock = {
        x: canvas.width / 2,
        y: SWING_Y,
        width: topBlock.width,
        height: BLOCK_HEIGHT,
        angle: 0,
        speed: 0.04 + Math.min(score * 0.005, 0.06), // speed scales with score
        swingRange: 130
    };
    fallingBlock = null;
}

function dropBlock() {
    if (gameState !== STATE_PLAYING || fallingBlock || !currentBlock) return;
    
    // Convert swing position to falling block
    fallingBlock = {
        x: currentBlock.x,
        y: currentBlock.y,
        width: currentBlock.width,
        height: currentBlock.height,
        vy: 0
    };
    currentBlock = null;
    playTone(180, "triangle", 0.15, 100);
}

class Debris {
    constructor(x, y, w, h, vx) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = vx;
        this.vy = -2;
        this.angle = 0;
        this.spin = (Math.random() - 0.5) * 0.2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.4; // gravity
        this.angle += this.spin;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.angle);
        drawStoneBlock(-this.w/2, -this.h/2, this.w, this.h, "#475569");
        ctx.restore();
    }
}

// Draw a detailed brick stone block
function drawStoneBlock(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Draw stone mortar lines
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x + w / 4, y + h / 2);
    ctx.lineTo(x + w / 4, y + h);
    ctx.moveTo(x + (3 * w) / 4, y + h / 2);
    ctx.lineTo(x + (3 * w) / 4, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();

    // Shadow on bottom/right
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillRect(x + w - 4, y, 4, h);
}

function handleLanding() {
    const topBlock = stack[stack.length - 1];
    
    // Check overlap
    const left1 = fallingBlock.x;
    const right1 = fallingBlock.x + fallingBlock.width;
    const left2 = topBlock.x;
    const right2 = topBlock.x + topBlock.width;

    const overlapLeft = Math.max(left1, left2);
    const overlapRight = Math.min(right1, right2);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
        // Complete Miss
        triggerGameOver("You completely missed the tower!");
        return;
    }

    // Overhang calculation
    const overhangPercent = (fallingBlock.width - overlapWidth) / fallingBlock.width;
    if (overhangPercent > 0.5) {
        // Tower falls over
        triggerGameOver("The overhang was too heavy! The block collapsed!");
        return;
    }

    // Slice block: keep overlap portion
    const slicedBlock = {
        x: overlapLeft,
        y: topBlock.y - BLOCK_HEIGHT,
        width: overlapWidth,
        height: BLOCK_HEIGHT,
        color: `hsl(${(200 + score * 12) % 360}, 65%, 55%)` // colorful stack
    };

    // Add debris for sliced part
    if (left1 < left2) {
        // slice left side
        debrisList.push(new Debris(left1, slicedBlock.y, left2 - left1, BLOCK_HEIGHT, -3));
    } else if (right1 > right2) {
        // slice right side
        debrisList.push(new Debris(right2, slicedBlock.y, right1 - right2, BLOCK_HEIGHT, 3));
    }

    stack.push(slicedBlock);
    score++;
    document.getElementById("scoreVal").textContent = score;

    // Camera targets top of the stack
    const targetY = (canvas.height - 150) - slicedBlock.y;
    if (targetY > 0) {
        targetCameraY = targetY;
    }

    playTone(300 + score * 20, "sine", 0.25, 450 + score * 20);
    spawnNewBlock();
}

function triggerGameOver(msg) {
    gameState = STATE_GAMEOVER;
    playTone(180, "sawtooth", 0.5, 90);
    
    // Update local storage
    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_castle-builder", highScore);
    
    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("failMessage").textContent = msg;
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Core Loop
function gameLoop() {
    time += 0.05;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Clouds
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + 100) cloud.x = -100;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x + 20 * cloud.scale, cloud.y - 10 * cloud.scale, 20 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x - 20 * cloud.scale, cloud.y - 5 * cloud.scale, 18 * cloud.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // 2. Camera interpolation
    cameraY += (targetCameraY - cameraY) * 0.1;

    // Apply Camera translation
    ctx.save();
    ctx.translate(0, cameraY);

    // Draw Ground base
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, BASE_Y, canvas.width, 100);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, BASE_Y);
    ctx.lineTo(canvas.width, BASE_Y);
    ctx.stroke();

    // Draw Stacked blocks
    stack.forEach(block => {
        drawStoneBlock(block.x, block.y, block.width, block.height, block.color);
    });

    // Draw Debris
    debrisList.forEach((debris, index) => {
        debris.update();
        debris.draw();
        // remove out-of-screen debris
        if (debris.y > canvas.height + 200) {
            debrisList.splice(index, 1);
        }
    });

    // Draw Falling block
    if (fallingBlock) {
        fallingBlock.vy += 0.6; // gravity speed
        fallingBlock.y += fallingBlock.vy;
        drawStoneBlock(fallingBlock.x, fallingBlock.y, fallingBlock.width, fallingBlock.height, "#f59e0b");

        // Landing check
        const targetLandingY = stack[stack.length - 1].y - BLOCK_HEIGHT;
        if (fallingBlock.y >= targetLandingY) {
            fallingBlock.y = targetLandingY;
            handleLanding();
        }
    }

    ctx.restore(); // Undo camera translation

    // 3. Draw Pendulum/Swing block (unaffected by cameraY)
    if (currentBlock && gameState === STATE_PLAYING) {
        currentBlock.angle += currentBlock.speed;
        currentBlock.x = (canvas.width / 2 - currentBlock.width / 2) + Math.sin(currentBlock.angle) * currentBlock.swingRange;
        
        // Draw rope/line
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(currentBlock.x + currentBlock.width / 2, currentBlock.y);
        ctx.stroke();

        drawStoneBlock(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height, "#f59e0b");
    }

    requestAnimationFrame(gameLoop);
}

// User Actions
function handleAction() {
    if (gameState === STATE_MENU) {
        gameState = STATE_PLAYING;
        document.getElementById("startOverlay").classList.remove("active");
        initGame();
        playTone(300, "sine", 0.1, 600);
    } else if (gameState === STATE_PLAYING) {
        dropBlock();
    } else if (gameState === STATE_GAMEOVER) {
        // Overlay handle
    }
}

// Event Bindings
document.getElementById("startBtn").addEventListener("click", () => {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
});

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_PLAYING;
    initGame();
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleAction();
}, { passive: false });

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    handleAction();
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        handleAction();
    }
});

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_castle-builder"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start Loop
gameLoop();
