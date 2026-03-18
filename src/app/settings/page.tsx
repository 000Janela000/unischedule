'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sun, Moon, Monitor, Globe, Github, Bell, Heart } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

// Next.js App Router requires a default export for pages
export default function SettingsPage() {
  const { group } = useAuthGuard();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { supported: pushSupported, permission: pushPermission, subscribed, subscribe, unsubscribe } = useNotifications();
  const [notifTimings, setNotifTimings] = useState<string[]>(['1d', '2h']);

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 py-6 sm:px-6">
      <h1 className="text-lg font-semibold text-foreground animate-slide-up">{t('settings.title')}</h1>

      {/* My Group */}
      <section className="rounded-xl border border-border/50 bg-card shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-medium text-card-foreground">
              {t('settings.myGroup')}
            </h2>
            {group ? (
              <p className="mt-1 font-mono text-xs font-semibold text-primary">
                {group.groupCode}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('settings.noGroup')}
              </p>
            )}
          </div>
          <Link
            href="/onboarding"
            className="flex items-center gap-1 rounded-xl bg-muted/60 px-4 py-2 min-h-[44px] text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98]"
          >
            {t('settings.change')}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-border/50 bg-card shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-card-foreground">
              {t('notifications.title')}
            </h2>
          </div>

          {!pushSupported ? (
            <p className="text-xs text-muted-foreground">
              Push notifications are not supported in this browser.
            </p>
          ) : pushPermission === 'denied' ? (
            <p className="text-xs text-destructive">
              {t('notifications.permissionDenied')}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={subscribed ? unsubscribe : subscribe}
                className={cn(
                  'mb-4 w-full rounded-xl px-4 py-3 min-h-[44px] text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                  subscribed
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/15'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/25'
                )}
              >
                {subscribed ? t('notifications.disable') : t('notifications.enable')}
              </button>

              {subscribed && (
                <div>
                  <p className="mb-3 text-xs font-medium text-card-foreground">
                    {t('notifications.timing')}
                  </p>
                  <div className="space-y-1">
                    {[
                      { key: '1w', label: t('notifications.oneWeek') },
                      { key: '3d', label: t('notifications.threeDays') },
                      { key: '1d', label: t('notifications.oneDay') },
                      { key: '2h', label: t('notifications.twoHours') },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 min-h-[44px] text-xs text-foreground cursor-pointer transition-colors hover:bg-accent/30"
                      >
                        <input
                          type="checkbox"
                          checked={notifTimings.includes(key)}
                          onChange={(e) => {
                            setNotifTimings((prev) =>
                              e.target.checked
                                ? [...prev, key]
                                : prev.filter((t) => t !== key)
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Language */}
      <section className="rounded-xl border border-border/50 bg-card shadow-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-card-foreground">
              {t('settings.language')}
            </h2>
          </div>
          <div className="flex gap-2 rounded-xl bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setLang('ka')}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200',
                lang === 'ka'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="mr-1.5">&#x1F1EC;&#x1F1EA;</span> ქართული
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200',
                lang === 'en'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="mr-1.5">&#x1F1EC;&#x1F1E7;</span> English
            </button>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-xl border border-border/50 bg-card shadow-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium text-card-foreground">
            {t('settings.theme')}
          </h2>
          <div className="flex gap-2 rounded-xl bg-muted/40 p-1">
            {[
              { key: 'light' as const, icon: Sun, label: t('settings.themeLight') },
              { key: 'dark' as const, icon: Moon, label: t('settings.themeDark') },
              { key: 'system' as const, icon: Monitor, label: t('settings.themeSystem') },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2.5 min-h-[44px] text-xs font-medium transition-all duration-200',
                  theme === key
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="rounded-xl border border-border/50 bg-card shadow-sm animate-slide-up" style={{ animationDelay: '250ms' }}>
        <div className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium text-card-foreground">
            {t('settings.about')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">UniHub</span>
              <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                v1.0.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-primary" />
              <span>for agruni.edu.ge</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
