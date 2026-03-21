/**
 * Subject name matching utility.
 *
 * Handles mismatches between EMIS, exam sheet, and lecture sheet names:
 * - Roman↔Arabic numerals: "ფიზიკა II" ↔ "ფიზიკა 2"
 * - Parenthetical variants: "ზოგადი ქიმია" ↔ "ზოგადი ქიმია (თეორიული კურსი)"
 * - Theory/Lab preference: when both exist, exam matches theory (თეორიული)
 * - Whitespace normalization: "ოპერაციების  მართვა" ↔ "ოპერაციების მართვა"
 * - Known aliases from subject-map.json for typos/naming differences
 * - Exam suffix stripping: "მექანიკა (შუალედური 1)" → "მექანიკა"
 */

import subjectMap from '@/data/subject-map.json';

const ROMAN_TO_ARABIC: [string, string][] = [
  ['VIII', '8'], ['VII', '7'], ['VI', '6'], ['IV', '4'],
  ['IX', '9'], ['III', '3'], ['II', '2'], ['X', '10'],
  ['V', '5'], ['I', '1'],
];

// Build key lookup: normalized name → subject key
const SUBJECT_KEYS = new Map<string, string>();
for (const entry of subjectMap.subjects) {
  const key = entry.key;
  for (const name of entry.names) {
    SUBJECT_KEYS.set(normalize(name), key);
    SUBJECT_KEYS.set(stripParenthetical(name), key);
  }
}

/**
 * Normalize: lowercase, collapse whitespace, Roman→Arabic
 */
function normalize(name: string): string {
  let r = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [roman, arabic] of ROMAN_TO_ARABIC) {
    const regex = new RegExp(`\\b${roman.toLowerCase()}\\b`, 'g');
    r = r.replace(regex, arabic);
  }
  return r;
}

export { normalize as normalizeSubject };

/**
 * Strip parenthetical content: "ზოგადი ქიმია (თეორიული კურსი)" → "ზოგადი ქიმია"
 */
export function stripParenthetical(name: string): string {
  return normalize(name).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

/**
 * Strip exam-specific suffixes
 */
function stripExamSuffix(name: string): string {
  let n = name;
  n = n.replace(/\s*\(შუალედური[^)]*\)/g, '');
  n = n.replace(/\s*\(ფინალური[^)]*\)/g, '');
  n = n.replace(/\s*\(fx[^)]*\)/g, '');
  n = n.replace(/\s*\(ქვიზი[^)]*\)/g, '');
  n = n.replace(/\s*-\s*(შუალედური|ფინალური|fx|ქვიზი|აღდგენა|გადაბარება|ტესტი).*/g, '');
  n = n.replace(/\s*(შუალედური|ფინალური)\s*(გამოცდა|გამოცდის)?\s*(\d|აღდგენა|გადაბარება)?$/g, '');
  n = n.replace(/\s*სესია\s*\d+$/g, '');
  return n.trim();
}

/**
 * Get the canonical key for a subject name using the mapping.
 */
function getSubjectKey(name: string): string | null {
  const norm = normalize(name);
  if (SUBJECT_KEYS.has(norm)) return SUBJECT_KEYS.get(norm)!;

  const stripped = stripParenthetical(name);
  if (SUBJECT_KEYS.has(stripped)) return SUBJECT_KEYS.get(stripped)!;

  // Try with exam suffix stripped
  const examClean = normalize(stripExamSuffix(name));
  if (SUBJECT_KEYS.has(examClean)) return SUBJECT_KEYS.get(examClean)!;

  const examStripped = stripParenthetical(stripExamSuffix(name));
  if (SUBJECT_KEYS.has(examStripped)) return SUBJECT_KEYS.get(examStripped)!;

  return null;
}

/**
 * Check if two subject names match using multi-tier logic:
 * 1. Direct exact
 * 2. Normalized (Roman↔Arabic + whitespace)
 * 3. Subject map key lookup (deterministic)
 * 4. Parenthetical strip (fuzzy fallback)
 * 5. Alias check
 */
export function subjectsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;

  // Tier 1: exact
  if (a === b) return true;

  const normA = normalize(a);
  const normB = normalize(b);

  // Tier 2: normalized
  if (normA === normB) return true;

  // Tier 3: subject map — both resolve to same key
  const keyA = getSubjectKey(a);
  const keyB = getSubjectKey(b);
  if (keyA && keyB && keyA === keyB) return true;

  // Tier 4: parenthetical strip
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
 */
export function findBestLectureMatch(
  examSubject: string,
  lectureSubjects: string[]
): string | null {
  // Tier 1: exact
  const exact = lectureSubjects.find(ls => ls === examSubject);
  if (exact) return exact;

  // Tier 2: normalized
  const normExam = normalize(examSubject);
  const normalized = lectureSubjects.find(ls => normalize(ls) === normExam);
  if (normalized) return normalized;

  // Tier 3: subject map key
  const examKey = getSubjectKey(examSubject);
  if (examKey) {
    const keyMatch = lectureSubjects.find(ls => getSubjectKey(ls) === examKey);
    if (keyMatch) return keyMatch;
  }

  // Tier 4: parenthetical - find all matches
  const strippedExam = stripParenthetical(examSubject);
  const parenMatches = lectureSubjects.filter(ls => stripParenthetical(ls) === strippedExam);

  if (parenMatches.length === 0) return null;
  if (parenMatches.length === 1) return parenMatches[0];

  // Multiple matches: prefer theory
  const theory = parenMatches.find(m => m.includes('თეორიული'));
  if (theory) return theory;

  return parenMatches[0];
}
