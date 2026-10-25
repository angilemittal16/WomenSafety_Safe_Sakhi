let outbox = [];

async function sendSms({ to, body, isWhatsApp = false }) {
  const timestamp = new Date().toISOString();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = isWhatsApp ? 'WhatsApp' : 'SMS';

  // Check if Twilio is configured
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      // Lazy load Twilio if configured
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const from = isWhatsApp ? `whatsapp:${TWILIO_PHONE_NUMBER}` : TWILIO_PHONE_NUMBER;
      const recipient = isWhatsApp ? `whatsapp:${to}` : to;
      const result = await twilio.messages.create({
        body,
        from,
        to: recipient
      });
      const record = {
        id,
        to,
        body,
        channel,
        status: 'sent',
        externalId: result.sid,
        mocked: false,
        timestamp
      };
      outbox.unshift(record);
      console.log(`[Twilio ${channel}] Sent to ${to}: "${body}" (SID: ${result.sid})`);
      return record;
    } catch (err) {
      console.error(`[Twilio Error] Failed to send to ${to}:`, err.message);
      // Fallback to mock recording
    }
  }

  // Mock Provider
  const record = {
    id,
    to,
    body,
    channel,
    status: 'delivered',
    mocked: true,
    timestamp
  };
  outbox.unshift(record);
  if (outbox.length > 200) outbox.pop();

  console.log(`\n================== [MOCK ${channel.toUpperCase()} OUTBOX] ==================`);
  console.log(`To:        ${to}`);
  console.log(`Time:      ${timestamp}`);
  console.log(`Message:   ${body}`);
  console.log(`============================================================\n`);

  return record;
}

function getOutbox() {
  return outbox;
}

function clearOutbox() {
  outbox = [];
  return { success: true };
}

module.exports = {
  sendSms,
  getOutbox,
  clearOutbox
};
