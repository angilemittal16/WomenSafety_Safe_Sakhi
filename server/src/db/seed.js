const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Jimp } = require('jimp');
const db = require('./connection');
const { createSchema } = require('./schema');
const { encryptBuffer } = require('../services/crypto');
const { computeSha256, computePHash } = require('../services/hashing');
const { generateIncidentPdf } = require('../services/pdf');

// Helper to draw a filled rectangle on a Jimp image
function fillRect(image, startX, startY, width, height, colorInt) {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (x >= 0 && x < image.bitmap.width && y >= 0 && y < image.bitmap.height) {
        image.setPixelColor(colorInt, x, y);
      }
    }
  }
}

// Generate Screenshot 1: Abusive Message DM
async function createAbusiveMessageImage() {
  const width = 480;
  const height = 400;
  // Background: dark phone screen
  const img = new Jimp({ width, height, color: 0x121212ff });

  // Top header bar (Instagram Direct style)
  fillRect(img, 0, 0, width, 55, 0x1e1e1eff);
  // Header accent line
  fillRect(img, 0, 54, width, 2, 0x007cbeff);

  // Avatar placeholder (circle/square)
  fillRect(img, 20, 12, 32, 32, 0x007cbeff);
  // Accused handle block
  fillRect(img, 65, 18, 140, 12, 0xffffffff);
  // Active status block
  fillRect(img, 65, 34, 80, 8, 0x888888ff);

  // Date bubble in chat
  fillRect(img, 190, 80, 100, 20, 0x2a2a2aff);

  // Received message bubble (Grey)
  fillRect(img, 30, 120, 320, 85, 0x262626ff);
  // Simulated text lines inside bubble (abusive harassment text representation)
  fillRect(img, 45, 135, 270, 10, 0xffffffff);
  fillRect(img, 45, 155, 290, 10, 0xffffffff);
  fillRect(img, 45, 175, 180, 10, 0xff5555ff); // Highlighted threat phrase

  // Time indicator
  fillRect(img, 280, 215, 60, 8, 0x777777ff);

  // Follow-up message bubble
  fillRect(img, 30, 240, 300, 65, 0x262626ff);
  fillRect(img, 45, 255, 260, 10, 0xffffffff);
  fillRect(img, 45, 275, 210, 10, 0xff5555ff);

  // Input bar at bottom
  fillRect(img, 0, 340, width, 60, 0x1e1e1eff);
  fillRect(img, 20, 350, 360, 40, 0x2a2a2aff);
  fillRect(img, 400, 350, 60, 40, 0x007cbeff);

  return img.getBuffer('image/png');
}

// Generate Screenshot 2: Fake Clone Profile
async function createFakeProfileImage() {
  const width = 480;
  const height = 400;
  // Background: white profile screen
  const img = new Jimp({ width, height, color: 0xffffffff });

  // Top header
  fillRect(img, 0, 0, width, 50, 0xf8f9faff);
  fillRect(img, 0, 49, width, 1, 0xddddddff);
  // Header username
  fillRect(img, 50, 18, 160, 14, 0x0b2a3aff);

  // Profile Avatar with suspect border
  fillRect(img, 30, 70, 70, 70, 0xd9eef9ff);
  fillRect(img, 35, 75, 60, 60, 0x007cbeff);

  // Stats blocks (posts, followers, following)
  fillRect(img, 140, 85, 45, 14, 0x0b2a3aff);
  fillRect(img, 220, 85, 45, 14, 0x0b2a3aff);
  fillRect(img, 300, 85, 45, 14, 0x0b2a3aff);

  fillRect(img, 135, 105, 55, 10, 0x888888ff);
  fillRect(img, 215, 105, 55, 10, 0x888888ff);
  fillRect(img, 295, 105, 55, 10, 0x888888ff);

  // Bio card: Impersonating victim
  fillRect(img, 30, 160, 180, 14, 0x0b2a3aff);
  fillRect(img, 30, 185, 380, 10, 0x444444ff);
  fillRect(img, 30, 205, 340, 10, 0x444444ff);
  fillRect(img, 30, 225, 260, 10, 0xd9534fff); // Red/warning bio note

  // Buttons (Follow, Message, More)
  fillRect(img, 30, 255, 190, 36, 0x007cbeff);
  fillRect(img, 230, 255, 190, 36, 0xefefefff);

  // Grid separator
  fillRect(img, 0, 310, width, 1, 0xeeeeeeff);
  fillRect(img, 30, 325, 120, 65, 0xf0f0f0ff);
  fillRect(img, 175, 325, 120, 65, 0xf0f0f0ff);
  fillRect(img, 320, 325, 120, 65, 0xf0f0f0ff);

  return img.getBuffer('image/png');
}

