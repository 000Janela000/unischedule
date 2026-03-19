# CLAUDE.md — UniHub

## Project

**UniHub** — Student portal for Agricultural University of Georgia (agruni.edu.ge). Started as a schedule/exam tracker, evolving into a full student portal replacing EMIS. Parses Google Sheets for exam/lecture schedules, integrates with EMIS for grades/profile, and provides conspect (note) sharing.

**Repo**: https://github.com/000Janela000/unihub
**Deployed**: https://unihub-edu.vercel.app
**Owner**: Student at Agruni (sjane2021@agruni.edu.ge)

## Current Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout: AuthSessionProvider, LanguageProvider, nav
│   ├── page.tsx                # Redirect: unauthenticated→/login, no group→/onboarding, else→/exams
│   ├── login/page.tsx          # Google sign-in (@agruni.edu.ge only)
│   ├── profile/page.tsx        # User profile + settings
│   ├── onboarding/page.tsx     # Faculty → Year+Group wizard (2 steps)
│   ├── subjects/page.tsx       # Subject selection (group subjects + all university subjects)
│   ├── exams/page.tsx          # Exam list with search, countdowns, calendar export
│   ├── schedule/page.tsx       # Weekly lecture schedule (card-based timeline)
│   ├── settings/page.tsx       # Theme, language, notifications
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth.js Google provider
│       ├── sheets/exams/       # Exam data: Sheets API batchGet (166 tabs, 1693 exams)
│       ├── sheets/lectures/    # Lecture data: Drive API download xlsx (1741 lectures)
│       ├── discover/           # Scrape agruni.edu.ge for current sheet URLs
│       └── push/               # Push notification subscribe + send (daily cron)
├── components/
│   ├── ui/                     # shadcn/ui: button, card, badge, skeleton, separator
│   ├── auth/                   # session-provider.tsx
│   ├── layout/                 # sidebar-nav, bottom-nav, header, install-prompt, sw-registrar
│   ├── exams/                  # exam-card, exam-type-badge, countdown-timer, exam-day-group
│   ├── schedule/               # week-grid, day-column, lecture-card
│   ├── subjects/               # subject-filter
│   └── onboarding/             # step-indicator, faculty-grid, year-picker, group-picker
├── lib/
│   ├── auth.ts                 # NextAuth v5 config (Google, @agruni.edu.ge restriction)
│   ├── google-auth.ts          # OAuth2Client (uni account) + ServiceAccount (fallback)
│   ├── subject-matcher.ts      # Fuzzy matching: exact → Roman↔Arabic → paren strip (theory preferred)
│   ├── group-decoder.ts        # Group code mapping: con24-01 → Civil Engineering, 2024, group 1
│   ├── exam-types.ts           # Georgian exam type parser: შუალედური→midterm, ფინალური→final
│   ├── georgian-dates.ts       # Georgian month names, relative dates
│   ├── calendar-export.ts      # .ics file generation (Asia/Tbilisi timezone)
│   ├── storage.ts              # localStorage wrapper with STORAGE_KEYS
│   ├── notifications.ts        # Push subscription helpers (VAPID)
│   └── sheets/
│       ├── cache.ts            # In-memory TTL cache (1 hour)
│       ├── persistent-cache.ts # File-based cache (data/*.json, /tmp on Vercel)
│       ├── fetch-csv.ts        # Google Sheets CSV via gviz API
│       ├── discover-tabs.ts    # Sheets API: discover all tabs + parse DD/MM dates
│       ├── parse-exams.ts      # CSV/array → Exam objects (String coercion for Sheets API numbers)
│       └── discover-urls.ts    # Scrape agruni.edu.ge for sheet URLs
├── hooks/
│   ├── use-auth-guard.ts       # Checks NextAuth session + group, redirects to /login or /onboarding
│   ├── use-user-group.ts       # localStorage group with loading state
│   ├── use-exams.ts            # Fetch + fuzzy subject filter (4-tier: exact→Roman→paren→fallback)
│   ├── use-schedule.ts         # Fetch lectures + subject filter
│   ├── use-subjects.ts         # Subject selection state (localStorage)
│   ├── use-theme.ts            # Dark/light/system theme
│   ├── use-notifications.ts    # Push notification permission + subscribe
│   └── use-install-prompt.ts   # PWA install prompt
├── types/                      # exam.ts, lecture.ts, group.ts
└── i18n/                       # ka.ts (Georgian primary), en.ts (English)
```

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · lucide-react · papaparse · xlsx · date-fns · googleapis · google-auth-library · NextAuth.js v5 (beta) · web-push · Service Worker (PWA)

## Key Technical Details

### Authentication
- NextAuth.js v5 with Google provider
- Restricted to `@agruni.edu.ge` emails only (signIn callback)
- Session stored in JWT (no database)
- Auth guard on all pages: unauthenticated → /login, no group → /onboarding

### Data Pipeline
- **Exams**: Sheets API v4 `batchGet` (4 API calls for 166 tabs). 1693 exams with real dates (DD/MM tab names → Date).
- **Lectures**: Drive API downloads xlsx, parses "Total Schedule as a List" sheet. 1741 lectures.
- **Caching**: 3 layers — in-memory (Map, 1hr TTL) → file cache (data/*.json, 1hr TTL) → Google API
- **Subject matching**: `src/lib/subject-matcher.ts` — normalizeSubject (Roman↔Arabic), stripParenthetical, subjectsMatch. Prefers theory over lab when matching.

### Google Auth Setup
- OAuth Client ID: `414032735105-...` (project: unischedule-490612)
- Scopes: spreadsheets.readonly, drive.readonly, userinfo.profile, userinfo.email
- Refresh token from sjane2021@agruni.edu.ge (for lecture sheet access)
- Service Account for exam sheet (public, Sheets API more reliable than gviz)

### Group Code System
| Prefix | Faculty | Example |
|--------|---------|---------|
| agr | Agronomy | agr24-01 |
| chem | Chemistry | chem24-01 |
| bio | Biology | bio24-01 |
| food | Food Technology | food24-01 |
| eno | Viticulture-Winemaking | eno24-01 |
| vet | Veterinary | vet24-01 |
| for | Forestry | for24-01 |
| land | Landscape Management | land24-01 |
| elec | ECE (Electrical & Computer) | elec24-01 |
| con | Civil/Construction Engineering | con24-01 |
| mech | Mechanical Engineering | mech24-01 |
| (none) | First Year Common | 25-01 |
| MAGR | Master's Agronomy | MAGR25 |

First year (year=1): no prefix, just `YY-NN` (e.g., `25-01`). Faculty saved to profile but not in group code.

### EMIS Integration (Planned — v2)
- EMIS URL: `https://emis.campus.edu.ge`
- EMIS uses Google OAuth for students (`/student/auth/google`)
- EMIS Client ID: `95206704161-7vdt8olo1jdndsukt5k5brb3ua8fgta2.apps.googleusercontent.com`
- Token: JWT stored in `localStorage("Student-Token")`, sent as `Authorization: Bearer <token>`
- CORS: `Access-Control-Allow-Origin: *` (wide open — our server CAN call EMIS APIs)
- **Token capture**: Chrome Extension required (cross-origin blocks popup/iframe localStorage access)
- API base: `/student/` prefix (e.g., `/student/students/getDetails`)

