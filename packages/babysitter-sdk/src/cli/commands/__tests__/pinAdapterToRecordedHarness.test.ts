import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pinActiveAdapterToRecordedHarness } from "../runIterate";
import { getAdapter, resetAdapter } from "../../../harness";

// Force the LIVE adapters lookup path inside getAmuxAdapterMetadata (where the
// #949 genty crash lives) regardless of whether the host Node ships node:sqlite.
// The #949 regression block below re-imports the harness graph after this mock
// so detectAdapter()/getAmuxAdapterMetadata observe the mocked builtinModules.
vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  return {
    ...actual,
    builtinModules: [...actual.builtinModules, "node:sqlite", "sqlite"],
  };
});

// Env vars that could make detectCallerHarness resolve a harness from the
// ambient environment — cleared so the test asserts pinning, not detection.
const ENV_KEYS = [
  "AGENT_SESSION_ID",
  "CLAUDE_ENV_FILE",
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CLAUDE_CODE_SESSION_ID",
  "CLAUDE_PROJECT_DIR",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_PLUGIN_ROOT",
  "PI_SESSION_ID",
  "PI_PLUGIN_ROOT",
  "OPENCODE_SESSION_ID",
  "OPENCODE_CONFIG",
  "GENTY_PLUGIN_ROOT",
];

describe("pinActiveAdapterToRecordedHarness (issue #949)", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    resetAdapter();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
    resetAdapter();
  });

  it("pins the active adapter to the recorded harness", () => {
    const pinned = pinActiveAdapterToRecordedHarness("claude-code");
    expect(pinned).toBe(true);
    expect(getAdapter().name).toBe("claude-code");
  });

  it("honors run.json harness even when ambient env points elsewhere", () => {
    // Simulate an opencode-style session id present in the environment while the
    // run was recorded as claude-code. The recorded harness must win.
    process.env.AGENT_SESSION_ID = "sess-from-other-harness";
    const pinned = pinActiveAdapterToRecordedHarness("claude-code");
    expect(pinned).toBe(true);
    expect(getAdapter().name).toBe("claude-code");
  });

  it("returns false and does not pin when no harness is recorded", () => {
    expect(pinActiveAdapterToRecordedHarness(undefined)).toBe(false);
    expect(pinActiveAdapterToRecordedHarness("")).toBe(false);
  });

  it("returns false for an unknown harness (falls through to env detection)", () => {
    expect(pinActiveAdapterToRecordedHarness("not-a-real-harness")).toBe(false);
  });

  it("can pin to other known harnesses", () => {
    expect(pinActiveAdapterToRecordedHarness("codex")).toBe(true);
    expect(getAdapter().name).toBe("codex");
    expect(pinActiveAdapterToRecordedHarness("pi")).toBe(true);
    expect(getAdapter().name).toBe("pi");
  });
});

describe("#949 regression: genty adapter construction must not abort detection", () => {
  // Re-import the harness graph after the node:module mock so that
  // getAmuxAdapterMetadata observes node:sqlite as a builtin and takes the LIVE
  // adapters lookup path — the path that hard-throws for genty today.
  async function loadHarnessGraphWithUndefinedGenty() {
    vi.resetModules();
    const metadataMod = await import("../../../harness/adapterMetadata");
    const registryMod = await import("../../../harness/registry");
    const runIterateMod = await import("../runIterate");

    metadataMod.clearAmuxMetadataCache();
    registryMod.resetAdapter();
    // Simulate the live @a5c-ai/adapters build that loads fine and carries every
    // OTHER adapter, but specifically ships NO "genty" adapter — so
    // client.adapters.get("genty") returns undefined while the rest resolve.
    // This isolates the #949 crash to the genty factory.
    const realAdapter = (agent: string) => ({
      agent,
      hostEnvSignals: [],
      capabilities: { supportsSkills: true, runtimeHooks: {} },
      sessionDir: () => ".a5c/runs",
    });
    metadataMod._setAmuxModuleForTesting({
      createClient: () => ({
        adapters: {
          get: (agent: string) => (agent === "genty" ? undefined : realAdapter(agent)),
        },
      }),
      registerBuiltInAdapters: (_client: unknown) => {
        /* registers nothing extra */
      },
    });
    return { metadataMod, registryMod, runIterateMod };
  }

  afterEach(async () => {
    const metadataMod = await import("../../../harness/adapterMetadata");
    metadataMod._setAmuxModuleForTesting(undefined);
    metadataMod.clearAmuxMetadataCache();
    const registryMod = await import("../../../harness/registry");
    registryMod.resetAdapter();
    vi.resetModules();
  });

  it("detectAdapter() constructs every known adapter (incl. genty) without throwing", async () => {
    const { registryMod } = await loadHarnessGraphWithUndefinedGenty();
    // detectAdapter() builds ALL adapters via createKnownAdapters(), including
    // createGentyAdapter() -> getAmuxAdapterMetadata('genty'). Before the #949
    // fix this throws: '@a5c-ai/adapters does not have an adapter named "genty"'.
    expect(() => registryMod.detectAdapter()).not.toThrow();
  });

  it("iterating a recorded claude-code run does not throw the genty adapter error", async () => {
    const { registryMod, runIterateMod } = await loadHarnessGraphWithUndefinedGenty();
    // run:iterate pins to the recorded harness then resolves adapters; the
    // genty factory must fall back to static metadata rather than hard-throwing.
    expect(() => {
      runIterateMod.pinActiveAdapterToRecordedHarness("claude-code");
      registryMod.detectAdapter();
    }).not.toThrow(/does not have an adapter named "genty"/);
  });
});
