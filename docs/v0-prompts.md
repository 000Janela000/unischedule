# v0.dev Design Prompts for UniHub v2

Go to https://v0.dev and paste each prompt. Don't select a project — just generate freely. Copy the code/screenshot and share it. The codebase will be adapted to match the new design.

**Don't worry about matching current styles** — we want a fresh, cohesive design. The code will be reworked to match whatever v0 generates.

---

## Prompt 1: Login Page

```
Build a beautiful modern login page for "UniHub" — a university student portal for Georgian students.

Requirements:
- Full-screen centered layout, no navbar or sidebar
- App logo area at top: a geometric blue-to-purple gradient icon + "UniHub" wordmark + "სტუდენტის პორტალი" subtitle (Georgian for "Student Portal")
- Single "Sign in with Google" button — large, prominent, full-width, white background with Google "G" icon on the left
- Below the button: small muted text "მხოლოდ @agruni.edu.ge ელ-ფოსტა" (meaning "Only @agruni.edu.ge emails accepted")
- Background: subtle animated gradient mesh or soft gradient from indigo to purple
- Dark mode variant
- Mobile responsive (looks great on phone and desktop)
- Premium, clean, minimalist feel — like Linear or Vercel's login pages
- Use shadcn/ui components, Tailwind CSS, lucide-react icons, Next.js "use client"
```

## Prompt 2: Dashboard (Home Page)

```
Build a student portal dashboard home page for "UniHub". This is what students see after logging in.

Layout:
- Top section: "გამარჯობა, [Name]" greeting (Georgian for "Hello") with today's date and a small profile avatar
- Below: responsive card grid (2 columns on desktop, 1 on mobile)

Cards to include:
1. "დღის ცხრილი" (Today's Schedule) — vertical list of today's lectures showing: time (10:00-11:00), subject name, room number badge, lecturer name. If no classes: "დღეს ლექციები არ არის" (No classes today)
2. "მომავალი გამოცდები" (Upcoming Exams) — next 3 exams with: date, subject, exam type badge (midterm/final/quiz), countdown showing "3 დღეში" (in 3 days) or "ხვალ" (tomorrow). Color-coded left borders.
3. "GPA" — large GPA number (e.g., 3.45), small semester label, tiny sparkline trend. If not connected: "EMIS-თან დაკავშირება" (Connect to EMIS) button
4. "სწრაფი ბმულები" (Quick Links) — icon buttons grid: EMIS, Email, Library, University Website
5. "ბოლო კონსპექტები" (Recent Conspects) — 3 latest uploaded notes with: title, subject tag, vote count, file type icon

Navigation:
- Desktop: left sidebar (240px) with items: Dashboard, Schedule (ცხრილი), Exams (გამოცდები), Grades (ნიშნები), Conspects (კონსპექტები), Profile (პროფილი)
- Mobile: bottom tab bar with 4 items: Home, Schedule, Exams, More (opens drawer with Grades, Conspects, Profile)
- Active state: indigo highlight with subtle background

Design:
- Primary color: indigo/blue-purple (#6366f1)
- Cards: rounded-xl, subtle border, soft shadow on hover
- Dark mode support
- Modern, spacious, premium feel
- Use shadcn/ui, Tailwind CSS, lucide-react, Next.js "use client"
```

## Prompt 3: Schedule Page

```
Build a weekly class schedule page for a university student portal called "UniHub".

Layout:
- Top: page title "ცხრილი" (Schedule) with group code badge (e.g., "con24-01") and subject count
- Day selector: horizontal tab bar with full day names in Georgian (ორშაბათი, სამშაბათი, ოთხშაბათი, ხუთშაბათი, პარასკევი). Each tab shows lecture count badge. Active tab: filled indigo. Auto-selects today.
- Below tabs: vertical timeline of lecture cards for the selected day

Each lecture card:
- Left: time range in monospace font (e.g., "12:20 — 13:20")
- Center: subject name (semibold), lecturer name (muted small text)
- Right: room number in a badge
- Left border color indicates type: indigo=lecture, blue=seminar, purple=lab
- Timeline dots connecting cards vertically

Empty state: calendar icon + "ლექციები არ არის" (No classes)

Design:
- Cards: rounded-xl, subtle border, hover shadow
- Timeline: thin vertical line with dots at each lecture
- Dark mode support
- Primary: indigo (#6366f1)
- Use shadcn/ui, Tailwind CSS, lucide-react, Next.js "use client"
```

## Prompt 4: Exams Page

