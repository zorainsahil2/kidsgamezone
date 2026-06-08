/**
 * KidsGameZone: Car Racing 2D
 * High performance top-down retro car racer with smooth transitions and Web Audio FX.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const livesVal = document.getElementById('livesVal');
const restartBtn = document.getElementById('restartBtn');

const STORAGE_KEY = 'kgz_highscore_car-racing-2d';

// Audio Synthesis System
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

    if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
    }
}

// Configuration
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 500;
const LANE_WIDTH = 100;
const CAR_WIDTH = 36;
const CAR_HEIGHT = 65;

// State Variables
let score = 0;
let highScore = localStorage.getItem(STORAGE_KEY) || 0;
let lives = 3;
let gameOver = false;
let gameSpeed = 6;
let maxSpeed = 15;
let playerLane = 1; // 0 = Left, 1 = Middle, 2 = Right
let playerX = 150; // Smooth slide interpolation
let playerY = 400;
let obstacles = [];
let roadOffset = 0;
let invulnerabilityFrames = 0;
let nextSpawnDelay = 120; // in frames
let framesSinceLastSpawn = 0;
let gameStarted = false;

highScoreVal.textContent = highScore;

// Road Lines and Speed
function drawRoad() {
    // Asphalt base
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Left and Right grass/curbs shoulders
    ctx.fillStyle = '#48bb78'; // Green shoulders
    ctx.fillRect(0, 0, 10, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT);

    // Red/White curb strips
    const curbPatternHeight = 40;
    const curbOffset = roadOffset % curbPatternHeight;
    for (let y = -curbPatternHeight; y < CANVAS_HEIGHT + curbPatternHeight; y += curbPatternHeight) {
        ctx.fillStyle = Math.floor((y - curbOffset) / curbPatternHeight) % 2 === 0 ? '#e53e3e' : '#edf2f7';
        ctx.fillRect(10, y + curbOffset, 6, curbPatternHeight);
        ctx.fillRect(CANVAS_WIDTH - 16, y + curbOffset, 6, curbPatternHeight);
    }

    // Lane division lines (dotted)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 30]);
    ctx.lineDashOffset = -roadOffset;

    // Draw left dividing line
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, CANVAS_HEIGHT);
    ctx.stroke();

    // Draw right dividing line
    ctx.beginPath();
    ctx.moveTo(200, 0);
    ctx.lineTo(200, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash pattern
}

// Car drawing helper
function drawCar(x, y, color, isPlayer = false) {
    ctx.save();
    ctx.translate(x, y);

    // Wheels
    ctx.fillStyle = '#1a202c';
    // Front wheels
    ctx.fillRect(-CAR_WIDTH/2 - 2, 8, 4, 12);
    ctx.fillRect(CAR_WIDTH/2 - 2, 8, 4, 12);
    // Rear wheels
    ctx.fillRect(-CAR_WIDTH/2 - 2, CAR_HEIGHT - 20, 4, 12);
    ctx.fillRect(CAR_WIDTH/2 - 2, CAR_HEIGHT - 20, 4, 12);

    // Main Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-CAR_WIDTH/2 + 4, 0);
    ctx.lineTo(CAR_WIDTH/2 - 4, 0);
    ctx.quadraticCurveTo(CAR_WIDTH/2, 10, CAR_WIDTH/2, 20);
    ctx.lineTo(CAR_WIDTH/2, CAR_HEIGHT - 10);
    ctx.quadraticCurveTo(CAR_WIDTH/2, CAR_HEIGHT, CAR_WIDTH/2 - 6, CAR_HEIGHT);
    ctx.lineTo(-CAR_WIDTH/2 + 6, CAR_HEIGHT);
    ctx.quadraticCurveTo(-CAR_WIDTH/2, CAR_HEIGHT, -CAR_WIDTH/2, CAR_HEIGHT - 10);
    ctx.lineTo(-CAR_WIDTH/2, 20);
    ctx.quadraticCurveTo(-CAR_WIDTH/2, 10, -CAR_WIDTH/2 + 4, 0);
    ctx.closePath();
    ctx.fill();

    // Spoiler (rear wing)
    ctx.fillStyle = '#111827';
    ctx.fillRect(-CAR_WIDTH/2 - 4, CAR_HEIGHT - 5, CAR_WIDTH + 8, 4);

    // Windshield (Cabin glass)
    ctx.fillStyle = '#ebf8ff';
    ctx.beginPath();
    ctx.moveTo(-CAR_WIDTH/2 + 8, 22);
    ctx.lineTo(CAR_WIDTH/2 - 8, 22);
    ctx.lineTo(CAR_WIDTH/2 - 6, 38);
    ctx.lineTo(-CAR_WIDTH/2 + 6, 38);
    ctx.closePath();
    ctx.fill();

    // Side windows
    ctx.fillRect(-CAR_WIDTH/2 + 3, 26, 3, 10);
    ctx.fillRect(CAR_WIDTH/2 - 6, 26, 3, 10);

    // Headlights
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(-CAR_WIDTH/2 + 7, 4, 4, 0, Math.PI * 2);
    ctx.arc(CAR_WIDTH/2 - 7, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Stripes (Racing paint)
    if (isPlayer) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, 0, 2, CAR_HEIGHT - 12);
        ctx.fillRect(1, 0, 2, CAR_HEIGHT - 12);
    }

    ctx.restore();
}

// Obstacle Handler
const obstacleColors = ['#f56565', '#ed8936', '#ecc94b', '#9f7aea', '#ed64a6', '#00cbc6'];
function spawnObstacle() {
    // Select a lane randomly
    const lane = Math.floor(Math.random() * 3);
    const color = obstacleColors[Math.floor(Math.random() * obstacleColors.length)];
    const x = lane * LANE_WIDTH + LANE_WIDTH / 2;
    const y = -CAR_HEIGHT;
    const speedMultiplier = 0.5 + Math.random() * 0.4; // variable speeds relative to road
    obstacles.push({ x, y, color, speedMultiplier });
}

function updateObstacles() {
    framesSinceLastSpawn++;
    if (framesSinceLastSpawn >= nextSpawnDelay) {
        spawnObstacle();
        framesSinceLastSpawn = 0;
        // Tweak difficulty
        nextSpawnDelay = Math.max(60, 130 - Math.floor(score / 50) * 10);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        // Move obstacle down relative to the player
        obs.y += gameSpeed * obs.speedMultiplier;

        // Collision Check
        if (invulnerabilityFrames === 0 && !gameOver) {
            const pxMin = playerX - CAR_WIDTH/2;
            const pxMax = playerX + CAR_WIDTH/2;
            const pyMin = playerY;
            const pyMax = playerY + CAR_HEIGHT;

            const oxMin = obs.x - CAR_WIDTH/2;
            const oxMax = obs.x + CAR_WIDTH/2;
            const oyMin = obs.y;
            const oyMax = obs.y + CAR_HEIGHT;

            if (pxMax > oxMin && pxMin < oxMax && pyMax > oyMin && pyMin < oyMax) {
                // Collided!
                playSound('hit');
                lives--;
                livesVal.textContent = lives;
                invulnerabilityFrames = 60; // 1 second of flashes
                // Remove obstacle so it doesn't double-hit
                obstacles.splice(i, 1);

                if (lives <= 0) {
                    endGame();
                }
                continue;
            }
        }

        // Check if passed successfully
        if (obs.y > CANVAS_HEIGHT + CAR_HEIGHT) {
            obstacles.splice(i, 1);
            if (!gameOver) {
                score += 10;
                scoreVal.textContent = score;
                playSound('score');
                // Speed up slightly
                if (gameSpeed < maxSpeed) {
                    gameSpeed += 0.15;
                }
            }
        }
    }
}

function drawObstacles() {
    obstacles.forEach(obs => {
        drawCar(obs.x, obs.y, obs.color, false);
    });
}

// Main Game Loop
function gameLoop() {
    // 1. Calculations
    if (!gameOver) {
        roadOffset += gameSpeed;
        updateObstacles();
    }

    // Smooth movement interpolation for player lane change
    const targetX = playerLane * LANE_WIDTH + LANE_WIDTH / 2;
    playerX += (targetX - playerX) * 0.25;

    if (invulnerabilityFrames > 0) {
        invulnerabilityFrames--;
    }

    // 2. Rendering
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawRoad();
    drawObstacles();

    // Draw Player
    if (invulnerabilityFrames === 0 || Math.floor(invulnerabilityFrames / 6) % 2 === 0) {
        drawCar(playerX, playerY, '#3182ce', true); // Sleek Blue Player Car
    }

    // Game Over Overlay
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFE66D';
        ctx.font = '800 28px "Fredoka", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 16px "Nunito", sans-serif';
        ctx.fillText(`Your Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillText(`Best Record: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);

        ctx.fillStyle = '#a0aec0';
        ctx.font = '600 12px "Nunito", sans-serif';
        ctx.fillText('Tap / Press Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);
    } else if (!gameStarted) {
        // Start screen overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFE66D';
        ctx.font = '800 24px "Fredoka", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('CAR RACING 2D', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px "Nunito", sans-serif';
        ctx.fillText('Use Left/Right Arrows or Keys A/D', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillText('Tap Left / Right half of screen on Mobile', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

        ctx.fillStyle = '#4ECDC4';
        ctx.font = '800 16px "Fredoka", cursive';
        ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }

    requestAnimationFrame(gameLoop);
}

// Control Input handlers
function changeLane(dir) {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }

    if (dir === 'left' && playerLane > 0) {
        playerLane--;
        playSound('move');
    } else if (dir === 'right' && playerLane < 2) {
        playerLane++;
        playSound('move');
    }
}

// Keyboard
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        changeLane('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        changeLane('right');
    } else if (e.key === ' ' || e.key === 'Enter') {
        if (gameOver) resetGame();
        else if (!gameStarted) startGame();
    }
});

// Mouse/Touch Tap Controls
canvas.addEventListener('click', (e) => {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
        changeLane('left');
    } else {
        changeLane('right');
    }
});

// Mobile Swipe gesture integration
let touchStartX = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
        if (diff > 0) {
            changeLane('right');
        } else {
            changeLane('left');
        }
    }
}, { passive: true });

// Game Logic Control
function startGame() {
    gameStarted = true;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function endGame() {
    gameOver = true;
    playSound('gameover');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(STORAGE_KEY, highScore);
        highScoreVal.textContent = highScore;
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    gameSpeed = 6;
    playerLane = 1;
    playerX = 150;
    obstacles = [];
    roadOffset = 0;
    invulnerabilityFrames = 0;
    nextSpawnDelay = 120;
    framesSinceLastSpawn = 0;
    scoreVal.textContent = score;
    livesVal.textContent = lives;
    gameOver = false;
    startGame();
}

restartBtn.addEventListener('click', () => {
    resetGame();
});

// Kickoff
requestAnimationFrame(gameLoop);
