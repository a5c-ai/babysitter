import { homedir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateSecureBashBackend = vi.fn(async (): Promise<{
  operations: unknown;
  promptNote: string;
  dispose: () => void;
} | null> => null);
const mockLoadCompressionConfigSafe = vi.fn(() => null);
const mockBuildCompactionSettings = vi.fn(() => ({
  compaction: {},
  branchSummary: {},
}));
const mockDiscoverRepoInstructionPrompts = vi.fn(() => []);
const mockConfigureAzureOpenAiEnvDefaults = vi.fn();
const mockResolvePiModel = vi.fn(async () => undefined);
const mockLoadPiModule = vi.fn();

let defaultResourceLoaderOptions: Record<string, unknown> | undefined;
let createAgentSessionOptions: Record<string, unknown> | undefined;
const mockCreateBashToolDefinition = vi.fn((cwd: string, options?: Record<string, unknown>) => ({
  name: "bash",
  cwd,
  options,
}));

vi.mock("./piSecureSandbox", () => ({
  createSecureBashBackend: mockCreateSecureBashBackend,
}));

vi.mock("./piWrapper/compaction", () => ({
  loadCompressionConfigSafe: mockLoadCompressionConfigSafe,
  buildCompactionSettings: mockBuildCompactionSettings,
}));

vi.mock("./piWrapper/instructionPrompts", () => ({
  discoverRepoInstructionPrompts: mockDiscoverRepoInstructionPrompts,
}));

vi.mock("./piWrapper/moduleSupport", () => ({
  configureAzureOpenAiEnvDefaults: mockConfigureAzureOpenAiEnvDefaults,
  extractAssistantFailure: vi.fn(() => undefined),
  loadPiModule: mockLoadPiModule,
  resolvePiModel: mockResolvePiModel,
}));

describe("AgentCoreSessionHandle", () => {
  beforeEach(() => {
    defaultResourceLoaderOptions = undefined;
    createAgentSessionOptions = undefined;
    delete process.env.PI_CODING_AGENT_DIR;
    vi.clearAllMocks();

    mockLoadPiModule.mockResolvedValue({
      createAgentSession: vi.fn(async (options?: Record<string, unknown>) => {
        createAgentSessionOptions = options;
        return {
          session: {
            prompt: vi.fn(async () => undefined),
            steer: vi.fn(async () => undefined),
            followUp: vi.fn(async () => undefined),
            subscribe: vi.fn(() => () => {}),
            executeBash: vi.fn(async () => ({
              output: "",
              exitCode: 0,
              cancelled: false,
              truncated: false,
            })),
            abort: vi.fn(async () => undefined),
            dispose: vi.fn(),
            getLastAssistantText: vi.fn(() => ""),
            get sessionId() {
              return "session-1";
            },
            get isStreaming() {
              return false;
            },
            get messages() {
              return [];
            },
          },
        };
      }),
      DefaultResourceLoader: class {
        constructor(options?: Record<string, unknown>) {
          defaultResourceLoaderOptions = options;
        }

        async reload(): Promise<void> {}
      },
      AuthStorage: {
        create: vi.fn(() => ({})),
      },
      ModelRegistry: class {
        find(): undefined {
          return undefined;
        }

        getAll(): [] {
          return [];
        }
      },
      SessionManager: {
        inMemory: vi.fn(() => ({ kind: "memory-session-manager" })),
      },
      SettingsManager: {
        inMemory: vi.fn(() => ({ kind: "memory-settings-manager" })),
      },
      createBashToolDefinition: mockCreateBashToolDefinition,
      createCodingTools: vi.fn(() => []),
      createReadOnlyTools: vi.fn(() => []),
      codingTools: [],
      readOnlyTools: [],
    });
  });

  it("defaults agentDir for resource loading when none is provided", async () => {
    const { AgentCoreSessionHandle } = await import("./piWrapper");

    const session = new AgentCoreSessionHandle({
      workspace: process.cwd(),
      toolsMode: "coding",
      isolated: true,
      ephemeral: true,
    });

    await session.initialize();

    const expectedAgentDir = join(homedir(), ".pi", "agent");
    expect(defaultResourceLoaderOptions).toMatchObject({
      agentDir: expectedAgentDir,
      cwd: process.cwd(),
    });
    expect(createAgentSessionOptions).toMatchObject({
      agentDir: expectedAgentDir,
      cwd: process.cwd(),
    });
  });

  it("passes tool names instead of tool objects and injects the secure bash override through customTools", async () => {
    mockCreateSecureBashBackend.mockResolvedValueOnce({
      operations: { kind: "secure-bash-ops" },
      promptNote: "secure bash",
      dispose: vi.fn(),
    });

    const { AgentCoreSessionHandle } = await import("./piWrapper");

    const session = new AgentCoreSessionHandle({
      workspace: process.cwd(),
      toolsMode: "coding",
      customTools: [{ name: "babysitter_run_iterate" }],
    });

    await session.initialize();

    expect(createAgentSessionOptions?.tools).toEqual(["read", "bash", "edit", "write"]);
    expect(mockCreateBashToolDefinition).toHaveBeenCalledWith(
      process.cwd(),
      expect.objectContaining({
        operations: { kind: "secure-bash-ops" },
      }),
    );
    expect(createAgentSessionOptions?.customTools).toEqual([
      expect.objectContaining({ name: "bash" }),
      { name: "babysitter_run_iterate" },
    ]);
  });
});
