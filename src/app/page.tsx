"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function UniHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" className="fill-primary" />
      <path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" className="fill-primary/80" />
      <path d="M17 16V28C17 31.866 20.134 35 24 35C27.866 35 31 31.866 31 28V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle cx="24" cy="14" r="2" className="fill-accent" />
    </svg>
  );
}

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="absolute top-6 right-6 text-foreground/70 hover:text-foreground hover:bg-foreground/5"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {mounted ? (
        resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />
      ) : (
        <span className="size-5" />
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full animate-[spin_30s_linear_infinite] opacity-40 dark:opacity-25">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/50 via-primary/30 to-transparent blur-3xl" />
        </div>
        <div className="absolute -bottom-1/4 -right-1/4 h-full w-full animate-[spin_35s_linear_infinite_reverse] opacity-35 dark:opacity-20">
          <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent/50 via-accent/20 to-transparent blur-3xl" />
        </div>
        <div className="absolute top-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
      </div>

      <ThemeToggle />

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl dark:bg-card/60 dark:shadow-primary/10 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-3">
              <UniHubLogo className="size-12" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">UniHub</h1>
            </div>
            <p className="text-lg text-muted-foreground">სტუდენტის პორტალი</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="h-12 w-full gap-3 rounded-xl bg-foreground text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="size-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                <>
                  <GoogleIcon className="size-5" />
                  <span className="font-medium">Google-ით შესვლა</span>
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              მხოლოდ{" "}
              <span className="font-medium text-foreground/80">@agruni.edu.ge</span>{" "}
              ელ-ფოსტა
            </p>
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground/60">AGRUNI</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            საქართველოს აგრარული უნივერსიტეტი
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/40">
          <div className="h-1 w-1 rounded-full bg-current" />
          <div className="h-1 w-1 rounded-full bg-current" />
          <div className="h-1 w-1 rounded-full bg-current" />
        </div>
      </div>
    </main>
  );
}
