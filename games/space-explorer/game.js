// Space Explorer - KidsGameZone Game Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game States
const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;

// World bounds
const WORLD_W = 2000;
const WORLD_H = 2000;

// Player Ship
let player = {
    x: 1000, // world X
    y: 1000, // world Y
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // facing up
    hp: 100,
    fuel: 100,
    w: 24,
    h: 34,
    damageFlash: 0
};

// Controls
let keys = {};
let activeButtons = {};

// Planets list
let planets = [
    { name: "Saturn", x: 1000, y: 250, color: "#eab308", size: 65, visited: false, ring: true },
    { name: "Mercury", x: 250, y: 800, color: "#94a3b8", size: 45, visited: false },
    { name: "Venus", x: 1800, y: 700, color: "#fb923c", size: 55, visited: false },
    { name: "Earth", x: 400, y: 1700, color: "#3b82f6", size: 60, visited: false },
    { name: "Jupiter", x: 1600, y: 1800, color: "#fbbf24", size: 80, visited: false }
];

// Entity Lists
let lasers = [];
let items = []; // Crystals, Artifacts, Canisters
let asteroids = [];
let alienShip = null;
let alienLasers = [];
let particles = [];

// Timers
let alienRespawnTimer = 0;
let laserCooldown = 0;

// Twinkle Stars (World Coordinates)
let stars = [];
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        size: Math.random() * 2 + 1,
        alpha: Math.random()
    });
}

// Audio Synthesizer
let audioCtx = null;
function playTone(freq, type, duration, targetFreq = null) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (targetFreq) {
            osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function initGame() {
    score = 0;
    player.x = 1000;
    player.y = 1000;
    player.vx = 0;
    player.vy = 0;
    player.angle = -Math.PI / 2;
    player.hp = 100;
    player.fuel = 100;
    player.damageFlash = 0;

    planets.forEach(p => p.visited = false);

    lasers = [];
    items = [];
    asteroids = [];
    alienLasers = [];
    particles = [];
    alienShip = null;
    alienRespawnTimer = 120; // Spawn alien quickly

    // Spawn 15 asteroids randomly
    for (let i = 0; i < 15; i++) {
        spawnAsteroid();
    }

    // Spawn 20 starter items
    for (let i = 0; i < 20; i++) {
        spawnItem();
    }

    updateUI();
}

function spawnAsteroid() {
    asteroids.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 20 + 16,
        spin: (Math.random() - 0.5) * 0.05,
        angle: Math.random() * Math.PI
    });
}

function spawnItem() {
    const types = ["canister", "canister", "crystal", "artifact"]; // higher weight for canisters
    const type = types[Math.floor(Math.random() * types.length)];
    let color = "#eab308"; // canister yellow
    let scoreVal = 0;
    if (type === "crystal") { color = "#a855f7"; scoreVal = 50; }
    if (type === "artifact") { color = "#4ade80"; scoreVal = 100; }

    items.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        type: type,
        color: color,
        size: 10,
        scoreVal: scoreVal
    });
}

function spawnAlien() {
    // spawn near player but slightly off-screen
    const angle = Math.random() * Math.PI * 2;
    alienShip = {
        x: player.x + Math.cos(angle) * 350,
        y: player.y + Math.sin(angle) * 350,
        hp: 3,
        shootTimer: 0,
        size: 26
    };
    playTone(300, "sawtooth", 0.3, 150);
}

function fireLaser() {
    if (laserCooldown > 0) return;
    laserCooldown = 15; // 4 shots/sec max
    playTone(880, "sine", 0.08, 1200);

    lasers.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8,
        life: 45 // 45 frames range
    });
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    document.getElementById("hpBar").style.width = Math.max(0, player.hp) + "%";
    document.getElementById("fuelBar").style.width = Math.max(0, player.fuel) + "%";

    const visitedCount = planets.filter(p => p.visited).length;
    document.getElementById("visitedCountVal").textContent = `${visitedCount} / 5`;
}

class SpaceSpark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2;
        this.alpha = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.025;
    }
    draw(scrollX, scrollY) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

