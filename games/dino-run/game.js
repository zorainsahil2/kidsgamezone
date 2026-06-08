// Dino Run Endless Runner Logic - Physics-Driven Refactor

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Game Constants
const GRAVITY = 0.55;
const GROUND_Y = 240;
const HIGH_SCORE_KEY = 'kgz_highscore_dino-run';

const STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

// State Variables
let state = STATES.MENU;
let score = 0;
let highScore = localStorage.getItem(HIGH_SCORE_KEY) ? parseInt(localStorage.getItem(HIGH_SCORE_KEY)) : 0;
highScoreVal.innerText = highScore;

// Synthesizer Audio Context
class SoundEffects {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playJump() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    playCollect() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
    playHurt() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.22);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }
    playBoost() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}
const sfx = new SoundEffects();

// Asset mapping
const assetList = {
    dino_idle: 'Asset/Dino_Idle.png',
    dino_run1: 'Asset/Dino_Run_Cycle1.png',
    dino_run2: 'Asset/Dino_Run_Cycle2.png', // Dino_Run_Cycle2.png is used for running animation
    dino_run3: 'Asset/Dino_Run_Cycle1.png', // Dino_Run_Cycle3.png was deleted by user
    dino_glide: 'Asset/Dino_Jump_Glide.png',
    dino_dead: 'Asset/Dino_Game_Over.png',
    bg_level1: 'Asset/Level1_Prehistoric_Jungle.png',
    bg_level2: 'Asset/Level2_Ash_and_Dust_Volcanic_Plain.png',
    bg_level3: 'Asset/Level3_The_Apocalypse_Horizon.png',
    cactus: 'Asset/Prehistoric_Cactus.png',
    lava1: 'Asset/Level2_Hazard_Lava_Pit.png',
    lava2: 'Asset/Level2_Hazard_Lava_Pit.png', // Level2_Hazard_Lava_Pit2.png was deleted by user
    crumble1: 'Asset/Level3_Hazard_Crumbling_Ground_01.png',
    crumble2: 'Asset/Level3_Hazard_Crumbling_Ground_01.png', // Level3_Hazard_Crumbling_Ground_02.png was deleted by user
    pterodactyl_1: 'Asset/Pterodactyl_fly.png',
    pterodactyl_2: 'Asset/Pterodactyl_fly_1.png',
    pterodactyl_3: 'Asset/Pterodactyl_fly_2.png',
    pterodactyl_4: 'Asset/Pterodactyl_fly_2.png', // Pterodactyl_fly_3.png was deleted by user
    meteor1: 'Asset/Falling_Meteorite2.png', // Falling_Meteorite1.png was deleted by user
    meteor2: 'Asset/Falling_Meteorite2.png',
    fire_wave: 'Asset/Fire_Wave.png',
    bone: 'Asset/The_Dino_Bone_Icon.png',
    egg: 'Asset/Golden_Dino_Egg.png',
    leaf: 'Asset/Speed_Boost_Leaf.png',
    heart: 'Asset/Red_Heart_Icon.png',
    health_1: 'Asset/Full_Health_Bar_Frame.png',
    health_2: 'Asset/Full_Health_Bar_Frame2.png',
    health_3: 'Asset/Full_Health_Bar_Frame3.png',
    health_4: 'Asset/Full_Health_Bar_Frame4.png',
    health_5: 'Asset/Full_Health_Bar_Frame5.png',
    health_6: 'Asset/Full_Health_Bar_Frame6.png',
};

const Assets = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(assetList).length;

function loadAllAssets(onComplete) {
    const keys = Object.keys(assetList);
    keys.forEach(key => {
        const img = new Image();
        img.onload = () => {
            Assets[key] = img;
            assetsLoaded++;
            if (assetsLoaded === totalAssets) onComplete();
        };
        img.onerror = () => {
            console.warn(`Asset failed to load: ${assetList[key]}`);
            Assets[key] = null;
            assetsLoaded++;
            if (assetsLoaded === totalAssets) onComplete();
        };
        img.src = assetList[key];
    });
}

// User inputs registration
const keys = {};
window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        if (state === STATES.PLAYING) {
            triggerJump();
        } else {
            handleInputTrigger();
        }
    }
    if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Dynamic camera follow Y axis is fixed
