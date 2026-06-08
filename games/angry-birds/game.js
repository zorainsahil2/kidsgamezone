/**
 * KidsGameZone: Angry Monkey
 * Rebranded and redesigned exactly like the original Angry Birds.
 * Features light sky/yellow horizon, grass-on-dirt layered ground, Y-slingshot,
 * Flying Monkey physics, and 6 classic Poached Eggs style level layouts.
 */

const STORAGE_KEY = 'kgz_highscore_angry-birds';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelVal = document.getElementById('levelVal');
const scoreVal = document.getElementById('scoreVal');
const ammoVal = document.getElementById('ammoVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const levelWinOverlay = document.getElementById('levelWinOverlay');
const bonusVal = document.getElementById('bonusVal');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const gameWinOverlay = document.getElementById('gameWinOverlay');
const finalScoreVal = document.getElementById('finalScoreVal');
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

    if (type === 'stretch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'launch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.setValueAtTime(659, now + 0.1); // E5
        osc.frequency.setValueAtTime(783, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046, now + 0.3); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
    }
}

// Config
const GROUND_Y = 350;
const SLINGSHOT_X = 150;
const SLINGSHOT_Y = 280;
const gravity = 0.2;

// Asset mapping for 37 files
const ASSET_PATHS = {
    hero: 'assets/Flying_Monkey.png',
    tnt: 'assets/Explosive_Crate.png',
    // Enemies
    hedgehog_blue: 'assets/Spiky Hedgehog_blue.png',
    hedgehog_brown: 'assets/Spiky Hedgehog_brown.png',
    hedgehog_red: 'assets/Spiky Hedgehog_red.png',
    blob_green: 'assets/Alien_Blobs_green.png',
    blob_pink: 'assets/Alien_Blobs_pink.png',
    blob_purple: 'assets/Alien_Blobs_purpul.png',
    tortoise_brown: 'assets/Armored_Tortoise_brown.png',
    tortoise_gray: 'assets/Armored_Tortoise_gray.png',
    tortoise_green: 'assets/Armored_Tortoise_green.png',
    crow_black: 'assets/Crow_black.png',
    crow_blue: 'assets/Crow_blue.png',
    crow_green: 'assets/Crow_green.png',
    spider_blue: 'assets/Cyber-Spiders_blue.png',
    spider_red: 'assets/Cyber-Spiders_red.png',
    spider_yellow: 'assets/Cyber-Spiders_yellow.png',
    cat_gray: 'assets/Evil_Cat_gray.png',
    cat_orange: 'assets/Evil_Cat_orang.png',
    cat_patterns: 'assets/Evil_Cat_patterns.png',
    // Materials
    glass_circle: 'assets/Glass_Blocks_Circle.png',
    glass_rectangle: 'assets/Glass_Blocks_Rectangle.png',
    glass_square: 'assets/Glass_Blocks_Square.png',
    gold_rectangle: 'assets/Golden_Treasure_Blocks_Rectangle.png',
    gold_square: 'assets/Golden_Treasure_Blocks_Square.png',
    metal_rectangle: 'assets/Metal_Block_Rectangle.png',
    metal_square: 'assets/Metal_Block_Square.png',
    metal_square2: 'assets/Metal_Block_Square2.png',
    rubber_circle: 'assets/Rubber_Blocks_Circle.png',
    rubber_curved: 'assets/Rubber_Blocks_Curved.png',
    rubber_square: 'assets/Rubber_Blocks_Square.png',
    stone_circle: 'assets/Stone_Block_Circle.png',
    stone_rectangle: 'assets/Stone_Block_Rectangle.png',
    stone_square: 'assets/Stone_Block_Square.png',
    wood_rectangle: 'assets/Wood_Blocks_Rectangle.png',
    wood_square: 'assets/Wood_Blocks_Square.png',
    wood_triangle: 'assets/Wood_Blocks_Triangle.png'
};

const images = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSET_PATHS).length;
let gameReady = false;

function loadGameAssets() {
    for (let key in ASSET_PATHS) {
        images[key] = new Image();
        images[key].onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                gameReady = true;
            }
        };
        images[key].src = ASSET_PATHS[key];
    }
}
loadGameAssets();

// Material Physics Profiles
const MATERIAL_PROFILES = {
    wood: { mass: 1.0, bounciness: 0.1, durability: 3.0, isBreakable: true },
    glass: { mass: 0.5, bounciness: 0.1, durability: 0.8, isBreakable: true },
    stone: { mass: 3.0, bounciness: 0.1, durability: 8.0, isBreakable: true },
    metal: { mass: Infinity, bounciness: 0.1, durability: 999.0, isBreakable: false },
    rubber: { mass: 1.5, bounciness: 0.85, durability: 12.0, isBreakable: true },
    gold: { mass: 5.0, bounciness: 0.05, durability: 5.0, isBreakable: true },
    tnt: { mass: 1.0, bounciness: 0.1, durability: 0.5, isBreakable: true }
};

// State Variables
let currentLevel = 1;
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let birdsLeft = 3;
let gameOver = false;
let gameStarted = false;

// Physics objects
let bird = null; // {x, y, vx, vy, radius, isDragged, isLaunched, path: [], rotation, squashTimer}
let blocks = []; // list of blocks
let enemies = []; // list of enemies
let smokeParticles = [];
let sparkParticles = []; // magical trailing particles

highScoreVal.textContent = highScore;

// Levels Configurations - Remapped to match authentic Angry Birds layouts
const PIG_TYPES_EASY = ['blob_green', 'blob_pink', 'crow_green', 'crow_blue'];
const PIG_TYPES_MEDIUM = ['hedgehog_blue', 'hedgehog_brown', 'spider_yellow', 'spider_blue', 'blob_purple', 'hedgehog_red'];
const PIG_TYPES_HARD = ['tortoise_green', 'tortoise_brown', 'tortoise_gray', 'cat_gray', 'cat_orange', 'cat_patterns', 'spider_red', 'crow_black'];

