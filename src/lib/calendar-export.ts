import type { Exam } from '@/types';

/**
 * Pads a date/time component to 2 digits.
 */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Converts a date string "YYYY-MM-DD" and time string "HH:MM" to ICS datetime format
 * in Asia/Tbilisi timezone (UTC+4).
 * Returns format: "YYYYMMDDTHHMMSS"
 */
function toICSDateTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

/**
 * Generates a unique ID for an ICS event.
 */
function generateUID(exam: Exam): string {
  return `${exam.id}@unischedule.app`;
}

/**
 * Escapes special characters in ICS text fields.
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates a VEVENT block for a single exam.
 */
function generateVEVENT(exam: Exam): string {
  const dtStart = toICSDateTime(exam.date, exam.startTime);
  const dtEnd = exam.endTime
    ? toICSDateTime(exam.date, exam.endTime)
    : toICSDateTime(exam.date, exam.startTime);

  const descriptionParts: string[] = [];

  if (exam.examTypeLabel) {
    descriptionParts.push(exam.examTypeLabel);
  }

  if (exam.lecturers.length > 0) {
    descriptionParts.push(`Lecturers: ${exam.lecturers.join(', ')}`);
  }

  if (exam.groups.length > 0) {
    descriptionParts.push(`Groups: ${exam.groups.join(', ')}`);
  }

  if (exam.studentCount > 0) {
    descriptionParts.push(`Students: ${exam.studentCount}`);
  }

  const description = escapeICS(descriptionParts.join('\\n'));
  const summary = escapeICS(exam.subject);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${generateUID(exam)}`,
    `DTSTART;TZID=Asia/Tbilisi:${dtStart}`,
    `DTEND;TZID=Asia/Tbilisi:${dtEnd}`,
    `SUMMARY:${summary}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  lines.push(
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    `CREATED:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    'END:VEVENT'
  );

  return lines.join('\r\n');
}

/**
 * Generates the VTIMEZONE block for Asia/Tbilisi (UTC+4, no DST).
 */
function generateTimezone(): string {
  return [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tbilisi',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0400',
    'TZOFFSETTO:+0400',
    'TZNAME:GET',
    'END:STANDARD',
    'END:VTIMEZONE',
  ].join('\r\n');
}

/**
 * Generates a valid .ics file string for a single exam.
 */
export function generateICS(exam: Exam): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniSchedule//Exam Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    generateTimezone(),
    generateVEVENT(exam),
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Generates a valid .ics file string containing multiple exams.
 */
export function generateBulkICS(exams: Exam[]): string {
  if (exams.length === 0) return '';

  const events = exams.map((exam) => generateVEVENT(exam)).join('\r\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniSchedule//Exam Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    generateTimezone(),
    events,
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Creates a Blob from ICS content and triggers a file download.
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
