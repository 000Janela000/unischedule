'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { InstallPrompt } from '@/components/layout/install-prompt';

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = pathname === '/login' || pathname.startsWith('/onboarding');

  if (isFullScreen) {
    return (
      <div className="flex flex-1 flex-col overflow-auto bg-transparent">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto lg:ml-60 bg-background">
      <Header />
      <InstallPrompt />
      <main className="flex-1">{children}</main>
    </div>
  );
}
