const crypto = require('crypto');
const { Jimp } = require('jimp');

function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute 64-bit difference hash (dHash) using Jimp
 * @param {Buffer} imageBuffer 
 * @returns {Promise<string|null>} 16-hex-char dHash or null if not an image
 */
async function computePHash(imageBuffer) {
  try {
    const image = await Jimp.read(imageBuffer);
    image.resize({ w: 9, h: 8 }).greyscale();

    let hashBits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        // In Jimp v1, getPixelColor returns an integer RGBA
        const leftPixel = image.getPixelColor(x, y);
        const rightPixel = image.getPixelColor(x + 1, y);
        // Compare brightness (since greyscale, R=G=B)
        const leftLuma = (leftPixel >> 24) & 0xff;
        const rightLuma = (rightPixel >> 24) & 0xff;
        hashBits += leftLuma > rightLuma ? '1' : '0';
      }
    }

    // Convert 64 bits to 16-char hex
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = parseInt(hashBits.substring(i, i + 4), 2);
      hex += nibble.toString(16);
    }
    return hex;
  } catch (err) {
    // Non-image or corrupted image format
    return null;
  }
}

/**
 * Compute Hamming distance between two 16-char hex hashes
 * @param {string} hash1 
 * @param {string} hash2 
 * @returns {number}
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const v1 = parseInt(hash1[i], 16);
    const v2 = parseInt(hash2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

module.exports = {
  computeSha256,
  computePHash,
  hammingDistance
};
