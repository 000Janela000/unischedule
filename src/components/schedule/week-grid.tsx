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

const START_HOUR = 8;
const END_HOUR = 20;

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function WeekGrid({ schedule, onLectureClick }: WeekGridProps) {
  const totalHours = END_HOUR - START_HOUR;
  const { lang } = useLanguage();
  const [activeDay, setActiveDay] = useState(0);

  return (
    <>
      {/* Mobile: single day view with day tabs */}
      <div className="flex flex-col md:hidden">
        {/* Day tabs - horizontal scrollable */}
        <div className="flex overflow-x-auto border-b border-border bg-card">
          {schedule.map((day, index) => {
            const dayName = lang === 'ka' ? day.dayNameKa : day.dayNameEn;
            const shortName = dayName.slice(0, 3);
            return (
              <button
                key={day.dayOfWeek}
                type="button"
                onClick={() => setActiveDay(index)}
                className={cn(
                  'flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors min-h-[44px]',
                  activeDay === index
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {shortName}
              </button>
            );
          })}
        </div>

        {/* Single day column + time axis */}
        <div className="flex flex-1 rounded-b-lg border-x border-b border-border bg-card">
          {/* Time axis */}
          <div className="sticky left-0 z-20 flex flex-shrink-0 flex-col border-r border-border bg-card">
            <div className="relative flex-1" style={{ minHeight: `${totalHours * 60}px` }}>
              {Array.from({ length: totalHours }, (_, i) => (
                <div
                  key={i}
                  className="absolute right-0 left-0 px-1.5"
                  style={{ top: `${(i / totalHours) * 100}%`, transform: 'translateY(-6px)' }}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {formatHour(START_HOUR + i)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active day column - full width */}
          {schedule[activeDay] && (
            <DayColumn
              day={schedule[activeDay]}
              onLectureClick={onLectureClick}
              startHour={START_HOUR}
              endHour={END_HOUR}
              hideHeader
            />
          )}
        </div>
      </div>

      {/* Desktop: full 5-day grid */}
      <div className="hidden md:flex flex-1 overflow-x-auto rounded-lg border border-border bg-card">
        {/* Time axis */}
        <div className="sticky left-0 z-20 flex flex-shrink-0 flex-col border-r border-border bg-card">
          {/* Empty header aligned with day headers */}
          <div className="border-b border-border px-2 py-2">
            <span className="text-[10px] text-transparent">00:00</span>
          </div>

          {/* Time labels */}
          <div className="relative flex-1" style={{ minHeight: `${totalHours * 60}px` }}>
            {Array.from({ length: totalHours }, (_, i) => (
              <div
                key={i}
                className="absolute right-0 left-0 px-1.5"
                style={{ top: `${(i / totalHours) * 100}%`, transform: 'translateY(-6px)' }}
              >
                <span className="text-[10px] text-muted-foreground">
                  {formatHour(START_HOUR + i)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {schedule.map((day) => (
          <DayColumn
            key={day.dayOfWeek}
            day={day}
            onLectureClick={onLectureClick}
            startHour={START_HOUR}
            endHour={END_HOUR}
          />
        ))}
      </div>
    </>
  );
}
