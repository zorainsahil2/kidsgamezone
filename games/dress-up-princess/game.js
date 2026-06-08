/**
 * KidsGameZone: Princess Dress Up
 * Programmatic vector rendering, layering, screenshot save, randomize, and Web Audio.
 */

const STORAGE_KEY = 'kgz_dressup_choices';

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const muteBtn = document.getElementById('muteBtn');
const itemsContainer = document.getElementById('itemsContainer');
const tabButtons = document.querySelectorAll('.tab-btn');

// Action Buttons
const randomBtn = document.getElementById('randomBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

// Sound Configuration
let isMuted = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (isMuted || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'tap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'magic') {
        // Twinkle sequence
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(587.33, now + 0.04); // D5
        osc2.frequency.setValueAtTime(698.46, now + 0.12); // F5
        osc2.frequency.setValueAtTime(880.00, now + 0.20); // A5
        osc2.frequency.setValueAtTime(1174.66, now + 0.28); // D6
        gain2.gain.setValueAtTime(0.04, now + 0.04);
        gain2.gain.linearRampToValueAtTime(0.01, now + 0.44);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.44);
    } else if (type === 'shutter') {
        // Camera white noise click
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

        noiseNode.start(now);
        noiseNode.stop(now + 0.15);

        // follow up twinkle chime
        setTimeout(() => {
            if (!isMuted) playSound('magic');
        }, 180);
    }
}

// Mute button trigger
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
});

// Categories Data
const categories = {
    bg: [
        { name: 'Castle Garden', emoji: '🏰' },
        { name: 'Grand Ballroom', emoji: '💃' },
        { name: 'Enchanted Forest', emoji: '🌲' },
        { name: 'Starry Sky', emoji: '🌌' },
        { name: 'Candy Kingdom', emoji: '🍬' }
    ],
    hair: [
        { name: 'Golden Curls', emoji: '👱‍♀️' },
        { name: 'Pink Twin-Tails', emoji: '👧' },
        { name: 'Royal Bun', emoji: '👩' },
        { name: 'Lavender Waves', emoji: '👩‍🎤' },
        { name: 'Pixie Cut', emoji: '💇‍♀️' }
    ],
    top: [
        { name: 'Golden Corset', emoji: '🟡' },
        { name: 'Velvet Bodice', emoji: '🔵' },
        { name: 'Glittering Top', emoji: '🔴' },
        { name: 'Sailor Collar', emoji: '⚓' },
        { name: 'Fur Trim', emoji: '🟢' }
    ],
    bottom: [
        { name: 'Ballgown Skirt', emoji: '👗' },
        { name: 'Mermaid Tail', emoji: '🧜‍♀️' },
        { name: 'Frilly Tutu', emoji: '🟣' },
        { name: 'Starry Skirt', emoji: '⭐' },
        { name: 'Floral Peplum', emoji: '🌸' }
    ],
    shoes: [
        { name: 'Glass Slippers', emoji: '💎' },
        { name: 'Pink Heels', emoji: '👡' },
        { name: 'Sparkly Boots', emoji: '👢' },
        { name: 'Golden Sandals', emoji: '🥿' },
        { name: 'Ballet Flats', emoji: '🩰' }
    ],
    acc: [
        { name: 'Tiara', emoji: '👑' },
        { name: 'Magic Wand', emoji: '🪄' },
        { name: 'Pearl Necklace', emoji: '📿' },
        { name: 'Fairy Wings', emoji: '🦋' },
        { name: 'Ribbon Bow', emoji: '🎀' }
    ]
};

// Initial default state
let state = {
    bg: 0,
    hair: 0,
    top: 0,
    bottom: 0,
    shoes: 0,
    acc: 0
};

// Load saved design from LocalStorage
const savedState = localStorage.getItem(STORAGE_KEY);
if (savedState) {
    try {
        state = JSON.parse(savedState);
    } catch (e) {
        console.error("Failed to load saved dress-up state", e);
    }
}

let activeTab = 'bg';

