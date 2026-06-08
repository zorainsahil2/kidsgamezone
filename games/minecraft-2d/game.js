/**
 * KidsGameZone: Minecraft 2D Creative Builder
 * 2D canvas block grids, player rigid body tile collisions, sand gravity simulation, and hotbar selections.
 */

const STORAGE_KEY = 'kgz_highscore_minecraft-2d';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const clearBtn = document.getElementById('clearBtn');
const hotbarSlots = document.querySelectorAll('.hotbar-slot');

// Audio
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

    if (type === 'break') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'place') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    }
}

// Grid Constants
const BLOCK_SIZE = 30;
const COLS = 20; // 600px width
const ROWS = 15; // 450px height

// Block definitions
const BLOCKS = {
    0: { name: 'Air', color: 'transparent', solid: false },
    1: { name: 'Grass', color: '#48bb78', border: '#22543d', solid: true },
    2: { name: 'Dirt', color: '#8d5b4c', border: '#5c3e35', solid: true },
    3: { name: 'Stone', color: '#a0aec0', border: '#4a5568', solid: true },
    4: { name: 'Wood', color: '#b7791f', border: '#744210', solid: true },
    5: { name: 'Leaves', color: '#2f855a', border: '#1c5234', solid: true },
    6: { name: 'Sand', color: '#ecc94b', border: '#b7791f', solid: true }
};

// Game state
let grid = [];
let blocksPlaced = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let activeBlock = 1; // Default to Grass

// Player settings
let player = {
    x: 100,
    y: 150,
    w: 18,
    h: 36,
    vx: 0,
    vy: 0,
    onGround: false,
    speed: 2.8,
    jumpForce: -6.2
};

// Controls mapping
const keys = {
    Left: false,
    Right: false,
    Up: false,
    Jump: false
};

highScoreVal.textContent = highScore;

// Generate Default World
function generateWorld() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r < 8) {
                grid[r][c] = 0; // Air
            } else if (r === 8) {
                // Grass surface, except a sand patch
                if (c >= 13 && c <= 16) {
                    grid[r][c] = 6; // Sand
                } else {
                    grid[r][c] = 1; // Grass
                }
            } else if (r >= 9 && r <= 11) {
                if (c >= 13 && c <= 16) {
                    grid[r][c] = 6;
                } else {
                    grid[r][c] = 2; // Dirt
                }
            } else {
                grid[r][c] = 3; // Stone
            }
        }
    }

    // Add a Tree
    grid[7][5] = 4; // wood trunk
    grid[6][5] = 4;
    grid[5][5] = 4;
    // Leaves crown
    grid[4][4] = 5; grid[4][5] = 5; grid[4][6] = 5;
    grid[3][4] = 5; grid[3][5] = 5; grid[3][6] = 5;
    grid[2][5] = 5;

    // Reset player position safety
    player.x = 90;
    player.y = 120;
    player.vx = 0;
    player.vy = 0;
}

// Collisions check
function checkTileSolid(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true; // boundaries are solid
    const type = grid[row][col];
    return BLOCKS[type].solid;
}

function checkPlayerCollisions(px, py) {
    // Check bounding box overlaps with solid tiles
    const leftCol = Math.floor(px / BLOCK_SIZE);
    const rightCol = Math.floor((px + player.w) / BLOCK_SIZE);
    const topRow = Math.floor(py / BLOCK_SIZE);
    const bottomRow = Math.floor((py + player.h) / BLOCK_SIZE);

    const hit = {
        solid: false,
        top: false,
        bottom: false,
        left: false,
        right: false,
        row: -1,
        col: -1
    };

    for (let r = topRow; r <= bottomRow; r++) {
        for (let c = leftCol; c <= rightCol; c++) {
            if (checkTileSolid(r, c)) {
                hit.solid = true;
                hit.row = r;
                hit.col = c;
                return hit;
            }
        }
    }
    return hit;
}