function getLevelData(lvlNum) {
    let seed = lvlNum * 123.45;
    function rand() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    function randRange(min, max) {
        return min + rand() * (max - min);
    }
    function randChoice(arr) {
        return arr[Math.floor(rand() * arr.length)];
    }
    function getPigType(difficulty, randVal) {
        if (difficulty < 0.3) {
            return PIG_TYPES_EASY[Math.floor(randVal * PIG_TYPES_EASY.length)];
        } else if (difficulty < 0.65) {
            if (randVal < 0.3) return PIG_TYPES_EASY[Math.floor(randVal * 3)];
            return PIG_TYPES_MEDIUM[Math.floor(randVal * PIG_TYPES_MEDIUM.length)];
        } else {
            if (randVal < 0.15) return PIG_TYPES_EASY[Math.floor(randVal * 3)];
            if (randVal < 0.4) return PIG_TYPES_MEDIUM[Math.floor(randVal * PIG_TYPES_MEDIUM.length)];
            return PIG_TYPES_HARD[Math.floor(randVal * PIG_TYPES_HARD.length)];
        }
    }

    let blocksList = [];
    let pigsList = [];

    // Difficulty coefficients
    let difficulty = lvlNum / 50; // 0.02 to 1.0

    // Set bird count based on difficulty
    let ammo = 3;
    if (lvlNum <= 10) ammo = 4;
    else if (lvlNum > 40 && rand() < 0.35) ammo = 2; // extreme difficulty!

    // Choose archetype (0 to 5)
    let archetype = (lvlNum - 1) % 6;

    if (archetype === 0) {
        // --- Archetype 0: Single Tower ---
        let base = Math.floor(randRange(560, 600));
        let stories = Math.min(4, 1 + Math.floor(difficulty * 3.2));
        let width = Math.floor(randRange(80, 110));
        
        let wallMat = 'wood';
        if (difficulty > 0.3) wallMat = randChoice(['wood', 'stone']);
        if (difficulty > 0.7) wallMat = randChoice(['stone', 'metal', 'rubber']);

        let deckMat = 'wood';
        if (difficulty > 0.4) deckMat = randChoice(['wood', 'stone', 'glass']);

        for (let s = 0; s < stories; s++) {
            let yBottom = GROUND_Y - s * 100;
            // Left wall
            blocksList.push({ x: base - width/2, y: yBottom - 80, w: 20, h: 80, material: wallMat, shape: 'rectangle' });
            // Right wall
            blocksList.push({ x: base + width/2 - 20, y: yBottom - 80, w: 20, h: 80, material: wallMat, shape: 'rectangle' });
            // Deck
            blocksList.push({ x: base - width/2 - 10, y: yBottom - 100, w: width + 20, h: 20, material: deckMat, shape: 'rectangle' });
            // Pig inside
            pigsList.push({ x: base, y: yBottom - 40, r: 16, type: getPigType(difficulty, rand()) });

            // Random TNT inside for medium+ levels
            if (s > 0 && difficulty > 0.4 && rand() < 0.3) {
                blocksList.push({ x: base - 20, y: yBottom - 40, w: 40, h: 40, material: 'tnt', shape: 'square' });
            }
        }
        // Top cap
        if (rand() < 0.6) {
            blocksList.push({ x: base - 20, y: GROUND_Y - stories * 100 - 40, w: 40, h: 40, material: wallMat, shape: 'triangle' });
            pigsList.push({ x: base, y: GROUND_Y - stories * 100 - 40 - 16, r: 16, type: getPigType(difficulty, rand()) });
        } else {
            pigsList.push({ x: base, y: GROUND_Y - stories * 100 - 16, r: 16, type: getPigType(difficulty, rand()) });
        }

    } else if (archetype === 1) {
        // --- Archetype 1: Double Towers ---
        let base1 = Math.floor(randRange(510, 540));
        let base2 = Math.floor(randRange(650, 680));
        let stories = Math.min(3, 1 + Math.floor(difficulty * 2.5));
        let width = Math.floor(randRange(70, 90));

        let mat1 = randChoice(['wood', 'glass']);
        let mat2 = randChoice(['stone', 'wood']);
        if (difficulty > 0.6) {
            mat1 = randChoice(['stone', 'rubber']);
            mat2 = randChoice(['stone', 'metal']);
        }

        // Tower 1
        for (let s = 0; s < stories; s++) {
            let yBottom = GROUND_Y - s * 100;
            blocksList.push({ x: base1 - width/2, y: yBottom - 80, w: 20, h: 80, material: mat1, shape: 'rectangle' });
            blocksList.push({ x: base1 + width/2 - 20, y: yBottom - 80, w: 20, h: 80, material: mat1, shape: 'rectangle' });
            blocksList.push({ x: base1 - width/2 - 10, y: yBottom - 100, w: width + 20, h: 20, material: mat1, shape: 'rectangle' });
            pigsList.push({ x: base1, y: yBottom - 40, r: 16, type: getPigType(difficulty, rand()) });
        }
        pigsList.push({ x: base1, y: GROUND_Y - stories * 100 - 16, r: 16, type: getPigType(difficulty, rand()) });

        // Tower 2
        for (let s = 0; s < stories; s++) {
            let yBottom = GROUND_Y - s * 100;
            blocksList.push({ x: base2 - width/2, y: yBottom - 80, w: 20, h: 80, material: mat2, shape: 'rectangle' });
            blocksList.push({ x: base2 + width/2 - 20, y: yBottom - 80, w: 20, h: 80, material: mat2, shape: 'rectangle' });
            blocksList.push({ x: base2 - width/2 - 10, y: yBottom - 100, w: width + 20, h: 20, material: mat2, shape: 'rectangle' });
            pigsList.push({ x: base2, y: yBottom - 40, r: 16, type: getPigType(difficulty, rand()) });
        }
        pigsList.push({ x: base2, y: GROUND_Y - stories * 100 - 16, r: 16, type: getPigType(difficulty, rand()) });

    } else if (archetype === 2) {
        // --- Archetype 2: Pyramid / Stack ---
        let base = Math.floor(randRange(570, 600));
        let size = Math.min(4, 2 + Math.floor(difficulty * 2.6)); // pyramid size (N blocks at base)
        
        let mat = randChoice(['wood', 'glass', 'stone']);
        if (difficulty > 0.5) mat = randChoice(['stone', 'rubber', 'gold']);

        for (let r = 0; r < size; r++) {
            let blocksInRow = size - r;
            let yPos = GROUND_Y - (r + 1) * 40;
            let rowStartX = base - (blocksInRow * 40) / 2;
            for (let i = 0; i < blocksInRow; i++) {
                let blockMat = mat;
                if (rand() < 0.25) blockMat = 'tnt'; // spice up with random TNT in stack!
                blocksList.push({ x: rowStartX + i * 40, y: yPos, w: 40, h: 40, material: blockMat, shape: 'square' });
            }
            // Place pig on the outer shoulders of each row
            if (blocksInRow > 1 && rand() < 0.5) {
                pigsList.push({ x: rowStartX - 16, y: yPos + 24, r: 16, type: getPigType(difficulty, rand()) });
                pigsList.push({ x: rowStartX + blocksInRow * 40 + 16, y: yPos + 24, r: 16, type: getPigType(difficulty, rand()) });
            }
        }
        // Pig at the peak
        pigsList.push({ x: base, y: GROUND_Y - size * 40 - 16, r: 16, type: getPigType(difficulty, rand()) });

    } else if (archetype === 3) {
        // --- Archetype 3: TNT Fort / Cascade ---
        let base = Math.floor(randRange(530, 560));
        let width = Math.floor(randRange(130, 160));
        
        let outerMat = randChoice(['stone', 'wood', 'metal']);
        let innerMat = randChoice(['wood', 'glass']);

        // Bottom row
        blocksList.push({ x: base, y: GROUND_Y - 80, w: 20, h: 80, material: outerMat, shape: 'rectangle' });
        blocksList.push({ x: base + width - 20, y: GROUND_Y - 80, w: 20, h: 80, material: outerMat, shape: 'rectangle' });
        
        // TNT in center of bottom row
        blocksList.push({ x: base + width/2 - 20, y: GROUND_Y - 40, w: 40, h: 40, material: 'tnt', shape: 'square' });
        pigsList.push({ x: base + width/2, y: GROUND_Y - 72, r: 16, type: getPigType(difficulty, rand()) }); // pig sits on TNT

        // Main deck
        blocksList.push({ x: base - 10, y: GROUND_Y - 100, w: width + 20, h: 20, material: 'wood', shape: 'rectangle' });

        // Second row
        let secondY = GROUND_Y - 100;
        blocksList.push({ x: base + 20, y: secondY - 80, w: 20, h: 80, material: innerMat, shape: 'rectangle' });
        blocksList.push({ x: base + width - 40, y: secondY - 80, w: 20, h: 80, material: innerMat, shape: 'rectangle' });
        
        // Second TNT or Pig
        if (difficulty > 0.5 && rand() < 0.5) {
            blocksList.push({ x: base + width/2 - 20, y: secondY - 40, w: 40, h: 40, material: 'tnt', shape: 'square' });
        } else {
            pigsList.push({ x: base + width/2, y: secondY - 40, r: 16, type: getPigType(difficulty, rand()) });
        }

        // Top deck
        blocksList.push({ x: base + 10, y: secondY - 100, w: width - 20, h: 20, material: 'wood', shape: 'rectangle' });
        
        // Top pigs/triangles
        blocksList.push({ x: base + width/2 - 20, y: secondY - 140, w: 40, h: 40, material: outerMat, shape: 'triangle' });
        pigsList.push({ x: base + width/2, y: secondY - 156, r: 16, type: getPigType(difficulty, rand()) });

    } else if (archetype === 4) {
        // --- Archetype 4: Bouncy Vault ---
        let base = Math.floor(randRange(540, 570));
        let width = Math.floor(randRange(110, 140));

        let outerMat = 'rubber';
        let floorMat = randChoice(['stone', 'metal']);

        // Rubber pillars
        blocksList.push({ x: base - width/2, y: GROUND_Y - 80, w: 20, h: 80, material: outerMat, shape: 'rectangle' });
        blocksList.push({ x: base + width/2 - 20, y: GROUND_Y - 80, w: 20, h: 80, material: outerMat, shape: 'rectangle' });

        // Heavy roof
        blocksList.push({ x: base - width/2 - 10, y: GROUND_Y - 100, w: width + 20, h: 20, material: floorMat, shape: 'rectangle' });

        // High value gold blocks inside
        let goldCount = Math.floor(randRange(1, 3.5));
        for (let g = 0; g < goldCount; g++) {
            blocksList.push({ x: base - 20, y: GROUND_Y - (g+1)*40, w: 40, h: 40, material: 'gold', shape: 'square' });
        }
        
        // Pig sits on top of gold inside vault
        pigsList.push({ x: base, y: GROUND_Y - goldCount*40 - 16, r: 16, type: getPigType(difficulty, rand()) });

        // Guard pigs outside vault
        pigsList.push({ x: base - width/2 - 25, y: GROUND_Y - 16, r: 16, type: getPigType(difficulty, rand()) });
        pigsList.push({ x: base + width/2 + 25, y: GROUND_Y - 16, r: 16, type: getPigType(difficulty, rand()) });

        // Extra rubber bouncer on top
        if (difficulty > 0.6) {
            blocksList.push({ x: base - 20, y: GROUND_Y - 140, w: 40, h: 40, material: 'rubber', shape: 'circle' });
            pigsList.push({ x: base, y: GROUND_Y - 156, r: 16, type: getPigType(difficulty, rand()) });
        }

    } else if (archetype === 5) {
        // --- Archetype 5: Ultimate Castle / Fort ---
        let base = Math.floor(randRange(520, 550));
        let width = Math.floor(randRange(160, 200));

        // Metal foundations
        blocksList.push({ x: base, y: GROUND_Y - 40, w: 40, h: 40, material: 'metal', shape: 'square' });
        blocksList.push({ x: base + width - 40, y: GROUND_Y - 40, w: 40, h: 40, material: 'metal', shape: 'square' });

        // Center rubber bouncer
        blocksList.push({ x: base + width/2 - 20, y: GROUND_Y - 40, w: 40, h: 40, material: 'rubber', shape: 'circle' });
        pigsList.push({ x: base + width/2, y: GROUND_Y - 56, r: 16, type: getPigType(difficulty, rand()) });

        // Main deck (gold planks)
        blocksList.push({ x: base - 10, y: GROUND_Y - 60, w: width + 20, h: 20, material: 'gold', shape: 'rectangle' });

        // Second story columns (stone)
        let middleY = GROUND_Y - 60;
        blocksList.push({ x: base + 10, y: middleY - 80, w: 20, h: 80, material: 'stone', shape: 'rectangle' });
        blocksList.push({ x: base + width - 30, y: middleY - 80, w: 20, h: 80, material: 'stone', shape: 'rectangle' });

        // Double TNT crates in middle
        blocksList.push({ x: base + width/2 - 35, y: middleY - 40, w: 30, h: 30, material: 'tnt', shape: 'square' });
        blocksList.push({ x: base + width/2 + 5, y: middleY - 40, w: 30, h: 30, material: 'tnt', shape: 'square' });

        // Pigs inside middle
        pigsList.push({ x: base + width/2, y: middleY - 56, r: 16, type: getPigType(difficulty, rand()) });

        // Top deck (glass)
        blocksList.push({ x: base + 10, y: middleY - 100, w: width - 20, h: 20, material: 'glass', shape: 'rectangle' });

        // Top cap structure
        let topY = middleY - 100;
        blocksList.push({ x: base + width/2 - 40, y: topY - 40, w: 40, h: 40, material: 'stone', shape: 'circle' });
        blocksList.push({ x: base + width/2, y: topY - 40, w: 40, h: 40, material: 'stone', shape: 'circle' });
        
        pigsList.push({ x: base + 25, y: topY - 16, r: 16, type: getPigType(difficulty, rand()) });
        pigsList.push({ x: base + width - 25, y: topY - 16, r: 16, type: getPigType(difficulty, rand()) });
        pigsList.push({ x: base + width/2, y: topY - 56, r: 16, type: getPigType(difficulty, rand()) });
    }

    return {
        blocks: blocksList,
        pigs: pigsList,
        ammo: ammo
    };
}

