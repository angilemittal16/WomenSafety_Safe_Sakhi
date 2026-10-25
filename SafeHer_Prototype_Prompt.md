# SafeHer: Full-Stack Women's Safety App (Prototype Build Prompt)

> Paste this whole file into your AI app builder or coding agent. It is a complete brief: product, UI/UX, data model, API, offline behavior, privacy and deliverables.

---

## 0. YOUR ROLE AND OUTPUT

You are a senior full-stack engineer and product designer. Build **SafeHer**, a women's safety app, as a working, runnable project.

**Deliver:**
1. Complete project structure (monorepo: `/client`, `/server`).
2. All source code, working and copy-paste runnable.
3. `README.md` with setup steps, environment variables, and the demo walkthrough.
4. A seed script that loads demo data (including three sample screenshots and one incident).
5. Short notes on what is real vs. simulated in the demo (e.g. SMS is mocked unless Twilio keys are set).

**Language:** JavaScript only (no TypeScript).

**Tech stack**
| Layer | Choice |
|---|---|
| Frontend | React (Vite), mobile-first **PWA** (manifest + service worker). React Native is acceptable only if a PWA is impossible. |
| Backend | Node.js + Express REST API |
| Database | PostgreSQL for production, **SQLite for the demo** (use Knex or better-sqlite3 so switching is a config change) |
| Auth | JWT (access token; bcrypt password hashing) |
| Uploads | Multer |
| PDF | pdfkit (preferred) or puppeteer |
| SMS / WhatsApp | Twilio (or similar). If no keys are set, use a **mock provider** that logs messages to the console and to a `/dev/outbox` page. |
| Icons | Lucide (or Feather) |
| Font | Inter (or Poppins) |

---

## 1. PRODUCT PRINCIPLES

- **Simple, calm and fast under stress.** Any critical action must be reachable in 1-2 taps.
- No clutter, no hidden menus, no onboarding walls.
- Offline-first: the app must still do the most important things with no internet.
- Privacy-first: no analytics, no tracking, no third-party trackers. Evidence is encrypted at rest. The user can delete all of her data.
- Plain, reassuring microcopy, e.g. "Help is being notified", never technical jargon.

---

## 2. UI/UX DESIGN SYSTEM (STRICT)

### 2.1 Color palette
Use **only these two brand colors plus neutral tints**. Do **not** introduce red or any other loud color.

```css
:root {
  --primary: #007CBE;        /* blue: buttons, headers, icons, links, floating widget */
  --bg: #FFF7AE;            /* soft yellow: screen backgrounds */
  --surface: #FFFFFF;       /* cards on top of --bg */
  --text: #0B2A3A;          /* body text */
  --primary-dark: #005F90;  /* pressed / hover / focus ring */
  --primary-light: #D9EEF9; /* chips, subtle fills, selected states */
}
```

Rules:
- Screens use `--bg`; content sits on white `--surface` cards.
- Buttons, headers, icons, links and the floating widget use `--primary` with white text.
- Always place `--primary` on `--bg` or white. **Never** yellow text on blue for small text.
- All body text must meet WCAG AA (4.5:1).
- **Dark mode (optional toggle):** deep navy surface (e.g. `#0A1B2A`), `--primary` accents, light text. Keep the same two-color identity.

### 2.2 Layout
- Mobile-first, **single column**, bottom tab bar with exactly **3 tabs: Personal Safety, Journey, Cyber Safety**.
- **Home (Personal Safety) screen:** two very large rounded buttons, **SOS** and **112**, each at least **96px tall**, icon plus label.
- **SOS is the most prominent element:** largest, solid `--primary`, white bold label, subtle pulse ring (disabled under `prefers-reduced-motion`).
- Minimum tap target **48x48px**, base font **16px+**, generous spacing, corner radius 16-24px, soft shadows.
- One-handed use: key actions sit in the lower half of the screen.

### 2.3 Typography and icons
- One sans-serif family (Inter or Poppins). At most **3 sizes** plus weights for hierarchy.
- Simple line icons (Lucide/Feather), **every icon paired with a text label**.

### 2.4 Components
- **Status chips:** "Location sharing on", "Offline - SMS mode", "Evidence saved".
- **SOS countdown:** full-screen overlay, big 3-2-1 number, huge visible **Cancel** button. Alert fires at 0.
- **Floating journey widget:** rounded pill/card in `--primary`, white text, docked at the bottom **above the tab bar**, **draggable** (pointer events, snaps within viewport, position remembered). Shows destination, ETA, **"Stop sharing"** and **"I'm not safe"**.
- **"Are you safe?" prompt:** full-width modal with two large buttons: **"Yes, I'm safe"** (outlined) and **"I'm not safe"** (solid `--primary`).
- **Cyber Safety:** step-by-step cards (Incident -> Add evidence -> Timeline -> Review -> Export) with a progress indicator, a vertical timeline with `--primary` dots on a white card, and a clean thumbnail grid.

