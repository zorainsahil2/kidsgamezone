// Dragon Clicker - KidsGameZone Game Logic

// --- GAME STATE ---
let state = {
    food: 0,
    highScore: 0,
    owned: {
        autoFeed: 0,
        treats: 0,
        spell: 0,
        friend: 0
    },
    currentStageIndex: 0, // 0 = Egg, 1 = Baby, 2 = Child, 3 = Teen, 4 = Adult, 5 = Legendary
    muted: false
};

const STAGES = [
    { name: "Egg", threshold: 0, next: 100, desc: "A mysterious speckled egg. Tap to hatch it!" },
    { name: "Baby Dragon", threshold: 100, next: 500, desc: "A tiny cute baby. Needs lots of treats!" },
    { name: "Child Dragon", threshold: 500, next: 2000, desc: "Playful and growing quick. Loves learning magic!" },
    { name: "Teen Dragon", threshold: 2000, next: 5000, desc: "Slightly rebellious. Emits cute fire sparks!" },
    { name: "Adult Dragon", threshold: 5000, next: 10000, desc: "A majestic flyer with powerful wings!" },
    { name: "Legendary Dragon", threshold: 10000, next: Infinity, desc: "The ultimate golden dragon of legends!" }
];

const UPGRADES = {
    autoFeed: { baseCost: 50, costMultiplier: 1.15, effect: 1 },
    treats: { baseCost: 200, costMultiplier: 1.15, effect: 5 },
    spell: { baseCost: 500, costMultiplier: 1.15, effect: 10 },
    friend: { baseCost: 1000, costMultiplier: 1.18, effect: 2 } // multiplier
};

// --- AUDIO SYNTHESIZER ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, type, duration, targetFreq = null) {
    if (state.muted) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        if (targetFreq) {
            osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio Context failed: ", e);
    }
}

function playClickSound() {
    // Cute chirp sound
    playTone(350, "sine", 0.08, 700);
}

function playUpgSound() {
    // Happy chord progression
    const time = 0.08;
    playTone(261.63, "triangle", time); // C4
    setTimeout(() => playTone(329.63, "triangle", time), 50); // E4
    setTimeout(() => playTone(392.00, "triangle", time), 100); // G4
    setTimeout(() => playTone(523.25, "triangle", time), 150); // C5
}

function playEvoSound() {
    // Epic fanfare arpeggio
    const time = 0.15;
    playTone(261.63, "sine", time, 392.00); // C4 -> G4
    setTimeout(() => playTone(329.63, "sine", time, 523.25), 100); // E4 -> C5
    setTimeout(() => playTone(392.00, "sine", time, 783.99), 200); // G4 -> G5
    setTimeout(() => {
        // Chord burst
        playTone(523.25, "sawtooth", 0.4);
        playTone(659.25, "sawtooth", 0.4);
        playTone(783.99, "sawtooth", 0.4);
        playTone(1046.50, "sawtooth", 0.4);
    }, 300);
}

// --- DOM ELEMENTS ---
const foodValEl = document.getElementById("foodVal");
const incomeRateValEl = document.getElementById("incomeRateVal");
const stageNameEl = document.getElementById("stageName");
const evoPercentEl = document.getElementById("evoPercent");
const evoProgressBarEl = document.getElementById("evoProgressBar");
const evoMilestoneEl = document.getElementById("evoMilestone");
const highScoreValEl = document.getElementById("highScoreVal");

const upgAutoFeedBtn = document.getElementById("upgAutoFeed");
const upgTreatsBtn = document.getElementById("upgTreats");
const upgSpellBtn = document.getElementById("upgSpell");
const upgFriendBtn = document.getElementById("upgFriend");

const ownedAutoFeedEl = document.getElementById("ownedAutoFeed");
const ownedTreatsEl = document.getElementById("ownedTreats");
const ownedSpellEl = document.getElementById("ownedSpell");
const ownedFriendEl = document.getElementById("ownedFriend");

const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");

const evoOverlay = document.getElementById("evoOverlay");
const evoNewStageEl = document.getElementById("evoNewStage");
const evoCloseBtn = document.getElementById("evoCloseBtn");

const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");

// --- CANVAS SETUP ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const evoCanvas = document.getElementById("evoCanvas");
const evoCtx = evoCanvas.getContext("2d");

