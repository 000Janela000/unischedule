'use client';

import type { Lecture } from '@/types';
import { cn } from '@/lib/utils';

interface LectureCardProps {
  lecture: Lecture;
  onClick: (lecture: Lecture) => void;
}

const TYPE_COLORS: Record<string, string> = {
  lecture: 'bg-primary/70',
  seminar: 'bg-blue-500',
  lab: 'bg-purple-500',
  unknown: 'bg-muted-foreground/50',
};

const TYPE_BORDER_COLORS: Record<string, string> = {
  lecture: 'border-l-primary/70',
  seminar: 'border-l-blue-500',
  lab: 'border-l-purple-500',
  unknown: 'border-l-muted-foreground/50',
};

export function LectureCard({ lecture, onClick }: LectureCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(lecture)}
      className={cn(
        'flex w-full gap-3 rounded-xl border border-border/50 bg-card p-3 text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] border-l-[3px]',
        TYPE_BORDER_COLORS[lecture.type] || TYPE_BORDER_COLORS.unknown
      )}
    >
      {/* Time */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <span className="font-mono text-xs font-semibold text-foreground">{lecture.startTime}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{lecture.endTime}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', TYPE_COLORS[lecture.type] || TYPE_COLORS.unknown)} />
          <p className="text-sm font-medium text-foreground leading-snug">{lecture.subject}</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {lecture.lecturer && <span>{lecture.lecturer}</span>}
          {lecture.room && (
            <>
              <span className="text-border">·</span>
              <span className="font-medium">{lecture.room}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
