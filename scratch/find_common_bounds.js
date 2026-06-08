const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const assetsDir = 'games/super-mario/assets';
const files = fs.readdirSync(assetsDir);

function getPngAlphaBounds(filePath, alphaThreshold = 50) {
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
  
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * bpp;
    for (let x = 0; x < width; x++) {
      const alpha = pixels[rowStart + x * bpp + 3];
      if (alpha >= alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (maxX >= minX && maxY >= minY) {
    return { minX, maxX, minY, maxY };
  }
  return null;
}

let smallUnion = { minX: 1024, maxX: 0, minY: 1024, maxY: 0 };
let bigUnion = { minX: 1024, maxX: 0, minY: 1024, maxY: 0 };

files.forEach(file => {
  if (file.startsWith('Bella_')) {
    const filePath = path.join(assetsDir, file);
    const bounds = getPngAlphaBounds(filePath, 200);
    if (bounds) {
      if (file.includes('small')) {
        smallUnion.minX = Math.min(smallUnion.minX, bounds.minX);
        smallUnion.maxX = Math.max(smallUnion.maxX, bounds.maxX);
        smallUnion.minY = Math.min(smallUnion.minY, bounds.minY);
        smallUnion.maxY = Math.max(smallUnion.maxY, bounds.maxY);
      } else if (file.includes('big')) {
        bigUnion.minX = Math.min(bigUnion.minX, bounds.minX);
        bigUnion.maxX = Math.max(bigUnion.maxX, bounds.maxX);
        bigUnion.minY = Math.min(bigUnion.minY, bounds.minY);
        bigUnion.maxY = Math.max(bigUnion.maxY, bounds.maxY);
      }
    }
  }
});

console.log('Small Union:', smallUnion, 'Width:', smallUnion.maxX - smallUnion.minX + 1, 'Height:', smallUnion.maxY - smallUnion.minY + 1);
console.log('Big Union:', bigUnion, 'Width:', bigUnion.maxX - bigUnion.minX + 1, 'Height:', bigUnion.maxY - bigUnion.minY + 1);
