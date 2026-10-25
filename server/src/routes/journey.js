const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const { sendSms } = require('../services/sms');

// Haversine distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Public: Track journey by token (for emergency contacts)
router.get('/track/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const journey = await db('journeys').where({ share_token: token }).first();
    if (!journey) {
      return res.status(404).json({ error: 'Journey tracking link not found or expired.' });
    }

    const user = await db('users').where({ id: journey.user_id }).select('name').first();
    const trail = await db('location_logs')
      .where({ journey_id: journey.id })
      .orderBy('recorded_at', 'asc')
      .select('lat', 'lng', 'accuracy', 'recorded_at');

    res.json({
      journey: {
        id: journey.id,
        destination: journey.destination,
        dest_lat: journey.dest_lat,
        dest_lng: journey.dest_lng,
        eta: journey.eta,
        status: journey.status,
        started_at: journey.started_at,
        ended_at: journey.ended_at,
        last_lat: journey.last_lat,
        last_lng: journey.last_lng
      },
      userName: user ? user.name : 'SafeSakhi User',
      trail
    });
  } catch (err) {
    next(err);
  }
});

// Authenticated routes below
router.use(requireAuth);

// GET /journey/active
router.get('/active', async (req, res, next) => {
  try {
    const active = await db('journeys')
      .where({ user_id: req.user.id, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    res.json(active || null);
  } catch (err) {
    next(err);
  }
});

// POST /journey/start
router.post('/start', async (req, res, next) => {
  try {
    const { destination, dest_lat, dest_lng, eta, lat, lng } = req.body;
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required.' });
    }

    // End any existing active journeys for this user first
    await db('journeys')
      .where({ user_id: req.user.id, status: 'active' })
      .update({ status: 'completed', ended_at: new Date().toISOString() });

    const id = uuidv4();
    const shareToken = crypto.randomBytes(16).toString('hex');
    const startedAt = new Date().toISOString();

    await db('journeys').insert({
      id,
      user_id: req.user.id,
      destination: destination.trim(),
      dest_lat: dest_lat || null,
      dest_lng: dest_lng || null,
      eta: eta || 'Calculating...',
      status: 'active',
      share_token: shareToken,
      started_at: startedAt,
      last_moved_at: startedAt,
      last_lat: lat || null,
      last_lng: lng || null,
      stationary_prompt_sent: false,
      stationary_alert_sent: false
    });

    if (lat && lng) {
      await db('location_logs').insert({
        id: uuidv4(),
        user_id: req.user.id,
        journey_id: id,
        lat,
        lng,
        recorded_at: startedAt
      });
    }

    // Send initial SMS to emergency contacts
    const contacts = await db('emergency_contacts').where({ user_id: req.user.id });
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const trackingUrl = `${clientOrigin}/#/track/journey/${shareToken}`;

    const smsBody = `${req.user.name} started a journey to "${destination.trim()}" (ETA: ${eta || 'in progress'}). Track live: ${trackingUrl}`;

    for (const contact of contacts) {
      await sendSms({
        to: contact.phone,
        body: smsBody,
        isWhatsApp: contact.whatsapp
      });
    }

    const journey = await db('journeys').where({ id }).first();
    res.status(201).json({
      ...journey,
      trackingUrl
    });
  } catch (err) {
    next(err);
  }
});

// POST /journey/update-location
router.post('/update-location', async (req, res, next) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordinates lat and lng are required.' });
    }

    const journey = await db('journeys')
      .where({ user_id: req.user.id, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    if (!journey) {
      return res.status(404).json({ error: 'No active journey found.' });
    }

    const now = new Date().toISOString();
    const distance = getDistanceMeters(journey.last_lat, journey.last_lng, lat, lng);

    const updateData = {
      last_lat: lat,
      last_lng: lng
    };

    // If movement > 50 meters, reset stationary state
    if (distance >= 50 || !journey.last_lat) {
      updateData.last_moved_at = now;
      updateData.stationary_prompt_sent = false;
      updateData.stationary_alert_sent = false;
    }

    await db('journeys').where({ id: journey.id }).update(updateData);

    await db('location_logs').insert({
      id: uuidv4(),
      user_id: req.user.id,
      journey_id: journey.id,
      lat,
      lng,
      accuracy: accuracy || null,
      recorded_at: now
    });

    res.json({
      success: true,
      distanceMovedMeters: Math.round(distance),
      stationaryPromptSent: !!journey.stationary_prompt_sent
    });
  } catch (err) {
    next(err);
  }
});

// POST /journey/check-in ("Are you safe?" prompt response)
router.post('/check-in', async (req, res, next) => {
  try {
    const { safe } = req.body;
    const journey = await db('journeys')
      .where({ user_id: req.user.id, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    if (!journey) {
      return res.status(404).json({ error: 'No active journey found.' });
    }

    if (safe) {
      // User tapped "Yes, I'm safe"
      await db('journeys').where({ id: journey.id }).update({
        last_moved_at: new Date().toISOString(),
        stationary_prompt_sent: false,
        stationary_alert_sent: false
      });
      console.log(`[Journey Check-In] User ${req.user.name} confirmed SAFE. Reset stationary timer.`);
      return res.json({ success: true, message: 'Stationary timer reset. Stay safe!' });
    } else {
      // User tapped "I'm not safe"
      await db('journeys').where({ id: journey.id }).update({
        status: 'alert',
        stationary_alert_sent: true
      });

      const contacts = await db('emergency_contacts').where({ user_id: req.user.id });
      const mapsUrl = (journey.last_lat && journey.last_lng)
        ? `https://maps.google.com/?q=${journey.last_lat},${journey.last_lng}`
        : '';
      const alertMsg = `EMERGENCY ALERT: ${req.user.name} reported "I'M NOT SAFE" during journey to ${journey.destination}! Location: ${mapsUrl}`;

      for (const contact of contacts) {
        await sendSms({ to: contact.phone, body: alertMsg, isWhatsApp: contact.whatsapp });
      }

      console.log(`[Journey Check-In] User ${req.user.name} reported NOT SAFE! Dispatched emergency alerts.`);
      return res.json({ success: true, alertTriggered: true });
    }
  } catch (err) {
    next(err);
  }
});

// POST /journey/stop
router.post('/stop', async (req, res, next) => {
  try {
    const journey = await db('journeys')
      .where({ user_id: req.user.id, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    if (!journey) {
      return res.status(404).json({ error: 'No active journey to stop.' });
    }

    await db('journeys').where({ id: journey.id }).update({
      status: 'completed',
      ended_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Journey stopped successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
