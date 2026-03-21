"use client";

import { useState, useCallback } from "react";

// Chrome Web Store extension ID (public, not a secret)
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || "nfgfmkhppofmeldahpogllefejbkeoij";

interface EmisStatus {
  connected: boolean;
  lastSync: string | null;
}

/**
 * Hook to interact with the UniHub EMIS Chrome Extension.
 * Flow: Extension captures EMIS token → webapp reads it → sends to API → stored in httpOnly cookie.
 *
 * Token refresh: when a proxy call returns 401, the hook:
 * 1. Deletes the stale cookie
 * 2. Opens EMIS in a new tab (Google OAuth auto-logs in)
 * 3. Extension captures fresh token
 * 4. When user returns, auto-syncs on next call
 */
export function useEmis() {
  const [status, setStatus] = useState<EmisStatus>({ connected: false, lastSync: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExtension = typeof chrome !== "undefined" && chrome.runtime?.sendMessage;

  /**
   * Check if the extension is installed and has a token.
   */
  const checkExtension = useCallback(async (): Promise<boolean> => {
    if (!EXTENSION_ID || !hasExtension) return false;

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GET_EMIS_TOKEN" },
          (response) => {
            if (chrome.runtime.lastError || !response) {
              resolve(false);
              return;
            }
            setStatus({
              connected: response.connected,
              lastSync: response.lastSync,
            });
            resolve(response.connected);
          }
        );
      } catch {
        resolve(false);
      }
    });
  }, [hasExtension]);

  /**
   * Request token from extension and send to our API.
   */
  const syncToken = useCallback(async (): Promise<boolean> => {
    if (!EXTENSION_ID || !hasExtension) {
      setError("Chrome გაფართოება ვერ მოიძებნა");
      return false;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GET_EMIS_TOKEN" },
          async (response) => {
            if (chrome.runtime.lastError || !response?.token) {
              setError("EMIS-თან კავშირი ვერ მოიძებნა. გახსენით emis.campus.edu.ge და შედით სისტემაში.");
              setLoading(false);
              resolve(false);
              return;
            }

            try {
              const res = await fetch("/api/emis/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.token }),
              });

              if (res.ok) {
                setStatus({ connected: true, lastSync: new Date().toISOString() });
                setLoading(false);
                resolve(true);
              } else {
                setError("კავშირის შენახვა ვერ მოხერხდა");
                setLoading(false);
                resolve(false);
              }
            } catch {
              setError("სერვერთან კავშირის შეცდომა");
              setLoading(false);
              resolve(false);
            }
          }
        );
      } catch {
        setError("გაფართოებასთან კავშირის შეცდომა");
        setLoading(false);
        resolve(false);
      }
    });
  }, [hasExtension]);

  /**
   * Try to silently refresh the token from the extension.
   * Returns true if a fresh token was saved.
   */
  const trySilentRefresh = useCallback(async (): Promise<boolean> => {
    if (!EXTENSION_ID || !hasExtension) return false;

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "GET_EMIS_TOKEN" },
          async (response) => {
            if (chrome.runtime.lastError || !response?.token) {
              resolve(false);
              return;
            }

            try {
              const res = await fetch("/api/emis/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.token }),
              });
              resolve(res.ok);
            } catch {
              resolve(false);
            }
          }
        );
      } catch {
        resolve(false);
      }
    });
  }, [hasExtension]);

  /**
   * Call an EMIS API endpoint through our proxy.
   * On 401 (expired token): tries silent refresh from extension, then retries once.
   * On 403 (no token): throws so caller can show setup prompt.
   */
  const callEmis = useCallback(async (endpoint: string, body?: object) => {
    const doCall = async () => {
      const res = await fetch("/api/emis/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, method: body ? "POST" : "GET", body }),
      });
      return res;
    };

    let res = await doCall();

    // Token expired — try silent refresh from extension and retry
    if (res.status === 401) {
      // Delete stale cookie
      await fetch("/api/emis/token", { method: "DELETE" }).catch(() => {});

      // Try to get fresh token from extension
      const refreshed = await trySilentRefresh();
      if (refreshed) {
        // Retry the original call
        res = await doCall();
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));

      // If still 401 after refresh attempt, prompt user to visit EMIS
      if (res.status === 401) {
        setError("EMIS სესია ამოიწურა. გახსენით emis.campus.edu.ge თავიდან შესასვლელად.");
        setStatus({ connected: false, lastSync: null });
      }

      throw new Error(err.error || `EMIS error ${res.status}`);
    }

    return res.json();
  }, [trySilentRefresh]);

  return {
    status,
    loading,
    error,
    hasExtension: !!hasExtension && !!EXTENSION_ID,
    checkExtension,
    syncToken,
    callEmis,
  };
}
