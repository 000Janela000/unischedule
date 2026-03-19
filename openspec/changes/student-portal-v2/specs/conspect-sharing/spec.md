## ADDED Requirements

### Requirement: Conspect Listing
The system SHALL display a conspect library at `/conspects` with search and filters.

#### Scenario: Browse conspects
- **WHEN** user navigates to `/conspects`
- **THEN** shows grid of conspect cards
- **AND** each card shows: title, subject tag, author, date, vote count, download count, file type badge
- **AND** provides search bar (search by title, subject, author)
- **AND** provides filters: subject dropdown, sort by (newest, top-rated, most downloaded)

### Requirement: Conspect Upload
The system SHALL allow authenticated users to upload study materials.

#### Scenario: Upload a file
- **WHEN** user clicks "Upload" and selects a file (PDF, DOCX, image)
- **THEN** file is uploaded to Vercel Blob storage
- **AND** user provides: title, subject, description
- **AND** conspect appears in listing after save

#### Scenario: Upload a link
- **WHEN** user chooses "Link" instead of file
- **THEN** user provides: URL, title, subject, description
- **AND** conspect appears in listing with link badge

### Requirement: Voting System
The system SHALL allow users to upvote or downvote conspects.

#### Scenario: User votes on a conspect
- **WHEN** user clicks upvote or downvote
- **THEN** vote is recorded (one vote per user per conspect)
- **AND** vote count updates in real-time
- **AND** user can change their vote

### Requirement: Conspect Detail View
The system SHALL display a detail view at `/conspects/[id]`.

#### Scenario: View conspect details
- **WHEN** user clicks on a conspect card
- **THEN** shows full details: title, description, subject, author, date, votes
- **AND** provides download button (for files) or "Open Link" button (for URLs)
- **AND** shows in-browser preview for PDFs
