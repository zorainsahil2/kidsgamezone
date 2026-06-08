/**
 * Bella's Adventure - Core Game Engine
 */

const DEBUG_RECT = false; // Set to true to display bounding boxes for debugging

// 1. Audio Synthesizer Engine (Web Audio API)
class SoundEffects {
  constructor() {
    this.ctx = null;
  }
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  
  playJump() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now); // E4 note
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
  
  playCoin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5 note
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }
  
  playMushroom() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [330, 392, 660, 523, 587, 784]; // C-E-G style arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      
      gain.gain.setValueAtTime(0.05, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.15);
    });
  }
  
  playStomp() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.12);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }
  
  playDeath() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [493.88, 440, 392, 349.23, 293.66, 220]; // Descending sad scale
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      
      gain.gain.setValueAtTime(0.08, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.25);
    });
  }
  
  playStar() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      
      gain.gain.setValueAtTime(0.03, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.08);
    });
  }
  
  playLevelComplete() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0.06, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  }
  
  playGameOver() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [220, 196, 174.61, 146.83, 110];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.22);
      
      gain.gain.setValueAtTime(0.08, now + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.22);
      osc.stop(now + idx * 0.22 + 0.35);
    });
  }
}
const sfx = new SoundEffects();

// 2. Texture Asset Registry
const Assets = {};
const assetList = {
  bella_small_idle: 'assets/Bella_small_idle.png',
  bella_small_run1: 'assets/Bella_small_run1.png',
  bella_small_run2: 'assets/Bella_small_run2.png',
  bella_small_jump: 'assets/Bella_small_jump.png',
  bella_small_slide: 'assets/Bella_small_slide.png',
  bella_small_death: 'assets/Bella_small_death.png',
  bella_small_victory: 'assets/Bella_small_victory.png',
  // Bella big
  bella_big_idle: 'assets/Bella_big_idle.png',
  bella_big_run1: 'assets/Bella_big_run1.png',
  bella_big_run2: 'assets/Bella_big_run2.png',
  bella_big_jump: 'assets/Bella_big_jump.png',
  bella_big_slide: 'assets/Bella_big_slide.png',
  bella_big_victory: 'assets/Bella_big_victory.png',
  // Fire Bella
  bella_fire_idle: 'assets/Fire_Bella_idle.png',
  bella_fire_run1: 'assets/Fire_Bella_run1.png',
  bella_fire_run2: 'assets/Fire_Bella_run2.png',
  bella_fire_jump: 'assets/Fire_Bella_jump.png',
  bella_fire_slide: 'assets/Fire_Bella_slide.png',
  bella_fire_victory: 'assets/Fire_Bella_victory.png',
  // Power-ups
  magicMushroom: 'assets/MagicMushroom.png',
  mushroom1up: 'assets/1upMushroom.png',
  starman: 'assets/Starman.png',
  coin: 'assets/Coin.png',
  coin_underground: 'assets/Coin_Underground.png',
  flag: 'assets/Flag.png',
  flagpole: 'assets/FlagPole.png',
  // Blocks
  groundblock: 'assets/GroundBlock.png',
  brick: 'assets/Brick.png',
  hardblock: 'assets/HardBlock.png',
  emptyblock: 'assets/EmptyBlock.png',
  mysteryblock: 'assets/MysteryBlock.png',
  undergroundblock: 'assets/UndergroundBlock.png',
  undergroundbrick: 'assets/UndergroundBrick.png',
  // Environment
  background: 'assets/background.png',
  bush1: 'assets/Bush1.png',
  bush2: 'assets/Bush2.png',
  bush3: 'assets/Bush3.png',
  cloud1: 'assets/Cloud1.png',
  cloud2: 'assets/Cloud2.png',
  cloud3: 'assets/Cloud3.png',
  hill1: 'assets/Hill1.png',
  hill2: 'assets/Hill2.png',
  castle: 'assets/Castle.png',
  pipetop: 'assets/PipeTop.png',
  pipebottom: 'assets/PipeBottom.png',
  pipeconnection: 'assets/PipeConnection.png',
  // Enemies
  goomba_walk1: 'assets/Goomba_Walk1.png',
  goomba_walk2: 'assets/Goomba_Walk2.png',
  goomba_flat: 'assets/Goomba_Flat.png',
  koopa_walk1: 'assets/Koopa_Walk1.png',
  koopa_walk2: 'assets/Koopa_Walk2.png',
  koopa_shell: 'assets/Koopa_Shell.png',
  // Advanced assets
  bullet_bill: 'assets/Bullet_Bill.png',
  lakitu: 'assets/Lakitu.png',
  piranha_closed: 'assets/Piranha_Plant_Mouth_Closed.png',
  piranha_open: 'assets/Piranha_Plant_Mouth_Open.png',
  bowser_walk1: 'assets/Bowser_Walk1.png',
  bowser_walk2: 'assets/Bowser_Walk2.png',
  blooper_swim1: 'assets/Blooper_Swim1.png',
  blooper_swim2: 'assets/Blooper_Swim2.png',
  cheep_swim1: 'assets/Cheep_Cheep_Swim1.png',
  cheep_swim2: 'assets/Cheep_Cheep_Swim2.png',
  vine_top: 'assets/Vine_Top.png',
  vine_body_connected: 'assets/Vine_Body_Connected.png',
  vine_body_straight: 'assets/Vine_Body_Straight.png',
  moving_platform_top: 'assets/Moving_Platform_Top.png',
  pulley_rope: 'assets/Pulley_Rope_Segment.png',
  spiny_walk1: 'assets/Spiny_Walk1.png',
  spiny_walk2: 'assets/Spiny_Walk2.png',
  red_paratroopa_fly1: 'assets/Red_Paratroopa_Fly1.png',
  red_paratroopa_fly2: 'assets/Red_Paratroopa_Fly2.png',
  red_koopa: 'assets/Red_Koopa_Troopa.png',
};

// 3. Fallback draw function — if asset is null, draw colored rectangle
function drawAsset(ctx, key, x, y, w, h) {
  if (key === 'flower') {
    ctx.save();
    // stem
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h);
    ctx.lineTo(x + w/2, y + h/2);
    ctx.stroke();
    // leaves
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.ellipse(x + w/2 - 5, y + h - 10, 5, 2, -Math.PI/6, 0, Math.PI*2);
    ctx.ellipse(x + w/2 + 5, y + h - 10, 5, 2, Math.PI/6, 0, Math.PI*2);
    ctx.fill();
    // petals (layered circles: red, white, yellow)
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2 - 4, 12, 8, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2 - 4, 9, 6, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2 - 4, 6, 4, 0, 0, Math.PI*2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w/2 - 2, y + h/2 - 6, 1.5, 3);
    ctx.fillRect(x + w/2 + 1, y + h/2 - 6, 1.5, 3);
    ctx.restore();
    return;
  }
  
  if (Assets[key]) {
    ctx.drawImage(Assets[key], x, y, w, h);
  } else {
    // Fallback colors per type
    const colors = {
      bella_fire: '#ff4500', bella: '#FF69B4', goomba: '#8B4513', koopa: '#228B22',
      coin: '#FFD700', brick: '#CD853F', ground: '#5c4033',
      mystery: '#FFD700', pipe: '#008000', hard: '#555555',
      default: '#888888'
    };
    const type = Object.keys(colors).find(t => key.toLowerCase().includes(t)) || 'default';
    ctx.fillStyle = colors[type];
    ctx.fillRect(x, y, w, h);
  }
}

// 4. Animator System
class BellaAnimator {
  constructor() {
    this.frameTimer = 0;
    this.frameInterval = 8; // Switch frame every 8 game ticks
    this.runFrame = 0; // Toggles 0 or 1
  }

  getCurrentImageKey(state, isSmall) {
    let prefix = '';
    if (player.isFire) {
      prefix = 'bella_fire';
    } else if (isSmall) {
      prefix = 'bella_small';
    } else {
      prefix = 'bella_big';
    }
    
    switch(state) {
      case 'idle':   return `${prefix}_idle`;
      case 'run':
        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
          this.frameTimer = 0;
          this.runFrame = this.runFrame === 0 ? 1 : 0;
        }
        return `${prefix}_run${this.runFrame + 1}`;
      case 'jump':   return `${prefix}_jump`;
      case 'slide':  return `${prefix}_slide`;
      case 'victory': return `${prefix}_victory`;
      case 'death':  return 'bella_small_death';
      default:       return `${prefix}_idle`;
    }
  }
}

// Fireball class
class Fireball {
  constructor(x, y, vx) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 12;
    this.vx = vx;
    this.vy = 2; // Initial horizontal drop/bounce velocity
    this.bounceCount = 0;
    this.active = true;
  }
  
  update() {
    if (!this.active) return;
    
    // Apply gravity
    this.vy += 0.45;
    if (this.vy > 8) this.vy = 8;
    
    // Move X
    this.x += this.vx;
    this.resolveCollisions('x');
    
    // Move Y
    this.y += this.vy;
    this.resolveCollisions('y');
    
    // Check boundaries
    if (this.y > 510 || this.x < camera.x - 50 || this.x > camera.x + canvas.width + 50) {
      this.active = false;
    }
    
    // Collisions with enemies
    enemies.forEach(e => {
      if (e.state === 'dead') return;
      const fbRect = { x: this.x, y: this.y, w: this.w, h: this.h };
      const eRect = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (checkCollision(fbRect, eRect)) {
        this.active = false;
        // Spawn explosion particles
        addParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff4500', 8);
        
        // Kill enemy (fling)
        e.state = 'dead';
        e.deathTimer = 60;
        e.vy = -6;
        e.vx = this.vx > 0 ? 2 : -2;
        
        score += 150;
        floatingTexts.push({ x: e.x, y: e.y - 15, text: "+150", alpha: 1, timer: 45 });
        sfx.playStomp();
      }
    });
  }
  
  resolveCollisions(axis) {
    const fbRect = { x: this.x, y: this.y, w: this.w, h: this.h };
    platforms.forEach(p => {
      // Only collide with solid objects
      if (p.type === 'ground' || p.type === 'undergroundground' || p.type === 'brick' || p.type === 'undergroundbrick' || p.type === 'pipe' || p.type === 'hard') {
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        if (checkCollision(fbRect, platRect)) {
          if (axis === 'x') {
            // Hit wall: explode and disappear
            this.active = false;
            addParticles(this.x, this.y, '#ff6b35', 4);
          } else {
            if (this.vy > 0) {
              // Bounce on floor
              this.y = p.y - this.h;
              this.vy = -4.5; // Bounce up
              this.bounceCount++;
              if (this.bounceCount >= 3) {
                this.active = false;
                addParticles(this.x, this.y, '#ff6b35', 4);
              }
            } else if (this.vy < 0) {
              // Hit ceiling: explode
              this.active = false;
              addParticles(this.x, this.y, '#ff6b35', 4);
            }
          }
        }
      }
    });
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(this.x - camera.x + 6, this.y + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(this.x - camera.x + 6, this.y + 6, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Hammer class (used by Hammer Bro)
class Hammer {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.vx = vx;
    this.vy = vy;
    this.rotation = 0;
    this.active = true;
  }
  
  update() {
    if (!this.active) return;
    
    // Apply gravity
    this.vy += 0.22;
    if (this.vy > 8) this.vy = 8;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.rotation += 0.15;
    
    // Cull if offscreen
    if (this.y > 510 || this.x < camera.x - 50 || this.x > camera.x + canvas.width + 50) {
      this.active = false;
    }
    
    // Collision with player
    const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
    const hRect = { x: this.x, y: this.y, w: this.w, h: this.h };
    if (checkCollision(pRect, hRect) && player.state !== 'death') {
      playerHurt(false);
      this.active = false;
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x - camera.x + 8, this.y + 8);
    ctx.rotate(this.rotation);
    
    // Draw simple hammer shape
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(-8, -3, 16, 6); // hammer head
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-2, 3, 4, 10); // handle
    ctx.restore();
  }
}

// FlagpoleSequence class
class FlagpoleSequence {
  constructor(flagpoleData) {
    this.flagpole = flagpoleData; // has x, y, and flagY
    this.state = 'slide'; // 'slide', 'jump_off', 'walk', 'done'
    this.timer = 0;
    
    // Snap Bella to the left side of the pole
    player.x = this.flagpole.x - 20; 
    player.y = 120;
    player.vx = 0;
    player.vy = 0;
    player.state = 'slide';
  }
  
  update() {
    if (this.state === 'slide') {
      // Slide player down
      player.y += 2.5;
      
      // Slide flag down
      if (this.flagpole.flagY < 340) {
        this.flagpole.flagY += 2.5;
      }
      
      // Check if player reached bottom
      if (player.y >= 352) {
        player.y = 352;
        this.state = 'jump_off';
        this.timer = 0;
      }
    } 
    else if (this.state === 'jump_off') {
      // Hop to right
      player.x = this.flagpole.x + 20;
      player.y = 352;
      this.state = 'walk';
    } 
    else if (this.state === 'walk') {
      // Walk to castle
      player.facingLeft = false;
      player.state = 'run';
      player.x += 1.8;
      
      const castleX = worldWidth - 250;
      if (player.x >= castleX + 85) {
        this.state = 'done';
        player.state = 'victory';
        player.vx = 0;
        player.vy = 0;
        
        // Transition to Level Complete Screen
        gameState = STATES.LEVEL_COMPLETE;
        sfx.playLevelComplete();
        
        // Save progress
        if (currentLevel === unlockedLevel) {
          unlockedLevel = Math.min(20, currentLevel + 1);
          localStorage.setItem('kgz_bella_progress', unlockedLevel);
        }
      }
    }
  }
  
  draw(ctx, camX) {
    const fx = this.flagpole.x - camX;
    drawAsset(ctx, 'flag', fx - 24, this.flagpole.flagY, 32, 24);
  }
}

// Click and Tap coordinates handler
function handleCanvasClick(x, y) {
  if (gameState === STATES.MENU) {
    // "START GAME" button: x: canvas.width / 2 - 150, y: 310, w: 300, h: 44
    if (x >= canvas.width / 2 - 150 && x <= canvas.width / 2 + 150 && y >= 310 && y <= 354) {
      startGame();
    }
    // "LEVEL SELECT" button: x: canvas.width / 2 - 150, y: 370, w: 300, h: 44
    else if (x >= canvas.width / 2 - 150 && x <= canvas.width / 2 + 150 && y >= 370 && y <= 414) {
      gameState = STATES.LEVEL_SELECT;
    }
  } 
  else if (gameState === STATES.LEVEL_SELECT) {
    const startX = 175;
    const startY = 120;
    const btnW = 70;
    const btnH = 70;
    const gapX = 25;
    const gapY = 25;
    
    for (let l = 1; l <= 20; l++) {
      const r = Math.floor((l - 1) / 5);
      const c = (l - 1) % 5;
      const bx = startX + c * (btnW + gapX);
      const by = startY + r * (btnH + gapY);
      
      if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
        if (l <= unlockedLevel) {
          currentLevel = l;
          player.reset();
          buildLevel(currentLevel);
          gameState = STATES.PLAYING;
        }
        return;
      }
    }
    
    // BACK TO MENU button
    if (x >= 300 && x <= 500 && y >= 440 && y <= 480) {
      gameState = STATES.MENU;
    }
  } 
  else if (gameState === STATES.PLAYING) {
    // Check HUD pause button
    const dx = x - 760;
    const dy = y - 25;
    if (dx * dx + dy * dy <= 225) {
      isPaused = !isPaused;
      pauseSelection = 0;
      return;
    }
    
    if (isPaused) {
      const px = 250;
      const py = 130;
      if (x >= px && x <= px + 300) {
        if (y >= py + 80 && y <= py + 120) {
          isPaused = false;
        }
        else if (y >= py + 125 && y <= py + 165) {
          player.reset();
          buildLevel(currentLevel);
          isPaused = false;
        }
        else if (y >= py + 170 && y <= py + 210) {
          isPaused = false;
          resetToMenu();
        }
      }
    }
  }
  else if (gameState === STATES.GAME_OVER) {
    resetToMenu();
  }
  else if (gameState === STATES.YOU_WIN) {
    resetToMenu();
  }
  else if (gameState === STATES.LEVEL_COMPLETE) {
    advanceLevel();
  }
}

// Draw Level Select Screen
function drawLevelSelect() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ff6b35';
  ctx.font = '800 36px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("🌸 SELECT LEVEL", canvas.width / 2, 70);
  
  const startX = 175;
  const startY = 120;
  const btnW = 70;
  const btnH = 70;
  const gapX = 25;
  const gapY = 25;
  
  for (let l = 1; l <= 20; l++) {
    const r = Math.floor((l - 1) / 5);
    const c = (l - 1) % 5;
    const bx = startX + c * (btnW + gapX);
    const by = startY + r * (btnH + gapY);
    
    const isLUnlocked = l <= unlockedLevel;
    
    ctx.save();
    if (isLUnlocked) {
      ctx.fillStyle = '#162447';
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = '#1f1f2e';
      ctx.strokeStyle = '#444455';
      ctx.lineWidth = 2;
    }
    ctx.beginPath();
    ctx.roundRect(bx, by, btnW, btnH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    if (isLUnlocked) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l, bx + btnW / 2, by + btnH / 2);
      
      if (l < unlockedLevel) {
        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("✓", bx + btnW - 14, by + btnH - 14);
      }
    } else {
      ctx.fillStyle = '#888888';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("🔒", bx + btnW / 2, by + btnH / 2);
    }
  }
  
  ctx.save();
  ctx.fillStyle = '#ff6b35';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(300, 440, 200, 40, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 16px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("🏠 BACK TO MENU", 400, 460);
}

// Draw Pause Overlay Menu
function drawPauseMenu() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const px = 250;
  const py = 130;
  const pw = 300;
  const ph = 240;
  
  ctx.save();
  ctx.fillStyle = '#162447';
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  ctx.fillStyle = '#ff6b35';
  ctx.font = '800 28px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("GAME PAUSED", canvas.width / 2, py + 45);
  
  const options = ["Resume Game", "Restart Level", "Quit to Menu"];
  options.forEach((opt, idx) => {
    const optY = py + 100 + idx * 45;
    
    ctx.save();
    if (pauseSelection === idx) {
      ctx.fillStyle = '#4ECDC4';
      ctx.font = '800 20px "Nunito", sans-serif';
      ctx.fillText(`▶  ${opt}  ◀`, canvas.width / 2, optY);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px "Nunito", sans-serif';
      ctx.fillText(opt, canvas.width / 2, optY);
    }
    ctx.restore();
  });
}

// Draw Flashing Red Enemy Alerts
function drawEnemyAlerts() {
  enemies.forEach(e => {
    if (e.state === 'dead') return;
    
    const isOffRight = e.x > camera.x + canvas.width && e.x < camera.x + canvas.width + 150;
    const isOffLeft = e.x + e.w < camera.x && e.x + e.w > camera.x - 150;
    
    if (isOffRight || isOffLeft) {
      if (Math.floor(Date.now() / 150) % 2 === 0) return;
      
      ctx.save();
      ctx.fillStyle = '#ff3860';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      if (isOffRight) {
        const ax = canvas.width - 25;
        const ay = e.y + e.h / 2;
        ctx.moveTo(ax, ay - 10);
        ctx.lineTo(ax + 12, ay);
        ctx.lineTo(ax, ay + 10);
        ctx.closePath();
      } else {
        const ax = 25;
        const ay = e.y + e.h / 2;
        ctx.moveTo(ax, ay - 10);
        ctx.lineTo(ax - 12, ay);
        ctx.lineTo(ax, ay + 10);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isOffRight) {
        ctx.fillText("⚠️", canvas.width - 45, e.y + e.h / 2);
      } else {
        ctx.fillText("⚠️", 45, e.y + e.h / 2);
      }
      
      ctx.restore();
    }
  });
}

