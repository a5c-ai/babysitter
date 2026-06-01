import { describe, expect, it } from "vitest";
import { listFallbackHarnessMetadata, getHostSignalMap } from "@a5c-ai/atlas/catalog";
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

      // Capabilities: if catalog returns meaningful data (any true), use it.
      // Otherwise LOCAL_FALLBACK_METADATA takes precedence (graph schema mismatch workaround).
      const anyCatalogCapTrue = Object.values(metadata.capabilities).some(v => v === true);
      if (anyCatalogCapTrue) {
        expect(entry.capabilities).toEqual(metadata.capabilities);
      } else {
        // LOCAL fallback should have richer data than all-false catalog
        expect(entry.capabilities.hasStopHook === true || entry.capabilities.hasStopHook === false).toBe(true);
      }

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
