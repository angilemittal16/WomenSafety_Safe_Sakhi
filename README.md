# SafeSakhi: Full-Stack Women's Safety App Prototype

SafeSakhi is a mobile-first Progressive Web Application (PWA) and Node.js REST API designed under stress-resilient product principles: **simple, calm, and fast under stress**. Any critical action is reachable in 1–2 taps, strictly adhering to an accessible two-color brand identity, offline-first reliability, and cryptographic privacy at rest.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

```bash
# 1. Install dependencies for both client and server
npm run setup

# 2. Seed database with demo account, emergency contacts, 3 encrypted screenshots, and 1 cyber incident
npm run seed

# 3. Start both backend API (port 5000) and frontend Vite server (port 5173)
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser in a mobile viewport (e.g. Chrome DevTools Responsive Mode or iPhone/Android device).

---

## 2. Default Demo Credentials

| Role | Email | Password | Seeded Data |
|---|---|---|---|
| Demo User | `demo@safesakhi.app` | `demo1234` | 2 Emergency Contacts (Rohan Sharma, Neha Verma), 1 Cyber Harassment Incident, 3 Forensic Screenshots |

*Note: You can also tap the **"One-Tap Demo Login"** button on the login screen.*

---

## 3. Demo Walkthrough Guide

Follow these steps to experience all modules:

1. **One-Tap Login**: Open `http://localhost:5173` and click **"One-Tap Demo Login"** (logs in as Priya Sharma).
2. **SOS Alert & 3-Second Cancel Window**:
   - Tap the prominent **SOS** button.
   - Observe the full-screen 3-2-1 countdown overlay with haptic vibration.
   - Press **Cancel** to abort.
   - Tap **SOS** again and let it reach 0.
   - Observe **"Help is being notified"** and click **"Open Public Contact Tracker Link"** to view what emergency contacts see in real-time (live GPS, OpenStreetMap, encrypted ambient audio, and camera snapshot surveillance).
   - Tap **"I'm safe now / End alert"** to conclude distress signal.
3. **Offline SOS (SMS Fallback Mode)**:
   - In browser DevTools, switch Network to **Offline** (or disconnect internet).
   - Tap **SOS** and let countdown expire.
   - Notice the status chip automatically switches to **"Offline - SMS mode"** and triggers the native device SMS composer (`sms:+91...?body=...`) containing exact GPS coordinates and a Google Maps tracking URL.
   - Toggle back **Online** and watch queued offline telemetry and media flush automatically.
4. **112 Emergency Helpline**:
   - Tap the **112 HELPLINE** button.
   - Direct phone call protocol (`tel:112`) is placed immediately without network blocking, while parallel background telemetry alerts contacts and logs to the ERC integration stub.
5. **Journey Safety & Geofence Stop Detection**:
   - Tap the **Journey** tab.
   - Enter destination *"Central Station"* (or tap a preset) and tap **"Start Sharing Journey"**.
   - Contacts immediately receive an initial SMS: *"Priya started a journey to Central Station. Track live: http://..."*.
   - A draggable **Floating Journey Widget** docks at the bottom above the tab bar. Drag it across the screen (it snaps to viewport boundaries and remembers position).
   - In `DEMO_FAST_MODE=true`, stay stationary for 15 seconds. The in-app modal **"Are you safe?"** appears.
   - If ignored for another 15 seconds (total 30s), the background watcher fires an emergency auto-SMS to contacts: *"ALERT: Priya has been stationary at the same place for 30 seconds"*.
   - Open the **Outbox Inspector** (envelope icon in header) to inspect dispatched messages.
6. **"I'm Not Safe" & Helplines Screen**:
   - Tap **"I'm not safe"** on the floating widget or in the prompt.
   - View national helplines grouped by transit mode: **Railway (139)**, **Bus (1800-22-1250)**, **Cab/Highway (1033)**, **Walking (1091 / 181)**, **Emergency (112 / 100)**.
   - Tap **"Add City Number"** to add a local police/transit number.
7. **Cyber Safety (Forensic Evidence Organizer)**:
   - Tap the **Cyber Safety** tab.
   - Open the seeded incident **"Harassment on Instagram"** with 3 programmatically rendered screenshots (abusive DM, fake profile clone, threat message).
   - Follow the 5-step stepper: `Incident -> Add evidence -> Timeline -> Review -> Export`.
   - Tap **"Add Evidence"** and upload a duplicate image to see the automatic **SHA-256 / perceptual hash duplicate flag**.
   - Tap **"Review & Finalize"** and edit the statement for police submission.
   - Tap **"Generate Report PDF"** and **"Download PDF Dossier"** to inspect the downloadable forensic report complete with cover summary, chronological timeline, decrypted thumbnails, and SHA-256 integrity verification hashes.
