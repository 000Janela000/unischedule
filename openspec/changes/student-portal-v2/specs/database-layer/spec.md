## ADDED Requirements

### Requirement: Database Schema
The system SHALL use Vercel Postgres with Drizzle ORM for persistent data.

#### Scenario: User record creation
- **WHEN** user signs in for the first time
- **THEN** creates user record with: id, email, name, image from Google
- **AND** stores group_code, faculty_id, year after onboarding

#### Scenario: EMIS token storage
- **WHEN** Chrome extension sends EMIS token
- **THEN** stores encrypted token in user record
- **AND** records timestamp of last update

### Requirement: File Storage
The system SHALL use Vercel Blob for conspect file uploads.

#### Scenario: File upload
- **WHEN** user uploads a file (max 10MB)
- **THEN** file is stored in Vercel Blob
- **AND** URL is saved in conspects table
- **AND** file type is detected and stored

### Requirement: Data Integrity
The system SHALL enforce referential integrity.

#### Scenario: User deletes a conspect
- **WHEN** author deletes their conspect
- **THEN** all associated votes are cascade-deleted
- **AND** file is removed from Blob storage

#### Scenario: One vote per user per conspect
- **WHEN** user votes on the same conspect twice
- **THEN** previous vote is replaced (upsert)