// Physics Helpers
function spawnSmoke(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        particlesPush(x, y);
    }
}

function particlesPush(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 3;
    smokeParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        radius: 3 + Math.random() * 6
    });
}

function resetBird() {
    bird = {
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
        vx: 0,
        vy: 0,
        radius: 14,
        isDragged: false,
        isLaunched: false,
        path: [],
        rotation: 0,
        squashTimer: 0,
        pathTimer: 0
    };
    ammoVal.textContent = birdsLeft;
}

function initLevel(lvlNum) {
    currentLevel = lvlNum;
    levelVal.textContent = currentLevel;
    
    const lvlData = getLevelData(lvlNum);
    birdsLeft = lvlData.ammo || 3;
    resetBird();

    // Build Blocks
    blocks = lvlData.blocks.map(b => {
        const profile = MATERIAL_PROFILES[b.material];
        let assetKey = '';
        if (b.material === 'tnt') {
            assetKey = 'tnt';
        } else {
            assetKey = `${b.material}_${b.shape}`;
        }
        return {
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            vx: 0,
            vy: 0,
            material: b.material,
            shape: b.shape,
            mass: profile.mass,
            bounciness: profile.bounciness,
            durability: profile.durability,
            maxDurability: profile.durability,
            isBreakable: profile.isBreakable,
            assetKey: assetKey
        };
    });

    // Build Enemies
    enemies = lvlData.pigs.map(p => ({
        x: p.x,
        y: p.y,
        r: p.r,
        vx: 0,
        vy: 0,
        type: p.type,
        timeOffset: Math.random() * 10000,
        alive: true
    }));

    smokeParticles = [];
    sparkParticles = [];
}

