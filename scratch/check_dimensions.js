const fs = require('fs');
const path = require('path');

const assetsDir = 'games/super-mario/assets';
const files = fs.readdirSync(assetsDir);

files.forEach(file => {
  if (path.extname(file).toLowerCase() === '.png') {
    const filePath = path.join(assetsDir, file);
    const buffer = fs.readFileSync(filePath);
    
    // Check if it's a valid PNG
    if (buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A) {
      // IHDR starts at offset 12, width is at offset 16, height at offset 20
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`${file}: ${width}x${height} (${buffer.length} bytes)`);
    } else {
      console.log(`${file}: NOT A VALID PNG`);
    }
  }
});
