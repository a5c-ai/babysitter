import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "node:path";

// Mock os.homedir before importing the module under test
vi.mock("node:os", () => ({
  homedir: () => "/mock/home",
}));

import { getRegistryPath, getMarketplacesDir, getMarketplaceDir } from "../paths";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRegistryPath", () => {
  it("returns global registry path under homedir", () => {
    const result = getRegistryPath("global");
    expect(result).toBe(
      path.join("/mock/home", ".a5c", "plugin-registry.json")
    );
  });

  it("returns project registry path under projectDir", () => {
    const result = getRegistryPath("project", "/my/project");
    expect(result).toBe(
      path.join("/my/project", ".a5c", "plugin-registry.json")
    );
  });

  it("throws when scope is project but projectDir is missing", () => {
    expect(() => getRegistryPath("project")).toThrow(
      "projectDir is required when scope is 'project'"
    );
  });
});

describe("getMarketplacesDir", () => {
  it("returns global marketplaces dir under homedir", () => {
    const result = getMarketplacesDir("global");
    expect(result).toBe(
      path.join("/mock/home", ".a5c", "marketplaces")
    );
  });

  it("returns project marketplaces dir under projectDir", () => {
    const result = getMarketplacesDir("project", "/my/project");
    expect(result).toBe(
      path.join("/my/project", ".a5c", "marketplaces")
    );
  });

  it("throws when scope is project but projectDir is missing", () => {
    expect(() => getMarketplacesDir("project")).toThrow(
      "projectDir is required when scope is 'project'"
    );
  });
});

describe("getMarketplaceDir", () => {
  it("returns marketplace-specific directory under global scope", () => {
    const result = getMarketplaceDir("my-marketplace", "global");
    expect(result).toBe(
      path.join("/mock/home", ".a5c", "marketplaces", "my-marketplace")
    );
  });

  it("returns marketplace-specific directory under project scope", () => {
    const result = getMarketplaceDir(
      "my-marketplace",
      "project",
      "/my/project"
    );
    expect(result).toBe(
      path.join(
        "/my/project",
        ".a5c",
        "marketplaces",
        "my-marketplace"
      )
    );
  });

  it("throws when scope is project but projectDir is missing", () => {
    expect(() =>
      getMarketplaceDir("my-marketplace", "project")
    ).toThrow("projectDir is required when scope is 'project'");
  });
});