// 5. Game Configuration and States
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const STATES = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  YOU_WIN: 'YOU_WIN',
  GAME_OVER: 'GAME_OVER',
  LEVEL_SELECT: 'LEVEL_SELECT' // Added Level Select State
};

let gameState = STATES.LOADING;
let currentLevel = 1;
let score = 0;
let highScore = parseInt(localStorage.getItem('kgz_highscore_super-mario')) || 0;
document.getElementById('highScoreVal').innerText = highScore;

// Saved level progress selector
let unlockedLevel = parseInt(localStorage.getItem('kgz_bella_progress')) || 1;

// Pause State variables
let isPaused = false;
let pauseSelection = 0;

// Upgraded elements list
let activeFlagpoleSequence = null;
let activeFireballs = [];
let activeHammers = [];
let lastFireTime = 0;
let floatingCoins = [];
let bridgeCollapseTimer = 0;
let mazeSection1Checked = false;
let mazeSection2Checked = false;
let mazeSection3Checked = false;

// Screen Shake variables
let shakeTimer = 0;
let shakeIntensity = 0;

function screenShake(intensity, duration) {
  shakeTimer = duration;
  shakeIntensity = intensity;
}

// HUD Metrics
let levelTimer = 400;
let lastTimeUpdate = 0;

// Gimmicks & Level mechanics variables
let gravityDirection = 1;
let oxygenLevel = 100;
let checkpointActive = false;
let checkpointLevel = null;
let checkpointX = 100;
let checkpointY = 300;
let checkpointIsSmall = true;
let checkpointIsFire = false;
let bossHP = 5;
let bossState = 'walk';
let bossTimer = 0;
let bossVx = -1.5;
let windDirection = 1;
let windTimer = 0;
let lightningTimer = 0;
let lightningX = 0;
let lightningState = 'idle';
let lightCircleRadius = 150;

// Camera
const camera = { x: 0 };
let worldWidth = 6000;

// Dynamic Image Load Setup
function cleanImageBackground(img) {
  return img;
}

function loadAllAssets(onComplete) {
  const keys = Object.keys(assetList);
  let loaded = 0;
  keys.forEach(key => {
    const img = new Image();
    img.onload = () => {
      // Do not clean background image, full-screen background or level backgrounds
      if (key !== 'background' && !key.startsWith('bg_level_') && !key.includes('backgrounds/')) {
        Assets[key] = cleanImageBackground(img);
      } else {
        Assets[key] = img;
      }
      loaded++;
      drawLoadingScreen(loaded, keys.length);
      if (loaded === keys.length) onComplete();
    };
    img.onerror = () => {
      console.warn(`Asset not found: ${assetList[key]} — using fallback`);
      Assets[key] = null; // Use fallback rendering
      loaded++;
      drawLoadingScreen(loaded, keys.length);
      if (loaded === keys.length) onComplete();
    };
    img.src = assetList[key];
  });
}

function drawLoadingScreen(loaded, total) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ff6b35';
  ctx.font = '800 32px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("🌸 Super Girl", canvas.width / 2, canvas.height / 2 - 40);
  
  // Progress bar
  const pct = loaded / total;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2, 300, 20);
  
  ctx.fillStyle = '#4ECDC4';
  ctx.fillRect(canvas.width / 2 - 147, canvas.height / 2 + 3, 294 * pct, 14);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px "Nunito", sans-serif';
  ctx.fillText(`Loading assets... ${loaded}/${total}`, canvas.width / 2, canvas.height / 2 + 50);
}

// Player States definition
const player = {
  x: 100,
  y: 300,
  vx: 0,
  vy: 0,
  width: 28,
  height: 44,
  isSmall: true,
  isFire: false, // Fire Bella flag
  isClimbing: false,
  coinsCollected: 0, // collected coins count
  state: 'idle',
  facingLeft: false,
  grounded: false,
  doubleJumpAvailable: true,
  jumpHoldTimer: 0,
  starTimer: 0,
  invincibleFlash: 0,
  transformTimer: 0,
  speedBoostTimer: 0,
  lives: 3,
  animator: new BellaAnimator(),
  
  reset() {
    this.x = 100;
    this.y = 300;
    this.vx = 0;
    this.vy = 0;
    this.isSmall = true;
    this.isFire = false;
    this.isClimbing = false;
    this.coinsCollected = 0;
    this.state = 'idle';
    this.facingLeft = false;
    this.grounded = false;
    this.doubleJumpAvailable = true;
    this.jumpHoldTimer = 0;
    this.starTimer = 0;
    this.invincibleFlash = 0;
    this.transformTimer = 0;
    this.speedBoostTimer = 0;
    this.width = 28;
    this.height = 44;
  },
  
  updateHitbox() {
    if (this.isSmall) {
      this.width = 28;
      this.height = 44;
    } else {
      this.width = 44;
      this.height = 60;
    }
  }
};

// Object collections
let platforms = [];
let collectibles = []; // moving blocks items like mushrooms, coins, starman
let enemies = [];
let scenery = [];
let particles = [];
let floatingTexts = [];

// Controls Keys Mappings
const keys = {};

// Mobile virtual overlay parameters
let isTouchMode = false;
const touchControls = {
  left: { x: 70, y: 430, r: 35, active: false },
  right: { x: 170, y: 430, r: 35, active: false },
  fire: { x: 490, y: 430, r: 35, active: false },
  fast: { x: 600, y: 430, r: 35, active: false },
  jump: { x: 710, y: 430, r: 40, active: false }
};

