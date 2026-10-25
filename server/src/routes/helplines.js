const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// National default helplines
const NATIONAL_HELPLINES = [
  { name: 'National Emergency Response (ERC)', number: '112', mode: 'Emergency', is_national: true },
  { name: 'Police Control Room', number: '100', mode: 'Emergency', is_national: true },
  { name: 'Women Helpline (All India)', number: '1091', mode: 'Walking', is_national: true },
  { name: 'Women Helpline (Domestic Abuse)', number: '181', mode: 'Walking', is_national: true },
  { name: 'Railway Protection Security (RPF)', number: '139', mode: 'Railway', is_national: true },
  { name: 'National Highway Emergency', number: '1033', mode: 'Cab', is_national: true },
  { name: 'City Bus & Transit Security', number: '1800-22-1250', mode: 'Bus', is_national: true },
  { name: 'Cyber Crime Reporting Helpline', number: '1930', mode: 'Emergency', is_national: true }
];

router.use(requireAuth);

// GET /helplines
router.get('/', async (req, res, next) => {
  try {
    const userHelplines = await db('helplines')
      .where({ user_id: req.user.id })
      .orWhere({ is_national: true });

    // Combine or fallback to default list if table has no national rows yet
    const combined = [...NATIONAL_HELPLINES];
    for (const h of userHelplines) {
      if (!combined.some(c => c.number === h.number && c.mode === h.mode)) {
        combined.push(h);
      }
    }

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

// POST /helplines (Add custom city/mode helpline)
router.post('/', async (req, res, next) => {
  try {
    const { name, number, mode = 'Walking', city } = req.body;
    if (!name || !number) {
      return res.status(400).json({ error: 'Helpline name and phone number are required.' });
    }

    const id = uuidv4();
    await db('helplines').insert({
      id,
      user_id: req.user.id,
      name: name.trim(),
      number: number.trim(),
      mode: mode.trim(),
      city: city ? city.trim() : null,
      is_national: false
    });

    const created = await db('helplines').where({ id }).first();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE /helplines/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('helplines')
      .where({ id, user_id: req.user.id })
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Helpline not found or cannot delete national helplines.' });
    }

    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
