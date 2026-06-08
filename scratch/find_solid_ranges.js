const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const dir = 'f:/50 games/kidsgamezone/games/super-mario/assets/';
const files = ['collectibles.png', 'tileset.png'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);
    
    let minY = png.height;
    let maxY = -1;
    
    for (let y = 0; y < png.height; y++) {
        let hasSolidPixel = false;
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            const alpha = png.data[idx + 3];
            if (alpha === 255) {
                hasSolidPixel = true;
                break;
            }
        }
        if (hasSolidPixel) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    
    console.log(`${file}: Solid pixel Y range: [${minY} to ${maxY}], height = ${maxY - minY + 1}`);
});
