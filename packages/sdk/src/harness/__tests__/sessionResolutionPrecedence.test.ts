/**
 * Verifies session-resolution precedence across all harness adapters.
 *
 * Each adapter (codex, gemini-cli, github-copilot, pi, oh-my-pi, custom,
 * cursor) must prefer direct per-session env bindings first and use the
 * PID-scoped marker only as a fallback when those ambient bindings are
 * unavailable. Harness-native per-session env vars (CODEX_THREAD_ID,
 * GEMINI_SESSION_ID, COPILOT_SESSION_ID, PI_SESSION_ID, OMP_SESSION_ID)
 * should win over the cross-harness BABYSITTER_SESSION_ID.
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
import { createCodexAdapter } from "../codex";
import { createGeminiCliAdapter } from "../geminiCli";
import { createGithubCopilotAdapter } from "../githubCopilot";
import { createPiAdapter } from "../pi";
import { createOhMyPiAdapter } from "../ohMyPi";
import { createCustomAdapter } from "../customAdapter";
import { createCursorAdapter } from "../cursor";
import type { HarnessAdapter } from "../types";

interface AdapterCase {
  harness: string;
  envVarName?: string;  // harness-native env var (not BABYSITTER_SESSION_ID)
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
  "BABYSITTER_SESSION_ID",
  "BABYSITTER_TRUST_ENV_SESSION",
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
      it("Case A: ambient env beats pid marker", () => {
        __setAncestorResolverForTests(() => ({ pid: process.pid }));
        seedMarker(c.harness, process.pid, "MARKER-A");
        if (c.envVarName) {
          process.env[c.envVarName] = "NATIVE-A";
        } else {
          process.env.BABYSITTER_SESSION_ID = "ENV-A";
        }
        const adapter = c.adapter();
        expect(adapter.resolveSessionId?.({})).toBe(c.envVarName ? "NATIVE-A" : "ENV-A");
      });

      if (c.envVarName) {
        it("Case B: no native env, BABYSITTER_SESSION_ID wins over pid marker", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-B");
          process.env.BABYSITTER_SESSION_ID = "FALLBACK-B";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("FALLBACK-B");
        });

        it("Case C: no marker, harness-native env var wins over stale BABYSITTER_SESSION_ID", () => {
          __setAncestorResolverForTests(() => undefined);
          process.env[c.envVarName!] = "NATIVE-B";
          process.env.BABYSITTER_SESSION_ID = "STALE";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("NATIVE-B");
        });

        it("Case D: marker is used only when env-based sources are absent", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-D");
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-D");
        });

        it("Case E: BABYSITTER_TRUST_ENV_SESSION=1 restores legacy env-var-first", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-IGNORED");
          process.env[c.envVarName!] = "NATIVE-C";
          process.env.BABYSITTER_SESSION_ID = "TRUSTED-ENV";
          process.env.BABYSITTER_TRUST_ENV_SESSION = "1";
          const adapter = c.adapter();
          // In legacy order, BABYSITTER_SESSION_ID takes precedence over
          // harness-native env.
          expect(adapter.resolveSessionId?.({})).toBe("TRUSTED-ENV");
        });
      } else {
        it("Case B (no native env var): BABYSITTER_SESSION_ID beats pid marker", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-B");
          process.env.BABYSITTER_SESSION_ID = "FALLBACK-B";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("FALLBACK-B");
        });

        it("Case C (no native env var): marker is used only when env is absent", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-C");
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("MARKER-C");
        });

        it("Case D: BABYSITTER_TRUST_ENV_SESSION=1 preserves env-var fallback", () => {
          __setAncestorResolverForTests(() => ({ pid: process.pid }));
          seedMarker(c.harness, process.pid, "MARKER-IGNORED");
          process.env.BABYSITTER_SESSION_ID = "TRUSTED-ENV";
          process.env.BABYSITTER_TRUST_ENV_SESSION = "1";
          const adapter = c.adapter();
          expect(adapter.resolveSessionId?.({})).toBe("TRUSTED-ENV");
        });
      }
    });
  }
});
