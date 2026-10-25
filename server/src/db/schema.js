const db = require('./connection');

async function createSchema() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (t) => {
      t.string('id').primary();
      t.string('name').notNullable();
      t.string('phone').notNullable();
      t.string('email').unique().notNullable();
      t.string('password_hash').notNullable();
      t.boolean('discreet_mode').defaultTo(false);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasContacts = await db.schema.hasTable('emergency_contacts');
  if (!hasContacts) {
    await db.schema.createTable('emergency_contacts', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('name').notNullable();
      t.string('phone').notNullable();
      t.boolean('whatsapp').defaultTo(false);
      t.string('relationship').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasSos = await db.schema.hasTable('sos_events');
  if (!hasSos) {
    await db.schema.createTable('sos_events', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('type').defaultTo('sos'); // sos, 112, journey_alert
      t.string('status').defaultTo('active'); // active, ended
      t.string('share_token').unique().notNullable();
      t.timestamp('started_at').defaultTo(db.fn.now());
      t.timestamp('ended_at').nullable();
      t.float('last_lat').nullable();
      t.float('last_lng').nullable();
    });
  }

  const hasJourneys = await db.schema.hasTable('journeys');
  if (!hasJourneys) {
    await db.schema.createTable('journeys', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('destination').notNullable();
      t.float('dest_lat').nullable();
      t.float('dest_lng').nullable();
      t.string('eta').nullable();
      t.string('status').defaultTo('active'); // active, completed, alert
      t.string('share_token').unique().notNullable();
      t.timestamp('started_at').defaultTo(db.fn.now());
      t.timestamp('ended_at').nullable();
      t.timestamp('last_moved_at').defaultTo(db.fn.now());
      t.float('last_lat').nullable();
      t.float('last_lng').nullable();
      t.boolean('stationary_prompt_sent').defaultTo(false);
      t.boolean('stationary_alert_sent').defaultTo(false);
    });
  }

  const hasLocationLogs = await db.schema.hasTable('location_logs');
  if (!hasLocationLogs) {
    await db.schema.createTable('location_logs', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('sos_event_id').references('id').inTable('sos_events').onDelete('CASCADE').nullable();
      t.string('journey_id').references('id').inTable('journeys').onDelete('CASCADE').nullable();
      t.float('lat').notNullable();
      t.float('lng').notNullable();
      t.float('accuracy').nullable();
      t.timestamp('recorded_at').defaultTo(db.fn.now());
    });
  }

  const hasSosMedia = await db.schema.hasTable('sos_media');
  if (!hasSosMedia) {
    await db.schema.createTable('sos_media', (t) => {
      t.string('id').primary();
      t.string('sos_event_id').references('id').inTable('sos_events').onDelete('CASCADE');
      t.string('kind').notNullable(); // audio, snapshot
      t.string('file_path').notNullable();
      t.string('iv').nullable();
      t.string('auth_tag').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasHelplines = await db.schema.hasTable('helplines');
  if (!hasHelplines) {
    await db.schema.createTable('helplines', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
      t.string('name').notNullable();
      t.string('number').notNullable();
      t.string('mode').notNullable(); // Railway, Bus, Cab, Walking, Emergency
      t.string('city').nullable();
      t.boolean('is_national').defaultTo(false);
    });
  }

  const hasIncidents = await db.schema.hasTable('incidents');
  if (!hasIncidents) {
    await db.schema.createTable('incidents', (t) => {
      t.string('id').primary();
      t.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title').notNullable();
      t.string('platform').notNullable();
      t.string('accused_handle').nullable();
      t.text('summary').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasEvidence = await db.schema.hasTable('evidence');
  if (!hasEvidence) {
    await db.schema.createTable('evidence', (t) => {
      t.string('id').primary();
      t.string('incident_id').references('id').inTable('incidents').onDelete('CASCADE');
      t.string('file_path').nullable();
      t.string('original_name').nullable();
      t.string('sha256').nullable();
      t.string('phash').nullable();
      t.string('type').notNullable(); // image, file, url
      t.string('url').nullable();
      t.string('occurred_at').notNullable();
      t.text('description').nullable();
      t.string('duplicate_of').nullable();
      t.string('iv').nullable();
      t.string('auth_tag').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasReports = await db.schema.hasTable('reports');
  if (!hasReports) {
    await db.schema.createTable('reports', (t) => {
      t.string('id').primary();
      t.string('incident_id').references('id').inTable('incidents').onDelete('CASCADE');
      t.string('file_path').notNullable();
      t.text('edits_json').nullable();
      t.timestamp('generated_at').defaultTo(db.fn.now());
    });
  }

  console.log('Database schema verified/initialized successfully.');
}

module.exports = { createSchema };
