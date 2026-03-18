'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, CalendarX, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useSchedule } from '@/hooks/use-schedule';
import { useUserGroup } from '@/hooks/use-user-group';
import { WeekGrid } from '@/components/schedule/week-grid';
import { cn } from '@/lib/utils';
import type { Lecture } from '@/types';

const SUBJECTS_STORAGE_KEY = 'unischedule_subjects';

// Next.js App Router requires a default export for pages
export default function SchedulePage() {
  const { t, lang } = useLanguage();
  const { group } = useUserGroup();
  const [refreshing, setRefreshing] = useState(false);

  // Load selected subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSelectedSubjects(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const { lectures, loading, error, weekSchedule, refetch } = useSchedule(selectedSubjects);
  const [selectedSubjects, setSelectedSubjects] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSelectedSubjects(parsed);
        }
      }
    } catch {
      // ignore
    }
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
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
        <div className="rounded-xl border border-border/50 bg-card p-8 shadow-sm max-w-sm w-full">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/80" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">{t('common.error')}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
        <CalendarX className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {t('schedule.noLectures')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('schedule.comingSoonDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col px-3 sm:px-4 pb-2 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-lg font-semibold text-foreground">{t('schedule.title')}</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              'h-4 w-4 transition-transform',
              refreshing && 'animate-spin'
            )}
          />
        </button>
      </div>

      {/* Group info + subject filter indicator */}
      <div className="flex items-center gap-2 mb-4">
        {group && (
          <div className="rounded-full bg-muted/60 px-3 py-1.5">
            <span className="font-mono text-xs font-medium text-primary">
              {group.groupCode}
            </span>
          </div>
        )}
        {selectedSubjects && (
          <Link
            href="/subjects"
            className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-muted"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t('subjects.nSubjects').replace('{n}', String(selectedSubjects.length))}
          </Link>
        )}
      </div>

      {/* Week grid */}
      <WeekGrid schedule={weekSchedule} onLectureClick={handleLectureClick} />
    </div>
  );
}
