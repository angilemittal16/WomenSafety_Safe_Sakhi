const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const journeyRoutes = require('./routes/journey');
const helplinesRoutes = require('./routes/helplines');
const incidentsRoutes = require('./routes/incidents');
const evidenceRoutes = require('./routes/evidence');
const reportsRoutes = require('./routes/reports');
const devRoutes = require('./routes/dev');
const errorHandler = require('./middleware/errors');

const app = express();

app.use(cors({
  origin: true, // Allow client origin with credentials
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/helplines', helplinesRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dev', devRoutes);
app.use('/dev', devRoutes); // Convenient direct route for outbox

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeSakhi API', time: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
