"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Chrome, ExternalLink } from "lucide-react";
import Link from "next/link";
import { navigateToEmis, useEmis } from "@/hooks/use-emis";

const EXTENSION_ID = "fhogblehhkpclmeoflmjpjcfldpmnlpa";

type State = "connected" | "extension-missing" | "session-expired";

/** Ping the extension. Resolves true iff it's installed and reachable. */
function pingExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      resolve(false);
      return;
    }
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GET_EMIS_TOKEN" },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            resolve(false);
            return;
          }
          resolve(true);
        }
      );
    } catch {
      resolve(false);
    }
  });
}

export function ExtensionBanner() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>("connected");
  const { syncToken } = useEmis();

  const checkConnection = useCallback(async () => {
    try {
      const r = await fetch("/api/emis/token");
      const d = await r.json();
      if (d.connected) {
        setState("connected");
        setVisible(false);
        return;
      }
      // Not connected — figure out *why* so we ask the user for the right thing.
      const hasExtension = await pingExtension();
      if (!hasExtension) {
        setState("extension-missing");
        setVisible(true);
        return;
      }
      // Extension is installed — try to sync. This covers the race where
      // sync.js hasn't posted the token yet (our GET just lost to its POST).
      // If the extension has no valid token, it'll be a genuine session-expired.
      const synced = await syncToken();
      if (synced) {
        setState("connected");
        setVisible(false);
      } else {
        setState("session-expired");
        setVisible(true);
      }
    } catch {
      setState("extension-missing");
      setVisible(true);
    }
  }, [syncToken]);

  useEffect(() => {
    checkConnection();

    // Re-check when user returns to UniHub tab (after visiting EMIS)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkConnection();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [checkConnection]);

  if (state === "connected" || !visible) return null;

  return (
    <div className="relative flex items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
      <Chrome className="size-4 flex-shrink-0 text-primary" />
      <p className="flex-1 text-foreground/80">
        {state === "session-expired" ? (
          <>
            EMIS სესია ამოიწურა.{" "}
            <button
              onClick={() => navigateToEmis(window.location.href)}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              EMIS-ზე თავიდან შესვლა <ExternalLink className="size-3" />
            </button>
          </>
        ) : (
          <>
            <Link href="/setup" className="font-medium text-primary hover:underline">
              Chrome გაფართოების
            </Link>
            {" "}დაყენებით მიიღეთ ნიშნები, GPA და სრული ფუნქციონალი
          </>
        )}
      </p>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