// Populate clothing options grid dynamically
function renderCategoryItems() {
    itemsContainer.innerHTML = '';
    const items = categories[activeTab];
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `item-card ${state[activeTab] === index ? 'active' : ''}`;
        card.innerHTML = `
            <div class="item-preview">${item.emoji}</div>
            <div class="item-name">${item.name}</div>
        `;
        card.addEventListener('click', () => {
            state[activeTab] = index;
            playSound('tap');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            renderCategoryItems();
            drawPrincess();
        });
        itemsContainer.appendChild(card);
    });
}

// Tab selections Setup
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-category');
        playSound('tap');
        renderCategoryItems();
    });
});

// Render doll & items to Canvas
function drawPrincess() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Doll Coordinates Layout
    const dx = 200; // center
    const dy = 230; // base y offset

    // 1. Draw Background
    drawBg(ctx, state.bg);

    // 2. Accessories - Wings (behind doll)
    if (state.acc === 3) { // Fairy Wings
        drawWings(ctx, dx, dy);
    }
    if (state.acc === 4) { // Ribbon Bow (behind hair/head)
        drawRibbonBow(ctx, dx, dy - 95);
    }

    // 3. Doll Base Model
    drawDollBase(ctx, dx, dy);

    // 4. Shoes (Layer behind skirts)
    drawShoes(ctx, dx, dy, state.shoes);

    // 5. Skirt / Bottom
    drawBottom(ctx, dx, dy, state.bottom);

    // 6. Top / Bodice
    drawTop(ctx, dx, dy, state.top);

    // 7. Necklace
    if (state.acc === 2) { // Pearl Necklace
        drawNecklace(ctx, dx, dy);
    }

    // 8. Hair
    drawHair(ctx, dx, dy, state.hair);

    // 9. Accessories - Head / Hand (in front)
    if (state.acc === 0) { // Tiara
        drawTiara(ctx, dx, dy - 100);
    }
    if (state.acc === 1) { // Magic Wand
        drawWand(ctx, dx + 45, dy + 25);
    }
}

// --- Vector Drawer Helpers ---