```
Build an exam schedule page for a university student portal called "UniHub".

Layout:
- Top: page title "გამოცდები" (Exams) with exam count and "Export All" button
- Search bar: rounded, with search icon, placeholder "ძებნა საგნის ან ლექტორის მიხედვით..." (Search by subject or lecturer)
- Group badge showing current group code (e.g., "con24-01")

Exam cards grouped by date:
- Sticky date headers showing: full date + day name in Georgian (e.g., "21 ოქტომბერი, ორშაბათი")
- Each card:
  - Left: 3px color border (blue=midterm/შუალედური, red=final/ფინალური, purple=quiz/ქვიზი, gray=retake/აღდგენა)
  - Time in a subtle background circle
  - Subject name (semibold)
  - Exam type badge (pill shape, colored)
  - Countdown: "3 დღეში" (in 3 days), "ხვალ" (tomorrow), "დღეს" (today) — urgent ones highlighted
  - Expandable: click to show lecturers, groups, student count, "Add to Calendar" button

Empty state: clipboard icon + "გამოცდები ვერ მოიძებნა" (No exams found)

Design:
- Cards: rounded-xl, expandable with smooth animation
- Staggered fade-in animation on cards
- Dark mode support
- Primary: indigo (#6366f1)
- Use shadcn/ui, Tailwind CSS, lucide-react, Next.js "use client"
```

## Prompt 5: Grades/GPA Page

```
Build a grades and GPA tracker page for a university student portal called "UniHub".

Layout:
- Top: page title "ნიშნები" (Grades)
- Hero section: large GPA display (e.g., "3.45" in huge text), semester label, credit summary (earned/required)
- GPA trend: line chart showing GPA across semesters (use recharts library)
- Semester selector: dropdown or horizontal pills
- Course list: table or cards showing per-course data:
  - Course name
  - Credits (ECTS)
  - Grade (letter: A, B, C, D, F)
  - Points (numeric)
  - Status badge: green "ჩაბარებული" (Passed) or red "ვერ ჩააბარა" (Failed)

If EMIS not connected:
- Show centered card with lock icon
- "EMIS-თან დაკავშირება საჭიროა" (EMIS connection required)
- "Chrome გაფართოების ინსტალაცია" (Install Chrome extension) button
- Step-by-step instructions

Design:
- GPA number: huge, bold, indigo colored
- Chart: subtle, clean, indigo line on muted grid
- Course cards: alternating subtle backgrounds
- Dark mode support
- Primary: indigo (#6366f1)
- Use shadcn/ui, Tailwind CSS, lucide-react, recharts, Next.js "use client"
```

## Prompt 6: Conspects/Notes Sharing Page

```
Build a student note-sharing platform page for "UniHub" — like a simplified StuDocu for a single university.

Layout:
- Top: page title "კონსპექტები" (Conspects) + prominent "ატვირთვა" (Upload) button
- Filters row: search bar + subject dropdown + sort dropdown (newest, top-rated, most-downloaded)
- Grid of conspect cards (2 columns desktop, 1 mobile)

Each conspect card:
- Document type icon (PDF red, DOCX blue, Link green, Image purple)
- Title (semibold)
- Subject tag (pill badge)
- Author name + avatar (small)
- Upload date
- Vote section: upvote/downvote arrows with count between
- Download count with icon
- Click to open detail view

Upload flow (modal or separate page):
- Title input
- Subject selector (dropdown of all available subjects)
- File upload zone (drag & drop area, accepts PDF, DOCX, images) OR URL input toggle
- Description textarea (optional)
- Submit button

Design:
- Cards: rounded-xl, hover lift effect, subtle shadow
- Vote buttons: compact, vertical arrows with count
- Upload zone: dashed border, icon in center, drag feedback
- Dark mode support
- Primary: indigo (#6366f1)
- Use shadcn/ui, Tailwind CSS, lucide-react, Next.js "use client"
```

## Prompt 7: Profile Page

```
Build a user profile page for "UniHub" — a university student portal.

Layout:
- Top section: large profile photo (circle, 96px), full name (large bold), email with @agruni.edu.ge badge
- Info grid (2 columns): Faculty name, Year, Group Code, Student ID (if from EMIS)
- EMIS Connection card:
  - Connected: green status dot, "EMIS დაკავშირებულია" + last sync time
  - Not connected: orange status, "Chrome გაფართოება საჭიროა" with install button
- Settings section in cards:
  - Language: "ქართული" / "English" segmented control with flag-like indicators
  - Theme: Sun/Moon/Monitor icons for Light/Dark/System
  - Notifications: toggle switch
- "ჯგუფის შეცვლა" (Change Group) button
- "გასვლა" (Sign Out) button at bottom (red-ish, subtle)

Design:
- Clean card sections with spacing
- Profile photo with subtle ring/border
- Settings as segmented controls, not dropdowns
- Dark mode support
- Primary: indigo (#6366f1)
- Use shadcn/ui, Tailwind CSS, lucide-react, Next.js "use client"
```

---

## Tips
- Generate each page separately
- If the result isn't great, iterate: "make it more spacious", "use darker cards", "add more Georgian text"
- Copy the generated code and share it — the codebase will be fully reworked to match
- Don't worry about data — all data connections will be wired after design integration
