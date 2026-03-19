## ADDED Requirements

### Requirement: Dashboard Home Page
The system SHALL display a dashboard at `/` with summary cards.

#### Scenario: Authenticated user visits dashboard
- **WHEN** user navigates to `/`
- **THEN** shows greeting with user's name and today's date
- **AND** shows "Today's Schedule" card with today's lectures (time, subject, room)
- **AND** shows "Upcoming Exams" card with next 3 exams (countdown badges)
- **AND** shows "GPA" card if EMIS connected (current GPA number)
- **AND** shows "Quick Links" card (EMIS, Email, Library)
- **AND** shows "Recent Conspects" card (latest uploaded notes)

#### Scenario: No EMIS connection
- **WHEN** user has not connected EMIS
- **THEN** GPA card shows "Connect EMIS" prompt
- **AND** other cards still display schedule and exam data

#### Scenario: Mobile layout
- **WHEN** viewport is < 768px
- **THEN** cards stack vertically in single column
