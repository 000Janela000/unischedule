---
name: update-subject-map
description: Fetch all subjects from exam sheet and lecture sheet, then update src/data/subject-map.json with new mappings. Run this when new semester exams/lectures are added to the Google Sheets.
user_invocable: true
---

# Update Subject Map

Refreshes `src/data/subject-map.json` with current subjects from all sources.

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

3. **Read existing mapping** from `src/data/subject-map.json`. Preserve all existing entries and their names.

4. **Build updated mapping** using this logic:
   - For each subject name, compute a normalized key: lowercase, collapse whitespace, convert Roman numerals to Arabic (VIII->8, VII->7, VI->6, IV->4, IX->9, III->3, II->2, X->10, V->5, I->1), strip parenthetical content `(...)`.
   - For exam subjects, also strip exam suffixes before keying: `(შუალედური...)`, `(ფინალური...)`, `(fx...)`, `(ქვიზი...)`, and dash-prefixed suffixes like `- შუალედური...`.
   - **Theory vs Lab are SEPARATE subjects**: If parenthetical contains თეორია/თეორიული or ლაბორატორია/ლაბორატორიული, include it in the key. Theory and lab courses have different credits, professors, and grades.
   - **Bare name maps to theory**: A subject name WITHOUT parenthetical (e.g. "ზოგადი ქიმია") should be added to the THEORY entry's names array, not the lab. Lab courses always explicitly say "ლაბორატორია" or "ლაბორატორიული" in their name.
   - Each entry: `{ "key": "normalized base", "names": ["all", "known", "variations"] }`
   - Name variations include: typos in sheets, Roman vs Arabic numerals, with/without parenthetical for theory courses.

5. **Detect new subjects** that weren't in the old mapping. Report them to the user:
   - New exam subjects not previously mapped
   - New lecture subjects not previously mapped
   - Ask the user to verify any that look like they might be name variations of existing subjects (e.g. typos, abbreviations, hyphenation differences like "რკინა-ბეტონის" vs "რკინაბეტონის")

6. **Check for potential duplicates**: For any new subject, check if there's an existing subject where the Levenshtein distance is small (< 5 characters different) or where one is a substring of the other. Flag these as "possible duplicate — please verify" and ask the user. If confirmed as same subject, add both names to the same entry's `names` array.

7. **Write updated mapping** to `src/data/subject-map.json` with structure:
   ```json
   {
     "_generated": "YYYY-MM-DD",
     "_totalSubjects": N,
     "_totalNames": N,
     "subjects": [{ "key": "...", "names": ["..."] }]
   }
   ```

8. **Run `npx tsc --noEmit`** to verify the updated JSON is valid.

9. **Report summary**: total subjects, new additions, any flagged items needing user input.

## Important
- Only ADD new entries or new names to existing entries — never remove subjects or names (sheets may temporarily not list a subject between semesters)
- Theory and lab are always separate entries — never merge them
- Bare subject names (without parenthetical) belong to the theory entry
- Ask the user about uncertain duplicate candidates before merging
