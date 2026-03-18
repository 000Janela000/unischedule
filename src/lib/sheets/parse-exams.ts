import Papa from 'papaparse';
import type { Exam } from '@/types';
import { ExamType } from '@/types';
import { parseExamType } from '@/lib/exam-types';

/**
 * Simple hash function to generate deterministic IDs.
 */
function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Checks if a string looks like a time value (e.g., "10:00" or "10:00-11:00").
 */
function isTimeLike(value: string): boolean {
  return /^\d{1,2}:\d{2}/.test(value.trim());
}

/**
 * Parses a time range string like "10:00-11:00" into start and end times.
 */
function parseTimeRange(timeStr: string): {
  startTime: string;
  endTime: string;
} | null {
  const trimmed = timeStr.trim();

  // Match "HH:MM-HH:MM" or "HH:MM - HH:MM"
  const rangeMatch = trimmed.match(
    /^(\d{1,2}:\d{2})\s*[-\u2013]\s*(\d{1,2}:\d{2})$/
  );
  if (rangeMatch) {
    return { startTime: rangeMatch[1], endTime: rangeMatch[2] };
  }

  // If only a single time is provided, assume 1-hour duration
  const singleMatch = trimmed.match(/^(\d{1,2}:\d{2})$/);
  if (singleMatch) {
    const [hours, minutes] = singleMatch[1].split(':').map(Number);
    const endHours = hours + 1;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { startTime: singleMatch[1], endTime };
  }

  return null;
}

/**
 * Maps a university name from the sheet to a normalized key.
 */
function normalizeUniversity(raw: string): 'agruni' | 'freeuni' {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('freeuni') || lower.includes('free')) return 'freeuni';
  return 'agruni';
}

/**
 * Checks if a string contains Georgian Unicode characters (\u10A0-\u10FF).
 */
function containsGeorgian(str: string): boolean {
  return /[\u10A0-\u10FF]/.test(str);
}

/**
 * Checks if a string looks like a valid group code.
 * Valid patterns: XX-NN, prefix+XX-NN, MAGRXX, FCM NN
 */
function isValidGroupCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;

  // Skip if it's Georgian text (retake descriptions, etc.)
  if (containsGeorgian(trimmed)) return false;

  // Agruni: XX-NN (e.g., "25-01", "25-10")
  if (/^\d{2}-\d{1,2}$/.test(trimmed)) return true;

  // Agruni: prefix+XX-NN (e.g., "chem24-01", "bio24-01", "food24-02")
  if (/^[a-zA-Z]+\s*\d{2}-\d{1,2}$/.test(trimmed)) return true;

  // Freeuni: XX-NN-NN (e.g., "23-04-01", "25-01-01", "24-10-02")
  if (/^\d{2}-\d{1,2}-\d{1,2}$/.test(trimmed)) return true;

  // Masters: MAGRXX, MCONXX, MCEXX, MACSXX etc.
  if (/^M[A-Z]{2,4}\d{2}$/i.test(trimmed)) return true;

  // Short codes: FCM 02, BA 01 etc.
  if (/^[A-Z]{2,4}\s*\d{1,2}$/i.test(trimmed)) return true;

  // Prefix with space: "food 22-01", "ba23-01"
  if (/^[a-zA-Z]+\s*\d{2}-\d{1,2}$/.test(trimmed)) return true;

  return false;
}

/**
 * Parses rows from the Sheets API (array-of-arrays) into Exam objects.
 *
 * @param rows - Array of row arrays from spreadsheets.values.get
 * @param tabName - The sheet tab name (used for ID generation)
 * @param tabDate - Pre-parsed date from the tab name
 */
export function parseExamRows(
  rows: string[][],
  tabName: string,
  tabDate: Date | null
): Exam[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  const dateStr = tabDate
    ? tabDate.toISOString().split('T')[0]
    : '';

  const exams: Exam[] = [];

  for (const row of rows) {
    // Skip rows that are too short
    if (!row || row.length < 4) continue;

    // Sheets API may return numbers as numbers, so coerce everything to string
    const timeCell = String(row[0] ?? '');
    const subjectCell = String(row[1] ?? '');
    const lecturerCell = String(row[2] ?? '');
    const groupsCell = String(row[3] ?? '');
    const universityCell = String(row[4] ?? '');
    const studentCountCell = String(row[5] ?? '');

    // Skip header rows or rows where the first cell doesn't look like a time
    if (!timeCell || !isTimeLike(timeCell)) continue;

    // Skip rows without a subject
    if (!subjectCell || !subjectCell.trim()) continue;

    // Parse time range
    const timeRange = parseTimeRange(timeCell);
    if (!timeRange) continue;

    // Parse subject and exam type
    const { type: examType, label: examTypeLabel, cleanName: subjectClean } =
      parseExamType(subjectCell.trim());

    // Parse lecturers (comma-separated)
    const lecturers = lecturerCell
      ? String(lecturerCell).split(',').map((l) => l.trim()).filter(Boolean)
      : [];

    // Parse groups: split by comma, filter for valid group codes
    const groups = groupsCell
      ? String(groupsCell).split(',').map((g) => g.trim()).filter(Boolean).filter(isValidGroupCode)
      : [];

    // Parse university
    const university = universityCell
      ? normalizeUniversity(String(universityCell))
      : 'agruni';

    // Parse student count
    const studentCount = studentCountCell
      ? parseInt(studentCountCell.trim(), 10) || 0
      : 0;

    // Generate deterministic ID
    const id = hashId(
      `${dateStr}-${timeRange.startTime}-${subjectCell.trim()}`
    );

    exams.push({
      id,
      date: dateStr,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      subject: subjectCell.trim(),
      subjectClean,
      examType: examType || ExamType.Unknown,
      examTypeLabel,
      lecturers,
      groups,
      university,
      studentCount,
      tabName,
    });
  }

  return exams;
}

/**
 * Parses a CSV string from an exam sheet tab into an array of Exam objects.
 * Kept for backward compatibility. Internally delegates to parseExamRows.
 *
 * @param csvText - Raw CSV text
 * @param tabName - The sheet tab name (used to derive the exam date)
 * @param tabDate - Optional pre-parsed date from the tab name
 */
export function parseExamCSV(
  csvText: string,
  tabName: string,
  tabDate?: Date | null
): Exam[] {
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  if (!parsed.data || parsed.data.length === 0) {
    return [];
  }

  // If tabDate not provided, try to parse from tabName (DD/MM format)
  let resolvedDate = tabDate ?? null;
  if (!resolvedDate) {
    const match = tabName.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const sep15 = new Date(currentYear, 8, 15);
      const academicYearStart = now < sep15 ? currentYear - 1 : currentYear;
      const resolvedYear = month >= 9 ? academicYearStart : academicYearStart + 1;
      resolvedDate = new Date(resolvedYear, month - 1, day);
    }
  }

  return parseExamRows(parsed.data, tabName, resolvedDate);
}
