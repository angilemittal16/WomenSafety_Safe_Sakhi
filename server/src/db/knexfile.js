const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.resolve(__dirname, '../../data/safeher.sqlite');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_FILENAME ? path.resolve(__dirname, '../../', process.env.DATABASE_FILENAME) : dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('foreign_keys = ON');
        if (typeof cb === 'function') cb();
      }
    }
  },
  production: {
    client: process.env.DATABASE_CLIENT === 'pg' ? 'pg' : 'better-sqlite3',
    connection: process.env.DATABASE_URL || {
      filename: process.env.DATABASE_FILENAME ? path.resolve(__dirname, '../../', process.env.DATABASE_FILENAME) : dbPath
    },
    useNullAsDefault: true
  }
};
