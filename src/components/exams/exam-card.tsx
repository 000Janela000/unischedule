'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Clock, Users, CalendarPlus } from 'lucide-react';
import { generateICS, downloadICS } from '@/lib/calendar-export';
import type { Exam } from '@/types';
import { ExamType } from '@/types';
import { ExamTypeBadge } from '@/components/exams/exam-type-badge';
import { CountdownTimer } from '@/components/exams/countdown-timer';
import { SeatInput, getSectionFromSeat } from '@/components/exam-room/seat-input';
import { RoomMiniMap } from '@/components/exam-room/room-mini-map';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface ExamCardProps {
  exam: Exam;
  lang: 'ka' | 'en';
}

const borderColorMap: Record<ExamType, string> = {
  [ExamType.Midterm]: 'border-l-exam-midterm',
  [ExamType.Final]: 'border-l-exam-final',
  [ExamType.Quiz]: 'border-l-exam-quiz',
  [ExamType.Retake]: 'border-l-muted-foreground',
  [ExamType.Additional]: 'border-l-amber-500',
  [ExamType.Unknown]: 'border-l-muted-foreground',
};

export function ExamCard({ exam, lang }: ExamCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [seat, setSeat] = useState('');
  const [section, setSection] = useState<string | null>(null);
  const [calendarExported, setCalendarExported] = useState(false);

  const targetDate = new Date(`${exam.date}T${exam.startTime}:00`);

  // Load saved seat on mount
  useEffect(() => {
    const storageKey = `${STORAGE_KEYS.EXAM_SEAT_PREFIX}${exam.id}`;
    const saved = getItem<string>(storageKey, '');
    if (saved) {
      setSeat(saved);
      setSection(getSectionFromSeat(saved));
    }
  }, [exam.id]);

  const handleSeatChange = useCallback(
    (newSeat: string) => {
      setSeat(newSeat);
      const storageKey = `${STORAGE_KEYS.EXAM_SEAT_PREFIX}${exam.id}`;
      setItem(storageKey, newSeat);
      setSection(getSectionFromSeat(newSeat));
    },
    [exam.id]
  );

  const handleCalendarExport = useCallback(() => {
    const ics = generateICS(exam);
    const filename = `${exam.subjectClean.replace(/\s+/g, '_')}.ics`;
    downloadICS(ics, filename);
    setCalendarExported(true);
    setTimeout(() => setCalendarExported(false), 2000);
  }, [exam]);

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card border-l-4 transition-all duration-200 hover:shadow-sm active:scale-[0.98]',
        borderColorMap[exam.examType]
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        {/* Time column */}
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{exam.startTime}</span>
          {exam.endTime && (
            <span className="text-[10px] text-muted-foreground">{exam.endTime}</span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-tight text-card-foreground">
              {exam.subjectClean}
            </h3>
            <ChevronDown
              className={cn(
                'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ExamTypeBadge type={exam.examType} label={exam.examTypeLabel} />
            <CountdownTimer targetDate={targetDate} lang={lang} />
          </div>
        </div>
      </button>

      {/* Expandable content using CSS grid trick */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pb-4 pt-3">
            {/* Full subject name */}
            {exam.subject !== exam.subjectClean && (
              <p className="mb-2 text-xs text-muted-foreground">{exam.subject}</p>
            )}

            {/* Lecturers */}
            {exam.lecturers.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {lang === 'ka' ? 'ლექტორები' : 'Lecturers'}:{' '}
                </span>
                <span className="text-xs text-card-foreground">
                  {exam.lecturers.join(', ')}
                </span>
              </div>
            )}

            {/* Groups */}
            {exam.groups.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {lang === 'ka' ? 'ჯგუფები' : 'Groups'}:{' '}
                </span>
                <span className="font-mono text-xs text-card-foreground">
                  {exam.groups.join(', ')}
                </span>
              </div>
            )}

            {/* Student count */}
            {exam.studentCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>
                  {exam.studentCount} {lang === 'ka' ? 'სტუდენტი' : 'students'}
                </span>
              </div>
            )}

            {/* Seat & Room Map */}
            <div className="mt-3 border-t border-border pt-3">
              <SeatInput
                examId={exam.id}
                onSeatChange={handleSeatChange}
                initialValue={seat}
              />
              {section && (
                <div className="mt-2">
                  <RoomMiniMap highlightSection={section} />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCalendarExport();
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  calendarExported
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-muted text-foreground hover:bg-muted/80 active:scale-95'
                )}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                {calendarExported
                  ? lang === 'ka' ? 'დაემატა!' : 'Exported!'
                  : lang === 'ka' ? 'კალენდარში დამატება' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