// Physics & sand updates
function update() {
    // 1. Sand gravity updates (processed bottom to top to fall properly)
    for (let r = ROWS - 2; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 6) { // if Sand
                if (grid[r + 1][c] === 0) { // Air below
                    grid[r + 1][c] = 6;
                    grid[r][c] = 0;
                }
            }
        }
    }

    // 2. Horizontal move
    player.vx = 0;
    if (keys.Left) player.vx = -player.speed;
    if (keys.Right) player.vx = player.speed;

    player.x += player.vx;
    // Resolve horizontal collision
    let hitX = checkPlayerCollisions(player.x, player.y);
    if (hitX.solid) {
        if (player.vx > 0) {
            player.x = hitX.col * BLOCK_SIZE - player.w - 0.1;
        } else if (player.vx < 0) {
            player.x = (hitX.col + 1) * BLOCK_SIZE + 0.1;
        }
    }

    // 3. Vertical gravity move
    player.vy += 0.28; // Gravity
    if (player.vy > 9.5) player.vy = 9.5; // terminal velocity

    // Jump trigger
    if (keys.Jump && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
        playSound('jump');
    }

    player.y += player.vy;
    player.onGround = false;

    // Resolve vertical collision
    let hitY = checkPlayerCollisions(player.x, player.y);
    if (hitY.solid) {
        if (player.vy > 0) {
            player.y = hitY.row * BLOCK_SIZE - player.h - 0.1;
            player.vy = 0;
            player.onGround = true;
        } else if (player.vy < 0) {
            player.y = (hitY.row + 1) * BLOCK_SIZE + 0.1;
            player.vy = 0;
        }
    }

    // Player falls out of world boundary check
    if (player.y > canvas.height) {
        player.x = 90;
        player.y = 120;
        player.vx = 0;
        player.vy = 0;
    }
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw blocks grid
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const blockType = grid[r][c];
            if (blockType !== 0) {
                const spec = BLOCKS[blockType];
                ctx.save();
                ctx.fillStyle = spec.color;
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

                // Borders details
                ctx.strokeStyle = spec.border;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

                // Add 3D-like highlight edge inside blocks
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, 4); // top glow
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, 4, BLOCK_SIZE); // left glow

                ctx.restore();
            }
        }
    }

    // Draw Player (Stevy pixel character)
    ctx.save();
    ctx.fillStyle = '#4299e1'; // Blue Shirt
    ctx.fillRect(player.x, player.y + 12, player.w, 14);

    ctx.fillStyle = '#ecc94b'; // Peach skin head
    ctx.fillRect(player.x + 3, player.y, player.w - 6, 12);

    ctx.fillStyle = '#2f3542'; // Dark Pants
    ctx.fillRect(player.x, player.y + 26, player.w, 10);
    ctx.restore();

    // Draw target indicator cursor selector under mouse cursor range
    // Hover details drawn during gameplay
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Mining / Placing interaction details
function handleInteraction(e, isRightClick) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mouseX = ((clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((clientY - rect.top) / rect.height) * canvas.height;

    // Convert to grid index
    const col = Math.floor(mouseX / BLOCK_SIZE);
    const row = Math.floor(mouseY / BLOCK_SIZE);

    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    // Range distance check (only allow edits within 4.5 tiles from player)
    const playerGridX = (player.x + player.w / 2) / BLOCK_SIZE;
    const playerGridY = (player.y + player.h / 2) / BLOCK_SIZE;
    const dist = Math.sqrt((col - playerGridX) ** 2 + (row - playerGridY) ** 2);
    if (dist > 4.5) return;

    if (isRightClick) {
        // Place Block
        if (grid[row][col] === 0) {
            // Check if player body intersects placement cell
            const cellLeft = col * BLOCK_SIZE;
            const cellTop = row * BLOCK_SIZE;
            if (player.x + player.w > cellLeft && player.x < cellLeft + BLOCK_SIZE &&
                player.y + player.h > cellTop && player.y < cellTop + BLOCK_SIZE) {
                return; // overlap block place blocked!
            }

            grid[row][col] = activeBlock;
            playSound('place');
            blocksPlaced++;
            scoreVal.textContent = blocksPlaced;

            if (blocksPlaced > highScore) {
                highScore = blocksPlaced;
                localStorage.setItem(STORAGE_KEY, highScore);
                highScoreVal.textContent = highScore;
            }
        }
    } else {
        // Left click: Break Block
        if (grid[row][col] !== 0) {
            grid[row][col] = 0;
            playSound('break');
        }
    }
}

// Listeners for click/touches
canvas.addEventListener('mousedown', (e) => {
    const isRight = (e.button === 2);
    handleInteraction(e, isRight);
});

// Block context menu display block override
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('touchstart', (e) => {
    // Simulating break on touch
    handleInteraction(e, false);
}, { passive: false });

// Keyboard controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = true;
    } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keys.Jump = true;
    }

    // Hotbar selection numbers keys 1-6
    if (e.key >= '1' && e.key <= '6') {
        const slotIdx = parseInt(e.key) - 1;
        selectHotbarSlot(slotIdx);
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.Left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.Right = false;
    } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keys.Jump = false;
    }
});

function selectHotbarSlot(index) {
    hotbarSlots.forEach((slot, idx) => {
        if (idx === index) {
            slot.classList.add('active');
            activeBlock = parseInt(slot.dataset.block);
        } else {
            slot.classList.remove('active');
        }
    });
}

hotbarSlots.forEach((slot, index) => {
    slot.addEventListener('click', () => {
        selectHotbarSlot(index);
    });
});

clearBtn.addEventListener('click', () => {
    generateWorld();
    blocksPlaced = 0;
    scoreVal.textContent = blocksPlaced;
});

// Setup Initial
generateWorld();
gameLoop();
