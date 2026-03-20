'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserGroup } from '@/hooks/use-user-group';

export function useAuthGuard() {
  const { data: session, status } = useSession();
  const { group, loading: groupLoading } = useUserGroup();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || groupLoading) return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (!group) {
      router.replace('/onboarding');
    }
  }, [status, group, groupLoading, router]);

  const ready = status === 'authenticated' && !groupLoading && !!group;
  return { ready, group, loading: status === 'loading' || groupLoading, session };
}
