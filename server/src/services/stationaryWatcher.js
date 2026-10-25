const db = require('../db/connection');
const { sendSms } = require('./sms');

let watcherInterval = null;

// Thresholds in seconds: demo fast mode is 15s / 30s; normal mode is 300s (5m) / 600s (10m)
function getThresholds() {
  const isDemoFast = process.env.DEMO_FAST_MODE === 'true';
  return {
    PROMPT_SECONDS: isDemoFast ? 15 : 300,
    ALERT_SECONDS: isDemoFast ? 30 : 600
  };
}

async function checkStationaryJourneys() {
  try {
    const { PROMPT_SECONDS, ALERT_SECONDS } = getThresholds();
    const now = Date.now();

    // Query active journeys
    const activeJourneys = await db('journeys')
      .where({ status: 'active' })
      .select('*');

    for (const journey of activeJourneys) {
      const lastMovedTime = new Date(journey.last_moved_at || journey.started_at).getTime();
      const elapsedSeconds = (now - lastMovedTime) / 1000;

      // 1. Mark stationary prompt needed if stationary >= PROMPT_SECONDS
      if (elapsedSeconds >= PROMPT_SECONDS && !journey.stationary_prompt_sent) {
        await db('journeys')
          .where({ id: journey.id })
          .update({ stationary_prompt_sent: true });
        console.log(`[Stationary Watcher] Journey ${journey.id} stationary for ${Math.round(elapsedSeconds)}s. Prompt triggered.`);
      }

      // 2. Fire Auto-SMS alert if stationary >= ALERT_SECONDS and no response
      if (elapsedSeconds >= ALERT_SECONDS && !journey.stationary_alert_sent) {
        console.log(`[Stationary Watcher] Journey ${journey.id} stationary for ${Math.round(elapsedSeconds)}s! Firing Emergency Auto-SMS.`);

        // Find user & emergency contacts
        const user = await db('users').where({ id: journey.user_id }).first();
        const contacts = await db('emergency_contacts').where({ user_id: journey.user_id });

        const userName = user ? user.name : 'SafeSakhi User';
        const mapsUrl = (journey.last_lat && journey.last_lng)
          ? `https://maps.google.com/?q=${journey.last_lat},${journey.last_lng}`
          : 'Location pending';

        const alertMessage = `ALERT: ${userName} has been stationary at the same place for ${process.env.DEMO_FAST_MODE === 'true' ? '30 seconds (demo)' : '10 minutes'} during a journey to ${journey.destination}. Tracking link: ${mapsUrl}`;

        for (const contact of contacts) {
          await sendSms({
            to: contact.phone,
            body: alertMessage,
            isWhatsApp: contact.whatsapp
          });
        }

        await db('journeys')
          .where({ id: journey.id })
          .update({
            stationary_alert_sent: true,
            status: 'alert'
          });
      }
    }
  } catch (err) {
    console.error('[Stationary Watcher Error]:', err.message);
  }
}

function startStationaryWatcher() {
  if (watcherInterval) clearInterval(watcherInterval);
  const intervalMs = process.env.DEMO_FAST_MODE === 'true' ? 3000 : 15000;
  watcherInterval = setInterval(checkStationaryJourneys, intervalMs);
  console.log(`Stationary Watcher started (interval: ${intervalMs}ms, fast demo mode: ${process.env.DEMO_FAST_MODE === 'true'}).`);
}

function stopStationaryWatcher() {
  if (watcherInterval) clearInterval(watcherInterval);
}

module.exports = {
  startStationaryWatcher,
  stopStationaryWatcher,
  getThresholds,
  checkStationaryJourneys
};
