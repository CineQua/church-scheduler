# Church Scheduler

A web-based worship service schedule generator for church administrators. Assigns members to Sunday service duties based on rank, gender, age, and fairness rotation.

A React frontend talks to a small Express + SQLite backend; the whole thing ships as a single Docker container.

## Features

- **Member Management** — Add, edit, delete members with rank, gender, age, and availability
- **Smart Scheduling** — Weighted scoring engine that rotates assignments fairly
- **Rule Engine** — All church rules live in a central config file, editable via the UI
- **Third Sunday Detection** — Automatically assigns youth conductor on the third Sunday
- **Manual Overrides** — Edit any assignment inline after generation
- **Export** — CSV, print-ready PDF, and clipboard copy
- **SQLite persistence** — Shared, central database (replaces per-browser localStorage)

## Quick Start (Docker — recommended)

```bash
docker compose up --build
```

Open [http://localhost:3001](http://localhost:3001). The SQLite database is stored in the
`church-data` Docker volume and persists across restarts.

## Quick Start (local development)

Runs the Vite frontend (port 5173) and the Express API (port 3001) together. Vite proxies
`/api` requests to the backend.

```bash
npm install
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173).

To run them separately: `npm run dev` (frontend) and `npm run dev:server` (backend).

### Production build without Docker

```bash
npm run build   # builds the frontend into dist/
npm start       # Express serves dist/ + the API on port 3001
```

## Project Structure

```
server/                # Express + SQLite backend
├── db.ts              # better-sqlite3 connection + schema + seed
├── index.ts           # Express app: API routes + serves built frontend
└── routes/
    ├── members.ts     # GET/POST/PUT/DELETE /api/members
    ├── schedules.ts   # GET/POST/PUT/DELETE /api/schedules (bulk save dedups by date)
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
│   ├── Dashboard      # Overview stats and upcoming Sundays
│   ├── Members        # Member CRUD with search/filter
│   ├── GenerateSchedule # Date range picker + generate + preview
│   ├── ViewSchedules  # View, edit, export saved schedules
│   └── Settings       # Rules editor + rank hierarchy reference
│
├── services/          # Core business logic
│   ├── scheduler      # Main scheduling orchestrator
│   ├── scoringEngine  # Weighted member scoring
│   ├── ruleEngine     # Eligibility filtering per role
│   └── exportService  # CSV / print / clipboard export
│
├── context/
│   └── AppContext     # React Context; loads from + persists to the API
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

## Database & Backend

The app uses a small **Express + SQLite** backend (`server/`). The frontend never touches
the database directly — it calls the REST API via `src/api/client.ts`.

### API endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/members` | List all members |
| POST | `/api/members` | Create a member |
| PUT | `/api/members/:id` | Update a member |
| DELETE | `/api/members/:id` | Delete a member |
| GET | `/api/schedules` | List all schedules |
| POST | `/api/schedules` | Bulk save (replaces schedules sharing a date) |
| PUT | `/api/schedules/:id` | Update one schedule (e.g. manual assignment edits) |
| DELETE | `/api/schedules/:id` | Delete a schedule |
| GET | `/api/rules` | Get the rules config |
| PUT | `/api/rules` | Update the rules config |

### SQLite schema

- `members` — one row per member; `assignmentHistory` and future optional fields stored as JSON
- `schedules` — one row per Sunday; `date` is UNIQUE; `assignments` stored as JSON keyed by role
- `rules` — single-row config blob (`id = 1`)

The DB file location is set by `DATABASE_PATH` (default `./data/church.db` locally,
`/app/data/church.db` in Docker, backed by a named volume).

### Configuration

Copy `.env.example` to `.env` and adjust `PORT` / `DATABASE_PATH` if needed.

### Migrating to PostgreSQL later

The data-access logic is isolated in `server/db.ts` and `server/routes/*`. To swap SQLite
for PostgreSQL: replace `better-sqlite3` with `pg`, convert the synchronous `db.prepare().run()`
calls to async queries, and add a `db` service to `docker-compose.yml`. The frontend and the
API contract stay unchanged.

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
- Admin user accounts
- AI-assisted scheduling recommendations
- Conflict detection
- Feast day and special event rules
