'use client';

import { useMemo } from 'react';
import { Lecture, WeekSchedule } from '@/types';
import { subjectsMatch } from '@/lib/subject-matcher';
import { LectureCard } from './LectureCard';
import { timeToMinutes } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';

interface WeekGridProps {
  weekSchedule: WeekSchedule;
  todayIndex?: number; // 0-4 for Monday-Friday, -1 if not in weekday
  highlightedSubject?: string | null;
  conflictIds?: Set<string>;
  currentMinutes?: number; // 0-1439
  onLectureClick?: (lecture: Lecture) => void;
}

export function WeekGrid({
  weekSchedule,
  todayIndex = -1,
  highlightedSubject,
  conflictIds = new Set(),
  currentMinutes = -1,
  onLectureClick,
}: WeekGridProps) {
  // Find active lecture (current time matches)
  const activeLectureId = useMemo(() => {
    if (currentMinutes < 0) return null;

    for (const day of weekSchedule) {
      for (const lecture of day.lectures) {
        const start = timeToMinutes(lecture.startTime);
        const end = timeToMinutes(lecture.endTime);
        if (start <= currentMinutes && currentMinutes < end) {
          return lecture.id;
        }
      }
    }
    return null;
  }, [weekSchedule, currentMinutes]);

  return (
    <div className="space-y-4">
      {/* Header row with day names and dates */}
      <div className="grid grid-cols-5 gap-2">
        {weekSchedule.map((day) => (
          <div key={day.dayOfWeek} className="text-center">
            <p className="text-sm font-semibold text-foreground">{day.dayNameKa}</p>
            <p className={cn(
              'text-xs text-muted-foreground mt-1',
              todayIndex === day.dayOfWeek - 1 && 'text-primary font-medium'
            )}>
              {day.dayOfWeek}
            </p>
          </div>
        ))}
      </div>

      {/* Lecture cards grid */}
      <div className="grid grid-cols-5 gap-2 auto-rows-max">
        {weekSchedule.map((day) =>
          day.lectures.length > 0 ? (
            <div key={day.dayOfWeek} className="space-y-2">
              {day.lectures.map((lecture) => {
                const isHighlighted = highlightedSubject
                  ? subjectsMatch(lecture.subject, highlightedSubject)
                  : false;
                const isConflict = conflictIds.has(lecture.id);
                const isActive = lecture.id === activeLectureId;

                return (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    isHighlighted={isHighlighted}
                    isConflict={isConflict}
                    isActive={isActive}
                    onClick={() => onLectureClick?.(lecture)}
                  />
                );
              })}
            </div>
          ) : (
            <div key={day.dayOfWeek} className="text-center py-8">
              <p className="text-xs text-muted-foreground">—</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
