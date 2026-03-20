"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  GraduationCap,
  Settings,
  MoreHorizontal,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "მთავარი", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "ცხრილი", icon: Calendar },
  { href: "/dashboard/exams", label: "გამოცდები", icon: FileText },
  { href: "/dashboard/grades", label: "ნიშნები", icon: GraduationCap },
  { href: "/dashboard/settings", label: "პარამეტრები", icon: Settings },
];

const mobileMainNav = navItems.slice(0, 3);
const mobileMoreNav = navItems.slice(3);

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
      suppressHydrationWarning
    >
      <Sun className="size-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <svg className="size-9" viewBox="0 0 48 48" fill="none">
          <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" className="fill-primary" />
          <path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" className="fill-primary/80" />
          <path d="M17 16V28C17 31.866 20.134 35 24 35C27.866 35 31 31.866 31 28V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="stroke-primary-foreground" />
          <circle cx="24" cy="14" r="2" className="fill-accent" />
        </svg>
        <span className="text-xl font-semibold text-foreground">UniHub</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background lg:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileMainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <MoreHorizontal className="size-5" />
          მეტი
        </button>
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="space-y-2 py-4">
              {mobileMoreNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm text-muted-foreground">თემა</span>
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="pb-20 lg:pl-60 lg:pb-0">{children}</main>
    </div>
  );
}
