"use client";

import { useState, useEffect } from "react";
import { Chrome, GraduationCap, BarChart3, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage";
import { useRouter } from "next/navigation";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function ExtensionModal() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/emis/token");
        const d = await r.json();
        if (d.connected) return;

        // If the extension is already installed, don't push the "install it"
        // modal — the inline "EMIS-ზე შესვლა" CTAs handle re-auth.
        const EXTENSION_ID = "fhogblehhkpclmeoflmjpjcfldpmnlpa";
        const hasExtension = await new Promise<boolean>((resolve) => {
          if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
            resolve(false);
            return;
          }
          try {
            chrome.runtime.sendMessage(
              EXTENSION_ID,
              { type: "GET_EMIS_TOKEN" },
              (response) => {
                resolve(!chrome.runtime.lastError && !!response);
              }
            );
          } catch {
            resolve(false);
          }
        });
        if (hasExtension) return;

        // Check skip timestamp
        const lastSkip = getItem<number>(STORAGE_KEYS.MODAL_SKIP, 0);
        if (Date.now() - lastSkip < SEVEN_DAYS) return;

        setShow(true);
      } catch {}
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  function handleSkip() {
    setItem(STORAGE_KEYS.MODAL_SKIP, Date.now());
    setShow(false);
  }

  function handleSetup() {
    setShow(false);
    router.push("/setup");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="mb-6 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Chrome className="size-8 text-primary" />
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-foreground">
          გახსენით UniHub-ის სრული პოტენციალი
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Chrome გაფართოების დაყენებით მიიღებთ:
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <GraduationCap className="size-5 flex-shrink-0 text-primary" />
            <span className="text-sm text-foreground">ნიშნები და GPA რეალურ დროში</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <BarChart3 className="size-5 flex-shrink-0 text-primary" />
            <span className="text-sm text-foreground">კრედიტების პროგრესი და ფინანსები</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <BookOpen className="size-5 flex-shrink-0 text-primary" />
            <span className="text-sm text-foreground">რეგისტრირებული საგნების ზუსტი ჩვენება</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleSetup} className="w-full gap-2">
            <Chrome className="size-4" />
            გაფართოების დაყენება
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
            გამოტოვება — მოგვიანებით
          </Button>
        </div>
      </div>
    </div>
  );
}
