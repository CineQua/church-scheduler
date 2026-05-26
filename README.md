# Church Scheduler

A web-based, multi-admin worship service schedule generator for church administrators. Assigns members to Sunday service duties based on rank, gender, age, and fairness rotation.

A React frontend talks to a small Express + SQLite backend; the whole thing ships as a single Docker container and is shared by multiple authenticated admins.

## Features

- **Multi-admin login** — Email/password authentication with hashed passwords and signed-cookie sessions
- **Role-based access** — Super Admin, Scheduler Admin, and read-only Viewer roles
- **Member Management** — Add, edit, delete members with rank, gender, age, and availability
- **Import / Export** — Download members as CSV or JSON and import them back (CSV for editing in a spreadsheet, JSON for full backup); imports upsert by ID and validate every row
- **Smart Scheduling** — Weighted scoring engine that rotates assignments fairly
- **Rule Engine** — All church rules live in a central config, editable via the UI
- **Third Sunday Detection** — Automatically assigns youth conductor on the third Sunday
- **Manual Overrides** — Edit any assignment inline after generation
- **Export** — CSV, print-ready PDF, and clipboard copy
- **SQLite persistence** — Shared, central database on a persistent `/data` volume (replaces per-browser localStorage)

## Quick Start (Docker — recommended)

1. Create a `.env` file (Docker Compose reads it automatically):

   ```bash
   cp .env.example .env
   ```

   Set at minimum a strong `JWT_SECRET` and the first-admin credentials:

   ```ini
   JWT_SECRET=<run: openssl rand -hex 32>
   ADMIN_EMAIL=admin@yourchurch.org
   ADMIN_PASSWORD=<a strong password>
   ```

2. Build and run:

   ```bash
   docker compose up --build -d
   ```

