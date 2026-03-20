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
│   ├── layout.tsx              # Root layout: ThemeProvider + AuthSessionProvider
│   ├── page.tsx                # Login page (Google sign-in, @agruni.edu.ge only)
│   ├── onboarding/page.tsx     # Faculty → Year+Group wizard (2 steps)
│   ├── setup/page.tsx          # EMIS Chrome Extension setup flow
│   ├── dashboard/
│   │   ├── layout.tsx          # Sidebar (desktop) + bottom nav (mobile) + auth guard
│   │   ├── page.tsx            # Dashboard: today's schedule, upcoming exams, GPA, quick links
│   │   ├── schedule/page.tsx   # Weekly schedule grid (real lecture data)
│   │   ├── exams/page.tsx      # Exam list with search, filters, grouped by date
│   │   ├── grades/page.tsx     # Grades + GPA (EMIS data when connected, setup prompt otherwise)
│   │   └── settings/page.tsx   # Profile, theme, about, sign-out
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth.js Google provider
│       ├── sheets/exams/       # Exam data: Sheets API batchGet (166 tabs, 1693 exams)
│       ├── sheets/lectures/    # Lecture data: Drive API download xlsx (1741 lectures)
│       ├── emis/token/         # POST/GET/DELETE — store EMIS JWT in httpOnly cookie
│       ├── emis/proxy/         # POST — whitelist proxy to 8 EMIS endpoints
│       ├── discover/           # Scrape agruni.edu.ge for current sheet URLs
│       └── push/               # Push notification subscribe + send (daily cron)
├── components/
│   ├── ui/                     # shadcn/ui (base-nova): button, card, badge, sheet, select, etc.
│   ├── auth/                   # session-provider.tsx
│   ├── onboarding/             # step-indicator, faculty-grid, year-picker, group-picker
│   └── theme-provider.tsx      # next-themes wrapper
├── lib/
│   ├── auth.ts                 # NextAuth v5 config (Google, @agruni.edu.ge, signIn page: /)
│   ├── google-auth.ts          # OAuth2Client (uni account) + ServiceAccount (fallback)
│   ├── subject-matcher.ts      # Fuzzy matching: exact → Roman↔Arabic → paren strip
│   ├── group-decoder.ts        # Group code mapping: con24-01 → Civil Engineering, 2024, group 1
│   ├── exam-types.ts           # Georgian exam type parser
│   ├── storage.ts              # localStorage wrapper with STORAGE_KEYS
│   └── sheets/                 # cache, persistent-cache, discover-tabs, parse-exams, etc.
├── hooks/
│   ├── use-auth-guard.ts       # Checks session + group, redirects to / or /onboarding
│   ├── use-user-group.ts       # localStorage group with loading state
│   ├── use-exams.ts            # Fetch + fuzzy subject filter
│   ├── use-schedule.ts         # Fetch lectures + subject filter + weekSchedule
│   ├── use-emis.ts             # Extension detection, token sync, EMIS API proxy calls
│   └── use-subjects.ts         # Subject selection state (localStorage)
├── types/                      # exam.ts, lecture.ts, group.ts, chrome.d.ts
└── extension/                  # Chrome Extension for EMIS token capture
    ├── manifest.json           # Manifest v3, externally_connectable
    ├── content.js              # Captures Student-Token from EMIS localStorage
    ├── background.js           # Messaging bridge for webapp ↔ extension
    ├── popup.html/js           # Connection status indicator
    └── icons/                  # 16, 48, 128 PNG icons
```

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · shadcn/ui (base-nova) · next-themes · lucide-react · recharts · papaparse · xlsx · date-fns · googleapis · google-auth-library · NextAuth.js v5 (beta) · Chrome Extension (Manifest v3)

## Key Technical Details

### Authentication
- NextAuth.js v5 with Google provider
- Restricted to `@agruni.edu.ge` emails only (signIn callback)
- Session stored in JWT (no database)
- Auth guard: unauthenticated → /, no group → /onboarding, else → /dashboard

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

### Design System (v0.dev Emerald & Gold)
- Primary: Emerald green (oklch hue 160)
- Accent: Gold (oklch hue 85)
- Logo: SVG hexagon with "U" letterform + gold accent dot
- Dark mode: Deep green tones
- Fonts: Inter (Latin), system fallback for Georgian
- Mobile: bottom nav (3 tabs: Dashboard, Schedule, Exams) + "More" drawer
- Desktop: sidebar nav (240px, fixed)
- Glassmorphism cards on login/onboarding/setup pages
- Animated gradient backgrounds on fullscreen pages

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

- **Georgian UI**: Hardcoded Georgian text (no i18n — removed)
- **Named exports only**
- **Path alias `@/*`** → `src/*`
- **Mobile-first**: 375px minimum, scale up
- **Server-side data**: Google Sheets/Drive fetching in API routes only
- **Cache**: 1-hour TTL, 3 layers (memory → file → API)
- **Auth required**: All /dashboard/* pages require Google sign-in
- **Commit per phase**: Commit after user confirms each phase
- **EMIS proxy whitelist**: Only 8 approved endpoints in /api/emis/proxy

## v2 Roadmap

### Phase 1: v0.dev Design — DONE
Fresh redesign: Emerald/Gold theme, new route structure, all pages

### Phase 2: Dashboard + Navigation — DONE
Sidebar + bottom nav, dashboard with real data, onboarding restyled

### Phase 3: EMIS Integration — DONE
Chrome Extension (token capture), API proxy (8 endpoints), useEmis hook, grades page wired

### Phase 4: Conspect Sharing — TODO
Database (Vercel Postgres or Supabase), file upload (Vercel Blob), CRUD + voting + search

### Phase 5: Polish + Production — TODO
Final UI, performance, full deployment
