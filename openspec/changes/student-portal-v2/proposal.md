## Why

UniHub currently serves only as a schedule/exam viewer. Students still rely on EMIS (emis.campus.edu.ge) for grades, course registration, and profile data — but EMIS has terrible UX. By integrating EMIS data, adding a dashboard, and building a conspect-sharing platform, UniHub becomes THE daily tool for Agruni students, eliminating the need to visit EMIS directly.

## What Changes

- **New dashboard** as the home page with summary cards (today's schedule, upcoming exams, GPA, quick links, recent conspects)
- **EMIS integration** via Chrome extension that captures the EMIS JWT token and enables server-side API calls for grades, profile, courses
- **Grades/GPA page** showing real academic data from EMIS (GPA trend, per-course grades, credit summary)
- **Conspect sharing platform** where students upload and rate study notes organized by subject
- **Auto-fill onboarding** from EMIS data (group, faculty, year detected automatically)
- **Redesigned navigation** with expanded sidebar (Dashboard, Schedule, Exams, Grades, Conspects, Profile) and mobile "More" drawer
- **Database** added for conspects and user data (Vercel Postgres or Supabase)
- **File storage** for conspect uploads (Vercel Blob or Supabase Storage)
- **UI redesign** based on v0.dev generated designs for all pages

## Capabilities

### New Capabilities

- `dashboard`: Home page with summary cards aggregating data from schedule, exams, grades, and conspects
- `emis-integration`: Chrome extension for EMIS token capture, server-side proxy for EMIS API calls, token storage per user
- `grades-gpa`: Grades page with GPA display, semester trend, per-course grades from EMIS data
- `conspect-sharing`: Note upload, listing, search, filtering, upvote/downvote voting system, per-subject organization
- `database-layer`: Database schema (users, conspects, votes, subjects) and file storage for uploads

### Modified Capabilities

(No existing specs to modify — this is the first OpenSpec change)

## Impact

- **New pages**: `/` (dashboard), `/grades`, `/conspects`, `/conspects/[id]`, `/conspects/upload`
- **Modified pages**: `/schedule` (redesign), `/exams` (redesign), `/profile` (EMIS connection status), `/onboarding` (auto-fill from EMIS)
- **New navigation**: Expanded sidebar (6 items), mobile "More" drawer replacing 3-tab bottom nav
- **New dependencies**: Database ORM (Drizzle or Prisma), Vercel Postgres/Supabase client, Vercel Blob, recharts (for GPA chart)
- **New infrastructure**: Chrome extension (separate build), database migrations, file storage bucket
- **API routes**: `/api/emis/token`, `/api/emis/grades`, `/api/emis/profile`, `/api/conspects/*`
- **Environment variables**: Database URL, Supabase keys, Blob token
