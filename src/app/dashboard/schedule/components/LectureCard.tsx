import { Lecture } from '@/types';
import { cn } from '@/lib/utils';

interface LectureCardProps {
  lecture: Lecture;
  isHighlighted?: boolean;
  isConflict?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function LectureCard({
  lecture,
  isHighlighted,
  isConflict,
  isActive,
  onClick,
}: LectureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-3 text-left text-sm transition-all',
        'hover:shadow-md active:scale-98',
        isActive && 'ring-2 ring-primary animate-pulse bg-primary/10 border-primary',
        isConflict && 'ring-2 ring-amber-500/60 bg-amber-50/30 border-amber-500/30 dark:bg-amber-950/20',
        isHighlighted && !isActive && !isConflict && 'ring-2 ring-primary/60 bg-primary/10 border-primary/50',
        !isActive && !isConflict && !isHighlighted && 'border-border bg-card hover:bg-secondary/50'
      )}
    >
      {/* Conflict indicator dot */}
      {isConflict && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
      )}

      {/* Subject name */}
      <p className="font-semibold text-foreground">{lecture.subject}</p>

      {/* Time and type */}
      <p className="mt-1 text-xs text-muted-foreground">
        {lecture.startTime} – {lecture.endTime} · {lecture.type}
      </p>

      {/* Lecturer and room */}
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {lecture.lecturer}
        {lecture.room && ` · ${lecture.room}`}
      </p>
    </button>
  );
}
