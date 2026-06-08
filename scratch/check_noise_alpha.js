const fs = require('fs');
const zlib = require('zlib');

function getCornerAlphas(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  let offset = 8;
  let width = 0;
  let height = 0;
  const idatBuffers = [];
  
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatBuffers.push(buffer.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    
    offset += 12 + length;
  }
  
  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);
  
  const bpp = 4;
  const scanlineLength = 1 + width * bpp;
  const pixels = Buffer.alloc(width * height * bpp);
  
  for (let y = 0; y < height; y++) {
    const scanlineStart = y * scanlineLength;
    const filterType = decompressed[scanlineStart];
    const currentScanline = decompressed.slice(scanlineStart + 1, scanlineStart + scanlineLength);
    
    const prevRowStart = (y - 1) * width * bpp;
    const currRowStart = y * width * bpp;
    
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < bpp; c++) {
        const idx = x * bpp + c;
        const val = currentScanline[idx];
        
        let recon = 0;
        const left = x > 0 ? pixels[currRowStart + (x - 1) * bpp + c] : 0;
        const up = y > 0 ? pixels[prevRowStart + x * bpp + c] : 0;
        const leftUp = (x > 0 && y > 0) ? pixels[prevRowStart + (x - 1) * bpp + c] : 0;
        
        if (filterType === 0) recon = val;
        else if (filterType === 1) recon = val + left;
        else if (filterType === 2) recon = val + up;
        else if (filterType === 3) recon = val + Math.floor((left + up) / 2);
        else if (filterType === 4) {
          const p = left + up - leftUp;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - leftUp);
          let paeth = 0;
          if (pa <= pb && pa <= pc) paeth = left;
          else if (pb <= pc) paeth = up;
          else paeth = leftUp;
          recon = val + paeth;
        }
        pixels[currRowStart + idx] = recon & 0xFF;
      }
    }
  }
  
  // Sample top-left 10x10 corner
  console.log(`Top-left 10x10 alpha values for ${filePath}:`);
  for (let y = 0; y < 10; y++) {
    const rowStart = y * width * bpp;
    let rowStr = '';
    for (let x = 0; x < 10; x++) {
      rowStr += pixels[rowStart + x * bpp + 3].toString().padStart(4);
    }
    console.log(rowStr);
  }
}

getCornerAlphas('games/super-mario/assets/Bella_small_idle.png');
