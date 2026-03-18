'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useLanguage } from '@/i18n';

const pageTitles: Record<string, string> = {
  '/exams': 'nav.exams',
  '/schedule': 'nav.schedule',
  '/settings': 'nav.settings',
  '/subjects': 'subjects.title',
};

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const titleKey = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/50 backdrop-blur-xl bg-background/80 px-4 sm:px-6 md:left-60 md:px-6">
      <Link href="/exams" className="text-lg font-semibold text-foreground md:hidden">
        UniHub
      </Link>
      {/* Desktop: show current page title */}
      <h1 className="hidden md:block text-sm font-medium text-muted-foreground">
        {titleKey ? t(titleKey) : ''}
      </h1>
      <Link
        href="/settings"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-accent md:hidden"
      >
        <Settings className="h-5 w-5" />
      </Link>
      {/* Empty spacer on desktop */}
      <div className="hidden md:block" />
    </header>
  );
}