function updateGame() {
    if (gameState !== STATE_PLAYING) return;

    // Fuel decay
    if (player.fuel > 0) {
        player.fuel -= 0.015; // decays
    } else {
        // take damage without fuel
        player.hp -= 0.15;
    }
    updateUI();

    if (player.hp <= 0) {
        triggerGameOver("Your spacecraft was destroyed!");
        return;
    }

    // Direction turns
    const isLeft = keys["ArrowLeft"] || keys["KeyA"] || activeButtons["left"];
    const isRight = keys["ArrowRight"] || keys["KeyD"] || activeButtons["right"];
    if (isLeft) player.angle -= 0.055;
    if (isRight) player.angle += 0.055;

    // Thrust acceleration
    const isThrust = keys["ArrowUp"] || keys["KeyW"] || activeButtons["thrust"];
    if (isThrust && player.fuel > 0) {
        player.vx += Math.cos(player.angle) * 0.12;
        player.vy += Math.sin(player.angle) * 0.12;
        player.fuel = Math.max(0, player.fuel - 0.02);

        // spawn flame sparks
        if (Math.random() < 0.4) {
            particles.push(new SpaceSpark(player.x - Math.cos(player.angle)*14, player.y - Math.sin(player.angle)*14, "#f97316"));
        }
    }

    // Momentum dampening (space drag)
    player.vx *= 0.985;
    player.vy *= 0.985;

    player.x += player.vx;
    player.y += player.vy;

    // Keep within world bounds
    if (player.x < 20) { player.x = 20; player.vx = 0; }
    if (player.x > WORLD_W - 20) { player.x = WORLD_W - 20; player.vx = 0; }
    if (player.y < 20) { player.y = 20; player.vy = 0; }
    if (player.y > WORLD_H - 20) { player.y = WORLD_H - 20; player.vy = 0; }

    // Laser Cooldown decay
    if (laserCooldown > 0) laserCooldown--;

    // Update Player Lasers
    lasers.forEach((las, index) => {
        las.x += las.vx;
        las.y += las.vy;
        las.life--;

        // Collide with Asteroids
        asteroids.forEach(ast => {
            const dist = Math.hypot(las.x - ast.x, las.y - ast.y);
            if (dist < ast.size) {
                lasers.splice(index, 1);
                // split or spark asteroid
                playTone(350, "sine", 0.08);
                for (let i = 0; i < 5; i++) {
                    particles.push(new SpaceSpark(ast.x, ast.y, "#64748b"));
                }
            }
        });

        // Collide with Alien ship
        if (alienShip) {
            const dist = Math.hypot(las.x - alienShip.x, las.y - alienShip.y);
            if (dist < alienShip.size) {
                lasers.splice(index, 1);
                alienShip.hp--;
                playTone(450, "triangle", 0.12);
                if (alienShip.hp <= 0) {
                    // Destroy Alien!
                    score += 200;
                    playTone(200, "sawtooth", 0.4, 60);
                    for (let i = 0; i < 15; i++) {
                        particles.push(new SpaceSpark(alienShip.x, alienShip.y, "#eab308"));
                        particles.push(new SpaceSpark(alienShip.x, alienShip.y, "#22c55e"));
                    }
                    alienShip = null;
                    alienRespawnTimer = 600; // 10 seconds respawn
                }
            }
        }

        if (las.life <= 0) {
            lasers.splice(index, 1);
        }
    });

    // Update Alien lasers
    alienLasers.forEach((alas, index) => {
        alas.x += alas.vx;
        alas.y += alas.vy;
        alas.life--;

        // Collide with player
        const dist = Math.hypot(alas.x - player.x, alas.y - player.y);
        if (dist < 18) {
            alienLasers.splice(index, 1);
            player.hp -= 15;
            player.damageFlash = 12;
            playTone(180, "sawtooth", 0.2);
            updateUI();
        }

        if (alas.life <= 0) {
            alienLasers.splice(index, 1);
        }
    });

    // Update Asteroids
    asteroids.forEach(ast => {
        ast.x += ast.vx;
        ast.y += ast.vy;
        ast.angle += ast.spin;

        // Wrap world
        if (ast.x < 0) ast.x = WORLD_W;
        if (ast.x > WORLD_W) ast.x = 0;
        if (ast.y < 0) ast.y = WORLD_H;
        if (ast.y > WORLD_H) ast.y = 0;

        // Collision with player
        const dist = Math.hypot(ast.x - player.x, ast.y - player.y);
        if (dist < ast.size + 10) {
            player.hp -= 20;
            player.damageFlash = 12;
            playTone(180, "sawtooth", 0.3, 80);
            
            // push player slightly away
            const pushAngle = Math.atan2(player.y - ast.y, player.x - ast.x);
            player.vx += Math.cos(pushAngle) * 3;
            player.vy += Math.sin(pushAngle) * 3;
            updateUI();
        }
    });

    // Update Alien ship chaser
    if (alienShip) {
        // Move towards player
        const chaseAngle = Math.atan2(player.y - alienShip.y, player.x - alienShip.x);
        alienShip.x += Math.cos(chaseAngle) * 1.8;
        alienShip.y += Math.sin(chaseAngle) * 1.8;

        // Shoot lasers
        alienShip.shootTimer++;
        if (alienShip.shootTimer >= 100) {
            playTone(400, "triangle", 0.08, 200);
            alienLasers.push({
                x: alienShip.x,
                y: alienShip.y,
                vx: Math.cos(chaseAngle) * 4.5,
                vy: Math.sin(chaseAngle) * 4.5,
                life: 90
            });
            alienShip.shootTimer = 0;
        }
    } else {
        alienRespawnTimer--;
        if (alienRespawnTimer <= 0) {
            spawnAlien();
        }
    }

    // Collect items check
    items.forEach((item, index) => {
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 22) {
            items.splice(index, 1);
            if (item.type === "canister") {
                player.fuel = Math.min(100, player.fuel + 30);
                playTone(400, "sine", 0.1, 550);
            } else {
                score += item.scoreVal;
                playTone(523.25, "sine", 0.12, 659.25);
            }
            updateUI();
            spawnItem(); // replace item in world
        }
    });

    // Planets Visited Check
    planets.forEach(p => {
        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist < p.size + 15 && !p.visited) {
            p.visited = true;
            score += 100;
            playTone(523, "sine", 0.12);
            setTimeout(() => playTone(659, "sine", 0.15), 100);
            setTimeout(() => playTone(783, "sine", 0.25), 200);
            updateUI();

            // Check if all visited
            const allVisited = planets.every(p => p.visited);
            if (allVisited) {
                score += 500; // All planets bonus
                updateUI();
                playTone(1046, "sine", 0.4);
            }
        }
    });

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    if (player.damageFlash > 0) player.damageFlash--;
}