// Event registration
window.addEventListener('keydown', e => {
  sfx.init();
  keys[e.code] = true;
  if (e.code === 'AltLeft' || e.code === 'AltRight' || e.code === 'KeyZ') e.preventDefault();
  
  if (gameState === STATES.MENU && e.code === 'Space') {
    startGame();
  }
  if (gameState === STATES.GAME_OVER && e.code === 'Space') {
    resetToMenu();
  }
  if (gameState === STATES.YOU_WIN && e.code === 'Space') {
    resetToMenu();
  }
  if (gameState === STATES.LEVEL_COMPLETE && e.code === 'Space') {
    advanceLevel();
  }
  
  // Jump actions
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    triggerJump();
  }
  
  // Shoot fireball
  if (e.code === 'KeyX' && gameState === STATES.PLAYING && player.isFire && !isPaused) {
    const activeCount = activeFireballs.filter(f => f.active).length;
    const now = Date.now();
    if (activeCount < 2 && now - lastFireTime >= 300) {
      lastFireTime = now;
      const vx = player.facingLeft ? -6 : 6;
      const fx = player.facingLeft ? player.x - 8 : player.x + player.width + 8;
      const fy = player.y + player.height / 3;
      activeFireballs.push(new Fireball(fx, fy, vx));
      sfx.playJump(); // pop sound
    }
  }
  
  // Pause toggling
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (gameState === STATES.PLAYING) {
      isPaused = !isPaused;
      pauseSelection = 0;
    }
  }
  
  // Pause navigation
  if (gameState === STATES.PLAYING && isPaused) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      pauseSelection = (pauseSelection + 1) % 3;
      sfx.playCoin();
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      pauseSelection = (pauseSelection - 1 + 3) % 3;
      sfx.playCoin();
    }
    if (e.code === 'Enter') {
      if (pauseSelection === 0) {
        isPaused = false;
      } else if (pauseSelection === 1) {
        player.reset();
        buildLevel(currentLevel);
        isPaused = false;
      } else if (pauseSelection === 2) {
        isPaused = false;
        resetToMenu();
      }
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Canvas touch handlers
function getCanvasTouchPos(touch) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('touchstart', e => {
  sfx.init();
  isTouchMode = true;
  
  const touch = e.changedTouches[0];
  const pos = getCanvasTouchPos(touch);
  
  // Handle menu / pause UI clicks first
  if (gameState === STATES.MENU || gameState === STATES.LEVEL_SELECT || (gameState === STATES.PLAYING && isPaused) || (gameState === STATES.PLAYING && pos.y < 50 && pos.x > 730)) {
    handleCanvasClick(pos.x, pos.y);
    e.preventDefault();
    return;
  }
  
  if (gameState === STATES.GAME_OVER) {
    resetToMenu();
    e.preventDefault();
    return;
  }
  if (gameState === STATES.YOU_WIN) {
    resetToMenu();
    e.preventDefault();
    return;
  }
  if (gameState === STATES.LEVEL_COMPLETE) {
    advanceLevel();
    e.preventDefault();
    return;
  }
  
  for (let t of e.changedTouches) {
    const posVal = getCanvasTouchPos(t);
    checkTouchInput(posVal, t.identifier);
  }
}, { passive: false });

canvas.addEventListener('click', e => {
  sfx.init();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;
  
  handleCanvasClick(clickX, clickY);
});

canvas.addEventListener('touchmove', e => {
  for (let t of e.changedTouches) {
    const pos = getCanvasTouchPos(t);
    checkTouchInput(pos, t.identifier);
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  for (let t of e.changedTouches) {
    releaseTouchInput(t.identifier);
  }
});

canvas.addEventListener('touchcancel', e => {
  for (let t of e.changedTouches) {
    releaseTouchInput(t.identifier);
  }
});

function checkTouchInput(pos, id) {
  for (let key in touchControls) {
    const btn = touchControls[key];
    const dx = pos.x - btn.x;
    const dy = pos.y - btn.y;
    if (dx * dx + dy * dy < btn.r * btn.r) {
      // Release any other key currently bound to this touch ID
      releaseTouchInput(id);
      
      btn.active = id;
      if (key === 'left') {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
      }
      if (key === 'right') {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
      }
      if (key === 'fast') {
        keys['KeyZ'] = true;
      }
      if (key === 'fire') {
        if (player.isFire && !isPaused) {
          const activeCount = activeFireballs.filter(f => f.active).length;
          const now = Date.now();
          if (activeCount < 2 && now - lastFireTime >= 300) {
            lastFireTime = now;
            const vx = player.facingLeft ? -6 : 6;
            const fx = player.facingLeft ? player.x - 8 : player.x + player.width + 8;
            const fy = player.y + player.height / 3;
            activeFireballs.push(new Fireball(fx, fy, vx));
            sfx.playJump();
          }
        }
        keys['KeyX'] = true;
      }
      if (key === 'jump') {
        if (!keys['Space']) {
          triggerJump();
        }
        keys['Space'] = true;
      }
      return;
    }
  }
}

function releaseTouchInput(id) {
  for (let key in touchControls) {
    const btn = touchControls[key];
    if (btn.active === id) {
      btn.active = false;
      if (key === 'left') keys['ArrowLeft'] = false;
      if (key === 'right') keys['ArrowRight'] = false;
      if (key === 'fast') keys['KeyZ'] = false;
      if (key === 'fire') keys['KeyX'] = false;
      if (key === 'jump') keys['Space'] = false;
    }
  }
}

// 6. Level Design Programmatic 20 Levels Generation
const LEVELS = {};

function loadLevelBackground(levelNumber) {
  const key = `bg_level_${levelNumber}`;
  if (Assets[key]) return Assets[key]; // Already loaded
  
  const img = new Image();
  img.onload = () => {
    Assets[key] = img;
  };
  img.onerror = () => {
    console.warn(`Background failed to load: bg_level_${levelNumber}.jpeg`);
    Assets[key] = null; // Fallback to solid color
  };
  img.src = `assets/backgrounds/bg_level_${levelNumber}.jpeg`; // Load JPEG backgrounds
  return img;
}

function getLevelBgColor(levelNumber) {
  const colors = {
    1: '#5C94FC', 2: '#E07040', 3: '#000000', 4: '#708090',
    5: '#DAA520', 6: '#B0C4DE', 7: '#2D1B69', 8: '#006994',
    9: '#8B0000', 10: '#1a0033', 11: '#FFB6C1', 12: '#87CEEB',
    13: '#556B2F', 14: '#000011', 15: '#0D0D2B', 16: '#CD853F',
    17: '#B0E0E6', 18: '#228B22', 19: '#2F2F2F', 20: '#3D0000'
  };
  return colors[levelNumber] || '#5C94FC';
}

function generateAllLevels() {
  const levelProfiles = {
    1: {
      length: 10000,
      theme: 'grassland',
      gaps: [],
      pipes: [{ x: 2200, h: 2 }, { x: 4800, h: 2 }],
      customPlatforms: [
        { type: 'brick', x: 1200, y: 260 },
        { type: 'mystery', x: 1248, y: 260, item: 'powerup' },
        { type: 'brick', x: 1296, y: 260 },
        
        { type: 'brick', x: 3200, y: 260 },
        { type: 'brick', x: 3248, y: 260 },
        { type: 'mystery', x: 3296, y: 260, item: 'coin' },
        { type: 'brick', x: 3344, y: 260 },
        { type: 'brick', x: 3392, y: 260 },
        
        { type: 'brick', x: 5500, y: 260 },
        { type: 'mystery', x: 5548, y: 260, item: 'powerup' },
        { type: 'brick', x: 5596, y: 260 },
        { type: 'brick', x: 5644, y: 260 },
        
        { type: 'brick', x: 7800, y: 260 },
        { type: 'mystery', x: 7848, y: 260, item: 'coin' },
        { type: 'brick', x: 7896, y: 260 }
      ],
      customEnemies: [
        { type: 'goomba', x: 1500, y: 352 },
        { type: 'goomba', x: 2800, y: 352 },
        { type: 'goomba', x: 3600, y: 352 },
        { type: 'goomba', x: 5000, y: 352 },
        { type: 'goomba', x: 6200, y: 352 },
        { type: 'goomba', x: 7000, y: 352 },
        { type: 'goomba', x: 8200, y: 352 }
      ]
    },
    2: {
      length: 9500,
      theme: 'grassland',
      gaps: [{ x: 2500, w: 90 }, { x: 4800, w: 90 }, { x: 7600, w: 90 }],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 },
        { x: 3300, h: 3 },
        { x: 5800, h: 2 }
      ],
      pyramids: [2000, 5200],
      customPlatforms: [
        { type: 'hard', x: 2600, y: 220, w: 144, h: 24 },
        { type: 'hard', x: 4900, y: 220, w: 144, h: 24 }
      ],
      customEnemies: [
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 1800, y: 352 },
        { type: 'goomba', x: 2300, y: 352 },
        { type: 'goomba', x: 3800, y: 352 },
        { type: 'goomba', x: 4200, y: 352 },
        { type: 'goomba', x: 5600, y: 352 },
        { type: 'goomba', x: 6400, y: 352 },
        { type: 'goomba', x: 8200, y: 352 },
        { type: 'koopa', x: 3500, y: 352 },
        { type: 'koopa', x: 6000, y: 352 },
        { type: 'koopa', x: 8500, y: 352 }
      ]
    },
    3: {
      length: 9000,
      theme: 'cave',
      gaps: [{ x: 2200, w: 100 }, { x: 4500, w: 100 }, { x: 6800, w: 100 }],
      pipes: [
        { x: 1400, h: 3 },
        { x: 3600, h: 4, hasPiranha: true },
        { x: 5900, h: 3, hasPiranha: true }
      ],
      customPlatforms: [
        { type: 'undergroundbrick', x: 1200, y: 240, w: 144, h: 48 },
        { type: 'mystery', x: 1248, y: 240, item: 'gravityFlip' },
        { type: 'undergroundbrick', x: 3000, y: 240, w: 144, h: 48 },
        { type: 'mystery', x: 3048, y: 240, item: 'powerup' },
        { type: 'undergroundbrick', x: 5200, y: 240, w: 144, h: 48 },
        { type: 'mystery', x: 5248, y: 240, item: 'starman' }
      ],
      customEnemies: [
        { type: 'goomba', x: 700, y: 352 },
        { type: 'goomba', x: 1700, y: 352 },
        { type: 'goomba', x: 2800, y: 352 },
        { type: 'goomba', x: 4000, y: 352 },
        { type: 'goomba', x: 5000, y: 352 },
        { type: 'goomba', x: 6300, y: 352 },
        { type: 'goomba', x: 7400, y: 352 },
        { type: 'koopa', x: 2500, y: 352 },
        { type: 'koopa', x: 5400, y: 352 },
        { type: 'koopa', x: 8000, y: 352 }
      ]
    },
    4: {
      length: 9000,
      theme: 'sky',
      gaps: [{ x: 600, w: 7800 }],
      customPlatforms: [
        { type: 'hard', x: 800, y: 280, w: 96, h: 24 },
        { type: 'hard', x: 1100, y: 220, w: 96, h: 24 },
        { type: 'hard', x: 1400, y: 180, w: 96, h: 24 },
        { type: 'hard', x: 1800, y: 240, w: 144, h: 24 },
        { type: 'moving', x: 2200, y: 200, w: 96, h: 24, minX: 2000, maxX: 2500, vx: 1.5 },
        { type: 'moving', x: 2800, y: 220, w: 96, h: 24, minY: 120, maxY: 320, vy: 1.2 },
        { type: 'moving', x: 3400, y: 180, w: 96, h: 24, minX: 3200, maxX: 3700, vx: 1.5 },
        { type: 'moving', x: 4200, y: 240, w: 96, h: 24, minY: 140, maxY: 340, vy: 1.2 },
        { type: 'moving', x: 5000, y: 200, w: 96, h: 24, minX: 4800, maxX: 5300, vx: 1.5 },
        { type: 'moving', x: 5800, y: 220, w: 96, h: 24, minY: 120, maxY: 320, vy: 1.2 },
        { type: 'moving', x: 6600, y: 180, w: 96, h: 24, minX: 6400, maxX: 6900, vx: 1.5 },
        { type: 'moving', x: 7400, y: 240, w: 96, h: 24, minY: 140, maxY: 340, vy: 1.2 },
        { type: 'hard', x: 8000, y: 260, w: 144, h: 24 }
      ],
      customEnemies: [
        { type: 'paratroopa', x: 1200, y: 200, startY: 200 },
        { type: 'paratroopa', x: 2000, y: 160, startY: 160 },
        { type: 'paratroopa', x: 3600, y: 220, startY: 220 },
        { type: 'paratroopa', x: 4800, y: 180, startY: 180 },
        { type: 'paratroopa', x: 6000, y: 200, startY: 200 },
        { type: 'paratroopa', x: 7200, y: 160, startY: 160 },
        { type: 'paratroopa', x: 8100, y: 220, startY: 220 }
      ]
    },
    5: {
      length: 9500,
      theme: 'desert',
      gaps: [{ x: 1600, w: 192 }, { x: 3500, w: 192 }, { x: 5400, w: 192 }, { x: 7800, w: 192 }],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 },
        { x: 2800, h: 3 }
      ],
      pyramids: [2200, 4500, 6200],
      customPlatforms: [
        { type: 'brick', x: 1800, y: 250, w: 144, h: 48 },
        { type: 'mystery', x: 1848, y: 250, item: 'powerup' },
        { type: 'brick', x: 4000, y: 250, w: 144, h: 48 },
        { type: 'mystery', x: 4048, y: 250, item: 'coin' },
        { type: 'brick', x: 5800, y: 250, w: 144, h: 48 },
        { type: 'mystery', x: 5848, y: 250, item: 'mushroom1up' }
      ],
      customEnemies: [
        { type: 'spiny', x: 900, y: 352 },
        { type: 'spiny', x: 2100, y: 352 },
        { type: 'spiny', x: 3000, y: 352 },
        { type: 'spiny', x: 4100, y: 352 },
        { type: 'spiny', x: 5200, y: 352 },
        { type: 'spiny', x: 6000, y: 352 },
        { type: 'spiny', x: 7600, y: 352 },
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 2600, y: 352 },
        { type: 'goomba', x: 4800, y: 352 },
        { type: 'goomba', x: 6600, y: 352 }
      ]
    },
    6: {
      length: 9000,
      theme: 'ice',
      gaps: [{ x: 2200, w: 120 }, { x: 4600, w: 120 }, { x: 6800, w: 120 }],
      customPlatforms: [
        { type: 'icicle', x: 1200, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 2000, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 2800, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 3800, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 5000, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 6200, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 7400, y: 100, w: 24, h: 48 }
      ],
      customEnemies: [
        { type: 'goomba', x: 900, y: 352 },
        { type: 'goomba', x: 1800, y: 352 },
        { type: 'goomba', x: 3200, y: 352 },
        { type: 'goomba', x: 4200, y: 352 },
        { type: 'goomba', x: 5800, y: 352 },
        { type: 'goomba', x: 7200, y: 352 },
        { type: 'goomba', x: 8200, y: 352 },
        { type: 'spiny', x: 1500, y: 352 },
        { type: 'spiny', x: 3500, y: 352 },
        { type: 'spiny', x: 5400, y: 352 },
        { type: 'spiny', x: 6400, y: 352 },
        { type: 'snowball', x: 1300, y: 376, vx: -2 },
        { type: 'snowball', x: 3100, y: 376, vx: -2 },
        { type: 'snowball', x: 4900, y: 376, vx: -2 },
        { type: 'snowball', x: 6700, y: 376, vx: -2 }
      ]
    },
    7: {
      length: 8500,
      theme: 'haunted',
      gaps: [{ x: 1800, w: 150 }, { x: 3600, w: 150 }, { x: 5400, w: 150 }, { x: 7200, w: 150 }],
      customPlatforms: [
        { type: 'disappearing', x: 1820, y: 280, w: 96, h: 24 },
        { type: 'disappearing', x: 3620, y: 240, w: 96, h: 24 },
        { type: 'disappearing', x: 5420, y: 280, w: 96, h: 24 },
        { type: 'disappearing', x: 7220, y: 240, w: 96, h: 24 },
        { type: 'hard', x: 1200, y: 220, w: 144, h: 24 },
        { type: 'mystery', x: 1248, y: 220, item: 'powerup' },
        { type: 'hard', x: 3000, y: 220, w: 144, h: 24 },
        { type: 'mystery', x: 3048, y: 220, item: 'starman' },
        { type: 'hard', x: 4800, y: 220, w: 144, h: 24 },
        { type: 'mystery', x: 4848, y: 220, item: 'coin' },
        { type: 'hard', x: 6600, y: 220, w: 144, h: 24 },
        { type: 'mystery', x: 6648, y: 220, item: 'mushroom1up' }
      ],
      customEnemies: [
        { type: 'boo', x: 1400, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 2800, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 4200, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 5600, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 7000, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true }
      ]
    },
    8: {
      length: 8000,
      theme: 'water',
      gaps: [],
      customPlatforms: [
        { type: 'bubble_stream', x: 1200, y: 150, w: 48, h: 250 },
        { type: 'bubble_stream', x: 2600, y: 150, w: 48, h: 250 },
        { type: 'bubble_stream', x: 4000, y: 150, w: 48, h: 250 },
        { type: 'bubble_stream', x: 5400, y: 150, w: 48, h: 250 },
        { type: 'bubble_stream', x: 6800, y: 150, w: 48, h: 250 },
        { type: 'bubble_stream', x: 7800, y: 150, w: 48, h: 250 }
      ],
      customEnemies: [
        { type: 'blooper', x: 1000, y: 200, w: 32, h: 32 },
        { type: 'blooper', x: 2200, y: 200, w: 32, h: 32 },
        { type: 'blooper', x: 3400, y: 200, w: 32, h: 32 },
        { type: 'blooper', x: 4600, y: 200, w: 32, h: 32 },
        { type: 'blooper', x: 5800, y: 200, w: 32, h: 32 },
        { type: 'blooper', x: 7000, y: 200, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 800, y: 150, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 1500, y: 250, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 2800, y: 180, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 4200, y: 220, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 5200, y: 150, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 6400, y: 280, w: 32, h: 32 },
        { type: 'cheep_cheep', x: 7500, y: 200, w: 32, h: 32 }
      ]
    },
    9: {
      length: 9000,
      theme: 'grassland',
      gaps: [{ x: 2000, w: 120 }, { x: 4500, w: 120 }, { x: 7000, w: 120 }],
      pipes: [
        { x: 900, h: 2 },
        { x: 1500, h: 3, hasPiranha: true },
        { x: 2400, h: 4, hasPiranha: true },
        { x: 3100, h: 2 },
        { x: 3800, h: 5, hasPiranha: true },
        { x: 4900, h: 3, hasPiranha: true },
        { x: 5600, h: 4 },
        { x: 6400, h: 3, hasPiranha: true },
        { x: 7800, h: 2 }
      ],
      customEnemies: [
        { type: 'goomba', x: 700, y: 352 },
        { type: 'goomba', x: 1200, y: 352 },
        { type: 'goomba', x: 1800, y: 352 },
        { type: 'goomba', x: 2800, y: 352 },
        { type: 'goomba', x: 3400, y: 352 },
        { type: 'goomba', x: 4300, y: 352 },
        { type: 'goomba', x: 5300, y: 352 },
        { type: 'goomba', x: 6000, y: 352 },
        { type: 'goomba', x: 7300, y: 352 },
        { type: 'koopa', x: 1100, y: 352 },
        { type: 'koopa', x: 3000, y: 352 },
        { type: 'koopa', x: 5800, y: 352 },
        { type: 'koopa', x: 8000, y: 352 }
      ]
    },
    10: {
      length: 9000,
      theme: 'cave',
      gaps: [{ x: 2500, w: 160 }, { x: 5200, w: 160 }, { x: 7500, w: 160 }],
      customPlatforms: [
        { type: 'hard', x: 1400, y: 304, w: 144, h: 96 },
        { type: 'hard', x: 3200, y: 256, w: 192, h: 144 },
        { type: 'hard', x: 4400, y: 304, w: 144, h: 96 },
        { type: 'hard', x: 6200, y: 256, w: 192, h: 144 },
        { type: 'mystery', x: 3248, y: 150, item: 'powerup' },
        { type: 'mystery', x: 6248, y: 150, item: 'starman' }
      ],
      customEnemies: [
        { type: 'goomba', x: 900, y: 352 },
        { type: 'goomba', x: 1450, y: 272 },
        { type: 'goomba', x: 2000, y: 352 },
        { type: 'goomba', x: 3250, y: 224 },
        { type: 'goomba', x: 4000, y: 352 },
        { type: 'goomba', x: 4450, y: 272 },
        { type: 'goomba', x: 5000, y: 352 },
        { type: 'goomba', x: 6250, y: 224 },
        { type: 'red_koopa', x: 1500, y: 272 },
        { type: 'red_koopa', x: 3300, y: 224 },
        { type: 'red_koopa', x: 4500, y: 272 },
        { type: 'red_koopa', x: 6300, y: 224 }
      ]
    },
    11: {
      length: 9000,
      theme: 'sky',
      gaps: [{ x: 1800, w: 160 }, { x: 3500, w: 160 }, { x: 5200, w: 160 }, { x: 7400, w: 160 }],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 }
      ],
      customPlatforms: [
        { type: 'vine', x: 1500, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 2400, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 3100, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 4200, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 4800, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 6000, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 6600, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 7800, y: 80, w: 32, h: 320 }
      ],
      customEnemies: [
        { type: 'paratroopa', x: 1450, y: 200, startY: 200 },
        { type: 'paratroopa', x: 2350, y: 160, startY: 160 },
        { type: 'paratroopa', x: 3050, y: 220, startY: 220 },
        { type: 'paratroopa', x: 4150, y: 180, startY: 180 },
        { type: 'paratroopa', x: 4750, y: 200, startY: 200 },
        { type: 'paratroopa', x: 5950, y: 160, startY: 160 },
        { type: 'paratroopa', x: 6550, y: 220, startY: 220 },
        { type: 'paratroopa', x: 7750, y: 180, startY: 180 },
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 2700, y: 352 },
        { type: 'goomba', x: 4500, y: 352 },
        { type: 'goomba', x: 6300, y: 352 },
        { type: 'lakitu', x: 3500, y: 80 }
      ]
    },
    12: {
      length: 9000,
      theme: 'sky',
      gaps: [{ x: 600, w: 7800 }],
      customPlatforms: [
        { type: 'moving', x: 1200, y: 240, w: 96, h: 24, minX: 1000, maxX: 1500, vx: 1.5 },
        { type: 'moving', x: 2400, y: 200, w: 96, h: 24, minY: 100, maxY: 300, vy: 1.2 },
        { type: 'moving', x: 3600, y: 240, w: 96, h: 24, minX: 3400, maxX: 3900, vx: 1.5 },
        { type: 'moving', x: 4800, y: 200, w: 96, h: 24, minY: 100, maxY: 300, vy: 1.2 },
        { type: 'moving', x: 6000, y: 240, w: 96, h: 24, minX: 5800, maxX: 6300, vx: 1.5 },
        { type: 'moving', x: 7200, y: 200, w: 96, h: 24, minY: 100, maxY: 300, vy: 1.2 },
        { type: 'moving', x: 8000, y: 240, w: 96, h: 24, minX: 7800, maxX: 8300, vx: 1.5 }
      ],
      customEnemies: [
        { type: 'lakitu', x: 1500, y: 80 },
        { type: 'lakitu', x: 4500, y: 80 },
        { type: 'lakitu', x: 7500, y: 80 },
        { type: 'paratroopa', x: 1800, y: 160, startY: 160 },
        { type: 'paratroopa', x: 3000, y: 220, startY: 220 },
        { type: 'paratroopa', x: 4200, y: 180, startY: 180 },
        { type: 'paratroopa', x: 5400, y: 200, startY: 200 },
        { type: 'paratroopa', x: 6600, y: 160, startY: 160 }
      ]
    },
    13: {
      length: 7500,
      theme: 'grassland',
      gaps: [
        { x: 1200, w: 180 },
        { x: 2400, w: 180 },
        { x: 3600, w: 180 },
        { x: 4800, w: 180 },
        { x: 6000, w: 180 },
        { x: 7200, w: 180 }
      ],
      customPlatforms: [
        { type: 'speed_pad', x: 1100, y: 352, w: 48, h: 48 },
        { type: 'speed_pad', x: 2300, y: 352, w: 48, h: 48 },
        { type: 'speed_pad', x: 3500, y: 352, w: 48, h: 48 },
        { type: 'speed_pad', x: 4700, y: 352, w: 48, h: 48 },
        { type: 'speed_pad', x: 5900, y: 352, w: 48, h: 48 },
        { type: 'speed_pad', x: 7100, y: 352, w: 48, h: 48 }
      ],
      customEnemies: [
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 2000, y: 352 },
        { type: 'goomba', x: 3200, y: 352 },
        { type: 'goomba', x: 4400, y: 352 },
        { type: 'goomba', x: 5600, y: 352 },
        { type: 'goomba', x: 6800, y: 352 }
      ]
    },
    14: {
      length: 9000,
      theme: 'storm',
      gaps: [{ x: 2000, w: 140 }, { x: 4200, w: 140 }, { x: 6400, w: 140 }, { x: 8000, w: 140 }],
      customEnemies: [
        { type: 'lakitu', x: 3000, y: 80 },
        { type: 'lakitu', x: 6000, y: 80 },
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 1500, y: 352 },
        { type: 'goomba', x: 2500, y: 352 },
        { type: 'goomba', x: 3700, y: 352 },
        { type: 'goomba', x: 4900, y: 352 },
        { type: 'goomba', x: 5800, y: 352 },
        { type: 'goomba', x: 7000, y: 352 },
        { type: 'paratroopa', x: 1200, y: 200, startY: 200 },
        { type: 'paratroopa', x: 3400, y: 160, startY: 160 },
        { type: 'paratroopa', x: 5200, y: 220, startY: 220 },
        { type: 'paratroopa', x: 7600, y: 180, startY: 180 }
      ]
    },
    15: {
      length: 9000,
      theme: 'castle',
      gaps: [
        { x: 1600, w: 160, isLava: true },
        { x: 3200, w: 160, isLava: true },
        { x: 4800, w: 160, isLava: true },
        { x: 6400, w: 160, isLava: true },
        { x: 7800, w: 160, isLava: true }
      ],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 }
      ],
      customEnemies: [
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 1400, y: 352 },
        { type: 'goomba', x: 2200, y: 352 },
        { type: 'goomba', x: 3000, y: 352 },
        { type: 'goomba', x: 3800, y: 352 },
        { type: 'goomba', x: 4600, y: 352 },
        { type: 'goomba', x: 5400, y: 352 },
        { type: 'goomba', x: 6200, y: 352 },
        { type: 'goomba', x: 700, y: 352 },
        { type: 'red_koopa', x: 1200, y: 352 },
        { type: 'red_koopa', x: 2800, y: 352 },
        { type: 'red_koopa', x: 4400, y: 352 },
        { type: 'red_koopa', x: 6000, y: 352 }
      ]
    },
    16: {
      length: 9500,
      theme: 'cave',
      gaps: [{ x: 2200, w: 120 }, { x: 4600, w: 120 }, { x: 7000, w: 120 }],
      customPlatforms: [
        { type: 'hard', x: 1400, y: 160, w: 48, h: 240 },
        { type: 'hard', x: 2800, y: 160, w: 48, h: 240 },
        { type: 'hard', x: 3800, y: 160, w: 48, h: 240 },
        { type: 'hard', x: 5400, y: 160, w: 48, h: 240 },
        { type: 'hard', x: 6200, y: 160, w: 48, h: 240 },
        { type: 'hard', x: 7800, y: 160, w: 48, h: 240 }
      ],
      customEnemies: [
        { type: 'goomba', x: 900, y: 352 },
        { type: 'goomba', x: 1800, y: 352 },
        { type: 'goomba', x: 3200, y: 352 },
        { type: 'goomba', x: 4200, y: 352 },
        { type: 'goomba', x: 5800, y: 352 },
        { type: 'goomba', x: 7000, y: 352 },
        { type: 'koopa', x: 1200, y: 352 },
        { type: 'koopa', x: 3500, y: 352 },
        { type: 'koopa', x: 6000, y: 352 }
      ]
    },
    17: {
      length: 9000,
      theme: 'ice',
      gaps: [{ x: 2400, w: 140 }, { x: 4800, w: 140 }, { x: 7200, w: 140 }],
      customPlatforms: [
        { type: 'icicle', x: 1500, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 2800, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 4000, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 5500, y: 100, w: 24, h: 48 },
        { type: 'icicle', x: 6500, y: 100, w: 24, h: 48 }
      ],
      customEnemies: [
        { type: 'spiny', x: 1000, y: 352 },
        { type: 'spiny', x: 2200, y: 352 },
        { type: 'spiny', x: 3400, y: 352 },
        { type: 'spiny', x: 4600, y: 352 },
        { type: 'spiny', x: 5800, y: 352 },
        { type: 'spiny', x: 7000, y: 352 },
        { type: 'snowball', x: 1800, y: 376, vx: -2 },
        { type: 'snowball', x: 4200, y: 376, vx: -2 },
        { type: 'snowball', x: 6200, y: 376, vx: -2 },
        { type: 'paratroopa', x: 1300, y: 180, startY: 180 },
        { type: 'paratroopa', x: 3800, y: 220, startY: 220 },
        { type: 'paratroopa', x: 6000, y: 160, startY: 160 }
      ]
    },
    18: {
      length: 9000,
      theme: 'jungle',
      gaps: [{ x: 1800, w: 120 }, { x: 3600, w: 120 }, { x: 5400, w: 120 }, { x: 7200, w: 120 }],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 }
      ],
      customPlatforms: [
        { type: 'vine', x: 1500, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 2800, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 4800, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 5800, y: 80, w: 32, h: 320 },
        { type: 'vine', x: 7800, y: 80, w: 32, h: 320 }
      ],
      customEnemies: [
        { type: 'log', x: 1516, y: 70, vx: -2.0 },
        { type: 'log', x: 2816, y: 70, vx: -2.0 },
        { type: 'log', x: 4816, y: 70, vx: -2.0 },
        { type: 'log', x: 5816, y: 70, vx: -2.0 },
        { type: 'log', x: 7816, y: 70, vx: -2.0 },
        { type: 'goomba', x: 800, y: 352 },
        { type: 'goomba', x: 2300, y: 352 },
        { type: 'goomba', x: 4100, y: 352 },
        { type: 'goomba', x: 6200, y: 352 }
      ]
    },
    19: {
      length: 9500,
      theme: 'storm',
      gaps: [
        { x: 1500, w: 150 },
        { x: 3000, w: 150 },
        { x: 4500, w: 150 },
        { x: 6000, w: 150 },
        { x: 7500, w: 150 },
        { x: 8500, w: 150 }
      ],
      customPlatforms: [
        { type: 'moving', x: 1450, y: 220, w: 96, h: 24, minX: 1300, maxX: 1700, vx: 1.5 },
        { type: 'moving', x: 2950, y: 200, w: 96, h: 24, minY: 100, maxY: 300, vy: 1.2 },
        { type: 'moving', x: 4450, y: 220, w: 96, h: 24, minX: 4300, maxX: 4700, vx: 1.5 },
        { type: 'moving', x: 5950, y: 200, w: 96, h: 24, minY: 100, maxY: 300, vy: 1.2 },
        { type: 'moving', x: 7450, y: 220, w: 96, h: 24, minX: 7300, maxX: 7700, vx: 1.5 }
      ],
      customEnemies: [
        { type: 'lakitu', x: 2000, y: 80 },
        { type: 'lakitu', x: 5000, y: 80 },
        { type: 'lakitu', x: 8000, y: 80 },
        { type: 'paratroopa', x: 1200, y: 160, startY: 160 },
        { type: 'paratroopa', x: 2600, y: 220, startY: 220 },
        { type: 'paratroopa', x: 3800, y: 180, startY: 180 },
        { type: 'paratroopa', x: 5200, y: 200, startY: 200 },
        { type: 'paratroopa', x: 6800, y: 160, startY: 160 }
      ]
    },
    20: {
      length: 10000,
      theme: 'castle',
      gaps: [
        { x: 1800, w: 150, isLava: true },
        { x: 3600, w: 150, isLava: true },
        { x: 5400, w: 150, isLava: true },
        { x: 7200, w: 150, isLava: true }
      ],
      hasSecretRoom: true,
      pipes: [
        { x: 1000, h: 2, teleportX: 7050, teleportY: 250 }
      ],
      customPlatforms: [
        { type: 'disappearing', x: 1820, y: 260, w: 96, h: 24 },
        { type: 'disappearing', x: 3620, y: 260, w: 96, h: 24 },
        { type: 'disappearing', x: 5420, y: 260, w: 96, h: 24 },
        { type: 'disappearing', x: 7220, y: 260, w: 96, h: 24 }
      ],
      customEnemies: [
        { type: 'boo', x: 1400, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 2800, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 4600, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'boo', x: 6200, y: 180, w: 32, h: 32, state: 'walk', vx: 0, vy: 0, facingLeft: true },
        { type: 'bowser', x: 9200, y: 336, w: 64, h: 64, state: 'walk' }
      ]
    }
  };

  for (let l = 1; l <= 20; l++) {
    const profile = levelProfiles[l];
    if (!profile) continue;

    const length = profile.length;
    const ground = [];
    const platforms = [];
    const pipes = [];
    const enemies = [];
    const coins = [];
    let flagpole = { x: length - 250, y: 120 };

    // Checkpoint in the middle
    platforms.push({ type: 'checkpoint', x: Math.floor(length / 2), y: 280, w: 32, h: 120 });

    // Help / Arrow signs at start and near end
    platforms.push({ type: 'arrow_sign', x: 300, y: 352 });
    platforms.push({ type: 'arrow_sign', x: length - 450, y: 352 });

    // --- BUILD SECRET WARP PIPES AND UNDERGROUND ROOM ---
    if (profile.hasSecretRoom) {
      // 2. Secret Room boundaries (completely walled off from x = 6980 to x = 7420)
      platforms.push({ type: 'hard', x: 6980, y: 120, w: 20, h: 280 });
      platforms.push({ type: 'hard', x: 7420, y: 120, w: 20, h: 280 });
      platforms.push({ type: 'hard', x: 6980, y: 400, w: 460, h: 100 });
      platforms.push({ type: 'hard', x: 6980, y: 120, w: 460, h: 20 });
      
      // 3. Entry landing pipe inside secret room
      pipes.push({ x: 7050, y: 304, height: 2 });
      
      // 4. Exit pipe inside secret room
      pipes.push({ x: 7350, y: 304, height: 2, teleportX: 1300, teleportY: 300 });
      
      // 5. Secret Room coins and powerups
      for (let cx = 7120; cx < 7320; cx += 40) {
        coins.push({ x: cx, y: 220, w: 24, h: 24 });
      }
      platforms.push({ type: 'mystery', x: 7200, y: 240, item: 'mushroom1up' });
      platforms.push({ type: 'mystery', x: 7248, y: 240, item: 'coin' });
      
      // 6. Main path bridge over the secret room
      platforms.push({ type: 'hard', x: 6950, y: 120, w: 500, h: 24 });
    }

    // --- BUILD GROUND AND GAPS ---
    let currentX = 0;
    const gaps = profile.gaps || [];
    while (currentX < length) {
      if (profile.hasSecretRoom && currentX >= 6980 && currentX <= 7420) {
        currentX += 460;
        continue;
      }
      
      let gap = gaps.find(g => currentX >= g.x && currentX < g.x + g.w);
      if (gap) {
        if (gap.isLava || profile.theme === 'castle') {
          platforms.push({ type: 'lava', x: gap.x, y: 400, w: gap.w, h: 100 });
        } else if (profile.theme === 'desert') {
          platforms.push({ type: 'quicksand', x: gap.x, y: 400, w: gap.w, h: 100 });
        }
        currentX = gap.x + gap.w;
        continue;
      }
      
      let nextGap = gaps.find(g => g.x > currentX);
      let limitX = nextGap ? nextGap.x : length;
      if (profile.hasSecretRoom && limitX > 6980 && currentX < 6980) {
        limitX = 6980;
      }
      
      let chunkW = Math.min(400, limitX - currentX);
      if (chunkW <= 0) {
        currentX = limitX;
        continue;
      }
      
      ground.push({ x: currentX, y: 400, width: chunkW });
      currentX += chunkW;
    }

    // --- PIPES ---
    if (profile.pipes) {
      profile.pipes.forEach(pipe => {
        pipes.push({
          x: pipe.x,
          y: 304,
          height: pipe.h,
          teleportX: pipe.teleportX,
          teleportY: pipe.teleportY
        });
        if (pipe.hasPiranha) {
          enemies.push({
            type: 'piranha',
            x: pipe.x + 32,
            y: 304,
            w: 32,
            h: 44,
            startY: 304,
            state: 'hidden',
            timer: 0
          });
        }
      });
    }

    // --- PYRAMIDS ---
    if (profile.pyramids) {
      profile.pyramids.forEach(px => {
        buildPyramid(platforms, enemies, px, 352);
      });
    }

    // --- CUSTOM PLATFORMS ---
    if (profile.customPlatforms) {
      profile.customPlatforms.forEach(p => {
        platforms.push({
          type: p.type,
          x: p.x,
          y: p.y,
          w: p.w || 48,
          h: p.h || 48,
          item: p.item || null,
          minX: p.minX,
          maxX: p.maxX,
          vx: p.vx,
          minY: p.minY,
          maxY: p.maxY,
          vy: p.vy
        });
      });
    }

    // --- CUSTOM ENEMIES ---
    if (profile.customEnemies) {
      profile.customEnemies.forEach(e => {
        enemies.push({
          type: e.type,
          x: e.x,
          y: e.y || 352,
          w: e.w,
          h: e.h,
          vx: e.vx || -1.2,
          vy: e.vy || 0,
          state: e.state || 'walk',
          startY: e.startY || e.y || 352
        });
      });
    }

    // --- DECORATIVE FLOATING COINS & BRICKS ---
    if (profile.theme !== 'sky' && profile.theme !== 'water' && profile.theme !== 'castle') {
      const blockItems = ['powerup', 'coin', 'starman', 'mushroom1up', 'coin', 'powerup', 'coin'];
      let itemIdx = 0;
      
      const needsBrickDistribution = !profile.customPlatforms || profile.customPlatforms.length < 5;
      if (needsBrickDistribution) {
        for (let bx = 1200; bx < length - 1200; bx += 800) {
          if (profile.hasSecretRoom && bx >= 6900 && bx <= 7500) continue;
          
          let inGap = gaps.some(g => bx >= g.x && bx + 144 <= g.x + g.w);
          if (!inGap) {
            const item = blockItems[itemIdx % blockItems.length];
            itemIdx++;
            
            const bType = (profile.theme === 'cave') ? 'undergroundbrick' : 'brick';
            platforms.push({ type: bType, x: bx, y: 260 });
            platforms.push({ type: 'mystery', x: bx + 48, y: 260, item: item });
            platforms.push({ type: bType, x: bx + 96, y: 260 });
            
            coins.push({ x: bx + 12, y: 190 });
            coins.push({ x: bx + 60, y: 190 });
            coins.push({ x: bx + 108, y: 190 });
          }
        }
      }
    }

    // Add extra scenery icicles/snowballs/winds on ice levels if not explicitly defined
    if (profile.theme === 'ice') {
      const needsIcicles = !profile.customPlatforms || !profile.customPlatforms.some(p => p.type === 'icicle');
      if (needsIcicles) {
        for (let ix = 900; ix < length - 800; ix += 900) {
          platforms.push({ type: 'icicle', x: ix, y: 100, w: 24, h: 48 });
        }
      }
      const needsSnowballs = !profile.customEnemies || !profile.customEnemies.some(e => e.type === 'snowball');
      if (needsSnowballs) {
        for (let sx = 1300; sx < length - 1000; sx += 1800) {
          enemies.push({ type: 'snowball', x: sx, y: 376, vx: -2 });
        }
      }
    }

    // Cave brick ceiling
    if (profile.theme === 'cave') {
      for (let cx = 100; cx < length - 100; cx += 48) {
        // Leave some gaps for ceiling walking access
        if ((cx >= 1200 && cx <= 1350) || (cx >= 3500 && cx <= 3650) || (cx >= 5800 && cx <= 5950)) {
          continue;
        }
        platforms.push({ type: 'undergroundbrick', x: cx, y: 80 });
      }
    }

    // Boss levels (7, 15, 20) setups (Lava bridge, Bowser, Axe, Firebars)
    if (l === 7 || l === 15 || l === 20) {
      const bowserX = length - 800;
      
      // 1. Ensure Bowser is in enemies list
      const hasBowser = enemies.some(e => e.type === 'bowser');
      if (!hasBowser) {
        enemies.push({
          type: 'bowser',
          x: bowserX,
          y: 336,
          w: 64,
          h: 64,
          vx: -1.5,
          vy: 0,
          state: 'walk',
          startY: 336
        });
      }
      
      // 2. Add lava gap under bridge (filtering out ground segments in this region)
      const gapX = bowserX - 100;
      const gapW = 400;
      
      for (let i = ground.length - 1; i >= 0; i--) {
        const g = ground[i];
        if (g.x >= gapX && g.x + g.width <= gapX + gapW) {
          ground.splice(i, 1);
        }
      }
      
      // Add lava platform
      platforms.push({ type: 'lava', x: gapX, y: 400, w: gapW, h: 100 });
      
      // 3. Add bridge blocks and Axe
      for (let bx = gapX; bx < gapX + gapW - 48; bx += 48) {
        platforms.push({ type: 'lava_bridge', x: bx, y: 400, w: 48, h: 48 });
      }
      platforms.push({ type: 'axe', x: gapX + gapW - 48, y: 352, w: 48, h: 48 });
      
      // 4. Add rotating firebars
      platforms.push({ type: 'firebar', x: Math.floor(length * 0.35), y: 220, w: 48, h: 48, angle: 0 });
      platforms.push({ type: 'firebar', x: Math.floor(length * 0.65), y: 220, w: 48, h: 48, angle: Math.PI / 2 });
    }

    // Add Hammer Bros to Levels 9, 13, 17
    if (l === 9 || l === 13 || l === 17) {
      const locations = [
        Math.floor(length * 0.25),
        Math.floor(length * 0.5),
        Math.floor(length * 0.75)
      ];
      
      locations.forEach(hx => {
        const inGap = (profile.gaps || []).some(g => hx >= g.x && hx <= g.x + g.w);
        if (!inGap) {
          enemies.push({
            type: 'hammer_bro',
            x: hx,
            y: 352,
            w: 32,
            h: 44,
            vx: -0.8,
            vy: 0,
            state: 'walk',
            startY: 352
          });
          
          // Spawn overhead patrol platform of bricks
          platforms.push({ type: 'brick', x: hx - 48, y: 240, w: 48, h: 48 });
          platforms.push({ type: 'brick', x: hx, y: 240, w: 48, h: 48 });
          platforms.push({ type: 'brick', x: hx + 48, y: 240, w: 48, h: 48 });
        }
      });
    }

    // Add Level 20 Castle Maze loop dividers & stepping blocks
    if (l === 20) {
      // Lane dividers
      for (let mx = 4200; mx < 6800; mx += 48) {
        if ((mx >= 4900 && mx <= 5000) || (mx >= 5700 && mx <= 5800)) {
          continue; // choice gaps
        }
        platforms.push({ type: 'hard', x: mx, y: 180, w: 48, h: 24 });
        platforms.push({ type: 'hard', x: mx, y: 300, w: 48, h: 24 });
      }
      // Stepping brick platforms at choice areas
      const stepX = [4100, 4950, 5750];
      stepX.forEach(sx => {
        platforms.push({ type: 'brick', x: sx, y: 280, w: 48, h: 24 });
        platforms.push({ type: 'brick', x: sx, y: 200, w: 48, h: 24 });
      });
    }

    LEVELS[l] = {
      background: `bg_level_${l}`,
      bgColor: getLevelBgColor(l),
      ground: ground,
      platforms: platforms,
      enemies: enemies,
      coins: coins,
      pipes: pipes,
      flagpole: flagpole,
      levelEnd: length
    };
  }
}

