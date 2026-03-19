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
    <main
      className="fixed inset-0 flex items-center justify-center overflow-hidden px-4 py-8"
      style={{ background: 'linear-gradient(135deg, rgb(30,27,75), rgb(49,46,129), rgb(76,29,149))' }}
    >
      {/* Canvas replaces the CSS gradient once loaded */}
      <AnimatedGradientBackground />

      {/* Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-black/5 to-black/10"
        aria-hidden="true"
      />

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="fixed right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 text-white/80 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 text-white/80 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl bg-white/80 px-8 py-10 shadow-2xl shadow-black/10 backdrop-blur-xl dark:bg-white/10 dark:shadow-black/20 md:px-12 md:py-14">
          {/* Logo */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/icons/icon-512.png"
              alt="UniHub"
              className="mb-6 h-16 w-16 rounded-2xl"
            />

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
              UniHub
            </h1>

            <p className="mt-2 text-lg text-gray-500 dark:text-gray-300">
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
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-base font-medium shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="text-gray-900 dark:text-white">
              {loading ? 'იტვირთება...' : 'Google-ით შესვლა'}
            </span>
          </button>

          {/* Email Restriction */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-300">
            მხოლოდ{' '}
            <span className="font-medium text-gray-900 dark:text-white">@agruni.edu.ge</span>{' '}
            ელ-ფოსტა
          </p>

          {/* University name */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              საქართველოს აგრარული უნივერსიტეტი
            </p>
          </div>
        </div>
      </div>

      {/* Decorative blurs */}
      <div className="pointer-events-none fixed left-1/4 top-1/4 z-[1] h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 z-[1] h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" aria-hidden="true" />
    </main>
  );
}