// --- PARTICLE SYSTEM ---
class Particle {
    constructor(x, y, type, value = "") {
        this.x = x;
        this.y = y;
        this.type = type; // "text", "sparkle", "star"
        this.value = value;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = -Math.random() * 3 - 2;
        this.alpha = 1.0;
        this.size = Math.random() * 8 + 6;
        this.color = `hsl(${Math.random() * 360}, 90%, 70%)`;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // tiny gravity
        this.alpha -= 0.015;
        this.angle += this.spin;
    }

    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        if (this.type === "text") {
            c.font = "bold 16px Nunito";
            c.fillStyle = "#fb7185";
            c.shadowColor = "#000";
            c.shadowBlur = 3;
            c.fillText(this.value, this.x, this.y);
        } else if (this.type === "star") {
            c.translate(this.x, this.y);
            c.rotate(this.angle);
            c.fillStyle = this.color;
            // Draw a cute star
            c.beginPath();
            for (let i = 0; i < 5; i++) {
                c.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size,
                         Math.sin((18 + i * 72) * Math.PI / 180) * this.size);
                c.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.size / 2),
                         Math.sin((54 + i * 72) * Math.PI / 180) * (this.size / 2));
            }
            c.closePath();
            c.fill();
        } else if (this.type === "sparkle") {
            c.translate(this.x, this.y);
            c.rotate(this.angle);
            c.fillStyle = "#fde047";
            c.beginPath();
            c.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            c.fill();
        } else if (this.type === "food") {
            c.font = `${this.size + 12}px serif`;
            c.fillText(this.value, this.x, this.y);
        }
        c.restore();
    }
}

let particles = [];

// --- DRAGON ANIMATION VARIABLES ---
let animTimer = 0;
let clickScale = 1.0;
let eggShake = 0;
let wingFlap = 0;
let breathScale = 1.0;
let eyeBlink = 0;

// --- STATE MANAGEMENT ---
function getClickPower() {
    const basePower = 1 + state.owned.treats * UPGRADES.treats.effect;
    const multiplier = Math.pow(UPGRADES.friend.effect, state.owned.friend);
    return basePower * multiplier;
}

function getSecIncome() {
    const baseIncome = (state.owned.autoFeed * UPGRADES.autoFeed.effect) +
                       (state.owned.spell * UPGRADES.spell.effect);
    const multiplier = Math.pow(UPGRADES.friend.effect, state.owned.friend);
    return baseIncome * multiplier;
}

function getUpgradeCost(key) {
    const upg = UPGRADES[key];
    const owned = state.owned[key];
    return Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, owned));
}

function saveGame() {
    localStorage.setItem("kgz_dragon_clicker_save", JSON.stringify(state));
    localStorage.setItem("kgz_highscore_dragon-clicker", state.highScore);
}

function loadGame() {
    const stored = localStorage.getItem("kgz_dragon_clicker_save");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
                state.food = parsed.food || 0;
                state.highScore = parsed.highScore || 0;
                if (parsed.owned) {
                    state.owned.autoFeed = parsed.owned.autoFeed || 0;
                    state.owned.treats = parsed.owned.treats || 0;
                    state.owned.spell = parsed.owned.spell || 0;
                    state.owned.friend = parsed.owned.friend || 0;
                }
                state.muted = !!parsed.muted;
                state.currentStageIndex = getCurrentStageIndex(state.food);
            }
        } catch (e) {
            console.warn("Failed parsing save state", e);
        }
    }
    const highScoreStored = localStorage.getItem("kgz_highscore_dragon-clicker");
    if (highScoreStored) {
        state.highScore = Math.max(state.highScore, parseInt(highScoreStored, 10) || 0);
    }
    updateMuteUI();
}

function getCurrentStageIndex(foodCount) {
    for (let i = STAGES.length - 1; i >= 0; i--) {
        if (foodCount >= STAGES[i].threshold) {
            return i;
        }
    }
    return 0;
}

function checkEvolutions(oldFood, newFood) {
    const newStageIndex = getCurrentStageIndex(newFood);
    if (newStageIndex > state.currentStageIndex) {
        // EVOLUTION!
        state.currentStageIndex = newStageIndex;
        triggerEvolutionOverlay(STAGES[newStageIndex].name);
        saveGame();
    }
}

// --- RENDERING ROUTINES ---

