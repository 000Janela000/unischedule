# UniHub v2 — Full Student Portal Roadmap

## Vision

Transform UniHub from schedule/exam viewer into THE student portal for Agruni — replacing EMIS as the daily tool. Students log in once, see everything: schedule, exams, grades, GPA, conspects, all in one beautiful app.

## Pages

| Page | Source | Status |
|------|--------|--------|
| `/login` | NextAuth Google | ✅ Built |
| `/` (Dashboard) | Exams + Lectures + EMIS | 🔲 Planned |
| `/schedule` | Google Sheets xlsx | ✅ Built (needs redesign) |
| `/exams` | Google Sheets (166 tabs) | ✅ Built (needs redesign) |
| `/grades` | EMIS API | 🔲 Planned |
| `/conspects` | Our database | 🔲 Planned |
| `/conspects/[id]` | Our database | 🔲 Planned |
| `/conspects/upload` | Our database + storage | 🔲 Planned |
| `/profile` | NextAuth + EMIS | ✅ Built (needs expansion) |
| `/onboarding` | Manual (EMIS auto-fill planned) | ✅ Built |
| `/subjects` | Exams + Lectures | ✅ Built |

## Phases

### Phase 1: v0.dev Design Generation
User generates UI designs in v0.dev. See `docs/v0-prompts.md` for all prompts.

### Phase 2: Dashboard + Navigation
- New home page: Today's Schedule + Upcoming Exams + GPA card + Quick Links + Recent Conspects
- Redesigned sidebar: Dashboard, Schedule, Exams, Grades, Conspects, Profile
- Mobile: bottom nav with "More" drawer for extra sections

### Phase 3: EMIS Integration
- Chrome extension: reads Student-Token from emis.campus.edu.ge localStorage
- API endpoint: `POST /api/emis/token` — stores token per user
- Proxy routes: `/api/emis/grades`, `/api/emis/profile`, `/api/emis/courses`
- Auto-fill onboarding from EMIS student data (group, faculty, year)
- Grades/GPA page with real data from EMIS

### Phase 4: Conspect Sharing
- Database: Vercel Postgres (free tier) or Supabase
  - Tables: users, conspects, votes, subjects
- Storage: Vercel Blob (free 256MB) or Supabase Storage
  - File types: PDF, DOCX, images, links
- Features: upload, search, filter by subject/rating, upvote/downvote
- Organization: Faculty → Subject → Conspects

### Phase 5: Polish + Production
- Final UI across all pages
- Performance (lazy loading, image optimization)
- SEO + meta tags
- Error tracking

## Tech Decisions

| Need | Decision | Reason |
|------|----------|--------|
| Database | Vercel Postgres or Supabase | Free tier, works with Vercel |
| File storage | Vercel Blob or Supabase Storage | Free 256MB, simple API |
| EMIS token | Chrome Extension | Only viable automated approach (exhaustively tested) |
| Auth | NextAuth.js v5 | Already implemented, Google provider |
| Design | v0.dev → integrate | Generates shadcn/ui + Tailwind code directly |