const camera = { x: 0 };

// Game entities state variables
let dino = {
    x: 200,
    y: GROUND_Y - 66,
    width: 64,
    height: 66,
    vx: 0,
    vy: 0,
    maxSpeed: 5.5,
    accel: 0.16,
    friction: 0.88,
    jumpForce: -11.5,
    isJumping: false,
    isGrounded: false,
    isCrouching: false,
    health: 6,
    lives: 3,
    invincibilityTimer: 0,
    speedBoostTimer: 0,
    speedTrail: [],
    jumpCount: 0
};

let fireWaveX = 0;
let startTime = 0;
let lastGeneratedX = 0;
let platforms = [];
let obstacles = [];
let collectibles = [];
let projectiles = [];
let particles = [];
let consecutiveHazards = 0;
let shakeTimer = 0;
let shakeIntensity = 0;

// Parallax alphas
let level1Alpha = 1;
let level2Alpha = 0;
let level3Alpha = 0;

function screenShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimer = duration;
}

// Procedural Terrain Generator
function generateTerrain() {
    while (lastGeneratedX < camera.x + 1200) {
        let blockW = 400;
        let progress = lastGeneratedX;
        let forceSafe = (consecutiveHazards >= 2);
        
        if (progress < 4000) {
            // Level 1 Jungle: Solid Ground blocks + Cacti
            platforms.push({ type: 'ground', x: lastGeneratedX, y: GROUND_Y, w: blockW, h: 60 });
            
            // Spawn Cacti
            if (!forceSafe && lastGeneratedX > 800 && Math.random() < 0.45) {
                let cactusW = 44;
                let cactusH = 72;
                obstacles.push({
                    type: 'cactus',
                    x: lastGeneratedX + 150 + Math.random() * 100,
                    y: GROUND_Y - cactusH + 6,
                    w: cactusW,
                    h: cactusH
                });
                consecutiveHazards++;
            } else {
                consecutiveHazards = 0;
            }
            
            // Spawn Bones
            if (Math.random() < 0.6) {
                collectibles.push({
                    type: 'bone',
                    x: lastGeneratedX + 100 + Math.random() * 200,
                    y: GROUND_Y - 30,
                    w: 30,
                    h: 30
                });
            }
        } 
        else if (progress >= 4000 && progress < 9000) {
            // Level 2 Volcanic: Ground + Lava Pits
            let choice = forceSafe ? 0 : Math.random();
            if (choice < 0.65) {
                platforms.push({ type: 'ground', x: lastGeneratedX, y: GROUND_Y, w: blockW, h: 60 });
                consecutiveHazards = 0;
                
                // Spawn Lava Pit barrier or Speed Leaf
                if (Math.random() < 0.3) {
                    collectibles.push({
                        type: 'leaf',
                        x: lastGeneratedX + 200,
                        y: GROUND_Y - 32,
                        w: 32,
                        h: 32
                    });
                }
            } else {
                // Spawn Lava Pit Gap (Hazard!)
                blockW = 140;
                let lavaStyle = Math.random() < 0.5 ? 1 : 2;
                platforms.push({
                    type: 'lava',
                    x: lastGeneratedX,
                    y: GROUND_Y,
                    w: blockW,
                    h: 60,
                    style: lavaStyle
                });
                consecutiveHazards++;
                
                // Spawn Golden Egg high above Lava Pit
                if (Math.random() < 0.5) {
                    let eggW = 44;
                    let eggH = 44;
                    collectibles.push({
                        type: 'egg',
                        x: lastGeneratedX + blockW / 2 - (eggW / 2),
                        y: GROUND_Y - 95,
                        w: eggW,
                        h: eggH
                    });
                }
            }
        } 
        else {
            // Level 3 Apocalypse: Crumbling Platforms + floating segments
            let choice = forceSafe ? 0.5 : Math.random();
            if (choice < 0.4) {
                // Crumbling blocks (Hazard!)
                blockW = 120;
                let style = Math.random() < 0.5 ? 1 : 2;
                platforms.push({
                    type: 'crumble',
                    x: lastGeneratedX,
                    y: GROUND_Y,
                    w: blockW,
                    h: 30,
                    style: style,
                    state: 'solid',
                    collapseTimer: 0,
                    vy: 0,
                    shakeOffset: 0
                });
                consecutiveHazards++;
            } else if (choice < 0.75) {
                // Solid ground segment
                blockW = 300;
                platforms.push({ type: 'ground', x: lastGeneratedX, y: GROUND_Y, w: blockW, h: 60 });
                
                // Spawn Cacti or speed boosts
                if (!forceSafe && Math.random() < 0.3) {
                    let cactusW = 44;
                    let cactusH = 72;
                    obstacles.push({
                        type: 'cactus',
                        x: lastGeneratedX + 100,
                        y: GROUND_Y - cactusH + 6,
                        w: cactusW,
                        h: cactusH
                    });
                    consecutiveHazards++;
                } else {
                    consecutiveHazards = 0;
                }
            } else {
                // Gap (Hazard!)
                blockW = 150;
                consecutiveHazards++;
            }
        }
        
        lastGeneratedX += blockW;
    }
}