// Damage application on Blocks
function applyBlockDamage(block, force) {
    if (!block.isBreakable) return;
    const damage = force * 0.15;
    if (damage > 0.1) {
        block.durability -= damage;
    }
}

// Kill Enemy
function killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    score += 500;
    scoreVal.textContent = score;
    playSound('pop');
    spawnSmoke(enemy.x, enemy.y, 15);
}

// TNT Radial Explosion
function triggerExplosion(x, y) {
    playSound('hit');
    playSound('pop');
    spawnSmoke(x, y, 35);

    const blastRadius = 150;

    // 1. Affect blocks
    blocks.forEach(b => {
        if (b.mass === Infinity) return;
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < blastRadius) {
            const force = (blastRadius - dist) / blastRadius;
            const angle = Math.atan2(dy, dx);
            const push = force * 15;

            b.vx += Math.cos(angle) * push * (1 / b.mass);
            b.vy += Math.sin(angle) * push * (1 / b.mass);

            // Apply explosion damage
            b.durability -= force * 12;
        }
    });

    // 2. Affect Enemies
    enemies.forEach(e => {
        if (!e.alive) return;
        const dx = e.x - x;
        const dy = e.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < blastRadius) {
            const force = (blastRadius - dist) / blastRadius;
            const angle = Math.atan2(dy, dx);
            const push = force * 18;

            e.vx += Math.cos(angle) * push;
            e.vy += Math.sin(angle) * push;

            if (force > 0.25) {
                killEnemy(e);
            }
        }
    });

    // 3. Affect Hero Monkey
    if (bird && bird.isLaunched) {
        const dx = bird.x - x;
        const dy = bird.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < blastRadius) {
            const force = (blastRadius - dist) / blastRadius;
            const angle = Math.atan2(dy, dx);
            bird.vx += Math.cos(angle) * force * 15;
            bird.vy += Math.sin(angle) * force * 15;
            bird.squashTimer = 8;
        }
    }
}

