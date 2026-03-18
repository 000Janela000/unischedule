'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Exam } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { subjectInList } from '@/lib/subject-matcher';

interface CachedExams {
  data: Exam[];
  timestamp: number;
}

const CACHE_TTL = 15 * 60 * 1000;

export function useExams(
  group: string | null,
  university: 'agruni' | 'freeuni' = 'agruni',
  selectedSubjects?: string[] | null
) {
  const [rawExams, setRawExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    if (!group) {
      setRawExams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cached = getItem<CachedExams | null>(STORAGE_KEYS.EXAM_CACHE, null);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRawExams(cached.data);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ group, university });
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
      setItem(STORAGE_KEYS.EXAM_CACHE, { data: sorted, timestamp: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch exams';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [group, university]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Filter exams by selected subjects using fuzzy matching
  // Handles: exact, Roman↔Arabic, parenthetical strip (theory preferred)
  const exams = useMemo(() => {
    if (!selectedSubjects || selectedSubjects.length === 0) return rawExams;

    const filtered = rawExams.filter((exam) =>
      subjectInList(exam.subjectClean, selectedSubjects)
    );

    // If fuzzy matching still produces 0 but raw has data, show all
    // (safety net for completely different semester subjects)
    if (filtered.length === 0 && rawExams.length > 0) return rawExams;

    return filtered;
  }, [rawExams, selectedSubjects]);

  return { exams, loading, error, refetch: fetchExams };
}
