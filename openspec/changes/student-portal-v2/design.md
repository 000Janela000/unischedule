## Context

UniHub v1 is a schedule/exam viewer. v2 adds EMIS integration, dashboard, grades, and conspect sharing. The design must accommodate new data sources (EMIS API, database) while keeping the existing Google Sheets pipeline intact.

## Architecture

### Data Flow

```
Google Sheets ──→ API Routes ──→ 3-layer cache ──→ Client
  (exams, lectures)

EMIS API ──→ Chrome Extension ──→ /api/emis/token ──→ Server session
  (grades, profile)    (captures JWT)    (stores per user)    ──→ /api/emis/* proxy ──→ Client

Database ──→ API Routes ──→ Client
  (conspects, votes, users)
```

### Database Schema (Vercel Postgres)

```sql
-- Users (extends NextAuth session data)
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- NextAuth user ID
  email TEXT UNIQUE NOT NULL,       -- @agruni.edu.ge
  name TEXT,
  image TEXT,
  group_code TEXT,                  -- con24-01, chem24-01, etc.
  faculty_id TEXT,
  year INTEGER,
  emis_token TEXT,                  -- Encrypted EMIS JWT
  emis_token_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conspects (uploaded study materials)
CREATE TABLE conspects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,            -- Subject name
  file_url TEXT,                    -- Vercel Blob URL or external link
  file_type TEXT,                   -- pdf, docx, link, image
  author_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  download_count INTEGER DEFAULT 0
);

-- Votes (upvote/downvote)
CREATE TABLE votes (
  conspect_id INTEGER REFERENCES conspects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (conspect_id, user_id)
);
```

### Chrome Extension

Minimal extension (~3 files):
- `manifest.json`: content_scripts on emis.campus.edu.ge, permissions: storage
- `content.js`: reads `localStorage.getItem("Student-Token")`, POSTs to UniHub API
- `popup.html` (optional): status indicator showing connection state

### API Routes (New)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/emis/token` | POST | Store EMIS token from extension |
| `/api/emis/grades` | GET | Proxy EMIS `/student/result/get` |
| `/api/emis/profile` | GET | Proxy EMIS `/student/students/getDetails` |
| `/api/emis/courses` | GET | Proxy EMIS `/student/registration/getRegistrationBooks` |
| `/api/conspects` | GET | List conspects (with filters) |
| `/api/conspects` | POST | Upload new conspect |
| `/api/conspects/[id]` | GET | Get single conspect |
| `/api/conspects/[id]/vote` | POST | Upvote/downvote |
| `/api/upload` | POST | File upload to Vercel Blob |

## Decisions

1. **Database**: Vercel Postgres (free tier, native Vercel integration) with Drizzle ORM
2. **File storage**: Vercel Blob (free 256MB, simple PUT API)
3. **EMIS token storage**: Encrypted in users table, refreshed when extension sends new token
4. **ORM**: Drizzle (lightweight, TypeScript-native, works with Vercel Postgres)
5. **Charts**: recharts (for GPA trend chart, lightweight)
6. **Navigation**: Keep existing pattern but expand sidebar items, add "More" drawer on mobile

## Patterns

- All EMIS API calls go through our proxy routes (never direct from client)
- EMIS token validated before each proxy call (check expiry from JWT)
- Conspect uploads use Vercel Blob with signed URLs
- Votes use upsert pattern (one vote per user per conspect)
- Database queries use Drizzle ORM with TypeScript types
