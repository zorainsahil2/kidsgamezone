const fs = require('fs');
const zlib = require('zlib');

function getPngBounds(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Verify PNG signature
  if (buffer.readUInt32BE(0) !== 0x89504E47 || buffer.readUInt32BE(4) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG file');
  }
  
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatBuffers = [];
  
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
    } else if (type === 'IDAT') {
      idatBuffers.push(buffer.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    
    offset += 12 + length;
  }
  
  if (colorType !== 6 || bitDepth !== 8) {
    console.log(`${path.basename(filePath)} is colorType ${colorType}, bitDepth ${bitDepth} (expected RGBA 8-bit)`);
    // If not standard 8-bit RGBA, return default
    return null;
  }
  
  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);
  
  // De-filter scanlines to get raw pixel bytes
  // For each scanline, byte 0 is filter type.
  // We only care about the Alpha byte (byte 3 of each pixel, 0-indexed: R=0, G=1, B=2, A=3)
  // Let's check filter types. If they are 0 (None), it's easy. If they are others, we must reconstruct the pixels.
  // Actually, to just check if any pixel is non-transparent, let's see. If the image is mostly transparent,
  // even with filtering, any non-zero value in the decompressed data (especially at the alpha position)
  // is highly likely to be non-transparent. But to be 100% accurate, we can implement standard PNG filters!
  // PNG filters: 0=None, 1=Sub, 2=Up, 3=Average, 4=Paeth.
  
  const bpp = 4; // RGBA
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
        
        if (filterType === 0) {
          recon = val;
        } else if (filterType === 1) {
          recon = val + left;
        } else if (filterType === 2) {
          recon = val + up;
        } else if (filterType === 3) {
          recon = val + Math.floor((left + up) / 2);
        } else if (filterType === 4) {
          // Paeth
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
  
  // Now find bounding box of pixels with Alpha > 10 (non-transparent)
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * bpp;
    for (let x = 0; x < width; x++) {
      const alpha = pixels[rowStart + x * bpp + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (maxX >= minX && maxY >= minY) {
    return {
      minX, maxX, minY, maxY,
      w: maxX - minX + 1,
      h: maxY - minY + 1
    };
  }
  return null;
}

const fileToCheck = 'games/super-mario/assets/Bella_small_idle.png';
console.log('Bounds for Bella_small_idle.png:', getPngBounds(fileToCheck));

const fileToCheckBig = 'games/super-mario/assets/Bella_big_idle.png';
console.log('Bounds for Bella_big_idle.png:', getPngBounds(fileToCheckBig));

const enemyFile = 'games/super-mario/assets/Goomba_Walk1.png';
try {
  console.log('Bounds for Goomba_Walk1.png:', getPngBounds(enemyFile));
} catch(e) {
  console.log('Goomba_Walk1 error:', e.message);
}