// Spawning Spawner AI for Meteorites & Pterodactyls
let spawnTicks = 0;
function spawnProjectiles() {
    spawnTicks++;
    let progress = dino.x;
    
    if (progress >= 4000 && progress < 9000) {
        // Level 2: Occasional meteorites
        if (spawnTicks % 160 === 0 && Math.random() < 0.5) {
            projectiles.push({
                type: 'meteor',
                x: camera.x + canvas.width + 100,
                y: -40,
                w: 48,
                h: 48,
                vx: -3.8,
                vy: 4.8,
                style: Math.random() < 0.5 ? 1 : 2
            });
        }
    } 
    else if (progress >= 9000) {
        // Level 3: Heavy meteorites and Pterodactyls
        if (spawnTicks % 110 === 0) {
            let choice = Math.random();
            if (choice < 0.5) {
                // Meteorite
                projectiles.push({
                    type: 'meteor',
                    x: camera.x + canvas.width + 150,
                    y: -40,
                    w: 48,
                    h: 48,
                    vx: -4.5,
                    vy: 5.5,
                    style: Math.random() < 0.5 ? 1 : 2
                });
            } else {
                // Pterodactyl at low, medium, or high height
                let pW = 64;
                let pH = 46;
                let heights = [GROUND_Y - 94, GROUND_Y - 134, GROUND_Y - 174];
                let py = heights[Math.floor(Math.random() * heights.length)];
                projectiles.push({
                    type: 'pterodactyl',
                    x: camera.x + canvas.width + 50,
                    y: py,
                    w: pW,
                    h: pH,
                    vx: -5.0,
                    vy: 0,
                    frame: 0
                });
            }
        }
    }
}

function resetGame() {
    score = 0;
    scoreVal.innerText = score;
    startTime = Date.now();
    
    dino.x = 250;
    dino.y = GROUND_Y - 66;
    dino.vx = 0;
    dino.vy = 0;
    dino.health = 6;
    dino.lives = 3;
    dino.invincibilityTimer = 0;
    dino.speedBoostTimer = 0;
    dino.speedTrail = [];
    dino.jumpCount = 0;
    
    fireWaveX = 0;
    lastGeneratedX = 0;
    consecutiveHazards = 0;
    platforms = [];
    obstacles = [];
    collectibles = [];
    projectiles = [];
    particles = [];
    spawnTicks = 0;
    
    // Pre-populate initial safe ground
    platforms.push({ type: 'ground', x: 0, y: GROUND_Y, w: 800, h: 60 });
    lastGeneratedX = 800;
    
    camera.x = 0;
    level1Alpha = 1;
    level2Alpha = 0;
    level3Alpha = 0;
}

function gameOver() {
    state = STATES.GAME_OVER;
    let finalScore = Math.floor(score);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreVal.innerText = highScore;
    }
}

// Bounding box collision helper
function checkCollision(r1, r2) {
    // Tighter padding for fair retro collision checking
    const px = 3;
    const py = 3;
    return r1.x + px < r2.x + r2.w - px &&
           r1.x + r1.w - px > r2.x + px &&
           r1.y + py < r2.y + r2.h - py &&
           r1.y + r1.h - py > r2.y + py;
}

