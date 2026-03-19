## ADDED Requirements

### Requirement: Grades Page
The system SHALL display a grades page at `/grades` with academic data from EMIS.

#### Scenario: View current GPA
- **WHEN** user navigates to `/grades` with EMIS connected
- **THEN** shows current GPA as large number
- **AND** shows GPA trend chart across semesters (line chart)
- **AND** shows semester selector dropdown

#### Scenario: View course grades
- **WHEN** user selects a semester
- **THEN** shows list of courses with: name, credits, grade (letter), points, pass/fail status
- **AND** color codes: green for passed, red for failed
- **AND** shows credit summary (earned vs required)

#### Scenario: EMIS not connected
- **WHEN** user visits `/grades` without EMIS connection
- **THEN** shows prompt to install Chrome extension and connect EMIS
- **AND** provides installation instructions
