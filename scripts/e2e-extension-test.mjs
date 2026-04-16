#!/usr/bin/env node
// E2E test for the EMIS extension redirect-back flow.
//
// Reproduces the user-reported failure mode:
//   /setup → click EMIS button → login to EMIS → *stuck on EMIS*
//
// Strategy: real Chromium + real unpacked extension, but with fake UniHub and
// fake EMIS served on localhost so we can simulate token capture without
// going through Google OAuth (which blocks automated browsers).
//
// The test validates the fixed code path:
//   1. webapp calls chrome.runtime.sendMessage(extId, SET_RETURN_URL) — works
//      immediately after install (no content-script injection dependency)
//   2. background.js stores returnToUniHub + returnUrl in chrome.storage.local
//   3. navigate to fake EMIS — which writes a JWT to localStorage
//   4. content.js polls, finds token, reads the flag, redirects back
//   5. we land on fake UniHub — fix confirmed

import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const EXT_SRC = path.join(REPO_ROOT, "extension");

const UNIHUB_PORT = 3333;
const EMIS_PORT = 4444;
const UNIHUB_ORIGIN = `http://localhost:${UNIHUB_PORT}`;
const EMIS_ORIGIN = `http://localhost:${EMIS_PORT}`;

// ── Setup: copy extension to temp dir with manifest patched for localhost ──
function prepareExtension() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "unihub-ext-test-"));
  // shallow copy
  for (const entry of fs.readdirSync(EXT_SRC, { withFileTypes: true })) {
    const src = path.join(EXT_SRC, entry.name);
    const dst = path.join(tmpDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true });
    } else {
      fs.copyFileSync(src, dst);
    }
  }
  const manifestPath = path.join(tmpDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  // content.js must also run on our fake EMIS origin
  for (const cs of manifest.content_scripts) {
    if (cs.js.includes("content.js")) {
      cs.matches.push(`${EMIS_ORIGIN}/*`);
    }
    if (cs.js.includes("sync.js")) {
      cs.matches.push(`${UNIHUB_ORIGIN}/*`);
    }
  }
  manifest.externally_connectable.matches.push(`${UNIHUB_ORIGIN}/*`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return tmpDir;
}

// ── Fake UniHub: serves test-setup.html ──
function startUniHubServer() {
  const html = `<!doctype html>
<html><head><title>Fake UniHub Setup</title></head>
<body>
<h1>UniHub /setup</h1>
<button id="go">EMIS-ზე გადასვლა</button>
<div id="status"></div>
<script>
  // Mirror of src/hooks/use-emis.ts navigateToEmis — verbatim direct-message path
  const EXTENSION_ID = window.__TEST_EXTENSION_ID;
  const EMIS_BASE = "${EMIS_ORIGIN}";

  function log(msg) {
    document.getElementById("status").textContent += msg + "\\n";
    console.log("[test]", msg);
  }

  async function setViaExtension(returnUrl) {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.sendMessage) return resolve(false);
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { type: "SET_RETURN_URL", returnUrl },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
              log("sendMessage error: " + (chrome.runtime.lastError?.message || "no ok"));
              return resolve(false);
            }
            resolve(true);
          }
        );
      } catch (e) { log("sendMessage throw: " + e.message); resolve(false); }
    });
  }

  document.getElementById("go").addEventListener("click", async () => {
    log("clicked");
    const returnUrl = window.location.href + "?returned=1";
    const ok = await setViaExtension(returnUrl);
    log("setViaExtension => " + ok);
    if (!ok) {
      window.__TEST_RESULT = "FAIL_SET_RETURN_URL";
      return;
    }
    window.__TEST_RESULT = "NAVIGATING";
    window.location.href = EMIS_BASE + "/login";
  });
</script>
</body></html>`;
  return http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(html);
  }).listen(UNIHUB_PORT);
}

