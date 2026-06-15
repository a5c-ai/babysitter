import { afterEach, describe, expect, it, vi } from "vitest";
import {
  _setAmuxModuleForTesting,
  clearAmuxMetadataCache,
  getAmuxAdapterMetadata,
} from "../adapterMetadata";
import { STATIC_FALLBACK_METADATA } from "../adapterFallbackMetadata";

// getAmuxAdapterMetadata takes an early static-fallback path when node:sqlite is
// NOT a builtin (the host Node used by CI/dev may lack it). To exercise the LIVE
// adapters lookup path — where the #949 bug lives — force builtinModules to
// advertise node:sqlite so hasNodeSqliteBuiltin() returns true. The SUT must be
// (re)imported AFTER this mock is registered, so the new-case test below uses
// vi.resetModules() + a dynamic import.
vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  return {
    ...actual,
    builtinModules: [...actual.builtinModules, "node:sqlite", "sqlite"],
  };
});

afterEach(() => {
  _setAmuxModuleForTesting(undefined);
  clearAmuxMetadataCache();
});

describe("getAmuxAdapterMetadata", () => {
  it("falls back to static metadata when adapters exports are unavailable", () => {
    _setAmuxModuleForTesting({});

    const metadata = getAmuxAdapterMetadata("claude-code");

    expect(metadata.name).toBe("claude");
    expect(metadata.hostEnvSignals.length).toBeGreaterThan(0);
    expect(metadata.capabilities.hasStopHook).toBe(true);
    expect(metadata.capabilities.supportsMCP).toBe(true);
  });

  // #949: the live @a5c-ai/adapters module loads fine (createClient +
  // registerBuiltInAdapters exist) but the build it ships simply does not carry
  // the requested adapter, so client.adapters.get(name) returns undefined.
  // Current behavior hard-throws ("does not have an adapter named ...").
  // Expected: fall back to STATIC_FALLBACK_METADATA[name] instead of throwing.
  it("falls back to static genty metadata when the live registry returns undefined for genty (does not throw)", async () => {
    // Re-import the SUT so it observes the mocked builtinModules (node:sqlite),
    // which forces the LIVE adapters lookup path instead of the early fallback.
    vi.resetModules();
    const mod = await import("../adapterMetadata");
    mod.clearAmuxMetadataCache();

    // A fully-loadable adapters module whose registry has no "genty" adapter.
    mod._setAmuxModuleForTesting({
      createClient: () => ({
        adapters: {
          get: (_agent: string) => undefined,
        },
      }),
      registerBuiltInAdapters: (_client: unknown) => {
        /* no-op: registers nothing, so get() stays undefined */
      },
    });

    try {
      expect(() => mod.getAmuxAdapterMetadata("genty")).not.toThrow();

      const metadata = mod.getAmuxAdapterMetadata("genty");
      const expected = STATIC_FALLBACK_METADATA.genty;
      expect(metadata.name).toBe(expected.name);
      expect(metadata.capabilities).toEqual(expected.capabilities);
      expect([...metadata.hostEnvSignals]).toEqual([...expected.hostEnvSignals]);
    } finally {
      mod._setAmuxModuleForTesting(undefined);
      mod.clearAmuxMetadataCache();
    }
  });
});
