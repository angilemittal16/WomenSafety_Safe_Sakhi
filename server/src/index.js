const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { createSchema } = require('./db/schema');
const { startStationaryWatcher } = require('./services/stationaryWatcher');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Ensure database schema is ready
    await createSchema();

    // 2. Start server-side stationary watcher for journeys
    startStationaryWatcher();

    // 3. Listen on port
    app.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`  SafeSakhi API Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Fast Demo Mode: ${process.env.DEMO_FAST_MODE === 'true'}`);
      console.log(`  Outbox Dev Inspector: http://localhost:${PORT}/dev/outbox`);
      console.log(`=================================================\n`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
