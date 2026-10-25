const express = require('express');
const router = express.Router();
const { getOutbox, clearOutbox } = require('../services/sms');
const { getThresholds } = require('../services/stationaryWatcher');

// GET /dev/outbox
router.get('/outbox', (req, res) => {
  res.json({
    count: getOutbox().length,
    messages: getOutbox()
  });
});

// POST /dev/outbox/clear
router.post('/outbox/clear', (req, res) => {
  clearOutbox();
  res.json({ success: true, message: 'Outbox cleared.' });
});

// GET /dev/config
router.get('/config', (req, res) => {
  res.json({
    fastDemoMode: process.env.DEMO_FAST_MODE === 'true',
    thresholds: getThresholds(),
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  });
});

module.exports = router;
