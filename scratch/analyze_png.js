const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const dir = 'f:/50 games/kidsgamezone/games/super-mario/assets/';
const files = ['bella-thin.png', 'bella-fat.png', 'collectibles.png', 'enemies.png', 'tileset.png', 'background.png'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`${file}: File does not exist`);
        return;
    }
    
    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);
    
    let minX = png.width;
    let maxX = -1;
    let minY = png.height;
    let maxY = -1;
    
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            const alpha = png.data[idx + 3];
            if (alpha > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (maxX === -1) {
        console.log(`${file}: Completely transparent (${png.width}x${png.height})`);
    } else {
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        console.log(`${file}: dimensions=${png.width}x${png.height}, bbox=(${minX},${minY}) to (${maxX},${maxY}), size=${w}x${h}`);
    }
});
