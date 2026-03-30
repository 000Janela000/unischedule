"use client";

import { useState, useCallback } from "react";

// Chrome Web Store extension ID (public, same as in store URL)
const EXTENSION_ID = "fhogblehhkpclmeoflmjpjcfldpmnlpa";
const EMIS_BASE = "https://emis.campus.edu.ge";
const TOKEN_STORAGE_KEY = "emis_token";

/** Check if JWT token is still valid (not expired) */
export function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true; // No expiry = valid
    // Token valid if expires more than 5 minutes from now
    return payload.exp * 1000 > Date.now() + 5 * 60 * 1000;
  } catch {
    return false;
  }
}

/** Navigate to EMIS for authentication, with auto-return to UniHub after token capture */
export async function navigateToEmis(returnUrl: string): Promise<void> {
  if (typeof window === "undefined") return;

  return new Promise((resolve) => {
    // Listen for sync.js acknowledgment
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "UNIHUB_EMIS_READY") {
        window.removeEventListener("message", handleMessage);
        clearTimeout(timeout);
        // Flag is set, safe to navigate
        setTimeout(() => {
          window.location.href = EMIS_BASE;
          resolve();
        }, 100);
      }
    };

    window.addEventListener("message", handleMessage);

    // Timeout: if no acknowledgment within 400ms, navigate anyway
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      window.location.href = EMIS_BASE;
      resolve();
    }, 400);

    // Send navigation intent to sync.js
    window.postMessage({ type: "UNIHUB_NAVIGATE_EMIS", returnUrl }, "*");
  });
}

interface EmisStatus {
  connected: boolean;
  lastSync: string | null;
}

/** Save EMIS token to localStorage for direct browser calls */
function saveToken(token: string) {
  try { localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch {}
}

/** Get EMIS token: try localStorage first, then extension */
async function getEmisToken(): Promise<string | null> {
  // Try localStorage first (fastest, works without extension)
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) return stored;
  } catch {}

  // Try extension
  if (!EXTENSION_ID || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GET_EMIS_TOKEN" },
        (response) => {
          if (chrome.runtime.lastError || !response?.token) {
            resolve(null);
            return;
          }
          // Cache for future direct calls
          saveToken(response.token);
          resolve(response.token);
        }
      );
    } catch {
      resolve(null);
    }
  });
}

/** Check token validity without modifying state — returns true if valid */
export function checkTokenValidity(): boolean {
  return isTokenValid();
}

export function useEmis() {
  const [status, setStatus] = useState<EmisStatus>({ connected: false, lastSync: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExtension = typeof chrome !== "undefined" && chrome.runtime?.sendMessage;

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
              // Save to localStorage for direct browser calls
              saveToken(response.token);

              // Also save to server cookie (for connection status checks)
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
   * Call an EMIS API endpoint directly from the browser.
   * EMIS has Access-Control-Allow-Origin: * so CORS is fine.
   * Auto-injects studentId from JWT when not provided in body.
   */
  const callEmis = useCallback(async (endpoint: string, body?: object) => {
    const token = await getEmisToken();

    if (!token) {
      setStatus({ connected: false, lastSync: null });
      throw new Error("EMIS not connected");
    }

    // Extract studentId from JWT for endpoints that need it
    let resolvedBody = body !== undefined ? { ...body } : undefined;
    if (resolvedBody && !("studentId" in resolvedBody && (resolvedBody as Record<string, unknown>).studentId)) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.id) {
          (resolvedBody as Record<string, unknown>).studentId = payload.id;
        }
      } catch {}
    }

    // Direct browser call to EMIS
    const emisUrl = `${EMIS_BASE}${endpoint}`;
    const method = resolvedBody !== undefined ? "POST" : "GET";
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (method === "POST") {
      fetchOptions.body = JSON.stringify(resolvedBody || {});
    }

    const res = await fetch(emisUrl, fetchOptions);

    if (!res.ok) {
      if (res.status === 401) {
        setError("EMIS სესია ამოიწურა. გახსენით emis.campus.edu.ge თავიდან შესასვლელად.");
        setStatus({ connected: false, lastSync: null });
      }
      throw new Error(`EMIS error ${res.status}`);
    }

    return res.json();
  }, []);

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
