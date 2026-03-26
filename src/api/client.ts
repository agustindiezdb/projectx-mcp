import fs from "fs";
import { AUTH_FILE } from "../auth/session";

const BASE_URL = "https://projectx.dualbootpartners.com/api/v1";

// ─── Cookie extraction from Playwright storage state ─────────────────────────

function getSessionCookie(): string {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(
      `auth/auth.json not found. Run 'npm run save-session' first.`
    );
  }

  const storage = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
  const cookies: Array<{ name: string; value: string }> = storage.cookies ?? [];

  const session = cookies.find((c) => c.name === "_interslice_session");
  if (!session) {
    throw new Error(
      `_interslice_session cookie not found in auth.json. Re-run 'npm run save-session'.`
    );
  }

  return `_interslice_session=${session.value}`;
}

// ─── Base request ─────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    accept: "*/*",
    "content-type": "application/json",
    "x-requested-with": "XMLHttpRequest",
    cookie: getSessionCookie(),
    Referer: "https://projectx.dualbootpartners.com/time-tracker",
  };

  console.error(`[api] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Session expired (HTTP ${response.status}). Re-run 'npm run save-session'.`
    );
  }

  if (response.status === 204 || response.status === 200 && response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse API response: ${text.substring(0, 200)}`);
  }
}
