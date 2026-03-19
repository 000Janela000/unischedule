'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { MapPin, RefreshCw, AlertCircle, CalendarX } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useSchedule } from '@/hooks/use-schedule';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Lecture, WeekSchedule } from '@/types';

const SUBJECTS_STORAGE_KEY = 'unischedule_subjects';

const DAYS_KA = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const typeColors: Record<string, string> = {
  lecture: 'border-l-primary',
  seminar: 'border-l-accent',
  lab: 'border-l-chart-3',
  unknown: 'border-l-muted-foreground/40',
};

function getTodayIndex(): number {
  const day = new Date().getDay();
  return day >= 1 && day <= 5 ? day - 1 : -1;
}

function LectureCard({ lecture }: { lecture: Lecture }) {
  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger>
          <Card
            className={cn(
              'cursor-default border-l-[3px] transition-all hover:shadow-md hover:scale-[1.02] text-left',
              typeColors[lecture.type] || typeColors.unknown
            )}
          >
            <CardContent className="p-3">
              <p className="font-mono text-xs text-muted-foreground">
                {lecture.startTime}–{lecture.endTime}
              </p>
              <h3 className="mt-1.5 text-sm font-semibold leading-snug text-foreground line-clamp-2">
                {lecture.subject}
              </h3>
              {lecture.room && (
                <Badge variant="secondary" className="mt-2 gap-1 text-[10px] px-1.5 py-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {lecture.room}
                </Badge>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{lecture.subject}</p>
          {lecture.lecturer && (
            <p className="mt-1 text-xs">{lecture.lecturer}</p>
          )}
          <p className="text-xs">
            {lecture.startTime}–{lecture.endTime}{lecture.room ? ` | ${lecture.room}` : ''}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DayColumn({ dayIndex, lectures, lang }: { dayIndex: number; lectures: Lecture[]; lang: 'ka' | 'en' }) {
  const dayLabel = lang === 'ka' ? DAYS_KA[dayIndex] : DAYS_EN[dayIndex];
  const isToday = getTodayIndex() === dayIndex;
  const sorted = [...lectures].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex min-w-[160px] flex-1 flex-col lg:min-w-0">
      <div className={cn(
        'mb-3 flex items-center gap-2 rounded-lg px-3 py-2',
        isToday ? 'bg-primary/10' : 'bg-muted/50'
      )}>
        <h2 className={cn(
          'text-sm font-semibold truncate',
          isToday ? 'text-primary' : 'text-foreground'
        )}>
          {dayLabel}
        </h2>
        {sorted.length > 0 && (
          <Badge
            variant={isToday ? 'default' : 'secondary'}
            className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs flex-shrink-0"
          >
            {sorted.length}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {sorted.length > 0 ? (
          sorted.map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 py-8">
            <span className="text-lg text-muted-foreground/50">—</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { ready, group } = useAuthGuard();
  const { lang, t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  }, [refetch]);

  const totalLectures = useMemo(
    () => weekSchedule.reduce((sum, day) => sum + day.lectures.length, 0),
    [weekSchedule]
  );

  if (!ready || loading) {
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
        <div className="rounded-xl border border-border/50 bg-card p-8 shadow-sm max-w-sm w-full">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/80" />
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground min-h-[44px]"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (totalLectures === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <CalendarX className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">{t('schedule.noLectures')}</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {lang === 'ka' ? 'კვირის ცხრილი' : 'Weekly Schedule'}
            </h1>
            {group && (
              <Badge variant="secondary" className="font-mono text-xs">
                {group.groupCode}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {totalLectures} {lang === 'ka' ? 'ლექცია' : 'lectures'}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === 'ka' ? 'სრული კვირის განრიგი ერთ ხედში' : 'Full week schedule at a glance'}
          </p>
        </div>

        {/* 5-Day Grid */}
        <div className="flex gap-3 overflow-x-auto pb-4 lg:gap-4 lg:overflow-visible">
          {weekSchedule.map((day, index) => (
            <DayColumn
              key={day.dayOfWeek}
              dayIndex={index}
              lectures={day.lectures}
              lang={lang}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary" />
            <span>{lang === 'ka' ? 'ლექცია' : 'Lecture'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-accent" />
            <span>{lang === 'ka' ? 'სემინარი' : 'Seminar'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--chart-3)' }} />
            <span>{lang === 'ka' ? 'ლაბორატორია' : 'Lab'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
