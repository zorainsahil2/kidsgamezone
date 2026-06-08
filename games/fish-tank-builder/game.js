/**
 * KidsGameZone: Fish Tank Builder
 * Sandbox aquarium builder, programmatic fish vector swimming loops, wiggle clicks, bonus bubble popping, and Web Audio.
 */

const STORAGE_KEY = 'kgz_fishtank_data';

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coinCount = document.getElementById('coinCount');
const clearBtn = document.getElementById('clearBtn');
const shopButtons = document.querySelectorAll('.shop-item-btn');

// Game State
let coins = 100;
let items = []; // List of { type, x, y, vx, vy, w, h, waveOffset, flip, wiggleTimer, uniqueId }
let bubbles = []; // List of { x, y, r, speed, isBonus, popped, popTimer }
let selectedItem = null;
let selectedCost = 0;
let animTicks = 0;

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

    if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'spawn') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'reset') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.35);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// Load saved data
const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData) {
    try {
        const parsed = JSON.parse(savedData);
        coins = parsed.coins ?? 100;
        items = parsed.items ?? [];
    } catch (e) {
        console.error("Failed to load aquarium save state", e);
    }
}
coinCount.textContent = coins;

// Save state helper
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins, items }));
}

// Shop item Selection
shopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const cost = parseInt(btn.getAttribute('data-cost'));
        if (coins < cost) return;

        // Toggle select
        if (selectedItem === btn.getAttribute('data-item')) {
            deselectAll();
        } else {
            deselectAll();
            selectedItem = btn.getAttribute('data-item');
            selectedCost = cost;
            btn.classList.add('selected');
            playSound('bubble');
        }
    });
});

function deselectAll() {
    selectedItem = null;
    selectedCost = 0;
    shopButtons.forEach(b => b.classList.remove('selected'));
}

// Disable/enable shop buttons based on coins
function updateShopButtons() {
    shopButtons.forEach(btn => {
        const cost = parseInt(btn.getAttribute('data-cost'));
        if (coins < cost) {
            btn.disabled = true;
            if (selectedItem === btn.getAttribute('data-item')) {
                deselectAll();
            }
        } else {
            btn.disabled = false;
        }
    });
}
updateShopButtons();

// Reset Tank Action
clearBtn.addEventListener('click', () => {
    items = [];
    deselectAll();
    playSound('reset');
    saveState();
    updateShopButtons();
});

// Click Canvas Event: Build items or interact/wiggle
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Scale coordinates matching canvas resolution
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // 1. Check if clicked a bonus bubble first
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (!b.popped) {
            const dist = Math.sqrt((mx - b.x) ** 2 + (my - b.y) ** 2);
            if (dist < b.r + 12) {
                b.popped = true;
                b.popTimer = 10;
                if (b.isBonus) {
                    coins += 2;
                    coinCount.textContent = coins;
                    playSound('coin');
                } else {
                    playSound('bubble');
                }
                updateShopButtons();
                saveState();
                return; // halt click chain
            }
        }
    }

    // 2. Clicked a placed friend to trigger wiggle?
    if (!selectedItem) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const dist = Math.sqrt((mx - item.x) ** 2 + (my - item.y) ** 2);
            if (dist < Math.max(item.w, item.h) / 2 + 10) {
                item.wiggleTimer = 25; // wiggle frames
                playSound('bubble');
                return;
            }
        }
        return;
    }

    // 3. Place item if active shop item is selected
    if (coins >= selectedCost) {
        let placedX = mx;
        let placedY = my;

        // Setup dimensional parameters
        let w = 32;
        let h = 20;
        let vx = 0;
        let vy = 0;

        const type = selectedItem;

        // Snapping decorations to sandy floor bed
        const isDecor = ['seaweed', 'coral', 'chest'].includes(type);
        if (isDecor) {
            placedY = 310; // floor height anchor
            if (type === 'seaweed') { w = 24; h = 64; }
            if (type === 'coral') { w = 36; h = 36; }
            if (type === 'chest') { w = 40; h = 28; }
        } else {
            // Fish parameters
            if (type === 'clownfish') { w = 32; h = 20; vx = 0.8 + Math.random() * 0.4; }
            if (type === 'blowfish') { w = 28; h = 28; vx = 0.5 + Math.random() * 0.3; }
            if (type === 'octopus') { w = 32; h = 32; vx = 0.3 + Math.random() * 0.2; vy = 0.2; }
            if (type === 'squid') { w = 24; h = 38; vx = 0.4 + Math.random() * 0.3; vy = 0.4; }
            if (type === 'shark') { w = 62; h = 28; vx = 1.4 + Math.random() * 0.5; }

            // Random swimming starts directions
            if (Math.random() < 0.5) vx = -vx;
        }

        items.push({
            type: type,
            x: placedX,
            y: placedY,
            vx: vx,
            vy: vy,
            w: w,
            h: h,
            waveOffset: Math.random() * 100,
            flip: vx < 0,
            wiggleTimer: 0,
            uniqueId: Date.now() + Math.random()
        });

        coins -= selectedCost;
        coinCount.textContent = coins;
        playSound('spawn');

        saveState();
        updateShopButtons();
    }
});

