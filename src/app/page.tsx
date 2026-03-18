'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import type { UserGroup } from '@/types';

const SUBJECTS_STORAGE_KEY = 'unischedule_subjects';

// Next.js App Router requires a default export for pages
export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const group = getItem<UserGroup | null>(STORAGE_KEYS.USER_GROUP, null);

    if (!group) {
      router.replace('/onboarding');
    } else {
      let hasSubjects = false;
      try {
        const raw = window.localStorage.getItem(SUBJECTS_STORAGE_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          hasSubjects = Array.isArray(parsed);
        }
      } catch {
        // ignore
      }

      if (!hasSubjects) {
        router.replace('/subjects');
      } else {
        router.replace('/exams');
      }
    }

    setLoading(false);
  }, [router]);

  if (!loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
          U
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-base font-semibold text-foreground">UniHub</span>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    </div>
  );
}
