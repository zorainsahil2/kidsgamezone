// Flappy Bird Clone Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Game Constants
const GRAVITY = 0.25;
const FLAP_FORCE = -5.5;
const GROUND_Y = 440;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_GAP = 120;
const HIGH_SCORE_KEY = 'kgz_highscore_flappy-bird';

// Game state variables
let state = 'MENU';
let score = 0;
let highScore = localStorage.getItem(HIGH_SCORE_KEY) ? parseInt(localStorage.getItem(HIGH_SCORE_KEY)) : 0;
highScoreVal.innerText = highScore;

// Load Assets
const assets = {
    idle: new Image(),
    midFlight: new Image(),
    flapDown: new Image(),
    damage: new Image(),
    bg: new Image()
};

assets.idle.src = 'assets/Idle.png';
assets.midFlight.src = 'assets/Mid_Flight.png';
assets.flapDown.src = 'assets/Flap_Down.png';
assets.damage.src = 'assets/Damage.png';
assets.bg.src = 'assets/Fairytale_landscape.jpeg';

// Parallax background configuration
let bgParallaxScroll = 0;
const BG_PARALLAX_SPEED = 0.5; // slow scroll speed (0.25 * PIPE_SPEED)

// Bird configuration
let bird = {
    x: 60,
    y: 200,
    width: 44,
    height: 38,
    hitboxWidth: 26,
    hitboxHeight: 26,
    vy: 0,
    flapTimer: 0
};

// Pipes
let pipes = [];
let spawnTimer = 0;
let bgScroll = 0;

// Reset State
function resetGame() {
    score = 0;
    scoreVal.innerText = score;
    
    bird.y = 200;
    bird.vy = 0;
    bird.flapTimer = 0;
    
    pipes = [];
    spawnTimer = 0;
    bgScroll = 0;
}

// User Actions
function triggerFlap() {
    if (state === 'MENU') {
        state = 'PLAYING';
        resetGame();
    } else if (state === 'PLAYING') {
        bird.vy = FLAP_FORCE;
        bird.flapTimer = 10; // 10 frames of flapping animation
    } else if (state === 'GAME_OVER') {
        state = 'PLAYING';
        resetGame();
    }
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        triggerFlap();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    triggerFlap();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    triggerFlap();
});

restartBtn.addEventListener('click', () => {
    state = 'PLAYING';
    resetGame();
});

// Update logic
function update() {
    if (state !== 'PLAYING') return;

    // Apply gravity
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    // Decrement flap timer
    if (bird.flapTimer > 0) {
        bird.flapTimer--;
    }

    // Update parallax scroll
    let bgImgWidth = assets.bg.width ? (canvas.height * (assets.bg.width / assets.bg.height)) : canvas.width;
    bgParallaxScroll = (bgParallaxScroll + BG_PARALLAX_SPEED) % bgImgWidth;

    // Collision with ceiling or ground
    let hitTop = bird.y - bird.hitboxHeight / 2;
    let hitBottom = bird.y + bird.hitboxHeight / 2;
    if (hitTop <= 0 || hitBottom >= GROUND_Y) {
        gameOver();
        return;
    }

    // Scroll ground
    bgScroll = (bgScroll - PIPE_SPEED) % 24;

    // Spawn pipes
    spawnTimer--;
    if (spawnTimer <= 0) {
        let topHeight = 50 + Math.random() * 220; // top pipe height
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + PIPE_GAP,
            width: 52,
            passed: false
        });
        spawnTimer = PIPE_SPAWN_RATE;
    }

    // Update and check pipes
    pipes.forEach((pipe, idx) => {
        pipe.x -= PIPE_SPEED;

        // Scoring check
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            score++;
            scoreVal.innerText = score;
            pipe.passed = true;
        }

        // Collision Check
        let hitLeft = bird.x - bird.hitboxWidth / 2;
        let hitRight = bird.x + bird.hitboxWidth / 2;

        // Top Pipe Collision Box
        let collideTop = hitRight > pipe.x && 
                         hitLeft < pipe.x + pipe.width && 
                         hitTop < pipe.topHeight;
        
        // Bottom Pipe Collision Box
        let collideBottom = hitRight > pipe.x && 
                            hitLeft < pipe.x + pipe.width && 
                            hitBottom > pipe.bottomY;

        if (collideTop || collideBottom) {
            gameOver();
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter(p => p.x + p.width > 0);
}

function gameOver() {
    state = 'GAME_OVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
        highScoreVal.innerText = highScore;
    }
}