function triggerGameOver(msg) {
    gameState = STATE_GAMEOVER;
    stopEngineSound();
    playTone(150, "sawtooth", 0.5, 90);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_space-explorer", highScore);

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("failMessage").textContent = msg;
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Rendering
function drawGrid(scrollX, scrollY) {
    // Stars
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x - scrollX, star.y - scrollY, star.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    });
}

function drawPlanets(scrollX, scrollY) {
    planets.forEach(p => {
        ctx.save();
        ctx.translate(p.x - scrollX, p.y - scrollY);

        if (p.ring) {
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size + 15, 12, -Math.PI/12, 0, Math.PI*2);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI*2);
        ctx.fill();

        // Overlay features
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.arc(-p.size/3, -p.size/3, p.size/3, 0, Math.PI*2);
        ctx.arc(p.size/3, p.size/3, p.size/4, 0, Math.PI*2);
        ctx.fill();

        // Visited flag
        if (p.visited) {
            ctx.fillStyle = "#22c55e"; // check flag
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 8px Fredoka";
            ctx.fillText("✔", -4, 3);
        } else {
            // Label text
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px Nunito";
            ctx.textAlign = "center";
            ctx.fillText(p.name, 0, 4);
        }

        ctx.restore();
    });
}

function drawItems(scrollX, scrollY) {
    items.forEach(item => {
        ctx.fillStyle = item.color;
        if (item.type === "canister") {
            // Barrel shape
            ctx.beginPath();
            ctx.roundRect(item.x - scrollX - 5, item.y - scrollY - 7, 10, 14, 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(item.x - scrollX - 5, item.y - scrollY - 2, 10, 3);
        } else {
            // Diamond / Crystal
            ctx.beginPath();
            ctx.moveTo(item.x - scrollX, item.y - scrollY - 7);
            ctx.lineTo(item.x - scrollX + 6, item.y - scrollY);
            ctx.lineTo(item.x - scrollX, item.y - scrollY + 7);
            ctx.lineTo(item.x - scrollX - 6, item.y - scrollY);
            ctx.closePath();
            ctx.fill();
        }
    });
}

function drawAsteroids(scrollX, scrollY) {
    ctx.fillStyle = "#475569";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    
    asteroids.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x - scrollX, ast.y - scrollY);
        ctx.rotate(ast.angle);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let angle = (i * Math.PI) / 3;
            let radius = ast.size + (Math.sin(i * 123) * 3);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
}

