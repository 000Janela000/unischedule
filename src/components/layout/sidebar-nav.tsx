'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Calendar, Settings } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof ClipboardList;
}

const navItems: NavItem[] = [
  { href: '/exams', labelKey: 'nav.exams', icon: ClipboardList },
  { href: '/schedule', labelKey: 'nav.schedule', icon: Calendar },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server to avoid hydration mismatch from i18n
  if (!mounted) {
    return (
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-border/50 bg-card/90" />
    );
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-border/50 backdrop-blur-xl bg-card/90">
      <div className="flex h-14 items-center gap-3 border-b border-border/50 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          U
        </div>
        <Link href="/exams" className="text-base font-semibold text-foreground">
          UniHub
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary" />
                  )}
                  <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/50 px-6 py-4">
        <p className="text-[10px] text-muted-foreground/60">UniHub v1.0.0</p>
      </div>
    </aside>
  );
}
