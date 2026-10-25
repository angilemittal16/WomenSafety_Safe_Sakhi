const multer = require('multer');

// Store in memory so we can hash and encrypt prior to writing to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  }
});

module.exports = upload;
