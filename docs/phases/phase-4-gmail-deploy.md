# Phase 4: Gmail + Polish + Deployment

**Goal**: Optional Gmail integration for auto-fetching exam details, calendar export, final polish, deployment.

**Status**: COMPLETE (code built; GitHub + Vercel deployment requires user action)

**Depends on**: Phase 3 complete

---

## Tasks

### 4.1 Gmail Integration (Optional)
- [x] Create `src/app/api/gmail/exam-details/route.ts` - search + parse exam emails
- [x] Add "Connect Gmail" section in settings (stub - needs Google Cloud credentials)
- [x] Parse email body for Georgian patterns: ოთახი (room), ადგილი (seat), ვარიანტი (variant)
- [x] Handle no-token case gracefully with setup instructions
- [ ] **USER ACTION**: Add Gmail API scope to Google Cloud project
- [ ] **USER ACTION**: Test with real Gmail credentials

### 4.2 Calendar Export
- [x] Implement .ics file generation (`src/lib/calendar-export.ts`)
- [x] "Add to Calendar" button on individual exam cards
- [x] "Export All" button on exams page header
- [x] Timezone: Asia/Tbilisi (UTC+4) with VTIMEZONE

### 4.3 Animation Polish
- [x] Exam cards: fade-in animation with staggered delays
- [x] Exam cards: press state `active:scale-[0.98]` + smooth border transitions
- [x] Bottom nav: active indicator line + scale tap animation
- [x] Onboarding: fade + slide transitions between steps
- [x] Refresh button: spin animation while loading
- [x] Calendar export: "Exported!" feedback toast

### 4.4 GitHub + Deployment
- [ ] **USER ACTION**: Set up `gh` CLI auth (`gh auth login`)
- [ ] **USER ACTION**: Create GitHub repository
- [ ] Push all code
- [ ] **USER ACTION**: Connect to Vercel
- [ ] **USER ACTION**: Configure environment variables on Vercel
- [ ] Test production deployment end-to-end

---

## Build Status
- Zero type errors
- 7 API routes (all dynamic)
- 6 pages (all compile)
- All animations use CSS (no Framer Motion dependency)