// Rigid body collision solver
function resolveBlockVsBlock(b1, b2) {
    if (b1.x < b2.x + b2.w && b1.x + b1.w > b2.x &&
        b1.y < b2.y + b2.h && b1.y + b1.h > b2.y) {

        const overlapX = Math.min(b1.x + b1.w, b2.x + b2.w) - Math.max(b1.x, b2.x);
        const overlapY = Math.min(b1.y + b1.h, b2.y + b2.h) - Math.max(b1.y, b2.y);

        const m1 = b1.mass;
        const m2 = b2.mass;
        if (m1 === Infinity && m2 === Infinity) return;

        const totalRecip = (m1 === Infinity ? 0 : 1 / m1) + (m2 === Infinity ? 0 : 1 / m2);
        const ratio1 = (m1 === Infinity ? 0 : 1 / m1) / totalRecip;
        const ratio2 = (m2 === Infinity ? 0 : 1 / m2) / totalRecip;

        if (overlapX < overlapY) {
            const push = overlapX;
            if (b1.x + b1.w / 2 < b2.x + b2.w / 2) {
                b1.x -= push * ratio1;
                b2.x += push * ratio2;
            } else {
                b1.x += push * ratio1;
                b2.x -= push * ratio2;
            }

            let rvx = b2.vx - b1.vx;
            let restitution = Math.max(b1.bounciness, b2.bounciness);
            let impulse = -(1 + restitution) * rvx;
            let j = impulse / totalRecip;

            let force = Math.abs(j);
            applyBlockDamage(b1, force);
            applyBlockDamage(b2, force);

            if (m1 !== Infinity) b1.vx -= (j / m1) * 0.5;
            if (m2 !== Infinity) b2.vx += (j / m2) * 0.5;
        } else {
            const push = overlapY;
            if (b1.y + b1.h / 2 < b2.y + b2.h / 2) {
                b1.y -= push * ratio1;
                b2.y += push * ratio2;
            } else {
                b1.y += push * ratio1;
                b2.y -= push * ratio2;
            }

            let rvy = b2.vy - b1.vy;
            let restitution = Math.max(b1.bounciness, b2.bounciness);
            let impulse = -(1 + restitution) * rvy;
            let j = impulse / totalRecip;

            let force = Math.abs(j);
            applyBlockDamage(b1, force);
            applyBlockDamage(b2, force);

            if (m1 !== Infinity) b1.vy -= (j / m1) * 0.5;
            if (m2 !== Infinity) b2.vy += (j / m2) * 0.5;
        }
    }
}

function resolveCircleVsBlock(c, b, isHero) {
    const closestX = Math.max(b.x, Math.min(c.x, b.x + b.w));
    const closestY = Math.max(b.y, Math.min(c.y, b.y + b.h));

    const dx = c.x - closestX;
    const dy = c.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let radius = isHero ? c.radius : c.r;

    if (dist < radius) {
        if (isHero) {
            playSound('hit');
            c.squashTimer = 8;
        }

        let nx = dx / (dist || 1);
        let ny = dy / (dist || 1);
        if (dist === 0) {
            // center is inside the block, push upwards to prevent getting stuck
            nx = 0;
            ny = -1;
        }

        const overlap = radius - dist;
        const m1 = 1.0;
        const m2 = b.mass;

        let totalRecip = (1 / m1) + (m2 === Infinity ? 0 : 1 / m2);
        let ratio1 = (1 / m1) / totalRecip;
        let ratio2 = (m2 === Infinity ? 0 : 1 / m2) / totalRecip;

        c.x += nx * overlap * ratio1;
        if (m2 !== Infinity) {
            b.x -= nx * overlap * ratio2;
        }
        c.y += ny * overlap * ratio1;
        if (m2 !== Infinity) {
            b.y -= ny * overlap * ratio2;
        }

        const rvx = c.vx - b.vx;
        const rvy = c.vy - b.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
            const restitution = Math.max(isHero ? 0.25 : 0.1, b.bounciness);
            let impulseScalar = -(1 + restitution) * velAlongNormal;
            let j = impulseScalar / totalRecip;

            let force = Math.abs(j);
            if (isHero) force *= 2.5;
            applyBlockDamage(b, force);

            if (!isHero) {
                if (force > 1.2) {
                    killEnemy(c);
                }
            } else {
                if (b.material === 'tnt') {
                    triggerExplosion(b.x + b.w / 2, b.y + b.h / 2);
                }
            }

            c.vx += (j / m1) * nx;
            c.vy += (j / m1) * ny;
            if (m2 !== Infinity) {
                b.vx -= (j / m2) * nx;
                b.vy -= (j / m2) * ny;
            }
        }
    }
}

