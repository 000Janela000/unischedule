'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Lecture, DaySchedule, WeekSchedule } from '@/types';
import { useUserGroup } from '@/hooks/use-user-group';

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

export function useSchedule() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { group } = useUserGroup();

  const fetchLectures = useCallback(async () => {
    if (!group?.groupCode) {
      setLectures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ group: group.groupCode });
      const res = await fetch(`/api/sheets/lectures?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch lectures: ${res.status}`);
      }

      const json = await res.json();
      const data: Lecture[] = Array.isArray(json) ? json : (json.lectures ?? []);
      setLectures(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lectures';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [group?.groupCode]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  // Group lectures into WeekSchedule (Mon-Fri)
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
    loading,
    error,
    weekSchedule,
    refetch: fetchLectures,
  };
}
