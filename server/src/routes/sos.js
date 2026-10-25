const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { encryptBuffer, decryptBuffer } = require('../services/crypto');
const { sendSms } = require('../services/sms');

// Public route: Live Tracking by token (for emergency contacts)
router.get('/track/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const sosEvent = await db('sos_events').where({ share_token: token }).first();
    if (!sosEvent) {
      return res.status(404).json({ error: 'Tracking link not found or expired.' });
    }

    const user = await db('users').where({ id: sosEvent.user_id }).select('name', 'phone').first();
    const locations = await db('location_logs')
      .where({ sos_event_id: sosEvent.id })
      .orderBy('recorded_at', 'asc')
      .select('lat', 'lng', 'accuracy', 'recorded_at');

    const mediaList = await db('sos_media')
      .where({ sos_event_id: sosEvent.id })
      .orderBy('created_at', 'desc')
      .select('id', 'kind', 'created_at');

    res.json({
      sos: {
        id: sosEvent.id,
        type: sosEvent.type,
        status: sosEvent.status,
        started_at: sosEvent.started_at,
        ended_at: sosEvent.ended_at,
        last_lat: sosEvent.last_lat,
        last_lng: sosEvent.last_lng
      },
      user: {
        name: user ? user.name : 'SafeSakhi User'
      },
      locations,
      media: mediaList.map(m => ({
        id: m.id,
        kind: m.kind,
        created_at: m.created_at,
        url: `/api/sos/media/${m.id}`
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Public route: Stream decrypted SOS media (audio clip / snapshot) for contact tracking
router.get('/media/:mediaId', async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const media = await db('sos_media').where({ id: mediaId }).first();
    if (!media || !media.file_path || !fs.existsSync(media.file_path)) {
      return res.status(404).json({ error: 'Media not found.' });
    }

    const encryptedData = fs.readFileSync(media.file_path);
    const decrypted = (media.iv && media.auth_tag)
      ? decryptBuffer(encryptedData, media.iv, media.auth_tag)
      : encryptedData;

    const contentType = media.kind === 'audio' ? 'audio/webm' : 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.send(decrypted);
  } catch (err) {
    next(err);
  }
});

// Authenticated routes below
router.use(requireAuth);

// GET /sos/active
router.get('/active', async (req, res, next) => {
  try {
    const activeSos = await db('sos_events')
      .where({ user_id: req.user.id, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    if (!activeSos) return res.json(null);

    const locations = await db('location_logs')
      .where({ sos_event_id: activeSos.id })
      .orderBy('recorded_at', 'desc')
      .limit(20);

    res.json({
      ...activeSos,
      locations
    });
  } catch (err) {
    next(err);
  }
});

// POST /sos
router.post('/', async (req, res, next) => {
  try {
    const { type = 'sos', lat, lng } = req.body;
    const id = uuidv4();
    const shareToken = crypto.randomBytes(16).toString('hex');
    const startedAt = new Date().toISOString();

    await db('sos_events').insert({
      id,
      user_id: req.user.id,
      type,
      status: 'active',
      share_token: shareToken,
      started_at: startedAt,
      last_lat: lat || null,
      last_lng: lng || null
    });

    if (lat && lng) {
      await db('location_logs').insert({
        id: uuidv4(),
        user_id: req.user.id,
        sos_event_id: id,
        lat,
        lng,
        recorded_at: startedAt
      });
    }

    // ERC / 112 stub integration adapter
    if (type === '112') {
      console.log(`[112 Helpline ERC Adapter] Forwarded emergency call & telemetry for user ${req.user.name} (${req.user.id}) to Emergency Response Center stub.`);
    }

    // Notify all emergency contacts
    const contacts = await db('emergency_contacts').where({ user_id: req.user.id });
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const trackUrl = `${clientOrigin}/#/track/sos/${shareToken}`;
    const mapsUrl = (lat && lng) ? `https://maps.google.com/?q=${lat},${lng}` : null;

    let smsBody = `EMERGENCY ALERT: ${req.user.name} triggered ${type === '112' ? '112 Helpline' : 'SOS'}!`;
    if (mapsUrl) smsBody += ` Maps: ${mapsUrl}`;
    smsBody += ` Live Audio/Trail: ${trackUrl}`;

    for (const contact of contacts) {
      await sendSms({
        to: contact.phone,
        body: smsBody,
        isWhatsApp: contact.whatsapp
      });
    }

    res.status(201).json({
      id,
      type,
      status: 'active',
      shareToken,
      trackingUrl: trackUrl,
      notifiedContactsCount: contacts.length
    });
  } catch (err) {
    next(err);
  }
});

// POST /sos/:id/location
router.post('/:id/location', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng, accuracy } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const sos = await db('sos_events').where({ id, user_id: req.user.id }).first();
    if (!sos) return res.status(404).json({ error: 'SOS event not found.' });

    const logId = uuidv4();
    const recordedAt = new Date().toISOString();

    await db('location_logs').insert({
      id: logId,
      user_id: req.user.id,
      sos_event_id: id,
      lat,
      lng,
      accuracy: accuracy || null,
      recorded_at: recordedAt
    });

    await db('sos_events').where({ id }).update({
      last_lat: lat,
      last_lng: lng
    });

    res.json({ success: true, logId });
  } catch (err) {
    next(err);
  }
});

// POST /sos/:id/media (Multer encrypted upload)
router.post('/:id/media', upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const kind = req.body.kind || 'audio'; // audio or snapshot

    const sos = await db('sos_events').where({ id, user_id: req.user.id }).first();
    if (!sos) return res.status(404).json({ error: 'SOS event not found.' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No media file received.' });
    }

    // Encrypt at rest with AES-256-GCM
    const { encryptedBuffer, iv, authTag } = encryptBuffer(req.file.buffer);

    const uploadsDir = path.resolve(__dirname, '../../uploads/sos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const mediaId = uuidv4();
    const filename = `${mediaId}_${kind}.enc`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, encryptedBuffer);

    await db('sos_media').insert({
      id: mediaId,
      sos_event_id: id,
      kind,
      file_path: filePath,
      iv,
      auth_tag: authTag,
      created_at: new Date().toISOString()
    });

    console.log(`[SOS Media] Stored encrypted ${kind} (${req.file.buffer.length} bytes) for SOS ${id}`);

    res.status(201).json({
      success: true,
      mediaId,
      kind
    });
  } catch (err) {
    next(err);
  }
});

// POST /sos/:id/end
router.post('/:id/end', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sos = await db('sos_events').where({ id, user_id: req.user.id }).first();
    if (!sos) return res.status(404).json({ error: 'SOS event not found.' });

    await db('sos_events').where({ id }).update({
      status: 'ended',
      ended_at: new Date().toISOString()
    });

    // Notify contacts that user is safe now
    const contacts = await db('emergency_contacts').where({ user_id: req.user.id });
    const safeMsg = `SAFESAKHI UPDATE: ${req.user.name} has marked themselves safe. The alert has ended.`;
    for (const contact of contacts) {
      await sendSms({ to: contact.phone, body: safeMsg, isWhatsApp: contact.whatsapp });
    }

    res.json({ success: true, message: 'Alert ended. Contacts have been informed you are safe.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