#### Confirmed EMIS API Endpoints
| Endpoint | Method | Data |
|----------|--------|------|
| `/student/students/getDetails` | POST | Student profile, group, program |
| `/student/result/get` | POST | Grades/results |
| `/student/registration/getStudentData` | GET | Enrollment data |
| `/student/registration/getRegistrationBooks` | POST | Registered courses |
| `/student/registration/getProgram` | POST | Curriculum/program |
| `/student/tables/getAcTables` | POST | Academic tables/schedule |
| `/student/arch/getProgram` | POST | Program structure |
| `/student/bib/getItems` | POST | Library items |
| `/student/chancellery/getUserInfo` | GET | User info |
| `/student/login` | POST | Username/password auth (needs reCAPTCHA) |
| `/student/checkUsername` | POST | Check if username exists |

### Design System
- Primary color: Indigo/Blue-purple (`#6366f1`, oklch hue 264)
- Logo: Blue-to-purple gradient geometric "U" icon
- Dark mode: Deep blue-purple tones
- Fonts: Noto Sans (supports Georgian)
- Mobile: bottom nav (3 tabs: Exams, Schedule, Settings)
- Desktop: sidebar nav (240px, backdrop-blur)

## Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
node scripts/get-refresh-token.js  # One-time Google OAuth token setup
```

## Environment Variables

```
# Google Sheets
EXAM_SHEET_ID=1pHchPdQPuPRyq_2HJJItcH3MtITXSJFrVEqobGZiW_0
LECTURE_SHEET_ID=1PY7AyDut0EjvzIW6C6bLH-2iFYIbLVau

# Google Auth (shared: Sheets API + user sign-in)
GOOGLE_CLIENT_ID=414032735105-hp4mp5n8f89ct50i3j53acg4uhp1v45f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_REFRESH_TOKEN=<refresh-token-from-sjane2021@agruni.edu.ge>
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=<local-only-path>

# NextAuth
NEXTAUTH_URL=http://localhost:3000 (or Vercel URL)
AUTH_SECRET=<random-string>

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public>
VAPID_PRIVATE_KEY=<vapid-private>
VAPID_SUBJECT=mailto:sjane2021@agruni.edu.ge

# Cron
CRON_SECRET=<random-string>
```

## Deployment

- **Vercel**: Free Hobby tier. Auto-deploys from GitHub.
- **Domain**: unihub-edu.vercel.app
- **Cron**: Daily at 7am UTC (`vercel.json`)
- **File cache**: `/tmp` on Vercel (survives warm instances)

## OpenSpec

Config: `openspec/config.yaml`
Skills: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`

## Key Rules

- **Georgian first**: All UI strings through i18n (ka.ts primary)
- **Named exports only**
- **Path alias `@/*`** → `src/*`
- **Mobile-first**: 375px minimum, scale up
- **Server-side data**: Google Sheets/Drive fetching in API routes only
- **Cache**: 1-hour TTL, 3 layers (memory → file → API)
- **Auth required**: All pages require Google sign-in
- **Commit per phase**: Commit after user confirms each phase

## v2 Roadmap

### Phase 1: v0.dev Design Generation
User generates designs in v0.dev for: Login, Dashboard, Schedule, Exams, Grades, Conspects, Profile

### Phase 2: Dashboard + Navigation Redesign
New home dashboard, redesigned sidebar (Dashboard, Schedule, Exams, Grades, Conspects, Profile), mobile "More" drawer

### Phase 3: EMIS Integration (Chrome Extension)
Tiny extension reads EMIS token → sends to UniHub API → enables grades/GPA/profile auto-fill

### Phase 4: Conspect Sharing
Database (Vercel Postgres or Supabase), file upload (Vercel Blob), CRUD + voting + search

### Phase 5: Polish + Production
Final UI, performance, full deployment