// Generate Screenshot 3: Threat Message Warning
async function createThreatMessageImage() {
  const width = 480;
  const height = 400;
  // Background
  const img = new Jimp({ width, height, color: 0x0e1726ff });

  // Chat window header
  fillRect(img, 0, 0, width, 55, 0x1b2e4bff);
  fillRect(img, 20, 15, 30, 30, 0xff5555ff); // Warning indicator
  fillRect(img, 65, 20, 150, 14, 0xffffffff);

  // Threat banner
  fillRect(img, 20, 75, 440, 45, 0x331010ff);
  fillRect(img, 20, 75, 6, 45, 0xff3b30ff);
  fillRect(img, 40, 88, 380, 14, 0xff8888ff);

  // Immediate intimidation message bubble
  fillRect(img, 40, 145, 390, 95, 0x1e2738ff);
  fillRect(img, 55, 160, 350, 12, 0xffffffff);
  fillRect(img, 55, 180, 330, 12, 0xffffffff);
  fillRect(img, 55, 200, 280, 12, 0xff6666ff); // Threat content

  // Audio note threat bar
  fillRect(img, 40, 260, 300, 50, 0x1e2738ff);
  fillRect(img, 55, 275, 22, 22, 0x007cbeff);
  fillRect(img, 90, 282, 180, 6, 0x445566ff);
  fillRect(img, 280, 280, 45, 10, 0xaaaaaaff);

  // Bottom action
  fillRect(img, 0, 340, width, 60, 0x1b2e4bff);
  fillRect(img, 30, 350, 420, 38, 0x253858ff);

  return img.getBuffer('image/png');
}

