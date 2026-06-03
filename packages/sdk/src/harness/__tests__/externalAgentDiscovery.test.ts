import { execFile } from "node:child_process";
import type { ChildProcess } from "node:child_process";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import {
  _resetExternalAgentDiscoveryCache,
  _setExternalAgentDiscoveryModuleForTesting,
  discoverExternalAgents,
} from "../externalAgentDiscovery";

const mockedExecFile = vi.mocked(execFile);

type ExecFileCallback = (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => void;

function stubExecFile(response: string | Error): void {
  mockedExecFile.mockImplementation(
    ((...args: unknown[]): ChildProcess => {
      const callback = args[args.length - 1] as ExecFileCallback;
      if (response instanceof Error) {
        callback(response, "", "");
      } else {
        callback(null, response, "");
      }
      return {
        on: vi.fn().mockReturnThis(),
        kill: vi.fn(),
        stdout: null,
        stderr: null,
        pid: 0,
      } as unknown as ChildProcess;
    }) as typeof execFile,
  );
}

beforeEach(() => {
  delete process.env.AGENT_MUX_PROVIDER;
  delete process.env.AGENT_MUX_MODEL;
  vi.useRealTimers();
  vi.restoreAllMocks();
  mockedExecFile.mockReset();
  _setExternalAgentDiscoveryModuleForTesting(undefined);
  _resetExternalAgentDiscoveryCache();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  _setExternalAgentDiscoveryModuleForTesting(undefined);
  _resetExternalAgentDiscoveryCache();
});

describe("discoverExternalAgents", () => {
  it("returns unavailable when neither agent-mux nor adapters doctor is available", async () => {
    _setExternalAgentDiscoveryModuleForTesting(null);
    stubExecFile(new Error("adapters not found"));

    await expect(discoverExternalAgents({ force: true })).resolves.toEqual({
      available: false,
      agents: [],
      defaultProvider: null,
      defaultModel: null,
    });
  });

  it("discovers agents through an injected agent-mux module", async () => {
    process.env.AGENT_MUX_PROVIDER = "codex";
    process.env.AGENT_MUX_MODEL = "gpt-5.3-codex";

    _setExternalAgentDiscoveryModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => [
            { agent: "claude", displayName: "Claude Code" },
            { agent: "codex", displayName: "Codex CLI" },
          ],
          installed: async () => [
            {
              agent: "claude",
              installed: true,
              authState: "authenticated",
              activeModel: "claude-opus-4-8",
            },
            {
              agent: "codex",
              installed: true,
              authState: "unauthenticated",
            },
          ],
          capabilities: (agent: string) => ({
            agent,
            supportsNativeTools: true,
            supportsMCP: agent === "claude",
            supportsSkills: agent === "claude",
            supportsSubagentDispatch: agent === "claude",
            supportsParallelExecution: true,
            supportsMultiTurn: true,
            supportsJsonMode: true,
            supportsImageInput: agent === "claude",
            supportsFileAttachments: agent === "claude",
          }),
        },
        models: {
          defaultModel: (agent: string) => (
            agent === "codex" ? { modelId: "gpt-5.3-codex" } : null
          ),
        },
      }),
    });

    const result = await discoverExternalAgents({ force: true });

    expect(result).toMatchObject({
      available: true,
      defaultProvider: "codex",
      defaultModel: "gpt-5.3-codex",
    });
    expect(result.agents).toEqual([
      {
        name: "claude",
        displayName: "Claude Code",
        installed: true,
        authenticated: true,
        capabilities: expect.arrayContaining([
          "file-edit",
          "bash",
          "mcp",
          "skills",
          "subagents",
          "multi-turn",
          "json",
          "image-input",
          "file-attachments",
        ]),
      },
      {
        name: "codex",
        displayName: "Codex CLI",
        installed: true,
        authenticated: false,
        capabilities: expect.arrayContaining(["file-edit", "bash", "multi-turn", "json"]),
      },
    ]);
    expect(mockedExecFile).not.toHaveBeenCalled();
  });

  it("falls back to adapters doctor --json when the module is unavailable", async () => {
    _setExternalAgentDiscoveryModuleForTesting(null);
    process.env.AGENT_MUX_PROVIDER = "claude";

    stubExecFile(JSON.stringify({
      ok: true,
      data: {
        agents: [
          {
            agent: "claude",
            displayName: "Claude Code",
            install: { installed: true },
            auth: { status: "authenticated" },
            capabilities: ["file-edit", "bash", "browser"],
          },
          {
            agent: "gemini",
            install: { installed: false },
            auth: { status: "unauthenticated" },
          },
        ],
      },
    }));

    const result = await discoverExternalAgents({ cwd: "/tmp/project", timeout: 1234, force: true });

    expect(mockedExecFile).toHaveBeenCalledWith(
      "adapters",
      ["doctor", "--json"],
      expect.objectContaining({ cwd: "/tmp/project", timeout: 1234 }),
      expect.any(Function),
    );
    expect(result).toEqual({
      available: true,
      defaultProvider: "claude",
      defaultModel: null,
      agents: [
        {
          name: "claude",
          displayName: "Claude Code",
          installed: true,
          authenticated: true,
          capabilities: ["file-edit", "bash", "browser"],
        },
        {
          name: "gemini",
          displayName: "gemini",
          installed: false,
          authenticated: false,
          capabilities: [],
        },
      ],
    });
  });

  it("falls back to CLI when module discovery throws", async () => {
    _setExternalAgentDiscoveryModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => {
            throw new Error("registry failed");
          },
          installed: async () => [],
        },
      }),
    });
    stubExecFile(JSON.stringify({
      agents: [
        {
          agent: "codex",
          install: { installed: true },
          auth: { status: "authenticated" },
        },
      ],
    }));

    const result = await discoverExternalAgents({ force: true });

    expect(result.available).toBe(true);
    expect(result.agents[0]).toMatchObject({
      name: "codex",
      installed: true,
      authenticated: true,
    });
  });

  it("returns unavailable when module discovery and CLI fallback both fail", async () => {
    _setExternalAgentDiscoveryModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => {
            throw new Error("registry failed");
          },
          installed: async () => [],
        },
      }),
    });
    stubExecFile(new Error("doctor failed"));

    const result = await discoverExternalAgents({ force: true });

    expect(result).toEqual({
      available: false,
      agents: [],
      defaultProvider: null,
      defaultModel: null,
    });
  });

  it("honors timeout failures without throwing", async () => {
    _setExternalAgentDiscoveryModuleForTesting(null);
    stubExecFile(Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }));

    const result = await discoverExternalAgents({ timeout: 1, force: true });

    expect(result.available).toBe(false);
    expect(result.agents).toEqual([]);
  });

  it("caches discovery for 60 seconds and force bypasses the cache", async () => {
    vi.useFakeTimers();
    let installed = false;

    _setExternalAgentDiscoveryModuleForTesting({
      createClient: () => ({
        adapters: {
          list: () => [{ agent: "codex", displayName: "Codex CLI" }],
          installed: async () => [
            {
              agent: "codex",
              installed,
              authState: installed ? "authenticated" : "unauthenticated",
            },
          ],
        },
      }),
    });

    const first = await discoverExternalAgents({ force: true });
    installed = true;
    const cached = await discoverExternalAgents();
    const forced = await discoverExternalAgents({ force: true });

    expect(first.agents[0]?.installed).toBe(false);
    expect(cached.agents[0]?.installed).toBe(false);
    expect(forced.agents[0]?.installed).toBe(true);

    installed = false;
    vi.advanceTimersByTime(60_001);
    const expired = await discoverExternalAgents();

    expect(expired.agents[0]?.installed).toBe(false);
  });
});