### 2.5 Interaction and feedback
- Haptics via `navigator.vibrate` where supported; subtle animations only; avoid flashy motion.
- Respect `prefers-reduced-motion`.

### 2.6 Accessibility
- Screen-reader labels (`aria-label`, roles, live regions for status and countdown).
- Visible focus states (2px+ `--primary-dark` outline).
- Supports large text (use `rem`, no fixed-height text containers).
- Works one-handed.

### 2.7 Discreet mode
- Settings option to switch the app's **name and icon** to a neutral disguise ("Notes" or "Weather"), using the same palette. Changes the header title, tab title, favicon and PWA manifest name/icon (use a dynamic manifest endpoint). Add a PIN-free quick toggle so it is reachable in 2 taps.

---

## 3. MODULE 1: PERSONAL SAFETY

### 3.1 SOS (Trusted Contacts)
1. One tap starts a **3-second cancel countdown**. Cancel aborts everything.
2. At zero, alert **all saved emergency contacts**.
3. **Online:**
   - Create an `sos_event` and stream **live GPS** (`watchPosition`) to the backend, logged in `location_logs`.
   - Record a **short audio clip** (MediaRecorder, about 10-15 s chunks).
   - Capture **periodic camera snapshots** (e.g. every 20 s, front/back camera via `getUserMedia` and canvas).
   - Backend sends contacts a **secure tracking link** (random unguessable token, expiring) via SMS / WhatsApp / push. The link opens a read-only live-map page showing location trail, and playable audio/snapshots.
4. **Offline:**
   - Detect with `navigator.onLine` plus a failed ping.
   - Open the device's native SMS composer: `sms:+91XXXXXXXXXX?body=...` containing a **Google Maps link** (`https://maps.google.com/?q=lat,lng`) and coordinates. Support multiple contacts (comma-separated or sequential prompts).
   - **Cache last-known location** in IndexedDB.
   - **Queue audio and snapshots** in IndexedDB and upload when the connection returns (Background Sync where available, plus an `online` event fallback).
   - Show the chip "Offline - SMS mode".
5. Confirmation screen: "Help is being notified" with a list of contacts and delivery status, and a "I'm safe now / End alert" button.

### 3.2 112 Emergency Helpline
- One tap places a direct call: `<a href="tel:112">`.
- **Simultaneously** share location with the ERC and trusted contacts:
  - Online: backend `POST /sos` with `type: "112"` (notify contacts; include a stub adapter for ERC/112 integration, documented as a future integration).
  - Offline: SMS fallback to trusted contacts with Maps link.
- Order of operations: trigger `tel:112` immediately (it must never be blocked by network calls), and run location sharing in parallel.

### 3.3 Trusted contacts management
- Simple screen: add/edit/delete contacts (name, phone, optional WhatsApp flag, relationship). Prompt to add at least one contact on first use (inline card, not a wall).

---

## 4. MODULE 2: JOURNEY SAFETY

### 4.1 Destination share
- User enters a destination (text input; optionally geocode via free Nominatim, with graceful offline fallback to free text).
- App starts a `journey`, sends **live location and ETA** to emergency contacts via a secure share link (and an initial SMS "Priya started a journey to X, track here: link").
- Location updates every ~10-15 s via `POST /journey/update-location`.

### 4.2 Floating widget
- While a journey is active, show the **draggable floating widget** on every screen (above the tab bar): destination, ETA, **Stop sharing**, **I'm not safe**.

### 4.3 Stop detection
- If she stays within a **~50 m geofence** for **5 minutes**, show a notification and the modal **"Are you safe?"** (Yes, I'm safe / I'm not safe). Use the Notifications API plus the in-app modal.
- **No response within 5 more minutes (10 minutes total):** automatically SMS emergency contacts her location and the message: **"She has been at the same place for 10 minutes."** (include the Maps link).
- "Yes, I'm safe" resets the stationary timer.
- Make the thresholds **configurable constants** (and a `DEMO_FAST_MODE` that scales 5/10 minutes to 15/30 seconds for the demo).

### 4.4 "I'm not safe" -> Helpline screen
- Opens a screen with tap-to-call buttons **grouped by mode: Railway, Bus, Cab, Walking/Street**.
- National numbers to include:
  - **112** Emergency
  - **1091** Women Helpline
  - **181** Women Helpline (Domestic Abuse)
  - **139** Railways
  - **1033** Highway
  - **100** Police
