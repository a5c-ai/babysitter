/**
 * Verifies session-resolution precedence across all harness adapters.
 *
 * Each adapter (codex, gemini-cli, github-copilot, pi, oh-my-pi, custom,
 * cursor) must prefer the live PID-scoped marker first and use inherited
 * env bindings only as fallbacks. Harness-native per-session env vars
 * (CODEX_THREAD_ID, GEMINI_SESSION_ID, COPILOT_SESSION_ID, PI_SESSION_ID,
 * OMP_SESSION_ID) should win over the cross-harness AGENT_SESSION_ID when
 * no marker is available.
 *
 * Legacy escape hatch BABYSITTER_TRUST_ENV_SESSION=1 restores env-var-first
 * precedence.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs, writeFileSync, mkdirSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  __resetCacheForTests,
  __setAncestorResolverForTests,
  getSessionMarkerPath,
} from "../../utils/sessionMarker";
import { createCodexAdapter } from "../adapters/codex";
import { createGeminiCliAdapter } from "../adapters/gemini-cli";
import { createGithubCopilotAdapter } from "../adapters/github-copilot";
import { createPiAdapter } from "../adapters/pi";
import { createOhMyPiAdapter } from "../adapters/oh-my-pi";
import { createCustomAdapter } from "../customAdapter";
import { createCursorAdapter } from "../adapters/cursor";
import type { HarnessAdapter } from "../types";

interface AdapterCase {
  harness: string;
  envVarName?: string;  // harness-native env var (not AGENT_SESSION_ID)
  adapter: () => HarnessAdapter;
}

const CASES: AdapterCase[] = [
  { harness: "codex", envVarName: "CODEX_THREAD_ID", adapter: createCodexAdapter },
  { harness: "gemini-cli", envVarName: "GEMINI_SESSION_ID", adapter: createGeminiCliAdapter },
  { harness: "github-copilot", envVarName: "COPILOT_SESSION_ID", adapter: createGithubCopilotAdapter },
  { harness: "pi", envVarName: "PI_SESSION_ID", adapter: createPiAdapter },
  { harness: "oh-my-pi", envVarName: "OMP_SESSION_ID", adapter: createOhMyPiAdapter },
  { harness: "custom", envVarName: undefined, adapter: createCustomAdapter },
  { harness: "cursor", envVarName: undefined, adapter: createCursorAdapter },
];

const TRACKED_ENV_KEYS = [
  "AGENT_SESSION_ID",
  "AGENT_SESSION_ID",
  "AGENT_TRUST_ENV_SESSION",
  "BABYSITTER_TRUST_ENV_SESSION",
  "AGENT_ENABLE_SESSION_PID_MARKERS",
  "BABYSITTER_ENABLE_SESSION_PID_MARKERS",
  "BABYSITTER_GLOBAL_STATE_DIR",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "GEMINI_SESSION_ID",
  "COPILOT_SESSION_ID",
  "COPILOT_ENV_FILE",
  "CLAUDE_ENV_FILE",
  "PI_SESSION_ID",
  "OMP_SESSION_ID",
];

let tmpDir: string;
let saved: Record<string, string | undefined> = {};

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapter-resolve-prec-"));
  saved = {};
  for (const k of TRACKED_ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
  __resetCacheForTests();
});

afterEach(async () => {
  for (const k of TRACKED_ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  __resetCacheForTests();
  __setAncestorResolverForTests(undefined);
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

function seedMarker(harness: string, pid: number, sessionId: string): void {
  const markerPath = getSessionMarkerPath(harness, pid);
  mkdirSync(path.dirname(markerPath), { recursive: true });
  writeFileSync(markerPath, `${sessionId}\n`);
}

describe("adapter session-id resolution precedence", () => {
  for (const c of CASES) {
    describe(c.harness, () => {
      it("Case A: pid marker beats ambient env", () => {
        __setAncestorResolverForTests(() => ({ pid: process.pid }));
        seedMarker(c.harness, process.pid, "MARKER-A");
        if (c.envVarName) {
          process.env[c.envVarName] = "NATIVE-A";
        } else {
          process.env.AGENT_SESSION_ID = "ENV-A";
        }
        const adapter = c.adapter();
        expect(adapter.resolveSessionId?.({})).toBe("MARKER-A");
      });

      if (c.envVarName) {
        it("Case B: pid marker beats AGENT_SESSION_ID when no native env is present", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-B");
          process.env.AGENT_SESSION_ID = "FALLBACK-B";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-B");
        });

        it("Case C: no marker, harness-native env var wins over stale AGENT_SESSION_ID", () => {
          __setAncestorResolverForTests(() => undefined);
          process.env[c.envVarName!] = "NATIVE-B";
          process.env.AGENT_SESSION_ID = "STALE";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("NATIVE-B");
        });

        it("Case D: marker is used when env-based sources are absent", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-D");
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-D");
        });

        it("Case E: BABYSITTER_TRUST_ENV_SESSION=1 restores legacy env-var-first", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-IGNORED");
          process.env[c.envVarName!] = "NATIVE-C";
          process.env.AGENT_SESSION_ID = "TRUSTED-ENV";
          process.env.AGENT_TRUST_ENV_SESSION = "1";
          const adapter = c.adapter();
          // In legacy order, AGENT_SESSION_ID takes precedence over
          // harness-native env.
          expect(adapter.resolveSessionId?.({})).toBe("TRUSTED-ENV");
        });
      } else {
        it("Case B (no native env var): pid marker beats AGENT_SESSION_ID", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-B");
          process.env.AGENT_SESSION_ID = "FALLBACK-B";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-B");
        });

        it("Case C (no native env var): marker is used when env is absent", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-C");
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-C");
        });

        it("Case D: BABYSITTER_TRUST_ENV_SESSION=1 preserves env-var fallback", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-IGNORED");
          process.env.AGENT_SESSION_ID = "TRUSTED-ENV";
          process.env.AGENT_TRUST_ENV_SESSION = "1";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("TRUSTED-ENV");
        });
      }
    });
  }
});
