'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Lecture, WeekSchedule } from '@/types';
import { useUserGroup } from '@/hooks/use-user-group';
import { subjectInList } from '@/lib/subject-matcher';

const DAY_NAMES_KA: Record<number, string> = {
  1: 'ორშაბათი',
  2: 'სამშაბათი',
  3: 'ოთხშაბათი',
  4: 'ხუთშაბათი',
  5: 'პარასკევი',
};

const DAY_NAMES_EN: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
};

/**
 * When EMIS subjects are available, fetches ALL lectures and filters by subject name.
 * This handles cross-listed courses (e.g. con21 student taking elec24 subjects).
 * Falls back to group-based filtering when EMIS is not connected.
 */
export function useSchedule(selectedSubjects?: string[] | null) {
  const [rawLectures, setRawLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { group, loading: groupLoading } = useUserGroup();

  // When EMIS subjects exist, skip group filter
  const hasEmisSubjects = selectedSubjects && selectedSubjects.length > 0;

  const fetchLectures = useCallback(async () => {
    if (!group?.groupCode && !hasEmisSubjects) {
      setRawLectures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // Only add group filter when EMIS subjects are NOT available
      if (!hasEmisSubjects && group?.groupCode) {
        params.set('group', group.groupCode);
      }

      const res = await fetch(`/api/sheets/lectures?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch lectures: ${res.status}`);
      }

      const json = await res.json();
      const data: Lecture[] = Array.isArray(json) ? json : (json.lectures ?? []);
      setRawLectures(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lectures';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [group?.groupCode, hasEmisSubjects]);

  useEffect(() => {
    if (groupLoading) return;
    fetchLectures();
  }, [fetchLectures, groupLoading]);

  // Filter lectures by EMIS subject names (fuzzy matching)
  const lectures = useMemo(() => {
    if (!selectedSubjects || selectedSubjects.length === 0) return rawLectures;
    return rawLectures.filter((l) => subjectInList(l.subject, selectedSubjects));
  }, [rawLectures, selectedSubjects]);

  const weekSchedule: WeekSchedule = useMemo(() => {
    const days: WeekSchedule = [];
    for (let d = 1; d <= 5; d++) {
      const dayLectures = lectures
        .filter((l) => l.dayOfWeek === d)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      days.push({
        dayOfWeek: d,
        dayNameKa: DAY_NAMES_KA[d] || '',
        dayNameEn: DAY_NAMES_EN[d] || '',
        lectures: dayLectures,
      });
    }
    return days;
  }, [lectures]);

  return {
    lectures,
    rawLectures,
    loading: groupLoading || loading,
    error,
    weekSchedule,
    refetch: fetchLectures,
  };
}