- Users can **add city-specific numbers** (name, number, city, mode); stored locally and in the `helplines` table.
- "I'm not safe" also triggers the SOS flow (with a short cancel window) so contacts are alerted.

---

## 5. MODULE 3: CYBER SAFETY (EVIDENCE ORGANIZER)

**Problem:** victims struggle to organize messages, screenshots, URLs and dates when reporting online abuse. This module turns scattered evidence into a structured incident report.

### 5.1 Features
- **Create incidents:** title, platform (Instagram, WhatsApp, X, etc.), accused handle, summary.
- **Add evidence** to each incident: screenshots/files, URLs, **date and time of occurrence**, user-written description.
- **Duplicate detection:**
  - Compute **SHA-256** on upload; flag identical files ("Duplicate of Evidence #3").
  - Optionally compute a **perceptual hash** (dHash/pHash using `sharp` or `jimp`) and flag near-duplicate images using Hamming distance (e.g. <= 5).
- **Auto-generated chronological timeline** per incident (sorted by `occurred_at`).
- **Review/edit screen** before export (edit text, reorder, remove items, confirm). **Nothing is shared automatically.**
- **Export a downloadable PDF** containing:
  1. Cover summary (incident details, generated date, counts)
  2. Chronological timeline
  3. Evidence list with **thumbnails**, descriptions, URLs
  4. **File hashes** (SHA-256) for integrity, plus a short verification note
- Show links to **cybercrime.gov.in** and the **1930** cyber helpline (tap-to-call) on the module home and the export screen.

### 5.2 Step flow (stepper UI)
`Incident -> Add evidence -> Timeline -> Review -> Export`

### 5.3 DEMO seed
- Seed **three sample screenshots** generated programmatically (e.g. drawn with `sharp`/canvas as SVG-to-PNG): 
  1. an abusive message screenshot, 
  2. a fake profile, 
  3. a threat message. 
  Use obviously fictional names/handles.
- Seed **one incident** ("Harassment on Instagram") linking all three with dates and descriptions.
- A prominent **"Generate Report"** button produces the organized, downloadable PDF in one tap.

---

## 6. DATABASE (SQL)

Provide migrations (Knex) or a `schema.sql` that works on both SQLite and PostgreSQL.

| Table | Key columns |
|---|---|
| `users` | id, name, phone, email, password_hash, discreet_mode, created_at |
| `emergency_contacts` | id, user_id, name, phone, whatsapp (bool), relationship, created_at |
| `sos_events` | id, user_id, type (`sos`/`112`/`journey_alert`), status, share_token, started_at, ended_at, last_lat, last_lng |
| `location_logs` | id, user_id, sos_event_id (nullable), journey_id (nullable), lat, lng, accuracy, recorded_at |
| `journeys` | id, user_id, destination, dest_lat, dest_lng, eta, status, share_token, started_at, ended_at, last_moved_at |
| `helplines` | id, user_id (nullable for national), name, number, mode, city, is_national |
| `incidents` | id, user_id, title, platform, accused_handle, summary, created_at |
| `evidence` | id, incident_id, file_path, original_name, sha256, phash, type (`image`/`file`/`url`), url, occurred_at, description, duplicate_of, created_at |
| `reports` | id, incident_id, file_path, generated_at, edits_json |

Also store SOS media (audio/snapshots) in a `sos_media` table (id, sos_event_id, kind, file_path, created_at).

---

## 7. BACKEND API (Express REST, JWT-protected unless noted)

| Area | Endpoints |
|---|---|
| `/auth` | `POST /register`, `POST /login`, `GET /me`, `DELETE /me` (**delete all user data**) |
| `/contacts` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/sos` | `POST /` (start; body: type, lat, lng), `POST /:id/location`, `POST /:id/media` (Multer: audio/snapshot), `POST /:id/end`, `GET /track/:token` (public, read-only for contacts) |
| `/journey` | `POST /start`, `POST /update-location`, `POST /stop`, `POST /check-in` (safe / not safe), `GET /track/:token` (public) |
| `/helplines` | `GET /` (national + user's), `POST /`, `DELETE /:id` |
| `/incidents` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:id/timeline` |
| `/evidence` | `POST /` (multipart; computes sha256 + phash, flags duplicates), `PUT /:id`, `DELETE /:id`, `GET /:id/file` (decrypts and streams), `GET /:id/thumb` |
| `/reports` | `POST /:incidentId` (create/save edits), `GET /:id/export` (streams PDF) |

Backend requirements:
- Server-side **stationary watcher**: a scheduled check (setInterval or node-cron) so the 10-minute auto-SMS fires even if the client is backgrounded.
- Validation (zod/joi), rate limiting, helmet, CORS config, error handler.
- SMS service abstraction: `sendSms(to, body)` with Twilio and mock implementations.

