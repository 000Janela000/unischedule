# Comprehensive Analysis: Extension Flow, Settings, and Grades Refactor

## 1. Extension Token Management & Auto-EMIS Navigation

### Current Problem
- Extension captures token correctly ✓
- Setup page manually checks extension via `syncToken()` ✓
- BUT: No smart behavior when token is expired/missing
- Buttons on popup are pure navigation, not functional (correct but unclear)

### Solution Design
**Goal: Auto-open EMIS from UniHub if token invalid, auto-return when logged in**

**Flow:**
1. User visits grades page → no valid token
2. Page detects missing/invalid token
3. Same-window navigate to EMIS with flag
4. User logs in on EMIS
5. content.js captures new token → stores to chrome.storage.local
6. Redirect back to UniHub (same window)
7. Grades page automatically loads data

**Implementation Steps:**
- Add `checkTokenValidity()` in useEmis hook (decode JWT, check exp time)
- Create `navigateToEmisForAuth()` function that:
  - Sets `returnToUniHub: true` + `returnUrl: window.location.href` in chrome.storage.local
  - Navigates to EMIS same-window
- content.js already handles redirect back after capture
- Grades page: on mount, if no valid token → call `navigateToEmisForAuth()`
- Popup buttons stay as quick navigation only (no functional need)

**Why this works:**
- User never leaves UniHub context (same window navigation)
- If user manually opened EMIS without coming from UniHub → no redirect (they just want to use EMIS)
- Tokens expire max 24hrs → next visit will prompt re-auth seamlessly

---

## 2. Settings Page Refactor (Fit Single Screen)

### Current Issues
- Profile card + gradient header = too tall
- Profile info spread across 3 rows (faculty, semester, group)
- Theme section + About section + Sign Out = scrolling required

### Solution
**Compact grid layout:**
- Remove gradient header (too tall)
- Avatar + name/email in single row (left-aligned on desktop)
- Faculty/Semester/Group as 3-column grid INLINE with avatar
- All content should fit 375px mobile, 768px desktop without scroll
- Theme + About in horizontal pills, not cards
- Sign Out as bottom button

**Expected final layout (mobile 375px height ~600px, desktop no scroll):**
```
[Profile header — name + email + avatar in single row]
[Inline 3-col: Faculty | Semester | Group]
[Program name if available]
---
[Theme selector — 3 pills horizontal]
[About — simple text rows, no card]
[Sign Out button]
```

---

## 3. Grades Page Radical Refactor

### Your Token Data Analysis
Decoding your JWT reveals:
- **gpa**: 2.64 ✓ correct
- **credit**: 241 (earned credits)
- **programCredit**: 241 (required credits)
- **averageScore**: 72 (this is weighted avg of all subject scores across all semesters)
- **semester**: 10 (current semester)

### 3.1 Semester Ordering (First to Latest)

**Current:** Line 174 — `sort((a, b) => b - a)` (newest first, IX → I)
**Fix:** Change to `sort((a, b) => a - b)` (oldest first, I → X)

---

### 3.2 Georgian Semester Labels

**Current:** Line 43 — `"I", "II", "III"...` (Roman numerals)
**Should be:** `"მე-1 სემესტრი", "მე-2 სემესტრი"...`

**Why:** In Georgian education, standard format is "მე-X სემესტრი" (with prefix meaning "the"), not just Roman numerals.

---

### 3.3 Real Data Integration via EMIS API

**Need to call:** `GET https://emis.campus.edu.ge/student/getCardDetails`
- Shows detailed subject scores (where "80" comes from per subject)
- Separates "assigned 0 score" vs "not yet graded"
- Gives score breakdown (lectures, exam, total)

**Current issue:** Using `/student/result/get` only shows final grade (A/B/C/F), not component breakdown.

---

### 3.4 Average Score (72 ქულა)

