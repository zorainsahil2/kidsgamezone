// Holiday Card Maker - KidsGameZone Game Logic

const canvas = document.getElementById("cardCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = 0;

// Card items list
let placedItems = [];
let currentTheme = "Christmas";
let currentBgColor = null; // defaults to theme background scenery

// Selected tools
let selectedStamp = "none";
let fontColor = "#ffffff";
let draggedItem = null;

// Emojis list per theme
const THEME_STICKERS = {
    Christmas: ["🎅", "🎄", "⛄", "🎁", "🦌", "❄️", "🔔", "⭐"],
    Halloween: ["🎃", "👻", "🦇", "🕷️", "💀", "🧙", "🍬", "🍭"],
    Easter: ["🐣", "🐰", "🥚", "🌸", "🦋", "🧺", "🌷", "☀️"],
    NewYear: ["🎆", "🎈", "🥂", "🎉", "🕰️", "🌟", "👑", "🍾"]
};

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
    placedItems = [];
    currentBgColor = null;
    setTheme("Christmas");
    selectStamp("none");
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    document.getElementById("highScoreVal").textContent = highScore;
}

function setTheme(themeName) {
    currentTheme = themeName;
    
    // Toggle active buttons
    document.querySelectorAll(".theme-btn").forEach(btn => {
        if (btn.textContent.includes(themeName)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Populate stickers panel
    const panel = document.getElementById("stickersContainer");
    panel.innerHTML = "";
    
    THEME_STICKERS[themeName].forEach(sticker => {
        const item = document.createElement("div");
        item.className = "sticker-item";
        item.textContent = sticker;
        item.onclick = () => addStickerItem(sticker);
        panel.appendChild(item);
    });

    playTone(350, "sine", 0.08);
    drawCard();
}

function selectStamp(stampName) {
    selectedStamp = stampName;
    
    // Toggle active stamp buttons
    document.querySelectorAll(".stamp-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const activeIdMap = {
        star: "stampStar",
        heart: "stampHeart",
        snowflake: "stampSnow",
        pumpkin: "stampPumpkin",
        none: "stampNone"
    };
    
    document.getElementById(activeIdMap[stampName]).classList.add("active");
    playTone(400, "triangle", 0.05);
}

function selectFontColor(el, color) {
    fontColor = color;
    document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
    el.classList.add("active");
    playTone(440, "sine", 0.05);
}

function addStickerItem(emoji) {
    placedItems.push({
        type: "sticker",
        val: emoji,
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 38
    });
    playTone(523, "sine", 0.1, 783); // pop
    drawCard();
}

function addTextItem() {
    const input = document.getElementById("textInput");
    const text = input.value.trim();
    if (text === "") return;

    const size = parseInt(document.getElementById("fontSizeSlider").value, 10);
    placedItems.push({
        type: "text",
        val: text,
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: size,
        color: fontColor
    });
    playTone(523, "sine", 0.1, 783);
    input.value = ""; // clear input
    drawCard();
}

function addStampItem(x, y) {
    placedItems.push({
        type: "stamp",
        val: selectedStamp,
        x: x,
        y: y,
        size: 24
    });
    playTone(600, "triangle", 0.08);
    drawCard();
}

// Vector stamp drawings
function drawStampVector(c, stamp) {
    c.save();
    c.translate(stamp.x, stamp.y);

    if (stamp.val === "star") {
        c.fillStyle = "#fef08a";
        c.strokeStyle = "#eab308";
        c.lineWidth = 1.5;
        c.beginPath();
        const spikes = 5;
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        c.moveTo(0, -12);
        for (let i = 0; i < spikes; i++) {
            let x = Math.cos(rot) * 12;
            let y = Math.sin(rot) * 12;
            c.lineTo(x, y);
            rot += step;
            x = Math.cos(rot) * 5;
            y = Math.sin(rot) * 5;
            c.lineTo(x, y);
            rot += step;
        }
        c.closePath();
        c.fill();
        c.stroke();
    } else if (stamp.val === "heart") {
        c.fillStyle = "#f43f5e";
        c.strokeStyle = "#be123c";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, -4);
        c.bezierCurveTo(-6, -12, -14, -8, -14, 0);
        c.bezierCurveTo(-14, 8, -6, 12, 0, 16);
        c.bezierCurveTo(6, 12, 14, 8, 14, 0);
        c.bezierCurveTo(14, -8, 6, -12, 0, -4);
        c.closePath();
        c.fill();
        c.stroke();
    } else if (stamp.val === "snowflake") {
        c.strokeStyle = "#ffffff";
        c.lineWidth = 3;
        c.lineCap = "round";
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            let angle = (i * Math.PI) / 3;
            c.moveTo(0, 0);
            c.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
        }
        c.stroke();
    } else if (stamp.val === "pumpkin") {
        c.fillStyle = "#f97316";
        c.strokeStyle = "#c2410c";
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(0, 0, 12, 10, 0, 0, Math.PI*2);
        c.fill();
        c.stroke();
        // stem
        c.fillStyle = "#16a34a";
        c.fillRect(-2, -14, 4, 6);
    }

    c.restore();
}

// Background Drawing routines
function drawThemeBackground(c) {
    if (currentTheme === "Christmas") {
        // Navy blue starry night
        let sky = c.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#0f172a");
        sky.addColorStop(1, "#1e3a8a");
        c.fillStyle = sky;
        c.fillRect(0, 0, canvas.width, canvas.height);

        // Twinkling stars
        c.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < 15; i++) {
            let starX = (Math.sin(i * 123) + 1.0) * 0.5 * canvas.width;
            let starY = (Math.cos(i * 456) + 1.0) * 0.5 * (canvas.height - 80);
            c.beginPath();
            c.arc(starX, starY, 1.5, 0, Math.PI*2);
            c.fill();
        }

        // Snow drifts at bottom
        c.fillStyle = "#f8fafc";
        c.beginPath();
        c.ellipse(120, canvas.height + 10, 220, 50, 0, 0, Math.PI*2);
        c.ellipse(300, canvas.height + 20, 200, 45, 0, 0, Math.PI*2);
        c.fill();

        // Cute pine tree
        c.fillStyle = "#15803d";
        c.beginPath();
        c.moveTo(80, 250); c.lineTo(50, 250); c.lineTo(65, 210); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(80, 220); c.lineTo(55, 220); c.lineTo(65, 185); c.closePath(); c.fill();
        c.beginPath();
        c.moveTo(76, 190); c.lineTo(60, 190); c.lineTo(65, 160); c.closePath(); c.fill();
        // trunk
        c.fillStyle = "#78350f";
        c.fillRect(62, 250, 6, 15);

    } else if (currentTheme === "Halloween") {
        // Deep purple night
        let sky = c.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#1e1b4b");
        sky.addColorStop(1, "#3b0764");
        c.fillStyle = sky;
        c.fillRect(0, 0, canvas.width, canvas.height);

        // Giant Moon
        c.fillStyle = "#fef08a";
        c.beginPath();
        c.arc(320, 70, 36, 0, Math.PI*2);
        c.fill();

        // Shadow scenery silhouettes
        c.fillStyle = "#0c0a09";
        c.beginPath();
        c.ellipse(200, canvas.height + 30, 260, 60, 0, 0, Math.PI*2);
        c.fill();

        // Spooky tree branches
        c.strokeStyle = "#0c0a09";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(60, 260); c.lineTo(60, 180);
        c.lineTo(40, 150);
        c.moveTo(60, 200); c.lineTo(80, 170);
        c.stroke();

    } else if (currentTheme === "Easter") {
        // Icy sky blue
        let sky = c.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#bae6fd");
        sky.addColorStop(1, "#e0f2fe");
        c.fillStyle = sky;
        c.fillRect(0, 0, canvas.width, canvas.height);

        // Sun
        c.fillStyle = "#fde047";
        c.beginPath();
        c.arc(50, 55, 20, 0, Math.PI*2);
        c.fill();

        // Lush green fields
        c.fillStyle = "#4ade80";
        c.beginPath();
        c.ellipse(120, canvas.height + 15, 220, 50, 0, 0, Math.PI*2);
        c.fill();
        c.fillStyle = "#22c55e";
        c.beginPath();
        c.ellipse(300, canvas.height + 15, 220, 45, 0, 0, Math.PI*2);
        c.fill();

        // Small tulips/flowers
        c.fillStyle = "#f43f5e";
        c.beginPath();
        c.arc(80, 260, 4, 0, Math.PI*2);
        c.arc(85, 260, 4, 0, Math.PI*2);
        c.fill();
        c.fillStyle = "#16a34a";
        c.fillRect(82, 260, 2, 10);

    } else if (currentTheme === "NewYear") {
        // Midnight black-blue sky
        let sky = c.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#030712");
        sky.addColorStop(1, "#0f172a");
        c.fillStyle = sky;
        c.fillRect(0, 0, canvas.width, canvas.height);

        // Starburst fireworks
        drawFireworkVector(c, 100, 80, "#a855f7");
        drawFireworkVector(c, 280, 110, "#fb923c");

        // City outline silhouettes at bottom
        c.fillStyle = "#1e293b";
        c.fillRect(30, 220, 50, 80);
        ctx.strokeRect(30, 220, 50, 80);
        c.fillRect(120, 190, 60, 110);
        c.fillRect(240, 240, 55, 60);
        c.fillRect(340, 210, 45, 90);
    }
}