8. **Discreet Mode & Data Erasure**:
   - Tap the Shield icon in the header (or open Settings).
   - Toggle **Discreet Mode**: the app title immediately disguises to **"Quick Notes"**, tab title changes to *"Notes - Personal Memo"*, favicon changes to a notes memo pad, and PWA manifest dynamically updates.
   - Toggle **Dark Mode** for deep navy nighttime surface styling.
   - In Settings, tap **"Delete All My Data"** and confirm. All user records, GPS trails, and physical encrypted evidence files on disk are permanently wiped.

---

## 4. Real vs. Simulated Demo Behaviors

| Feature | Real Implementation | Simulated / Mocked in Demo |
|---|---|---|
| **Evidence Encryption** | **REAL**: AES-256-GCM cipher with per-file IV and authentication tag at rest. Files on disk are unreadable `.enc` binaries. | None |
| **Integrity Hashing** | **REAL**: Cryptographic SHA-256 digests computed on raw byte buffers before encryption. | None |
| **Perceptual Hashing** | **REAL**: 64-bit difference hash (dHash) computed on images via Jimp; Hamming distance comparison flags near duplicates. | None |
| **PDF Dossier Export** | **REAL**: PDFKit vector document generator assembling cover, timeline, decrypted thumbnails, and hashes. | None |
| **SMS / WhatsApp** | Supports live Twilio API when credentials are set. | In default demo mode without API keys, uses a **Mock Provider** that logs to console and to an in-app `/dev/outbox` inspection modal. |
| **Stationary Detection** | **REAL**: Periodic background watcher checking active journeys in SQLite. | In demo mode, scaled from 5 min / 10 min down to 15s / 30s (`DEMO_FAST_MODE=true`) for fast live verification. |
| **112 Helpline Calling** | **REAL**: Native `<a href="tel:112">` URI scheme triggering device phone dialer. | The backend Emergency Response Center (ERC) dispatch is logged to an extensible integration stub. |

---

## 5. Architecture & Project Structure

SafeSakhi is built as a JavaScript monorepo:

```
safesakhi/
├─ README.md                      # Documentation & walkthrough
├─ package.json                   # Root orchestrator scripts (setup, seed, dev)
├─ client/                        # React (Vite) mobile-first PWA
│  ├─ index.html                  # Shell with Inter font & dynamic manifest
│  ├─ vite.config.js              # Dev server with proxy to API
│  ├─ public/
│  │  ├─ manifest.json            # PWA manifest
│  │  ├─ manifest-discreet.json   # Discreet mode manifest (Notes)
│  │  ├─ sw.js                    # Service Worker caching offline shell
│  │  └─ icons/ (shield.svg, notes.svg)
│  └─ src/
│     ├─ main.jsx, App.jsx
│     ├─ styles/ (tokens.css, index.css) # Strict brand colors & accessibility
│     ├─ components/ (TabBar, Header, SosButton, CountdownOverlay,
│     │               FloatingJourneyWidget, AreYouSafeModal,
│     │               Stepper, Timeline, ThumbGrid, DevOutboxModal)
│     ├─ screens/ (Home, Journey, Helplines, CyberHome, Contacts, Settings, Login, PublicTrackScreen)
│     ├─ lib/ (api.js, offlineQueue.js, geolocation.js, recorder.js, sms.js, haptics.js)
│     └─ hooks/ (useOnline.js, useJourney.js)
└─ server/                        # Node.js + Express REST API
   ├─ package.json
   ├─ .env, .env.example
   └─ src/
      ├─ index.js, app.js
      ├─ db/ (knexfile.js, connection.js, schema.js, seed.js)
      ├─ routes/ (auth, contacts, sos, journey, helplines, incidents, evidence, reports, dev)
      ├─ services/ (sms, crypto, hashing, pdf, stationaryWatcher)
      └─ middleware/ (auth, upload, errors)
```

---

## 6. Strict UI/UX Color Palette

The app strictly adheres to the two-color brand specification plus neutral tints:

```css
:root {
  --primary: #007CBE;        /* blue: buttons, headers, icons, links, floating widget */
  --bg: #FFF7AE;            /* soft yellow: screen backgrounds */
  --surface: #FFFFFF;       /* cards on top of --bg */
  --text: #0B2A3A;          /* body text (WCAG AA compliant) */
  --primary-dark: #005F90;  /* pressed / hover / focus ring */
  --primary-light: #D9EEF9; /* chips, subtle fills, selected states */
}
```

No loud red colors are introduced; soft yellow and blue provide a reassuring, calm visual environment under high-stress conditions.
