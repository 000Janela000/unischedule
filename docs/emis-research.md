# EMIS Integration Research

## What is EMIS

EMIS (emis.campus.edu.ge) is the student information system for Agricultural University of Georgia. Angular SPA, Laravel backend, nginx/1.14.2. Students use it for grades, course registration, schedule, documents, library.

## Authentication

### Student Login
- **Primary**: Google OAuth → `/student/auth/google`
  - Redirects to Google with EMIS's own Client ID: `95206704161-7vdt8olo1jdndsukt5k5brb3ua8fgta2.apps.googleusercontent.com`
  - Callback: `https://emis.campus.edu.ge/student/oauth2callback`
  - Scopes: `userinfo.profile + userinfo.email`
  - After auth: JWT stored in `localStorage("Student-Token")`

- **Secondary**: Username + password + SMS/reCAPTCHA
  - POST `/student/checkUsername` → POST `/student/login`
  - Most students use Google-only (no password set)

### Token Format
- Standard JWT (3 parts, base64)
- Payload contains: `university` field (2 = Agruni)
- Sent as: `Authorization: Bearer <token>` header
- Read by Angular interceptor: `getToken() { return localStorage.getItem("Student-Token") }`

## API Endpoints

Base: `https://emis.campus.edu.ge/student/`

CORS: `Access-Control-Allow-Origin: *` — APIs callable from any origin with valid token.

### Confirmed Endpoints (extracted from JS bundles)

#### Student Data
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/students/getDetails` | POST | Student profile, group, program |
| `/chancellery/getUserInfo` | GET | User info |

#### Grades & Academic
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/result/get` | POST | Grades/results |
| `/tables/getAcTables` | POST | Academic tables |

#### Registration & Courses
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/registration/getStudentData` | GET | Enrollment data |
| `/registration/getRegistrationBooks` | POST | Registered courses |
| `/registration/getRegistrationBooks2` | POST | Registered courses (v2) |
| `/registration/getProgram` | POST | Program info |
| `/registration/getStudentTables` | POST | Student schedule tables |
| `/registration/getStudentHistory` | GET | Registration history |
| `/registration/getBookResults` | POST | Book/course results |
| `/registration/getEducations` | POST | Education records |

#### Program & Curriculum
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/arch/getProgram` | POST | Full program structure |
| `/arch/getChooseBooks` | POST | Elective courses |
| `/arch/getMyChoosdBooks` | POST | Chosen electives |
| `/arch/getContentrationList` | GET | Concentration options |
| `/arch/getMinorList` | GET | Minor programs |

#### Library
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bib/getItems` | POST | Library catalog search |
| `/bib/addBooking` | POST | Reserve a book |
| `/bib/getOutedStudentExemplarBooks` | POST | Borrowed books |

#### Documents (Chancellery)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chancellery/getAllTemplate` | POST | Document templates |
| `/chancellery/makeDocRequest` | POST | Request a document |
| `/chancellery/getStudentSentJournals` | POST | Sent document requests |

#### Other
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/lang/list` | POST | Available languages |
| `/links/getPersonalFolderLink` | GET | Personal folder link |
| `/students/links/items` | POST | Student portal links |

## Token Capture Methods (Exhaustively Tested)

| Method | Works? | Why |
|--------|--------|-----|
| Server-side proxy | ❌ | Google OAuth requires browser redirect |
| Password login API | ❌ | Students use Google-only (no password), reCAPTCHA required |
| Share Google token | ❌ | Different OAuth client IDs, tokens are client-specific |
| Popup + read localStorage | ❌ | Cross-origin policy blocks localStorage access |
| Iframe + read localStorage | ❌ | Same cross-origin restriction |
| Intercept cookies | ❌ | EMIS doesn't set cookies (token goes to localStorage via JS) |
| **Chrome Extension** | ✅ | Content script on emis.campus.edu.ge reads localStorage |
| **Manual paste** | ✅ | User copies from DevTools (bad UX, fallback only) |

## Chrome Extension Design

```
manifest.json:
  - content_scripts: matches emis.campus.edu.ge
  - permissions: storage

content-script.js:
  - Runs on emis.campus.edu.ge
  - Reads localStorage.getItem("Student-Token")
  - If token exists, sends to UniHub API:
    fetch('https://unihub-edu.vercel.app/api/emis/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' }
    })
  - Runs on page load and periodically (token refresh)
```

## Security Considerations

- EMIS token is a JWT with expiration — needs periodic refresh
- Store EMIS token server-side per user (encrypted, in session or DB)
- Never expose EMIS token to other users
- EMIS CORS is `*` which means anyone with a token can call APIs
- Rate limit our proxy to avoid EMIS blocking