// Helper to build staircases and position Koopas / Goombas for shell chain reactions
function buildPyramid(platforms, enemies, startX, baseY) {
  // Height 4 pyramid
  // Column 1: height 1
  platforms.push({ type: 'hard', x: startX, y: baseY, w: 48, h: 48 });
  // Column 2: height 2
  platforms.push({ type: 'hard', x: startX + 48, y: baseY, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 48, y: baseY - 48, w: 48, h: 48 });
  // Column 3: height 3
  platforms.push({ type: 'hard', x: startX + 96, y: baseY, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 96, y: baseY - 48, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 96, y: baseY - 96, w: 48, h: 48 });
  // Column 4: height 4 (top)
  platforms.push({ type: 'hard', x: startX + 144, y: baseY, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 144, y: baseY - 48, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 144, y: baseY - 96, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 144, y: baseY - 144, w: 48, h: 48 });
  
  // Column 5: height 3
  platforms.push({ type: 'hard', x: startX + 192, y: baseY, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 192, y: baseY - 48, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 192, y: baseY - 96, w: 48, h: 48 });
  // Column 6: height 2
  platforms.push({ type: 'hard', x: startX + 240, y: baseY, w: 48, h: 48 });
  platforms.push({ type: 'hard', x: startX + 240, y: baseY - 48, w: 48, h: 48 });
  // Column 7: height 1
  platforms.push({ type: 'hard', x: startX + 288, y: baseY, w: 48, h: 48 });
  
  // Place Koopa on the top column
  enemies.push({ type: 'koopa', x: startX + 144 + 8, y: baseY - 144 - 44, w: 32, h: 44 });
  
  // Place sequence of Goombas to the right on the ground for chain reaction
  for (let i = 0; i < 4; i++) {
    enemies.push({ type: 'goomba', x: startX + 400 + i * 120, y: baseY, w: 32, h: 32 });
  }
}

function buildLevel(levelNum) {
  platforms = [];
  collectibles = [];
  enemies = [];
  scenery = [];
  particles = [];
  floatingTexts = [];
  floatingCoins = [];
  activeFireballs = [];
  activeHammers = [];
  bridgeCollapseTimer = 0;
  activeFlagpoleSequence = null;
  
  // Reset maze section checks
  mazeSection1Checked = false;
  mazeSection2Checked = false;
  mazeSection3Checked = false;
  
  if (checkpointLevel !== levelNum) {
    checkpointActive = false;
  }
  
  if (checkpointActive && checkpointLevel === levelNum) {
    player.x = checkpointX;
    player.y = checkpointY;
    player.isSmall = checkpointIsSmall;
    player.isFire = checkpointIsFire;
    player.updateHitbox();
    camera.x = Math.max(0, Math.min(LEVELS[levelNum].levelEnd - canvas.width, player.x - canvas.width * 0.25));
  }
  
  const data = LEVELS[levelNum];
  if (!data) return;
  
  levelTimer = levelNum === 13 ? 150 : 400; // Speed run timer
  lastTimeUpdate = Date.now();
  
  // Set flagpole sliding initial height
  LEVELS[levelNum].flagpole.flagY = 120;
  
  // Start dynamic background loading
  loadLevelBackground(levelNum);
  
  // Parse Ground segments
  data.ground.forEach(g => {
    platforms.push({
      type: 'ground',
      x: g.x,
      y: g.y,
      w: g.width,
      h: canvas.height - g.y,
      hit: false,
      bumpY: 0,
      bumpTimer: 0
    });
  });
  
  // Parse platforms (brick, mystery, moving, etc.)
  data.platforms.forEach(p => {
    let w = p.w || 48;
    let h = p.h || 48;
    
    platforms.push({
      type: p.type,
      x: p.x,
      y: p.y,
      w: w,
      h: h,
      item: p.item || null,
      hit: false,
      bumpY: 0,
      bumpTimer: 0,
      minX: p.minX || 0,
      maxX: p.maxX || 0,
      vx: p.vx || 0,
      minY: p.minY,
      maxY: p.maxY,
      vy: p.vy || 0,
      growing: p.growing || false,
      maxH: p.maxH || 240,
      // disappearing & icicles
      standTimer: 0,
      state: p.state || 'solid',
      respawnTimer: 0,
      startY: p.y
    });
  });
  
  // Parse pipes
  data.pipes.forEach(pipe => {
    platforms.push({
      type: 'pipe',
      x: pipe.x,
      y: pipe.y,
      w: 96,
      h: pipe.height * 48,
      hit: false,
      bumpY: 0,
      bumpTimer: 0,
      teleportX: pipe.teleportX,
      teleportY: pipe.teleportY
    });
  });
  
  // Parse enemies
  data.enemies.forEach(e => {
    let w = e.w || 32;
    let h = e.h || (e.type === 'goomba' ? 32 : 44);
    if (e.type === 'boo') {
      w = e.w || 32;
      h = e.h || 32;
    } else if (e.type === 'bowser') {
      w = e.w || 64;
      h = e.h || 64;
    } else if (e.type === 'boss_fireball') {
      w = e.w || 16;
      h = e.h || 16;
    } else if (e.type === 'log') {
      w = e.w || 48;
      h = e.h || 24;
    } else if (e.type === 'snowball') {
      w = e.w || 24;
      h = e.h || 24;
    } else if (e.type === 'bullet_bill') {
      w = e.w || 32;
      h = e.h || 24;
    } else if (e.type === 'lakitu') {
      w = e.w || 32;
      h = e.h || 48;
    } else if (e.type === 'blooper' || e.type === 'cheep_cheep' || e.type === 'spiny') {
      w = e.w || 32;
      h = e.h || 32;
    } else if (e.type === 'paratroopa' || e.type === 'red_koopa') {
      w = e.w || 32;
      h = e.h || 44;
    }
    
    enemies.push({
      type: e.type,
      x: e.x,
      y: e.y,
      w: w,
      h: h,
      vx: e.vx || -1.2,
      vy: e.vy || 0,
      state: e.state || 'walk',
      deathTimer: 0,
      facingLeft: true,
      walkFrame: 0,
      frameTimer: 0,
      timer: 0,
      startY: e.y
    });
  });
  
  // Parse floating coins
  data.coins.forEach(c => {
    floatingCoins.push({
      x: c.x,
      y: c.y,
      w: c.w || 24,
      h: c.h || 24,
      collected: false
    });
  });
  
  worldWidth = data.levelEnd;
}