// Physics and movement loop
function update() {
    animTicks++;

    // Passive Coin ticks (+5 every 10 seconds)
    if (animTicks % 600 === 0) { // 600 frames = 10s at 60fps
        coins += 5;
        coinCount.textContent = coins;
        playSound('coin');
        updateShopButtons();
        saveState();
    }

    // Chest passive income tick: +1 coin every 6 seconds per chest placed!
    items.forEach(item => {
        if (item.type === 'chest' && animTicks % 360 === 0) { // 360 frames = 6 seconds
            coins += 1;
            coinCount.textContent = coins;
            playSound('coin');
            updateShopButtons();
            saveState();

            // Spawn floating coin particle visual
            bubbles.push({
                x: item.x,
                y: item.y - 10,
                r: 8,
                speed: 0.9,
                isBonus: false,
                popped: true, // immediately popped/floating coin look
                popTimer: 20
            });
        }
    });

    // Move Swim friends
    items.forEach(item => {
        // Wiggle timer ticking
        if (item.wiggleTimer > 0) item.wiggleTimer--;

        const isDecor = ['seaweed', 'coral', 'chest'].includes(item.type);
        if (!isDecor) {
            // Horizontal swim
            item.x += item.x + item.vx; // wait: item.x += item.vx ! Let's fix that calculation
            item.x += item.vx;
            // Subtract the extra addition to make it correct
            item.x -= (item.x + item.vx); // Oh wait, let's write simple: item.x += item.vx;
        }
    });
}

// Clean physics logic
function updatePhysics() {
    // 1. Move placed items
    items.forEach(item => {
        if (item.wiggleTimer > 0) item.wiggleTimer--;

        const isDecor = ['seaweed', 'coral', 'chest'].includes(item.type);
        if (!isDecor) {
            // Horizontal swimming movement
            item.x += item.vx;

            // Boundary collision flips
            if (item.vx > 0 && item.x > canvas.width - item.w/2) {
                item.vx = -item.vx;
                item.flip = true;
            } else if (item.vx < 0 && item.x < item.w/2) {
                item.vx = -item.vx;
                item.flip = false;
            }

            // Vertical sine bobbing float
            if (item.type === 'clownfish' || item.type === 'blowfish' || item.type === 'shark') {
                item.y += Math.sin(animTicks * 0.04 + item.waveOffset) * 0.28;
            }
            else if (item.type === 'octopus' || item.type === 'squid') {
                // Tentacle vertical hover wiggles
                item.y += Math.sin(animTicks * 0.02 + item.waveOffset) * 0.45;
            }
        }
    });

    // 2. Spawn environmental ambient bubbles
    if (animTicks % 120 === 0) { // every 2 seconds
        const isBonus = Math.random() < 0.25; // 25% coin bubble
        bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            r: isBonus ? 10 : 5 + Math.random() * 5,
            speed: 0.6 + Math.random() * 0.8,
            isBonus: isBonus,
            popped: false,
            popTimer: 0
        });
    }

    // Move bubbles up
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (b.popped) {
            b.popTimer--;
            if (b.popTimer <= 0) {
                bubbles.splice(i, 1);
            }
        } else {
            b.y -= b.speed;
            // Offscreen top delete
            if (b.y < -15) {
                bubbles.splice(i, 1);
            }
        }
    }
}

