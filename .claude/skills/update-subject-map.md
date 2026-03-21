---
name: update-subject-map
description: Fetch all subjects from exam sheet, lecture sheet, and EMIS, then update src/data/subject-map.json with new mappings. Run this when new semester exams/lectures are added to the Google Sheets.
user_invocable: true
---

# Update Subject Map

Refreshes `src/data/subject-map.json` with current subjects from all three sources.

## Steps

1. **Fetch exam subjects** from the live API:
   ```
   curl -s "https://unihub-edu.vercel.app/api/sheets/exams?university=agruni"
   ```
   Extract all unique `subjectClean` values.

2. **Fetch lecture subjects** from the live API:
   ```
   curl -s "https://unihub-edu.vercel.app/api/sheets/lectures"
   ```
   Extract all unique `subject` values.

3. **Read existing mapping** from `src/data/subject-map.json`. Preserve the existing `aliases` array — these are manually verified corrections.

4. **Build updated mapping** using this Python logic:
   - For each subject name, compute a normalized key: lowercase, collapse whitespace, convert Roman numerals to Arabic (VIII→8, VII→7, VI→6, IV→4, IX→9, III→3, II→2, X→10, V→5, I→1), strip parenthetical content `(...)`.
   - For exam subjects, also strip exam suffixes before keying: `(შუალედური...)`, `(ფინალური...)`, `(fx...)`, `(ქვიზი...)`, and dash-prefixed suffixes like `- შუალედური...`.
   - Group exam names and lecture names under the same key.
   - Each entry: `{ "key": "normalized base", "examNames": [...], "lectureNames": [...] }`

5. **Detect new subjects** that weren't in the old mapping. Report them to the user:
   - New exam subjects not previously mapped
   - New lecture subjects not previously mapped
   - Ask the user to verify any that look like they might be aliases of existing subjects (e.g. typos, abbreviations, hyphenation differences)

6. **Check for potential alias candidates**: For any new subject, check if there's an existing subject where the Levenshtein distance is small (< 5 characters different) or where one is a substring of the other. Flag these as "possible alias — please verify" and ask the user.

7. **Write updated mapping** to `src/data/subject-map.json` with structure:
   ```json
   {
     "_generated": "YYYY-MM-DD",
     "_examCount": N,
     "_lectureCount": N,
     "_totalMappings": N,
     "aliases": [{"from": "...", "to": "..."}],
     "subjects": [{"key": "...", "examNames": [...], "lectureNames": [...]}]
   }
   ```

8. **Run `npx tsc --noEmit`** to verify the updated JSON is valid.

9. **Report summary**: total subjects, new additions, aliases, any flagged items needing user input.

## Important
- NEVER remove existing aliases — they are manually verified
- ALWAYS preserve the aliases array from the existing file
- Only ADD new entries, never remove subjects that exist in the current mapping (sheets may temporarily not list a subject between semesters)
- Ask the user about uncertain alias candidates before adding them
