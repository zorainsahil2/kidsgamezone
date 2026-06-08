/**
 * KidsGameZone: Tower Defense
 * Waypoints path-finding vectors, tower range calculations, splash and freeze beams, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_tower-defense';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const livesVal = document.getElementById('livesVal');
const goldVal = document.getElementById('goldVal');
const waveVal = document.getElementById('waveVal');
const highScoreVal = document.getElementById('highScoreVal');
const nextWaveBtn = document.getElementById('nextWaveBtn');
const storeItems = document.querySelectorAll('.store-item');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const winOverlay = document.getElementById('winOverlay');
const winScoreVal = document.getElementById('winScoreVal');
const winHighScoreVal = document.getElementById('winHighScoreVal');
const winPlayAgainBtn = document.getElementById('winPlayAgainBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const failScoreVal = document.getElementById('failScoreVal');
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

    if (type === 'shoot_arrow') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'shoot_cannon') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'shoot_freeze') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'breach') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    }
}

// Config
const GRID_CELL = 40;
const COLS = 15; // 600px width
const ROWS = 10; // 400px height

// Winding Path coordinates: list of {r, c}
const PATH_CELLS = [
    {r:3, c:0}, {r:3, c:1}, {r:3, c:2}, {r:3, c:3}, 
    {r:4, c:3}, {r:5, c:3}, {r:6, c:3}, 
    {r:6, c:4}, {r:6, c:5}, {r:6, c:6}, 
    {r:5, c:6}, {r:4, c:6}, {r:3, c:6}, 
    {r:3, c:7}, {r:3, c:8}, {r:3, c:9}, 
    {r:4, c:9}, {r:5, c:9}, {r:6, c:9}, {r:7, c:9}, 
    {r:7, c:10}, {r:7, c:11}, {r:7, c:12}, 
    {r:6, c:12}, {r:5, c:12}, {r:4, c:12}, {r:3, c:12}, 
    {r:3, c:13}, {r:3, c:14}
];

// Pre-calculate waypoints centers
const WAYPOINTS = PATH_CELLS.map(cell => ({
    x: cell.c * GRID_CELL + GRID_CELL / 2,
    y: cell.r * GRID_CELL + GRID_CELL / 2
}));

// Tower Specs
const TOWER_SPECS = {
    arrow: { label: 'Arrow', cost: 50, range: 110, fireRate: 35, color: '#4299e1', emoji: '🏹', damage: 12 },
    cannon: { label: 'Cannon', cost: 80, range: 85, fireRate: 65, color: '#dd6b20', emoji: '💣', damage: 32 },
    freeze: { label: 'Freeze', cost: 70, range: 80, fireRate: 50, color: '#319795', emoji: '❄️', damage: 5 }
};

// State Variables
let score = 0;
let lives = 20;
let gold = 100;
let currentWave = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Entities
let grid = []; // 2D grid holding tower objects or null
let towers = []; // flat list of active towers
let enemies = []; // list of active creep monsters
let projectiles = []; // list of moving cannonballs/arrows
let blastRings = []; // visual freeze/cannon blast indicators
let spawnQueue = []; // enemies waiting to be spawned this wave
let spawnInterval = 0;

highScoreVal.textContent = highScore;

// Check if a cell is path
function isPathCell(r, c) {
    return PATH_CELLS.some(cell => cell.r === r && cell.c === c);
}

// Build empty grid
function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            grid[r][c] = null;
        }
    }
    towers = [];
}

// Store active tower select
let selectedTowerType = 'arrow';

function selectStoreItem(type) {
    selectedTowerType = type;
    storeItems.forEach(item => {
        if (item.dataset.tower === type) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

storeItems.forEach(item => {
    item.addEventListener('click', () => {
        selectStoreItem(item.dataset.tower);
    });
});

// Spawn enemies queue
function queueWave(waveNum) {
    spawnQueue = [];
    const count = 10;
    // HP scaling up 40% per wave
    const hp = 30 + Math.floor((waveNum - 1) * 22);
    const speed = 1.1 + (waveNum * 0.05);

    for (let i = 0; i < count; i++) {
        spawnQueue.push({
            x: WAYPOINTS[0].x,
            y: WAYPOINTS[0].y,
            waypointIdx: 0,
            hp: hp,
            maxHp: hp,
            speed: speed,
            baseSpeed: speed,
            slowDuration: 0,
            radius: 9,
            active: true
        });
    }
}

// Add tower placement
function placeTower(row, col) {
    if (gameOver || !gameStarted) return;
    if (isPathCell(row, col)) return; // path blocked
    if (grid[row][col] !== null) return; // already occupied

    const spec = TOWER_SPECS[selectedTowerType];
    if (gold >= spec.cost) {
        gold -= spec.cost;
        goldVal.textContent = gold;

        const newTower = {
            row: row,
            col: col,
            x: col * GRID_CELL + GRID_CELL / 2,
            y: row * GRID_CELL + GRID_CELL / 2,
            type: selectedTowerType,
            range: spec.range,
            fireRate: spec.fireRate,
            cooldown: 0,
            emoji: spec.emoji,
            color: spec.color,
            damage: spec.damage
        };

        grid[row][col] = newTower;
        towers.push(newTower);
        playSound('coin');
    }
}

// Frame updates
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Spawning queued creeps
    if (spawnQueue.length > 0) {
        spawnInterval++;
        if (spawnInterval >= 40) { // spaced by 40 frames
            enemies.push(spawnQueue.shift());
            spawnInterval = 0;
        }
    }

    // 2. Move Creeps
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.active) continue;

        // Apply slow freeze timers
        if (e.slowDuration > 0) {
            e.slowDuration--;
            e.speed = e.baseSpeed * 0.5; // 50% slow
            if (e.slowDuration <= 0) e.speed = e.baseSpeed;
        }

        // Travel to next waypoint
        const target = WAYPOINTS[e.waypointIdx + 1];
        if (target) {
            const dx = target.x - e.x;
            const dy = target.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < e.speed) {
                // Next waypoint reached
                e.x = target.x;
                e.y = target.y;
                e.waypointIdx++;
            } else {
                // Move towards it
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }
        } else {
            // Reached End! Breach castle!
            e.active = false;
            enemies.splice(i, 1);
            lives--;
            livesVal.textContent = lives;
            playSound('breach');

            if (lives <= 0) {
                endGame(false);
            }
            continue;
        }
    }

    // 3. Towers Target & Shoot
    towers.forEach(t => {
        if (t.cooldown > 0) {
            t.cooldown--;
        }

        if (t.cooldown <= 0) {
            // Find closest active enemy within range
            let closestEnemy = null;
            let minDist = t.range;

            enemies.forEach(e => {
                if (!e.active) return;
                const dist = Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    closestEnemy = e;
                }
            });

            if (closestEnemy) {
                shootTower(t, closestEnemy);
                t.cooldown = t.fireRate;
            }
        }
    });

    // 4. Move Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        // move towards target position coords
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < proj.speed) {
            // Reached target coordinate, trigger impact
            impactProjectile(proj);
            projectiles.splice(i, 1);
        } else {
            proj.x += (dx / dist) * proj.speed;
            proj.y += (dy / dist) * proj.speed;
        }
    }

    // 5. Blast Rings update
    for (let i = blastRings.length - 1; i >= 0; i--) {
        const ring = blastRings[i];
        ring.radius += 2.5;
        ring.alpha -= 0.05;
        if (ring.alpha <= 0) {
            blastRings.splice(i, 1);
        }
    }

    // Check Wave complete status (to enable button)
    const activeCreepsCount = enemies.length + spawnQueue.length;
    if (activeCreepsCount === 0 && currentWave > 0 && !gameOver) {
        nextWaveBtn.disabled = false;
        if (currentWave === 5 && activeCreepsCount === 0) {
            endGame(true); // Victory after wave 5
        }
    }
}

// Shoot projectives trigger
function shootTower(tower, enemy) {
    if (tower.type === 'arrow') {
        playSound('shoot_arrow');
        projectiles.push({
            x: tower.x,
            y: tower.y,
            targetX: enemy.x,
            targetY: enemy.y,
            speed: 6.5,
            damage: tower.damage,
            type: 'arrow',
            enemyRef: enemy
        });
    } else if (tower.type === 'cannon') {
        playSound('shoot_cannon');
        projectiles.push({
            x: tower.x,
            y: tower.y,
            targetX: enemy.x,
            targetY: enemy.y,
            speed: 4.8,
            damage: tower.damage,
            type: 'cannon'
        });
    } else if (tower.type === 'freeze') {
        playSound('shoot_freeze');
        // Instantly hit target with freeze blast
        enemy.slowDuration = 90; // 1.5s slow
        enemy.hp = Math.max(0, enemy.hp - tower.damage);
        checkEnemyDead(enemy);

        blastRings.push({
            x: tower.x,
            y: tower.y,
            radius: 10,
            maxRadius: tower.range,
            color: 'rgba(78, 205, 196, 0.25)',
            alpha: 0.8
        });
    }
}

function impactProjectile(proj) {
    if (proj.type === 'arrow') {
        // Direct hit single target
        if (proj.enemyRef && proj.enemyRef.active) {
            proj.enemyRef.hp = Math.max(0, proj.enemyRef.hp - proj.damage);
            checkEnemyDead(proj.enemyRef);
        }
    } else if (proj.type === 'cannon') {
        // Cannon Splash impact
        playSound('explode');
        blastRings.push({
            x: proj.targetX,
            y: proj.targetY,
            radius: 8,
            maxRadius: 40,
            color: 'rgba(221, 107, 32, 0.45)',
            alpha: 0.8
        });

        // Splash radius = 50px
        enemies.forEach(e => {
            if (!e.active) return;
            const dist = Math.sqrt((e.x - proj.targetX) ** 2 + (e.y - proj.targetY) ** 2);
            if (dist <= 50) {
                e.hp = Math.max(0, e.hp - proj.damage);
                checkEnemyDead(e);
            }
        });
    }
}

function checkEnemyDead(enemy) {
    if (enemy.hp <= 0 && enemy.active) {
        enemy.active = false;
        // remove
        const idx = enemies.indexOf(enemy);
        if (idx !== -1) enemies.splice(idx, 1);

        gold += 10;
        score += 15;
        goldVal.textContent = gold;
        scoreVal.textContent = score;
        playSound('coin');
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Grass grid background
    ctx.fillStyle = '#2f855a'; // Grass base green
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines helpers
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let c = 0; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID_CELL, 0);
        ctx.lineTo(c * GRID_CELL, canvas.height);
        ctx.stroke();
    }
    for (let r = 0; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID_CELL);
        ctx.lineTo(canvas.width, r * GRID_CELL);
        ctx.stroke();
    }

    // 2. Draw winding path road
    ctx.fillStyle = '#cbd5e0'; // Light gray road asphalt
    PATH_CELLS.forEach(cell => {
        ctx.fillRect(cell.c * GRID_CELL, cell.r * GRID_CELL, GRID_CELL, GRID_CELL);

        // curb border dots
        ctx.fillStyle = '#718096';
        ctx.fillRect(cell.c * GRID_CELL + 1, cell.r * GRID_CELL + 1, 3, 3);
        ctx.fillStyle = '#cbd5e0'; // restore
    });

    // 3. Draw Castle endpoints (goal)
    ctx.fillStyle = '#718096';
    const finalCell = PATH_CELLS[PATH_CELLS.length - 1];
    ctx.fillRect(finalCell.c * GRID_CELL + 20, finalCell.r * GRID_CELL + 2, 18, 36);

    // 4. Draw Towers
    towers.forEach(t => {
        ctx.save();
        ctx.fillStyle = t.color;
        // base circle
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // draw tower emoji in center
        ctx.fillStyle = '#fff';
        ctx.font = '14px Nunito';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.emoji, t.x, t.y);
        ctx.restore();
    });

    // 5. Draw Enemies (creeps circles)
    enemies.forEach(e => {
        if (!e.active) return;
        ctx.save();

        // Slowed visual indicator (cyan overlay)
        ctx.fillStyle = e.slowDuration > 0 ? '#4ECDC4' : '#e53e3e';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Face eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(e.x - 3, e.y - 2, 2.5, 0, Math.PI*2);
        ctx.arc(e.x + 3, e.y - 2, 2.5, 0, Math.PI*2);
        ctx.fill();

        // HP bar overlay
        const barW = 20;
        const barH = 3.5;
        const pct = e.hp / e.maxHp;
        ctx.fillStyle = '#718096'; // bg bar
        ctx.fillRect(e.x - barW/2, e.y - e.radius - 8, barW, barH);
        ctx.fillStyle = '#48bb78'; // green fill
        ctx.fillRect(e.x - barW/2, e.y - e.radius - 8, barW * pct, barH);

        ctx.restore();
    });

    // 6. Draw Projectiles
    projectiles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.type === 'arrow' ? '#ecc94b' : '#1a202c';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'arrow' ? 2.5 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 7. Draw blast visual rings
    blastRings.forEach(ring => {
        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Clicks coordinates grid placement
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const col = Math.floor(clickX / GRID_CELL);
    const row = Math.floor(clickY / GRID_CELL);

    placeTower(row, col);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    const col = Math.floor(clickX / GRID_CELL);
    const row = Math.floor(clickY / GRID_CELL);

    placeTower(row, col);
}, { passive: false });

// Start wave button trigger
nextWaveBtn.addEventListener('click', () => {
    if (gameOver || !gameStarted) return;
    if (enemies.length > 0 || spawnQueue.length > 0) return; // wave already active

    currentWave++;
    waveVal.textContent = currentWave;
    queueWave(currentWave);
    nextWaveBtn.disabled = true;
});

// State triggers
function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    lives = 20;
    gold = 100;
    currentWave = 0;

    scoreVal.textContent = score;
    livesVal.textContent = lives;
    goldVal.textContent = gold;
    waveVal.textContent = currentWave;

    initGrid();
    enemies = [];
    projectiles = [];
    blastRings = [];
    spawnQueue = [];
    spawnInterval = 0;

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    winOverlay.classList.remove('active');

    nextWaveBtn.disabled = false;
    gameOver = false;
    gameStarted = true;
}

function endGame(won) {
    gameOver = true;
    if (won) {
        playSound('win');
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_KEY, highScore);
            highScoreVal.textContent = highScore;
        }
        winScoreVal.textContent = score;
        winHighScoreVal.textContent = highScore;
        winOverlay.classList.add('active');
    } else {
        playSound('breach');
        failScoreVal.textContent = score;
        gameOverOverlay.classList.add('active');
    }
}

startBtn.addEventListener('click', startGame);
winPlayAgainBtn.addEventListener('click', startGame);
failRestartBtn.addEventListener('click', startGame);

// Start
gameLoop();
