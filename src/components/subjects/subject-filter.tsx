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
}

export function SubjectFilter({
  subjects,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('subjects.search')}
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Select All / Deselect All buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t('subjects.selectAll')}
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t('subjects.deselectAll')}
        </button>
      </div>

      {/* Subject count */}
      <p className="text-xs text-muted-foreground">
        {t('subjects.nSubjects').replace('{n}', String(selected.length))}
      </p>

      {/* Subject grid */}
      <div className="grid grid-cols-1 gap-2">
        {filteredSubjects.map((subject) => {
          const isSelected = selected.includes(subject);
          return (
            <button
              key={subject}
              type="button"
              onClick={() => onToggle(subject)}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all min-h-[44px]',
                isSelected
                  ? 'border-primary/50 bg-primary/5 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
              )}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : (
                <Square className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
              )}
              <span className="flex-1 leading-snug">{subject}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
