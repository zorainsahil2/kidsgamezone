const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const filePath = 'f:/50 games/kidsgamezone/games/super-mario/assets/bella-thin.png';
const data = fs.readFileSync(filePath);
const png = PNG.sync.read(data);

const rowCounts = new Array(png.height).fill(0);
const colCounts = new Array(png.width).fill(0);

for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const alpha = png.data[idx + 3];
        if (alpha > 0) {
            rowCounts[y]++;
            colCounts[x]++;
        }
    }
}

// Print rows with non-zero pixels (group them to summarize)
console.log("--- Row Analysis ---");
let inRange = false;
let startY = -1;
for (let y = 0; y < png.height; y++) {
    if (rowCounts[y] > 0) {
        if (!inRange) {
            startY = y;
            inRange = true;
        }
    } else {
        if (inRange) {
            console.log(`Rows ${startY} to ${y - 1}: pixel count average = ${Math.round(rowCounts.slice(startY, y).reduce((a,b)=>a+b, 0) / (y - startY))}`);
            inRange = false;
        }
    }
}
if (inRange) {
    console.log(`Rows ${startY} to ${png.height - 1}: pixel count average = ${Math.round(rowCounts.slice(startY).reduce((a,b)=>a+b, 0) / (png.height - startY))}`);
}

console.log("\n--- Column Analysis ---");
inRange = false;
let startX = -1;
for (let x = 0; x < png.width; x++) {
    if (colCounts[x] > 0) {
        if (!inRange) {
            startX = x;
            inRange = true;
        }
    } else {
        if (inRange) {
            console.log(`Cols ${startX} to ${x - 1}: pixel count average = ${Math.round(colCounts.slice(startX, x).reduce((a,b)=>a+b, 0) / (x - startX))}`);
            inRange = false;
        }
    }
}
if (inRange) {
    console.log(`Cols ${startX} to ${png.width - 1}: pixel count average = ${Math.round(colCounts.slice(startX).reduce((a,b)=>a+b, 0) / (png.width - startX))}`);
}