function drawFireworkVector(c, cx, cy, color) {
    c.strokeStyle = color;
    c.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        let angle = (i * Math.PI) / 4;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 26);
        c.stroke();
    }
}

function drawCard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw scenery
    drawThemeBackground(ctx);

    // 2. Draw placed items
    placedItems.forEach(item => {
        ctx.save();
        if (item.type === "sticker") {
            ctx.font = `${item.size}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.val, item.x, item.y);
        } else if (item.type === "text") {
            ctx.font = `bold ${item.size}px Nunito`;
            ctx.fillStyle = item.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Shadow text outline for pop readability
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeText(item.val, item.x, item.y);
            ctx.fillText(item.val, item.x, item.y);
        } else if (item.type === "stamp") {
            drawStampVector(ctx, item);
        }
        ctx.restore();
    });
}

// Dragging / Picking Up Items
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleStart(e) {
    if (gameState !== STATE_PLAYING) return;
    const coords = getCanvasCoords(e);

    // Stamp Mode
    if (selectedStamp !== "none") {
        addStampItem(coords.x, coords.y);
        return;
    }

    // Drag Select Mode: Pick closest item under cursor
    let closestItem = null;
    let minDist = 28; // click proximity threshold
    
    placedItems.forEach(item => {
        const dist = Math.hypot(item.x - coords.x, item.y - coords.y);
        if (dist < minDist) {
            minDist = dist;
            closestItem = item;
        }
    });

    if (closestItem) {
        draggedItem = closestItem;
    }
}

function handleMove(e) {
    if (!draggedItem) return;
    const coords = getCanvasCoords(e);
    
    // Contain inside bounds
    draggedItem.x = Math.max(10, Math.min(canvas.width - 10, coords.x));
    draggedItem.y = Math.max(10, Math.min(canvas.height - 10, coords.y));

    drawCard();
}

function handleEnd() {
    draggedItem = null;
}

// Bind Canvas interaction
canvas.addEventListener("mousedown", handleStart);
window.addEventListener("mousemove", handleMove);
window.addEventListener("mouseup", handleEnd);

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleStart(e);
}, { passive: false });
window.addEventListener("touchmove", handleMove, { passive: true });
window.addEventListener("touchend", handleEnd);

// Clear Sandbox
document.getElementById("clearCardBtn").addEventListener("click", () => {
    placedItems = [];
    playTone(200, "sine", 0.12);
    drawCard();
});

// Save Card PNG & Score
document.getElementById("saveCardBtn").addEventListener("click", () => {
    // Increment completed card count
    score++;
    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_holiday-card-maker", highScore);
    updateUI();

    playTone(523.25, "sine", 0.12);
    setTimeout(() => playTone(659.25, "sine", 0.12), 80);
    setTimeout(() => playTone(783.99, "sine", 0.12), 160);
    setTimeout(() => playTone(1046.50, "sine", 0.35), 240);

    // Save as image file
    const link = document.createElement("a");
    link.download = `my-${currentTheme}-card.png`;
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById("startBtn").addEventListener("click", () => {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
});

// Load High Score
highScore = parseInt(localStorage.getItem("kgz_highscore_holiday-card-maker"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start Loop
initGame();
