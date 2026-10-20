# CampusConnect — College Community Hub

CampusConnect is a modern, unified collegiate community portal connecting **Students**, **Club Coordinators**, and **College Administrators**. It streamlines campus event discovery, workshop registrations, club memberships, QR-code entry verification, and administrative sanctions in a cohesive SaaS dashboard.

---

## 🎨 Visual Design System & Design Fidelity

The application faithfully recreates the design reference across 4 core dashboard views:

1. **Screen 1 — Discover Hub & Events (`/`)**:
   - Hero header: *"Happening on Campus This Week"* with dynamic category filter pills.
   - Featured event card: *"Annual Spring HackCon 2025"* with live attendee counts, venue tag, and instant RSVP.
   - Right Rail widgets:
     - *Live Campus Highlights* (14+ active events, 4,200+ students).
     - *Campus Engagement Score* with a circular radial gauge (78% Level 4 Campus Leader).
     - *Trending Campus Clubs* leaderboard with quick links.
   - Upcoming Sessions & Meetups grid with capacity gauges and category badges.

2. **Screen 2 — Student Hub & Directory (`/clubs`)**:
   - Header: *"Discover 64+ Student Organizations & Chapters"*.
   - Category filtering: *Technical & Coding*, *Design & Creative*, *Entrepreneurship*, *Cultural & Arts*, *Social & Community*.
   - Club cards featuring cover photos, floating avatar logos, member statistics, and quick join buttons.
   - Right Rail widgets:
     - *Top Performing Clubs This Month* with activity points.
     - *Annual Student Innovation Expo* call for club booths.
     - *Club Leader Guidelines & Support* policies.

3. **Screen 3 — Coordinator Event Manager (`/coordinator`)**:
   - Event switcher header: *"Autonomous Drone Swarm Workshop"*.
   - 4 Key Metrics:
     - **842 Total Registrations** (+18% trend).
     - **318 Checked In (Attendance)** (37.8% turnout rate).
     - **24 Remaining Seats** (real-time capacity gauge).
     - **4.8 / 5.0 Attendee Feedback Rating**.
   - Live Attendee Check-In Queue with search and filter tabs (*All*, *Checked In*, *Pending*).
   - *Rapid QR Scanner*: Interactive scanner with laser viewport, camera simulation, and manual ticket code input.
   - *Coordinator Team On-Duty* roster and *Broadcast Announcement* to registered attendees.

4. **Screen 4 — Governance & Sanctions Bureau (`/governance`)**:
   - Administrative compliance dashboard: *"Campus Event Approvals & Compliance Hub"*.
   - 4 Top KPI Cards:
     - **7 Pending Proposals** (Amber badge).
     - **38 Approved Events** (Green badge).
     - **4,219 Total Student Registrations**.
     - **84% Turnout Rate** with radial gauge.
   - Detailed event proposal review cards (e.g. *National AI & Robotics Symposium*, *Midnight Stargazing*, *Esports Championship*) with safety clearance checklists and one-click **Approve & Sanction Event** actions.
   - *Mini Calendar Queue*, *Safety & Policy Enforcement Alert*, and *Platform System Audit Trail*.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, Canvas Confetti, QRCode SVG.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `qrcode`.
- **Database**:
  - **PostgreSQL**: Production-ready schema with foreign keys, indexes, and parameterized queries via `pg`.
  - **Embedded SQLite Fallback**: Zero-configuration persistence powered by `sql.js` (pure WebAssembly SQLite), ensuring the app runs out-of-the-box locally without external daemon requirements.

---

## 👥 Interactive User Personas (Switch Roles Instantly)

You can toggle between roles anytime using the **Interactive Role Switcher** in the bottom-left sidebar:

1. **Student** (`Aarav Sharma` — Computer Science)
   - Credentials: `aarav.sharma@campus.edu` / `password123`
   - Features: Discover events, RSVP, generate digital pass with QR code, join clubs, view notifications.

2. **Club Coordinator** (`Priya Patel` — Robotics & AI Guild)
   - Credentials: `priya.patel@campus.edu` / `password123`
   - Features: Manage club events, access live attendee check-in queue, scan QR passes, export CSV, broadcast alerts.

3. **College Administrator** (`Dr. Rajesh Menon` — Dean of Student Affairs)
   - Credentials: `admin@campus.edu` / `password123`
   - Features: Review event proposals, sanction/reject events, inspect system audit trail, enforce campus safety policies.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) and npm installed.

### 2. Installation
Dependencies are already installed in `client` and `server`. If running on a new machine:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Starting the Application
```bash
# Start backend server (starts on http://localhost:5000)
cd server
npm start

# In a separate terminal, start frontend client (starts on http://localhost:5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create student account.
- `POST /api/auth/login` — Sign in and obtain JWT.
- `GET /api/auth/me` — Get current user and engagement stats.
- `POST /api/auth/switch-demo-user` — Instant demo persona switcher (`student`, `coordinator`, `admin`).

### Events (`/api/events`)
- `GET /api/events` — List approved events with category/search filters and user registration status.
- `GET /api/events/:id` — Event details and organizer info.
- `POST /api/events` — Create event (coordinators/admins).
- `POST /api/events/:id/register` — RSVP for event (capacity checks, duplicate prevention, QR token generation).
- `DELETE /api/events/:id/register` — Cancel registration.
- `GET /api/events/:id/attendees` — Coordinator attendee queue.
- `POST /api/events/:id/check-in` — Check-in via QR token or manual code.
- `GET /api/events/:id/stats` — Real-time event turnout stats.

### Clubs (`/api/clubs`)
- `GET /api/clubs` — List clubs with category filter.
- `GET /api/clubs/:id` — Club profile, leadership, and events.
- `POST /api/clubs/:id/join` — Join club community.
- `GET /api/clubs/stats/leaderboard` — Top performing clubs leaderboard.

### Administration (`/api/admin`)
- `GET /api/admin/stats` — Platform KPI statistics.
- `GET /api/admin/proposals` — Pending event proposals requiring review.
- `POST /api/admin/events/:id/approve` — Sanction and publish event.
- `POST /api/admin/events/:id/reject` — Decline proposal with reason.
- `GET /api/admin/audit-logs` — System audit trail records.

---

## 📄 License
MIT License. Developed for CampusConnect Community.
