const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');
const { generateIncidentPdf } = require('../services/pdf');

router.use(requireAuth);

// POST /reports/:incidentId (generate & save report)
router.post('/:incidentId', async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { edits = {} } = req.body;

    const incident = await db('incidents')
      .where({ id: incidentId, user_id: req.user.id })
      .first();

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    const evidenceList = await db('evidence')
      .where({ incident_id: incidentId })
      .orderBy('occurred_at', 'asc');

    const reportsDir = path.resolve(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportId = uuidv4();
    const pdfFileName = `Report_${incident.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, pdfFileName);
    const writeStream = fs.createWriteStream(filePath);

    await generateIncidentPdf(incident, evidenceList, edits, writeStream);

    // Upsert report record
    const existing = await db('reports').where({ incident_id: incidentId }).first();
    if (existing) {
      if (existing.file_path && fs.existsSync(existing.file_path)) {
        try { fs.unlinkSync(existing.file_path); } catch (e) {}
      }
      await db('reports').where({ incident_id: incidentId }).update({
        id: reportId,
        file_path: filePath,
        edits_json: JSON.stringify(edits),
        generated_at: new Date().toISOString()
      });
    } else {
      await db('reports').insert({
        id: reportId,
        incident_id: incidentId,
        file_path: filePath,
        edits_json: JSON.stringify(edits),
        generated_at: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      reportId,
      incidentId,
      fileName: pdfFileName,
      downloadUrl: `/api/reports/${reportId}/export`
    });
  } catch (err) {
    next(err);
  }
});

// GET /reports/:id/export (Download PDF)
router.get('/:id/export', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check report by report id or incident id
    let report = await db('reports as r')
      .join('incidents as i', 'r.incident_id', 'i.id')
      .where({ 'r.id': id, 'i.user_id': req.user.id })
      .select('r.*', 'i.title')
      .first();

    if (!report) {
      report = await db('reports as r')
        .join('incidents as i', 'r.incident_id', 'i.id')
        .where({ 'r.incident_id': id, 'i.user_id': req.user.id })
        .select('r.*', 'i.title')
        .first();
    }

    if (!report || !report.file_path || !fs.existsSync(report.file_path)) {
      return res.status(404).json({ error: 'Report PDF not found. Please generate the report first.' });
    }

    const safeTitle = (report.title || 'SafeSakhi_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const downloadName = `SafeSakhi_Evidence_${safeTitle}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    const readStream = fs.createReadStream(report.file_path);
    readStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
