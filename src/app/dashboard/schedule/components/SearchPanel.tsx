'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DAY_NAMES_KA } from '@/lib/schedule-utils';

export interface SearchResult {
  group: string;
  subject: string;
  slots: {
    dayOfWeek: number;
    dayNameKa: string;
    startTime: string;
    endTime: string;
    room: string;
    type: string;
  }[];
}

interface SearchPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  hasEmisSubjects?: boolean;
}

export function SearchPanel({
  query,
  onQueryChange,
  results,
  onResultClick,
  hasEmisSubjects,
}: SearchPanelProps) {
  const showResults = query.length >= 2;
  const slotsSummary = (result: SearchResult) => {
    if (result.slots.length === 0) return '—';
    const days = Array.from(new Set(result.slots.map((s) => s.dayNameKa))).join(', ');
    const times = result.slots.map((s) => `${s.startTime}-${s.endTime}`).join(', ');
    return `${days} · ${times}`;
  };

  return (
    <div className="space-y-3">
      <div>
        <Input
          placeholder="ძებნა (მინ. 2 სიმბოლო)..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full"
        />
        {!hasEmisSubjects && (
          <p className="mt-2 text-xs text-muted-foreground">
            💡 ძებნა მხოლოდ თქვენი ჯგუფის ცხრილში
          </p>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-2">
          {results.map((result, idx) => (
            <button
              key={idx}
              onClick={() => onResultClick(result)}
              className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/50 active:scale-98"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{result.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {slotsSummary(result)}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {result.group.toUpperCase()}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && (
        <div className="rounded-lg border border-border bg-secondary/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">შედეგი არ იპოვა</p>
        </div>
      )}
    </div>
  );
}
