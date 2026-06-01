import { describe, expect, it } from "vitest";

import {
  BLUEPRINT_REGISTRY_FILENAME,
  BLUEPRINT_REGISTRY_SCHEMA_VERSION,
} from "../types";

describe("blueprints module exports", () => {
  it("exposes blueprint registry constants from the renamed SDK module", () => {
    expect(BLUEPRINT_REGISTRY_FILENAME).toBe("blueprint-registry.json");
    expect(BLUEPRINT_REGISTRY_SCHEMA_VERSION).toContain("blueprint-registry");
  });
});
