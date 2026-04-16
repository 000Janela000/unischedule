// UniHub EMIS Connector — Background Service Worker
// Handles messages from UniHub webapp requesting the EMIS token

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    // Consider expired if less than 5 minutes remaining
    return payload.exp * 1000 < Date.now() + 5 * 60 * 1000;
  } catch {
    return false;
  }
}

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "GET_EMIS_TOKEN") {
      chrome.storage.local.get(["emisToken", "emisConnected", "lastSync"], (data) => {
        const token = data.emisToken || null;
        const expired = token ? isTokenExpired(token) : false;

        sendResponse({
          token: expired ? null : token,
          connected: !!data.emisConnected && !expired,
          lastSync: data.lastSync || null,
          expired,
        });
      });
      return true; // Keep channel open for async response
    }

    if (message.type === "CLEAR_EMIS_TOKEN") {
      chrome.storage.local.remove(["emisToken", "emisConnected", "lastSync"], () => {
        sendResponse({ ok: true });
      });
      return true;
    }

    if (message.type === "SET_RETURN_URL") {
      chrome.storage.local.set(
        { returnToUniHub: true, returnUrl: message.returnUrl || null },
        () => sendResponse({ ok: true })
      );
      return true;
    }
  }
);
