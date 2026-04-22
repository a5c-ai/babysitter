import { afterEach, describe, expect, it } from "vitest";
import {
  _resetAmuxInstallClientCache,
  _setAmuxInstallModuleForTesting,
  discoverHarnessesViaAmux,
  installHarnessViaAmux,
} from "../install";

afterEach(() => {
  _setAmuxInstallModuleForTesting(undefined);
  _resetAmuxInstallClientCache();
});

describe("install amux bridge", () => {
  it("discovers harnesses from an injected agent-mux module", async () => {
    _setAmuxInstallModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => [],
          get: () => undefined,
          detect: async () => null,
          installed: async () => [
            {
              agent: "codex",
              installed: true,
              cliPath: "/usr/bin/codex",
              version: "1.2.3",
            },
          ],
        },
      }),
    });

    const results = await discoverHarnessesViaAmux();
    const codex = results.find((item) => item.name === "codex");

    expect(codex).toMatchObject({
      installed: true,
      cliPath: "/usr/bin/codex",
      version: "1.2.3",
    });
  });

  it("installs a mapped harness via an injected agent-mux module", async () => {
    _setAmuxInstallModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => [],
          detect: async () => null,
          installed: async () => [],
          get: () => ({
            install: async () => ({
              ok: true,
              method: "mock",
              command: "amux install codex",
              message: "installed",
              stdout: "ok",
            }),
          }),
        },
      }),
    });

    const result = await installHarnessViaAmux("codex", { dryRun: true });

    expect(result).toMatchObject({
      harness: "codex",
      dryRun: true,
      summary: "installed",
      command: "amux install codex",
      output: "ok",
    });
  });
});