async function seed() {
  console.log('Seeding SafeSakhi database...');
  await createSchema();

  // 1. Clean existing demo data (both old and new email)
  const demoEmail = 'demo@safesakhi.app';
  const oldEmail = 'demo@safeher.app';
  const existingUsers = await db('users').whereIn('email', [demoEmail, oldEmail]);
  for (const existingUser of existingUsers) {
    const incidents = await db('incidents').where({ user_id: existingUser.id }).select('id');
    const incIds = incidents.map(i => i.id);
    if (incIds.length > 0) {
      await db('evidence').whereIn('incident_id', incIds).del();
      await db('reports').whereIn('incident_id', incIds).del();
    }
    await db('incidents').where({ user_id: existingUser.id }).del();
    await db('emergency_contacts').where({ user_id: existingUser.id }).del();
    await db('journeys').where({ user_id: existingUser.id }).del();
    await db('sos_events').where({ user_id: existingUser.id }).del();
    await db('users').where({ id: existingUser.id }).del();
  }

  // 2. Insert Demo User
  const userId = 'user_demo_priya';
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash('demo1234', salt);

  await db('users').insert({
    id: userId,
    name: 'Priya Sharma',
    phone: '+919876543210',
    email: demoEmail,
    password_hash,
    discreet_mode: false,
    created_at: new Date().toISOString()
  });
  console.log('Created demo user: demo@safesakhi.app / demo1234');

  // 3. Insert 2 Emergency Contacts
  await db('emergency_contacts').insert([
    {
      id: uuidv4(),
      user_id: userId,
      name: 'Rohan Sharma',
      phone: '+919876543211',
      whatsapp: true,
      relationship: 'Brother',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      name: 'Neha Verma',
      phone: '+919811223344',
      whatsapp: false,
      relationship: 'Friend',
      created_at: new Date().toISOString()
    }
  ]);
  console.log('Created 2 emergency contacts.');

  // 4. Seed National Helplines
  const nationalHelplines = [
    { id: uuidv4(), user_id: null, name: 'National Emergency Response (ERC)', number: '112', mode: 'Emergency', is_national: true },
    { id: uuidv4(), user_id: null, name: 'Police Control Room', number: '100', mode: 'Emergency', is_national: true },
    { id: uuidv4(), user_id: null, name: 'Women Helpline (All India)', number: '1091', mode: 'Walking', is_national: true },
    { id: uuidv4(), user_id: null, name: 'Women Helpline (Domestic Abuse)', number: '181', mode: 'Walking', is_national: true },
    { id: uuidv4(), user_id: null, name: 'Railway Protection Security (RPF)', number: '139', mode: 'Railway', is_national: true },
    { id: uuidv4(), user_id: null, name: 'National Highway Emergency', number: '1033', mode: 'Cab', is_national: true },
    { id: uuidv4(), user_id: null, name: 'City Bus & Transit Security', number: '1800-22-1250', mode: 'Bus', is_national: true },
    { id: uuidv4(), user_id: null, name: 'Cyber Crime Reporting Helpline', number: '1930', mode: 'Emergency', is_national: true }
  ];

  for (const h of nationalHelplines) {
    const existingH = await db('helplines').where({ number: h.number, mode: h.mode }).first();
    if (!existingH) {
      await db('helplines').insert(h);
    }
  }

  // 5. Generate 3 programmatically rendered sample screenshots
  const uploadsDir = path.resolve(__dirname, '../../uploads/evidence');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  console.log('Generating 3 sample screenshots programmatically...');
  const buf1 = await createAbusiveMessageImage();
  const buf2 = await createFakeProfileImage();
  const buf3 = await createThreatMessageImage();

  // Compute hashes and encrypt
  const sha1 = computeSha256(buf1);
  const phash1 = await computePHash(buf1);
  const enc1 = encryptBuffer(buf1);
  const fileId1 = uuidv4();
  const path1 = path.join(uploadsDir, `${fileId1}.enc`);
  fs.writeFileSync(path1, enc1.encryptedBuffer);

  const sha2 = computeSha256(buf2);
  const phash2 = await computePHash(buf2);
  const enc2 = encryptBuffer(buf2);
  const fileId2 = uuidv4();
  const path2 = path.join(uploadsDir, `${fileId2}.enc`);
  fs.writeFileSync(path2, enc2.encryptedBuffer);

  const sha3 = computeSha256(buf3);
  const phash3 = await computePHash(buf3);
  const enc3 = encryptBuffer(buf3);
  const fileId3 = uuidv4();
  const path3 = path.join(uploadsDir, `${fileId3}.enc`);
  fs.writeFileSync(path3, enc3.encryptedBuffer);

  // 6. Create Seed Incident: "Harassment on Instagram"
  const incidentId = uuidv4();
  await db('incidents').insert({
    id: incidentId,
    user_id: userId,
    title: 'Harassment on Instagram',
    platform: 'Instagram',
    accused_handle: '@anon_stalker_90',
    summary: 'Targeted online stalking including repeated vulgar direct messages, creation of a fake impersonation profile using my photos, and extortion threat messages received across multiple days.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  });

  // 7. Insert Evidence Records
  const ev1Id = uuidv4();
  const ev2Id = uuidv4();
  const ev3Id = uuidv4();

  await db('evidence').insert([
    {
      id: ev1Id,
      incident_id: incidentId,
      file_path: path1,
      original_name: 'abusive_message_dm.png',
      sha256: sha1,
      phash: phash1,
      type: 'image',
      url: 'https://instagram.com/direct/t/anon_stalker_90',
      occurred_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      description: 'Initial unsolicited abusive direct message sent from handle @anon_stalker_90 containing explicit harassment and intimidation.',
      duplicate_of: null,
      iv: enc1.iv,
      auth_tag: enc1.authTag,
      created_at: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: ev2Id,
      incident_id: incidentId,
      file_path: path2,
      original_name: 'fake_profile_clone.png',
      sha256: sha2,
      phash: phash2,
      type: 'image',
      url: 'https://instagram.com/priya_sharma_real_official',
      occurred_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      description: 'Impersonation account created using my private profile photos, contacting mutual colleagues with defamatory statements.',
      duplicate_of: null,
      iv: enc2.iv,
      auth_tag: enc2.authTag,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: ev3Id,
      incident_id: incidentId,
      file_path: path3,
      original_name: 'threat_message_warning.png',
      sha256: sha3,
      phash: phash3,
      type: 'image',
      url: 'https://instagram.com/direct/t/threat_warning',
      occurred_at: new Date(Date.now() - 6 * 3600000).toISOString(),
      description: 'Ultimatum threat message received demanding immediate compliance under threat of unauthorized photo dissemination.',
      duplicate_of: null,
      iv: enc3.iv,
      auth_tag: enc3.authTag,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ]);

  // 8. Pre-generate seed PDF report
  const reportsDir = path.resolve(__dirname, '../../uploads/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportId = uuidv4();
  const reportPath = path.join(reportsDir, `SafeSakhi_Report_Harassment_on_Instagram_${Date.now()}.pdf`);
  const incidentObj = await db('incidents').where({ id: incidentId }).first();
  const evidenceList = await db('evidence').where({ incident_id: incidentId }).orderBy('occurred_at', 'asc');
  
  const reportStream = fs.createWriteStream(reportPath);
  await generateIncidentPdf(incidentObj, evidenceList, {}, reportStream);

  await db('reports').insert({
    id: reportId,
    incident_id: incidentId,
    file_path: reportPath,
    edits_json: JSON.stringify({
      title: incidentObj.title,
      summary: incidentObj.summary
    }),
    generated_at: new Date().toISOString()
  });

  console.log('Seeded 1 incident with 3 encrypted screenshots and generated PDF report.');
  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