// Main game physics loop
function update() {
    if (state !== STATES.PLAYING) return;
    
    // 1. Invincibility flash count downs
    if (dino.invincibilityTimer > 0) dino.invincibilityTimer--;
    
    // 2. Speed boost Leaf decays
    if (dino.speedBoostTimer > 0) {
        dino.speedBoostTimer--;
        // push trail coordinates
        dino.speedTrail.push({
            x: dino.x,
            y: dino.y,
            w: dino.width,
            h: dino.height,
            isCrouching: dino.isCrouching,
            vy: dino.vy
        });
        if (dino.speedTrail.length > 6) dino.speedTrail.shift();
    } else {
        dino.speedTrail = [];
    }
    
    // 3. Crouching checks
    let targetHeight = 66;
    let targetWidth = 64;
    if ((keys['ArrowDown'] || keys['KeyS']) && dino.isGrounded) {
        dino.isCrouching = true;
        targetWidth = 72;
        targetHeight = 40;
    } else {
        dino.isCrouching = false;
    }
    
    if (dino.height !== targetHeight) {
        dino.y += (dino.height - targetHeight);
        dino.height = targetHeight;
        dino.width = targetWidth;
    }
    
    // 4. Horizontal acceleration with momentum
    let maxSpeedLimit = dino.maxSpeed;
    if (dino.speedBoostTimer > 0) {
        maxSpeedLimit *= 1.4;
    }
    
    if (keys['ArrowRight'] || keys['KeyD']) {
        dino.vx += dino.accel;
        if (dino.vx > maxSpeedLimit) dino.vx = maxSpeedLimit;
    } else if (keys['ArrowLeft'] || keys['KeyA']) {
        dino.vx -= dino.accel;
        if (dino.vx < -maxSpeedLimit) dino.vx = -maxSpeedLimit;
    } else {
        dino.vx *= dino.friction;
        if (Math.abs(dino.vx) < 0.1) dino.vx = 0;
    }
    
    dino.x += dino.vx;
    
    // 5. Jump Glide low-gravity decay
    if (!dino.isGrounded) {
        let currentGravity = GRAVITY;
        if (dino.vy > -2.5 && (keys['Space'] || keys['ArrowUp'] || keys['KeyW'])) {
            currentGravity *= 0.5; // glide multiplier
        }
        dino.vy += currentGravity;
        dino.y += dino.vy;
    } else {
        dino.vy = 0;
    }
    
    // 6. Camera smooth follow (horizontal screen progression lock)
    let targetCamX = dino.x - 200;
    if (targetCamX > camera.x) {
        camera.x += (targetCamX - camera.x) * 0.1;
        if (targetCamX - camera.x < 0.05) {
            camera.x = targetCamX;
        }
    }
    
    // 7. Resolve platforms/ground collision Y axis
    dino.isGrounded = false;
    const dinoRect = { x: dino.x, y: dino.y, w: dino.width, h: dino.height };
    
    platforms.forEach(p => {
        if (p.type === 'ground' || (p.type === 'crumble' && p.state !== 'collapsed')) {
            // Precise horizontal overlap check (no padding)
            const horizontalOverlap = dino.x < p.x + p.w && dino.x + dino.width > p.x;
            if (horizontalOverlap) {
                // Precise vertical landing check (no padding)
                const verticalLanding = (dino.vy >= 0) && 
                                       (dino.y + dino.height - dino.vy <= p.y + 12) && 
                                       (dino.y + dino.height >= p.y - 4);
                
                if (verticalLanding) {
                    dino.y = p.y - dino.height;
                    dino.vy = 0;
                    dino.isGrounded = true;
                    dino.jumpCount = 0;
                    
                    if (p.type === 'crumble' && p.state === 'solid') {
                        p.state = 'shaking';
                        p.collapseTimer = 24; // 400ms collapse trigger
                    }
                }
            }
        }
    });
    
    // 8. Ground fall boundary & Lava pits checks
    platforms.forEach(p => {
        if (p.type === 'lava') {
            const lavaRect = { x: p.x, y: p.y, w: p.w, h: p.h };
            if (checkCollision(dinoRect, lavaRect)) {
                // instantly incinerate
                sfx.playHurt();
                dino.health = 0;
                dino.lives = 0;
                gameOver();
            }
        }
    });
    
    if (dino.y > canvas.height + 50) {
        // fell down gaps pit
        sfx.playHurt();
        dino.health = 0;
        dino.lives = 0;
        gameOver();
    }
    
    // 9. Jump triggers removed for event-driven jumps
    
    // 10. Update crumbling platforms mechanics
    platforms.forEach(p => {
        if (p.type === 'crumble') {
            if (p.state === 'shaking') {
                p.collapseTimer--;
                p.shakeOffset = (Math.random() - 0.5) * 4;
                if (p.collapseTimer <= 0) {
                    p.state = 'collapsed';
                    p.vy = 1;
                }
            } else if (p.state === 'collapsed') {
                p.vy += 0.35;
                p.y += p.vy;
            }
        }
    });
    
    // 11. Wall of Doom (Fire Wave) constant progression
    let elapsedTime = (Date.now() - startTime) / 1000;
    let waveSpeed = 2.0 + Math.min(3.5, elapsedTime * 0.05); // dynamic scaling speed
    fireWaveX += waveSpeed;
    
    // Fire Wave Particle Sparks
    if (Math.random() < 0.5) {
        particles.push({
            x: fireWaveX + 60 + Math.random() * 30,
            y: Math.random() * canvas.height,
            vx: Math.random() * 3 + 1,
            vy: Math.random() * 2 - 1,
            r: Math.random() * 3 + 2,
            color: Math.random() < 0.6 ? '#FF4500' : '#FFD700',
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
    
    // Check Fire Wave / Viewport limits death triggers
    if (dino.x < fireWaveX + 50 || dino.x + dino.width < camera.x) {
        sfx.playHurt();
        dino.health = 0;
        dino.lives = 0;
        gameOver();
    }
    
    // 12. Level background fade updates
    if (dino.x < 4000) {
        level1Alpha = 1; level2Alpha = 0; level3Alpha = 0;
    } else if (dino.x >= 4000 && dino.x < 4500) {
        let r = (dino.x - 4000) / 500;
        level1Alpha = 1 - r; level2Alpha = r; level3Alpha = 0;
    } else if (dino.x >= 4500 && dino.x < 9000) {
        level1Alpha = 0; level2Alpha = 1; level3Alpha = 0;
    } else if (dino.x >= 9000 && dino.x < 9500) {
        let r = (dino.x - 9000) / 500;
        level1Alpha = 0; level2Alpha = 1 - r; level3Alpha = r;
    } else {
        level1Alpha = 0; level2Alpha = 0; level3Alpha = 1;
    }
    
    // 13. Obstacles collision checks
    obstacles.forEach((obj, idx) => {
        const objRect = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
        if (checkCollision(dinoRect, objRect)) {
            if (dino.invincibilityTimer <= 0) {
                dino.health -= 2;
                dino.invincibilityTimer = 60;
                sfx.playHurt();
                screenShake(10, 10);
                
                if (dino.health <= 0) {
                    dino.lives--;
                    if (dino.lives > 0) dino.health = 6;
                    else gameOver();
                }
            }
        }
    });
    
    // 14. Projectiles logic (Meteorites & Pterodactyls)
    projectiles.forEach((proj, idx) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Pterodactyl wings animation
        if (proj.type === 'pterodactyl') {
            proj.frame = (proj.frame + 1) % 18;
        }
        
        // Collision check
        const projRect = { x: proj.x, y: proj.y, w: proj.w, h: proj.h };
        if (checkCollision(dinoRect, projRect)) {
            if (dino.invincibilityTimer <= 0) {
                dino.health -= 2;
                dino.invincibilityTimer = 60;
                sfx.playHurt();
                screenShake(10, 10);
                
                // remove projectile
                projectiles.splice(idx, 1);
                
                if (dino.health <= 0) {
                    dino.lives--;
                    if (dino.lives > 0) dino.health = 6;
                    else gameOver();
                }
            }
        }
    });
    
    projectiles = projectiles.filter(p => p.x + p.w > camera.x - 100 && p.y < canvas.height + 50);
    
    // 15. Collectibles collection checks
    collectibles.forEach((item, idx) => {
        const itemRect = { x: item.x, y: item.y, w: item.w, h: item.h };
        if (checkCollision(dinoRect, itemRect)) {
            sfx.playCollect();
            collectibles.splice(idx, 1);
            
            if (item.type === 'bone') {
                score += 50;
            } else if (item.type === 'egg') {
                score += 250;
            } else if (item.type === 'leaf') {
                dino.speedBoostTimer = 180; // 3 seconds speed boost
                sfx.playBoost();
            }
        }
    });
    
    collectibles = collectibles.filter(it => it.x + it.w > camera.x - 100);
    
    // 16. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
    
    // 17. Update Score based on distance
    score += 0.25;
    scoreVal.innerText = Math.floor(score);
    
    generateTerrain();
    spawnProjectiles();
}

// Draw procedural background assets & HUD
function draw() {
    ctx.save();
    
    // Apply screen shake
    if (shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeTimer--;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Parallax loops
    let bgScroll = Math.round(-(camera.x * 0.28)) % canvas.width;
    
    if (level1Alpha > 0 && Assets.bg_level1) {
        ctx.save();
        ctx.globalAlpha = level1Alpha;
        ctx.drawImage(Assets.bg_level1, bgScroll, 0, canvas.width, canvas.height);
        ctx.drawImage(Assets.bg_level1, bgScroll + canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (level2Alpha > 0 && Assets.bg_level2) {
        ctx.save();
        ctx.globalAlpha = level2Alpha;
        ctx.drawImage(Assets.bg_level2, bgScroll, 0, canvas.width, canvas.height);
        ctx.drawImage(Assets.bg_level2, bgScroll + canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (level3Alpha > 0 && Assets.bg_level3) {
        ctx.save();
        ctx.globalAlpha = level3Alpha;
        ctx.drawImage(Assets.bg_level3, bgScroll, 0, canvas.width, canvas.height);
        ctx.drawImage(Assets.bg_level3, bgScroll + canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    // 2. Draw ground platform blocks
    platforms.forEach(p => {
        if (p.x + p.w < camera.x || p.x > camera.x + canvas.width) return;
        
        let screenX = Math.round(p.x - camera.x);
        let screenY = Math.round(p.y);
        
        if (p.type === 'ground') {
            // Draw styled ground segment block
            ctx.fillStyle = dino.x < 4000 ? '#4a3c31' : (dino.x < 9000 ? '#2d2d2d' : '#3c1c1c');
            ctx.fillRect(screenX, screenY, p.w, p.h);
            
            // ground grass/crust border
            ctx.fillStyle = dino.x < 4000 ? '#2d6a4f' : (dino.x < 9000 ? '#b7094c' : '#7209b7');
            ctx.fillRect(screenX, screenY, p.w, 8);
        } 
        else if (p.type === 'lava') {
            let lavaImg = p.style === 1 ? Assets.lava1 : Assets.lava2;
            if (lavaImg) {
                ctx.drawImage(lavaImg, screenX, screenY, p.w, p.h);
            } else {
                ctx.fillStyle = '#ff3c00';
                ctx.fillRect(screenX, screenY, p.w, p.h);
            }
        } 
        else if (p.type === 'crumble') {
            let crumbleImg = p.style === 1 ? Assets.crumble1 : Assets.crumble2;
            let drawY = p.y;
            if (p.state === 'shaking') drawY += p.shakeOffset;
            
            let screenDrawY = Math.round(drawY);
            if (crumbleImg) {
                ctx.drawImage(crumbleImg, screenX, screenDrawY, p.w, p.h);
            } else {
                ctx.fillStyle = '#8b7a5e';
                ctx.fillRect(screenX, screenDrawY, p.w, p.h);
            }
        }
    });
    
    // 3. Draw Cacti obstacles
    obstacles.forEach(obj => {
        if (obj.x + obj.w < camera.x || obj.x > camera.x + canvas.width) return;
        let screenX = Math.round(obj.x - camera.x);
        let screenY = Math.round(obj.y);
        if (Assets.cactus) {
            ctx.drawImage(Assets.cactus, screenX, screenY, obj.w, obj.h);
        } else {
            ctx.fillStyle = '#1b4332';
            ctx.fillRect(screenX, screenY, obj.w, obj.h);
        }
    });
    
    // 4. Draw Collectibles
    collectibles.forEach(item => {
        if (item.x + item.w < camera.x || item.x > camera.x + canvas.width) return;
        let screenX = Math.round(item.x - camera.x);
        let screenY = Math.round(item.y);
        let imgKey = item.type;
        if (Assets[imgKey]) {
            ctx.drawImage(Assets[imgKey], screenX, screenY, item.w, item.h);
        } else {
            ctx.fillStyle = item.type === 'bone' ? '#ffffff' : (item.type === 'egg' ? '#ffd700' : '#00ff00');
            ctx.beginPath();
            ctx.arc(screenX + item.w/2, screenY + item.h/2, item.w/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 5. Draw Projectiles
    projectiles.forEach(proj => {
        let screenX = Math.round(proj.x - camera.x);
        let screenY = Math.round(proj.y);
        if (proj.type === 'meteor') {
            let imgKey = proj.style === 1 ? 'meteor1' : 'meteor2';
            if (Assets[imgKey]) {
                ctx.drawImage(Assets[imgKey], screenX, screenY, proj.w, proj.h);
            } else {
                ctx.fillStyle = '#ff6b35';
                ctx.fillRect(screenX, screenY, proj.w, proj.h);
            }
        } 
        else if (proj.type === 'pterodactyl') {
            let fNum = Math.floor(proj.frame / 6) + 1; // 3 wings states
            let imgKey = 'pterodactyl_' + fNum;
            if (Assets[imgKey]) {
                ctx.drawImage(Assets[imgKey], screenX, screenY, proj.w, proj.h);
            } else {
                ctx.fillStyle = '#900c3f';
                ctx.fillRect(screenX, screenY, proj.w, proj.h);
            }
        }
    });
    
    // 6. Draw Speed Boost visual motion blur trail
    if (dino.speedBoostTimer > 0) {
        dino.speedTrail.forEach((trail, index) => {
            let opacity = (index + 1) / (dino.speedTrail.length + 1) * 0.28;
            ctx.save();
            ctx.globalAlpha = opacity;
            
            let trailKey = 'dino_idle';
            if (trail.isCrouching) {
                trailKey = 'dino_run1';
            } else if (trail.vy !== 0) {
                trailKey = 'dino_glide';
            } else {
                let frameNum = Math.floor(trail.x / 14) % 2 + 1;
                trailKey = 'dino_run' + frameNum;
            }
            
            let screenX = Math.round(trail.x - camera.x);
            let screenY = Math.round(trail.y);
            if (Assets[trailKey]) {
                ctx.drawImage(Assets[trailKey], screenX, screenY, trail.w, trail.h);
            }
            ctx.restore();
        });
    }
    
    // 7. Draw Dino
    let key = 'dino_idle';
    let drawW = dino.width;
    let drawH = dino.height;
    let drawY = dino.y;
    
    if (state === STATES.GAME_OVER) {
        key = 'dino_dead';
        // Dead dino lies flat on the ground/platform
        drawW = 72;
        drawH = 40;
        drawY = dino.y + (dino.height - drawH);
    } else if (!dino.isGrounded) {
        key = 'dino_glide';
    } else if (Math.abs(dino.vx) > 0.15) {
        let animSpeed = Math.max(4, 15 - Math.abs(dino.vx) * 1.5);
        let frameNum = Math.floor(Date.now() / (animSpeed * 10)) % 2 + 1;
        key = 'dino_run' + frameNum;
    }
    
    let screenDinoX = Math.round(dino.x - camera.x);
    let screenDinoY = Math.round(drawY);
    
    ctx.save();
    if (dino.invincibilityTimer > 0 && Math.floor(dino.invincibilityTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.3;
    }
    if (Assets[key]) {
        ctx.drawImage(Assets[key], screenDinoX, screenDinoY, drawW, drawH);
    } else {
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(screenDinoX, screenDinoY, drawW, drawH);
    }
    ctx.restore();
    
    // 8. Draw Wall of Doom (Fire Wave)
    let screenFireX = Math.round(fireWaveX - camera.x);
    if (Assets.fire_wave) {
        ctx.drawImage(Assets.fire_wave, screenFireX, 0, 100, canvas.height);
    } else {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
        ctx.fillRect(screenFireX, 0, 80, canvas.height);
    }
    
    // Sparks
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(Math.round(p.x - camera.x), Math.round(p.y), p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    ctx.restore(); // restore screen shake
    
    // 9. Draw HUD Overlay (Anchored on top screen grid)
    // Draw Lives
    for (let i = 0; i < 3; i++) {
        if (i < dino.lives) {
            if (Assets.heart) {
                ctx.drawImage(Assets.heart, 20 + i * 40, 15, 32, 32);
            } else {
                ctx.fillStyle = '#ff3366';
                ctx.fillRect(20 + i * 40, 15, 28, 28);
            }
        }
    }
    
    // Draw Health Bar
    let healthKey = 'health_1';
    if (dino.health === 5) healthKey = 'health_2';
    else if (dino.health === 4) healthKey = 'health_3';
    else if (dino.health === 3) healthKey = 'health_4';
    else if (dino.health === 2) healthKey = 'health_5';
    else if (dino.health <= 1) healthKey = 'health_6';
    
    if (Assets[healthKey]) {
        ctx.drawImage(Assets[healthKey], 600, 15, 180, 25);
    } else {
        ctx.fillStyle = '#333333';
        ctx.fillRect(600, 15, 180, 25);
        ctx.fillStyle = '#ff3c00';
        ctx.fillRect(602, 17, 176 * (dino.health / 6), 21);
    }
    
    // Center level info
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = '800 16px "Fredoka", cursive';
    ctx.textAlign = 'center';
    
    let levelText = "LEVEL 1";
    if (dino.x >= 9000) levelText = "LEVEL 3: APOCALYPSE";
    else if (dino.x >= 4000) levelText = "LEVEL 2: VOLCANIC PLAIN";
    
    ctx.strokeText(levelText, canvas.width/2, 32);
    ctx.fillText(levelText, canvas.width/2, 32);
    
    // Overlays based on state
    if (state === STATES.MENU) {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff6b35';
        ctx.font = "800 2.5rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('Dino Run', canvas.width/2, canvas.height/2 - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = "700 1.1rem 'Nunito', sans-serif";
        ctx.fillText('A / D: Run | W / SPACE: Jump (Hold to Glide) | S: Duck', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press SPACE or Tap to Start Running!', canvas.width/2, canvas.height/2 + 55);
    } 
    else if (state === STATES.GAME_OVER) {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e43f5a';
        ctx.font = "800 3.2rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = "700 1.3rem 'Nunito', sans-serif";
        ctx.fillText(`Distance: ${Math.floor(score)}m`, canvas.width/2, canvas.height/2 + 35);
        ctx.fillText('Press SPACE / Enter or Tap to Restart', canvas.width/2, canvas.height/2 + 70);
    }
}

function triggerJump() {
    if (dino.isGrounded && !dino.isCrouching) {
        dino.vy = dino.jumpForce;
        dino.isGrounded = false;
        dino.jumpCount = 1;
        sfx.playJump();
    } else if (!dino.isGrounded && dino.jumpCount < 2) {
        dino.vy = dino.jumpForce; // double jump
        dino.jumpCount = 2;
        sfx.playJump();
    }
}

// Tap trigger controls
function handleInputTrigger() {
    if (state === STATES.MENU) {
        state = STATES.PLAYING;
        resetGame();
    } else if (state === STATES.GAME_OVER) {
        state = STATES.PLAYING;
        resetGame();
    } else {
        triggerJump();
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Enter') {
        if (state !== STATES.PLAYING) {
            handleInputTrigger();
        }
    }
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    handleInputTrigger();
}, { passive: false });

canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    handleInputTrigger();
});

restartBtn.addEventListener('click', () => {
    state = STATES.PLAYING;
    resetGame();
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Init loader
loadAllAssets(() => {
    resetGame();
    state = STATES.MENU;
    requestAnimationFrame(loop);
});
