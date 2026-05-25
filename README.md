# Church Scheduler

A web-based worship service schedule generator for church administrators. Assigns members to Sunday service duties based on rank, gender, age, and fairness rotation.

## Features

- **Member Management** — Add, edit, delete members with rank, gender, age, and availability
- **Smart Scheduling** — Weighted scoring engine that rotates assignments fairly
- **Rule Engine** — All church rules live in a central config file, editable via the UI
- **Third Sunday Detection** — Automatically assigns youth conductor on the third Sunday
- **Manual Overrides** — Edit any assignment inline after generation
- **Export** — CSV, print-ready PDF, and clipboard copy

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
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
│   └── AppContext     # React Context + localStorage persistence
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

## Future Database Integration

The app currently uses `localStorage`. To migrate to a database:

1. Replace the `localStorage` read/write in `src/context/AppContext.tsx` with async API calls
2. Create a `src/api/` layer (e.g. `membersApi.ts`, `schedulesApi.ts`)
3. Swap the reducer dispatch calls to call API functions
4. Connect to Supabase/Firebase/PostgreSQL via environment variables in `.env`

The state shape (`Member[]`, `WeeklySchedule[]`, `Rules`) maps directly to database tables.

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
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Validation | Zod |
| Dates | date-fns |
| State | React Context + useReducer |
| Storage | localStorage (MVP) |
| Testing | Vitest + React Testing Library |

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm test           # Run tests
npm run lint       # ESLint
npm run format     # Prettier
```

## Future Roadmap

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
