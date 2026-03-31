'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Lecture, WeekSchedule } from '@/types';
import { useUserGroup } from '@/hooks/use-user-group';
import { subjectInList } from '@/lib/subject-matcher';
import { buildWeekSchedule } from '@/lib/schedule-utils';

/**
 * When EMIS subjects are available, fetches ALL lectures and filters by subject name.
 * This handles cross-listed courses (e.g. con21 student taking elec24 subjects).
 * Falls back to group-based filtering when EMIS is not connected.
 *
 * Options:
 * - fetchAll: if true, skip group filter even when no EMIS subjects (for cross-group search)
 */
export function useSchedule(selectedSubjects?: string[] | null, options?: { fetchAll?: boolean }) {
  const [rawLectures, setRawLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { group, loading: groupLoading } = useUserGroup();

  // When EMIS subjects exist, skip group filter
  const hasEmisSubjects = selectedSubjects && selectedSubjects.length > 0;

  const fetchLectures = useCallback(async () => {
    const shouldFetchAll = options?.fetchAll;
    if (!group?.groupCode && !hasEmisSubjects && !shouldFetchAll) {
      setRawLectures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // Only add group filter when EMIS subjects are NOT available and not fetching all
      if (!hasEmisSubjects && !shouldFetchAll && group?.groupCode) {
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
  }, [group?.groupCode, hasEmisSubjects, options?.fetchAll]);

  useEffect(() => {
    if (groupLoading) return;
    fetchLectures();
  }, [fetchLectures, groupLoading]);

  // Filter lectures by EMIS subject names (fuzzy matching)
  const lectures = useMemo(() => {
    if (!selectedSubjects || selectedSubjects.length === 0) return rawLectures;
    return rawLectures.filter((l) => subjectInList(l.subject, selectedSubjects));
  }, [rawLectures, selectedSubjects]);

  const weekSchedule = useMemo(() => buildWeekSchedule(lectures), [lectures]);

  const hasNoData = !hasEmisSubjects && !group?.groupCode;

  return {
    lectures,
    rawLectures,
    loading: groupLoading || loading,
    error,
    weekSchedule,
    hasNoData,
    refetch: fetchLectures,
  };
}