// Helper to draw a beautiful background
function drawMeadow(c, width, height) {
    // Sky
    let skyGradient = c.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "#1e1b4b"); // Indigo deep
    skyGradient.addColorStop(0.5, "#311042"); // Deep Purple
    skyGradient.addColorStop(1, "#581c87"); // Purple Meadow border
    c.fillStyle = skyGradient;
    c.fillRect(0, 0, width, height);

    // Stars
    c.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 20; i++) {
        let starX = (Math.sin(i * 999) + 1.0) * 0.5 * width;
        let starY = (Math.cos(i * 123) + 1.0) * 0.5 * (height * 0.6);
        let starSize = (Math.sin(animTimer * 2 + i) + 1.2) * 1.5;
        c.beginPath();
        c.arc(starX, starY, starSize, 0, Math.PI * 2);
        c.fill();
    }

    // Distant Hills
    c.fillStyle = "#3b0764";
    c.beginPath();
    c.ellipse(120, height + 10, 220, 60, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#2e0854";
    c.beginPath();
    c.ellipse(360, height + 15, 240, 70, 0, 0, Math.PI * 2);
    c.fill();

    // Grass Platform
    c.fillStyle = "#1e1b4b";
    c.beginPath();
    c.ellipse(240, height + 20, width * 0.7, 80, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#1e293b";
    c.beginPath();
    c.ellipse(240, height + 20, width * 0.68, 76, 0, 0, Math.PI * 2);
    c.fill();
}

function drawDragon(c, stageIndex, cx, cy) {
    c.save();
    c.translate(cx, cy);

    // Dynamic animation factors
    const breath = 1.0 + Math.sin(animTimer * 4) * 0.03 * breathScale;
    const flap = Math.sin(animTimer * 8) * 0.2 * wingFlap;
    const scale = clickScale;

    // Apply click squeeze
    c.scale(scale * breath, scale * (2.0 - scale) * breath);

    switch (stageIndex) {
        case 0: // --- EGG ---
            drawEgg(c);
            break;

        case 1: // --- BABY DRAGON ---
            drawBaby(c, flap);
            break;

        case 2: // --- CHILD DRAGON ---
            drawChild(c, flap);
            break;

        case 3: // --- TEEN DRAGON ---
            drawTeen(c, flap);
            break;

        case 4: // --- ADULT DRAGON ---
            drawAdult(c, flap);
            break;

        case 5: // --- LEGENDARY DRAGON ---
            drawLegendary(c, flap);
            break;
    }

    c.restore();
}

// Stage Drawings (Relative to (0,0) center point, baseline around y=60)
function drawEgg(c) {
    c.save();
    // Rock egg
    const rock = Math.sin(animTimer * 2) * eggShake * 0.15;
    c.rotate(rock);

    // Body Gradient
    let eggGrad = c.createRadialGradient(-10, -20, 5, 0, 0, 45);
    eggGrad.addColorStop(0, "#d8b4fe"); // Light speckle purple
    eggGrad.addColorStop(0.7, "#a855f7"); // Main purple
    eggGrad.addColorStop(1, "#581c87"); // Dark shell

    c.fillStyle = eggGrad;
    c.beginPath();
    // Custom egg path
    c.moveTo(0, -60);
    c.bezierCurveTo(25, -60, 35, -20, 35, 10);
    c.bezierCurveTo(35, 35, 20, 45, 0, 45);
    c.bezierCurveTo(-20, 45, -35, 35, -35, 10);
    c.bezierCurveTo(-35, -20, -25, -60, 0, -60);
    c.fill();

    // Outline
    c.strokeStyle = "#4a044e";
    c.lineWidth = 3;
    c.stroke();

    // Speckles
    c.fillStyle = "#f472b6"; // Rose speckles
    drawSpeckle(c, -15, -25, 4);
    drawSpeckle(c, 15, -15, 3);
    drawSpeckle(c, -20, 10, 5);
    drawSpeckle(c, 20, 15, 4);
    drawSpeckle(c, 0, -5, 3.5);
    drawSpeckle(c, -5, 25, 4.5);

    // Cracks if clicked/shaking
    if (eggShake > 0.1) {
        c.strokeStyle = "rgba(74, 4, 78, 0.75)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-5, -35);
        c.lineTo(3, -25);
        c.lineTo(-2, -15);
        c.lineTo(6, -5);
        c.stroke();
    }

    c.restore();
}

function drawSpeckle(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
}

function drawBaby(c, flap) {
    c.save();
    c.translate(0, 15); // Adjust center

    // Wings
    c.fillStyle = "#ec4899";
    // Left Wing
    c.save();
    c.translate(-22, -10);
    c.rotate(-Math.PI / 4 - flap);
    c.beginPath();
    c.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // Right Wing
    c.save();
    c.translate(22, -10);
    c.rotate(Math.PI / 4 + flap);
    c.beginPath();
    c.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tail
    c.fillStyle = "#c084fc";
    c.beginPath();
    c.moveTo(0, 25);
    c.quadraticCurveTo(35, 35, 30, 10);
    c.quadraticCurveTo(28, 5, 25, 10);
    c.quadraticCurveTo(25, 25, 0, 25);
    c.fill();

    // Body blob
    let bodyGrad = c.createRadialGradient(-6, -10, 4, 0, 0, 32);
    bodyGrad.addColorStop(0, "#e9d5ff");
    bodyGrad.addColorStop(0.7, "#c084fc");
    bodyGrad.addColorStop(1, "#7e22ce");
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.arc(0, 0, 30, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#581c87";
    c.lineWidth = 3;
    c.stroke();

    // Cute Cheeks
    c.fillStyle = "rgba(244, 63, 94, 0.4)";
    c.beginPath();
    c.arc(-15, 6, 6, 0, Math.PI * 2);
    c.arc(15, 6, 6, 0, Math.PI * 2);
    c.fill();

    // Big Eyes
    c.fillStyle = "white";
    c.beginPath();
    c.arc(-11, -5, 8, 0, Math.PI * 2);
    c.arc(11, -5, 8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#0f172a";
    c.beginPath();
    c.arc(-10, -5, 5, 0, Math.PI * 2);
    c.arc(10, -5, 5, 0, Math.PI * 2);
    c.fill();

    // Eye Sparkles
    c.fillStyle = "white";
    c.beginPath();
    c.arc(-12, -7, 2.5, 0, Math.PI * 2);
    c.arc(8, -7, 2.5, 0, Math.PI * 2);
    c.fill();

    // Small Mouth
    c.strokeStyle = "#581c87";
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 5, 3, 0, Math.PI);
    c.stroke();

    c.restore();
}

function drawChild(c, flap) {
    c.save();
    c.translate(0, 10);

    // Wings
    c.fillStyle = "#facc15";
    // Left Wing
    c.save();
    c.translate(-26, -15);
    c.rotate(-Math.PI / 3 - flap);
    c.beginPath();
    c.moveTo(0,0);
    c.bezierCurveTo(-15, -25, -30, -5, 0, 10);
    c.fill();
    c.restore();
    // Right Wing
    c.save();
    c.translate(26, -15);
    c.rotate(Math.PI / 3 + flap);
    c.beginPath();
    c.moveTo(0,0);
    c.bezierCurveTo(15, -25, 30, -5, 0, 10);
    c.fill();
    c.restore();

    // Tail
    c.fillStyle = "#4ade80";
    c.beginPath();
    c.moveTo(0, 30);
    c.quadraticCurveTo(45, 40, 42, 5);
    c.quadraticCurveTo(36, -5, 32, 10);
    c.quadraticCurveTo(30, 30, 0, 30);
    c.fill();
    // Spikes on tail
    c.fillStyle = "#eab308";
    c.beginPath();
    c.moveTo(38, 12); c.lineTo(44, 8); c.lineTo(39, 4); c.fill();

    // Body Pear shape
    let bodyGrad = c.createRadialGradient(-10, -15, 5, 0, 10, 40);
    bodyGrad.addColorStop(0, "#bbf7d0");
    bodyGrad.addColorStop(0.8, "#4ade80");
    bodyGrad.addColorStop(1, "#15803d");
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.moveTo(-25, 25);
    c.bezierCurveTo(-35, 10, -25, -25, 0, -28);
    c.bezierCurveTo(25, -25, 35, 10, 25, 25);
    c.bezierCurveTo(25, 42, -25, 42, -25, 25);
    c.fill();
    c.strokeStyle = "#166534";
    c.lineWidth = 3;
    c.stroke();

    // Yellow Belly
    c.fillStyle = "#fef08a";
    c.beginPath();
    c.ellipse(0, 12, 15, 22, 0, 0, Math.PI * 2);
    c.fill();

    // Horns
    c.fillStyle = "#fb923c";
    c.beginPath();
    c.moveTo(-10, -26); c.quadraticCurveTo(-15, -42, -6, -40); c.lineTo(-4, -28); c.fill();
    c.beginPath();
    c.moveTo(10, -26); c.quadraticCurveTo(15, -42, 6, -40); c.lineTo(4, -28); c.fill();

    // Cheerful eyes
    c.fillStyle = "#1e293b";
    c.beginPath();
    c.arc(-11, -8, 6, 0, Math.PI * 2);
    c.arc(11, -8, 6, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "white";
    c.beginPath();
    c.arc(-9, -10, 2.5, 0, Math.PI * 2);
    c.arc(13, -10, 2.5, 0, Math.PI * 2);
    c.fill();

    // Cute Smile
    c.strokeStyle = "#166534";
    c.lineWidth = 3;
    c.lineCap = "round";
    c.beginPath();
    c.arc(-3, 0, 4, 0.1, Math.PI - 0.1);
    c.moveTo(3, 0);
    c.arc(3, 0, 4, 0.1, Math.PI - 0.1);
    c.stroke();

    c.restore();
}

function drawTeen(c, flap) {
    c.save();
    c.translate(0, 5);

    // Wings
    c.fillStyle = "#f43f5e"; // Rose Red
    // Left Wing
    c.save();
    c.translate(-30, -10);
    c.rotate(-Math.PI / 3 - flap);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(-40, -30);
    c.lineTo(-30, -5);
    c.lineTo(-45, 10);
    c.lineTo(0, 10);
    c.closePath();
    c.fill();
    c.restore();
    // Right Wing
    c.save();
    c.translate(30, -10);
    c.rotate(Math.PI / 3 + flap);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(40, -30);
    c.lineTo(30, -5);
    c.lineTo(45, 10);
    c.lineTo(0, 10);
    c.closePath();
    c.fill();
    c.restore();

    // Tail
    c.fillStyle = "#f97316";
    c.beginPath();
    c.moveTo(0, 35);
    c.quadraticCurveTo(60, 40, 55, -5);
    c.quadraticCurveTo(45, -15, 40, -2);
    c.quadraticCurveTo(40, 25, 0, 35);
    c.fill();

    // Body
    let bodyGrad = c.createRadialGradient(-10, -20, 5, 0, 15, 55);
    bodyGrad.addColorStop(0, "#fed7aa");
    bodyGrad.addColorStop(0.8, "#f97316"); // Orange
    bodyGrad.addColorStop(1, "#7c2d12");
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.moveTo(-30, 25);
    c.bezierCurveTo(-40, -10, -28, -35, 0, -38);
    c.bezierCurveTo(28, -35, 40, -10, 30, 25);
    c.bezierCurveTo(30, 48, -30, 48, -30, 25);
    c.fill();
    c.strokeStyle = "#431407";
    c.lineWidth = 3.5;
    c.stroke();

    // Chest plate
    c.fillStyle = "#fef08a";
    c.beginPath();
    c.moveTo(-14, -5);
    c.bezierCurveTo(-18, 10, -12, 35, 0, 42);
    c.bezierCurveTo(12, 35, 18, 10, 14, -5);
    c.closePath();
    c.fill();

    // Horns
    c.fillStyle = "#d8b4fe"; // Purple horns
    c.beginPath();
    c.moveTo(-15, -34); c.quadraticCurveTo(-26, -55, -10, -50); c.lineTo(-8, -36); c.fill();
    c.beginPath();
    c.moveTo(15, -34); c.quadraticCurveTo(26, -55, 10, -50); c.lineTo(8, -36); c.fill();

    // Spiky Hair/Spines
    c.fillStyle = "#f43f5e";
    c.beginPath();
    c.moveTo(0, -38); c.lineTo(-5, -48); c.lineTo(5, -48); c.closePath(); c.fill();

    // Eyes
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(-12, -12, 8, 0, Math.PI * 2);
    c.arc(12, -12, 8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#9a3412"; // Amber pupils
    c.beginPath();
    c.arc(-11, -12, 4.5, 0, Math.PI * 2);
    c.arc(11, -12, 4.5, 0, Math.PI * 2);
    c.fill();

    // Cool smile with small fangs
    c.strokeStyle = "#431407";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, -2, 6, 0.1, Math.PI - 0.1);
    c.stroke();

    // Tiny white fangs
    c.fillStyle = "white";
    c.beginPath();
    c.moveTo(-4, 0); c.lineTo(-2, 4); c.lineTo(0, 0); c.fill();
    c.beginPath();
    c.moveTo(4, 0); c.lineTo(2, 4); c.lineTo(0, 0); c.fill();

    c.restore();
}

function drawAdult(c, flap) {
    c.save();
    c.translate(0, -10);

    // Large Wings
    c.fillStyle = "#a855f7"; // Royal Purple
    // Left
    c.save();
    c.translate(-35, -20);
    c.rotate(-Math.PI / 4 - flap);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(-65, -50);
    c.lineTo(-50, -10);
    c.lineTo(-75, 20);
    c.lineTo(-40, 25);
    c.lineTo(-30, 45);
    c.closePath();
    c.fill();
    // Gold trim details on wing
    c.strokeStyle = "#eab308";
    c.lineWidth = 2.5;
    c.stroke();
    c.restore();

    // Right
    c.save();
    c.translate(35, -20);
    c.rotate(Math.PI / 4 + flap);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(65, -50);
    c.lineTo(50, -10);
    c.lineTo(75, 20);
    c.lineTo(40, 25);
    c.lineTo(30, 45);
    c.closePath();
    c.fill();
    c.strokeStyle = "#eab308";
    c.lineWidth = 2.5;
    c.stroke();
    c.restore();

    // Tail
    c.fillStyle = "#6b21a8";
    c.beginPath();
    c.moveTo(0, 50);
    c.quadraticCurveTo(80, 55, 75, -15);
    c.quadraticCurveTo(60, -35, 52, -15);
    c.quadraticCurveTo(55, 30, 0, 50);
    c.fill();

    // Tail Tip spade
    c.fillStyle = "#fb7185";
    c.beginPath();
    c.moveTo(75, -15);
    c.lineTo(88, -25);
    c.lineTo(82, -12);
    c.lineTo(92, -5);
    c.closePath();
    c.fill();

    // Main Body
    let bodyGrad = c.createRadialGradient(-15, -30, 5, 0, 20, 75);
    bodyGrad.addColorStop(0, "#d8b4fe");
    bodyGrad.addColorStop(0.7, "#6b21a8");
    bodyGrad.addColorStop(1, "#3b0764");
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.moveTo(-36, 30);
    c.bezierCurveTo(-48, -20, -32, -55, 0, -58);
    c.bezierCurveTo(32, -55, 48, -20, 36, 30);
    c.bezierCurveTo(36, 68, -36, 68, -36, 30);
    c.fill();
    c.strokeStyle = "#1e1b4b";
    c.lineWidth = 4;
    c.stroke();

    // Gold scales belly
    c.fillStyle = "#fef08a";
    c.beginPath();
    c.moveTo(-18, 5);
    c.bezierCurveTo(-24, 25, -15, 55, 0, 60);
    c.bezierCurveTo(15, 55, 24, 25, 18, 5);
    c.closePath();
    c.fill();

    // Majestic Crown Horns
    c.fillStyle = "#eab308"; // Golden
    c.beginPath();
    c.moveTo(-16, -52); c.quadraticCurveTo(-35, -80, -12, -75); c.lineTo(-8, -54); c.fill();
    c.beginPath();
    c.moveTo(16, -52); c.quadraticCurveTo(35, -80, 12, -75); c.lineTo(8, -54); c.fill();

    // Aura crown center
    c.beginPath();
    c.moveTo(-6, -58); c.lineTo(0, -72); c.lineTo(6, -58); c.closePath(); c.fill();

    // Eyes
    c.fillStyle = "#22d3ee"; // Glowing Cyan
    c.beginPath();
    c.arc(-14, -20, 8, 0, Math.PI * 2);
    c.arc(14, -20, 8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "white";
    c.beginPath();
    c.arc(-12, -22, 2.5, 0, Math.PI * 2);
    c.arc(16, -22, 2.5, 0, Math.PI * 2);
    c.fill();

    // Friendly smirk
    c.strokeStyle = "#1e1b4b";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, -6, 8, 0.2, Math.PI - 0.2);
    c.stroke();

    c.restore();
}

function drawLegendary(c, flap) {
    c.save();
    c.translate(0, -15);

    // Glowing Gold Aura
    let auraRad = Math.sin(animTimer * 5) * 15 + 100;
    let auraGrad = c.createRadialGradient(0, 0, 10, 0, 0, auraRad);
    auraGrad.addColorStop(0, "rgba(253, 224, 71, 0.45)");
    auraGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.15)");
    auraGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(0, 0, auraRad, 0, Math.PI * 2);
    c.fill();

    // Legendary Angelic Wings
    c.fillStyle = "#fef08a"; // Gold Yellow
    // Left
    c.save();
    c.translate(-38, -25);
    c.rotate(-Math.PI / 4 - flap * 1.3);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(-85, -60);
    c.lineTo(-65, -15);
    c.lineTo(-95, 25);
    c.lineTo(-50, 30);
    c.lineTo(-40, 60);
    c.closePath();
    c.fill();
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 3;
    c.stroke();
    c.restore();

    // Right
    c.save();
    c.translate(38, -25);
    c.rotate(Math.PI / 4 + flap * 1.3);
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(85, -60);
    c.lineTo(65, -15);
    c.lineTo(95, 25);
    c.lineTo(50, 30);
    c.lineTo(40, 60);
    c.closePath();
    c.fill();
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 3;
    c.stroke();
    c.restore();

    // Tail
    c.fillStyle = "#eab308";
    c.beginPath();
    c.moveTo(0, 55);
    c.quadraticCurveTo(90, 60, 85, -20);
    c.quadraticCurveTo(70, -40, 60, -20);
    c.quadraticCurveTo(62, 35, 0, 55);
    c.fill();

    // Tail Sparkle Spade
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(85, -20, 8, 0, Math.PI * 2);
    c.fill();

    // Main Body (Pure Golden Gradient)
    let bodyGrad = c.createRadialGradient(-18, -35, 5, 0, 20, 80);
    bodyGrad.addColorStop(0, "#ffffff"); // Radiant white core
    bodyGrad.addColorStop(0.4, "#fef08a"); // Gold
    bodyGrad.addColorStop(0.8, "#f59e0b"); // Dark Gold
    bodyGrad.addColorStop(1, "#b45309"); // Bronze outlines
    c.fillStyle = bodyGrad;
    c.beginPath();
    c.moveTo(-38, 30);
    c.bezierCurveTo(-52, -25, -35, -60, 0, -64);
    c.bezierCurveTo(32, -60, 52, -25, 38, 30);
    c.bezierCurveTo(38, 72, -38, 72, -38, 30);
    c.fill();
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 4;
    c.stroke();

    // Radiant Chest Plate
    let chestGrad = c.createLinearGradient(0, 0, 0, 60);
    chestGrad.addColorStop(0, "#ffffff");
    chestGrad.addColorStop(1, "#fde047");
    c.fillStyle = chestGrad;
    c.beginPath();
    c.moveTo(-20, 5);
    c.bezierCurveTo(-26, 25, -18, 58, 0, 64);
    c.bezierCurveTo(18, 58, 26, 25, 20, 5);
    c.closePath();
    c.fill();

    // Royal Gold Horns
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(-18, -56); c.quadraticCurveTo(-40, -90, -14, -82); c.lineTo(-10, -58); c.fill();
    c.beginPath();
    c.moveTo(18, -56); c.quadraticCurveTo(40, -90, 14, -82); c.lineTo(10, -58); c.fill();

    // Aura crown center
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(-8, -64); c.lineTo(0, -82); c.lineTo(8, -64); c.closePath(); c.fill();

    // Eyes
    c.fillStyle = "#ec4899"; // Glowing Rose
    c.beginPath();
    c.arc(-14, -22, 9, 0, Math.PI * 2);
    c.arc(14, -22, 9, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "white";
    c.beginPath();
    c.arc(-12, -24, 3, 0, Math.PI * 2);
    c.arc(16, -24, 3, 0, Math.PI * 2);
    c.fill();

    // Friendly smile
    c.strokeStyle = "#7c2d12";
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, -6, 9, 0.2, Math.PI - 0.2);
    c.stroke();

    c.restore();
}

// --- UPDATE LOOP ---
function update() {
    animTimer += 0.05;

    // Resolve click animation back to normal
    if (clickScale < 1.0) {
        clickScale += 0.04;
        if (clickScale > 1.0) clickScale = 1.0;
    }
    if (clickScale > 1.0) {
        clickScale -= 0.04;
        if (clickScale < 1.0) clickScale = 1.0;
    }

    // Decay egg shake
    if (eggShake > 0) {
        eggShake -= 0.05;
        if (eggShake < 0) eggShake = 0;
    }

    // Set animation factors based on stage
    if (state.currentStageIndex === 0) {
        wingFlap = 0;
        breathScale = 0.3; // Egg breathes very slowly
    } else {
        wingFlap = 1.0;
        breathScale = 1.0;
    }

    // Add Auto-income food incrementally (at 60 FPS, add 1/60th of rate per frame)
    const incomePerFrame = getSecIncome() / 60;
    if (incomePerFrame > 0) {
        const oldFood = state.food;
        state.food += incomePerFrame;
        state.highScore = Math.max(state.highScore, state.food);

        // Periodically save or check upgrades and evolution triggers
        checkEvolutions(oldFood, state.food);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Spawn passive particles from dragon based on stage
    if (state.currentStageIndex === 3 && Math.random() < 0.08) { // Teen - embers
        particles.push(new Particle(240 + (Math.random() - 0.5) * 60, 160, "sparkle"));
    } else if (state.currentStageIndex === 4 && Math.random() < 0.12) { // Adult - magic stars
        particles.push(new Particle(240 + (Math.random() - 0.5) * 80, 140, "star"));
    } else if (state.currentStageIndex === 5 && Math.random() < 0.25) { // Legendary - rich sparkles/stars
        particles.push(new Particle(240 + (Math.random() - 0.5) * 100, 130, Math.random() < 0.5 ? "star" : "sparkle"));
    }

    render();
    updateUI();

    requestAnimationFrame(update);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Meadow/Sky Background
    drawMeadow(ctx, canvas.width, canvas.height);

    // Draw Dragon (Centered)
    drawDragon(ctx, state.currentStageIndex, 240, 195);

    // Draw Particles
    for (let p of particles) {
        p.draw(ctx);
    }
}

// --- EVO CELEBRATION LOOP ---
let evoAnimTimer = 0;
function updateEvoOverlayCanvas() {
    if (!evoOverlay.classList.contains("active")) return;
    evoAnimTimer += 0.05;

    evoCtx.clearRect(0, 0, evoCanvas.width, evoCanvas.height);

    // Magical circular backdrop
    let radialGrad = evoCtx.createRadialGradient(100, 100, 10, 100, 100, 95);
    radialGrad.addColorStop(0, "#581c87");
    radialGrad.addColorStop(0.6, "#2e1065");
    radialGrad.addColorStop(1, "#0f172a");
    evoCtx.fillStyle = radialGrad;
    evoCtx.fillRect(0, 0, evoCanvas.width, evoCanvas.height);

    // Starburst rays
    evoCtx.strokeStyle = "rgba(253, 224, 71, 0.15)";
    evoCtx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
        let angle = (i * Math.PI / 8) + (evoAnimTimer * 0.1);
        evoCtx.beginPath();
        evoCtx.moveTo(100, 100);
        evoCtx.lineTo(100 + Math.cos(angle) * 120, 100 + Math.sin(angle) * 120);
        evoCtx.stroke();
    }

    // Draw Evolved Dragon Stage in Center (scale up a bit inside 200x200 canvas)
    evoCtx.save();
    evoCtx.translate(100, 120);
    // Draw the stage
    const breath = 1.0 + Math.sin(evoAnimTimer * 5) * 0.03;
    const flap = Math.sin(evoAnimTimer * 10) * 0.25;
    evoCtx.scale(1.4 * breath, 1.4 * breath);

    switch (state.currentStageIndex) {
        case 0: drawEgg(evoCtx); break;
        case 1: drawBaby(evoCtx, flap); break;
        case 2: drawChild(evoCtx, flap); break;
        case 3: drawTeen(evoCtx, flap); break;
        case 4: drawAdult(evoCtx, flap); break;
        case 5: drawLegendary(evoCtx, flap); break;
    }
    evoCtx.restore();

    // Floating micro stars
    evoCtx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 6; i++) {
        let starX = (Math.sin(i * 123 + evoAnimTimer) + 1.0) * 0.5 * 200;
        let starY = (Math.cos(i * 456 + evoAnimTimer) + 1.0) * 0.5 * 200;
        evoCtx.beginPath();
        evoCtx.arc(starX, starY, Math.abs(Math.sin(evoAnimTimer + i)) * 3, 0, Math.PI * 2);
        evoCtx.fill();
    }

    requestAnimationFrame(updateEvoOverlayCanvas);
}

// --- UI UPDATING ---
function updateUI() {
    const curFood = Math.floor(state.food);
    foodValEl.textContent = curFood.toLocaleString();
    highScoreValEl.textContent = Math.floor(state.highScore).toLocaleString();

    // Income Rate
    const income = getSecIncome();
    incomeRateValEl.textContent = `+${income.toLocaleString()}/sec`;

    // Stage Names & Description
    const stage = STAGES[state.currentStageIndex];
    stageNameEl.textContent = stage.name;

    // Progress Bar
    if (stage.next === Infinity) {
        evoPercentEl.textContent = "MAX";
        evoProgressBarEl.style.width = "100%";
        evoMilestoneEl.textContent = "Dragon has reached ultimate stage!";
    } else {
        const stageSpan = stage.next - stage.threshold;
        const stageProgress = Math.max(0, state.food - stage.threshold);
        const percent = Math.min(100, Math.floor((stageProgress / stageSpan) * 100));
        evoPercentEl.textContent = `${percent}%`;
        evoProgressBarEl.style.width = `${percent}%`;
        evoMilestoneEl.textContent = `Next: ${stage.next.toLocaleString()} Snacks`;
    }

    // Upgrades Affordability
    updateUpgradeBtn(upgAutoFeedBtn, "autoFeed", curFood);
    updateUpgradeBtn(upgTreatsBtn, "treats", curFood);
    updateUpgradeBtn(upgSpellBtn, "spell", curFood);
    updateUpgradeBtn(upgFriendBtn, "friend", curFood);

    // Upgrade counts
    ownedAutoFeedEl.textContent = state.owned.autoFeed;
    ownedTreatsEl.textContent = state.owned.treats;
    ownedSpellEl.textContent = state.owned.spell;
    ownedFriendEl.textContent = state.owned.friend;
}

function updateUpgradeBtn(btnEl, key, curFood) {
    const cost = getUpgradeCost(key);
    const costEl = btnEl.querySelector(".upgrade-cost");
    costEl.textContent = `🍗 ${cost.toLocaleString()}`;

    if (curFood >= cost) {
        btnEl.disabled = false;
    } else {
        btnEl.disabled = true;
    }
}

function triggerEvolutionOverlay(stageName) {
    evoNewStageEl.textContent = stageName;
    evoOverlay.classList.add("active");
    playEvoSound();
    // Launch overlay loop
    updateEvoOverlayCanvas();
}

function updateMuteUI() {
    muteBtn.textContent = state.muted ? "🔇" : "🔊";
}

// --- INTERACTION / LISTENERS ---

// Canvas Click Function
function handleCanvasClick(e) {
    // Check click position for visual text spawning
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Feed dragon
    const oldFood = state.food;
    const power = getClickPower();
    state.food += power;
    state.highScore = Math.max(state.highScore, state.food);

    // Audio chirp
    playClickSound();

    // Trigger visual pop
    clickScale = 1.15;
    if (state.currentStageIndex === 0) {
        eggShake = 4.0;
    }

    // Spawn rising snack emojis or stars
    const snackEmojis = ["🍗", "🍬", "🍭", "🍇", "🍓", "🍎"];
    const randEmoji = snackEmojis[Math.floor(Math.random() * snackEmojis.length)];
    particles.push(new Particle(x, y, "food", randEmoji));
    particles.push(new Particle(x, y - 20, "text", `+${Math.floor(power)}`));

    // Particle blasts for larger stages
    if (state.currentStageIndex >= 1) {
        for (let i = 0; i < 4; i++) {
            particles.push(new Particle(x, y, "star"));
        }
    }

    checkEvolutions(oldFood, state.food);
    saveGame();
}

canvas.addEventListener("mousedown", (e) => {
    initAudio();
    handleCanvasClick(e);
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent double tap zoom
    initAudio();
    if (e.touches && e.touches[0]) {
        handleCanvasClick(e.touches[0]);
    }
}, { passive: false });

// Upgrades Clicking
function buyUpgrade(key) {
    initAudio();
    const cost = getUpgradeCost(key);
    if (state.food >= cost) {
        state.food -= cost;
        state.owned[key]++;
        playUpgSound();
        saveGame();
        updateUI();
    }
}

upgAutoFeedBtn.addEventListener("click", () => buyUpgrade("autoFeed"));
upgTreatsBtn.addEventListener("click", () => buyUpgrade("treats"));
upgSpellBtn.addEventListener("click", () => buyUpgrade("spell"));
upgFriendBtn.addEventListener("click", () => buyUpgrade("friend"));

// Utilities & Modals
startBtn.addEventListener("click", () => {
    initAudio();
    startOverlay.classList.remove("active");
    playTone(440, "sine", 0.1, 880);
});

evoCloseBtn.addEventListener("click", () => {
    evoOverlay.classList.remove("active");
    playTone(523.25, "sine", 0.1, 1046.50);
});

muteBtn.addEventListener("click", () => {
    state.muted = !state.muted;
    updateMuteUI();
    saveGame();
});

resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset your dragon sanctuary? You will lose all food and upgrades!")) {
        state.food = 0;
        state.currentStageIndex = 0;
        state.owned.autoFeed = 0;
        state.owned.treats = 0;
        state.owned.spell = 0;
        state.owned.friend = 0;
        saveGame();
        updateUI();
        playTone(220, "sawtooth", 0.3, 110);
    }
});

// Periodic Autosave (every 10 seconds)
setInterval(() => {
    saveGame();
}, 10000);

// --- INITIALIZE ---
loadGame();
updateUI();
requestAnimationFrame(update);