function resolveCircleVsCircle(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = c1.radius + c2.r;

    if (dist < minDist) {
        c1.squashTimer = 8;
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

        const overlap = minDist - dist;
        c1.x -= nx * overlap * 0.5;
        c2.x += nx * overlap * 0.5;
        c1.y -= ny * overlap * 0.5;
        c2.y += ny * overlap * 0.5;

        const rvx = c2.vx - c1.vx;
        const rvy = c2.vy - c1.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
            const restitution = 0.25;
            let impulseScalar = -(1 + restitution) * velAlongNormal;
            let j = impulseScalar / 2.0;

            c1.vx -= j * nx;
            c1.vy -= j * ny;
            c2.vx += j * nx;
            c2.vy += j * ny;

            if (Math.abs(j) > 0.5) {
                killEnemy(c2);
            }
        }
    }
}

function checkCollisions() {
    // 1. Blocks vs Ground
    blocks.forEach(b => {
        if (b.mass === Infinity) return;
        b.vy += gravity;
        b.x += b.vx;
        b.y += b.vy;

        if (b.y + b.h >= GROUND_Y) {
            b.y = GROUND_Y - b.h;
            b.vy = 0;
            b.vx *= 0.8;
        }
    });

    // 2. Enemies vs Ground
    enemies.forEach(e => {
        if (!e.alive) return;
        e.vy += gravity;
        e.x += e.vx;
        e.y += e.vy;

        if (e.y + e.r >= GROUND_Y) {
            e.y = GROUND_Y - e.r;
            e.vy = 0;
            e.vx *= 0.8;
        }
    });

    // 3. Resolve rigid-body collisions
    for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < blocks.length; i++) {
            for (let j = i + 1; j < blocks.length; j++) {
                resolveBlockVsBlock(blocks[i], blocks[j]);
            }
        }
    }

    // 4. Monkey vs Block
    if (bird && bird.isLaunched) {
        blocks.forEach(b => {
            resolveCircleVsBlock(bird, b, true);
        });
    }

    // 5. Block vs Enemies
    blocks.forEach(b => {
        enemies.forEach(e => {
            if (!e.alive) return;
            resolveCircleVsBlock(e, b, false);
        });
    });

    // 6. Monkey vs Enemies
    if (bird && bird.isLaunched) {
        enemies.forEach(e => {
            if (!e.alive) return;
            resolveCircleVsCircle(bird, e);
        });
    }

    // Filter out destroyed blocks
    blocks = blocks.filter(b => {
        if (b.isBreakable && b.durability <= 0) {
            score += (b.material === 'gold') ? 1000 : 100;
            scoreVal.textContent = score;
            spawnSmoke(b.x + b.w / 2, b.y + b.h / 2, 12);
            if (b.material === 'tnt') {
                triggerExplosion(b.x + b.w / 2, b.y + b.h / 2);
            }
            return false;
        }
        return true;
    });

    // Clamp velocities to prevent physics explosions (NaN / freezing)
    const MAX_BLOCK_VEL = 12;
    blocks.forEach(b => {
        if (b.mass === Infinity) return;
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > MAX_BLOCK_VEL) {
            b.vx = (b.vx / speed) * MAX_BLOCK_VEL;
            b.vy = (b.vy / speed) * MAX_BLOCK_VEL;
        }
    });

    const MAX_ENEMY_VEL = 12;
    enemies.forEach(e => {
        if (!e.alive) return;
        let speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        if (speed > MAX_ENEMY_VEL) {
            e.vx = (e.vx / speed) * MAX_ENEMY_VEL;
            e.vy = (e.vy / speed) * MAX_ENEMY_VEL;
        }
    });

    if (bird && bird.isLaunched) {
        const MAX_BIRD_VEL = 20;
        let speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
        if (speed > MAX_BIRD_VEL) {
            bird.vx = (bird.vx / speed) * MAX_BIRD_VEL;
            bird.vy = (bird.vy / speed) * MAX_BIRD_VEL;
        }
    }
}

// Trajectory Projector
function drawTrajectory() {
    if (!bird || !bird.isDragged) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 8]);

    let simX = bird.x;
    let simY = bird.y;
    let simVx = (SLINGSHOT_X - bird.x) * 0.16;
    let simVy = (SLINGSHOT_Y - bird.y) * 0.16;

    ctx.beginPath();
    ctx.moveTo(simX, simY);
    for (let i = 0; i < 30; i++) {
        simVy += gravity;
        simX += simVx;
        simY += simVy;
        if (simY >= GROUND_Y) break;
        ctx.lineTo(simX, simY);
    }
    ctx.stroke();
    ctx.restore();
}