---

## 8. NON-FUNCTIONAL REQUIREMENTS

- **Offline-first:** service worker (Workbox or hand-written) caches the app shell; IndexedDB local queue for SOS media, location pings, journey updates and evidence uploads; flush on reconnect; show queue status.
- **Encrypt evidence at rest:** AES-256-GCM per file (key from `EVIDENCE_KEY` env, per-file IV stored with the file); decrypt only when streamed to the authenticated owner or when building the PDF.
- **Privacy-first:** no tracking/analytics; share links are random, expiring and revocable; **"Delete all my data"** button in Settings wipes DB rows and files.
- **Security:** bcrypt, JWT expiry, input validation, upload type/size limits, no secrets in the client.
- Large, accessible buttons, calm UI, discreet app icon (see 2.7).
- Demo works with **no external keys** (mock SMS, no geocoding dependency).

---

## 9. PROJECT STRUCTURE (expected)

```
safeher/
├─ README.md
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ public/ (manifest, icons, sw.js)
│  └─ src/
│     ├─ main.jsx, App.jsx, styles/tokens.css
│     ├─ components/ (TabBar, SosButton, CountdownOverlay, FloatingJourneyWidget,
│     │               AreYouSafeModal, StatusChip, Stepper, Timeline, ThumbGrid)
│     ├─ screens/ (Home, Journey, Helplines, CyberHome, IncidentForm, AddEvidence,
│     │            TimelineView, Review, Export, Contacts, Settings)
│     ├─ lib/ (api.js, offlineQueue.js, geolocation.js, recorder.js, sms.js, haptics.js)
│     └─ hooks/ (useOnline, useJourney, useStationaryDetector)
└─ server/
   ├─ package.json, .env.example
   └─ src/
      ├─ index.js, app.js, db/ (knexfile, migrations, seed.js)
      ├─ routes/ (auth, contacts, sos, journey, helplines, incidents, evidence, reports)
      ├─ services/ (sms, crypto, hashing, pdf, stationaryWatcher, shareLinks)
      └─ middleware/ (auth, upload, validate, errors)
```

---

## 10. DEMO WALKTHROUGH (include in README)

1. `npm run setup && npm run seed && npm run dev`, then open the client URL on a phone-sized viewport.
2. Log in as the demo user (`demo@safeher.app` / `demo1234`; two seeded contacts).
3. **SOS:** tap SOS, watch the 3-2-1 countdown, press Cancel once, then let it complete. See "Help is being notified" and open the contact tracking link in another tab.
4. **Offline SOS:** toggle DevTools -> Offline, tap SOS, see "Offline - SMS mode" and the prefilled SMS with the Maps link. Go online and watch the queued media upload.
5. **112:** tap 112 and see `tel:112` fire plus location shared.
6. **Journey:** start a journey to "Central Station". The floating widget appears (drag it). With `DEMO_FAST_MODE`, stay still to trigger "Are you safe?", ignore it, and see the auto-SMS in the dev outbox.
7. Tap **I'm not safe** and use the grouped helpline screen; add a city number.
8. **Cyber Safety:** open the seeded incident, review the timeline, upload a duplicate screenshot to see the duplicate flag, open Review, edit a description, tap **Generate Report**, and download the PDF.
9. Settings: switch to discreet mode ("Notes"), toggle dark mode, then **Delete all my data**.

---

## 11. ACCEPTANCE CHECKLIST

- [ ] Only the two brand colors plus neutrals; no red
- [ ] SOS and 112 buttons are at least 96px tall; SOS is visually dominant with a pulse ring
- [ ] 3-second cancel countdown works and Cancel is huge and visible
- [ ] Offline SOS opens a native SMS with a Maps link; media queues and uploads later
- [ ] Floating widget is draggable, sits above the tab bar, and has all four elements
- [ ] 5-minute "Are you safe?" and 10-minute auto-SMS work (and demo fast mode)
- [ ] Helplines grouped by Railway / Bus / Cab / Walking; custom numbers can be added
- [ ] SHA-256 duplicate flag works; perceptual-hash near-duplicate flag works
- [ ] PDF includes cover, timeline, thumbnails and hashes; export needs explicit user action
- [ ] Evidence files encrypted on disk; "Delete all data" works
- [ ] Works as an installable PWA; app shell loads offline
- [ ] Keyboard and screen-reader accessible; `prefers-reduced-motion` respected
- [ ] README, `.env.example`, seed script and demo steps included

**Build the full project now, file by file, with complete working code. Do not leave placeholders or TODOs in the core flows.**
