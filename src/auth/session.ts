import { chromium } from "playwright";
import path from "path";
import os from "os";
import fs from "fs";
import { getCurrentUser } from "../api/projectx";

export const AUTH_FILE = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "projectx-mcp",
  "auth.json"
);
const LOGIN_URL = "https://projectx.dualbootpartners.com";

export async function hasValidSession(): Promise<boolean> {
  if (!fs.existsSync(AUTH_FILE)) return false;
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function runLoginFlow(): Promise<void> {
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.error("[auth] opening browser — log in with your Google account");

  // Use system Chrome (no Playwright browser download needed)
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });

  // Auto-detect login: wait until _interslice_session is valid (authenticated, not anonymous)
  while (true) {
    await page.waitForTimeout(1500);
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "_interslice_session");
    if (!sessionCookie) continue;

    try {
      const res = await fetch("https://projectx.dualbootpartners.com/api/v1/current_user", {
        headers: { cookie: `_interslice_session=${sessionCookie.value}` },
      });
      if (res.ok) break;
    } catch {
      // keep polling
    }
  }

  await context.storageState({ path: AUTH_FILE });
  console.error("[auth] session saved — browser closing");
  await browser.close();
}

export async function ensureValidSession(): Promise<void> {
  if (await hasValidSession()) return;
  await runLoginFlow();
}
