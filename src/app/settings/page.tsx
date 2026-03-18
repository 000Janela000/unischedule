'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, Sun, Moon, Monitor, Globe, Github, Upload, Trash2, FileSpreadsheet, Bell, Mail, MailCheck } from 'lucide-react';
import { useUserGroup } from '@/hooks/use-user-group';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';
import { useSchedule } from '@/hooks/use-schedule';
import { useNotifications } from '@/hooks/use-notifications';
import { parseLectureFile } from '@/lib/sheets/parse-lectures';
import { cn } from '@/lib/utils';

// Next.js App Router requires a default export for pages
export default function SettingsPage() {
  const { group } = useUserGroup();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { allLectures, setLectures, clearLectures } = useSchedule();
  const { supported: pushSupported, permission: pushPermission, subscribed, subscribe, unsubscribe } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [notifTimings, setNotifTimings] = useState<string[]>(['1d', '2h']);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailMessage, setGmailMessage] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseLectureFile(buffer, file.name);

        if (parsed.length === 0) {
          setUploadMessage(t('settings.noLectures'));
          return;
        }

        setLectures(parsed);
        setUploadMessage(`${parsed.length} ${t('settings.parseSuccess')}`);
      } catch {
        setUploadMessage(t('settings.parseError'));
      }

      // Reset the file input so the same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setLectures, t]
  );

  const handleClear = useCallback(() => {
    clearLectures();
    setUploadMessage(null);
  }, [clearLectures]);

  return (
    <div className="space-y-6 px-4 py-4">
      <h1 className="text-lg font-bold text-foreground">{t('settings.title')}</h1>

      {/* My Group */}
      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-medium text-card-foreground">
              {t('settings.myGroup')}
            </h2>
            {group ? (
              <p className="mt-0.5 font-mono text-xs text-primary">
                {group.groupCode}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('settings.noGroup')}
              </p>
            )}
          </div>
          <Link
            href="/onboarding"
            className="flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            {t('settings.change')}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Upload Schedule */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-card-foreground">
              {t('settings.uploadSchedule')}
            </h2>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            {t('settings.uploadScheduleDesc')}
          </p>

          {allLectures.length > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">
                {allLectures.length} {t('settings.lecturesLoaded')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  <Upload className="h-3 w-3" />
                  {t('settings.change')}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-3 w-3" />
                  {t('settings.clearSchedule')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              {t('settings.uploadSchedule')}
            </button>
          )}

          {uploadMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{uploadMessage}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            aria-label={t('settings.uploadSchedule')}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
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
                  'mb-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  subscribed
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {subscribed ? t('notifications.disable') : t('notifications.enable')}
              </button>

              {subscribed && (
                <div>
                  <p className="mb-2 text-xs font-medium text-card-foreground">
                    {t('notifications.timing')}
                  </p>
                  <div className="space-y-2">
                    {[
                      { key: '1w', label: t('notifications.oneWeek') },
                      { key: '3d', label: t('notifications.threeDays') },
                      { key: '1d', label: t('notifications.oneDay') },
                      { key: '2h', label: t('notifications.twoHours') },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-xs text-foreground"
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
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
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

      {/* Gmail Integration */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-card-foreground">
              Gmail
            </h2>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            {t('gmail.description')}
          </p>

          {gmailConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {t('gmail.connected')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGmailConnected(false);
                  setGmailMessage(null);
                }}
                className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                {t('gmail.disconnect')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setGmailMessage(t('gmail.setupRequired'));
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              {t('gmail.connect')}
            </button>
          )}

          {gmailMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{gmailMessage}</p>
          )}
        </div>
      </section>

      {/* Language */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-card-foreground">
              {t('settings.language')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLang('ka')}
              className={cn(
                'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                lang === 'ka'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-muted-foreground/50'
              )}
            >
              ქართული
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all',
                lang === 'en'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-muted-foreground/50'
              )}
            >
              English
            </button>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <h2 className="mb-3 text-sm font-medium text-card-foreground">
            {t('settings.theme')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all',
                theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-muted-foreground/50'
              )}
            >
              <Sun className="h-4 w-4" />
              {t('settings.themeLight')}
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all',
                theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-muted-foreground/50'
              )}
            >
              <Moon className="h-4 w-4" />
              {t('settings.themeDark')}
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all',
                theme === 'system'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-muted-foreground/50'
              )}
            >
              <Monitor className="h-4 w-4" />
              {t('settings.themeSystem')}
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <h2 className="mb-3 text-sm font-medium text-card-foreground">
            {t('settings.about')}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">UniSchedule</span>
              <span className="text-xs text-muted-foreground">
                {t('settings.version')} 1.0.0
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
