'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AnimatedGradientBackground } from '@/components/auth/animated-gradient-background';
import { GoogleIcon } from '@/components/auth/google-icon';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  function handleSignIn() {
    setLoading(true);
    signIn('google', { callbackUrl: '/' });
  }

  return (
    <main className="fixed inset-0 flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 z-10">
      {/* Animated Gradient Background */}
      <AnimatedGradientBackground />

      {/* Overlay for card contrast */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20 dark:from-transparent dark:via-background/10 dark:to-background/30"
        aria-hidden="true"
      />

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm transition-all hover:bg-background/80 dark:bg-card/50 dark:hover:bg-card/80"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border-0 bg-card/80 px-8 py-10 shadow-2xl shadow-primary/10 backdrop-blur-xl dark:bg-card/60 dark:shadow-primary/5 md:px-12 md:py-14">
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/icons/icon-512.png"
              alt="UniHub"
              className="mb-6 h-16 w-16 rounded-2xl"
            />

            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              UniHub
            </h1>

            <p className="mt-2 text-lg text-muted-foreground">
              სტუდენტის პორტალი
            </p>
          </div>

          {/* Spacer */}
          <div className="my-8" />

          {/* Sign in Button */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-4 text-base font-medium shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-secondary dark:hover:bg-secondary/80"
          >
            <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="text-foreground">
              {loading ? 'იტვირთება...' : 'Google-ით შესვლა'}
            </span>
          </button>

          {/* Email Restriction */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            მხოლოდ{' '}
            <span className="font-medium text-foreground">@agruni.edu.ge</span>{' '}
            ელ-ფოსტა
          </p>

          {/* University name */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/70">
              საქართველოს აგრარული უნივერსიტეტი
            </p>
          </div>
        </div>
      </div>

      {/* Decorative blurs */}
      <div
        className="pointer-events-none fixed left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl dark:bg-accent/5"
        aria-hidden="true"
      />
    </main>
  );
}
