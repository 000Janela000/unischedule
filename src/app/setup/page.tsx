"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Puzzle, Globe, CheckCircle2, ExternalLink, Loader2, Check } from "lucide-react";

export default function ExtensionSetupPage() {
  const [mounted, setMounted] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const handleConfirmInstalled = () => {
    setIsChecking(true);
    setTimeout(() => {
      setExtensionInstalled(true);
      setIsChecking(false);
    }, 1500);
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
      title: "დაბრუნება UniHub-ზე",
      description: "თქვენი მონაცემები ავტომატურად სინქრონიზდება",
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
              const isCompleted = extensionInstalled;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative">
                  {!isLast && <div className="absolute left-6 top-14 h-[calc(100%-2rem)] w-px bg-border/50" />}
                  <div className="flex gap-4 rounded-xl p-4 transition-colors hover:bg-secondary/30">
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${isCompleted ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
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
            <div className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm ${extensionInstalled ? "bg-accent/10 text-accent" : "bg-secondary/50 text-muted-foreground"}`}>
              {extensionInstalled ? (
                <><CheckCircle2 className="h-4 w-4" /><span>გაფართოება დაკავშირებულია</span></>
              ) : (
                <><div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" /><span>გაფართოების მოლოდინი...</span></>
              )}
            </div>

            {extensionInstalled ? (
              <a href="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                გაგრძელება <CheckCircle2 className="h-4 w-4" />
              </a>
            ) : (
              <Button onClick={handleConfirmInstalled} disabled={isChecking} className="w-full gap-2 py-6 text-base font-medium shadow-lg shadow-primary/20 disabled:opacity-70">
                {isChecking ? (<><Loader2 className="h-4 w-4 animate-spin" />მოწმდება...</>) : (<>გაფართოება დაინსტალირებულია<CheckCircle2 className="h-4 w-4" /></>)}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground/60">საქართველოს აგრარული უნივერსიტეტი</p>
      </div>
    </div>
  );
}