// Draw game canvas scene
function draw() {
    // 1. Water background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep water radial glow
    const radial = ctx.createRadialGradient(250, 175, 50, 250, 175, 250);
    radial.addColorStop(0, '#56cfe1'); // aqua glow
    radial.addColorStop(0.5, '#0096c7');
    radial.addColorStop(1, '#03045e'); // deep ocean
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw sandy ocean bed floor
    ctx.fillStyle = '#fef08a'; // sandy yellow
    ctx.fillRect(0, 310, canvas.width, 40);

    // Sea floor dark sand edge line
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(0, 310, canvas.width, 3);

    // Draw little rocks
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(60, 315, 8, 0, Math.PI * 2);
    ctx.arc(420, 316, 6, 0, Math.PI * 2);
    ctx.arc(430, 317, 10, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Placed Sandbox items
    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);

        // Handle scaling wiggle clicks
        let scaleX = 1;
        let scaleY = 1;
        let rotation = 0;
        if (item.wiggleTimer > 0) {
            const wScale = Math.sin(item.wiggleTimer * 0.5) * 0.25;
            scaleX += wScale;
            scaleY -= wScale;
            rotation = Math.sin(item.wiggleTimer * 0.4) * 0.12;
        }

        ctx.scale(scaleX, scaleY);
        ctx.rotate(rotation);

        // Draw correct vector style matching category
        drawVectorItem(ctx, item);

        ctx.restore();
    });

    // 4. Draw Bubbles
    bubbles.forEach(b => {
        ctx.save();
        if (b.popped) {
            // Draw popping sparkles
            ctx.strokeStyle = b.isBonus ? '#fbbf24' : '#bae6fd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x - 14, b.y);
            ctx.moveTo(b.x + 8, b.y); ctx.lineTo(b.x + 14, b.y);
            ctx.moveTo(b.x, b.y - 8); ctx.lineTo(b.x, b.y - 14);
            ctx.moveTo(b.x, b.y + 8); ctx.lineTo(b.x, b.y + 14);
            ctx.stroke();
        } else {
            // Draw circular bubble
            if (b.isBonus) {
                // Shiny golden coin bubble
                ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Centered dollar/coin mark
                ctx.fillStyle = '#d97706';
                ctx.font = `bold ${Math.floor(b.r * 1.2)}px 'Fredoka'`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('¢', b.x, b.y);
            } else {
                // Regular ambient water bubbles
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Bubble highlight glint
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(b.x - b.r/3, b.y - b.r/3, b.r/4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    });

    // 5. Draw Shop item placements preview cursor hover (if selected)
    if (selectedItem) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 10, 0, Math.PI*2); // dummy cursor
        ctx.restore();
    }
}