// Game Core Update Loop
function update() {
    if (!gameStarted || gameOver) return;

    // Bird flight physics
    if (bird) {
        if (bird.isLaunched) {
            bird.flightFrames++;
            
            bird.vy += gravity;
            bird.x += bird.vx;
            bird.y += bird.vy;
            bird.rotation += 0.15;

            // Path trail
            bird.pathTimer++;
            if (bird.pathTimer % 5 === 0) {
                bird.path.push({ x: bird.x, y: bird.y, alpha: 0.8 });
            }

            // Spawn magical trailing spark particles
            if (Math.random() < 0.45) {
                sparkParticles.push({
                    x: bird.x + (Math.random() - 0.5) * 12,
                    y: bird.y + (Math.random() - 0.5) * 12,
                    vx: -bird.vx * 0.2 + (Math.random() - 0.5) * 1,
                    vy: -bird.vy * 0.2 + (Math.random() - 0.5) * 1,
                    color: `hsl(${Math.random() * 360}, 100%, 75%)`,
                    alpha: 1.0,
                    decay: 0.035,
                    radius: 2 + Math.random() * 3
                });
            }

            // Check ground
            if (bird.y >= GROUND_Y - bird.radius) {
                bird.y = GROUND_Y - bird.radius;
                bird.vy = -bird.vy * 0.25;
                bird.vx *= 0.65;
                bird.squashTimer = 8;
            }

            let speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
            if (isNaN(speed)) speed = 0;

            // If bird settles, leaves screen horizontally, exceeds 8s flight, or has NaN coordinates, reset
            if (speed < 0.25 || bird.x > canvas.width + 100 || bird.x < -100 || bird.flightFrames > 480 || isNaN(bird.x) || isNaN(bird.y)) {
                birdsLeft--;
                if (birdsLeft > 0) {
                    bird = null;
                    setTimeout(() => {
                        if (birdsLeft > 0 && !gameOver && getLivingEnemiesCount() > 0) {
                            resetBird();
                        }
                    }, 1000);
                } else {
                    bird = null;
                    setTimeout(checkLevelOutcome, 1500);
                }
            }
        }

        if (bird.squashTimer > 0) {
            bird.squashTimer--;
        }
    }

    if (bird) {
        bird.path.forEach(pt => pt.alpha -= 0.015);
        bird.path = bird.path.filter(pt => pt.alpha > 0);
    }

    // Smoke particles update
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            smokeParticles.splice(i, 1);
        }
    }

    // Spark particles update
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
        const p = sparkParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            sparkParticles.splice(i, 1);
        }
    }

    checkCollisions();
    checkRealtimeVictory();
}

function getLivingEnemiesCount() {
    return enemies.filter(e => e.alive).length;
}

function checkRealtimeVictory() {
    if (getLivingEnemiesCount() === 0 && !gameOver) {
        gameOver = true;
        playSound('win');

        const bonus = birdsLeft * 250;
        score += bonus;
        scoreVal.textContent = score;

        setTimeout(() => {
            if (currentLevel < 50) {
                bonusVal.textContent = bonus;
                levelWinOverlay.classList.add('active');
            } else {
                showFinalVictory();
            }
        }, 1200);
    }
}

function checkLevelOutcome() {
    if (gameOver) return;
    if (getLivingEnemiesCount() > 0) {
        gameOver = true;
        failScoreVal.textContent = score;
        gameOverOverlay.classList.add('active');
    }
}

function showFinalVictory() {
    gameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }
    finalScoreVal.textContent = score;
    winHighScoreVal.textContent = highScore;
    gameWinOverlay.classList.add('active');
}

