'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FacultyGrid } from '@/components/onboarding/faculty-grid';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { YearPicker } from '@/components/onboarding/year-picker';
import { GroupPicker } from '@/components/onboarding/group-picker';
import { useLanguage } from '@/i18n';
import { buildGroupCode, getAcademicYear, AGRUNI_FACULTIES, FIRST_YEAR_FACULTY } from '@/lib/group-decoder';
import { setItem, STORAGE_KEYS } from '@/lib/storage';
import type { UserGroup } from '@/types';

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [groupNumber, setGroupNumber] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const canGoNext = useMemo(() => {
    switch (step) {
      case 1: return facultyId !== null;
      case 2: return year !== null && groupNumber !== null;
      default: return false;
    }
  }, [step, facultyId, year, groupNumber]);

  const selectedFaculty = useMemo(() => {
    if (!facultyId) return null;
    if (facultyId === 'first-year') return FIRST_YEAR_FACULTY;
    return AGRUNI_FACULTIES.find((f) => f.id === facultyId) || null;
  }, [facultyId]);

  const groupCodePreview = useMemo(() => {
    if (!selectedFaculty || !year || !groupNumber) return '';
    const academicYear = getAcademicYear();
    const entryYear = academicYear - year + 1;
    return buildGroupCode(selectedFaculty.prefix, entryYear, groupNumber);
  }, [selectedFaculty, year, groupNumber]);

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setDirection('forward');
      setAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setAnimating(false);
      }, 150);
      return;
    }

    // Final step: save and navigate
    if (!facultyId || !year || !groupNumber || !selectedFaculty) return;

    const academicYear = getAcademicYear();
    const entryYear = academicYear - year + 1;
    const groupCode = buildGroupCode(selectedFaculty.prefix, entryYear, groupNumber);

    const userGroup: UserGroup = {
      university: 'agruni',
      facultyId,
      year,
      groupNumber,
      groupCode,
    };

    setItem(STORAGE_KEYS.USER_GROUP, userGroup);
    router.push('/subjects');
  }

  function handleBack() {
    if (step > 1) {
      setDirection('back');
      setAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setAnimating(false);
      }, 150);
    }
  }

  const stepTitles = [
    t('onboarding.selectFaculty'),
    t('onboarding.selectYearAndGroup'),
  ];

  return (
    <div className="flex flex-1 flex-col bg-background max-w-2xl mx-auto w-full">
      {/* Green gradient accent at top */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      {/* Header area */}
      <div className="px-6 pt-6 pb-3 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            U
          </div>
          <h1 className="text-xl font-bold text-foreground">UniSchedule</h1>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">agruni.edu.ge</p>
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        <p className="mt-3 text-base font-semibold text-foreground">{stepTitles[step - 1]}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden px-6">
        <div
          ref={contentRef}
          className="pt-1 transition-all duration-300 ease-out"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction === 'forward' ? '24px' : '-24px'})`
              : 'translateX(0)',
          }}
        >
          {step === 1 && (
            <FacultyGrid
              university="agruni"
              value={facultyId}
              onChange={setFacultyId}
            />
          )}
          {step === 2 && (
            <div className="space-y-4">
              <YearPicker value={year} onChange={setYear} />
              {year !== null && (
                <GroupPicker
                  value={groupNumber}
                  onChange={setGroupNumber}
                  groupCodePreview={groupCodePreview}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 px-6 py-4 pb-8">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 rounded-xl border border-border/50 bg-card px-4 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98] min-h-[48px]"
          >
            {t('onboarding.back')}
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex-1 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          {step === TOTAL_STEPS ? t('onboarding.done') : t('onboarding.next')}
        </button>
      </div>
    </div>
  );
}
