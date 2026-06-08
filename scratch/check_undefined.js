const fs = require('fs');

const code = fs.readFileSync('games/super-mario/game.js', 'utf8');

// Simple parser for function definitions
const definedFunctions = new Set();
const definedClasses = new Set();

// Find standard function definitions: function name(...)
const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
let match;
while ((match = funcRegex.exec(code)) !== null) {
  definedFunctions.add(match[1]);
}

// Find class definitions: class Name
const classRegex = /class\s+([a-zA-Z0-9_]+)/g;
while ((match = classRegex.exec(code)) !== null) {
  definedClasses.add(match[1]);
}

// Find class methods inside classes (very basic search)
const methodRegex = /^\s*([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/gm;
while ((match = methodRegex.exec(code)) !== null) {
  definedFunctions.add(match[1]);
}

// Built-in JS / DOM / Canvas functions to ignore
const ignored = new Set([
  'AudioContext', 'webkitAudioContext', 'Image', 'parseInt', 'setInterval', 'setTimeout', 'clearInterval', 'clearTimeout',
  'requestAnimationFrame', 'Math', 'Date', 'localStorage', 'console', 'document', 'window', 'addEventListener',
  'removeEventListener', 'push', 'forEach', 'indexOf', 'splice', 'find', 'setValueAtTime', 'exponentialRampToValueAtTime',
  'connect', 'start', 'stop', 'linearRampToValueAtTime', 'createOscillator', 'createGain', 'resume', 'drawImage',
  'fillRect', 'strokeRect', 'fillText', 'stroke', 'beginPath', 'moveTo', 'lineTo', 'arc', 'fill', 'save', 'restore',
  'translate', 'scale', 'clearRect', 'getItem', 'setItem', 'getBoundingClientRect', 'preventDefault', 'changedTouches',
  'getCanvasTouchPos', 'checkTouchInput', 'releaseTouchInput', 'startGame', 'resetToMenu', 'advanceLevel',
  'triggerJump', 'updatePhysics', 'updateEntities', 'updateItems', 'updateCamera', 'draw', 'gameTick',
  'loadAllAssets', 'drawLoadingScreen', 'playerHurt', 'addParticles', 'drawParticles', 'drawFloatingTexts',
  'drawMobileControls', 'drawBackground', 'drawScenery', 'drawPlatforms', 'drawCollectibles', 'drawEnemies',
  'drawFlagpole', 'drawBella', 'drawHUD', 'drawMenu', 'drawLevelComplete', 'drawGameOver', 'drawYouWin', 'drawConfetti',
  'resolveCollisions', 'checkCollision', 'triggerMysteryHit', 'triggerBrickHit', 'resolveItemCollisions',
  'resolveEnemyCollisions', 'triggerItemCollection', 'stompGoomba', 'stompKoopa', 'kickShell', 'killEnemyFling',
  'buildLevel', 'hueRotate', 'saturate', 'toString', 'eval', 'isNaN', 'isFinite', 'Number', 'String', 'Object',
  'Array', 'RegExp', 'Map', 'Set', 'Error', 'Promise', 'JSON'
]);

// Find all function calls: name(...)
const callRegex = /\b([a-zA-Z0-9_]+)\s*\(/g;
const undefinedCalls = [];
while ((match = callRegex.exec(code)) !== null) {
  const name = match[1];
  if (!definedFunctions.has(name) && !definedClasses.has(name) && !ignored.has(name)) {
    undefinedCalls.push(name);
  }
}

console.log('Undefined function calls found:', Array.from(new Set(undefinedCalls)));
