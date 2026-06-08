// Dinosaur Egg Hatch - KidsGameZone Game Logic

const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;
let timeLeft = 120; // 2 minutes
let hatchCount = 0;

// Dino list
const DINOS = [
    { name: "T-Rex 🦖", emoji: "🦖" },
    { name: "Stego 🦕", emoji: "🦕" },
    { name: "Tricera 🦕", emoji: "🦕" },
    { name: "Brachio 🦕", emoji: "🦕" },
    { name: "Ptero 🦅", emoji: "🦅" },
    { name: "Ankylo 🐢", emoji: "🐢" }
];

// Nests (6 Nests)
let nests = [];
const eggCanvases = document.querySelectorAll(".egg-canvas");
const progressBars = document.querySelectorAll(".progress-inner");
const badges = document.querySelectorAll(".hatch-badge");

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
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function initGame() {
    score = 0;
    hatchCount = 0;
    timeLeft = 120;
    nests = [];

    // Build 6 nests
    for (let i = 0; i < 6; i++) {
        nests.push(createNestState(i));
    }

    updateUI();
}

function createNestState(id, prevTapsNeeded = 10) {
    // Determine gold chance
    const isGold = Math.random() < 0.15; // 15% chance to be gold
    const clicksNeeded = prevTapsNeeded + Math.floor(Math.random() * 3); // difficulty scaling
    
    return {
        id: id,
        crack: 0,
        clicksNeeded: clicksNeeded,
        isGolden: isGold,
        hatched: false,
        dino: null,
        shake: 0,
        resetTimer: 0,
        bobOffset: Math.random() * Math.PI
    };
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    document.getElementById("hatchCountVal").textContent = hatchCount;
    document.getElementById("timerVal").textContent = timeLeft + "s";

    // Timer coloring
    if (timeLeft <= 15) {
        document.getElementById("timerVal").style.color = "#ef4444"; // red flashing
    } else {
        document.getElementById("timerVal").style.color = "#4ade80";
    }
}

// Tap Egg Action
function tapEgg(index) {
    if (gameState !== STATE_PLAYING) return;
    
    let nest = nests[index];
    if (nest.hatched) {
        // Reset early if clicked while hatched
        resetNest(index);
        return;
    }

    // Add crack
    nest.shake = 8;
    nest.crack += (100 / nest.clicksNeeded);
    
    if (nest.crack >= 100) {
        // HATCHED!
        nest.crack = 100;
        nest.hatched = true;
        hatchCount++;
        
        // Choose dino
        nest.dino = DINOS[Math.floor(Math.random() * DINOS.length)];
        
        // Points
        if (nest.isGolden) {
            score += 200;
            playTone(400, "sine", 0.15, 800); // golden ding
            setTimeout(() => playTone(600, "sine", 0.15, 1000), 100);
        } else {
            score += 50;
            playTone(330, "sine", 0.15, 660);
        }

        // Show badge
        badges[index].textContent = nest.dino.name;
        badges[index].classList.add("active");

        // Set auto reset timer (120 frames = 2 seconds)
        nest.resetTimer = 120;
        updateUI();
    } else {
        // crack pop noise
        playTone(180 + nest.crack * 2, "triangle", 0.05);
    }
}

