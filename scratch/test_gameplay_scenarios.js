const fs = require('fs');

// Mock browser globals
global.window = {
  addEventListener: () => {},
  AudioContext: class {
    constructor() { this.currentTime = 0; }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, type: '', frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    resume() { return Promise.resolve(); }
  },
  webkitAudioContext: class {}
};
global.document = {
  getElementById: (id) => {
    if (id === 'gameCanvas') {
      return {
        getContext: () => ({
          clearRect: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          fillText: () => {},
          stroke: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          fill: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          drawImage: () => {}
        }),
        width: 800,
        height: 500,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 500 }),
        addEventListener: () => {}
      };
    }
    return {
      innerText: '',
      addEventListener: () => {}
    };
  },
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      return {
        width: 1024,
        height: 1024,
        getContext: () => ({
          drawImage: () => {},
          getImageData: (x, y, w, h) => ({
            data: new Uint8Array(w * h * 4)
          }),
          putImageData: () => {}
        })
      };
    }
    return {};
  },
  addEventListener: () => {}
};
global.Image = class {
  constructor() {
    this.width = 1024;
    this.height = 1024;
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// We will capture requestAnimationFrame to run it ourselves
let tickCallback = null;
global.requestAnimationFrame = (cb) => {
  tickCallback = cb;
};

// Load and evaluate game.js
let code = fs.readFileSync('games/super-mario/game.js', 'utf8');

// Append global bindings so we can access variables and functions defined inside the eval
code += `
global.startGame = startGame;
global.gameTick = gameTick;
global.triggerJump = triggerJump;
global.keys = keys;
global.player = player;
global.gameState = gameState;
global.STATES = STATES;
global.updateEntities = updateEntities;
global.updatePhysics = updatePhysics;
global.buildLevel = buildLevel;
global.currentLevel = currentLevel;
global.stompGoomba = stompGoomba;
global.stompKoopa = stompKoopa;
global.kickShell = kickShell;
global.playerHurt = playerHurt;
global.triggerItemCollection = triggerItemCollection;
global.advanceLevel = advanceLevel;
global.checkCollision = checkCollision;

global.getCollectibles = () => collectibles;
global.getEnemies = () => enemies;
global.getPlatforms = () => platforms;
`;

eval(code);

// Run tests
try {
  console.log('--- STARTING GAMEPLAY MECHANICS TESTS ---');
  global.startGame();
  
  // Get active arrays
  const activeCollectibles = global.getCollectibles();
  const activeEnemies = global.getEnemies();
  const activePlatforms = global.getPlatforms();
  
  // Test Scenario 1: Collecting Magic Mushroom & Transforming to Big Bella
  console.log('Test 1: Spawning and collecting Magic Mushroom...');
  activeCollectibles.length = 0;
  const mushroom = {
    type: 'magicMushroom',
    x: 100,
    y: 300,
    w: 36,
    h: 36,
    vx: 1.5,
    vy: 0,
    grounded: true,
    collected: false,
    isSpawning: false
  };
  activeCollectibles.push(mushroom);
  
  global.player.x = 98;
  global.player.y = 300;
  global.player.isSmall = true;
  global.player.updateHitbox();
  
  global.updateEntities();
  
  if (global.player.isSmall === false && global.player.transformTimer > 0) {
    console.log('  SUCCESS: Magic mushroom collected and player transformed to Big Bella!');
  } else {
    throw new Error('Magic mushroom collection failed to transform player');
  }
  
  // Test Scenario 2: Stomping Goomba
  console.log('Test 2: Stomping a Goomba...');
  activeEnemies.length = 0;
  const goomba = {
    type: 'goomba',
    x: 100,
    y: 300,
    w: 32,
    h: 32,
    vx: -1.2,
    vy: 0,
    state: 'walk',
    deathTimer: 0
  };
  activeEnemies.push(goomba);
  
  global.player.x = 100;
  global.player.y = 248; 
  global.player.vy = 5; 
  
  global.updateEntities();
  
  if (goomba.state === 'dead' && goomba.deathTimer > 0) {
    console.log('  SUCCESS: Goomba successfully stomped and set to dead state!');
  } else {
    throw new Error('Goomba stomp failed');
  }
  
  // Test Scenario 3: Stomping Koopa to shell and kicking it
  console.log('Test 3: Stomping Koopa to shell and kicking it...');
  activeEnemies.length = 0;
  const koopa = {
    type: 'koopa',
    x: 200,
    y: 300,
    w: 32,
    h: 44,
    vx: -1.2,
    vy: 0,
    state: 'walk',
    deathTimer: 0
  };
  activeEnemies.push(koopa);
  
  global.player.isSmall = true;
  global.player.updateHitbox();
  
  global.player.x = 200;
  global.player.y = 260;
  global.player.vy = 5;
  
  global.updateEntities();
  
  if (koopa.state === 'shell') {
    console.log('  SUCCESS: Koopa stomped into shell state!');
  } else {
    throw new Error('Koopa stomp failed to change state to shell');
  }
  
  // Kick the shell
  console.log('  Kicking the shell...');
  global.player.x = 180; 
  global.player.y = 300; 
  global.player.vy = 0;
  global.player.facingLeft = false; // facing right
  
  global.updateEntities();
  
  if (koopa.state === 'sliding' && koopa.vx > 0) {
    console.log('  SUCCESS: Koopa shell successfully kicked to sliding state!');
  } else {
    console.log(`Failed - Koopa state: ${koopa.state}, vx: ${koopa.vx}`);
    throw new Error('Shell kick failed');
  }
  
  // Test Scenario 4: Player Hurt & Shrinking
  console.log('Test 4: Player getting hurt by Goomba...');
  activeEnemies.length = 0;
  const activeGoomba = {
    type: 'goomba',
    x: 100, 
    y: 420, 
    w: 32,
    h: 32,
    vx: -1.2,
    vy: 0,
    state: 'walk',
    deathTimer: 0
  };
  activeEnemies.push(activeGoomba);
  
  global.player.isSmall = false;
  global.player.updateHitbox(); 
  global.player.x = 80; 
  global.player.y = 400; 
  global.player.vy = 0;
  global.player.invincibleFlash = 0;
  global.player.state = 'idle';
  
  global.updateEntities();
  
  if (global.player.isSmall === true && global.player.invincibleFlash > 0) {
    console.log('  SUCCESS: Big Bella hurt by enemy, shrank to Small Bella with invincibility frames!');
  } else {
    console.log(`Failed - player.isSmall: ${global.player.isSmall}, invincibleFlash: ${global.player.invincibleFlash}`);
    throw new Error('Player hurt failed to shrink player');
  }
  
  console.log('--- ALL GAMEPLAY MECHANICS TESTS PASSED SUCCESSFULLY! ---');
} catch (err) {
  console.error('TEST FAIL:', err);
  process.exit(1);
}
