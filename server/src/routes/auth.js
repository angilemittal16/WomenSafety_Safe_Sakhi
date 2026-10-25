const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, phone, email, password) are required.' });
    }

    const existing = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    await db('users').insert({
      id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      discreet_mode: false
    });

    const secret = process.env.JWT_SECRET || 'safeher_super_secret_jwt_key_2026';
    const token = jwt.sign({ id, email: email.toLowerCase().trim(), name: name.trim() }, secret, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id, name: name.trim(), phone: phone.trim(), email: email.toLowerCase().trim(), discreet_mode: false }
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const secret = process.env.JWT_SECRET || 'safeher_super_secret_jwt_key_2026';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        discreet_mode: !!user.discreet_mode
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      discreet_mode: !!user.discreet_mode
    });
  } catch (err) {
    next(err);
  }
});

// PUT /auth/me
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { discreet_mode } = req.body;
    await db('users')
      .where({ id: req.user.id })
      .update({ discreet_mode: !!discreet_mode });

    res.json({ success: true, discreet_mode: !!discreet_mode });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/me (Delete all user data)
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Gather all files to securely delete from disk
    const incidents = await db('incidents').where({ user_id: userId }).select('id');
    const incidentIds = incidents.map(i => i.id);

    if (incidentIds.length > 0) {
      const evidenceFiles = await db('evidence').whereIn('incident_id', incidentIds).select('file_path');
      for (const ev of evidenceFiles) {
        if (ev.file_path && fs.existsSync(ev.file_path)) {
          try { fs.unlinkSync(ev.file_path); } catch (e) {}
        }
      }
      const reports = await db('reports').whereIn('incident_id', incidentIds).select('file_path');
      for (const rep of reports) {
        if (rep.file_path && fs.existsSync(rep.file_path)) {
          try { fs.unlinkSync(rep.file_path); } catch (e) {}
        }
      }
    }

    const sosEvents = await db('sos_events').where({ user_id: userId }).select('id');
    const sosIds = sosEvents.map(s => s.id);
    if (sosIds.length > 0) {
      const sosMedia = await db('sos_media').whereIn('sos_event_id', sosIds).select('file_path');
      for (const m of sosMedia) {
        if (m.file_path && fs.existsSync(m.file_path)) {
          try { fs.unlinkSync(m.file_path); } catch (e) {}
        }
      }
    }

    // 2. Cascade delete database records
    await db('location_logs').where({ user_id: userId }).del();
    if (sosIds.length > 0) {
      await db('sos_media').whereIn('sos_event_id', sosIds).del();
    }
    await db('sos_events').where({ user_id: userId }).del();
    await db('journeys').where({ user_id: userId }).del();
    if (incidentIds.length > 0) {
      await db('evidence').whereIn('incident_id', incidentIds).del();
      await db('reports').whereIn('incident_id', incidentIds).del();
    }
    await db('incidents').where({ user_id: userId }).del();
    await db('emergency_contacts').where({ user_id: userId }).del();
    await db('helplines').where({ user_id: userId }).del();
    await db('users').where({ id: userId }).del();

    console.log(`[Privacy / Account] Wiped all data and evidence files for user ${userId}`);
    res.json({ success: true, message: 'All personal data, locations, and evidence files have been permanently erased.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