// 7. Render loops, composite and drawing
function draw() {
  ctx.save();
  // Apply Screen Shake if active
  if (shakeTimer > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeTimer--;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  
  if (gameState === STATES.LOADING) {
    ctx.restore();
    return; // Loading screen handled separately
  }
  
  if (gameState === STATES.LEVEL_SELECT) {
    drawLevelSelect();
    ctx.restore();
    return;
  }
  
  if (gameState === STATES.MENU) {
    drawMenu();
    ctx.restore();
    return;
  }
  
  if (gameState === STATES.PLAYING || gameState === STATES.LEVEL_COMPLETE) {
    drawBackground();
    
    // Flipped gravity coordinate context
    ctx.save();
    if (gravityDirection === -1) {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    
    drawScenery();
    drawPlatforms();
    drawCollectibles();
    
    // Draw floating coins
    floatingCoins.forEach(c => {
      if (!c.collected) {
        drawAsset(ctx, 'coin', c.x - camera.x, c.y, c.w, c.h);
      }
    });
    
    // Draw active fireballs
    activeFireballs.forEach(f => {
      if (f.active) {
        f.draw(ctx);
      }
    });
    
    // Draw active hammers
    activeHammers.forEach(h => {
      if (h.active) {
        h.draw(ctx);
      }
    });
    
    drawEnemies();
    drawParticles();
    drawFloatingTexts();
    drawFlagpole();
    
    // Draw darkness overlay
    if (currentLevel === 3 || currentLevel === 7 || currentLevel === 20) {
      drawDarkness(ctx, player.x, player.y, camera.x);
    }
    
    drawBella(ctx, player);
    drawEnemyAlerts();
    
    ctx.restore(); // Restore gravity flip transform
    
    // Draw wind lines scrolling and indicator
    if (currentLevel === 19) {
      drawWindLines(ctx);
    }
    
    // Draw HUD
    drawHUD();
    
    // Virtual touch control pads
    drawMobileControls();
    
    // Draw Pause Overlay if paused
    if (isPaused) {
      drawPauseMenu();
    }
  }
  else if (gameState === STATES.YOU_WIN) {
    drawYouWin();
  }
  else if (gameState === STATES.GAME_OVER) {
    drawGameOver();
  }
  ctx.restore();
}

function drawBackground() {
  const bgKey = `bg_level_${currentLevel}`;
  const bg = Assets[bgKey];
  
  if (bg) {
    // Parallax scrolling: draw background moving at 30% of camera speed
    // Background is 800px wide, loop seamlessly
    const bgX = -(camera.x * 0.3) % 800;
    ctx.drawImage(bg, bgX, 0, 800, 400);
    ctx.drawImage(bg, bgX + 800, 0, 800, 400);
    
    // Fill the bottom 100px with a solid dark blue-ish color under the ground block area
    ctx.fillStyle = '#0d0d2b';
    ctx.fillRect(0, 400, canvas.width, 100);
  } else {
    ctx.fillStyle = getLevelBgColor(currentLevel);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawScenery() {
  scenery.forEach(s => {
    if (s.x + s.w < camera.x || s.x > camera.x + canvas.width) return;
    drawAsset(ctx, s.type, s.x - camera.x, s.y, s.w, s.h);
  });
}

function drawPlatforms() {
  platforms.forEach(p => {
    if (p.x + p.w < camera.x || p.x > camera.x + canvas.width) return;
    
    const displayY = p.y + p.bumpY;
    
    if (p.type === 'ground') {
      const blocksCount = Math.ceil(p.w / 48);
      for (let i = 0; i < blocksCount; i++) {
        drawAsset(ctx, 'groundblock', p.x + i * 48 - camera.x, displayY, 48, 48);
      }
    } else if (p.type === 'undergroundground') {
      const blocksCount = Math.ceil(p.w / 48);
      for (let i = 0; i < blocksCount; i++) {
        drawAsset(ctx, 'undergroundblock', p.x + i * 48 - camera.x, displayY, 48, 48);
      }
    } else if (p.type === 'pipe') {
      // Pipe top connection
      drawAsset(ctx, 'pipetop', p.x - camera.x, displayY, 96, 32);
      // Pipe body segment
      const bodyBlocks = Math.ceil((p.h - 32) / 48);
      for (let i = 0; i < bodyBlocks; i++) {
        drawAsset(ctx, 'pipebottom', p.x - camera.x, displayY + 32 + i * 48, 96, Math.min(48, p.h - 32 - i * 48));
      }
    } else if (p.type === 'mystery') {
      const key = p.hit ? 'emptyblock' : 'mysteryblock';
      drawAsset(ctx, key, p.x - camera.x, displayY, 48, 48);
    } else if (p.type === 'brick') {
      drawAsset(ctx, 'brick', p.x - camera.x, displayY, 48, 48);
    } else if (p.type === 'undergroundbrick') {
      drawAsset(ctx, 'undergroundbrick', p.x - camera.x, displayY, 48, 48);
    } else if (p.type === 'hard') {
      const blocksX = Math.ceil(p.w / 48);
      const blocksY = Math.ceil(p.h / 48);
      for (let bx = 0; bx < blocksX; bx++) {
        for (let by = 0; by < blocksY; by++) {
          drawAsset(ctx, 'hardblock', p.x + bx * 48 - camera.x, displayY + by * 48, 48, 48);
        }
      }
    } else if (p.type === 'moving') {
      ctx.save();
      // Draw horizontal pulley rope track segments
      const trackY = p.y + p.h / 2 - 8;
      for (let rx = p.minX; rx < p.maxX; rx += 16) {
        drawAsset(ctx, 'pulley_rope', rx - camera.x, trackY, 16, 16);
      }
      // Draw platform segments
      const blocksX = Math.ceil(p.w / 48);
      for (let bx = 0; bx < blocksX; bx++) {
        drawAsset(ctx, 'moving_platform_top', p.x + bx * 48 - camera.x, displayY, 48, p.h);
      }
      ctx.restore();
    } else if (p.type === 'quicksand') {
      ctx.save();
      ctx.fillStyle = '#d2b48c';
      ctx.strokeStyle = '#cd853f';
      ctx.lineWidth = 2;
      const wave = Math.sin(Date.now() * 0.008) * 3;
      ctx.beginPath();
      ctx.roundRect(p.x - camera.x, displayY + wave, p.w, p.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'lava') {
      ctx.save();
      ctx.fillStyle = '#ff2a00';
      ctx.strokeStyle = '#ff7b00';
      ctx.lineWidth = 2;
      const wave = Math.sin(Date.now() * 0.008) * 3;
      ctx.beginPath();
      ctx.roundRect(p.x - camera.x, displayY + wave, p.w, p.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'disappearing') {
      if (p.state === 'gone') return;
      ctx.save();
      if (p.state === 'blinking') {
        ctx.globalAlpha = Math.floor(Date.now() / 100) % 2 === 0 ? 0.2 : 0.8;
      }
      ctx.fillStyle = '#9b5de5';
      ctx.strokeStyle = '#f15bb5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(p.x - camera.x, displayY, p.w, p.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'checkpoint') {
      const cx = p.x - camera.x;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 14, displayY, 4, p.h);
      ctx.fillStyle = p.hit ? '#4ECDC4' : '#ff3860';
      ctx.beginPath();
      ctx.moveTo(cx + 18, displayY);
      ctx.lineTo(cx + 34, displayY + 10);
      ctx.lineTo(cx + 18, displayY + 20);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'speed_pad') {
      ctx.save();
      ctx.fillStyle = '#ffea00';
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x - camera.x, displayY, p.w, p.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - camera.x + 10, displayY + 24);
      ctx.lineTo(p.x - camera.x + 24, displayY + 24);
      ctx.lineTo(p.x - camera.x + 18, displayY + 18);
      ctx.moveTo(p.x - camera.x + 24, displayY + 24);
      ctx.lineTo(p.x - camera.x + 18, displayY + 30);
      ctx.moveTo(p.x - camera.x + 24, displayY + 24);
      ctx.lineTo(p.x - camera.x + 38, displayY + 24);
      ctx.lineTo(p.x - camera.x + 32, displayY + 18);
      ctx.moveTo(p.x - camera.x + 38, displayY + 24);
      ctx.lineTo(p.x - camera.x + 32, displayY + 30);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'vine') {
      ctx.save();
      const vineW = p.w || 32;
      // Draw Vine Top
      drawAsset(ctx, 'vine_top', p.x - camera.x, displayY, vineW, Math.min(32, p.h));
      // Draw body segments connected / straight
      for (let vy = 32; vy < p.h; vy += 32) {
        const key = (Math.floor(vy / 32) % 2 === 0) ? 'vine_body_connected' : 'vine_body_straight';
        drawAsset(ctx, key, p.x - camera.x, displayY + vy, vineW, 32);
      }
      ctx.restore();
    } else if (p.type === 'arrow_sign') {
      ctx.save();
      ctx.fillStyle = '#ffb423';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(p.x - camera.x + 10, displayY + 10, 28, 28);
      ctx.strokeRect(p.x - camera.x + 10, displayY + 10, 28, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("➡️", p.x - camera.x + 24, displayY + 24);
      ctx.restore();
    } else if (p.type === 'springboard') {
      const sx = p.x - camera.x;
      const sh = p.h - (p.bumpY || 0); // compressed height
      const sy = displayY + (p.bumpY || 0);
      ctx.save();
      ctx.fillStyle = '#8b8b8b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(sx, sy, p.w, 8); // top plate
      ctx.strokeRect(sx, sy, p.w, 8);
      ctx.fillRect(sx, p.y + p.h - 8, p.w, 8); // bottom plate
      ctx.strokeRect(sx, p.y + p.h - 8, p.w, 8);
      
      // Draw springs zigzag
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + 8);
      ctx.lineTo(sx + p.w - 10, sy + (sh - 16) / 2 + 8);
      ctx.lineTo(sx + 10, sy + sh - 8);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'firebar') {
      // Draw center block
      drawAsset(ctx, 'hardblock', p.x - camera.x, displayY, p.w, p.h);
      
      // Update rotation angle
      if (p.angle === undefined) p.angle = 0;
      if (!isPaused) p.angle += 0.025; // rotation speed
      
      // Draw 6 balls along the rotating stick
      const ballsCount = 6;
      const spacing = 16; // space between balls
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      
      for (let i = 1; i <= ballsCount; i++) {
        const dist = i * spacing;
        const bx = cx + Math.cos(p.angle) * dist;
        const by = cy + Math.sin(p.angle) * dist;
        
        ctx.save();
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(bx - camera.x, by, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(bx - camera.x, by, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Check collision with player
        const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
        const bRect = { x: bx - 8, y: by - 8, w: 16, h: 16 };
        if (checkCollision(pRect, bRect) && player.state !== 'death' && gameState === STATES.PLAYING) {
          playerHurt(false);
        }
      }
    } else if (p.type === 'axe') {
      const ax = p.x - camera.x;
      ctx.save();
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(ax + 20, displayY, 8, 48); // shaft
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      ctx.arc(ax + 24, displayY + 12, 14, 0, Math.PI * 2); // blade base
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ax + 16, displayY + 12, 8, 0, Math.PI * 2); // blade highlight
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'lava_bridge') {
      ctx.save();
      ctx.fillStyle = '#d2b48c'; // Wood bridge color
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.fillRect(p.x - camera.x, displayY, p.w, p.h);
      ctx.strokeRect(p.x - camera.x, displayY, p.w, p.h);
      
      // draw decorative chain link circle in middle
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(p.x - camera.x + p.w / 2, displayY + p.h / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'icicle') {
      if (p.state === 'gone') return;
      const ix = p.x - camera.x;
      ctx.save();
      ctx.fillStyle = '#b0e0e6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix, displayY);
      ctx.lineTo(ix + p.w, displayY);
      ctx.lineTo(ix + p.w / 2, displayY + p.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    
    if (DEBUG_RECT) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - camera.x, p.y, p.w, p.h);
    }
  });
}

function drawCollectibles() {
  collectibles.forEach(c => {
    if (c.collected) return;
    drawAsset(ctx, c.type, c.x - camera.x, c.y, c.w, c.h);
    
    if (DEBUG_RECT) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.strokeRect(c.x - camera.x, c.y, c.w, c.h);
    }
  });
}

function drawEnemies() {
  enemies.forEach(e => {
    if (e.state === 'dead' && e.deathTimer <= 0) return;
    
    if (e.state === 'dead') {
      if (e.type === 'goomba') {
        drawAsset(ctx, 'goomba_flat', e.x - camera.x, e.y, e.w, e.h);
      }
      return;
    }
    
    // Draw Boo ghost shape
    if (e.type === 'boo') {
      ctx.save();
      const bx = e.x - camera.x;
      const by = e.y;
      
      ctx.translate(bx + e.w / 2, by + e.h / 2);
      if (!e.facingLeft) {
        ctx.scale(-1, 1);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      if (e.state === 'hiding') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8, 2, 4, 0, Math.PI * 2);
        ctx.arc(-2, 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-6, -2);
        ctx.moveTo(-4, -4);
        ctx.lineTo(0, -2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-6, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-8, 4, 5, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-9, 7);
        ctx.lineTo(-8, 4);
        ctx.moveTo(-8, 4);
        ctx.lineTo(-7, 7);
        ctx.lineTo(-6, 4);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    
    // Draw Bowser Boss
    if (e.type === 'bowser') {
      const bx = e.x - camera.x;
      const by = e.y;
      
      ctx.save();
      if (bossState === 'hurt' && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.filter = 'brightness(1.5) sepia(1) hue-rotate(-50deg)';
      }
      
      const frame = Math.floor(Date.now() / 200) % 2;
      const key = frame === 0 ? 'bowser_walk1' : 'bowser_walk2';
      
      if (e.facingLeft) {
        ctx.translate(bx + e.w, by);
        ctx.scale(-1, 1);
        drawAsset(ctx, key, 0, 0, e.w, e.h);
      } else {
        drawAsset(ctx, key, bx, by, e.w, e.h);
      }
      ctx.restore();
      return;
    }
    
    // Draw Boss Fireball
    if (e.type === 'boss_fireball') {
      const fx = e.x - camera.x;
      const fy = e.y;
      ctx.save();
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.arc(fx + 8, fy + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFE66D';
      ctx.beginPath();
      ctx.arc(fx + 8, fy + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    
    // Draw Rolling Log
    if (e.type === 'log') {
      const lx = e.x - camera.x;
      const ly = e.y;
      ctx.save();
      ctx.fillStyle = '#8b4513';
      ctx.strokeStyle = '#5c4033';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(lx, ly, e.w, e.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(lx + e.w / 3, ly); ctx.lineTo(lx + e.w / 3, ly + e.h);
      ctx.moveTo(lx + 2 * e.w / 3, ly); ctx.lineTo(lx + 2 * e.w / 3, ly + e.h);
      ctx.stroke();
      ctx.restore();
      return;
    }
    
    // Draw Snowball
    if (e.type === 'snowball') {
      const sx = e.x - camera.x;
      const sy = e.y;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b0e0e6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }
    
    // Draw Hammer Bro
    if (e.type === 'hammer_bro') {
      const hx = e.x - camera.x;
      const hy = e.y;
      ctx.save();
      
      // Face direction
      ctx.translate(hx + e.w / 2, hy + e.h / 2);
      if (!e.facingLeft) {
        ctx.scale(-1, 1);
      }
      
      // Vector Hammer Bro (Green helmet, green shell, blue body)
      ctx.fillStyle = '#1f4068'; // Blue body
      ctx.beginPath();
      ctx.roundRect(-10, -6, 20, 22, 4);
      ctx.fill();
      
      // Helmet
      ctx.fillStyle = '#228B22'; // Green
      ctx.beginPath();
      ctx.arc(0, -10, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // Visor highlight
      ctx.fillRect(-8, -10, 16, 2);
      
      // Face / Snout
      ctx.fillStyle = '#ffe0bd'; // Skin tone
      ctx.beginPath();
      ctx.ellipse(-4, -4, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(-6, -7, 2, 4);
      
      // Shell on back
      ctx.fillStyle = '#228B22'; // Green shell
      ctx.beginPath();
      ctx.ellipse(8, 2, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Feet
      ctx.fillStyle = '#ffea00'; // Yellow shoes
      ctx.fillRect(-12, 16, 8, 6);
      ctx.fillRect(4, 16, 8, 6);
      
      // Arms
      ctx.fillStyle = '#1f4068';
      ctx.fillRect(-14, 0, 8, 6); // reaching forward
      
      // Visual Hammer Bro animation tick
      const frame = Math.floor(Date.now() / 250) % 2;
      if (frame === 0) {
        // Draw small hammer in hand
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-16, -10, 6, 12);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-18, -2, 10, 3);
      }
      
      ctx.restore();
      return;
    }
    
    let key = '';
    let isFlipped = e.vx > 0;
    if (e.type === 'goomba') {
      e.frameTimer++;
      if (e.frameTimer >= 10) {
        e.frameTimer = 0;
        e.walkFrame = e.walkFrame === 0 ? 1 : 0;
      }
      key = e.walkFrame === 0 ? 'goomba_walk1' : 'goomba_walk2';
    } else if (e.type === 'koopa') {
      if (e.state === 'shell' || e.state === 'sliding') {
        key = 'koopa_shell';
      } else {
        e.frameTimer++;
        if (e.frameTimer >= 10) {
          e.frameTimer = 0;
          e.walkFrame = e.walkFrame === 0 ? 1 : 0;
        }
        key = e.walkFrame === 0 ? 'koopa_walk1' : 'koopa_walk2';
      }
    } else if (e.type === 'bullet_bill') {
      key = 'bullet_bill';
      isFlipped = e.vx > 0;
    } else if (e.type === 'lakitu') {
      key = 'lakitu';
      isFlipped = player.x > e.x;
    } else if (e.type === 'piranha') {
      const frame = Math.floor(Date.now() / 120) % 2;
      key = frame === 0 ? 'piranha_closed' : 'piranha_open';
      isFlipped = false;
    } else if (e.type === 'blooper') {
      key = e.vy < 0 ? 'blooper_swim2' : 'blooper_swim1';
      isFlipped = player.x > e.x;
    } else if (e.type === 'cheep_cheep') {
      const frame = Math.floor(Date.now() / 150) % 2;
      key = frame === 0 ? 'cheep_swim1' : 'cheep_swim2';
      isFlipped = e.vx > 0;
    } else if (e.type === 'spiny') {
      const frame = Math.floor(Date.now() / 120) % 2;
      key = frame === 0 ? 'spiny_walk1' : 'spiny_walk2';
      isFlipped = e.vx > 0;
    } else if (e.type === 'paratroopa') {
      const frame = Math.floor(Date.now() / 120) % 2;
      key = frame === 0 ? 'red_paratroopa_fly1' : 'red_paratroopa_fly2';
      isFlipped = e.vx > 0;
    } else if (e.type === 'red_koopa') {
      if (e.state === 'shell' || e.state === 'sliding') {
        key = 'koopa_shell';
      } else {
        key = 'red_koopa';
      }
      isFlipped = e.vx > 0;
    }
    
    ctx.save();
    if (isFlipped) {
      ctx.translate(e.x + e.w - camera.x, e.y);
      ctx.scale(-1, 1);
      drawAsset(ctx, key, 0, 0, e.w, e.h);
    } else {
      drawAsset(ctx, key, e.x - camera.x, e.y, e.w, e.h);
    }
    ctx.restore();
    
    if (DEBUG_RECT) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.strokeRect(e.x - camera.x, e.y, e.w, e.h);
    }
  });
}

function drawFlagpole() {
  const flagData = LEVELS[currentLevel]?.flagpole;
  // Draw castle on ground
  const castleX = worldWidth - 250;
  
  if (flagData) {
    const fx = flagData.x - camera.x;
    // Draw flagpole (pole.png or solid fallback)
    drawAsset(ctx, 'flagpole', fx - 8, 120, 16, 280);
    
    // Draw flag sliding or static
    if (activeFlagpoleSequence) {
      activeFlagpoleSequence.draw(ctx, camera.x);
    } else {
      drawAsset(ctx, 'flag', fx - 24, flagData.y, 32, 24);
    }
  }
  
  drawAsset(ctx, 'castle', castleX - camera.x, 208, 192, 192);
}

function drawBella(ctx, b) {
  if (b.state === 'death') {
    drawAsset(ctx, 'bella_small_death', b.x - camera.x, b.y, 32, 48);
    return;
  }
  
  const key = b.animator.getCurrentImageKey(b.state, b.isSmall);
  const w = b.isSmall ? 32 : 48;
  const h = b.isSmall ? 48 : 64;
  
  // Render offset to center hitboxes visually
  const dx = b.x - camera.x - 2;
  const dy = b.y - 4;
  
  ctx.save();
  
  // Rainbow flashing Star Mode
  if (b.starTimer > 0) {
    // Add sparkles sparks
    if (Math.random() < 0.15) {
      addParticles(b.x + Math.random() * b.width, b.y + Math.random() * b.height, ['#ff6b35', '#FFE66D', '#4ECDC4'][Math.floor(Math.random() * 3)], 2);
    }
    
    // Cycle rainbow colors
    const hue = (Date.now() / 3) % 360;
    ctx.filter = `hue-rotate(${hue}deg) saturate(2)`;
  }
  
  // Flashing invincible opacity
  if (b.invincibleFlash > 0 && Math.floor(b.invincibleFlash / 4) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  }
  
  // Scale transformation bump
  if (b.transformTimer > 0) {
    const progress = (30 - b.transformTimer) / 30;
    ctx.translate(dx + w / 2, dy + h / 2);
    ctx.scale(1, 1 + Math.sin(progress * Math.PI) * 0.3);
    ctx.translate(-(dx + w / 2), -(dy + h / 2));
  }
  
  if (b.facingLeft) {
    ctx.translate(dx + w, dy);
    ctx.scale(-1, 1);
    drawAsset(ctx, key, 0, 0, w, h);
  } else {
    drawAsset(ctx, key, dx, dy, w, h);
  }
  ctx.restore();
  
  if (DEBUG_RECT) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - camera.x, b.y, b.width, b.height);
  }
}

function drawHUD() {
  ctx.fillStyle = 'rgba(26, 36, 71, 0.9)';
  ctx.fillRect(0, 0, canvas.width, 50);
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.lineTo(canvas.width, 50);
  ctx.stroke();
  
  // Lives Heart tracker
  ctx.fillStyle = '#ff3860';
  ctx.font = '800 18px "Nunito", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("❤️ x " + player.lives, 20, 32);
  
  // Star/Big/Fire badges status
  if (player.starTimer > 0) {
    ctx.fillStyle = '#FFE66D';
    ctx.fillText("⭐ INVINCIBLE!", 120, 32);
    
    // Star Timer Bar
    ctx.fillStyle = 'rgba(255, 230, 109, 0.3)';
    ctx.fillRect(260, 22, 100, 10);
    ctx.fillStyle = '#FFE66D';
    ctx.fillRect(260, 22, 100 * (player.starTimer / 480), 10);
  } else if (player.isFire) {
    ctx.fillStyle = '#FF6B35';
    ctx.fillText("🔥 FIRE SUPER GIRL (X to shoot)", 120, 32);
  } else if (!player.isSmall) {
    ctx.fillStyle = '#4ECDC4';
    ctx.fillText("BIG SUPER GIRL", 120, 32);
  }
  
  // Score & Coin Count
  ctx.fillStyle = '#FFE66D';
  ctx.textAlign = 'center';
  ctx.fillText("🪙 SCORE: " + score, canvas.width / 2 - 70, 32);
  ctx.fillText("🪙 x " + (player.coinsCollected || 0), canvas.width / 2 + 70, 32);
  
  // Timer countdown
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText("⏱️ TIME: " + Math.ceil(levelTimer), canvas.width - 70, 32);
  
  // Oxygen meter for underwater level
  if (currentLevel === 8) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px "Nunito", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Air:", 500, 32);
    
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.fillRect(540, 20, 100, 14);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(540, 20, Math.max(0, oxygenLevel), 14);
  }
  
  // Bowser Boss HP meter
  if (currentLevel === 20) {
    const bowser = enemies.find(e => e.type === 'bowser');
    if (bowser && bowser.state !== 'dead') {
      ctx.fillStyle = '#ff3860';
      ctx.font = '800 16px "Nunito", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("Boss:", 500, 32);
      
      ctx.fillStyle = 'rgba(255, 56, 96, 0.3)';
      ctx.fillRect(550, 20, 100, 14);
      ctx.fillStyle = '#ff3860';
      ctx.fillRect(550, 20, Math.max(0, bossHP * 20), 14);
    }
  }
  
  // Draw HUD Pause Button (clickable)
  ctx.save();
  ctx.fillStyle = '#1f4068';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(760, 25, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("P", 760, 25);
  ctx.restore();
}

function drawMenu() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (Assets['background']) {
    ctx.drawImage(Assets['background'], 0, 50, 800, 450);
  }
  ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ff6b35';
  ctx.font = '800 54px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("🌸 Super Girl", canvas.width / 2, 140);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px "Nunito", sans-serif';
  ctx.fillText("Survive, stomp Goombas, and find the Flag!", canvas.width / 2, 200);
  
  // Bella idle preview
  const key = player.isSmall ? 'bella_small_idle' : 'bella_big_idle';
  drawAsset(ctx, key, canvas.width / 2 - 16, 235, 32, 48);
  
  // 1. START GAME button
  ctx.save();
  ctx.fillStyle = '#4ECDC4';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 150, 310, 300, 44, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  ctx.fillStyle = '#1a1a2e';
  ctx.font = '800 18px "Nunito", sans-serif';
  ctx.fillText("▶ START GAME", canvas.width / 2, 338);
  
  // 2. LEVEL SELECT button
  ctx.save();
  ctx.fillStyle = '#162447';
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 150, 370, 300, 44, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 18px "Nunito", sans-serif';
  ctx.fillText("⭐ LEVEL SELECT", canvas.width / 2, 398);
}

function drawLevelComplete() {
  ctx.fillStyle = 'rgba(26, 26, 46, 0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ffb423';
  ctx.font = '800 36px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("⭐ Level Complete!", canvas.width / 2, 130);
  
  // Score tally calculation
  const timeBonus = Math.max(0, Math.ceil(levelTimer)) * 10;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Nunito", sans-serif';
  ctx.fillText(`Timer left: ${Math.ceil(levelTimer)}s (Bonus: +${timeBonus} pts)`, canvas.width / 2, 210);
  
  ctx.fillStyle = '#ff6b35';
  ctx.font = '800 26px "Fredoka", sans-serif';
  ctx.fillText(`Current Score: ${score}`, canvas.width / 2, 290);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px "Nunito", sans-serif';
  ctx.fillText("Press SPACE / Tap Screen for Next Level ▶", canvas.width / 2, 370);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#e43f5a';
  ctx.font = '800 48px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("💔 Game Over", canvas.width / 2, 160);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Nunito", sans-serif';
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 230);
  ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 270);
  
  ctx.fillStyle = '#ffb423';
  ctx.font = '18px "Nunito", sans-serif';
  ctx.fillText("Press SPACE / Tap Screen to Restart", canvas.width / 2, 350);
}

function drawYouWin() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ffb423';
  ctx.font = '800 48px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("🎉 Super Girl Wins!", canvas.width / 2, 130);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px "Nunito", sans-serif';
  ctx.fillText("Congratulations! You completed all levels!", canvas.width / 2, 200);
  ctx.fillText(`Total Score: ${score}`, canvas.width / 2, 250);
  ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 290);
  
  // Confetti particles
  drawConfetti();
  
  ctx.fillStyle = '#4ECDC4';
  ctx.font = '700 18px "Nunito", sans-serif';
  ctx.fillText("Press SPACE / Tap Screen to Play Again 🔄", canvas.width / 2, 380);
}

let confetti = [];
function drawConfetti() {
  if (confetti.length === 0) {
    for (let i = 0; i < 70; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 8 + 4,
        color: ['#ff6b35', '#4ECDC4', '#FFE66D', '#A855F7', '#ff3860'][Math.floor(Math.random() * 5)],
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 + 2
      });
    }
  }
  
  confetti.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    c.x += c.vx;
    c.y += c.vy;
    if (c.y > canvas.height) {
      c.y = 0;
      c.x = Math.random() * canvas.width;
    }
  });
}