// ── Fake EMIS: first page is "login", second simulates logged-in state ──
function startEmisServer() {
  // Minimal valid JWT: header.payload.signature
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    id: 12345,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1h future
  })).toString("base64url");
  const jwt = `${header}.${payload}.fake-signature`;

  return http.createServer((req, res) => {
    if (req.url === "/login") {
      // Simulates EMIS login page — button writes token and navigates to /dashboard
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`<!doctype html><html><body>
<h1>EMIS Login</h1>
<button id="login">Login (simulated)</button>
<script>
  document.getElementById("login").addEventListener("click", () => {
    localStorage.setItem("Student-Token", "${jwt}");
    window.location.href = "/dashboard";
  });
</script>
</body></html>`);
    } else if (req.url === "/dashboard") {
      // EMIS dashboard — token already in localStorage from previous page.
      // content.js (extension) should poll, find it, and redirect back to UniHub.
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`<!doctype html><html><body>
<h1>EMIS Dashboard</h1>
<p>You should be redirected back to UniHub shortly.</p>
<script>
  // Ensure token is present even on direct /dashboard loads
  if (!localStorage.getItem("Student-Token")) {
    localStorage.setItem("Student-Token", "${jwt}");
  }
</script>
</body></html>`);
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  }).listen(EMIS_PORT);
}

// ── Get the extension ID from the service worker ──
async function getExtensionId(context) {
  let [sw] = context.serviceWorkers();
  if (!sw) {
    sw = await context.waitForEvent("serviceworker", { timeout: 10000 });
  }
  // chrome-extension://<id>/background.js
  const m = sw.url().match(/chrome-extension:\/\/([^/]+)\//);
  if (!m) throw new Error("could not parse extension ID from " + sw.url());
  return m[1];
}

async function main() {
  console.log("▶ Preparing extension copy...");
  const extDir = prepareExtension();
  console.log("  extension dir:", extDir);

  console.log("▶ Starting fake servers...");
  const uniSrv = startUniHubServer();
  const emisSrv = startEmisServer();

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "unihub-chrome-profile-"));
  console.log("  profile dir:", userDataDir);

  console.log("▶ Launching Chromium with extension loaded...");
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // extensions require headful (or headless=new)
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  let testResult = { passed: false, reason: "unknown" };
  try {
    const extId = await getExtensionId(context);
    console.log("  extension ID:", extId);

    const page = await context.newPage();
    page.on("console", (msg) => console.log("  [page]", msg.text()));
    await page.addInitScript((id) => { window.__TEST_EXTENSION_ID = id; }, extId);

    console.log("▶ Opening fake UniHub /setup...");
    await page.goto(`${UNIHUB_ORIGIN}/`);

    console.log("▶ Clicking EMIS button (triggers SET_RETURN_URL + navigate)...");
    const navPromise = page.waitForURL(`${EMIS_ORIGIN}/login`, { timeout: 5000 });
    await page.click("#go");
    await navPromise;
    console.log("  now on:", page.url());

    console.log("▶ Simulating EMIS login (writes JWT, navigates to dashboard)...");
    const dashPromise = page.waitForURL(`${EMIS_ORIGIN}/dashboard`, { timeout: 5000 });
    await page.click("#login");
    await dashPromise;
    console.log("  now on:", page.url());

    console.log("▶ Waiting for content.js to capture token and redirect back...");
    // content.js polls every 2s. Give it up to 15s.
    await page.waitForURL(new RegExp(`^${UNIHUB_ORIGIN}/.*returned=1`), { timeout: 15000 });
    console.log("  redirected to:", page.url());

    testResult = { passed: true, reason: "redirected to UniHub with returned=1 flag" };
  } catch (err) {
    testResult = { passed: false, reason: err.message };
  } finally {
    await context.close();
    uniSrv.close();
    emisSrv.close();
    fs.rmSync(extDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  console.log("\n" + "═".repeat(60));
  if (testResult.passed) {
    console.log("✓ TEST PASSED —", testResult.reason);
    process.exit(0);
  } else {
    console.log("✗ TEST FAILED —", testResult.reason);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