// Background Drawers
function drawBg(ctx, index) {
    ctx.save();
    if (index === 0) { // Castle Garden
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#fbcfe8'); // pink sky
        grad.addColorStop(0.7, '#fdf2f8');
        grad.addColorStop(1, '#dcfce7'); // light green hills
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Hills
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(80, 520, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(320, 530, 220, 0, Math.PI * 2);
        ctx.fill();

        // Castle silhouette
        ctx.fillStyle = 'rgba(219, 39, 119, 0.2)';
        ctx.fillRect(60, 240, 60, 80);
        ctx.beginPath();
        ctx.moveTo(50, 240); ctx.lineTo(80, 190); ctx.lineTo(110, 240);
        ctx.fill();
        ctx.fillRect(40, 280, 20, 40);
        ctx.fillRect(120, 280, 20, 40);
    }
    else if (index === 1) { // Grand Ballroom
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#4c1d95'); // dark purple
        grad.addColorStop(0.5, '#7c3aed');
        grad.addColorStop(1, '#3b0764');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Columns
        ctx.fillStyle = '#fef08a'; // gold
        ctx.fillRect(0, 0, 25, canvas.height);
        ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(25, 0, 5, canvas.height);
        ctx.fillRect(canvas.width - 30, 0, 5, canvas.height);

        // Ballroom glow loops (Chandeliers)
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.arc(200, -20, 100, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(200, -20, 80, 0, Math.PI);
        ctx.stroke();
    }
    else if (index === 2) { // Enchanted Forest
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#115e59'); // dark teal
        grad.addColorStop(0.6, '#0f766e');
        grad.addColorStop(1, '#064e3b'); // dark green
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Trees
        ctx.fillStyle = 'rgba(13, 148, 136, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-50, 500); ctx.lineTo(80, 100); ctx.lineTo(150, 500);
        ctx.moveTo(250, 500); ctx.lineTo(320, 120); ctx.lineTo(450, 500);
        ctx.fill();

        // Fireflies
        ctx.fillStyle = '#fef08a';
        for (let i = 0; i < 8; i++) {
            let fx = (i * 77 + 23) % canvas.width;
            let fy = (i * 91 + 59) % (canvas.height - 100);
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#fef08a';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    else if (index === 3) { // Starry Sky
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#030712'); // deep space
        grad.addColorStop(0.5, '#111827');
        grad.addColorStop(1, '#1e1b4b'); // violet base
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Crescent moon
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(80, 80, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#030712';
        ctx.beginPath();
        ctx.arc(92, 75, 25, 0, Math.PI * 2);
        ctx.fill();

        // Twinkle stars
        ctx.fillStyle = 'white';
        for (let i = 0; i < 15; i++) {
            let sx = (i * 47 + 13) % canvas.width;
            let sy = (i * 61 + 29) % (canvas.height - 80);
            ctx.fillRect(sx, sy, 3, 3);
        }
    }
    else if (index === 4) { // Candy Kingdom
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#fda4af'); // rose candy
        grad.addColorStop(0.6, '#fecdd3');
        grad.addColorStop(1, '#fbcfe8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Candy lollipop hills
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(0, 500, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(400, 500, 180, 0, Math.PI * 2);
        ctx.fill();

        // White swirls
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(400, 500, 100, Math.PI, Math.PI*1.5);
        ctx.stroke();
    }
    ctx.restore();
}

// Doll Base Drawer
function drawDollBase(ctx, dx, dy) {
    ctx.save();

    // Skin Color Tone
    ctx.fillStyle = '#ffe5d9';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;

    // Legs
    ctx.fillRect(dx - 18, dy + 70, 10, 110);
    ctx.strokeRect(dx - 18, dy + 70, 10, 110);
    ctx.fillRect(dx + 8, dy + 70, 10, 110);
    ctx.strokeRect(dx + 8, dy + 70, 10, 110);

    // Torso (waist body)
    ctx.beginPath();
    ctx.moveTo(dx - 22, dy);
    ctx.lineTo(dx + 22, dy);
    ctx.lineTo(dx + 16, dy + 70);
    ctx.lineTo(dx - 16, dy + 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neck
    ctx.fillRect(dx - 7, dy - 25, 14, 28);
    ctx.strokeRect(dx - 7, dy - 25, 14, 28);

    // Head
    ctx.beginPath();
    ctx.arc(dx, dy - 60, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Face - Smiling Mouth
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(dx, dy - 54, 8, 0, Math.PI);
    ctx.stroke();

    // Face - Big Anime Eyes
    ctx.fillStyle = '#1e3a8a'; // Deep blue iris
    ctx.beginPath();
    ctx.arc(dx - 13, dy - 64, 7, 0, Math.PI * 2);
    ctx.arc(dx + 13, dy - 64, 7, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dx - 15, dy - 66, 2.5, 0, Math.PI * 2);
    ctx.arc(dx + 11, dy - 66, 2.5, 0, Math.PI * 2);
    ctx.arc(dx - 11, dy - 62, 1.2, 0, Math.PI * 2);
    ctx.arc(dx + 15, dy - 62, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyelashes/Brows
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx - 22, dy - 72); ctx.quadraticCurveTo(dx - 13, dy - 75, dx - 6, dy - 71);
    ctx.moveTo(dx + 6, dy - 71); ctx.quadraticCurveTo(dx + 13, dy - 75, dx + 22, dy - 72);
    ctx.stroke();

    // Blush Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'; // rosy pink
    ctx.beginPath();
    ctx.arc(dx - 22, dy - 54, 6, 0, Math.PI * 2);
    ctx.arc(dx + 22, dy - 54, 6, 0, Math.PI * 2);
    ctx.fill();

    // Left Arm (downward rest)
    ctx.fillStyle = '#ffe5d9';
    ctx.beginPath();
    ctx.arc(dx - 22, dy + 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(dx - 28, dy + 5, 8, 55);
    ctx.strokeRect(dx - 28, dy + 5, 8, 55);

    // Right Arm (outstretched to hold wand)
    ctx.fillRect(dx + 20, dy + 5, 30, 8);
    ctx.strokeRect(dx + 20, dy + 5, 30, 8);
    ctx.fillRect(dx + 44, dy + 5, 8, 30);
    ctx.strokeRect(dx + 44, dy + 5, 8, 30);

    ctx.restore();
}

// Wings Drawer (drawn behind)
function drawWings(ctx, dx, dy) {
    ctx.save();
    // Left Wing
    ctx.fillStyle = 'rgba(232, 121, 249, 0.7)'; // pastel pink/magenta
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(dx - 18, dy + 15);
    ctx.bezierCurveTo(dx - 120, dy - 60, dx - 100, dy + 80, dx - 18, dy + 45);
    ctx.bezierCurveTo(dx - 80, dy + 110, dx - 60, dy + 140, dx - 18, dy + 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(dx + 18, dy + 15);
    ctx.bezierCurveTo(dx + 120, dy - 60, dx + 100, dy + 80, dx + 18, dy + 45);
    ctx.bezierCurveTo(dx + 80, dy + 110, dx + 60, dy + 140, dx + 18, dy + 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Magic circles on wings
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx - 65, dy + 15, 6, 0, Math.PI * 2);
    ctx.arc(dx + 65, dy + 15, 6, 0, Math.PI * 2);
    ctx.arc(dx - 45, dy + 70, 4, 0, Math.PI * 2);
    ctx.arc(dx + 45, dy + 70, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Ribbon Bow (drawn behind hair)
function drawRibbonBow(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 2;

    // Loops
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 35, y - 25, x - 35, y + 25, x, y);
    ctx.bezierCurveTo(x + 35, y - 25, x + 35, y + 25, x, y);
    ctx.fill();
    ctx.stroke();

    // Center knot
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tails
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 5);
    ctx.lineTo(x - 18, y + 30);
    ctx.lineTo(x - 8, y + 30);
    ctx.closePath();
    ctx.moveTo(x + 3, y + 5);
    ctx.lineTo(x + 18, y + 30);
    ctx.lineTo(x + 8, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

// Hair Drawer
function drawHair(ctx, dx, dy, index) {
    ctx.save();
    const hx = dx;
    const hy = dy - 60;

    if (index === 0) { // Golden Curls
        ctx.fillStyle = '#fef08a'; // Blonde
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;

        // Long side locks
        ctx.beginPath();
        ctx.arc(hx - 32, hy + 20, 16, 0, Math.PI*2);
        ctx.arc(hx - 34, hy + 50, 14, 0, Math.PI*2);
        ctx.arc(hx + 32, hy + 20, 16, 0, Math.PI*2);
        ctx.arc(hx + 34, hy + 50, 14, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Main top cap
        ctx.beginPath();
        ctx.arc(hx, hy - 8, 40, Math.PI, 0);
        ctx.quadraticCurveTo(hx + 35, hy + 10, hx + 35, hy + 10);
        ctx.quadraticCurveTo(hx, hy - 2, hx - 35, hy + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bangs
        ctx.beginPath();
        ctx.moveTo(hx - 36, hy - 12);
        ctx.quadraticCurveTo(hx - 15, hy - 32, hx, hy - 18);
        ctx.quadraticCurveTo(hx + 15, hy - 32, hx + 36, hy - 12);
        ctx.quadraticCurveTo(hx, hy - 6, hx - 36, hy - 12);
        ctx.fill();
        ctx.stroke();
    }
    else if (index === 1) { // Pink Twin-Tails
        ctx.fillStyle = '#fbcfe8'; // Pink
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 2;

        // Twin-tails
        ctx.beginPath();
        ctx.arc(hx - 42, hy - 25, 24, 0, Math.PI * 2);
        ctx.arc(hx + 42, hy - 25, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hair ties
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(hx - 44, hy - 30, 8, 10);
        ctx.fillRect(hx + 36, hy - 30, 8, 10);

        // Head cap
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(hx, hy - 6, 38, Math.PI, 0);
        ctx.lineTo(hx + 35, hy + 10);
        ctx.quadraticCurveTo(hx, hy + 2, hx - 35, hy + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Straight bangs
        ctx.fillRect(hx - 28, hy - 28, 56, 12);
    }
    else if (index === 2) { // Royal Bun
        ctx.fillStyle = '#543d2b'; // Dark Brown
        ctx.strokeStyle = '#322318';
        ctx.lineWidth = 2;

        // The high bun
        ctx.beginPath();
        ctx.arc(hx, hy - 45, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hair fork/stick decoration
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx - 30, hy - 50); ctx.lineTo(hx + 30, hy - 38);
        ctx.stroke();

        // Head cap
        ctx.fillStyle = '#543d2b';
        ctx.strokeStyle = '#322318';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy - 5, 38, Math.PI, 0);
        ctx.quadraticCurveTo(hx + 35, hy + 8, hx + 35, hy + 8);
        ctx.quadraticCurveTo(hx, hy + 2, hx - 35, hy + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    else if (index === 3) { // Lavender Waves
        ctx.fillStyle = '#d8b4fe'; // Purple
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 2;

        // Long background flow
        ctx.beginPath();
        ctx.moveTo(hx - 38, hy);
        ctx.bezierCurveTo(hx - 60, hy + 40, hx - 20, hy + 80, hx - 35, hy + 120);
        ctx.lineTo(hx + 35, hy + 120);
        ctx.bezierCurveTo(hx + 20, hy + 80, hx + 60, hy + 40, hx + 38, hy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Head cap
        ctx.beginPath();
        ctx.arc(hx, hy - 6, 38, Math.PI, 0);
        ctx.quadraticCurveTo(hx + 36, hy + 10, hx + 36, hy + 10);
        ctx.quadraticCurveTo(hx, hy, hx - 36, hy + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    else if (index === 4) { // Pixie Cut
        ctx.fillStyle = '#f97316'; // Orange Bob
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2;

        // Short sides
        ctx.beginPath();
        ctx.arc(hx, hy - 6, 38, Math.PI, 0);
        ctx.lineTo(hx + 37, hy + 15);
        ctx.lineTo(hx + 25, hy + 10);
        ctx.lineTo(hx, hy + 5);
        ctx.lineTo(hx - 25, hy + 10);
        ctx.lineTo(hx - 37, hy + 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bangs
        ctx.beginPath();
        ctx.moveTo(hx - 36, hy - 14);
        ctx.lineTo(hx - 10, hy - 10);
        ctx.lineTo(hx + 15, hy - 18);
        ctx.lineTo(hx + 35, hy - 10);
        ctx.lineTo(hx + 20, hy - 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

// Tops Drawer
function drawTop(ctx, dx, dy, index) {
    ctx.save();
    // Draw top bodice matching torso contours
    const tx = dx;
    const ty = dy;

    if (index === 0) { // Golden Corset
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 21, ty);
        ctx.lineTo(tx + 21, ty);
        ctx.lineTo(tx + 16, ty + 42);
        ctx.lineTo(tx - 16, ty + 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lace shoulder straps
        ctx.strokeRect(tx - 18, ty - 12, 4, 12);
        ctx.strokeRect(tx + 14, ty - 12, 4, 12);

        // White frill trim
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tx - 10, ty + 2, 6, 0, Math.PI * 2);
        ctx.arc(tx, ty + 2, 6, 0, Math.PI * 2);
        ctx.arc(tx + 10, ty + 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (index === 1) { // Velvet Bodice (Blue)
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 22, ty + 5);
        ctx.quadraticCurveTo(tx, ty - 5, tx + 22, ty + 5);
        ctx.lineTo(tx + 16, ty + 45);
        ctx.lineTo(tx - 16, ty + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Red heart emblem
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tx - 4, ty + 20, 5, 0, Math.PI * 2);
        ctx.arc(tx + 4, ty + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx - 9, ty + 20);
        ctx.lineTo(tx, ty + 30);
        ctx.lineTo(tx + 9, ty + 20);
        ctx.fill();
    }
    else if (index === 2) { // Glittering Top (Hot Pink)
        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 22, ty + 8);
        ctx.lineTo(tx + 22, ty + 8);
        ctx.lineTo(tx + 16, ty + 36);
        ctx.lineTo(tx - 16, ty + 36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Silver sparkles
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(tx - 10, ty + 15, 3, 3);
        ctx.fillRect(tx + 8, ty + 22, 3, 3);
        ctx.fillRect(tx + 2, ty + 12, 3, 3);
        ctx.fillRect(tx - 6, ty + 26, 3, 3);
    }
    else if (index === 3) { // Sailor Collar
        ctx.fillStyle = '#f3f4f6';
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx - 21, ty);
        ctx.lineTo(tx + 21, ty);
        ctx.lineTo(tx + 16, ty + 42);
        ctx.lineTo(tx - 16, ty + 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sailor blue collar flaps
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(tx - 18, ty);
        ctx.lineTo(tx - 23, ty + 18);
        ctx.lineTo(tx - 6, ty + 18);
        ctx.closePath();
        ctx.moveTo(tx + 18, ty);
        ctx.lineTo(tx + 23, ty + 18);
        ctx.lineTo(tx + 6, ty + 18);
        ctx.closePath();
        ctx.fill();

        // Red bow
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tx - 4, ty + 18, 4, 0, Math.PI*2);
        ctx.arc(tx + 4, ty + 18, 4, 0, Math.PI*2);
        ctx.fill();
    }
    else if (index === 4) { // Fur Trim (Green)
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 22, ty);
        ctx.lineTo(tx + 22, ty);
        ctx.lineTo(tx + 16, ty + 45);
        ctx.lineTo(tx - 16, ty + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fluffy white fur cuffs and collar
        ctx.fillStyle = '#f9fafb';
        ctx.beginPath();
        ctx.arc(tx, ty + 3, 8, 0, Math.PI * 2);
        ctx.arc(tx - 16, ty + 2, 6, 0, Math.PI * 2);
        ctx.arc(tx + 16, ty + 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Bottoms / Skirts Drawer
function drawBottom(ctx, dx, dy, index) {
    ctx.save();
    const bx = dx;
    const by = dy + 40; // waist connect

    if (index === 0) { // Ballgown Skirt (Pink)
        ctx.fillStyle = '#f472b6';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(bx - 17, by);
        ctx.lineTo(bx + 17, by);
        ctx.bezierCurveTo(bx + 90, by + 40, bx + 110, by + 130, bx + 65, by + 140);
        ctx.lineTo(bx - 65, by + 140);
        ctx.bezierCurveTo(bx - 110, by + 130, bx - 90, by + 40, bx - 17, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vertical fold lines
        ctx.strokeStyle = 'rgba(219, 39, 119, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by + 15); ctx.quadraticCurveTo(bx - 20, by + 80, bx - 35, by + 140);
        ctx.moveTo(bx + 5, by + 15); ctx.quadraticCurveTo(bx + 20, by + 80, bx + 35, by + 140);
        ctx.moveTo(bx - 12, by + 12); ctx.quadraticCurveTo(bx - 50, by + 80, bx - 55, by + 140);
        ctx.moveTo(bx + 12, by + 12); ctx.quadraticCurveTo(bx + 50, by + 80, bx + 55, by + 140);
        ctx.stroke();
    }
    else if (index === 1) { // Mermaid Tail (Aqua)
        ctx.fillStyle = '#2dd4bf'; // teal
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2.5;

        // Snug skirt down to ankles then flairs
        ctx.beginPath();
        ctx.moveTo(bx - 17, by);
        ctx.lineTo(bx + 17, by);
        ctx.quadraticCurveTo(bx + 22, by + 50, bx + 12, by + 110);
        // fin flair right
        ctx.lineTo(bx + 35, by + 142);
        ctx.lineTo(bx, by + 125); // fin center
        // fin flair left
        ctx.lineTo(bx - 35, by + 142);
        ctx.lineTo(bx - 12, by + 110);
        ctx.quadraticCurveTo(bx - 22, by + 50, bx - 17, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Scales texture pattern
        ctx.strokeStyle = 'rgba(15, 118, 110, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx - 5, by + 40, 5, 0, Math.PI);
        ctx.arc(bx + 5, by + 40, 5, 0, Math.PI);
        ctx.arc(bx, by + 55, 5, 0, Math.PI);
        ctx.stroke();
    }
    else if (index === 2) { // Frilly Tutu (Lavender)
        ctx.fillStyle = '#c084fc';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 2.5;

        // Wide short tutu puff
        ctx.beginPath();
        ctx.moveTo(bx - 17, by);
        ctx.lineTo(bx + 17, by);
        ctx.bezierCurveTo(bx + 65, by + 5, bx + 85, by + 45, bx + 55, by + 65);
        // Frill bumps along bottom
        ctx.lineTo(bx - 55, by + 65);
        ctx.bezierCurveTo(bx - 85, by + 45, bx - 65, by + 5, bx - 17, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Under-petticoat layers
        ctx.fillStyle = '#e879f9';
        ctx.beginPath();
        ctx.arc(bx - 25, by + 62, 10, 0, Math.PI*2);
        ctx.arc(bx, by + 65, 12, 0, Math.PI*2);
        ctx.arc(bx + 25, by + 62, 10, 0, Math.PI*2);
        ctx.fill();
    }
    else if (index === 3) { // Starry Skirt (Dark Indigo)
        ctx.fillStyle = '#312e81'; // dark blue
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(bx - 17, by);
        ctx.lineTo(bx + 17, by);
        ctx.bezierCurveTo(bx + 70, by + 30, bx + 70, by + 110, bx + 45, by + 130);
        ctx.lineTo(bx - 45, by + 130);
        ctx.bezierCurveTo(bx - 70, by + 110, bx - 70, by + 30, bx - 17, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold stars
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(bx - 25, by + 45, 5, 5);
        ctx.fillRect(bx + 20, by + 60, 4, 4);
        ctx.fillRect(bx - 5, by + 85, 6, 6);
        ctx.fillRect(bx + 15, by + 105, 5, 5);
        ctx.fillRect(bx - 32, by + 95, 4, 4);
    }
    else if (index === 4) { // Floral Peplum (Yellow)
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(bx - 17, by);
        ctx.lineTo(bx + 17, by);
        ctx.bezierCurveTo(bx + 50, by + 10, bx + 60, by + 100, bx + 40, by + 125);
        ctx.lineTo(bx - 40, by + 125);
        ctx.bezierCurveTo(bx - 60, by + 100, bx - 50, by + 10, bx - 17, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Flowers
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(bx, by + 40, 5, 0, Math.PI * 2);
        ctx.arc(bx - 25, by + 80, 5, 0, Math.PI * 2);
        ctx.arc(bx + 22, by + 80, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Shoes Drawer
function drawShoes(ctx, dx, dy, index) {
    ctx.save();
    const lx = dx - 13;
    const rx = dx + 13;
    const sy = dy + 180; // feet base y

    if (index === 0) { // Glass Slippers (Glowing Cyan)
        ctx.fillStyle = '#a5f3fc';
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#22d3ee';

        ctx.fillRect(lx - 8, sy - 4, 12, 8);
        ctx.fillRect(rx - 4, sy - 4, 12, 8);
        ctx.strokeRect(lx - 8, sy - 4, 12, 8);
        ctx.strokeRect(rx - 4, sy - 4, 12, 8);
    }
    else if (index === 1) { // Pink Heels
        ctx.fillStyle = '#f472b6';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 1.5;

        // Shoes
        ctx.fillRect(lx - 7, sy - 2, 10, 6);
        ctx.fillRect(rx - 3, sy - 2, 10, 6);
        // Ribbons wrap around ankles
        ctx.beginPath();
        ctx.moveTo(lx - 5, sy - 2); ctx.lineTo(lx + 3, sy - 15);
        ctx.moveTo(lx + 3, sy - 2); ctx.lineTo(lx - 5, sy - 15);
        ctx.moveTo(rx - 1, sy - 2); ctx.lineTo(rx + 7, sy - 15);
        ctx.moveTo(rx + 7, sy - 2); ctx.lineTo(rx - 1, sy - 15);
        ctx.stroke();
    }
    else if (index === 2) { // Sparkly Boots
        ctx.fillStyle = '#e5e7eb';
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;

        ctx.fillRect(lx - 8, sy - 20, 11, 24);
        ctx.strokeRect(lx - 8, sy - 20, 11, 24);
        ctx.fillRect(rx - 3, sy - 20, 11, 24);
        ctx.strokeRect(rx - 3, sy - 20, 11, 24);
    }
    else if (index === 3) { // Golden Sandals
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;

        // Soles
        ctx.fillRect(lx - 8, sy + 1, 11, 3);
        ctx.fillRect(rx - 3, sy + 1, 11, 3);
        // Straps
        ctx.beginPath();
        ctx.moveTo(lx - 8, sy + 1); ctx.lineTo(lx + 3, sy - 3);
        ctx.moveTo(rx - 3, sy + 1); ctx.lineTo(rx + 8, sy - 3);
        ctx.stroke();
    }
    else if (index === 4) { // Ballet Flats (Red)
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1.5;

        ctx.fillRect(lx - 8, sy - 2, 11, 6);
        ctx.strokeRect(lx - 8, sy - 2, 11, 6);
        ctx.fillRect(rx - 3, sy - 2, 11, 6);
        ctx.strokeRect(rx - 3, sy - 2, 11, 6);
    }
    ctx.restore();
}

// Necklace Drawer
function drawNecklace(ctx, dx, dy) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(dx, dy - 28, 14, 0, Math.PI);
    ctx.stroke();

    // Emerald gem pendant center
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(dx, dy - 14, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// Tiara Drawer
function drawTiara(ctx, tx, ty) {
    ctx.save();
    ctx.fillStyle = '#cbd5e1'; // Silver tiara base
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(tx - 24, ty + 8);
    ctx.quadraticCurveTo(tx, ty, tx + 24, ty + 8);
    // Tiara crown spikes
    ctx.lineTo(tx + 18, ty - 6);
    ctx.lineTo(tx + 9, ty + 2);
    ctx.lineTo(tx, ty - 16); // High center spike
    ctx.lineTo(tx - 9, ty + 2);
    ctx.lineTo(tx - 18, ty - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gem sparkles
    ctx.fillStyle = '#38bdf8'; // Blue gems
    ctx.beginPath();
    ctx.arc(tx, ty - 10, 3, 0, Math.PI * 2);
    ctx.arc(tx - 15, ty - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(tx + 15, ty - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Wand Drawer (in right hand)
function drawWand(ctx, wx, wy) {
    ctx.save();

    // Wand rod
    ctx.strokeStyle = '#78350f'; // wood stick brown
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 20, wy - 50);
    ctx.stroke();

    // Star tip
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const cx = wx + 20;
    const cy = wy - 50;
    const spikes = 5;
    const outerRadius = 12;
    const innerRadius = 5;
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sparkle trail
    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.fillRect(cx - 15, cy + 12, 3, 3);
    ctx.fillRect(cx + 8, cy - 8, 2, 2);
    ctx.fillRect(cx - 2, cy - 25, 3, 3);

    ctx.restore();
}

// Randomize button action
randomBtn.addEventListener('click', () => {
    state.bg = Math.floor(Math.random() * categories.bg.length);
    state.hair = Math.floor(Math.random() * categories.hair.length);
    state.top = Math.floor(Math.random() * categories.top.length);
    state.bottom = Math.floor(Math.random() * categories.bottom.length);
    state.shoes = Math.floor(Math.random() * categories.shoes.length);
    state.acc = Math.floor(Math.random() * categories.acc.length);

    playSound('magic');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderCategoryItems();
    drawPrincess();
});

// Reset Button action
resetBtn.addEventListener('click', () => {
    state = { bg: 0, hair: 0, top: 0, bottom: 0, shoes: 0, acc: 0 };
    playSound('tap');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderCategoryItems();
    drawPrincess();
});

// Save Photo Screenshot Action
saveBtn.addEventListener('click', () => {
    playSound('shutter');
    setTimeout(() => {
        const link = document.createElement('a');
        link.download = 'my-princess.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, 200);
});

// Initialize rendering loop
renderCategoryItems();
drawPrincess();