// Renderer
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameReady) {
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = "800 2.0rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('LOADING RETRO ASSETS...', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 1. Classic sky gradient: light blue to bright sunlight horizon
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#bae6fd'); // Light sky blue
    skyGrad.addColorStop(1, '#fef08a'); // Pale yellow/sunlight
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Classic layered grass hills
    ctx.fillStyle = '#86efac'; // Soft back hill
    ctx.beginPath();
    ctx.ellipse(300, 350, 450, 150, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = '#4ade80'; // Vibrant front hill
    ctx.beginPath();
    ctx.ellipse(700, 350, 350, 120, 0, 0, Math.PI, true);
    ctx.fill();

    // 3. Ground - grass green layer (15px) on top of dirt brown
    ctx.fillStyle = '#10b981'; // grass green
    ctx.fillRect(0, GROUND_Y, canvas.width, 15);
    ctx.fillStyle = '#78350f'; // dirt brown
    ctx.fillRect(0, GROUND_Y + 15, canvas.width, canvas.height - GROUND_Y - 15);

    // Draw Slingshot stand (Classic wooden fork Y) with cartoon outline
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Outline
    ctx.strokeStyle = '#2d1a12';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X, GROUND_Y);
    ctx.lineTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.lineTo(SLINGSHOT_X - 16, SLINGSHOT_Y - 10);
    ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.lineTo(SLINGSHOT_X + 16, SLINGSHOT_Y - 10);
    ctx.stroke();

    // 2. Inner Wood Fill
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X, GROUND_Y);
    ctx.lineTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.lineTo(SLINGSHOT_X - 16, SLINGSHOT_Y - 10);
    ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y + 15);
    ctx.lineTo(SLINGSHOT_X + 16, SLINGSHOT_Y - 10);
    ctx.stroke();
    ctx.restore();

    // Draw active path trail
    if (bird) {
        bird.path.forEach(pt => {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Draw Blocks
    blocks.forEach(b => {
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);

        const img = images[b.assetKey];
        if (img && img.complete) {
            ctx.drawImage(img, -b.w / 2, -b.h / 2, b.w, b.h);
        } else {
            ctx.fillStyle = '#d69e2e';
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        }

        // Draw structural cracks if damaged
        let damageRatio = b.durability / b.maxDurability;
        if (damageRatio < 0.7 && b.isBreakable) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-b.w / 3, -b.h / 3);
            ctx.lineTo(b.w / 4, b.h / 4);
            if (damageRatio < 0.4) {
                ctx.moveTo(b.w / 3, -b.h / 4);
                ctx.lineTo(-b.w / 4, b.h / 3);
            }
            ctx.stroke();
        }
        ctx.restore();
    });

    // Draw Enemies (Breathing animations)
    enemies.forEach(e => {
        if (!e.alive) return;
        ctx.save();
        ctx.translate(e.x, e.y);

        let elapsed = Date.now() + e.timeOffset;
        let scaleX = 1 + 0.04 * Math.sin(elapsed / 238);
        let scaleY = 1 - 0.04 * Math.sin(elapsed / 238);
        ctx.scale(scaleX, scaleY);

        const img = images[e.type];
        if (img && img.complete) {
            ctx.drawImage(img, -e.r * 1.3, -e.r * 1.3, e.r * 2.6, e.r * 2.6);
        } else {
            ctx.fillStyle = '#e53e3e';
            ctx.beginPath();
            ctx.arc(0, 0, e.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // Draw Trajectory Line
    drawTrajectory();

    // Draw Magical spark particles
    sparkParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw Slingshot Back Band & Pouch (connected to left/back fork)
    if (bird && bird.isDragged) {
        ctx.save();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Back fork is left fork tip
        ctx.moveTo(SLINGSHOT_X - 16, SLINGSHOT_Y - 10);
        let dragAngle = Math.atan2(bird.y - SLINGSHOT_Y, bird.x - SLINGSHOT_X);
        let bandEndX = bird.x - 12 * Math.cos(dragAngle);
        let bandEndY = bird.y - 12 * Math.sin(dragAngle);
        ctx.lineTo(bandEndX, bandEndY);
        ctx.stroke();
        ctx.restore();

        // Draw Leather Pouch behind bird
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(dragAngle);
        ctx.fillStyle = '#5d4037';
        ctx.strokeStyle = '#2d1a12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-6, -14, 8, 28);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // Draw Hero Monkey
    if (bird) {
        ctx.save();
        ctx.translate(bird.x, bird.y);

        if (bird.isDragged) {
            let dx = bird.x - SLINGSHOT_X;
            let dy = bird.y - SLINGSHOT_Y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let dragAngle = Math.atan2(dy, dx);
            
            ctx.rotate(dragAngle);
            let stretch = 1 + (dist / 75) * 0.35;
            let squeeze = 1 - (dist / 75) * 0.2;
            ctx.scale(stretch, squeeze);
        } else if (bird.isLaunched) {
            ctx.rotate(bird.rotation);
            if (bird.squashTimer > 0) {
                let squash = 1 + 0.3 * Math.sin(bird.squashTimer * 0.8) * (bird.squashTimer / 8);
                let stretch = 1 - 0.2 * Math.sin(bird.squashTimer * 0.8) * (bird.squashTimer / 8);
                ctx.scale(squash, stretch);
            }
        } else {
            let idleElapsed = Date.now();
            let wiggle = Math.sin(idleElapsed / 100) * 0.05;
            let breathe = 1 + 0.03 * Math.sin(idleElapsed / 250);
            
            ctx.rotate(wiggle);
            ctx.scale(breathe, 2 - breathe);
        }

        if (images.hero && images.hero.complete) {
            ctx.drawImage(images.hero, -bird.radius * 1.4, -bird.radius * 1.4, bird.radius * 2.8, bird.radius * 2.8);
        } else {
            ctx.fillStyle = '#ecc94b';
            ctx.beginPath();
            ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw Slingshot Front Band (connected to right/front fork)
    if (bird && bird.isDragged) {
        ctx.save();
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Front fork is right fork tip
        ctx.moveTo(SLINGSHOT_X + 16, SLINGSHOT_Y - 10);
        let dragAngle = Math.atan2(bird.y - SLINGSHOT_Y, bird.x - SLINGSHOT_X);
        let bandEndX = bird.x - 12 * Math.cos(dragAngle);
        let bandEndY = bird.y - 12 * Math.sin(dragAngle);
        ctx.lineTo(bandEndX, bandEndY);
        ctx.stroke();
        ctx.restore();
    }

    // Smoke particles
    smokeParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Drag & Launch Controllers
function getMouseCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
    };
}

function startDrag(e) {
    if (!gameStarted || gameOver) return;
    if (!bird || bird.isLaunched) return;

    const coords = getMouseCoords(e);
    const dist = Math.sqrt((coords.x - bird.x) ** 2 + (coords.y - bird.y) ** 2);
    if (dist <= bird.radius * 2.5) {
        bird.isDragged = true;
        playSound('stretch');
    }
}

// Drag loop
function drag(e) {
    if (!bird || !bird.isDragged) return;

    const coords = getMouseCoords(e);
    const dx = coords.x - SLINGSHOT_X;
    const dy = coords.y - SLINGSHOT_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDrag = 75;
    if (dist > maxDrag) {
        const angle = Math.atan2(dy, dx);
        bird.x = SLINGSHOT_X + Math.cos(angle) * maxDrag;
        bird.y = SLINGSHOT_Y + Math.sin(angle) * maxDrag;
    } else {
        bird.x = coords.x;
        bird.y = coords.y;
    }
}

function endDrag() {
    if (!bird || !bird.isDragged) return;
    bird.isDragged = false;
    bird.isLaunched = true;
    playSound('launch');

    bird.vx = (SLINGSHOT_X - bird.x) * 0.16;
    bird.vy = (SLINGSHOT_Y - bird.y) * 0.16;
}

// Listeners
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', drag);
window.addEventListener('mouseup', endDrag);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrag(e);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    drag(e);
}, { passive: true });

window.addEventListener('touchend', endDrag);

// State Flow
function startBattle() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    score = 0;
    scoreVal.textContent = score;
    startOverlay.classList.remove('active');
    initLevel(1);
    gameOver = false;
    gameStarted = true;
}

function loadNextLevel() {
    levelWinOverlay.classList.remove('active');
    initLevel(currentLevel + 1);
    gameOver = false;
}

function restartCurrentLevel() {
    gameOverOverlay.classList.remove('active');
    initLevel(currentLevel);
    gameOver = false;
}

function resetGameFull() {
    gameWinOverlay.classList.remove('active');
    startBattle();
}

startBtn.addEventListener('click', startBattle);
nextLevelBtn.addEventListener('click', loadNextLevel);
failRestartBtn.addEventListener('click', restartCurrentLevel);
restartBtn.addEventListener('click', () => {
    if (gameStarted) initLevel(currentLevel);
});
winPlayAgainBtn.addEventListener('click', resetGameFull);

// Run
gameLoop();
