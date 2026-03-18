'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Exam } from '@/types';

const STORAGE_KEY = 'unischedule_subjects';

/**
 * Extracts unique subjectClean values from a list of exams.
 */
export function getAvailableSubjects(exams: Exam[]): string[] {
  const set = new Set<string>();
  for (const exam of exams) {
    if (exam.subjectClean && exam.subjectClean.trim()) {
      set.add(exam.subjectClean.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ka'));
}

function loadFromStorage(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(subjects: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch {
    // localStorage might be full or disabled
  }
}

export function useSubjects(availableSubjects: string[] = []) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored !== null) {
      setSelectedSubjects(stored);
    } else if (availableSubjects.length > 0) {
      // Default: all subjects selected
      setSelectedSubjects(availableSubjects);
    }
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update defaults when availableSubjects changes and nothing was stored
  useEffect(() => {
    if (!initialized) return;
    const stored = loadFromStorage();
    if (stored === null && availableSubjects.length > 0) {
      setSelectedSubjects(availableSubjects);
      saveToStorage(availableSubjects);
    }
  }, [availableSubjects, initialized]);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) => {
      const next = prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject];
      saveToStorage(next);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSubjects(availableSubjects);
    saveToStorage(availableSubjects);
  }, [availableSubjects]);

  const deselectAll = useCallback(() => {
    setSelectedSubjects([]);
    saveToStorage([]);
  }, []);

  const setSubjects = useCallback((subjects: string[]) => {
    setSelectedSubjects(subjects);
    saveToStorage(subjects);
  }, []);

  return {
    subjects: availableSubjects,
    selectedSubjects,
    toggleSubject,
    selectAll,
    deselectAll,
    setSubjects,
    initialized,
  };
}
