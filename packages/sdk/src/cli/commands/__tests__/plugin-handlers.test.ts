/**
 * Tests for plugin command validation helpers and handler argument validation.
 *
 * Covers: validateScope, requireArg, and argument validation paths for
 * handlePluginAddMarketplace, handlePluginUpdateMarketplace, handlePluginListPlugins
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../plugins/marketplace", () => ({
  cloneMarketplace: vi.fn(),
  updateMarketplace: vi.fn(),
  listMarketplacePlugins: vi.fn(),
  listMarketplaces: vi.fn().mockResolvedValue([]),
  resolvePluginPackagePath: vi.fn(),
  readMarketplaceManifest: vi.fn(),
}));

vi.mock("../../../plugins/registry", () => ({
  readPluginRegistry: vi.fn(),
  getPluginEntry: vi.fn(),
  listPluginEntries: vi.fn(),
  upsertPluginEntry: vi.fn(),
  removePluginEntry: vi.fn(),
  writePluginRegistry: vi.fn(),
}));

vi.mock("../../../plugins/packageReader", () => ({
  readInstallInstructions: vi.fn(),
  readUninstallInstructions: vi.fn(),
  readConfigureInstructions: vi.fn(),
}));

vi.mock("../../../plugins/migrations", () => ({
  resolveMigrationChain: vi.fn(),
}));

import {
  cloneMarketplace,
  updateMarketplace,
} from "../../../plugins/marketplace";

import {
  validateScope,
  requireArg,
  handlePluginAddMarketplace,
  handlePluginUpdateMarketplace,
  handlePluginListPlugins,
} from "../plugin";

const mockedCloneMarketplace = vi.mocked(cloneMarketplace);
const mockedUpdateMarketplace = vi.mocked(updateMarketplace);

describe("validateScope", () => {
  it('returns true for "global"', () => {
    expect(validateScope("global")).toBe(true);
  });

  it('returns true for "project"', () => {
    expect(validateScope("project")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(validateScope(undefined)).toBe(false);
  });

  it("returns false for invalid string", () => {
    expect(validateScope("local")).toBe(false);
  });
});

describe("requireArg", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the value when present", () => {
    const result = requireArg("hello", "--name", "cmd", false);
    expect(result).toBe("hello");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("returns null and prints error when value is undefined", () => {
    const result = requireArg(undefined, "--name", "cmd", false);
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith("[cmd] --name is required");
  });

  it("returns null and prints JSON error when value is undefined and json is true", () => {
    const result = requireArg(undefined, "--name", "cmd", true);
    expect(result).toBeNull();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.error).toBe("missing_argument");
    expect(output.message).toBe("[cmd] --name is required");
  });
});

describe("handlePluginAddMarketplace missing args via requireArg", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 1 with JSON when marketplaceUrl is missing", async () => {
    const result = await handlePluginAddMarketplace({
      scope: "global",
      json: true,
    });
    expect(result).toBe(1);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.error).toBe("missing_argument");
    expect(output.message).toContain("--marketplace-url");
  });

  it("returns 1 when scope is invalid", async () => {
    const result = await handlePluginAddMarketplace({
      marketplaceUrl: "https://example.com/mp",
      json: false,
    });
    expect(result).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project is required")
    );
  });
});

describe("handlePluginUpdateMarketplace missing args via requireArg", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 1 with JSON when marketplaceName is missing", async () => {
    const result = await handlePluginUpdateMarketplace({
      scope: "global",
      json: true,
    });
    expect(result).toBe(1);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.error).toBe("missing_argument");
    expect(output.message).toContain("--marketplace-name");
  });

  it("returns 1 when scope is missing", async () => {
    const result = await handlePluginUpdateMarketplace({
      marketplaceName: "test-mp",
      json: false,
    });
    expect(result).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project is required")
    );
  });
});

describe("handlePluginListPlugins missing args via requireArg", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 1 with JSON when marketplaceName is missing", async () => {
    const result = await handlePluginListPlugins({
      scope: "project",
      json: true,
    });
    expect(result).toBe(1);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.error).toBe("missing_argument");
    expect(output.message).toContain("--marketplace-name");
  });

  it("returns 1 when scope is missing", async () => {
    const result = await handlePluginListPlugins({
      marketplaceName: "test-mp",
      json: false,
    });
    expect(result).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--global or --project is required")
    );
  });
});

describe("handlePluginAddMarketplace success path", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 0 and logs JSON on successful clone", async () => {
    mockedCloneMarketplace.mockResolvedValueOnce("/tmp/marketplaces/my-mp");

    const result = await handlePluginAddMarketplace({
      marketplaceUrl: "https://github.com/org/my-mp.git",
      scope: "global",
      json: true,
    });

    expect(result).toBe(0);
    expect(mockedCloneMarketplace).toHaveBeenCalledWith(
      "https://github.com/org/my-mp.git",
      "global",
      undefined,
      undefined,
      undefined,
      undefined
    );
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.success).toBe(true);
    expect(output.url).toBe("https://github.com/org/my-mp.git");
    expect(output.directory).toBe("/tmp/marketplaces/my-mp");
  });

  it("returns 0 and logs text on successful clone (non-JSON)", async () => {
    mockedCloneMarketplace.mockResolvedValueOnce("/tmp/marketplaces/my-mp");

    const result = await handlePluginAddMarketplace({
      marketplaceUrl: "https://github.com/org/my-mp.git",
      scope: "global",
      json: false,
    });

    expect(result).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Marketplace cloned successfully")
    );
  });
});

describe("handlePluginUpdateMarketplace success path", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 0 and logs JSON on successful update", async () => {
    mockedUpdateMarketplace.mockResolvedValueOnce(undefined);

    const result = await handlePluginUpdateMarketplace({
      marketplaceName: "my-mp",
      scope: "global",
      json: true,
    });

    expect(result).toBe(0);
    expect(mockedUpdateMarketplace).toHaveBeenCalledWith(
      "my-mp",
      "global",
      undefined,
      undefined
    );
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.success).toBe(true);
    expect(output.marketplace).toBe("my-mp");
  });

  it("returns 0 and logs text on successful update (non-JSON)", async () => {
    mockedUpdateMarketplace.mockResolvedValueOnce(undefined);

    const result = await handlePluginUpdateMarketplace({
      marketplaceName: "my-mp",
      scope: "global",
      json: false,
    });

    expect(result).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Marketplace "my-mp" updated successfully')
    );
  });
});
