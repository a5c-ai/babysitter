import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  _resetAmuxInstallClientCache,
  _setAmuxInstallModuleForTesting,
  discoverHarnessesViaAmux,
  installHarnessPlugin,
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
      success: true,
      status: "planned",
      summary: "installed",
      command: "amux install codex",
      output: "ok",
    });
  });

  it("falls back to npm CLI installers when agent-mux has no install hook", async () => {
    _setAmuxInstallModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => [],
          detect: async () => null,
          installed: async () => [],
          get: () => ({}),
        },
      }),
    });

    const result = await installHarnessViaAmux("claude-code", { dryRun: true });

    expect(result).toMatchObject({
      harness: "claude-code",
      dryRun: true,
      success: true,
      status: "planned",
      installer: "npm",
      command: "npm install -g @anthropic-ai/claude-code",
    });
  });

  it("plans a Claude Code plugin install through Claude plugin commands", async () => {
    const result = await installHarnessPlugin("claude-code", {
      workspace: "/tmp/demo",
      json: true,
      dryRun: true,
      verbose: false,
    });

    expect(result).toMatchObject({
      harness: "claude-code",
      dryRun: true,
      success: true,
      status: "planned",
      installer: "claude",
      scope: "workspace",
      command: "claude plugin marketplace add a5c-ai/babysitter-claude && claude plugin install --scope project babysitter@a5c.ai",
      location: "/tmp/demo",
    });
  });

  it("plans a Claude Code plugin install from generated local marketplace when available", async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-claude-plugin-"));
    await fs.mkdir(path.join(workspace, "artifacts", "generated-plugins", ".claude-plugin"), { recursive: true });
    await fs.writeFile(path.join(workspace, "artifacts", "generated-plugins", ".claude-plugin", "marketplace.json"), "{}\n");

    const result = await installHarnessPlugin("claude-code", {
      workspace,
      json: true,
      dryRun: true,
      verbose: false,
    });

    expect(result.command).toBe(`claude plugin marketplace add ${path.join(workspace, "artifacts", "generated-plugins")} && claude plugin install --scope project babysitter@a5c.ai`);
  });
  it("plans a plugin install through the published package installer", async () => {
    const result = await installHarnessPlugin("codex", {
      workspace: "/tmp/demo",
      json: true,
      dryRun: true,
      verbose: false,
    });

    expect(result).toMatchObject({
      harness: "codex",
      dryRun: true,
      success: true,
      status: "planned",
      installer: "npx",
      scope: "workspace",
      command: "npx --yes @a5c-ai/babysitter-codex install --workspace /tmp/demo",
      location: "/tmp/demo",
    });
  });
});
