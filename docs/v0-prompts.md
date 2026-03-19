# v0.dev Design Prompts for UniHub v2

Use these prompts at https://v0.dev to generate designs. Share the output code/screenshots and they'll be integrated into the project.

## Prompt 1: Login Page
```
A modern login page for "UniHub" — a Georgian university student portal. Centered card with a geometric blue-purple gradient logo at top. "UniHub" title with "სტუდენტის პორტალი" subtitle in Georgian. A single "Sign in with Google" button (white bg, Google icon, full width). Below: small text "Only @agruni.edu.ge emails". Dark mode support. Background: subtle gradient mesh. Use shadcn/ui, Tailwind, Next.js. Colors: indigo-600 primary (#6366f1).
```

## Prompt 2: Dashboard (Home)
```
A student portal dashboard for "UniHub". Top: greeting "Hello, [Name]" with today's date. Cards grid layout:
1. "Today's Schedule" card — list of today's lectures with times, rooms, subjects
2. "Upcoming Exams" card — next 3 exams with countdown badges (days remaining)
3. "GPA" card — current GPA number large, semester trend sparkline
4. "Quick Links" card — EMIS, Email, Library buttons
5. "Recent Conspects" card — latest uploaded notes with ratings

Sidebar navigation: Dashboard, Schedule, Exams, Grades, Conspects, Profile.
Bottom nav for mobile with 4 tabs: Home, Schedule, Exams, More.
Use shadcn/ui + Tailwind. Primary color: indigo (#6366f1). Dark mode. Georgian language support. Modern, clean, card-based.
```

## Prompt 3: Schedule Page
```
A weekly class schedule view for university students. Day tabs at top (Monday-Friday) showing full day names with lecture count badges. Below: vertical timeline of lecture cards for selected day. Each card: time range on left (mono font), subject name (bold), lecturer name (muted), room number (badge), lecture type indicator (colored dot: green=lecture, blue=seminar, purple=lab). Timeline dots connecting cards. Search bar at top. Subject filter pills. Use shadcn/ui + Tailwind. Indigo primary. Dark mode.
```

## Prompt 4: Exams Page
```
An exam schedule page for university students. Search bar at top. Below: exam cards grouped by date with sticky date headers. Each card: left color border (blue=midterm, red=final, purple=quiz), time in a circle, subject name bold, exam type badge, countdown timer showing "3 days" or "Tomorrow", lecturers, group code. Expandable on click to show full details + "Add to Calendar" button. Export All button in header. Use shadcn/ui + Tailwind. Indigo primary. Dark mode.
```

## Prompt 5: Grades/GPA Page
```
A grades and GPA tracker for university students. Top: large GPA display (e.g. "3.45") with semester selector dropdown. GPA trend chart (line chart across semesters). Below: table/cards of courses with columns: Course Name, Credits, Grade (letter), Points, Status (passed/failed). Color coded: green for passed, red for failed. Semester filter. Credit summary (earned vs required). Use shadcn/ui + Tailwind + recharts for charts. Indigo primary. Dark mode.
```

## Prompt 6: Conspects/Notes Page
```
A student note-sharing platform page. Top: search bar + filters (subject dropdown, sort by: newest/top-rated/most-downloaded). Upload button (prominent, top right). Grid of conspect cards: document icon/thumbnail, title, subject tag, author name, date, rating (upvote/downvote count), download count, file type badge (PDF/DOCX/Link). Click card to preview/download. Upload modal: title, subject selector, file upload (drag & drop) or URL input, description textarea. Use shadcn/ui + Tailwind. Indigo primary. Dark mode.
```

## Prompt 7: Profile Page
```
A user profile page for university student portal. Top: large profile photo (circle), full name, email badge (@agruni.edu.ge). Info cards: Faculty, Year, Group Code, Student ID. EMIS connection status (connected/disconnected with toggle). Settings: Language (Georgian/English toggle), Theme (Light/Dark/System), Notifications toggle. Sign out button at bottom. Use shadcn/ui + Tailwind. Indigo primary. Dark mode.
```

## Tips for v0.dev
- Add "Use shadcn/ui + Tailwind" to every prompt
- Mention "indigo primary (#6366f1)" for consistent colors
- Add "Dark mode" for dark theme support
- The generated code uses shadcn/ui components which we already have
- Copy the code and share it — I'll adapt it to the existing project patterns
