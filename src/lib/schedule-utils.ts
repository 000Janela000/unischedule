import type { Lecture, WeekSchedule } from '@/types';

export const DAY_NAMES_KA = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];

const DAY_NAMES_EN: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
};

/**
 * Convert HH:MM time string to minutes since midnight.
 * Used for conflict detection and time comparisons.
 */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Build a week schedule (5 days: Monday-Friday) from a list of lectures.
 * Groups lectures by day, sorts by start time.
 */
export function buildWeekSchedule(lectures: Lecture[]): WeekSchedule {
  const days: WeekSchedule = [];
  for (let d = 1; d <= 5; d++) {
    const dayLectures = lectures
      .filter((l) => l.dayOfWeek === d)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    days.push({
      dayOfWeek: d,
      dayNameKa: DAY_NAMES_KA[d - 1] || '',
      dayNameEn: DAY_NAMES_EN[d] || '',
      lectures: dayLectures,
    });
  }
  return days;
}

/**
 * Detect time conflicts within a set of lectures.
 * Returns Set of lecture IDs that have overlapping times on the same day.
 */
export function detectConflicts(lectures: Lecture[]): Set<string> {
  const conflictIds = new Set<string>();

  // Group by day
  const byDay: Record<number, Lecture[]> = {};
  for (const lecture of lectures) {
    if (!byDay[lecture.dayOfWeek]) {
      byDay[lecture.dayOfWeek] = [];
    }
    byDay[lecture.dayOfWeek].push(lecture);
  }

  // Check for overlaps within each day
  for (const dayLectures of Object.values(byDay)) {
    for (let i = 0; i < dayLectures.length; i++) {
      for (let j = i + 1; j < dayLectures.length; j++) {
        const a = dayLectures[i];
        const b = dayLectures[j];

        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);

        // Check if times overlap
        if (aStart < bEnd && bStart < aEnd) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }

  return conflictIds;
}

/**
 * Extract unique group codes from a list of lectures.
 * Returns sorted array of group codes.
 */
export function extractGroupCodes(lectures: Lecture[]): string[] {
  const groups = new Set<string>();
  for (const lecture of lectures) {
    if (lecture.group) {
      groups.add(lecture.group);
    }
  }
  return Array.from(groups).sort();
}