function drawMobileControls() {
  if (!isTouchMode) return;
  
  ctx.save();
  ctx.globalAlpha = 0.5;
  
  // Draw Left pad
  ctx.fillStyle = '#162447';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(touchControls.left.x, touchControls.left.y, touchControls.left.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("⬅️", touchControls.left.x, touchControls.left.y);
  
  // Draw Right pad
  ctx.beginPath();
  ctx.arc(touchControls.right.x, touchControls.right.y, touchControls.right.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText("➡️", touchControls.right.x, touchControls.right.y);
  
  // Draw Fast pad
  ctx.fillStyle = touchControls.fast.active ? '#ff6b35' : '#162447';
  ctx.beginPath();
  ctx.arc(touchControls.fast.x, touchControls.fast.y, touchControls.fast.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Nunito", sans-serif';
  ctx.fillText("⚡ RUN", touchControls.fast.x, touchControls.fast.y);
  
  // Draw Fire pad
  if (player.isFire) {
    ctx.fillStyle = touchControls.fire.active ? '#ff2a00' : '#ff6b35';
  } else {
    ctx.fillStyle = '#444455';
  }
  ctx.beginPath();
  ctx.arc(touchControls.fire.x, touchControls.fire.y, touchControls.fire.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Nunito", sans-serif';
  ctx.fillText("🔥 FIRE", touchControls.fire.x, touchControls.fire.y);
  
  // Draw Jump pad (🅱️ style)
  ctx.fillStyle = '#ff6b35';
  ctx.beginPath();
  ctx.arc(touchControls.jump.x, touchControls.jump.y, touchControls.jump.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Nunito", sans-serif';
  ctx.fillText("🅱️", touchControls.jump.x, touchControls.jump.y);
  
  ctx.restore();
}

// 8. Player variable jump triggering
function triggerJump() {
  if (gameState !== STATES.PLAYING) return;
  if (player.state === 'death') return;
  
  const isZPressed = keys['KeyZ'];
  const jumpBoost = isZPressed ? -2.2 : 0; // jump height boost when holding Z key
  
  if (player.grounded) {
    player.vy = (player.isSmall ? -10.5 : -9.5) + jumpBoost; // Base jump velocity + boost
    player.grounded = false;
    player.doubleJumpAvailable = true;
    player.jumpHoldTimer = 22; // 22 frames of variable jump thrust
    sfx.playJump();
  } else if (player.doubleJumpAvailable) {
    player.vy = (player.isSmall ? -8.5 : -7.5) + jumpBoost; // Double jump velocity + boost
    player.doubleJumpAvailable = false;
    player.jumpHoldTimer = 0; // No variable jump hold force on double jump
    sfx.playJump();
    
    // Cloud puff double jump effect
    addParticles(player.x + (player.isSmall ? 16 : 24), player.y + (player.isSmall ? 44 : 60), '#ffffff', 8);
  }
}

// 9. Physics engine loops and collision handling
function updatePhysics() {
  // 1. Vine climbing mechanics
  let onVine = false;
  const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
  platforms.forEach(p => {
    if (p.type === 'vine') {
      const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (checkCollision(pRect, platRect)) {
        onVine = true;
      }
    }
  });
  
  if (!onVine) {
    player.isClimbing = false;
  }
  
  if (onVine && (keys['ArrowUp'] || keys['KeyW'] || keys['ArrowDown'] || keys['KeyS'])) {
    player.isClimbing = true;
  }
  
  if (player.isClimbing) {
    player.vy = 0;
    player.vx = 0;
    player.doubleJumpAvailable = true;
    player.state = 'climb';
    
    if (keys['ArrowUp'] || keys['KeyW']) {
      player.vy = -2.5;
    } else if (keys['ArrowDown'] || keys['KeyS']) {
      player.vy = 2.5;
    }
    
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.vx = -1.0;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      player.vx = 1.0;
    }
    
    if (keys['Space']) {
      player.isClimbing = false;
      player.vy = -8.0 * gravityDirection;
      if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -3.0;
      if (keys['ArrowRight'] || keys['KeyD']) player.vx = 3.0;
      sfx.playJump();
    }
    
    player.x += player.vx;
    resolveCollisions('x');
    player.y += player.vy;
    resolveCollisions('y');
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth) player.x = worldWidth - player.width;
    return;
  }

  // 2. Swim & Gravity Mechanics
  if (currentLevel === 8) {
    player.vy += 0.1;
    if (player.vy > 3) player.vy = 3;
    if (player.vy < -3) player.vy = -3;
    
    if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
      player.vy = -2.0;
      player.doubleJumpAvailable = true;
    }
  } else {
    player.vy += 0.45 * gravityDirection;
    
    if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
      if (player.jumpHoldTimer > 0) {
        player.vy += (player.isSmall ? -0.22 : -0.20) * gravityDirection;
        player.jumpHoldTimer--;
      }
    } else {
      player.jumpHoldTimer = 0;
    }
    
    if (gravityDirection === 1) {
      if (player.vy > 12) player.vy = 12;
    } else {
      if (player.vy < -12) player.vy = -12;
    }
  }
  
  // 3. Ice Mechanics & Horizontal Motion
  const BASE_WALK_SPEED = 3.0;
  let speedMult = (keys['KeyZ']) ? 2 : 1;
  if (player.speedBoostTimer > 0) {
    speedMult *= 1.8;
    player.speedBoostTimer--;
    if (Math.random() < 0.2) {
      addParticles(player.x + player.width / 2, player.y + player.height, '#ffea00', 2);
    }
  }
  
  const maxHorizontalSpeed = BASE_WALK_SPEED * speedMult;
  let accel = player.grounded ? 0.4 : 0.2;
  let friction = 0.82;
  
  if (currentLevel === 6 || currentLevel === 17) {
    accel = player.grounded ? 0.08 : 0.05;
    friction = 0.98;
  }
  
  if (currentLevel === 19) {
    windTimer++;
    const cycle = Math.floor(windTimer / 180) % 3;
    let windForce = 0;
    if (cycle === 0) {
      windForce = -0.15;
      windDirection = -1;
    } else if (cycle === 1) {
      windForce = 0.15;
      windDirection = 1;
    } else {
      windForce = 0;
      windDirection = 0;
    }
    player.vx += windForce;
  }
  
  if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = Math.min(player.vx + accel, maxHorizontalSpeed);
    player.facingLeft = false;
  } else if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = Math.max(player.vx - accel, -maxHorizontalSpeed);
    player.facingLeft = true;
  } else {
    player.vx *= friction;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }
  
  // Slide and State checks
  if (player.grounded && player.vx !== 0) {
    const isMovingRight = player.vx > 0.1;
    const wantsLeft = keys['ArrowLeft'] || keys['KeyA'];
    const wantsRight = keys['ArrowRight'] || keys['KeyD'];
    if ((isMovingRight && wantsLeft) || (!isMovingRight && wantsRight)) {
      player.state = 'slide';
    } else {
      player.state = 'run';
    }
  } else if (!player.grounded) {
    player.state = 'jump';
  } else if (player.vx === 0) {
    player.state = 'idle';
  }
  
  // Clamp boundaries
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x + player.width > worldWidth) {
    player.x = worldWidth - player.width;
    player.vx = 0;
  }
  
  // Down-key Pipe Teleporters
  if (player.grounded && (keys['ArrowDown'] || keys['KeyS'])) {
    platforms.forEach(p => {
      if (p.type === 'pipe' && p.teleportX !== undefined && p.teleportY !== undefined) {
        const px = player.x + player.width / 2;
        if (px >= p.x && px <= p.x + p.w && Math.abs(player.y + player.height - p.y) < 10) {
          teleportPlayer(p.teleportX, p.teleportY);
        }
      }
    });
  }
  
  // Update Coordinates
  player.x += player.vx;
  resolveCollisions('x');
  
  player.grounded = false;
  player.y += player.vy;
  resolveCollisions('y');
  
  // Fall boundary pit checks
  const isCaveCeilingWalk = (currentLevel === 3 || currentLevel === 10 || currentLevel === 16) && player.y < 80;
  if (player.y > 510 || (gravityDirection === -1 && player.y < -50 && !isCaveCeilingWalk)) {
    playerHurt(true);
  }
  
  // Level 20 Maze loop checks
  if (currentLevel === 20 && gameState === STATES.PLAYING) {
    // Section 1: x = 4850
    if (player.x >= 4850 && !mazeSection1Checked) {
      mazeSection1Checked = true;
      if (player.y < 180) { // Top path (correct)
        sfx.playCoin();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "CORRECT! 🌟", alpha: 1, timer: 60 });
      } else { // Wrong
        sfx.playDeath();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "WRONG PATH! 🌀", alpha: 1, timer: 60 });
        teleportPlayer(4050, 300);
        mazeSection1Checked = false;
        mazeSection2Checked = false;
        mazeSection3Checked = false;
      }
    }
    // Section 2: x = 5650
    else if (player.x >= 5650 && !mazeSection2Checked) {
      mazeSection2Checked = true;
      if (player.y > 300) { // Bottom path (correct)
        sfx.playCoin();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "CORRECT! 🌟", alpha: 1, timer: 60 });
      } else { // Wrong
        sfx.playDeath();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "WRONG PATH! 🌀", alpha: 1, timer: 60 });
        teleportPlayer(4050, 300);
        mazeSection1Checked = false;
        mazeSection2Checked = false;
        mazeSection3Checked = false;
      }
    }
    // Section 3: x = 6450
    else if (player.x >= 6450 && !mazeSection3Checked) {
      mazeSection3Checked = true;
      if (player.y >= 180 && player.y <= 300) { // Middle path (correct)
        sfx.playCoin();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "CORRECT! 🌟", alpha: 1, timer: 60 });
      } else { // Wrong
        sfx.playDeath();
        floatingTexts.push({ x: player.x, y: player.y - 20, text: "WRONG PATH! 🌀", alpha: 1, timer: 60 });
        teleportPlayer(4050, 300);
        mazeSection1Checked = false;
        mazeSection2Checked = false;
        mazeSection3Checked = false;
      }
    }
  }
}

function isSolid(p) {
  if (p.type === 'disappearing' || p.type === 'icicle') {
    return p.state === 'solid';
  }
  const solidTypes = ['ground', 'undergroundground', 'brick', 'undergroundbrick', 'pipe', 'hard', 'speed_pad', 'mystery', 'lava_bridge'];
  return solidTypes.includes(p.type);
}

function resolveCollisions(axis) {
  const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
  
  platforms.forEach(p => {
    // Frustum bounding checks
    if (p.x + p.w < player.x - 100 || p.x > player.x + player.width + 100) return;
    
    const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
    
    if (axis === 'y') {
      if (p.type === 'lava' && checkCollision(pRect, platRect)) {
        playerHurt(true);
        return;
      }
      if (p.type === 'quicksand' && checkCollision(pRect, platRect)) {
        player.vx *= 0.6;
        player.vy = 0.8;
        player.grounded = true;
        player.doubleJumpAvailable = true;
        return;
      }
      if (p.type === 'checkpoint' && !p.hit && checkCollision(pRect, platRect)) {
        p.hit = true;
        checkpointActive = true;
        checkpointLevel = currentLevel;
        checkpointX = p.x;
        checkpointY = p.y - 16;
        checkpointIsSmall = player.isSmall;
        checkpointIsFire = player.isFire;
        sfx.playMushroom();
        floatingTexts.push({ x: p.x, y: p.y - 20, text: "CHECKPOINT!", alpha: 1, timer: 60 });
        return;
      }
      if (p.type === 'bubble_stream' && checkCollision(pRect, platRect)) {
        oxygenLevel = 100;
        return;
      }
      
      if (p.type === 'springboard') {
        if (gravityDirection === 1) {
          if (player.vy > 0 && player.y + player.height - player.vy <= p.y + 12) {
            if (checkCollision(pRect, platRect)) {
              player.y = p.y - player.height;
              player.vy = -14.0; // Propel high!
              player.grounded = false;
              player.doubleJumpAvailable = true;
              player.jumpHoldTimer = 0;
              sfx.playJump();
              p.bumpY = 16; // Compress animation
              p.bumpTimer = 10;
              addParticles(p.x + p.w / 2, p.y, '#ffea00', 8);
            }
          }
        } else {
          if (player.vy < 0 && player.y - player.vy >= p.y + p.h - 12) {
            if (checkCollision(pRect, platRect)) {
              player.y = p.y + p.h;
              player.vy = 14.0; // Propel downwards under reversed gravity
              player.grounded = false;
              player.doubleJumpAvailable = true;
              player.jumpHoldTimer = 0;
              sfx.playJump();
              p.bumpY = -16;
              p.bumpTimer = 10;
              addParticles(p.x + p.w / 2, p.y + p.h, '#ffea00', 8);
            }
          }
        }
        return;
      }
      
      // One-way kinematic moving platforms: allow jumping up, solid snap on top, inherit velocity
      if (p.type === 'moving') {
        if (gravityDirection === 1) {
          if (player.vy > 0 && player.y + player.height - player.vy <= p.y + 10) {
            if (checkCollision(pRect, platRect)) {
              player.y = p.y - player.height;
              player.vy = 0;
              player.grounded = true;
              player.doubleJumpAvailable = true;
              player.jumpHoldTimer = 0;
              player.x += p.vx;
              player.y += p.vy || 0;
            }
          }
        } else {
          if (player.vy < 0 && player.y - player.vy >= p.y + p.h - 10) {
            if (checkCollision(pRect, platRect)) {
              player.y = p.y + p.h;
              player.vy = 0;
              player.grounded = true;
              player.doubleJumpAvailable = true;
              player.jumpHoldTimer = 0;
              player.x += p.vx;
              player.y += p.vy || 0;
            }
          }
        }
        return;
      }
    }
    
    if (!isSolid(p)) return;
    
    if (checkCollision(pRect, platRect)) {
      if (axis === 'x') {
        if (player.vx > 0) {
          player.x = p.x - player.width;
        } else if (player.vx < 0) {
          player.x = p.x + p.w;
        }
        player.vx = 0;
      } else {
        if (gravityDirection === 1) {
          if (player.vy > 0) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;
            player.doubleJumpAvailable = true;
            player.jumpHoldTimer = 0;
            
            if (p.type === 'moving') {
              player.x += p.vx; // Ride the moving platform
            }
            if (p.type === 'speed_pad') {
              player.speedBoostTimer = 90;
              sfx.playCoin();
            }
          } else if (player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
            player.jumpHoldTimer = 0;
            
            // Hit block from below!
            if (p.type === 'mystery' && !p.hit) {
              triggerMysteryHit(p);
            } else if (p.type === 'brick' || p.type === 'undergroundbrick') {
              triggerBrickHit(p);
            }
          }
        } else { // gravityDirection === -1
          if (player.vy < 0) { // falling onto ceiling
            player.y = p.y + p.h;
            player.vy = 0;
            player.grounded = true;
            player.doubleJumpAvailable = true;
            player.jumpHoldTimer = 0;
            
            if (p.type === 'moving') {
              player.x += p.vx;
            }
            if (p.type === 'speed_pad') {
              player.speedBoostTimer = 90;
              sfx.playCoin();
            }
          } else if (player.vy > 0) { // hitting block below with head
            player.y = p.y - player.height;
            player.vy = 0;
            player.jumpHoldTimer = 0;
            
            if (p.type === 'mystery' && !p.hit) {
              triggerMysteryHit(p);
            } else if (p.type === 'brick' || p.type === 'undergroundbrick') {
              triggerBrickHit(p);
            }
          }
        }
      }
    }
  });
}

