/**
 * KidsGameZone: Stickman Fighter
 * 2D side-view physics engine, AABB collision boxes, state-machine animations,
 * fighting AI behaviors, mobile virtual D-pads, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_stickman-fighter';

// DOM Selectors
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerVal = document.getElementById('timerVal');
const roundText = document.getElementById('roundText');
const fightAlert = document.getElementById('fightAlert');
const playerHpBar = document.getElementById('playerHp');
const aiHpBar = document.getElementById('aiHp');
const playerWinsContainer = document.getElementById('playerWins');
const aiWinsContainer = document.getElementById('aiWins');

// Mobile Buttons
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnJump = document.getElementById('btnJump');
const btnPunch = document.getElementById('btnPunch');
const btnKick = document.getElementById('btnKick');
const btnBlock = document.getElementById('btnBlock');

// Overlays
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
const overlayHighScoreVal = document.getElementById('overlayHighScoreVal');
const failRestartBtn = document.getElementById('failRestartBtn');
const endTitle = document.getElementById('endTitle');
const endMessage = document.getElementById('endMessage');

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

    if (type === 'punch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'kick') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'block') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // high metallic cling
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// Game Rules config
const FLOOR_Y = 220;
const GRAVITY = 0.35;
const WALK_SPEED = 2.5;
const JUMP_FORCE = -8.0;

// Game State
let matchesWon = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let currentRound = 1;
let roundTime = 60;
let playerHp = 100;
let aiHp = 100;
let playerRoundWins = 0;
let aiRoundWins = 0;
let roundActive = false;
let gameStarted = false;
let gameOver = false;

let animTicks = 0;
let timerClock = null;

// Fighter Objects
let player = {
    x: 120, y: FLOOR_Y, vx: 0, vy: 0, isJumping: false,
    state: 'idle', stateTimer: 0, isBlocking: false, hitTimer: 0, facing: 'right'
};

let ai = {
    x: 380, y: FLOOR_Y, vx: 0, vy: 0, isJumping: false,
    state: 'idle', stateTimer: 0, isBlocking: false, hitTimer: 0, facing: 'left'
};

// Hit Sparkles particles
let sparkles = []; // { x, y, vx, vy, size, alpha, color }

function spawnSparkles(x, y, color = '#f97316') {
    for (let i = 0; i < 8; i++) {
        sparkles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: -1 - Math.random() * 3,
            size: 3 + Math.random() * 3,
            alpha: 1,
            color: color
        });
    }
}

highScoreVal.textContent = highScore;

// Start Match Session
function startMatch() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    matchesWon = 0;
    playerRoundWins = 0;
    aiRoundWins = 0;
    currentRound = 1;
    gameOver = false;
    gameStarted = true;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');

    initRound();
}

function initRound() {
    playerHp = 100;
    aiHp = 100;
    roundTime = 60;
    roundActive = false;
    sparkles = [];

    // Reset UI Health bars
    playerHpBar.style.width = '100%';
    aiHpBar.style.width = '100%';
    timerVal.textContent = roundTime;
    roundText.textContent = `ROUND ${currentRound}`;

    // Reset rounds wins indicators dots
    updateWinsUI();

    // Reset Fighters position
    player.x = 120; player.y = FLOOR_Y; player.vx = 0; player.vy = 0;
    player.state = 'idle'; player.stateTimer = 0; player.isBlocking = false; player.hitTimer = 0;
    player.facing = 'right';

    ai.x = 380; ai.y = FLOOR_Y; ai.vx = 0; ai.vy = 0;
    ai.state = 'idle'; ai.stateTimer = 0; ai.isBlocking = false; ai.hitTimer = 0;
    ai.facing = 'left';

    // "FIGHT!" alert banner count
    fightAlert.classList.add('active');
    setTimeout(() => {
        fightAlert.classList.remove('active');
        roundActive = true;
        if (timerClock) clearInterval(timerClock);
        timerClock = setInterval(onSecondTick, 1000);
    }, 1200);
}

function updateWinsUI() {
    const pDots = playerWinsContainer.querySelectorAll('.dot');
    const aDots = aiWinsContainer.querySelectorAll('.dot');

    pDots.forEach((d, idx) => {
        if (idx < playerRoundWins) d.classList.add('win');
        else d.classList.remove('win');
    });

    aDots.forEach((d, idx) => {
        if (idx < aiRoundWins) d.classList.add('win');
        else d.classList.remove('win');
    });
}

function onSecondTick() {
    if (!roundActive || gameOver) return;
    roundTime--;
    timerVal.textContent = roundTime;

    if (roundTime <= 0) {
        // Evaluate winner by HP
        if (playerHp > aiHp) {
            endRound('player');
        } else if (aiHp > playerHp) {
            endRound('ai');
        } else {
            endRound('tie');
        }
    }
}

// Fight moves handlers
function executeAttack(attacker, type) {
    if (attacker.state !== 'idle' && attacker.state !== 'walk') return;
    attacker.state = type;
    attacker.stateTimer = type === 'punch' ? 12 : 16; // animation frames length

    // Check hitboxes collision AABB intersection
    const isPlayer = attacker === player;
    const defender = isPlayer ? ai : player;
    const reach = type === 'punch' ? 45 : 55;

    let hit = false;
    const dx = Math.abs(attacker.x - defender.x);

    // Is facing in correct direction
    const correctSide = isPlayer ? (ai.x > player.x) : (player.x > ai.x);

    if (dx <= reach && correctSide && Math.abs(attacker.y - defender.y) < 30) {
        hit = true;
    }

    if (hit) {
        const damage = type === 'punch' ? 10 : 15;
        applyDamage(defender, damage);
    } else {
        playSound(type); // swing miss whoosh sound
    }
}

function applyDamage(defender, damage) {
    let finalDmg = damage;
    if (defender.isBlocking) {
        finalDmg = Math.floor(damage * 0.5);
        playSound('block');
        spawnSparkles(defender.x, defender.y - 30, '#38bdf8');
    } else {
        playSound(attackerType(defender));
        spawnSparkles(defender.x, defender.y - 30, '#ef4444');
        defender.hitTimer = 10; // flash red
    }

    if (defender === ai) {
        aiHp = Math.max(0, aiHp - finalDmg);
        aiHpBar.style.width = `${aiHp}%`;
        if (aiHp <= 0) endRound('player');
    } else {
        playerHp = Math.max(0, playerHp - finalDmg);
        playerHpBar.style.width = `${playerHp}%`;
        if (playerHp <= 0) endRound('ai');
    }
}

function attackerType(defender) {
    return defender === ai ? 'punch' : 'punch'; // standard hit impact sound
}

// End Round / Match Complete Evaluations
function endRound(winner) {
    roundActive = false;
    clearInterval(timerClock);

    if (winner === 'player') playerRoundWins++;
    if (winner === 'ai') aiRoundWins++;

    updateWinsUI();

    setTimeout(() => {
        if (playerRoundWins === 2) {
            endMatch('player');
        } else if (aiRoundWins === 2) {
            endMatch('ai');
        } else {
            currentRound++;
            initRound();
        }
    }, 1500);
}

function endMatch(winner) {
    gameOver = true;
    gameStarted = false;

    if (winner === 'player') {
        matchesWon++;
        endTitle.textContent = "🏆 Match Victory!";
        endMessage.textContent = "You knocked out the AI bot! Awesome brawler!";
        playSound('win');
    } else {
        endTitle.textContent = "😭 Knock Out!";
        endMessage.textContent = "The AI Bot won this match. Try again!";
    }

    if (matchesWon > highScore) {
        highScore = matchesWon;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }

    failScoreVal.textContent = matchesWon;
    overlayHighScoreVal.textContent = highScore;
    gameOverOverlay.classList.add('active');
}

// Simulation Physics & updates loop
function update() {
    animTicks++;

    if (roundActive && !gameOver) {
        // 1. Move Player Physics (gravity + bounds)
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        if (player.y >= FLOOR_Y) {
            player.y = FLOOR_Y;
            player.vy = 0;
            player.isJumping = false;
        }

        // Keep inside bounds
        player.x = Math.max(20, Math.min(canvas.width - 20, player.x));

        // 2. AI Brawler state ticks
        updateAI();

        // 3. Tick animation timers
        tickFighterState(player);
        tickFighterState(ai);

        // Adjust facings
        player.facing = ai.x >= player.x ? 'right' : 'left';
        ai.facing = player.x >= ai.x ? 'right' : 'left';
    }

    // Move hit sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15; // gravity
        s.alpha -= 0.02;
        if (s.alpha <= 0) {
            sparkles.splice(i, 1);
        }
    }
}

function tickFighterState(f) {
    if (f.hitTimer > 0) f.hitTimer--;

    if (f.state !== 'idle' && f.state !== 'walk') {
        f.stateTimer--;
        if (f.stateTimer <= 0) {
            f.state = 'idle';
        }
    }
}

// AI logic tick simulator
function updateAI() {
    ai.vy += GRAVITY;
    ai.x += ai.vx;
    ai.y += ai.vy;

    if (ai.y >= FLOOR_Y) {
        ai.y = FLOOR_Y;
        ai.vy = 0;
        ai.isJumping = false;
    }
    ai.x = Math.max(20, Math.min(canvas.width - 20, ai.x));

    if (ai.state !== 'idle' && ai.state !== 'walk') return;

    const dx = player.x - ai.x;
    const dist = Math.abs(dx);

    // AI reactive block (block if player is attacking in range)
    if (dist <= 60 && (player.state === 'punch' || player.state === 'kick')) {
        if (Math.random() < 0.4) {
            ai.isBlocking = true;
            ai.state = 'idle';
            return;
        }
    }

    ai.isBlocking = false;

    // AI navigation decision tree
    if (dist > 50) {
        // Move towards player
        ai.vx = Math.sign(dx) * WALK_SPEED * 0.75;
        ai.state = 'walk';
    } else {
        // In fight range
        ai.vx = 0;
        ai.state = 'idle';

        // Attack or back away
        const roll = Math.random();
        if (roll < 0.06) {
            executeAttack(ai, 'punch');
        } else if (roll < 0.10) {
            executeAttack(ai, 'kick');
        } else if (roll < 0.18) {
            // Jump retreat
            ai.vy = JUMP_FORCE;
            ai.vx = -Math.sign(dx) * WALK_SPEED;
            ai.isJumping = true;
        } else if (roll < 0.22) {
            ai.isBlocking = true;
        }
    }
}

// --- Render Engine ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Sunset horizon grid background details
    ctx.fillStyle = '#1e1b4b'; // deep indigo sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun disc fading
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(250, 140, 50, 0, Math.PI, true);
    ctx.fill();

    // Floor ground lines
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y); ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Draw grid floor perspective lines
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
    ctx.lineWidth = 1.5;
    for (let x = -100; x < canvas.width + 100; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x + 50, FLOOR_Y); ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw Fighters
    drawStickman(ctx, player, '#38bdf8'); // Cyan player
    drawStickman(ctx, ai, '#f87171');     // Red AI

    // Draw Sparkles
    sparkles.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });
}

function drawStickman(ctx, f, color) {
    ctx.save();

    // Red hit flash filter
    if (f.hitTimer > 0) {
        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = '#ef4444';
    } else {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
    }

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const hx = f.x;
    const hy = f.y - 50;

    // 1. Draw head circle
    ctx.beginPath();
    ctx.arc(hx, hy, 7, 0, Math.PI * 2);
    ctx.stroke();
    if (f.hitTimer > 0) ctx.fill();

    // 2. Spine line
    ctx.beginPath();
    ctx.moveTo(hx, hy + 7);
    ctx.lineTo(hx, f.y - 20);
    ctx.stroke();

    const sign = f.facing === 'right' ? 1 : -1;
    const waistY = f.y - 20;

    // 3. Legs drawing
    if (f.isJumping) {
        // Tuck knees
        ctx.beginPath();
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx - 8, f.y - 12);
        ctx.lineTo(hx - 4, f.y - 5);
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx + 8, f.y - 12);
        ctx.lineTo(hx + 4, f.y - 5);
        ctx.stroke();
    } else if (f.state === 'kick') {
        // Kicking leg extends horizontally, other stands
        ctx.beginPath();
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx + 28 * sign, f.y - 28); // high kick
        ctx.lineTo(hx + 44 * sign, f.y - 28);
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx - 6 * sign, f.y - 10);
        ctx.lineTo(hx - 4 * sign, f.y);
        ctx.stroke();
    } else if (f.vx !== 0) {
        // Scissor walk
        const step = Math.sin(animTicks * 0.22) * 12;
        ctx.beginPath();
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx + step, f.y);
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx - step, f.y);
        ctx.stroke();
    } else {
        // Idle knees bent
        ctx.beginPath();
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx - 8 * sign, f.y - 10);
        ctx.lineTo(hx - 6 * sign, f.y);
        ctx.moveTo(hx, waistY);
        ctx.lineTo(hx + 8 * sign, f.y - 10);
        ctx.lineTo(hx + 10 * sign, f.y);
        ctx.stroke();
    }

    // 4. Arms drawing
    if (f.state === 'punch') {
        // Extend punching arm forward straight
        ctx.beginPath();
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx + 30 * sign, hy + 14); // straight punch
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx - 8 * sign, hy + 24);
        ctx.lineTo(hx - 4 * sign, hy + 14);
        ctx.stroke();
    } else if (f.isBlocking) {
        // Guard crossed arms at face
        ctx.beginPath();
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx + 8 * sign, hy + 2);
        ctx.lineTo(hx + 4 * sign, hy - 4);
        ctx.stroke();

        // Draw protective blue shield aura bubble
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(hx, hy + 10, 24, -Math.PI/2, Math.PI/2);
        ctx.stroke();
    } else if (f.state === 'kick') {
        // Arms back for leverage balance
        ctx.beginPath();
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx - 18 * sign, hy + 8);
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx - 12 * sign, hy + 22);
        ctx.stroke();
    } else {
        // Idle hands up guard
        ctx.beginPath();
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx + 10 * sign, hy + 14);
        ctx.lineTo(hx + 8 * sign, hy + 2);
        ctx.moveTo(hx, hy + 14);
        ctx.lineTo(hx - 6 * sign, hy + 18);
        ctx.lineTo(hx - 4 * sign, hy + 8);
        ctx.stroke();
    }

    ctx.restore();
}

// Controller key listeners
let isLeft = false;
let isRight = false;

function applyInputs() {
    if (!roundActive || gameOver) return;
    if (player.isBlocking) {
        player.vx = 0;
        return;
    }

    if (isLeft) {
        player.vx = -WALK_SPEED;
    } else if (isRight) {
        player.vx = WALK_SPEED;
    } else {
        player.vx = 0;
    }
}

window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowLeft') isLeft = true;
    if (e.key === 'ArrowRight') isRight = true;
    if (e.key === 'ArrowUp' && !player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
    }

    if (e.key === 'a' || e.key === 'A') executeAttack(player, 'punch');
    if (e.key === 's' || e.key === 'S') executeAttack(player, 'kick');
    if (e.key === 'd' || e.key === 'D') {
        player.isBlocking = true;
    }
    applyInputs();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') isLeft = false;
    if (e.key === 'ArrowRight') isRight = false;
    if (e.key === 'd' || e.key === 'D') {
        player.isBlocking = false;
    }
    applyInputs();
});

// Mobile Dpad Touch Registers
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); isLeft = true; applyInputs(); }, { passive: false });
btnLeft.addEventListener('touchend', () => { isLeft = false; applyInputs(); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); isRight = true; applyInputs(); }, { passive: false });
btnRight.addEventListener('touchend', () => { isRight = false; applyInputs(); });
btnJump.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
    }
}, { passive: false });

btnPunch.addEventListener('touchstart', (e) => { e.preventDefault(); executeAttack(player, 'punch'); }, { passive: false });
btnKick.addEventListener('touchstart', (e) => { e.preventDefault(); executeAttack(player, 'kick'); }, { passive: false });
btnBlock.addEventListener('touchstart', (e) => { e.preventDefault(); player.isBlocking = true; }, { passive: false });
btnBlock.addEventListener('touchend', () => { player.isBlocking = false; });

// Core engine game clock ticks
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Action hooks
startBtn.addEventListener('click', startMatch);
failRestartBtn.addEventListener('click', startMatch);

// Start Loop
gameLoop();
