const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { encryptBuffer, decryptBuffer } = require('../services/crypto');
const { computeSha256, computePHash, hammingDistance } = require('../services/hashing');

router.use(requireAuth);

// POST /evidence
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const {
      incident_id,
      occurred_at,
      description,
      type = 'image',
      url
    } = req.body;

    if (!incident_id) {
      return res.status(400).json({ error: 'incident_id is required.' });
    }

    // Verify ownership of the incident
    const incident = await db('incidents')
      .where({ id: incident_id, user_id: req.user.id })
      .first();

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found or unauthorized.' });
    }

    let filePath = null;
    let originalName = null;
    let sha256 = null;
    let phash = null;
    let iv = null;
    let authTag = null;
    let duplicateOf = null;

    if (type === 'url') {
      if (!url) return res.status(400).json({ error: 'URL is required for URL evidence type.' });
      sha256 = computeSha256(Buffer.from(url));
    } else if (req.file && req.file.buffer) {
      originalName = req.file.originalname;
      const fileBuffer = req.file.buffer;

      // 1. Compute SHA-256
      sha256 = computeSha256(fileBuffer);

      // 2. Compute perceptual hash if image
      if (type === 'image' || req.file.mimetype.startsWith('image/')) {
        phash = await computePHash(fileBuffer);
      }

      // 3. Duplicate and near-duplicate detection against existing evidence in this incident
      const existingEvidence = await db('evidence')
        .where({ incident_id })
        .orderBy('created_at', 'asc');

      for (let i = 0; i < existingEvidence.length; i++) {
        const item = existingEvidence[i];
        const itemNum = i + 1;

        if (item.sha256 && item.sha256 === sha256) {
          duplicateOf = `Duplicate of Evidence #${itemNum} (${item.original_name || 'Item'})`;
          break;
        } else if (phash && item.phash) {
          const dist = hammingDistance(phash, item.phash);
          if (dist <= 10) {
            duplicateOf = `Near-duplicate (${dist <= 3 ? 'high' : 'moderate'} visual similarity) of Evidence #${itemNum}`;
            break;
          }
        }
      }

      // 4. Encrypt file with AES-256-GCM before writing to disk
      const encryptedResult = encryptBuffer(fileBuffer);
      iv = encryptedResult.iv;
      authTag = encryptedResult.authTag;

      const uploadsDir = path.resolve(__dirname, '../../uploads/evidence');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileId = uuidv4();
      const storedFileName = `${fileId}.enc`;
      filePath = path.join(uploadsDir, storedFileName);

      fs.writeFileSync(filePath, encryptedResult.encryptedBuffer);
    } else {
      return res.status(400).json({ error: 'Please provide a file or URL.' });
    }

    const id = uuidv4();
    await db('evidence').insert({
      id,
      incident_id,
      file_path: filePath,
      original_name: originalName,
      sha256,
      phash,
      type,
      url: url || null,
      occurred_at: occurred_at || new Date().toISOString(),
      description: description ? description.trim() : null,
      duplicate_of: duplicateOf,
      iv,
      auth_tag: authTag,
      created_at: new Date().toISOString()
    });

    const created = await db('evidence').where({ id }).first();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /evidence/:id/file (Decrypts and streams to authenticated owner)
router.get('/:id/file', async (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = await db('evidence as e')
      .join('incidents as i', 'e.incident_id', 'i.id')
      .where({ 'e.id': id, 'i.user_id': req.user.id })
      .select('e.*')
      .first();

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence item not found.' });
    }

    if (evidence.type === 'url') {
      return res.redirect(evidence.url);
    }

    if (!evidence.file_path || !fs.existsSync(evidence.file_path)) {
      return res.status(404).json({ error: 'Evidence file not found on disk.' });
    }

    const encryptedData = fs.readFileSync(evidence.file_path);
    let decrypted = encryptedData;
    if (evidence.iv && evidence.auth_tag) {
      decrypted = decryptBuffer(encryptedData, evidence.iv, evidence.auth_tag);
    }

    // Infer content type
    let contentType = 'application/octet-stream';
    const ext = path.extname(evidence.original_name || '').toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.send(decrypted);
  } catch (err) {
    next(err);
  }
});

// GET /evidence/:id/thumb
router.get('/:id/thumb', async (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = await db('evidence as e')
      .join('incidents as i', 'e.incident_id', 'i.id')
      .where({ 'e.id': id, 'i.user_id': req.user.id })
      .select('e.*')
      .first();

    if (!evidence || !evidence.file_path || !fs.existsSync(evidence.file_path)) {
      return res.status(404).json({ error: 'Thumbnail not available.' });
    }

    const encryptedData = fs.readFileSync(evidence.file_path);
    let decrypted = encryptedData;
    if (evidence.iv && evidence.auth_tag) {
      decrypted = decryptBuffer(encryptedData, evidence.iv, evidence.auth_tag);
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(decrypted);
  } catch (err) {
    next(err);
  }
});

// PUT /evidence/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, occurred_at, url } = req.body;

    const evidence = await db('evidence as e')
      .join('incidents as i', 'e.incident_id', 'i.id')
      .where({ 'e.id': id, 'i.user_id': req.user.id })
      .select('e.*')
      .first();

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence item not found.' });
    }

    await db('evidence').where({ id }).update({
      description: description !== undefined ? description.trim() : evidence.description,
      occurred_at: occurred_at || evidence.occurred_at,
      url: url !== undefined ? url : evidence.url
    });

    const updated = await db('evidence').where({ id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /evidence/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = await db('evidence as e')
      .join('incidents as i', 'e.incident_id', 'i.id')
      .where({ 'e.id': id, 'i.user_id': req.user.id })
      .select('e.*')
      .first();

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence item not found.' });
    }

    if (evidence.file_path && fs.existsSync(evidence.file_path)) {
      try { fs.unlinkSync(evidence.file_path); } catch (e) {}
    }

    await db('evidence').where({ id }).del();
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