function checkCollision(r1, r2) {
  return r1.x < r2.x + r2.w &&
         r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h &&
         r1.y + r1.h > r2.y;
}

// Item spawn logic from mystery blocks
function triggerMysteryHit(block) {
  block.hit = true;
  block.bumpY = -12;
  block.bumpTimer = 10;
  
  let type = block.item;
  if (!type) return;
  
  if (type === 'powerup') {
    type = player.isSmall ? 'magicMushroom' : 'flower';
  }
  
  if (type === 'gravityFlip') {
    gravityDirection = -gravityDirection;
    sfx.playMushroom();
    addParticles(block.x + 24, block.y + 24, '#9b5de5', 10);
    player.vy = 0;
    player.grounded = false;
  } else if (type === 'coin') {
    score += 10;
    sfx.playCoin();
    // Spawn floating score text
    floatingTexts.push({ x: block.x + 8, y: block.y - 15, text: "+10", alpha: 1, timer: 45 });
    // Particle flash
    addParticles(block.x + 24, block.y, '#FFE66D', 8);
  } else if (type === 'vine') {
    sfx.playMushroom();
    // Spawn a growing vine platform at block's x, starting with height 0 and moving upwards
    platforms.push({
      type: 'vine',
      x: block.x + 8,
      y: block.y,
      w: 32,
      h: 0,
      growing: true,
      maxH: 240
    });
  } else {
    // Spawn items that slide/bounce
    sfx.playCoin(); // Spawn pop sound
    collectibles.push({
      type: type,
      x: block.x + 6,
      y: block.y - 36,
      w: 36,
      h: 36,
      vx: type === 'flower' ? 0 : 1.5,
      vy: -3.5, // pop out jump
      grounded: false,
      collected: false,
      isSpawning: true,
      spawningY: block.y
    });
  }
}

function triggerBrickHit(block) {
  if (player.isSmall) {
    // Just a thud bump
    block.bumpY = -8;
    block.bumpTimer = 8;
    sfx.playStomp();
  } else {
    // Destroy brick!
    sfx.playStomp();
    // Spawn brick particles
    addParticles(block.x + 24, block.y + 24, '#CD853F', 16);
    
    // Remove brick platform
    const idx = platforms.indexOf(block);
    if (idx !== -1) {
      platforms.splice(idx, 1);
    }
    score += 50;
    floatingTexts.push({ x: block.x + 8, y: block.y - 15, text: "+50", alpha: 1, timer: 45 });
  }
}

// 10. Update logic for active entities (Mushrooms, Starman, Goombas, Koopas)
function updateEntities() {
  // Update platforms (bumps, moving, disappearing, icicles)
  platforms.forEach(p => {
    if (p.bumpTimer > 0) {
      p.bumpTimer--;
      if (p.bumpTimer === 0) {
        p.bumpY = 0;
      } else {
        // Simple bounce curve
        p.bumpY = p.bumpY + 1.5;
      }
    }
    
    // Update moving platforms
    if (p.type === 'moving') {
      p.x += p.vx;
      if (p.vx !== 0) {
        if (p.x < p.minX) {
          p.x = p.minX;
          p.vx = -p.vx;
        } else if (p.x + p.w > p.maxX) {
          p.x = p.maxX - p.w;
          p.vx = -p.vx;
        }
      }
      if (p.vy !== 0 && p.minY !== undefined && p.maxY !== undefined) {
        p.y += p.vy;
        if (p.y < p.minY) {
          p.y = p.minY;
          p.vy = -p.vy;
        } else if (p.y + p.h > p.maxY) {
          p.y = p.maxY - p.h;
          p.vy = -p.vy;
        }
      }
    }
    
    // Update growing vines
    if (p.type === 'vine' && p.growing) {
      p.y -= 3;
      p.h += 3;
      if (p.h >= p.maxH || p.y <= 60) {
        p.growing = false;
      }
    }
    
    // Update disappearing platforms
    if (p.type === 'disappearing') {
      if (p.state === 'solid') {
        const pRect = { x: player.x, y: player.y + 1, w: player.width, h: player.height };
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        if (checkCollision(pRect, platRect) && player.grounded) {
          p.state = 'blinking';
          p.standTimer = 60;
        }
      } else if (p.state === 'blinking') {
        p.standTimer--;
        if (p.standTimer <= 0) {
          p.state = 'gone';
          p.respawnTimer = 180;
        }
      } else if (p.state === 'gone') {
        p.respawnTimer--;
        if (p.respawnTimer <= 0) {
          p.state = 'solid';
        }
      }
    }
    
    // Update falling icicles
    if (p.type === 'icicle') {
      if (p.state === 'solid') {
        if (Math.abs((player.x + player.width/2) - (p.x + p.w/2)) < 100 && player.y > p.y) {
          p.state = 'shake';
          p.standTimer = 25;
        }
      } else if (p.state === 'shake') {
        p.standTimer--;
        p.bumpY = (Math.random() - 0.5) * 3;
        if (p.standTimer <= 0) {
          p.state = 'falling';
          p.bumpY = 0;
          p.vy = 0;
        }
      } else if (p.state === 'falling') {
        p.vy += 0.45;
        p.y += p.vy;
        
        const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
        const icRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        if (checkCollision(pRect, icRect)) {
          playerHurt(false);
          p.state = 'gone';
          p.respawnTimer = 180;
          addParticles(p.x + p.w/2, p.y + p.h, '#b0e0e6', 10);
        }
        
        platforms.forEach(other => {
          if (other !== p && isSolid(other)) {
            const otherRect = { x: other.x, y: other.y, w: other.w, h: other.h };
            if (checkCollision(icRect, otherRect)) {
              p.state = 'gone';
              p.respawnTimer = 180;
              addParticles(p.x + p.w/2, p.y + p.h, '#b0e0e6', 10);
              sfx.playStomp();
            }
          }
        });
        
        if (p.y > 500) {
          p.state = 'gone';
          p.respawnTimer = 180;
        }
      } else if (p.state === 'gone') {
        p.respawnTimer--;
        if (p.respawnTimer <= 0) {
          p.state = 'solid';
          p.y = p.startY;
          p.vy = 0;
        }
      }
    }
  });
  
  // Starman / mushroom collectibles update loops
  collectibles.forEach(it => {
    if (it.collected) return;
    
    // Pop out animation
    if (it.isSpawning) {
      it.vy += 0.35;
      it.y += it.vy;
      if (it.y >= it.spawningY - 48) {
        it.y = it.spawningY - 48;
        it.isSpawning = false;
        it.vy = 0;
      }
      return;
    }
    
    // Apply gravity
    if (it.type !== 'flower') {
      it.vy += 0.4;
      if (it.vy > 8) it.vy = 8;
      
      // Apply X movement
      it.x += it.vx;
      resolveItemCollisions(it, 'x');
      
      // Apply Y movement
      it.grounded = false;
      it.y += it.vy;
      const hitGround = resolveItemCollisions(it, 'y');
      
      // Starman bounces
      if (it.type === 'starman' && hitGround) {
        it.vy = -6;
      }
    }
    
    // Check collection collisions
    const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
    const itRect = { x: it.x, y: it.y, w: it.w, h: it.h };
    if (checkCollision(pRect, itRect)) {
      it.collected = true;
      triggerItemCollection(it);
    }
    
    // Fall down pit culling
    if (it.y > 510) {
      it.collected = true;
    }
  });
  
  // Collisions with floating coins
  floatingCoins.forEach(c => {
    if (c.collected) return;
    const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
    const cRect = { x: c.x, y: c.y, w: c.w, h: c.h };
    if (checkCollision(pRect, cRect)) {
      c.collected = true;
      player.coinsCollected++;
      score += 10;
      sfx.playCoin();
      floatingTexts.push({ x: c.x, y: c.y - 10, text: "+10", alpha: 1, timer: 45 });
      addParticles(c.x + c.w / 2, c.y + c.h / 2, '#FFE66D', 6);
      
      // 100 coins = 1UP extra life!
      if (player.coinsCollected >= 100) {
        player.coinsCollected = 0;
        if (player.lives < 5) player.lives++;
        sfx.playMushroom(); // Play extra life sound
        floatingTexts.push({ x: player.x, y: player.y - 30, text: "1UP! +1000", alpha: 1, timer: 60 });
        addParticles(player.x + player.width / 2, player.y, '#4ECDC4', 15);
      }
    }
  });
  
  // Oxygen countdown decay on Level 8
  if (currentLevel === 8 && gameState === STATES.PLAYING && !isPaused) {
    oxygenLevel -= 0.06;
    if (oxygenLevel <= 0) {
      oxygenLevel = 0;
      playerHurt(true);
    }
  }

  // Storm Warning lightning strike cycles on Level 19
  if (currentLevel === 19 && gameState === STATES.PLAYING && !isPaused) {
    if (lightningState === 'idle') {
      lightningTimer--;
      if (lightningTimer <= 0) {
        lightningState = 'warning';
        lightningTimer = 60;
        lightningX = player.x + (Math.random() * 200 - 100);
      }
    } else if (lightningState === 'warning') {
      lightningTimer--;
      if (lightningTimer <= 0) {
        lightningState = 'strike';
        lightningTimer = 15;
        sfx.playDeath();
        screenShake(12, 10);
      }
    } else if (lightningState === 'strike') {
      lightningTimer--;
      const strikeRect = { x: lightningX - 20, y: 0, w: 40, h: canvas.height };
      const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
      if (checkCollision(strikeRect, pRect)) {
        playerHurt(false);
      }
      if (lightningTimer <= 0) {
        lightningState = 'idle';
        lightningTimer = 180 + Math.random() * 120;
      }
    }
  }

  // Spawn offscreen Bullet Bills randomly on outdoor levels (difficulty scaled: only after level 5)
  if (gameState === STATES.PLAYING && !isPaused && currentLevel > 5 && currentLevel !== 8 && currentLevel !== 11) {
    if (Math.random() < 0.005) { // ~once every 200 frames
      const by = 80 + Math.random() * 260;
      enemies.push({
        type: 'bullet_bill',
        x: camera.x + canvas.width + 50,
        y: by,
        w: 32,
        h: 24,
        vx: -3.0,
        vy: 0,
        state: 'walk'
      });
    }
  }

  // Enemies AI movement updates
  enemies.forEach(e => {
    if (e.state === 'dead') {
      if (e.deathTimer > 0) {
        e.deathTimer--;
        // Fling movement physics
        e.vy += 0.45;
        e.x += e.vx;
        e.y += e.vy;
      }
      return;
    }
    
    // Edge detection for Red Koopa ground patrols
    if (e.type === 'red_koopa' && e.state === 'walk') {
      const checkX = e.vx > 0 ? e.x + e.w + 6 : e.x - 6;
      const checkY = e.y + e.h + 10;
      let hasGround = false;
      platforms.forEach(p => {
        if (isSolid(p)) {
          if (checkX >= p.x && checkX <= p.x + p.w && checkY >= p.y && checkY <= p.y + p.h) {
            hasGround = true;
          }
        }
      });
      if (!hasGround) {
        e.vx = -e.vx;
        e.facingLeft = e.vx < 0;
      }
    }
    
    if (e.type === 'boo') {
      const playerLookingRight = !player.facingLeft;
      const playerToLeftOfBoo = player.x < e.x;
      const lookingAtBoo = (playerToLeftOfBoo && playerLookingRight) || (!playerToLeftOfBoo && !playerLookingRight);
      
      if (lookingAtBoo) {
        e.state = 'hiding';
        e.vx = 0;
        e.vy = 0;
      } else {
        e.state = 'walk';
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 500) {
          e.vx = (dx / dist) * 0.8;
          e.vy = (dy / dist) * 0.8;
        } else {
          e.vx = 0;
          e.vy = 0;
        }
        e.facingLeft = e.vx < 0;
      }
    } else if (e.type === 'bowser') {
      if (bossState === 'hurt') {
        bossTimer--;
        if (bossTimer <= 0) {
          bossState = 'walk';
        }
      }
      
      e.timer++;
      // Random action callback: alternated jumps and fire projectiles
      if (e.timer % 140 === 0 && e.state !== 'dead') {
        const action = Math.random();
        if (action < 0.5) {
          enemies.push({
            type: 'boss_fireball',
            x: e.x - 20,
            y: e.y + e.h / 3,
            w: 16,
            h: 16,
            vx: -3.5,
            vy: 0,
            state: 'walk'
          });
          sfx.playJump();
        } else {
          e.vy = -7.5; // Leap jump
        }
      }
      
      e.vx = bossVx;
      const minBridgeX = worldWidth - 1000;
      const maxBridgeX = worldWidth - 400;
      if (e.x < minBridgeX) {
        bossVx = Math.abs(bossVx);
      } else if (e.x > maxBridgeX) {
        bossVx = -Math.abs(bossVx);
      }
      e.facingLeft = e.vx < 0;
    } else if (e.type === 'boss_fireball') {
      e.vx = -3.5;
      e.vy = 0;
      
      const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
      const eRect = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (checkCollision(pRect, eRect)) {
        playerHurt(false);
        e.state = 'dead';
      }
      if (e.x < camera.x - 100) {
        e.state = 'dead';
      }
    } else if (e.type === 'log') {
      e.vx = -2.5;
    } else if (e.type === 'snowball') {
      if (e.vx === 0) e.vx = -2.0;
    } else if (e.type === 'bullet_bill') {
      e.vx = -3.0;
      e.vy = 0;
    } else if (e.type === 'lakitu') {
      e.vy = 0;
      const targetX = player.x;
      e.vx = (targetX - e.x) * 0.03;
      e.vx = Math.max(-2.5, Math.min(2.5, e.vx));
      
      e.timer++;
      if (e.timer % 180 === 0 && e.state !== 'dead') {
        enemies.push({
          type: 'spiny',
          x: e.x,
          y: e.y + 20,
          w: 32,
          h: 32,
          vx: e.vx > 0 ? 1.0 : -1.0,
          vy: 1.0,
          state: 'walk'
        });
      }
    } else if (e.type === 'piranha') {
      e.vy = 0;
      const px = player.x + player.width / 2;
      const pipeCenterX = e.x + 16;
      const dist = Math.abs(px - pipeCenterX);
      const isPlayerClose = dist < 72;
      
      e.timer++;
      if (e.state === 'hidden') {
        e.y = e.startY + 44;
        if (e.timer >= 90) {
          if (!isPlayerClose) {
            e.state = 'rising';
            e.timer = 0;
          }
        }
      } else if (e.state === 'rising') {
        e.y -= 1;
        if (e.y <= e.startY - 36) {
          e.y = e.startY - 36;
          e.state = 'showing';
          e.timer = 0;
        }
      } else if (e.state === 'showing') {
        e.y = e.startY - 36;
        if (e.timer >= 90) {
          e.state = 'lowering';
          e.timer = 0;
        }
      } else if (e.state === 'lowering') {
        e.y += 1;
        if (e.y >= e.startY + 44) {
          e.y = e.startY + 44;
          e.state = 'hidden';
          e.timer = 0;
        }
      }
    } else if (e.type === 'blooper') {
      e.vy += 0.08;
      if (e.vy > 2) e.vy = 2;
      
      e.timer++;
      if (e.timer >= 90 && e.state !== 'dead') {
        e.timer = 0;
        e.vy = -3.5;
        e.vx = (player.x - e.x) > 0 ? 1.2 : -1.2;
      }
    } else if (e.type === 'cheep_cheep') {
      e.vy = 0;
      e.vx = -1.2;
    } else if (e.type === 'paratroopa') {
      e.vy = 0;
      e.timer++;
      e.y = e.startY + Math.sin(e.timer * 0.04) * 60;
      e.vx = 0;
    } else if (e.type === 'hammer_bro') {
      if (e.startX === undefined) {
        e.startX = e.x;
        e.jumpTimer = 0;
      }
      
      e.timer++;
      e.jumpTimer++;
      
      // Patrol left and right
      const range = 60;
      if (e.x < e.startX - range) {
        e.vx = 0.8;
      } else if (e.x > e.startX + range) {
        e.vx = -0.8;
      } else if (e.vx === 0 || Math.abs(e.vx) > 1) {
        e.vx = -0.8;
      }
      
      // Face the player
      e.facingLeft = player.x < e.x;
      
      // Jump up/down platforms
      if (e.jumpTimer >= 180) {
        e.jumpTimer = 0;
        if (e.y >= 340) {
          e.vy = -8.5; // Jump to upper platform
        } else {
          e.vy = -3.0; // Hop down
          e.y += 10;
        }
      }
      
      // Throw hammer projectile
      if (e.timer % 120 === 0 && e.state !== 'dead') {
        const hvx = e.facingLeft ? -2.2 : 2.2;
        const hvy = -6.5;
        activeHammers.push(new Hammer(e.x + 8, e.y - 12, hvx, hvy));
        sfx.playJump(); // pop sound
      }
    } else {
      if (player.starTimer > 0 && e.state !== 'shell' && e.state !== 'sliding') {
        if (player.x < e.x) {
          e.vx = 1.0;
        } else {
          e.vx = -1.0;
        }
        e.facingLeft = e.vx < 0;
      } else if (e.state === 'walk') {
        if (e.vx > 0 && e.vx !== 1.0) {
          // keep
        } else if (e.vx < 0 && e.vx !== -1.0) {
          // keep
        } else {
          e.vx = e.facingLeft ? -1.2 : 1.2;
        }
      }
    }
    
    // Physics application and gravity exclusion list
    if (e.type !== 'boo' && e.type !== 'boss_fireball' && e.type !== 'bullet_bill' && e.type !== 'lakitu' && e.type !== 'piranha' && e.type !== 'blooper' && e.type !== 'cheep_cheep' && e.type !== 'paratroopa') {
      e.vy += 0.45;
      if (e.vy > 10) e.vy = 10;
      
      e.x += e.vx;
      resolveEnemyCollisions(e, 'x');
      
      e.y += e.vy;
      resolveEnemyCollisions(e, 'y');
    } else if (e.type === 'boo') {
      e.x += e.vx;
      e.y += e.vy;
    } else if (e.type === 'boss_fireball') {
      e.x += e.vx;
    } else if (e.type === 'bullet_bill') {
      e.x += e.vx;
    } else if (e.type === 'lakitu') {
      e.x += e.vx;
    } else if (e.type === 'blooper') {
      e.x += e.vx;
      resolveEnemyCollisions(e, 'x');
      e.y += e.vy;
      resolveEnemyCollisions(e, 'y');
    } else if (e.type === 'cheep_cheep') {
      e.x += e.vx;
    }
    
    // Check if falling off pits
    if (e.y > 510) {
      e.state = 'dead';
      e.deathTimer = 0;
    }
    
    // Check hit interactions with Player
    if (player.state === 'death') return;
    
    const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
    const eRect = { x: e.x, y: e.y, w: e.w, h: e.h };
    
    if (checkCollision(pRect, eRect)) {
      if (player.starTimer > 0) {
        killEnemyFling(e);
      } else if (e.type === 'boo') {
        playerHurt(false);
      } else if (e.type === 'bowser') {
        if (player.vy > 0 && (player.y + player.height - 12 < e.y)) {
          damageBowser(e);
          player.vy = -8.0;
        } else {
          playerHurt(false);
        }
      } else if (e.type === 'log') {
        if (player.vy > 0 && (player.y + player.height - 12 < e.y)) {
          e.state = 'dead';
          e.deathTimer = 0;
          addParticles(e.x + e.w/2, e.y + e.h/2, '#8b4513', 12);
          player.vy = -6.0;
          sfx.playStomp();
          score += 100;
          floatingTexts.push({ x: e.x, y: e.y - 10, text: "+100", alpha: 1, timer: 45 });
        } else {
          playerHurt(false);
        }
      } else if (e.type === 'snowball') {
        if (player.vy > 0 && (player.y + player.height - 12 < e.y)) {
          e.state = 'dead';
          e.deathTimer = 0;
          addParticles(e.x + 12, e.y + 12, '#ffffff', 10);
          player.vy = -6.0;
          sfx.playStomp();
          score += 100;
          floatingTexts.push({ x: e.x, y: e.y - 10, text: "+100", alpha: 1, timer: 45 });
        } else {
          playerHurt(false);
        }
      } else if (player.vy > 0 && (player.y + player.height - 12 < e.y)) {
        if (e.type === 'spiny' || e.type === 'piranha' || e.type === 'blooper' || e.type === 'cheep_cheep') {
          playerHurt(false);
        } else if (e.type === 'lakitu') {
          e.state = 'dead';
          e.deathTimer = 120;
          e.vx = 0;
          e.vy = -4; // fling up
          addParticles(e.x + e.w/2, e.y + e.h/2, '#4ECDC4', 12);
          player.vy = -7.5;
          sfx.playStomp();
          score += 500;
          floatingTexts.push({ x: e.x, y: e.y - 15, text: "+500", alpha: 1, timer: 45 });
        } else if (e.type === 'bullet_bill') {
          e.state = 'dead';
          e.deathTimer = 0;
          addParticles(e.x + e.w/2, e.y + e.h/2, '#ff6b35', 10);
          player.vy = -7.5;
          sfx.playStomp();
          score += 200;
        } else if (e.type === 'paratroopa') {
          e.type = 'red_koopa';
          e.state = 'walk';
          e.vy = 0;
          e.vx = -1.2;
          addParticles(e.x + e.w/2, e.y + e.h/2, '#ffffff', 8);
          player.vy = -7.5;
          sfx.playStomp();
        } else if (e.type === 'goomba') {
          stompGoomba(e);
          player.vy = -7.5;
        } else if (e.type === 'koopa' || e.type === 'red_koopa') {
          stompKoopa(e);
          player.vy = -7.5;
        }
      } else {
        if (e.state === 'shell') {
          kickShell(e);
        } else {
          playerHurt(false);
        }
      }
    }
    
    // Shell slides kills Goombas!
    if (e.type === 'koopa' && e.state === 'sliding') {
      enemies.forEach(other => {
        if (other === e || other.state === 'dead') return;
        const otherRect = { x: other.x, y: other.y, w: other.w, h: other.h };
        const shellRect = { x: e.x, y: e.y, w: e.w, h: e.h };
        if (checkCollision(shellRect, otherRect)) {
          killEnemyFling(other);
          sfx.playStomp();
        }
      });
    }
  });
  
  // Invincibility star timer countdowns
  if (player.starTimer > 0) {
    player.starTimer--;
    if (player.starTimer % 20 === 0 && player.starTimer > 0) {
      sfx.playStar();
    }
  }
  
  if (player.invincibleFlash > 0) {
    player.invincibleFlash--;
  }
  
  if (player.transformTimer > 0) {
    player.transformTimer--;
  }
  
  // Timer countdowns
  const now = Date.now();
  if (gameState === STATES.PLAYING && now - lastTimeUpdate >= 1000) {
    lastTimeUpdate = now;
    levelTimer--;
    if (levelTimer <= 0) {
      playerHurt(true);
    }
  }
  
  // Check Axe collision
  if (bridgeCollapseTimer === 0) {
    const axePlat = platforms.find(p => p.type === 'axe');
    if (axePlat) {
      const pRect = { x: player.x, y: player.y, w: player.width, h: player.height };
      const aRect = { x: axePlat.x, y: axePlat.y, w: axePlat.w, h: axePlat.h };
      if (checkCollision(pRect, aRect) && player.state !== 'death') {
        bridgeCollapseTimer = 1;
        triggerBridgeCollapse();
      }
    }
  }

  // Update bridge collapse ticker
  if (bridgeCollapseTimer > 0) {
    bridgeCollapseTimer++;
    if (bridgeCollapseTimer % 12 === 0) {
      const bridgeBlocks = platforms.filter(p => p.type === 'lava_bridge');
      if (bridgeBlocks.length > 0) {
        bridgeBlocks.sort((a, b) => b.x - a.x); // collapse from right to left
        const rightmost = bridgeBlocks[0];
        
        // particles
        addParticles(rightmost.x + 24, rightmost.y + 24, '#CD853F', 8);
        sfx.playStomp();
        
        const idx = platforms.indexOf(rightmost);
        if (idx !== -1) {
          platforms.splice(idx, 1);
        }
      } else {
        // all blocks collapsed! trigger flag pole sequence to win level
        bridgeCollapseTimer = 0;
        const flagData = LEVELS[currentLevel]?.flagpole;
        if (flagData) {
          activeFlagpoleSequence = new FlagpoleSequence(flagData);
          
          const timeBonus = Math.max(0, Math.ceil(levelTimer)) * 10;
          score += timeBonus + 500;
          
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('kgz_highscore_super-mario', highScore);
            document.getElementById('highScoreVal').innerText = highScore;
          }
        }
      }
    }
  }

  // Check flagpole check point trigger
  const flagData = LEVELS[currentLevel]?.flagpole;
  if (flagData && player.x + player.width >= flagData.x && !activeFlagpoleSequence) {
    activeFlagpoleSequence = new FlagpoleSequence(flagData);
    
    // Calculate final scores tallies immediately
    const timeBonus = Math.max(0, Math.ceil(levelTimer)) * 10;
    score += timeBonus + 500;
    
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('kgz_highscore_super-mario', highScore);
      document.getElementById('highScoreVal').innerText = highScore;
    }
  }
}

