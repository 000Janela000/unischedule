// UniHub EMIS Connector — Content Script
// Runs on emis.campus.edu.ge pages
// Reads login data from EMIS and stores securely

const CHECK_INTERVAL = 2000;
const MAX_ATTEMPTS = 30;

let attempts = 0;
let alreadyCaptured = false;

function isValidJwt(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
}

function getToken() {
  try {
    return localStorage.getItem("Student-Token");
  } catch {
    return null;
  }
}

function captureAndSync(token) {
  if (alreadyCaptured) return;
  alreadyCaptured = true;

  chrome.storage.local.set({
    emisToken: token,
    emisConnected: true,
    lastSync: new Date().toISOString(),
  }, () => {
    console.log("[UniHub] EMIS data synced to extension storage");

    // If user came from UniHub, redirect back
    chrome.storage.local.get(["returnToUniHub", "returnUrl"], (data) => {
      if (data.returnToUniHub && data.returnUrl) {
        chrome.storage.local.remove(["returnToUniHub", "returnUrl"]);
        window.location.href = data.returnUrl;
      }
    });
  });
}

function checkAndCapture() {
  if (attempts >= MAX_ATTEMPTS) return;
  attempts++;

  const token = getToken();
  if (token && isValidJwt(token)) {
    captureAndSync(token);
  } else if (attempts < MAX_ATTEMPTS) {
    setTimeout(checkAndCapture, CHECK_INTERVAL);
  }
}

// Start checking
checkAndCapture();

// Listen for storage changes (user logs in while page is open)
window.addEventListener("storage", (e) => {
  if (e.key === "Student-Token" && e.newValue && isValidJwt(e.newValue)) {
    captureAndSync(e.newValue);
  }
});

// Re-check when user returns to this EMIS tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const token = getToken();
    if (token && isValidJwt(token)) {
      captureAndSync(token);
    }
  }
});
