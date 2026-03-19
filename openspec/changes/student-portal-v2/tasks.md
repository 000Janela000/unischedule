# Tasks: student-portal-v2

## Phase 1: v0.dev Design Generation
- [ ] User generates Login page design in v0.dev
- [ ] User generates Dashboard design in v0.dev
- [ ] User generates Schedule page design in v0.dev
- [ ] User generates Exams page design in v0.dev
- [ ] User generates Grades/GPA page design in v0.dev
- [ ] User generates Conspects page design in v0.dev
- [ ] User generates Profile page design in v0.dev
- [ ] Integrate v0.dev generated code into project, adapt to existing patterns

## Phase 2: Database + Infrastructure
- [ ] Install Drizzle ORM + Vercel Postgres client (`drizzle-orm`, `@vercel/postgres`)
- [ ] Create database schema in `src/lib/db/schema.ts` (users, conspects, votes)
- [ ] Create Drizzle config `drizzle.config.ts`
- [ ] Run initial migration
- [ ] Set up Vercel Postgres on Vercel dashboard (free tier)
- [ ] Set up Vercel Blob for file storage
- [ ] Create `src/lib/db/index.ts` database client
- [ ] Update user record on NextAuth sign-in (upsert to users table)

## Phase 3: Dashboard
- [ ] Create `src/app/(main)/page.tsx` as dashboard home
- [ ] Create `src/components/dashboard/today-schedule-card.tsx`
- [ ] Create `src/components/dashboard/upcoming-exams-card.tsx`
- [ ] Create `src/components/dashboard/gpa-card.tsx`
- [ ] Create `src/components/dashboard/quick-links-card.tsx`
- [ ] Create `src/components/dashboard/recent-conspects-card.tsx`
- [ ] Update navigation: sidebar adds Dashboard, Grades, Conspects links
- [ ] Update mobile bottom nav: add "More" drawer for extra pages

## Phase 4: EMIS Integration
- [ ] Create Chrome extension: `extension/manifest.json`
- [ ] Create Chrome extension: `extension/content.js` (reads Student-Token, sends to API)
- [ ] Create `src/app/api/emis/token/route.ts` — store EMIS token per user
- [ ] Create `src/app/api/emis/grades/route.ts` — proxy EMIS grades
- [ ] Create `src/app/api/emis/profile/route.ts` — proxy EMIS student details
- [ ] Create `src/app/api/emis/courses/route.ts` — proxy EMIS registered courses
- [ ] Create `src/hooks/use-emis.ts` — hook for EMIS data with loading/error states
- [ ] Update onboarding to auto-detect group from EMIS data if available
- [ ] Add EMIS connection status to profile page

## Phase 5: Grades/GPA Page
- [ ] Install recharts for GPA trend chart
- [ ] Create `src/app/grades/page.tsx`
- [ ] Create `src/components/grades/gpa-display.tsx` (large GPA number)
- [ ] Create `src/components/grades/gpa-chart.tsx` (semester trend line chart)
- [ ] Create `src/components/grades/course-grades-table.tsx` (per-course grades)
- [ ] Create `src/components/grades/credit-summary.tsx` (earned vs required)
- [ ] Handle EMIS not connected state with install instructions

## Phase 6: Conspect Sharing
- [ ] Create `src/app/api/conspects/route.ts` — list + create conspects
- [ ] Create `src/app/api/conspects/[id]/route.ts` — get single conspect
- [ ] Create `src/app/api/conspects/[id]/vote/route.ts` — upvote/downvote
- [ ] Create `src/app/api/upload/route.ts` — file upload to Vercel Blob
- [ ] Create `src/app/conspects/page.tsx` — listing with search + filters
- [ ] Create `src/app/conspects/[id]/page.tsx` — detail view with preview
- [ ] Create `src/app/conspects/upload/page.tsx` — upload form
- [ ] Create `src/components/conspects/conspect-card.tsx`
- [ ] Create `src/components/conspects/vote-button.tsx`
- [ ] Create `src/components/conspects/upload-form.tsx`
- [ ] Create `src/components/conspects/file-preview.tsx` (PDF inline viewer)

## Phase 7: UI Redesign (v0.dev integration)
- [ ] Redesign login page from v0.dev output
- [ ] Redesign schedule page from v0.dev output
- [ ] Redesign exams page from v0.dev output
- [ ] Redesign profile page with EMIS connection
- [ ] Update navigation (sidebar + mobile) for all new pages
- [ ] Ensure dark mode works on all new pages
- [ ] Ensure Georgian + English i18n on all new pages
- [ ] Mobile responsiveness check (375px) on all pages

## Phase 8: Polish + Deploy
- [ ] Add loading skeletons to all new pages
- [ ] Add error states with retry to all new pages
- [ ] Add empty states to conspects and grades
- [ ] Update CLAUDE.md with final v2 architecture
- [ ] Update environment variables on Vercel
- [ ] Publish Chrome extension to Chrome Web Store (or distribute as .crx)
- [ ] Final production test
