import { homedir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateSecureBashBackend = vi.fn((): Promise<{
  operations: unknown;
  promptNote: string;
  dispose: () => void;
} | null> => Promise.resolve(null));
const mockLoadCompressionConfigSafe = vi.fn(() => null);
const mockBuildCompactionSettings = vi.fn(() => ({
  compaction: {},
  branchSummary: {},
}));
const mockDiscoverRepoInstructionPrompts = vi.fn(() => []);
const mockConfigureAzureOpenAiEnvDefaults = vi.fn();
const mockDescribePiModelResolutionFailure = vi.fn((model: string) => `Explicit model "${model}" could not be resolved.`);
const mockResolvePiModel = vi.fn(() => Promise.resolve(undefined));
const mockLoadPiModule = vi.fn();

let defaultResourceLoaderOptions: Record<string, unknown> | undefined;
let createAgentSessionOptions: Record<string, unknown> | undefined;
let defaultPiModule: Record<string, unknown>;
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
  describePiModelResolutionFailure: mockDescribePiModelResolutionFailure,
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

    defaultPiModule = {
      createAgentSession: vi.fn((options?: Record<string, unknown>) => {
        createAgentSessionOptions = options;
        return Promise.resolve({
          session: {
            prompt: vi.fn(() => Promise.resolve(undefined)),
            steer: vi.fn(() => Promise.resolve(undefined)),
            followUp: vi.fn(() => Promise.resolve(undefined)),
            subscribe: vi.fn(() => () => {}),
            executeBash: vi.fn(() => Promise.resolve({
              output: "",
              exitCode: 0,
              cancelled: false,
              truncated: false,
            })),
            abort: vi.fn(() => Promise.resolve(undefined)),
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
        });
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
    };
    mockLoadPiModule.mockResolvedValue(defaultPiModule);
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

  it("fails fast when an explicit model cannot be resolved", async () => {
    const { AgentCoreSessionHandle } = await import("./piWrapper");

    const session = new AgentCoreSessionHandle({
      workspace: process.cwd(),
      model: "gemini-3.1-pro-preview",
    });

    await expect(session.initialize()).rejects.toThrow(
      'Explicit model "gemini-3.1-pro-preview" could not be resolved.',
    );
    expect(mockConfigureAzureOpenAiEnvDefaults).toHaveBeenCalledWith("gemini-3.1-pro-preview");
    expect(mockResolvePiModel).toHaveBeenCalled();
    expect(mockDescribePiModelResolutionFailure).toHaveBeenCalledWith("gemini-3.1-pro-preview");
    expect(createAgentSessionOptions).toBeUndefined();
  });

  it("backs off immediate initialization retries after a failure and recovers after the delay", async () => {
    const { AgentCoreSessionHandle } = await import("./piWrapper");
    const createAgentSession = vi.fn()
      .mockRejectedValueOnce(new Error("transient init failure"))
      .mockResolvedValueOnce({
        session: {
          prompt: vi.fn(() => Promise.resolve(undefined)),
          steer: vi.fn(() => Promise.resolve(undefined)),
          followUp: vi.fn(() => Promise.resolve(undefined)),
          subscribe: vi.fn(() => () => {}),
          executeBash: vi.fn(() => Promise.resolve({
            output: "",
            exitCode: 0,
            cancelled: false,
            truncated: false,
          })),
          abort: vi.fn(() => Promise.resolve(undefined)),
          dispose: vi.fn(),
          getLastAssistantText: vi.fn(() => ""),
          get sessionId() {
            return "session-2";
          },
          get isStreaming() {
            return false;
          },
          get messages() {
            return [];
          },
        },
      });

    mockLoadPiModule.mockResolvedValue({
      ...defaultPiModule,
      createAgentSession,
    });

    const session = new AgentCoreSessionHandle({
      workspace: process.cwd(),
      initFailureBackoffMs: 50,
    });

    await expect(session.initialize()).rejects.toThrow("transient init failure");
    await expect(session.initialize()).rejects.toThrow("transient init failure");
    expect(createAgentSession).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 60));
    await expect(session.initialize()).resolves.toBeUndefined();
    expect(createAgentSession).toHaveBeenCalledTimes(2);
  });
});