**What it is:** Weighted average of ALL subject scores across ALL semesters
- Formula: `sum(score × credits) / sum(credits)` across entire degree
- Your case: 72 is your overall GPA equivalent on 100-point scale
- **Explanation text needed:** "საშ. ქულა — ყველა საგნის წილადელი საშუალო"
- **Display:** Only in header stats, not per semester

---

### 3.5 Credits (241/241)

**Your situation:**
- Normal degree: 240 credits (4 years × 60 per year)
- You: Extra semester (semester 10 = 2.5 years extra) + minor program
- Total required for your program: 241 credits
- You have: 241 earned = **100% complete**

**Fix:** Show 241/241 correctly (you're done), but add label: "სტატუსი: დაასრულა"

---

### 3.6 F Grade for New Semester Subjects

**Problem:** When new semester starts, all new subjects show F (0 score)
**Solution:** Need to call `/student/getCardDetails` to get:
- `status: "არ შეფასებული"` (not yet graded) → don't show grade, show "—"
- `status: "ჩაბარდა F"` or score=0 → show F only if truly failed previous attempt

**Visual fix:**
- If score === 0 AND semester is current AND date < semester end → show "—" (pending)
- If score === 0 AND grade === "F" AND passed semester → show "F"

---

### 3.7 Subject Score Breakdown Details

**Current:** Shows only final grade (A/B/C) and score (72 ქულა)
**Should show:** Where score comes from by calling `/student/getCardDetails`:
- Theory component: X points
- Exam component: Y points
- Lab component: Z points
- Total: X+Y+Z = score

**Implementation:** Click/expand subject row → show breakdown modal

---

### 3.8 Overall Visual & UX

**Current issues:**
- Stat cards (GPA/Credits/Progress) feel cramped
- Grade distribution bar is unclear what it means
- Semester headers are hard to scan
- Subject rows are information-dense, hard to read quickly
- Progress 100% is confusing (what progress?)

**Radical refactor approach:**
1. **Header Stats — Redesign:**
   - Large GPA display (center) with label below
   - Below: "2.64 საშუა | 241 კრედიტი დასრულებული | მე-10 სემესტრი"
   - Remove the 3-column grid, use single prominent card

2. **Grade Distribution — Remove or clarify:**
   - Only show if user has completed grades
   - Add tooltip: "გამოშვებული კოეფიციენტები: A=4.0, B=3.0, C=2.0, D=1.0, E=0.5, F=0"

3. **Semester Navigation — Improve:**
   - Show: "I | II | III | IV | V | VI | VII | VIII | IX | X"
   - Current semester highlighted with pill background
   - Click to jump to that semester

4. **Subject Row — Simplify:**
   - Show: [Grade Pill] [Subject Name] [Score] [Credits]
   - On click: expand to show breakdown (theory/exam/lab components)
   - Mobile: vertically stack, desktop: horizontal

5. **Color-code by performance:**
   - A = green
   - B = emerald
   - C = blue
   - D = amber/yellow
   - E = orange
   - F = red
   - — (pending) = gray

---

### 3.9 Progress 100% Explanation

**Current:** `(earnedCredits / requiredCredits) * 100`
**Problem:** Confusing terminology
**Fix:**
- If earnedCredits >= requiredCredits: Show "დასრულებული" badge, not percentage
- If < required: Show `(earnedCredits / requiredCredits) * 100` as progress bar with label "დასრულებული: X/Y კრედიტი"

---

## Implementation Priority

**Phase 1 (Critical):**
- 3.1: Semester ordering (sort by ascending)
- 3.2: Georgian semester labels ("მე-X სემესტრი")
- 3.4: Clarify averageScore as overall GPA
- 3.9: Fix progress bar label
- 3.6: Handle F grade for pending subjects

**Phase 2 (Enhancement):**
- 3.3: Integrate getCardDetails for score breakdown
- 3.7: Add expandable subject details modal
- 3.8: Redesign overall visual layout

**Phase 3 (Polish):**
- Extension auto-EMIS navigation (1)
- Settings page fit-to-screen (2)
- Color-coding, animations, responsive tweaks

