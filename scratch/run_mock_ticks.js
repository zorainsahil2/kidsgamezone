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
`;

eval(code);

// Start the game to set up playing state
console.log('Starting game mock...');
global.startGame(); // Calls startGame() which sets gameState = STATES.PLAYING and initializes entities

console.log('Running 100 game ticks...');
try {
  for (let i = 0; i < 100; i++) {
    // Simulate player moving right and jumping
    global.keys['ArrowRight'] = true;
    if (i % 20 === 0) {
      global.keys['Space'] = true;
      global.triggerJump();
    } else {
      global.keys['Space'] = false;
    }
    
    // Run the game tick manually if requestAnimationFrame captured it
    if (tickCallback) {
      const cb = tickCallback;
      tickCallback = null;
      cb();
    } else {
      global.gameTick();
    }
  }
  console.log('SUCCESS: Ran 100 ticks of the game loop without any exceptions!');
} catch (err) {
  console.error('CRITICAL ERROR during game loop simulation:', err);
}
