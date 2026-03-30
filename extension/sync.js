// UniHub EMIS Connector — Sync Script
// Runs on UniHub pages to push captured EMIS token to the webapp API

function syncTokenToApi() {
  chrome.storage.local.get(["emisToken", "emisConnected"], async (data) => {
    if (!data.emisToken || !data.emisConnected) return;

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
