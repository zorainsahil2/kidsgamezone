const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const dir = 'f:/50 games/kidsgamezone/games/super-mario/assets/';
const files = ['bella-thin.png', 'bella-fat.png', 'collectibles.png', 'enemies.png', 'tileset.png'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);
    
    const r = png.data[0];
    const g = png.data[1];
    const b = png.data[2];
    const a = png.data[3];
    
    console.log(`${file}: top-left pixel (0,0) RGBA = (${r}, ${g}, ${b}, ${a})`);
});