// Draw screen
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Magical Sky Gradient (Lavender to Pastel Pink)
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#825ad6'); // Mystical Purple
    skyGrad.addColorStop(0.5, '#d88be7'); // Dreamy Pinkish Violet
    skyGrad.addColorStop(1, '#ffc7d4'); // Soft Pastel Sunset Rose
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1b. Seamless Parallax Background Image
    let bgImgWidth = assets.bg.width ? (canvas.height * (assets.bg.width / assets.bg.height)) : canvas.width;
    ctx.drawImage(assets.bg, -bgParallaxScroll, 0, bgImgWidth, canvas.height);
    ctx.drawImage(assets.bg, bgImgWidth - bgParallaxScroll, 0, bgImgWidth, canvas.height);

    // 2. Draw Dreamy Clouds (Soft Pinkish White with glowing effect)
    ctx.fillStyle = 'rgba(255, 240, 245, 0.65)';
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, Math.PI * 2);
    ctx.arc(130, 90, 30, 0, Math.PI * 2);
    ctx.arc(160, 100, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(280, 150, 20, 0, Math.PI * 2);
    ctx.arc(300, 140, 20, 0, Math.PI * 2);
    ctx.arc(320, 150, 20, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Pipes (Magical Crystal Pillars)
    pipes.forEach(pipe => {
        // Crystal gradient fill
        let pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        pipeGrad.addColorStop(0, '#a76ad6'); // Deep Crystal Purple
        pipeGrad.addColorStop(0.3, '#f5c2ff'); // Light Glow
        pipeGrad.addColorStop(0.7, '#f5c2ff');
        pipeGrad.addColorStop(1, '#814ca8'); // Deep Purple Shadow
        
        ctx.fillStyle = pipeGrad;
        ctx.strokeStyle = '#fff5ea'; // Magic gold/white border
        ctx.lineWidth = 3;

        // Top Pipe
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.strokeRect(pipe.x, -10, pipe.width, pipe.topHeight + 10);
        // Top Pipe Lip/Rim
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 20, pipe.width + 6, 20);
        ctx.strokeRect(pipe.x - 3, pipe.topHeight - 20, pipe.width + 6, 20);

        // Bottom Pipe
        let bottomHeight = GROUND_Y - pipe.bottomY;
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight + 10);
        // Bottom Pipe Lip/Rim
        ctx.fillRect(pipe.x - 3, pipe.bottomY, pipe.width + 6, 20);
        ctx.strokeRect(pipe.x - 3, pipe.bottomY, pipe.width + 6, 20);
    });

    // 4. Draw Ground Line & Grass block (Enchanted forest)
    ctx.fillStyle = '#ebd5ff'; // Pastel Lavender Sand/Soil
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // Magical Magenta/Pink Grass line on ground
    ctx.fillStyle = '#f06292'; // Dreamy Pink Grass
    ctx.fillRect(0, GROUND_Y, canvas.width, 14);

    ctx.strokeStyle = '#c2185b'; // Deep pink boundary
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 14);
    ctx.lineTo(canvas.width, GROUND_Y + 14);
    ctx.stroke();

    // Ground details scrolling (Enchanted sparkles/specks)
    ctx.strokeStyle = '#cba3f5';
    ctx.lineWidth = 4;
    let groundOffset = 0;
    while (groundOffset < canvas.width + 24) {
        let drawX = groundOffset + bgScroll;
        ctx.beginPath();
        ctx.moveTo(drawX, GROUND_Y + 22);
        ctx.lineTo(drawX - 8, GROUND_Y + 36);
        ctx.stroke();
        groundOffset += 24;
    }

    // 5. Draw Fairy Sprite (with dynamic rotation and animation states)
    let sprite;
    if (state === 'GAME_OVER') {
        sprite = assets.damage;
    } else if (bird.flapTimer > 0) {
        sprite = assets.flapDown;
    } else {
        // Cycle Idle and Mid_Flight smoothly during normal flight/gravity
        let cycle = Math.floor(Date.now() / 150) % 2;
        sprite = (cycle === 0) ? assets.idle : assets.midFlight;
    }

    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    // Calculate rotation angle based on vertical velocity
    let angle = bird.vy * 0.08; // sensitivity factor
    let maxTiltUp = -Math.PI / 6;  // -30 degrees
    let maxTiltDown = Math.PI / 2.5; // ~72 degrees
    angle = Math.max(maxTiltUp, Math.min(maxTiltDown, angle));
    
    if (state === 'GAME_OVER') {
        angle = Math.PI / 4; // 45 degrees tilt down for hit state
    }
    
    ctx.rotate(angle);
    
    // Draw the image centered at (0, 0)
    ctx.drawImage(
        sprite,
        -bird.width / 2,
        -bird.height / 2,
        bird.width,
        bird.height
    );
    ctx.restore();

    // Overlays based on state
    if (state === 'MENU') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFE66D';
        ctx.font = "800 2.2rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('Flying Fairy', canvas.width/2, canvas.height/2 - 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1rem 'Nunito', sans-serif";
        ctx.fillText('Press SPACE or TAP to Flap!', canvas.width/2, canvas.height/2 + 20);
    } else if (state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(26, 32, 44, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF6B35';
        ctx.font = "800 2.5rem 'Fredoka', cursive";
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = "700 1.1rem 'Nunito', sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 35);
        ctx.fillText('Press SPACE or TAP to Fly again!', canvas.width/2, canvas.height/2 + 65);
    }
}

// Main Game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Boot
resetGame();
loop();
