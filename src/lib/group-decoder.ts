import type { Faculty } from '@/types';

export const AGRUNI_FACULTIES: Faculty[] = [
  {
    id: 'agr',
    nameKa: 'აგრონომია',
    nameEn: 'Agronomy',
    prefix: 'agr',
    icon: 'wheat',
  },
  {
    id: 'chem',
    nameKa: 'ქიმია',
    nameEn: 'Chemistry',
    prefix: 'chem',
    icon: 'flask-conical',
  },
  {
    id: 'bio',
    nameKa: 'ბიოლოგია',
    nameEn: 'Biology',
    prefix: 'bio',
    icon: 'dna',
  },
  {
    id: 'food',
    nameKa: 'სასურსათო ტექნოლოგია',
    nameEn: 'Food Technology',
    prefix: 'food',
    icon: 'utensils',
  },
  {
    id: 'eno',
    nameKa: 'მევენახეობა-მეღვინეობა',
    nameEn: 'Viticulture-Winemaking',
    prefix: 'eno',
    icon: 'grape',
  },
  {
    id: 'vet',
    nameKa: 'ვეტერინარია',
    nameEn: 'Veterinary',
    prefix: 'vet',
    icon: 'stethoscope',
  },
  {
    id: 'for',
    nameKa: 'სატყეო საქმე',
    nameEn: 'Forestry',
    prefix: 'for',
    icon: 'tree-pine',
  },
  {
    id: 'land',
    nameKa: 'ლანდშაფტის მენეჯმენტი',
    nameEn: 'Landscape Management',
    prefix: 'land',
    icon: 'mountain',
  },
  {
    id: 'ece',
    nameKa: 'ელექტრო და კომპიუტერული ინჟინერია',
    nameEn: 'ECE',
    prefix: 'ece',
    icon: 'cpu',
  },
  {
    id: 'ce',
    nameKa: 'მშენებლობის ინჟინერია',
    nameEn: 'Civil Engineering',
    prefix: 'ce',
    icon: 'hard-hat',
  },
  {
    id: 'me',
    nameKa: 'მექანიკის ინჟინერია',
    nameEn: 'Mechanical Engineering',
    prefix: 'me',
    icon: 'cog',
  },
];

export const FIRST_YEAR_FACULTY: Faculty = {
  id: 'first-year',
  nameKa: 'პირველი კურსი',
  nameEn: 'First Year',
  prefix: '',
  icon: 'graduation-cap',
};

export const MASTERS_FACULTY: Faculty = {
  id: 'masters',
  nameKa: 'მაგისტრატურა',
  nameEn: "Master's",
  prefix: 'MAGR',
  icon: 'book-open',
};

/**
 * Finds a faculty by its prefix string.
 */
export function getFacultyByPrefix(prefix: string): Faculty | undefined {
  if (!prefix) return FIRST_YEAR_FACULTY;
  if (prefix.toUpperCase() === 'MAGR') return MASTERS_FACULTY;
  return AGRUNI_FACULTIES.find(
    (f) => f.prefix.toLowerCase() === prefix.toLowerCase()
  );
}

/**
 * Parses a group code like "chem24-01", "25-01", or "MAGR25"
 * into its constituent parts.
 */
export function decodeGroupCode(
  code: string
): { faculty: Faculty; entryYear: number; groupNumber: number } | null {
  if (!code || typeof code !== 'string') return null;

  const trimmed = code.trim();

  // Master's pattern: "MAGR25"
  const mastersMatch = trimmed.match(/^MAGR(\d{2})$/i);
  if (mastersMatch) {
    const entryYear = 2000 + parseInt(mastersMatch[1], 10);
    return { faculty: MASTERS_FACULTY, entryYear, groupNumber: 1 };
  }

  // Faculty pattern: "chem24-01"
  const facultyMatch = trimmed.match(/^([a-zA-Z]+)(\d{2})-(\d+)$/);
  if (facultyMatch) {
    const prefix = facultyMatch[1];
    const entryYear = 2000 + parseInt(facultyMatch[2], 10);
    const groupNumber = parseInt(facultyMatch[3], 10);
    const faculty = getFacultyByPrefix(prefix);
    if (!faculty) return null;
    return { faculty, entryYear, groupNumber };
  }

  // First-year pattern: "25-01"
  const firstYearMatch = trimmed.match(/^(\d{2})-(\d+)$/);
  if (firstYearMatch) {
    const entryYear = 2000 + parseInt(firstYearMatch[1], 10);
    const groupNumber = parseInt(firstYearMatch[2], 10);
    return { faculty: FIRST_YEAR_FACULTY, entryYear, groupNumber };
  }

  return null;
}

/**
 * Returns the current academic year start.
 * If the current date is before September 15, use the previous year.
 */
export function getAcademicYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const sep15 = new Date(year, 8, 15); // Month is 0-indexed: 8 = September
  return now < sep15 ? year - 1 : year;
}

/**
 * Calculates the student's current year (1st, 2nd, etc.)
 * based on their entry year.
 */
export function getStudentYear(entryYear: number): number {
  const academicYear = getAcademicYear();
  return academicYear - entryYear + 1;
}

/**
 * Builds a group code from its parts.
 * e.g. buildGroupCode('chem', 2024, 1) => "chem24-01"
 */
export function buildGroupCode(
  prefix: string,
  entryYear: number,
  groupNumber: number
): string {
  const shortYear = String(entryYear).slice(-2);

  if (prefix.toUpperCase() === 'MAGR') {
    return `MAGR${shortYear}`;
  }

  const paddedGroup = String(groupNumber).padStart(2, '0');

  if (!prefix) {
    return `${shortYear}-${paddedGroup}`;
  }

  return `${prefix.toLowerCase()}${shortYear}-${paddedGroup}`;
}

/**
 * Checks if a string contains Georgian Unicode characters (\u10A0-\u10FF).
 */
function containsGeorgian(str: string): boolean {
  return /[\u10A0-\u10FF]/.test(str);
}

/**
 * Normalize a group code for fuzzy matching.
 * Strips spaces, lowercases. "ce 22-01" → "ce22-01", "CE22-01" → "ce22-01"
 */
function normalizeGroupCode(code: string): string {
  return code.replace(/\s+/g, '').toLowerCase();
}

/**
 * Checks if a user's group code appears in the exam's group list.
 * Handles:
 *   - Comma-separated groups within a single string
 *   - Fuzzy matching: strips spaces, case-insensitive ("ce22-01" matches "ce 22-01")
 *   - Prefix matching (e.g. "chem24" matches "chem24-01")
 *   - Skips Georgian text entries
 */
export function doesGroupMatchExam(
  userGroup: string,
  examGroups: string[]
): boolean {
  if (!userGroup || !examGroups || examGroups.length === 0) return false;

  const userCodes = userGroup
    .split(',')
    .map((g) => normalizeGroupCode(g))
    .filter(Boolean);

  if (userCodes.length === 0) return false;

  const allExamCodes: string[] = [];
  for (const eg of examGroups) {
    const parts = eg.split(',').map((g) => g.trim()).filter(Boolean);
    for (const part of parts) {
      if (containsGeorgian(part)) continue;
      allExamCodes.push(normalizeGroupCode(part));
    }
  }

  if (allExamCodes.length === 0) return false;

  return userCodes.some((userCode) =>
    allExamCodes.some((examCode) => {
      if (userCode === examCode) return true;
      if (userCode.startsWith(examCode)) return true;
      if (examCode.startsWith(userCode)) return true;
      return false;
    })
  );
}
