const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const dir = 'f:/50 games/kidsgamezone/games/super-mario/assets/';
const files = ['bella-thin.png', 'bella-fat.png', 'collectibles.png', 'enemies.png', 'tileset.png'];

files.forEach(file => {
    const filePath = path.join(dir, file);
    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);
    
    const rowCounts = new Array(png.height).fill(0);
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            if (png.data[idx + 3] > 10) { // threshold of alpha > 10
                rowCounts[y]++;
            }
        }
    }
    
    // Find active rows (where rowCounts > 10 pixels to filter noise)
    let activeRanges = [];
    let startY = -1;
    for (let y = 0; y < png.height; y++) {
        if (rowCounts[y] > 10) {
            if (startY === -1) startY = y;
        } else {
            if (startY !== -1) {
                activeRanges.push([startY, y - 1]);
                startY = -1;
            }
        }
    }
    if (startY !== -1) {
        activeRanges.push([startY, png.height - 1]);
    }
    
    console.log(`${file}: Active row ranges: ${activeRanges.map(r => `[${r[0]} to ${r[1]}]`).join(', ')}`);
});