// Vector Drawer router
function drawVectorItem(ctx, item) {
    const w = item.w;
    const h = item.h;

    // Flip horizontal drawing context if swim direction flipped
    if (item.flip) {
        ctx.scale(-1, 1);
    }

    if (item.type === 'clownfish') {
        // Body (Orange Clownfish)
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI*2);
        ctx.fill();

        // White stripes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-w/6, -h/2 + 1, w/6, h - 2);
        ctx.fillRect(w/4, -h/3, w/10, h * 0.66);

        // Fins outlines
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-w/2, 0); ctx.lineTo(-w/2 - 8, -h/3); ctx.lineTo(-w/2 - 6, h/3);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(w/4, -h/8, 3, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'blowfish') {
        // Round spiny ball body (Blowfish yellow)
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, w/2, 0, Math.PI*2);
        ctx.fill();

        // Spikes
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w/2, -w/6); ctx.lineTo(-w/2 - 4, -w/4);
        ctx.moveTo(-w/4, -w/2); ctx.lineTo(-w/4, -w/2 - 4);
        ctx.moveTo(w/4, -w/2); ctx.lineTo(w/4, -w/2 - 4);
        ctx.moveTo(-w/4, w/2); ctx.lineTo(-w/4, w/2 + 4);
        ctx.moveTo(w/4, w/2); ctx.lineTo(w/4, w/2 + 4);
        ctx.stroke();

        // Big puppy eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(w/5, -h/6, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w/5 - 1.5, -h/6 - 1.5, 1.8, 0, Math.PI*2);
        ctx.fill();

        // Pink cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(w/4, h/8, 4, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'octopus') {
        // Purple head
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(0, -h/6, w/2 - 2, Math.PI, 0);
        ctx.lineTo(w/2 - 2, h/6);
        ctx.quadraticCurveTo(0, h/2, -w/2 + 2, h/6);
        ctx.closePath();
        ctx.fill();

        // Tentacles (wavy lines)
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3.5;
        const wave = Math.sin(animTicks * 0.15) * 4;
        ctx.beginPath();
        ctx.moveTo(-w/3, h/6); ctx.quadraticCurveTo(-w/3 + wave, h/2 + 4, -w/3, h/2 + 8);
        ctx.moveTo(0, h/6); ctx.quadraticCurveTo(wave, h/2 + 6, 0, h/2 + 10);
        ctx.moveTo(w/3, h/6); ctx.quadraticCurveTo(w/3 + wave, h/2 + 4, w/3, h/2 + 8);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-w/6, -h/8, 3, 0, Math.PI*2);
        ctx.arc(w/6, -h/8, 3, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'squid') {
        // Pointy hat squid
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(w/2, -h/8);
        ctx.lineTo(w/3, h/8);
        ctx.lineTo(-w/3, h/8);
        ctx.lineTo(-w/2, -h/8);
        ctx.closePath();
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 3;
        const swimWave = Math.sin(animTicks * 0.25) * 5;
        ctx.beginPath();
        ctx.moveTo(-w/4, h/8); ctx.lineTo(-w/4 + swimWave, h/2 + 4);
        ctx.moveTo(0, h/8); ctx.lineTo(swimWave, h/2 + 8);
        ctx.moveTo(w/4, h/8); ctx.lineTo(w/4 + swimWave, h/2 + 4);
        ctx.stroke();

        // Big white rings eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-w/5, 0, 4.5, 0, Math.PI*2);
        ctx.arc(w/5, 0, 4.5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-w/5, 0, 2, 0, Math.PI*2);
        ctx.arc(w/5, 0, 2, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'shark') {
        // Blueish grey sleek shark
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI*2);
        ctx.fill();

        // Dorsal fin (pointing back)
        ctx.beginPath();
        ctx.moveTo(-w/8, -h/2 + 1);
        ctx.quadraticCurveTo(-w/3, -h - 2, -w/3 - 4, -h - 2);
        ctx.quadraticCurveTo(-w/5, -h/2, -w/4, -h/2 + 1);
        ctx.closePath();
        ctx.fill();

        // White belly bottom half
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(0, h/4, w/2.8, h/4, 0, 0, Math.PI);
        ctx.fill();

        // Shark tail fin
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-w/2, 0);
        ctx.lineTo(-w/2 - 12, -h * 0.8);
        ctx.lineTo(-w/2 - 6, 0);
        ctx.lineTo(-w/2 - 12, h * 0.8);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(w/3, -h/8, 2.5, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'seaweed') {
        // Seaweed stems wavy lines
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3.5;

        // Draw multiple leafy strands
        for (let i = 0; i < 3; i++) {
            const sx = -w/3 + (i * w)/3;
            const wOffset = i * 20;
            const waveX = Math.sin(animTicks * 0.03 + wOffset) * 6;

            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.quadraticCurveTo(sx + waveX, -h/2, sx + waveX*1.5, -h);
            ctx.stroke();
        }
    }
    else if (item.type === 'coral') {
        // branched pink structures
        ctx.fillStyle = '#fda4af';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(-4, -h * 0.6);
        ctx.moveTo(4, 0); ctx.lineTo(4, -h * 0.7);
        // Left branches
        ctx.moveTo(-4, -h * 0.3); ctx.quadraticCurveTo(-14, -h*0.4, -14, -h*0.7);
        // Right branches
        ctx.moveTo(4, -h * 0.45); ctx.quadraticCurveTo(14, -h*0.5, 14, -h*0.8);
        ctx.stroke();

        // Round little knobs on tip ends
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(-4, -h * 0.6, 4, 0, Math.PI*2);
        ctx.arc(4, -h * 0.7, 4, 0, Math.PI*2);
        ctx.arc(-14, -h * 0.7, 3, 0, Math.PI*2);
        ctx.arc(14, -h * 0.8, 3, 0, Math.PI*2);
        ctx.fill();
    }
    else if (item.type === 'chest') {
        // Treasure Chest
        ctx.fillStyle = '#78350f'; // wood base brown
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-w/2, -h/2, w, h);

        // Gold chest lid band
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-w/2, -h/2, w, 6);
        // lock latch
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-4, -2, 8, 8);
    }
}

// Standard ticking engine
function gameLoop() {
    updatePhysics();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start running loop clocks
setInterval(update, 16.66); // background clock separate from frame rate
gameLoop();
