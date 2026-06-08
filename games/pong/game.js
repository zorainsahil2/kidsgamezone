/**
 * KidsGameZone: Pong Classic
 * Two-paddle bouncing physics, elastic bounce angles, vector speeds scaling, AI delays trackers, and Web Audio.
 */

const STORAGE_KEY = 'kgz_highscore_pong';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreLVal = document.getElementById('scoreL');
const scoreRVal = document.getElementById('scoreR');
const highScoreVal = document.getElementById('highScoreVal');
const restartBtn = document.getElementById('restartBtn');

// Modals
const startOverlay = document.getElementById('startOverlay');
const vsAiBtn = document.getElementById('vsAiBtn');
const vsPlayerBtn = document.getElementById('vsPlayerBtn');

const gameOverOverlay = document.getElementById('gameOverOverlay');
const winnerText = document.getElementById('winnerText');
const finalScoreL = document.getElementById('finalScoreL');
const finalScoreR = document.getElementById('finalScoreR');
const streakText = document.getElementById('streakText');
const streakVal = document.getElementById('streakVal');
const overlayRestartBtn = document.getElementById('overlayRestartBtn');

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

    if (type === 'hit1') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'hit2') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// Config
const PADDLE_W = 12;
const PADDLE_H = 75;
const BALL_R = 8;

// State Variables
let scoreL = 0;
let scoreR = 0;
let isAiMode = true;
let winStreak = 0;
let highestStreak = localStorage.getItem(STORAGE_KEY) || 0;
let gameOver = false;
let gameStarted = false;

// Physics objects
let pL = { x: 20, y: 160, w: PADDLE_W, h: PADDLE_H, speed: 5.5 };
let pR = { x: 568, y: 160, w: PADDLE_W, h: PADDLE_H, speed: 5.5 };
let ball = { x: 300, y: 200, vx: 4, vy: 2, r: BALL_R, speedMult: 1 };

// Movement keys
const keys = {
    w: false, s: false, // Player 1
    ArrowUp: false, ArrowDown: false // Player 2
};

highScoreVal.textContent = highestStreak;

function resetBall(direction) {
    ball.x = 300;
    ball.y = 200;
    ball.speedMult = 1;
    // Launch towards scoring side
    ball.vx = direction * 4.2;
    // Random vertical angle
    ball.vy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
}

// AI logic moves right paddle
function runAi() {
    const aiSpeed = 3.6; // slightly slower than player to make it fair/beatable
    const paddleCenter = pR.y + PADDLE_H / 2;

    if (ball.vx > 0) {
        // Ball moves towards AI
        if (ball.y < paddleCenter - 12) {
            pR.y -= aiSpeed;
        } else if (ball.y > paddleCenter + 12) {
            pR.y += aiSpeed;
        }
    } else {
        // Recenter AI paddle slowly when ball is moving away
        if (paddleCenter < 200 - 15) {
            pR.y += 1.5;
        } else if (paddleCenter > 200 + 15) {
            pR.y -= 1.5;
        }
    }

    // boundary clamp
    clampPaddle(pR);
}

function clampPaddle(paddle) {
    if (paddle.y < 8) paddle.y = 8;
    if (paddle.y > canvas.height - PADDLE_H - 8) {
        paddle.y = canvas.height - PADDLE_H - 8;
    }
}

