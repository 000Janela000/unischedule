'use client';

import { useMemo, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle, ClipboardList, Download } from 'lucide-react';
import { useExams } from '@/hooks/use-exams';
import { useUserGroup } from '@/hooks/use-user-group';
import { useLanguage } from '@/i18n';
import { ExamDayGroup } from '@/components/exams/exam-day-group';
import { generateBulkICS, downloadICS } from '@/lib/calendar-export';
import { cn } from '@/lib/utils';
import type { Exam } from '@/types';

function ExamSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex gap-3">
          <div className="space-y-2">
            <div className="h-3 w-8 rounded bg-muted" />
            <div className="h-3 w-10 rounded bg-muted" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function groupExamsByDate(exams: Exam[]): Map<string, Exam[]> {
  const groups = new Map<string, Exam[]>();
  for (const exam of exams) {
    const existing = groups.get(exam.date);
    if (existing) {
      existing.push(exam);
    } else {
      groups.set(exam.date, [exam]);
    }
  }
  return groups;
}

// Next.js App Router requires a default export for pages
export default function ExamsPage() {
  const { group } = useUserGroup();
  const { lang, t } = useLanguage();
  const { exams, loading, error, refetch } = useExams(
    group?.groupCode || null,
    group?.university || 'agruni'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [exported, setExported] = useState(false);

  const examsByDate = useMemo(() => groupExamsByDate(exams), [exams]);
  const sortedDates = useMemo(
    () => Array.from(examsByDate.keys()).sort(),
    [examsByDate]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    // Keep spinning for at least 600ms for visual feedback
    setTimeout(() => setRefreshing(false), 600);
  }, [refetch]);

  const handleExportAll = useCallback(() => {
    if (exams.length === 0) return;
    const ics = generateBulkICS(exams);
    downloadICS(ics, 'unischedule-exams.ics');
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [exams]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{t('exams.title')}</h1>
        </div>
        <ExamSkeleton />
        <ExamSkeleton />
        <ExamSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">{t('exams.error')}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('exams.retry')}
        </button>
      </div>
    );
  }

  // Empty state
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <ClipboardList className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">{t('exams.noExams')}</h2>
        <p className="text-sm text-muted-foreground">{t('exams.noExamsDesc')}</p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes examFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .exam-day-animate {
          animation: examFadeIn 0.4s ease-out both;
        }
      `}</style>
      <div className="space-y-6 px-4 py-4">
        {/* Header with refresh and export buttons */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{t('exams.title')}</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportAll}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all duration-200',
                exported
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {exported
                  ? lang === 'ka' ? 'ექსპორტირებულია!' : 'Exported!'
                  : lang === 'ka' ? 'ყველას ექსპორტი' : 'Export All'}
              </span>
            </button>
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
        </div>

        {/* Group info */}
        {group && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <span className="font-mono text-xs font-medium text-primary">
              {group.groupCode}
            </span>
          </div>
        )}

        {/* Exam day groups with staggered fade-in */}
        {sortedDates.map((date, index) => (
          <div
            key={date}
            className="exam-day-animate"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ExamDayGroup
              date={date}
              exams={examsByDate.get(date)!}
              lang={lang}
            />
          </div>
        ))}
      </div>
    </>
  );
}
