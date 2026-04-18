// UniHub EMIS Connector — Sync Script
// Runs on UniHub pages to push captured EMIS token to the webapp API

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function purgeStoredToken() {
  chrome.storage.local.remove([
    "emisToken",
    "emisConnected",
    "lastSync",
    "tokenSyncedToApi",
  ]);
  try { localStorage.removeItem("emis_token"); } catch {}
  // Best-effort: also evict the server cookie
  try {
    fetch("/api/emis/token", { method: "DELETE" });
  } catch {}
}

function syncTokenToApi() {
  chrome.storage.local.get(["emisToken", "emisConnected"], async (data) => {
    if (!data.emisToken || !data.emisConnected) return;

    // Don't propagate an expired token — it would fail every EMIS call silently
    // and mask the real problem ("disconnected" looks like "connected but broken").
    if (isTokenExpired(data.emisToken)) {
      console.log("[UniHub Extension] Stored token expired — purging");
      purgeStoredToken();
      return;
    }

    // Save to localStorage for direct browser EMIS calls
    try {
      localStorage.setItem("emis_token", data.emisToken);
    } catch {}

    try {
      const res = await fetch("/api/emis/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.emisToken }),
      });

      if (res.ok) {
        console.log("[UniHub Extension] Token synced to API");
        chrome.storage.local.set({ tokenSyncedToApi: true });
      } else if (res.status === 400) {
        // Server also thinks it's expired/invalid — trust it and purge
        const body = await res.json().catch(() => null);
        if (body?.error === "token_expired") {
          console.log("[UniHub Extension] Server rejected expired token — purging");
          purgeStoredToken();
        }
      }
    } catch (err) {
      console.log("[UniHub Extension] API sync failed, will retry", err);
    }
  });
}

// Sync on load
syncTokenToApi();

// Sync when storage changes (token captured while UniHub is open)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.emisToken || changes.emisConnected) {
    syncTokenToApi();
  }
});

// Listen for navigation intent from setup page
// Setup page sends postMessage before redirecting to EMIS
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "UNIHUB_NAVIGATE_EMIS") {
    chrome.storage.local.set({
      returnToUniHub: true,
      returnUrl: event.data.returnUrl || window.location.origin + "/setup",
    }, () => {
      // Acknowledge to the page that flag was set
      window.postMessage({ type: "UNIHUB_EMIS_READY" }, "*");
    });
  }
});
