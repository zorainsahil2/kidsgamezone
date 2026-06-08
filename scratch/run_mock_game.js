const fs = require('fs');

// Mock browser globals
global.window = {
  addEventListener: () => {},
  AudioContext: class {},
  webkitAudioContext: class {}
};
global.document = {
  getElementById: (id) => {
    console.log(`Mock document.getElementById(${id}) called`);
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
  addEventListener: () => {}
};
global.Image = class {
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.requestAnimationFrame = () => {};

console.log('Evaluating game.js...');
try {
  const code = fs.readFileSync('games/super-mario/game.js', 'utf8');
  eval(code);
  console.log('SUCCESS: game.js evaluated without initial runtime errors.');
} catch (err) {
  console.error('ERROR during evaluation:', err);
}
