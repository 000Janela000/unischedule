'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exam } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { subjectInList } from '@/lib/subject-matcher';

interface CachedExams {
  data: Exam[];
  timestamp: number;
}

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours client-side

/**
 * When EMIS subjects are available, fetches ALL exams and filters by subject name.
 * This handles cross-listed courses (e.g. con21 student taking elec24 subjects).
 * Falls back to group-based filtering when EMIS is not connected.
 */
export function useExams(
  group: string | null,
  university: 'agruni' | 'freeuni' = 'agruni',
  selectedSubjects?: string[] | null
) {
  const [rawExams, setRawExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // When EMIS subjects exist, skip group filter — fetch all, filter by subject client-side
  const hasEmisSubjects = selectedSubjects && selectedSubjects.length > 0;

  const fetchExams = useCallback(async () => {
    if (!group && !hasEmisSubjects) {
      setRawExams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cacheKey = hasEmisSubjects
      ? `${STORAGE_KEYS.EXAM_CACHE}_emis_all`
      : `${STORAGE_KEYS.EXAM_CACHE}_${group}`;

    const cached = getItem<CachedExams | null>(cacheKey, null);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRawExams(cached.data);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ university });
      // Only add group filter when EMIS subjects are NOT available
      if (!hasEmisSubjects && group) {
        params.set('group', group);
      }

      const res = await fetch(`/api/sheets/exams?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch exams: ${res.status}`);
      }

      const json = await res.json();
      const data: Exam[] = Array.isArray(json) ? json : (json.exams ?? []);

      const sorted = data.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

      setRawExams(sorted);
      setItem(cacheKey, { data: sorted, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch exams';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [group, university, hasEmisSubjects]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Filter by EMIS subject names (fuzzy matching)
  const exams = useMemo(() => {
    if (!selectedSubjects || selectedSubjects.length === 0) return rawExams;

    const filtered = rawExams.filter((exam) =>
      subjectInList(exam.subjectClean, selectedSubjects)
    );

    return filtered;
  }, [rawExams, selectedSubjects]);

  return { exams, loading, error, refetch: fetchExams };
}