// Calculations Loop
function update() {
    if (!gameStarted || gameOver) return;

    // 1. Move Left Paddle (P1)
    if (keys.w) pL.y -= pL.speed;
    if (keys.s) pL.y += pL.speed;
    clampPaddle(pL);

    // 2. Move Right Paddle (P2 / AI)
    if (isAiMode) {
        runAi();
    } else {
        if (keys.ArrowUp) pR.y -= pR.speed;
        if (keys.ArrowDown) pR.y += pR.speed;
        clampPaddle(pR);
    }

    // 3. Move Ball
    ball.x += ball.vx * ball.speedMult;
    ball.y += ball.vy * ball.speedMult;

    // Ball Wall Collision (Top/Bottom)
    if (ball.y < BALL_R + 6) {
        ball.y = BALL_R + 6;
        ball.vy = -ball.vy;
        playSound('hit2');
    } else if (ball.y > canvas.height - BALL_R - 6) {
        ball.y = canvas.height - BALL_R - 6;
        ball.vy = -ball.vy;
        playSound('hit2');
    }

    // 4. Ball Paddle Collisions
    // Left Paddle
    if (ball.vx < 0 &&
        ball.x - BALL_R <= pL.x + PADDLE_W && ball.x + BALL_R >= pL.x &&
        ball.y + BALL_R >= pL.y && ball.y - BALL_R <= pL.y + PADDLE_H) {

        // Relative bounce angle based on where ball hits paddle
        const hitPoint = (ball.y - (pL.y + PADDLE_H / 2)) / (PADDLE_H / 2);
        ball.vx = -ball.vx;
        ball.vy = hitPoint * 4.5;

        // Speedup multiplier
        ball.speedMult = Math.min(2.5, ball.speedMult * 1.08);
        playSound('hit1');
    }

    // Right Paddle
    if (ball.vx > 0 &&
        ball.x + BALL_R >= pR.x && ball.x - BALL_R <= pR.x + PADDLE_W &&
        ball.y + BALL_R >= pR.y && ball.y - BALL_R <= pR.y + PADDLE_H) {

        const hitPoint = (ball.y - (pR.y + PADDLE_H / 2)) / (PADDLE_H / 2);
        ball.vx = -ball.vx;
        ball.vy = hitPoint * 4.5;

        ball.speedMult = Math.min(2.5, ball.speedMult * 1.08);
        playSound('hit1');
    }

    // 5. Goal check (Out of bounds)
    if (ball.x < 0) {
        // Player 2 scores
        scoreR++;
        scoreRVal.textContent = scoreR;
        playSound('score');
        if (scoreR >= 7) {
            endGame(false);
        } else {
            resetBall(1);
        }
    } else if (ball.x > canvas.width) {
        // Player 1 scores
        scoreL++;
        scoreLVal.textContent = scoreL;
        playSound('score');
        if (scoreL >= 7) {
            endGame(true);
        } else {
            resetBall(-1);
        }
    }
}

// Render loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw center dotted divider
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 16]);
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, canvas.height);
    ctx.stroke();
    ctx.restore();

    // Draw Paddles
    ctx.fillStyle = '#4ECDC4'; // P1 paddle neon turquoise
    ctx.fillRect(pL.x, pL.y, pL.w, pL.h);

    ctx.fillStyle = isAiMode ? '#f56565' : '#4ECDC4'; // AI / P2 neon red/turquoise
    ctx.fillRect(pR.x, pR.y, pR.w, pR.h);

    // Draw Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Key listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

// Touch controls for mobile drag
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
        const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;

        if (clickX < 300) {
            // Left paddle track touch Y
            pL.y = clickY - PADDLE_H / 2;
            clampPaddle(pL);
        } else if (!isAiMode) {
            // Right paddle track touch Y
            pR.y = clickY - PADDLE_H / 2;
            clampPaddle(pR);
        }
    }
}, { passive: false });

// Mode trigger selections
function startPong(mode) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    isAiMode = (mode === 'ai');
    scoreL = 0;
    scoreR = 0;
    scoreLVal.textContent = scoreL;
    scoreRVal.textContent = scoreR;

    pL.y = 160;
    pR.y = 160;

    resetBall(Math.random() > 0.5 ? 1 : -1);

    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameOver = false;
    gameStarted = true;
}

function endGame(p1Won) {
    gameOver = true;
    playSound('win');

    finalScoreL.textContent = scoreL;
    finalScoreR.textContent = scoreR;

    if (isAiMode) {
        if (p1Won) {
            winStreak++;
            winnerText.textContent = `You Defeated AI!`;
            winnerText.style.color = '#48bb78';
            if (winStreak > highestStreak) {
                highestStreak = winStreak;
                localStorage.setItem(STORAGE_KEY, highestStreak);
                highScoreVal.textContent = highestStreak;
            }
        } else {
            winStreak = 0;
            winnerText.textContent = `AI Defeated You!`;
            winnerText.style.color = '#e53e3e';
        }
        streakVal.textContent = winStreak;
        streakText.style.display = 'block';
    } else {
        winnerText.textContent = p1Won ? 'Player 1 Wins!' : 'Player 2 Wins!';
        winnerText.style.color = '#4ECDC4';
        streakText.style.display = 'none';
    }

    gameOverOverlay.classList.add('active');
}

vsAiBtn.addEventListener('click', () => startPong('ai'));
vsPlayerBtn.addEventListener('click', () => startPong('player'));
overlayRestartBtn.addEventListener('click', () => {
    gameOverOverlay.classList.remove('active');
    startOverlay.classList.add('active');
});
restartBtn.addEventListener('click', () => {
    gameOverOverlay.classList.remove('active');
    startOverlay.classList.add('active');
});

// Run
gameLoop();
