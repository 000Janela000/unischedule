"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Puzzle, Globe, CheckCircle2, ExternalLink, Loader2, Check, AlertCircle } from "lucide-react";
import { useEmis } from "@/hooks/use-emis";

export default function ExtensionSetupPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { status, loading, error, syncToken } = useEmis();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Also check server-side connection on mount
  const [serverConnected, setServerConnected] = useState(false);
  useEffect(() => {
    fetch("/api/emis/token")
      .then((r) => r.json())
      .then((d) => { if (d.connected) setServerConnected(true); })
      .catch(() => {});
  }, []);

  const isConnected = status.connected || serverConnected;

  const handleSync = async () => {
    const ok = await syncToken();
    if (ok) {
      setServerConnected(true);
    }
  };

  const steps = [
    {
      icon: Puzzle,
      title: "გაფართოების დაყენება",
      description: "დააინსტალირეთ UniHub Chrome გაფართოება",
      action: (
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors">
          Chrome Web Store
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      icon: Globe,
      title: "EMIS-ზე შესვლა",
      description: "გადადით emis.campus.edu.ge — ავტომატურად შეხვალთ",
      action: (
        <a href="https://emis.campus.edu.ge" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors">
          EMIS გახსნა
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      icon: CheckCircle2,
      title: "სინქრონიზაცია",
      description: "დააჭირეთ ქვემოთ — მონაცემები ავტომატურად წამოიღება",
      action: null,
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] animate-[spin_30s_linear_infinite] rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] animate-[spin_25s_linear_infinite_reverse] rounded-full bg-gradient-to-l from-accent/20 via-primary/20 to-accent/10 blur-3xl" />
      </div>

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/80"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      )}

      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Puzzle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">EMIS-თან დაკავშირება</h1>
            <p className="mt-2 text-muted-foreground">გაფართოება კითხულობს თქვენს მონაცემებს უნივერსიტეტის სისტემიდან</p>
          </div>

          <div className="space-y-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative">
                  {!isLast && <div className="absolute left-6 top-14 h-[calc(100%-2rem)] w-px bg-border/50" />}
                  <div className="flex gap-4 rounded-xl p-4 transition-colors hover:bg-secondary/30">
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${isConnected ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {isConnected ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{index + 1}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                      {step.action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            {/* Status */}
            <div className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm ${isConnected ? "bg-accent/10 text-accent" : "bg-secondary/50 text-muted-foreground"}`}>
              {isConnected ? (
                <><CheckCircle2 className="h-4 w-4" /><span>EMIS დაკავშირებულია</span></>
              ) : (
                <><div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" /><span>მოლოდინი...</span></>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action */}
            {isConnected ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full gap-2 py-6 text-base font-medium shadow-lg shadow-primary/20"
              >
                გაგრძელება <CheckCircle2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSync}
                disabled={loading}
                className="w-full gap-2 py-6 text-base font-medium shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />მოწმდება...</>
                ) : (
                  <>სინქრონიზაცია<CheckCircle2 className="h-4 w-4" /></>
                )}
              </Button>
            )}

            {/* Skip option */}
            {!isConnected && (
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                გამოტოვება — მოგვიანებით დავაკავშირებ
              </button>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground/60">საქართველოს აგრარული უნივერსიტეტი</p>
      </div>
    </div>
  );
}
