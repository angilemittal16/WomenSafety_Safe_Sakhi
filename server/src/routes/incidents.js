const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /incidents
router.get('/', async (req, res, next) => {
  try {
    const incidents = await db('incidents')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    // Attach evidence count for each incident
    const list = await Promise.all(incidents.map(async (inc) => {
      const countRes = await db('evidence').where({ incident_id: inc.id }).count('id as count').first();
      return {
        ...inc,
        evidence_count: countRes ? parseInt(countRes.count, 10) : 0
      };
    }));

    res.json(list);
  } catch (err) {
    next(err);
  }
});

// POST /incidents
router.post('/', async (req, res, next) => {
  try {
    const { title, platform, accused_handle, summary } = req.body;
    if (!title || !platform) {
      return res.status(400).json({ error: 'Title and platform are required.' });
    }

    const id = uuidv4();
    await db('incidents').insert({
      id,
      user_id: req.user.id,
      title: title.trim(),
      platform: platform.trim(),
      accused_handle: accused_handle ? accused_handle.trim() : null,
      summary: summary ? summary.trim() : null,
      created_at: new Date().toISOString()
    });

    const incident = await db('incidents').where({ id }).first();
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
});

// GET /incidents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await db('incidents').where({ id, user_id: req.user.id }).first();
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });

    const evidence = await db('evidence')
      .where({ incident_id: id })
      .orderBy('occurred_at', 'asc');

    const report = await db('reports').where({ incident_id: id }).first();

    res.json({
      incident,
      evidence,
      report
    });
  } catch (err) {
    next(err);
  }
});

// GET /incidents/:id/timeline
router.get('/:id/timeline', async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await db('incidents').where({ id, user_id: req.user.id }).first();
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });

    const timeline = await db('evidence')
      .where({ incident_id: id })
      .orderBy('occurred_at', 'asc');

    res.json({
      incident,
      timeline
    });
  } catch (err) {
    next(err);
  }
});

// PUT /incidents/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, platform, accused_handle, summary } = req.body;

    const incident = await db('incidents').where({ id, user_id: req.user.id }).first();
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });

    await db('incidents').where({ id }).update({
      title: title ? title.trim() : incident.title,
      platform: platform ? platform.trim() : incident.platform,
      accused_handle: accused_handle !== undefined ? accused_handle.trim() : incident.accused_handle,
      summary: summary !== undefined ? summary.trim() : incident.summary
    });

    const updated = await db('incidents').where({ id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /incidents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await db('incidents').where({ id, user_id: req.user.id }).first();
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });

    // Clean up disk files
    const evidenceItems = await db('evidence').where({ incident_id: id }).select('file_path');
    for (const item of evidenceItems) {
      if (item.file_path && fs.existsSync(item.file_path)) {
        try { fs.unlinkSync(item.file_path); } catch (e) {}
      }
    }

    const report = await db('reports').where({ incident_id: id }).first();
    if (report && report.file_path && fs.existsSync(report.file_path)) {
      try { fs.unlinkSync(report.file_path); } catch (e) {}
    }

    await db('evidence').where({ incident_id: id }).del();
    await db('reports').where({ incident_id: id }).del();
    await db('incidents').where({ id }).del();

    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
