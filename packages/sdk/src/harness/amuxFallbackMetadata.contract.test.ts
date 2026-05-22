import { describe, expect, it } from "vitest";
import { listFallbackHarnessMetadata, getHostSignalMap } from "@a5c-ai/agent-catalog";
import { STATIC_FALLBACK_METADATA } from "./amuxFallbackMetadata";

describe("sdk fallback metadata contract", () => {
  it("derives static fallback metadata from the agent-catalog export surface", () => {
    const catalogMetadata = listFallbackHarnessMetadata();
    const hostSignalMap = getHostSignalMap();

    // Every catalog harness must appear in static metadata
    for (const metadata of Object.values(catalogMetadata)) {
      const entry = STATIC_FALLBACK_METADATA[metadata.adapterName];
      expect(entry, `missing static metadata for ${metadata.adapterName}`).toBeDefined();
      expect(entry.name).toBe(metadata.adapterName);
      expect(entry.capabilities).toEqual(metadata.capabilities);

      // hostEnvSignals: enriched from HOST_SIGNAL_MAP when catalog has empty signals
      const expectedSignals = metadata.hostEnvSignals.length > 0
        ? metadata.hostEnvSignals
        : (hostSignalMap[metadata.adapterName] ?? []);
      expect(entry.hostEnvSignals).toEqual(expectedSignals);
    }

    expect(Object.keys(STATIC_FALLBACK_METADATA).length).toBeGreaterThan(0);
    expect(STATIC_FALLBACK_METADATA.claude).toBeDefined();
    expect(STATIC_FALLBACK_METADATA.claude.hostEnvSignals.length).toBeGreaterThan(0);
  });
});
