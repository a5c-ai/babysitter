import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

export const dynamic = "force-dynamic";

function detectVersion(command: string): string {
  try {
    const raw = execSync(command, { encoding: "utf-8", timeout: 3000 }).trim();
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : raw || "N/A";
  } catch {
    return "N/A";
  }
}

function getAppVersion(): string {
  try {
    const pkgPath = resolve(__dirname, "..", "..", "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version || process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  } catch {
    return process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for normal polling
const IDLE_THRESHOLD_MS = 60 * 1000; // 1 minute gap = user was away

let cached: { app: string; babysitter: string } | null = null;
let cachedAt = 0;
let lastRequestAt = 0;

function isCacheStale(): boolean {
  const now = Date.now();
  const idleGap = now - lastRequestAt;
  const cacheAge = now - cachedAt;

  // User returned after being away — likely upgraded something
  if (lastRequestAt > 0 && idleGap > IDLE_THRESHOLD_MS) return true;

  // Normal TTL expiry
  return cacheAge > CACHE_TTL_MS;
}

export async function GET() {
  if (!cached || isCacheStale()) {
    cached = {
      app: getAppVersion(),
      babysitter: detectVersion("babysitter --version"),
    };
    cachedAt = Date.now();
  }
  lastRequestAt = Date.now();
  return NextResponse.json(cached);
}
