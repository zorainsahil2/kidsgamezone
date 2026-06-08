const fs = require('fs');
const PNG = require('pngjs').PNG;

const filePath = 'f:/50 games/kidsgamezone/games/super-mario/assets/bella-thin.png';
const data = fs.readFileSync(filePath);
const png = PNG.sync.read(data);

const alphaHistogram = {};
for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    alphaHistogram[a] = (alphaHistogram[a] || 0) + 1;
}

console.log("Alpha value histogram for bella-thin.png:");
const sortedAlphas = Object.keys(alphaHistogram).map(Number).sort((a,b)=>b-a);
sortedAlphas.forEach(a => {
    console.log(`  Alpha ${a}: ${alphaHistogram[a]} pixels`);
});
