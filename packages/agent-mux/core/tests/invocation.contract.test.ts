import { describe, expect, it } from "vitest";
import {
  getHarnessImages,
  lookupHarnessImage as lookupCatalogHarnessImage,
} from "@a5c-ai/agent-catalog";
import {
  HARNESS_IMAGE_CATALOG,
  lookupHarnessImage,
} from "../src/invocation.js";

describe("agent-mux invocation catalog contract", () => {
  it("re-exports the graph-backed harness image catalog verbatim", () => {
    expect(HARNESS_IMAGE_CATALOG).toEqual(getHarnessImages());
  });

  it("keeps invocation image lookup aligned with agent-catalog aliases", () => {
    for (const harness of ["claude-code", "claude", "codex", "gemini", "copilot", "omp"]) {
      expect(lookupHarnessImage(harness)).toEqual(lookupCatalogHarnessImage(harness));
    }
  });
});
