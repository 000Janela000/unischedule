'use client';

import { useState, useMemo } from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

interface SubjectFilterProps {
  subjects: string[];
  selected: string[];
  onToggle: (subject: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  hideControls?: boolean;
}

export function SubjectFilter({
  subjects,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  hideControls = false,
}: SubjectFilterProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const lower = search.trim().toLowerCase();
    return subjects.filter((s) => s.toLowerCase().includes(lower));
  }, [subjects, search]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('subjects.search')}
          className="w-full rounded-xl border border-border/50 bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* Select All / Deselect All pills */}
      {!hideControls && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-full border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98] min-h-[36px]"
          >
            {t('subjects.selectAll')}
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="rounded-full border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98] min-h-[36px]"
          >
            {t('subjects.deselectAll')}
          </button>
          <span className="flex items-center text-xs text-muted-foreground ml-auto">
            {t('subjects.nSubjects').replace('{n}', String(selected.length))}
          </span>
        </div>
      )}

      {/* Subject grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredSubjects.map((subject, index) => {
          const isSelected = selected.includes(subject);
          return (
            <button
              key={subject}
              type="button"
              onClick={() => onToggle(subject)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 min-h-[44px] active:scale-[0.98]',
                isSelected
                  ? 'border-primary/30 bg-primary/5 text-foreground border-l-[3px] border-l-primary'
                  : 'border-border/50 bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-accent/30'
              )}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 flex-shrink-0 text-primary transition-all duration-200" />
              ) : (
                <Square className="h-5 w-5 flex-shrink-0 text-muted-foreground/40 transition-all duration-200" />
              )}
              <span className="flex-1 leading-snug">{subject}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
