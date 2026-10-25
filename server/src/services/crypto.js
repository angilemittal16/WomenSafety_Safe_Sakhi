const crypto = require('crypto');

// 32-byte encryption key derivation
function getKey() {
  const envKey = process.env.EVIDENCE_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  if (envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypt a buffer with AES-256-GCM
 * @param {Buffer} buffer 
 * @returns {{ encryptedBuffer: Buffer, iv: string, authTag: string }}
 */
function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt an AES-256-GCM encrypted buffer
 * @param {Buffer} encryptedBuffer 
 * @param {string} ivHex 
 * @param {string} authTagHex 
 * @returns {Buffer}
 */
function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getKey();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

module.exports = {
  encryptBuffer,
  decryptBuffer
};
