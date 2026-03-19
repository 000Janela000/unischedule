'use client';

import { useState } from 'react';
import type { WeekSchedule, Lecture } from '@/types';
import { DayColumn } from '@/components/schedule/day-column';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

interface WeekGridProps {
  schedule: WeekSchedule;
  onLectureClick: (lecture: Lecture) => void;
}

export function WeekGrid({ schedule, onLectureClick }: WeekGridProps) {
  const { lang } = useLanguage();
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    if (today >= 1 && today <= 5) return today - 1;
    return 0;
  });

  return (
    <div className="flex flex-col">
      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-4">
        {schedule.map((day, index) => {
          const dayName = lang === 'ka' ? day.dayNameKa : day.dayNameEn;
          const lectureCount = day.lectures.length;
          const isActive = activeDay === index;

          return (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => setActiveDay(index)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <span>{dayName}</span>
              {lectureCount > 0 && (
                <span className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {lectureCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active day content */}
      <div className="max-w-2xl">
        {schedule[activeDay] && (
          <DayColumn
            day={schedule[activeDay]}
            onLectureClick={onLectureClick}
            hideHeader
          />
        )}
      </div>
    </div>
  );
}