function resetNest(index) {
    let oldNest = nests[index];
    // Increase tap count requirements on reset to make it harder
    nests[index] = createNestState(index, oldNest.clicksNeeded + 4);
    badges[index].classList.remove("active");
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    playTone(150, "sawtooth", 0.5, 95);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_dinosaur-egg-hatch", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Egg render helper
function drawEggVisual(c, nest) {
    c.clearRect(0, 0, 100, 120);

    const cx = 50;
    const cy = 65;
    const eggW = 34;
    const eggH = 45;

    // Apply tap shaking
    let shakeX = 0;
    if (nest.shake > 0) {
        shakeX = Math.sin(Date.now() * 0.1) * nest.shake;
        nest.shake -= 0.5;
    }

    // Apply slow idle bobbing
    const bob = Math.sin(Date.now() * 0.003 + nest.bobOffset) * 3;

    c.save();
    c.translate(cx + shakeX, cy + bob);

    if (nest.hatched) {
        // 1. Draw Dino popping out
        c.font = "38px serif";
        c.textAlign = "center";
        c.fillText(nest.dino.emoji, 0, 0);

        // Draw cracked bottom shell
        c.fillStyle = nest.isGolden ? "#eab308" : "#86efac";
        c.strokeStyle = "#166534";
        ctx.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, 18, 22, 18, 0, 0, Math.PI);
        // Jagged crack borders
        c.lineTo(22, 10);
        c.lineTo(12, 15);
        c.lineTo(3, 8);
        c.lineTo(-6, 16);
        c.lineTo(-15, 9);
        c.lineTo(-22, 10);
        c.closePath();
        c.fill();
        c.stroke();
    } else {
        // 2. Draw Egg
        let eggGrad = c.createRadialGradient(-8, -12, 5, 0, 0, eggH);
        if (nest.isGolden) {
            eggGrad.addColorStop(0, "#ffffff"); // Gold shining highlight
            eggGrad.addColorStop(0.5, "#fbbf24");
            eggGrad.addColorStop(1, "#b45309"); // Bronze shadow
        } else {
            // Standard speckled dino egg (e.g. green)
            eggGrad.addColorStop(0, "#f0fdf4");
            eggGrad.addColorStop(0.6, "#86efac");
            eggGrad.addColorStop(1, "#15803d");
        }

        c.fillStyle = eggGrad;
        c.beginPath();
        // custom Egg path
        c.moveTo(0, -eggH);
        c.bezierCurveTo(eggW - 5, -eggH, eggW, -15, eggW, 10);
        c.bezierCurveTo(eggW, 28, eggW - 10, eggH, 0, eggH);
        c.bezierCurveTo(-eggW + 10, eggH, -eggW, 28, -eggW, 10);
        c.bezierCurveTo(-eggW, -15, -eggW + 5, -eggH, 0, -eggH);
        c.fill();

        // Border outline
        c.strokeStyle = nest.isGolden ? "#78350f" : "#14532d";
        c.lineWidth = 2.5;
        c.stroke();

        // Egg speckles
        c.fillStyle = nest.isGolden ? "#fef08a" : "#f472b6"; // yellow gold or rose pink speckles
        drawSpeckle(c, -12, -15, 3);
        drawSpeckle(c, 10, -8, 2.5);
        drawSpeckle(c, -8, 12, 3.5);
        drawSpeckle(c, 12, 15, 3.2);
        drawSpeckle(c, 0, 0, 2);

        // Crack outlines (increases with progress)
        if (nest.crack > 0) {
            c.strokeStyle = "rgba(20, 10, 5, 0.7)";
            c.lineWidth = 2;
            c.beginPath();
            
            // Draw cracks starting from top center down
            if (nest.crack >= 20) {
                c.moveTo(0, -eggH + 15);
                c.lineTo(-6, -eggH + 28);
            }
            if (nest.crack >= 40) {
                c.lineTo(8, -eggH + 38);
            }
            if (nest.crack >= 60) {
                c.lineTo(-3, -10);
            }
            if (nest.crack >= 80) {
                c.lineTo(12, 10);
            }
            c.stroke();
        }
    }

    c.restore();
}

function drawSpeckle(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
}

// Timer decrease thread
setInterval(() => {
    if (gameState === STATE_PLAYING) {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            triggerGameOver();
        }
    }
}, 1000);

// Main Core Loop
function gameLoop() {
    if (gameState === STATE_PLAYING) {
        // Redraw nests
        nests.forEach((nest, idx) => {
            // Draw egg visual canvas
            const canvasEl = eggCanvases[idx];
            const renderCtx = canvasEl.getContext("2d");
            drawEggVisual(renderCtx, nest);

            // Update progress loader bar
            progressBars[idx].style.width = nest.crack + "%";

            // Decay auto reset timer
            if (nest.hatched) {
                nest.resetTimer--;
                if (nest.resetTimer <= 0) {
                    resetNest(idx);
                }
            }
        });
    }

    requestAnimationFrame(gameLoop);
}

// Actions
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

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_dinosaur-egg-hatch"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Boot Loop
gameLoop();
