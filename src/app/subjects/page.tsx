'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useUserGroup } from '@/hooks/use-user-group';
import { useSubjects, getAvailableSubjects } from '@/hooks/use-subjects';
import { SubjectFilter } from '@/components/subjects/subject-filter';
import type { Exam, Lecture } from '@/types';

export default function SubjectsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { group, loading: groupLoading } = useUserGroup();
  const [groupExams, setGroupExams] = useState<Exam[]>([]);
  const [groupLectures, setGroupLectures] = useState<Lecture[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupLoading) return;
    if (!group) {
      router.replace('/onboarding');
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setDataLoading(true);
      setError(null);

      // Fetch both group-specific AND all subjects in parallel
      const [groupExamRes, groupLecRes, allExamRes, allLecRes] = await Promise.allSettled([
        fetch(`/api/sheets/exams?group=${encodeURIComponent(group!.groupCode)}&university=${group!.university}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(json => (json.exams ?? []) as Exam[]),
        fetch(`/api/sheets/lectures?group=${encodeURIComponent(group!.groupCode)}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(json => (json.lectures ?? []) as Lecture[]),
        // Fetch ALL exams (no group filter) to get all available subjects
        fetch(`/api/sheets/exams?university=${group!.university}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(json => (json.exams ?? []) as Exam[]),
        // Fetch ALL lectures (no group filter)
        fetch(`/api/sheets/lectures`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then(json => (json.lectures ?? []) as Lecture[]),
      ]);

      if (cancelled) return;

      if (groupExamRes.status === 'fulfilled') setGroupExams(groupExamRes.value);
      if (groupLecRes.status === 'fulfilled') setGroupLectures(groupLecRes.value);
      if (allExamRes.status === 'fulfilled') setAllExams(allExamRes.value);
      if (allLecRes.status === 'fulfilled') setAllLectures(allLecRes.value);

      if (groupExamRes.status === 'rejected' && groupLecRes.status === 'rejected' &&
          allExamRes.status === 'rejected' && allLecRes.status === 'rejected') {
        setError('Failed to fetch data');
      }

      setDataLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [group, groupLoading, router]);

  // Subjects from the user's group (pre-selected)
  const groupSubjects = useMemo(
    () => getAvailableSubjects(groupExams, groupLectures),
    [groupExams, groupLectures]
  );

  // ALL subjects in the university (for the "add other" section)
  const allSubjects = useMemo(
    () => getAvailableSubjects(allExams, allLectures),
    [allExams, allLectures]
  );

  const {
    selectedSubjects,
    toggleSubject,
    selectAll,
    deselectAll,
  } = useSubjects(groupSubjects);

  const handleContinue = () => {
    router.push('/exams');
  };

  if (groupLoading || dataLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
              <div className="h-5 w-5 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${100 + Math.random() * 120}px` }} />
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-xs text-muted-foreground animate-pulse">{t('subjects.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
        <div className="rounded-xl border border-border/50 bg-card p-8 shadow-sm max-w-sm w-full">
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground min-h-[44px] flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Other subjects = all subjects minus group subjects
  const otherSubjects = allSubjects.filter(s => !groupSubjects.includes(s));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-lg font-semibold text-foreground">
          {t('subjects.title')}
        </h1>
        {group && (
          <p className="mt-1 text-xs text-muted-foreground">
            {group.groupCode} · {selectedSubjects.length} {t('subjects.nSelected')}
          </p>
        )}
      </div>

      {/* Group subjects (pre-selected) */}
      {groupSubjects.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('subjects.yourSubjects')}
          </p>
          <SubjectFilter
            subjects={groupSubjects}
            selected={selectedSubjects}
            onToggle={toggleSubject}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />
        </div>
      )}

      {/* Other subjects (from other faculties/groups) */}
      {otherSubjects.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('subjects.otherSubjects')}
          </p>
          <SubjectFilter
            subjects={otherSubjects}
            selected={selectedSubjects}
            onToggle={toggleSubject}
            onSelectAll={() => {/* no select all for other */}}
            onDeselectAll={() => {/* no deselect all for other */}}
            hideControls
          />
        </div>
      )}

      {groupSubjects.length === 0 && allSubjects.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center animate-fade-in">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('subjects.noSubjects')}</p>
        </div>
      )}

      {/* Continue button */}
      <div className="sticky bottom-20 mt-6 pb-4 md:bottom-6">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] shadow-sm shadow-primary/25 min-h-[48px]"
        >
          {t('subjects.continue')}
          {selectedSubjects.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
              {selectedSubjects.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
