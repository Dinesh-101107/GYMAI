# GymMate AI 🏋️‍♂️

> Premium Gym Management Platform & Member Experience Platform with Role-Based Portals, Real-Time WebSocket QR Check-In, Concurrency-Safe Class Booking, and Rule-Based AI Attendance Insights.

---

## 🚀 Quickstart & Demo Credentials

### 1. Pre-Configured Demo Logins

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Staff (Admin / GM)** | `admin@gymmate.ai` | `AdminPass123!` | Full access to operations dashboard, live QR check-ins, member profiles, and settings |
| **Staff (Head Coach)** | `coach@gymmate.ai` | `CoachPass123!` | Strength coach profile with full staff privileges |
| **Member (Active)** | `alex@gymmate.ai` | `MemberPass123!` | Consistent 4x/week attendee, active membership, rotating QR pass |
| **Member (At-Risk)** | `jordan@gymmate.ai` | `MemberPass123!` | 75% attendance drop (>40% drop trigger), flags AI warning |
| **Member (Overdue)** | `samira@gymmate.ai` | `MemberPass123!` | Fee overdue by 4 days, flags smart fee reminder |

*(You can also use the 1-click demo login buttons directly on the `/login` screen!)*

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router 6 + Recharts + Lucide Icons + Canvas Confetti
- **Backend**: Node.js + Express + TypeScript + Socket.io (real-time check-in stream)
- **Database**: Prisma ORM with dual-engine flexibility:
  - **Zero-Config Local Mode**: Instant SQLite (`dev.db`) pre-seeded with 10 members and 2 months of realistic logs.
  - **Cloud Production Target**: Neon / Supabase / Render / Railway PostgreSQL.
- **Security & Auth**: JWT (access token with automatic client-side refresh interceptor + refresh token), bcrypt hashing, time-bounded HMAC-signed rotating QR tokens.
- **Role-Based QR Workflow**:
  - **Staff Only**: Generates and displays the official Gym Front-Desk QR check-in key (with live rotation countdown and kiosk mode).
  - **Members**: Mobile camera QR scanner on `/member/attendance` and `/member/home` to scan the front-desk display and log check-ins instantly.
  - **Real-Time Live Feed**: Instant WebSocket stream updating the front-desk screen without page reloads.

---

## 🏃 Running Locally

### Step 1: Install Dependencies
```bash
# In the root directory:
npm install

# Server dependencies:
cd server
npm install

# Client dependencies:
cd ../client
npm install
```

### Step 2: Database Setup & Seed
The repository includes a ready-to-run database with 2 months of realistic attendance logs:
```bash
cd server
npx prisma generate
npx prisma db push
npm run seed
```

### Step 3: Launch Both Frontend & Backend
From the root directory:
```bash
npm run dev
```
Or independently:
- **Backend**: `cd server && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend**: `cd client && npm run dev` (Runs on `http://localhost:5173`)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

Run backend unit tests for the pure AI insight engine, smart reminder engine, and class booking concurrency guards:
```bash
cd server
npm test
```

---

## 🎨 Visual Identity — "Gym Equipment" Aesthetic

- **Color Palette**: Dark charcoal background (`#0A0A0C` & `#111114`), **Iron-plate red** (`#E63946`) and **Kettlebell green** (`#2E8B57`) high-energy accents.
- **Typography**: `Bebas Neue` for gym signage / plate numbers, `Inter` for clean body text.
- **Cards**: Subtle 2px "weight plate" rim border and bottom accent bar.
- **Streak Visualization**: Stacked Olympic calibrated weight plates (45lb red, 35lb blue, 25lb yellow, 10lb green) racked on a barbell sleeve.
- **Status Badges**: Gym chalk-board tags (`ACTIVE`, `EXPIRING`, `OVERDUE`).
- **Loading State**: Subtle barbell-racking animation.

---

## 🚢 Deployment Checklist

### 1. Frontend → Vercel
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Configured via `vercel.json` with single-page app route rewrites.

### 2. Backend → Render or Railway
- Deploy via `render.yaml` or `railway.json` / `server/Dockerfile`.
- Build command: `cd server && npm install && npx prisma generate && npm run build`
- Start command: `cd server && npx prisma migrate deploy && npm start`

### 3. Database → Neon / Supabase Postgres
- Set `DATABASE_URL` to your Neon/Supabase PostgreSQL connection string.
- In `server`, switch schema to PostgreSQL:
  ```bash
  npm run switch:postgres
  npx prisma migrate deploy
  npm run seed
  ```

### 4. Environment Variables
Copy `server/.env.example` to `server/.env`:
- `PORT=5000`
- `CLIENT_URL=https://your-frontend.vercel.app`
- `DATABASE_URL=postgresql://user:password@host/gymmate?sslmode=require`
- `JWT_ACCESS_SECRET=your_secret`
- `JWT_REFRESH_SECRET=your_secret`
- `QR_SIGNING_SECRET=your_qr_secret`
