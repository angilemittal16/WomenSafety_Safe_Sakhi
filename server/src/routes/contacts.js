const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /contacts
router.get('/', async (req, res, next) => {
  try {
    const contacts = await db('emergency_contacts')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'asc');
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

// POST /contacts
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, whatsapp, relationship } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const id = uuidv4();
    await db('emergency_contacts').insert({
      id,
      user_id: req.user.id,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: !!whatsapp,
      relationship: relationship ? relationship.trim() : null
    });

    const contact = await db('emergency_contacts').where({ id }).first();
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
});

// PUT /contacts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, whatsapp, relationship } = req.body;

    const contact = await db('emergency_contacts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    await db('emergency_contacts')
      .where({ id })
      .update({
        name: name ? name.trim() : contact.name,
        phone: phone ? phone.trim() : contact.phone,
        whatsapp: whatsapp !== undefined ? !!whatsapp : contact.whatsapp,
        relationship: relationship !== undefined ? relationship : contact.relationship
      });

    const updated = await db('emergency_contacts').where({ id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /contacts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('emergency_contacts')
      .where({ id, user_id: req.user.id })
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
