const path = require('path');
const fs = require('fs');
const knex = require('knex');
const config = require('./knexfile');

const env = process.env.NODE_ENV || 'development';
const knexConfig = config[env] || config.development;

// Ensure database directory exists if using sqlite
if (knexConfig.connection && knexConfig.connection.filename) {
  const dir = path.dirname(knexConfig.connection.filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = knex(knexConfig);

module.exports = db;
