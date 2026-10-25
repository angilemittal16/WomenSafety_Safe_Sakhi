/**
 * Opens native device SMS composer with prefilled emergency text and Google Maps link
 * @param {Array} contacts 
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} reason 
 */
export function openEmergencySms(contacts = [], lat, lng, reason = 'SOS Emergency Alert') {
  const phoneNumbers = contacts.map(c => c.phone.replace(/[^0-9+]/g, '')).filter(Boolean);
  const recipient = phoneNumbers.length > 0 ? phoneNumbers.join(';') : '';

  const mapsLink = (lat && lng) ? `https://maps.google.com/?q=${lat},${lng}` : 'Location unavailable';
  const bodyText = encodeURIComponent(
    `EMERGENCY: I need help! ${reason}. My current coordinates: ${lat ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'N/A'}. Track my location here: ${mapsLink}`
  );

  // iOS uses &body= while Android uses ?body=
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const delimiter = isIOS ? '&' : '?';
  const smsUrl = `sms:${recipient}${delimiter}body=${bodyText}`;

  console.log('[Native SMS] Launching SMS composer:', smsUrl);
  window.location.href = smsUrl;
  return smsUrl;
}
