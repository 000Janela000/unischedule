'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserGroup } from '@/hooks/use-user-group';

/**
 * Redirects to /onboarding if no group is configured.
 * Returns { ready: boolean } - true when group exists and is hydrated.
 */
export function useAuthGuard() {
  const { group, loading } = useUserGroup();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!group) {
      router.replace('/onboarding');
    }
  }, [group, loading, router]);

  return { ready: !loading && !!group, group, loading };
}
