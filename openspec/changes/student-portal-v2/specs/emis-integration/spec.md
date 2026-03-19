## ADDED Requirements

### Requirement: Chrome Extension Token Capture
The system SHALL provide a Chrome extension that captures the EMIS JWT token.

#### Scenario: User visits EMIS while extension installed
- **WHEN** user navigates to emis.campus.edu.ge and is logged in
- **THEN** extension reads `Student-Token` from localStorage
- **AND** sends token to `POST /api/emis/token` with user identification
- **AND** UniHub stores encrypted token in database

#### Scenario: Token expired
- **WHEN** extension detects EMIS token has changed
- **THEN** sends updated token to UniHub API

### Requirement: EMIS API Proxy
The system SHALL proxy EMIS API calls server-side using stored tokens.

#### Scenario: Fetch student grades
- **WHEN** client requests `GET /api/emis/grades`
- **THEN** server retrieves user's EMIS token from database
- **AND** calls EMIS `/student/result/get` with Bearer token
- **AND** returns grades data to client

#### Scenario: EMIS token missing or expired
- **WHEN** no valid EMIS token exists for user
- **THEN** returns 401 with message to install extension and visit EMIS

### Requirement: Auto-fill Onboarding
The system SHALL auto-detect group/faculty from EMIS data when available.

#### Scenario: EMIS connected during onboarding
- **WHEN** user has a valid EMIS token
- **THEN** fetch student details from EMIS
- **AND** pre-fill faculty, year, group in onboarding
- **AND** allow user to confirm or modify
