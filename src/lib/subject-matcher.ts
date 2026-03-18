/**
 * Subject name matching utility.
 *
 * Handles mismatches between exam sheet and lecture sheet names:
 * - Roman↔Arabic numerals: "ფიზიკა II" ↔ "ფიზიკა 2"
 * - Parenthetical variants: "ზოგადი ქიმია" ↔ "ზოგადი ქიმია (თეორიული კურსი)"
 * - Theory/Lab preference: when both exist, exam matches theory (თეორიული)
 * - Whitespace normalization: "ოპერაციების  მართვა" ↔ "ოპერაციების მართვა"
 */

const ROMAN_TO_ARABIC: [string, string][] = [
  ['VIII', '8'], ['VII', '7'], ['VI', '6'], ['IV', '4'],
  ['IX', '9'], ['III', '3'], ['II', '2'], ['X', '10'],
  ['V', '5'], ['I', '1'],
];

/**
 * Normalize: lowercase, collapse whitespace, Roman→Arabic
 */
export function normalizeSubject(name: string): string {
  let r = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [roman, arabic] of ROMAN_TO_ARABIC) {
    const regex = new RegExp(`\\b${roman.toLowerCase()}\\b`, 'g');
    r = r.replace(regex, arabic);
  }
  return r;
}

/**
 * Strip parenthetical content: "ზოგადი ქიმია (თეორიული კურსი)" → "ზოგადი ქიმია"
 */
export function stripParenthetical(name: string): string {
  return normalizeSubject(name).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

/**
 * Check if two subject names match using multi-tier logic:
 * 1. Direct exact
 * 2. Normalized (Roman↔Arabic + whitespace)
 * 3. Parenthetical strip (prefer theory over lab when ambiguous)
 */
export function subjectsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;

  // Tier 1: exact
  if (a === b) return true;

  // Tier 2: normalized
  if (normalizeSubject(a) === normalizeSubject(b)) return true;

  // Tier 3: parenthetical strip
  if (stripParenthetical(a) === stripParenthetical(b)) return true;

  return false;
}

/**
 * Check if a subject name is in a list, using fuzzy matching.
 */
export function subjectInList(subject: string, list: string[]): boolean {
  return list.some(item => subjectsMatch(subject, item));
}

/**
 * Given an exam subject name and multiple lecture variants,
 * pick the best match (prefer theory over lab).
 *
 * Rules:
 * 1. If exact/normalized match exists, return it
 * 2. If parenthetical match: prefer (თეორიული) over (ლაბორატორიული)
 * 3. If only one variant exists, return it
 * 4. If neither theory nor lab (specializations), return first match
 */
export function findBestLectureMatch(
  examSubject: string,
  lectureSubjects: string[]
): string | null {
  // Tier 1: exact
  const exact = lectureSubjects.find(ls => ls === examSubject);
  if (exact) return exact;

  // Tier 2: normalized
  const normExam = normalizeSubject(examSubject);
  const normalized = lectureSubjects.find(ls => normalizeSubject(ls) === normExam);
  if (normalized) return normalized;

  // Tier 3: parenthetical - find all matches
  const strippedExam = stripParenthetical(examSubject);
  const parenMatches = lectureSubjects.filter(ls => stripParenthetical(ls) === strippedExam);

  if (parenMatches.length === 0) return null;
  if (parenMatches.length === 1) return parenMatches[0];

  // Multiple matches: prefer theory
  const theory = parenMatches.find(m => m.includes('თეორიული'));
  if (theory) return theory;

  // No theory variant - return first (could be specialization)
  return parenMatches[0];
}
