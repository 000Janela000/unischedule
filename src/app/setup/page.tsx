"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Puzzle, Globe, CheckCircle2, ExternalLink, Loader2, Check } from "lucide-react";

export default function ExtensionSetupPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Check server-side connection (extension POSTs token directly to API)
  const checkConnection = useCallback(async () => {
    try {
      const r = await fetch("/api/emis/token");
      const d = await r.json();
      if (d.connected) {
        setConnected(true);
        return true;
      }
    } catch {}
    return false;
  }, []);

  // Check on mount
  useEffect(() => { checkConnection(); }, [checkConnection]);

  // Poll every 3s while not connected (extension will POST token from EMIS tab)
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(async () => {
      const ok = await checkConnection();
      if (ok) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [connected, checkConnection]);

  // Manual check button
  const handleCheck = async () => {
    setChecking(true);
    await checkConnection();
    setChecking(false);
  };

  const steps = [
    {
      icon: Puzzle,
      title: "გაფართოების დაყენება",
      description: "დააინსტალირეთ UniHub Chrome გაფართოება",
      action: (
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors">
          Chrome Web Store
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      icon: Globe,
      title: "EMIS-ზე შესვლა",
      description: "გახსენით EMIS — გაფართოება ავტომატურად წამოიღებს მონაცემებს",
      action: (
        <a href="https://emis.campus.edu.ge" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm font-medium hover:bg-secondary transition-colors">
          EMIS გახსნა
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      icon: CheckCircle2,
      title: "ავტომატური სინქრონიზაცია",
      description: "EMIS-ზე შესვლის შემდეგ კავშირი ავტომატურად დამყარდება",
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
        <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl md:p-8">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">EMIS-თან დაკავშირება</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">გაფართოება კითხულობს თქვენს მონაცემებს უნივერსიტეტის სისტემიდან</p>
          </div>

          <div className="space-y-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative">
                  {!isLast && <div className="absolute left-5 top-12 h-[calc(100%-1.5rem)] w-px bg-border/50" />}
                  <div className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/30">
                    <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${connected ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {connected ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                      {step.action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {/* Status */}
            <div className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm ${connected ? "bg-accent/10 text-accent" : "bg-secondary/50 text-muted-foreground"}`}>
              {connected ? (
                <><CheckCircle2 className="h-4 w-4" /><span>EMIS დაკავშირებულია</span></>
              ) : (
                <><div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" /><span>მოლოდინი... ავტომატურად შემოწმდება</span></>
              )}
            </div>

            {/* Action */}
            {connected ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full gap-2 py-6 text-base font-medium shadow-lg shadow-primary/20"
              >
                გაგრძელება <CheckCircle2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCheck}
                disabled={checking}
                variant="outline"
                className="w-full gap-2 py-6 text-base font-medium"
              >
                {checking ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />მოწმდება...</>
                ) : (
                  <>შემოწმება<CheckCircle2 className="h-4 w-4" /></>
                )}
              </Button>
            )}

            {/* Skip option */}
            {!connected && (
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