// Collisions resolution helper for collectibles
function resolveItemCollisions(item, axis) {
  let hit = false;
  const itRect = { x: item.x, y: item.y, w: item.w, h: item.h };
  
  platforms.forEach(p => {
    const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (checkCollision(itRect, platRect)) {
      hit = true;
      if (axis === 'x') {
        item.vx = -item.vx;
        if (item.vx > 0) {
          item.x = p.x + p.w;
        } else {
          item.x = p.x - item.w;
        }
      } else {
        if (item.vy > 0) {
          item.y = p.y - item.h;
          item.vy = 0;
          item.grounded = true;
        } else if (item.vy < 0) {
          item.y = p.y + p.h;
          item.vy = 0;
        }
      }
    }
  });
  return hit;
}

// Collisions resolution helper for enemies
function resolveEnemyCollisions(e, axis) {
  if (e.type === 'boo' || e.type === 'boss_fireball' || e.type === 'bullet_bill' || e.type === 'lakitu' || e.type === 'piranha' || e.type === 'cheep_cheep' || e.type === 'paratroopa') return;
  if (e.state === 'collapsing') return; // Bowser falls through blocks
  const eRect = { x: e.x, y: e.y, w: e.w, h: e.h };
  
  platforms.forEach(p => {
    if (!isSolid(p)) return;
    const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (checkCollision(eRect, platRect)) {
      if (axis === 'x') {
        e.vx = -e.vx;
        if (e.vx > 0) {
          e.x = p.x + p.w;
        } else {
          e.x = p.x - e.w;
        }
      } else {
        if (e.vy > 0) {
          e.y = p.y - e.h;
          e.vy = 0;
        } else if (e.vy < 0) {
          e.y = p.y + p.h;
          e.vy = 0;
        }
      }
    }
  });
}

// Item triggers
function triggerItemCollection(item) {
  if (item.type === 'magicMushroom') {
    sfx.playMushroom();
    if (player.isSmall) {
      player.isSmall = false;
      player.updateHitbox();
      player.transformTimer = 30; // grow scaling
      player.y -= 16; // lift slightly to avoid clipping ground
    }
    score += 200;
    floatingTexts.push({ x: item.x, y: item.y - 15, text: "+200", alpha: 1, timer: 50 });
    addParticles(item.x + 18, item.y + 18, '#ff6b35', 10);
  } else if (item.type === 'flower') {
    sfx.playMushroom();
    if (player.isSmall) {
      player.isSmall = false;
      player.updateHitbox();
      player.transformTimer = 30;
      player.y -= 16;
    } else {
      player.isFire = true;
      player.transformTimer = 30;
    }
    score += 1000;
    floatingTexts.push({ x: item.x, y: item.y - 15, text: "FLOWER! +1000", alpha: 1, timer: 50 });
    addParticles(item.x + 18, item.y + 18, '#ffea00', 10);
  } else if (item.type === 'mushroom1up') {
    sfx.playMushroom();
    if (player.lives < 5) player.lives++;
    score += 1000;
    floatingTexts.push({ x: item.x, y: item.y - 15, text: "1UP! +1000", alpha: 1, timer: 60 });
    addParticles(item.x + 18, item.y + 18, '#4ECDC4', 15);
  } else if (item.type === 'starman') {
    sfx.playStar();
    player.starTimer = 480; // 8 seconds star power
    score += 500;
    floatingTexts.push({ x: item.x, y: item.y - 15, text: "STAR POWER! +500", alpha: 1, timer: 60 });
    addParticles(item.x + 18, item.y + 18, '#FFE66D', 20);
  }
}

// Enemy stomps behaviors
function stompGoomba(e) {
  e.state = 'dead';
  e.vx = 0;
  e.vy = 0;
  e.deathTimer = 30; // visible flat goomba 0.5 seconds
  score += 100;
  sfx.playStomp();
  floatingTexts.push({ x: e.x, y: e.y - 15, text: "+100", alpha: 1, timer: 45 });
  addParticles(e.x + 16, e.y + 16, '#8B4513', 8);
}

function stompKoopa(e) {
  if (e.state === 'walk') {
    e.state = 'shell';
    e.vx = 0;
    e.vy = 0;
    score += 100;
    sfx.playStomp();
    floatingTexts.push({ x: e.x, y: e.y - 15, text: "SHELL! +100", alpha: 1, timer: 45 });
  } else if (e.state === 'shell') {
    kickShell(e);
  } else if (e.state === 'sliding') {
    // Stomp stops sliding
    e.state = 'shell';
    e.vx = 0;
    sfx.playStomp();
  }
}

function kickShell(e) {
  e.state = 'sliding';
  // Kick towards the direction Bella is facing
  e.vx = player.facingLeft ? -7 : 7;
  sfx.playStomp();
  score += 100;
  floatingTexts.push({ x: e.x, y: e.y - 15, text: "KICK! +100", alpha: 1, timer: 45 });
}

function killEnemyFling(e) {
  e.state = 'dead';
  e.deathTimer = 60;
  e.vy = -6; // fling up
  e.vx = (Math.random() * 4 - 2); // random slide
  score += 200;
  floatingTexts.push({ x: e.x, y: e.y - 15, text: "+200", alpha: 1, timer: 45 });
  addParticles(e.x + 16, e.y + 16, '#ff6b35', 12);
}

// Player damage controls
function playerHurt(instantKill) {
  if (player.invincibleFlash > 0 && !instantKill) return;
  
  if (instantKill) {
    player.lives = 0;
  }
  
  if (player.isFire && !instantKill) {
    player.isFire = false;
    player.transformTimer = 30;
    player.invincibleFlash = 120; // 2 seconds flash
    sfx.playStomp();
  } else if (!player.isSmall && !instantKill) {
    // Shrink only
    player.isSmall = true;
    player.updateHitbox();
    player.transformTimer = 30;
    player.invincibleFlash = 120; // 2 seconds flash
    sfx.playStomp(); // play thud/shrink
  } else {
    // Direct death
    player.state = 'death';
    player.vy = -8.5; // fling up
    player.vx = 0;
    player.lives--;
    sfx.playDeath();
    
    // Trigger screen shake
    screenShake(8, 15);
    
    // Block inputs
    keys['ArrowLeft'] = keys['ArrowRight'] = keys['Space'] = false;
    
    // Death fall timer delay
    setTimeout(() => {
      if (player.lives <= 0) {
        gameState = STATES.GAME_OVER;
        sfx.playGameOver();
      } else {
        // Reload current section
        player.reset();
        camera.x = 0;
        buildLevel(currentLevel);
        gameState = STATES.PLAYING;
      }
    }, 2000);
  }
}

function drawDarkness(ctx, px, py, cam) {
  ctx.save();
  const lx = px - cam + (player.width / 2);
  const ly = py + (player.height / 2);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
  ctx.beginPath();
  ctx.rect(0, 50, canvas.width, canvas.height - 50);
  
  const flicker = Math.sin(Date.now() * 0.01) * 5;
  const radius = Math.max(80, lightCircleRadius + flicker);
  ctx.arc(lx, ly, radius, 0, Math.PI * 2, true);
  ctx.clip();
  ctx.fill();
  ctx.restore();
}

function drawWindLines(ctx) {
  if (windDirection === 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  const speed = windDirection * 8;
  const time = Date.now() * 0.05;
  
  for (let i = 0; i < 10; i++) {
    const y = (i * 45 + 70) % canvas.height;
    const x = ((i * 120 + time * speed) % (canvas.width + 200)) - 100;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 80, y);
    ctx.stroke();
  }
  
  ctx.fillStyle = '#FFE66D';
  ctx.font = 'bold 14px "Nunito", sans-serif';
  ctx.textAlign = 'right';
  let windText = "💨 Calm";
  if (windDirection === -1) windText = "💨 WIND ⬅️";
  if (windDirection === 1) windText = "💨 WIND ➡️";
  ctx.fillText(windText, canvas.width - 120, 32);
  ctx.restore();
}

function teleportPlayer(tx, ty) {
  addParticles(player.x + player.width/2, player.y + player.height/2, '#4ECDC4', 20);
  player.x = tx;
  player.y = ty;
  player.vx = 0;
  player.vy = 0;
  camera.x = Math.max(0, Math.min(worldWidth - canvas.width, player.x - canvas.width * 0.25));
  sfx.playMushroom();
  addParticles(player.x + player.width/2, player.y + player.height/2, '#4ECDC4', 20);
}

function damageBowser(e) {
  if (bossState === 'hurt' || e.state === 'dead') return;
  bossHP--;
  sfx.playStomp();
  bossState = 'hurt';
  bossTimer = 40;
  screenShake(10, 10);
  
  if (bossHP <= 0) {
    e.state = 'dead';
    e.vx = 0;
    e.vy = -5;
    e.deathTimer = 120;
    score += 5000;
    player.state = 'victory';
    player.vx = 0;
    player.vy = 0;
    floatingTexts.push({ x: e.x, y: e.y - 20, text: "VICTORY! +5000", alpha: 1, timer: 90 });
    setTimeout(() => {
      gameState = STATES.YOU_WIN;
    }, 3000);
  } else {
    bossVx = -1.5 * (6 - bossHP) * 0.7;
    e.vx = bossVx;
  }
}

// 11. Scenery and particle systems
function addParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() * 4 - 2),
      vy: (Math.random() * -6 - 2),
      r: Math.random() * 4 + 2,
      color: color,
      alpha: 1,
      decay: Math.random() * 0.04 + 0.02
    });
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - camera.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35; // gravity
    p.alpha -= p.decay;
    
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = '#FFE66D';
    ctx.font = 'bold 16px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x - camera.x, ft.y);
    ctx.restore();
    
    ft.y -= 1;
    ft.alpha -= 0.02;
    ft.timer--;
    
    if (ft.timer <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// Camera Follow System
function updateCamera() {
  if (gameState !== STATES.PLAYING && gameState !== STATES.LEVEL_COMPLETE) return;
  if (player.state === 'death') return;
  
  // Follow Bella keeping at 25% width
  const targetCamX = player.x - canvas.width * 0.25;
  camera.x += (targetCamX - camera.x) * 0.1;
  
  if (camera.x < 0) camera.x = 0;
  if (camera.x > worldWidth - canvas.width) camera.x = worldWidth - canvas.width;
}

// Main game states controllers
function startGame() {
  gameState = STATES.PLAYING;
  currentLevel = 1;
  score = 0;
  player.reset();
  player.lives = 3;
  buildLevel(currentLevel);
}

function resetToMenu() {
  gameState = STATES.MENU;
  score = 0;
  document.getElementById('scoreVal').innerText = score;
}

function advanceLevel() {
  currentLevel++;
  if (currentLevel > 20) {
    gameState = STATES.YOU_WIN;
  } else {
    player.reset();
    camera.x = 0;
    buildLevel(currentLevel);
    gameState = STATES.PLAYING;
  }
}

// 12. Main Loop & Game Initializers
function gameTick() {
  if (gameState === STATES.PLAYING && !isPaused) {
    if (player.state !== 'death' && !activeFlagpoleSequence) {
      updatePhysics();
    } else if (player.state === 'death') {
      // Small death animation physics
      player.vy += 0.45;
      player.y += player.vy;
    }
    
    if (activeFlagpoleSequence) {
      activeFlagpoleSequence.update();
    }
    
    updateEntities();
    
    // Update fireballs
    activeFireballs.forEach(f => f.update());
    activeFireballs = activeFireballs.filter(f => f.active);
    
    // Update hammers
    activeHammers.forEach(h => h.update());
    activeHammers = activeHammers.filter(h => h.active);
  }
  
  updateCamera();
  draw();
  
  document.getElementById('scoreVal').innerText = score;
  requestAnimationFrame(gameTick);
}

// Bridge collapse trigger action
function triggerBridgeCollapse() {
  const bowser = enemies.find(e => e.type === 'bowser');
  if (bowser) {
    bowser.state = 'collapsing';
    bowser.vx = 0;
    bowser.vy = 2;
  }
  
  const axePlat = platforms.find(p => p.type === 'axe');
  if (axePlat) {
    const idx = platforms.indexOf(axePlat);
    if (idx !== -1) {
      platforms.splice(idx, 1);
    }
    addParticles(axePlat.x + 24, axePlat.y + 24, '#ffea00', 12);
  }
}

generateAllLevels();
// Spawning spawn loader trigger
loadAllAssets(() => {
  gameState = STATES.MENU;
  requestAnimationFrame(gameTick);
});
