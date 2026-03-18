'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n';
import { useUserGroup } from '@/hooks/use-user-group';
import { useSubjects, getAvailableSubjects } from '@/hooks/use-subjects';
import { SubjectFilter } from '@/components/subjects/subject-filter';
import type { Exam } from '@/types';

export default function SubjectsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { group } = useUserGroup();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exams for the user's group to detect available subjects
  useEffect(() => {
    if (!group) {
      setLoading(false);
      return;
    }

    const fetchExams = async () => {
      try {
        const params = new URLSearchParams({
          group: group.groupCode,
          university: group.university,
        });
        const res = await fetch(`/api/sheets/exams?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data: Exam[] = Array.isArray(json) ? json : (json.exams ?? []);
        setExams(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [group]);

  const availableSubjects = useMemo(() => getAvailableSubjects(exams), [exams]);
  const {
    selectedSubjects,
    toggleSubject,
    selectAll,
    deselectAll,
  } = useSubjects(availableSubjects);

  const handleContinue = () => {
    router.push('/exams');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/exams')}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {t('subjects.continue')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="mb-6 text-lg font-bold text-foreground">
        {t('subjects.title')}
      </h1>

      {availableSubjects.length > 0 ? (
        <SubjectFilter
          subjects={availableSubjects}
          selected={selectedSubjects}
          onToggle={toggleSubject}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('exams.noExams')}
        </p>
      )}

      {/* Continue button */}
      <div className="sticky bottom-20 mt-6 pb-4 md:bottom-6">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('subjects.continue')}
        </button>
      </div>
    </div>
  );
}