Open [http://localhost:3001](http://localhost:3001) and sign in with the admin
credentials above. The SQLite database lives in the `church-data` Docker volume
(mounted at `/data`) and persists across restarts. The first Super Admin is
created automatically on first boot.

## Quick Start (local development)

Runs the Vite frontend (port 5173) and the Express API (port 3001) together. Vite proxies
`/api` requests to the backend.

```bash
npm install
cp .env.example .env          # then set ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173) and log in. On first run the
server seeds the Super Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. You can also
create it explicitly:

```bash
npm run seed                  # create the first Super Admin from env vars
```

To run the processes separately: `npm run dev` (frontend) and `npm run dev:server` (backend).

### Production build without Docker

```bash
npm run build   # builds the frontend into dist/
npm start       # Express serves dist/ + the API on port 3001
```

In production, set `NODE_ENV=production` and a `JWT_SECRET` of at least 32
characters — the server refuses to start without it.

## Project Structure

```
server/                # Express + SQLite backend
├── env.ts             # Centralised env/secret config
├── db.ts              # better-sqlite3 connection; runs migrations + seeds
├── schema.ts          # All table definitions (idempotent migrate())
├── auth.ts            # Password hashing (bcrypt) + JWT sign/verify + roles
├── middleware.ts      # requireAuth / requireRole route guards
├── users.ts           # User data-access (create/list/update/delete)
├── seed.ts            # Creates the first Super Admin from env vars
├── migrate.ts         # `npm run db:migrate` entry point
├── index.ts           # Express app: protected API routes + serves frontend
└── routes/
    ├── auth.ts        # POST /api/auth/login, /logout, GET /me
    ├── users.ts       # CRUD /api/users (Super Admin only)
    ├── ranks.ts       # GET /api/ranks (reference data)
    ├── members.ts     # GET/POST/PUT/DELETE /api/members
    ├── schedules.ts   # GET/POST/PUT/DELETE /api/schedules (+ normalised mirror)
    └── rules.ts       # GET/PUT /api/rules

src/
├── api/
│   └── client.ts      # Typed fetch wrappers for the backend (/api/*)
│
├── components/        # Reusable UI components
│   ├── MemberForm     # Add/edit member modal form
│   ├── MemberTable    # Members list with inline actions
│   ├── ScheduleTable  # Schedule display with inline editing
│   ├── ExportButtons  # CSV / PDF / clipboard export
│   ├── DashboardCards # Stat cards
│   ├── RulesEditor    # Settings page rule editor
│   ├── Navbar         # Sidebar (desktop) + bottom nav (mobile)
│   └── Modal          # Reusable modal wrapper
│
├── pages/             # Route-level pages
│   ├── Login          # Email/password sign-in
│   ├── Dashboard      # Overview stats and upcoming Sundays
│   ├── Members        # Member CRUD with search/filter
│   ├── GenerateSchedule # Date range picker + generate + preview
│   ├── ViewSchedules  # View, edit, export saved schedules
│   ├── Settings       # Rules editor + rank hierarchy reference
│   └── Users          # Admin user management (Super Admin only)
│
├── context/
│   ├── AppContext     # App data; loads from + persists to the API
│   └── AuthContext    # Session + role state; login/logout
│
├── services/          # Core business logic
│   ├── scheduler      # Main scheduling orchestrator
│   ├── scoringEngine  # Weighted member scoring
│   ├── ruleEngine     # Eligibility filtering per role
│   └── exportService  # CSV / print / clipboard export
│
├── data/
│   ├── rules.ts       # Default rule configuration
│   └── rankHierarchy  # Rank definitions (level, category)
│
├── types/             # TypeScript types + Zod schemas
│   ├── Member
│   ├── Assignment
│   └── Rules
│
└── utils/
    ├── dateUtils      # Sunday detection, third-Sunday logic
    ├── memberUtils    # Eligibility and history helpers
    └── scheduleUtils  # Schedule data helpers
```

## How the Scheduler Works

### Step-by-step flow

1. Get all Sundays in the selected date range
2. For each Sunday, determine if it is the **third Sunday of the month**
3. Load active members and apply existing schedule history
4. For each role (in order: Conductor → Prayer 1 → 2 → 3 → Lessons), filter eligible candidates using the **Rule Engine**
5. Score all candidates using the **Scoring Engine**
6. Pick the highest-scoring candidate; mark them assigned for that day
7. Save the schedule; move to the next Sunday

### Third Sunday detection

```ts
// src/utils/dateUtils.ts
isThirdSundayOfMonth(date)
```

Counts Sundays from the first of the month up to the given date. If it's the third count, it's a Third Sunday.

## How Scoring Works

Each eligible member gets a numeric score. Higher score = selected first.

| Condition | Points |
|---|---|
| Not served recently (28+ days) | +50 |
| Preferred rank match | +30–40 |
| Few recent assignments | +20 |
| Not served in 2 Sundays | +15 |
| Rank is above required | +15 |
| Served previous Sunday | -40 |
| Already assigned today | -50 |
| Rank below preferred | -20 |
| Served same role recently | -75 |
| Inactive | -100 |
| Unavailable | -100 |
| Rank below minimum | -1000 |
| Violates a hard rule | -1000 |

All weights are editable in **Settings → Scoring Weights**.

## How to Add a New Rule

1. Add your rule fields to `src/types/Rules.ts`
2. Add the default values in `src/data/rules.ts`
3. In `src/services/ruleEngine.ts`, add a new `getEligible*()` function and connect it in `getEligibleCandidates()`
4. Add rank scoring logic in `src/services/scoringEngine.ts` inside `calculateRankScore()`

## How to Add a New Service Role

1. Add the role key to the `ServiceRole` union type in `src/types/Assignment.ts`
2. Add its label to `SERVICE_ROLE_LABELS`
3. Add it to the `ALL_ROLES` array (controls display order)
4. Add eligibility logic in `ruleEngine.ts`
5. Add scoring logic in `scoringEngine.ts`
6. Add rule configuration in `rules.ts` and `Rules.ts`

## Rank Hierarchy

Ranks are gender-specific. **Youth** (level 1) is shared by both. The member
form shows only the ranks valid for the selected gender. Levels drive the
scheduling rules for male roles; female ranks are organisational (the only
female role, Prayer 2, has no rank requirement).

**Male**

| Level | Name | Category |
|---|---|---|
| 1 | Youth | Youth |
| 2 | Brother | Lower Rank |
| 3 | Senior Brother | Lower Rank |
| 4 | Assistant Leader | Lower Rank |
| 5 | Leader | Higher Rank |
| 6 | Senior Leader | Higher Rank |
| 7 | Evangelist | Higher Rank |
| 8 | Most Senior Evangelist | Higher Rank |
| 9 | Superior Evangelist | Higher Rank |
| 10 | Shepherd | Higher Rank |

**Female**

| Level | Name | Category |
|---|---|---|
| 1 | Youth | Youth |
| 2 | Sister | Lower Rank |
| 3 | Elder Sister | Lower Rank |
| 4 | Senior Elder Sister | Lower Rank |
| 5 | Superior Senior Elder Sister | Higher Rank |
| 6 | Mother Celestial | Higher Rank |

## Authentication & Roles

Login uses email + password. Passwords are hashed with **bcrypt** and never
stored in plaintext. On success the server issues a **JWT** stored in an
**httpOnly cookie** (`Secure` + `SameSite=Lax` in production), so the token is
never exposed to JavaScript. Logout clears the cookie.

The first **Super Admin** is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on
first boot (or via `npm run seed`). Super Admins create all other users under
the **Users** page.

| Role | Capabilities |
|---|---|
| **Super Admin** | Full access, including creating/editing/disabling other admin users |
| **Scheduler Admin** | Manage members, generate/edit schedules, edit rules |
| **Viewer** | Read-only access to members and schedules |

Roles are enforced **server-side** by middleware (`server/middleware.ts`): every
`/api` route except `/api/auth/*` and `/api/health` requires a valid session;
`GET`s are allowed for any role, writes require an admin role, and `/api/users`
requires Super Admin. The frontend additionally hides controls a role can't use.

**Password management:** any signed-in user can change their own password from
the navbar (**Change password** → `POST /api/auth/change-password`, which
verifies the current password). Super Admins can reset any user's password from
the **Users** page (key icon → `PUT /api/users/:id`).

## Database & Backend

The app uses a small **Express + SQLite** backend (`server/`). The frontend never touches
the database directly — it calls the REST API via `src/api/client.ts`.

### API endpoints

All routes below `/api` require authentication except `/api/health` and
`/api/auth/login`. Write methods require an admin role; `/api/users` requires
Super Admin.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Sign in; sets the session cookie |
| POST | `/api/auth/logout` | auth | Clear the session cookie |
| GET | `/api/auth/me` | auth | Current user + role |
| POST | `/api/auth/change-password` | auth | Change your own password |
| GET | `/api/users` | super_admin | List admin users |
| POST | `/api/users` | super_admin | Create an admin user |
| PUT | `/api/users/:id` | super_admin | Update role / status / password |
| DELETE | `/api/users/:id` | super_admin | Delete an admin user |
| GET | `/api/ranks` | auth | Rank reference data |
| GET | `/api/members` | auth | List all members |
| POST/PUT/DELETE | `/api/members[/:id]` | admin | Create / update / delete a member |
| GET | `/api/schedules` | auth | List all schedules |
| POST | `/api/schedules` | admin | Bulk save (replaces schedules sharing a date) |
| PUT/DELETE | `/api/schedules/:id` | admin | Update / delete a schedule |
| GET | `/api/rules` | auth | Get the rules config |
| PUT | `/api/rules` | admin | Update the rules config |

All write payloads are validated with **Zod** before touching the database.

### SQLite schema

- `users` — admin accounts; `passwordHash` (bcrypt), `role`, `isActive`
- `members` — one row per member; `assignmentHistory` + optional fields as JSON
- `ranks` — rank reference data (name, level, category), seeded from the hierarchy
- `rules` — single-row config blob (`id = 1`)
- `schedules` — one row per Sunday; `date` UNIQUE; `assignments` as JSON keyed by role
- `assignments` — normalised mirror: one row per role per schedule
- `assignment_history` — append-only audit log of assignment changes

Migrations live in `server/schema.ts` and run automatically on startup (and via
`npm run db:migrate`). They are idempotent, so existing data is preserved.

The DB file location is set by `DATABASE_PATH` (default
`./data/church-scheduler.sqlite` locally, `/data/church-scheduler.sqlite` in
Docker, backed by a named volume mounted at `/data`).

### Environment variables

Copy `.env.example` to `.env` and set the values. See
[DEPLOYMENT.md](./DEPLOYMENT.md) for the full reference.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | — | `development` | `production` enables secure cookies + strict secret checks |
| `PORT` | — | `3001` | Server port |
| `DATABASE_PATH` | — | `./data/church-scheduler.sqlite` | SQLite file location |
| `JWT_SECRET` | **prod** | dev placeholder | Token signing secret (≥ 32 chars in prod) |
| `JWT_EXPIRES_IN` | — | `7d` | Session lifetime |
| `ADMIN_EMAIL` | first boot | — | Email of the seeded Super Admin |
| `ADMIN_PASSWORD` | first boot | — | Password of the seeded Super Admin (≥ 8 chars) |
| `ADMIN_NAME` | — | `Super Admin` | Display name of the seeded admin |

## Production Deployment

The app deploys as a single Docker image with a persistent disk mounted at
`/data`. Step-by-step instructions for **Render** and **Railway**, including the
required environment variables, are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Security checklist for production:

- Serve over **HTTPS** (Render/Railway provide TLS; the app sets `trust proxy`
  and `Secure` cookies automatically when `NODE_ENV=production`).
- Set a strong, unique `JWT_SECRET` (`openssl rand -hex 32`).
- Keep all secrets in environment variables — never commit `.env`.
- The SQLite file is on the server volume only and is **never** served over HTTP.
- Change the seeded admin password after first login.

## Backup & Restore

All state is the single SQLite file on the `/data` volume. To back up, copy
`/data/church-scheduler.sqlite` somewhere safe; to restore, stop the app, swap
the file back in (removing any `-wal`/`-shm` siblings), and restart. Full
commands for Docker, Render, and Railway are in
**[DEPLOYMENT.md → Backup & Restore](./DEPLOYMENT.md#backup--restore)**.

For a quick, no-shell backup of your **members** specifically, use **Export
JSON** on the Members page and keep the file safe — you can re-import it later
from the same page. (This covers members only, not schedules/users.)

### Migrating to PostgreSQL later

The data-access logic is isolated in `server/` (`db.ts`, `schema.ts`, `users.ts`,
`routes/*`). To swap SQLite for PostgreSQL: replace `better-sqlite3` with `pg`,
convert the synchronous `db.prepare().run()` calls to async queries, and add a
`db` service to `docker-compose.yml`. The frontend and the API contract stay unchanged.

## Git Workflow

```
main
development
feature/*
```

```bash
git checkout -b feature/choir-schedules
git commit -m "feat: add choir schedule module"
git push origin feature/choir-schedules
# open pull request into development
```

### Commit message convention

```
feat: add member management module
fix: resolve duplicate assignment issue
refactor: move schedule logic into services
docs: update README
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Validation | Zod |
| Dates | date-fns |
| State | React Context + useReducer |
| Backend | Express 4 (TypeScript via tsx) |
| Auth | bcryptjs (hashing) + jsonwebtoken (JWT) + httpOnly cookies |
| Database | SQLite (better-sqlite3) |
| Container | Docker + docker-compose |
| Testing | Vitest + React Testing Library |

## Scripts

```bash
npm run dev:all          # Frontend + backend together (dev)
npm run dev              # Frontend only (Vite, port 5173)
npm run dev:server       # Backend only (Express, port 3001)
npm run build            # Production build of the frontend
npm start                # Run the backend serving the built frontend
npm run db:migrate       # Apply the database schema (idempotent)
npm run seed             # Create the first Super Admin from env vars
npm test                 # Run unit tests
npm run typecheck:server # Type-check the backend
npm run lint             # ESLint
npm run format           # Prettier
```

## Future Roadmap

- PostgreSQL option for multi-parish / high-concurrency deployments
- Cloud database sync (Supabase / Firebase)
- Choir and Sunday School schedules
- Availability calendar
- Email/SMS notifications
- Multi-parish support
- Role swapping requests
- Email invitations / self-service password reset (forgot-password) for new admins
- AI-assisted scheduling recommendations
- Conflict detection
- Feast day and special event rules