function drawAlienShip(scrollX, scrollY) {
    if (!alienShip) return;

    ctx.save();
    ctx.translate(alienShip.x - scrollX, alienShip.y - scrollY);

    // Chasing UFO saucer
    ctx.fillStyle = "#10b981"; // green saucer
    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Dome cockpit
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0, Math.PI, true);
    ctx.fill();

    ctx.restore();
}

function drawPlayer(scrollX, scrollY) {
    ctx.save();
    ctx.translate(player.x - scrollX, player.y - scrollY);
    ctx.rotate(player.angle + Math.PI / 2);

    // Fire thrust flame
    const isThrust = keys["ArrowUp"] || keys["KeyW"] || activeButtons["thrust"];
    if (isThrust && player.fuel > 0) {
        ctx.fillStyle = Math.random() < 0.5 ? "#f97316" : "#ef4444";
        ctx.beginPath();
        ctx.moveTo(-5, player.h/2);
        ctx.lineTo(0, player.h/2 + 10 + Math.random()*5);
        ctx.lineTo(5, player.h/2);
        ctx.closePath();
        ctx.fill();
    }

    // Damage flash color
    if (player.damageFlash > 0 && Math.floor(player.damageFlash / 3) % 2 === 0) {
        ctx.fillStyle = "#ef4444";
    } else {
        ctx.fillStyle = "#06b6d4"; // Cyan ship
    }

    // Ship shape (triangle-ish jet)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(player.w/2, player.h/2);
    ctx.lineTo(0, player.h/4);
    ctx.lineTo(-player.w/2, player.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera scrolling (keeps player centered inside 480x320 viewport)
    const scrollX = player.x - canvas.width / 2;
    const scrollY = player.y - canvas.height / 2;

    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
        drawGrid(scrollX, scrollY);
        drawPlanets(scrollX, scrollY);
        drawItems(scrollX, scrollY);
        drawAsteroids(scrollX, scrollY);
        drawAlienShip(scrollX, scrollY);
        
        // Draw lasers
        ctx.fillStyle = "#22d3ee";
        lasers.forEach(las => {
            ctx.beginPath();
            ctx.arc(las.x - scrollX, las.y - scrollY, 3, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw alien lasers
        ctx.fillStyle = "#f43f5e";
        alienLasers.forEach(alas => {
            ctx.beginPath();
            ctx.arc(alas.x - scrollX, alas.y - scrollY, 3, 0, Math.PI*2);
            ctx.fill();
        });

        particles.forEach(p => p.draw(scrollX, scrollY));
        drawPlayer(scrollX, scrollY);

        // Draw a tiny compass radar pointer pointing to closest unvisited planet
        const unvisited = planets.filter(p => !p.visited);
        if (unvisited.length > 0) {
            // Find closest
            let closest = unvisited[0];
            let minDist = Math.hypot(closest.x - player.x, closest.y - player.y);
            unvisited.forEach(p => {
                let d = Math.hypot(p.x - player.x, p.y - player.y);
                if (d < minDist) { minDist = d; closest = p; }
            });

            // Draw radar arrow at top center
            const arrowAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
            ctx.save();
            ctx.translate(canvas.width / 2, 28);
            ctx.rotate(arrowAngle);
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(0, -5);
            ctx.lineTo(2, 0);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.font = "bold 9px Nunito";
            ctx.fillStyle = "#eab308";
            ctx.fillText(`Nearest: ${closest.name}`, canvas.width / 2 - 38, 44);
        }
    }

    updateGame();
    requestAnimationFrame(gameLoop);
}

// User controls bindings
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") {
        e.preventDefault();
        if (gameState === STATE_PLAYING) {
            fireLaser();
        }
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Bind mobile buttons
function setupTouchButton(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("mousedown", () => activeButtons[key] = true);
    btn.addEventListener("mouseup", () => activeButtons[key] = false);
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        activeButtons[key] = true;
        if (key === "shoot") fireLaser();
    }, { passive: false });
    btn.addEventListener("touchend", () => activeButtons[key] = false);
}

setupTouchButton("btnLeft", "left");
setupTouchButton("btnRight", "right");
setupTouchButton("btnThrust", "thrust");
setupTouchButton("btnShoot", "shoot");

document.getElementById("startBtn").addEventListener("click", () => {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
});

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_PLAYING;
    initGame();
});

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_space-explorer"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;

// Start Loop
gameLoop();
