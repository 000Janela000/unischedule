'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, AlertCircle, CalendarX } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useSchedule } from '@/hooks/use-schedule';
import { WeekNav } from '@/components/schedule/week-nav';
import { WeekGrid } from '@/components/schedule/week-grid';
import { cn } from '@/lib/utils';
import type { Lecture } from '@/types';

// Next.js App Router requires a default export for pages
export default function SchedulePage() {
  const { t, lang } = useLanguage();
  const { lectures, loading, error, weekSchedule, refetch } = useSchedule();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handlePrevWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  }, [refetch]);

  const handleLectureClick = useCallback(
    (lecture: Lecture) => {
      const details = [
        lecture.subject,
        '',
        lecture.lecturer
          ? `${lang === 'ka' ? 'ლექტორი' : 'Lecturer'}: ${lecture.lecturer}`
          : '',
        lecture.room
          ? `${lang === 'ka' ? 'ოთახი' : 'Room'}: ${lecture.room}`
          : '',
        `${lecture.startTime} - ${lecture.endTime}`,
        lecture.group
          ? `${lang === 'ka' ? 'ჯგუფი' : 'Group'}: ${lecture.group}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      alert(details);
    },
    [lang]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">{t('common.error')}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <CalendarX className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {t('schedule.noLectures')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('schedule.comingSoonDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex h-full flex-col px-2 pb-2 w-full">
      <div className="flex items-center justify-between px-2 py-2">
        <WeekNav
          currentDate={currentDate}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              'h-4 w-4 transition-transform',
              refreshing && 'animate-spin'
            )}
          />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <WeekGrid schedule={weekSchedule} onLectureClick={handleLectureClick} />
      </div>
    </div>
  );
}
