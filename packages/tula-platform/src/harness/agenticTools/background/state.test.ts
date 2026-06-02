import { describe, expect, it } from "vitest";
import {
  BackgroundProcessRegistry as RuntimeBackgroundProcessRegistry,
} from "@a5c-ai/tula-runtime";
import { BackgroundProcessRegistry as PlatformBackgroundProcessRegistry } from "../../backgroundProcessRegistry";
import {
  disposeBackgroundRegistry,
  getBackgroundRegistry,
} from "./state";
import type { AgenticToolOptions } from "../types";

function options(overrides: Partial<AgenticToolOptions> & { registryId?: string } = {}) {
  return {
    workspace: process.cwd(),
    interactive: false,
    ...overrides,
  } as AgenticToolOptions & { registryId?: string };
}

describe("platform background registry compatibility", () => {
  it("keeps the platform deep import as the runtime registry shim", () => {
    expect(PlatformBackgroundProcessRegistry).toBe(RuntimeBackgroundProcessRegistry);
  });

  it("reuses runtime registry state by registryId across recreated options objects", () => {
    const first = options({ registryId: "platform-session-a" });
    const second = options({ registryId: "platform-session-a" });

    const firstRegistry = getBackgroundRegistry(first);
    const secondRegistry = getBackgroundRegistry(second);

    expect(secondRegistry).toBe(firstRegistry);

    disposeBackgroundRegistry(second);
  });
});
