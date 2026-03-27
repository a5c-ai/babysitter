import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { PiSessionEvent } from "../types";

// ---------------------------------------------------------------------------
// Mock the pi-coding-agent module
// ---------------------------------------------------------------------------

const mockPrompt = vi.fn<(text: string, options?: Record<string, unknown>) => Promise<void>>();
const mockSteer = vi.fn<(text: string) => Promise<void>>();
const mockFollowUp = vi.fn<(text: string) => Promise<void>>();
const mockAbort = vi.fn<() => Promise<void>>();
const mockDispose = vi.fn<() => void>();
const mockGetLastAssistantText = vi.fn<() => string | undefined>();
const mockExecuteBash = vi.fn<(command: string, onChunk?: (chunk: string) => void) => Promise<{ output: string; exitCode: number | undefined; cancelled: boolean; truncated: boolean }>>();

let eventListeners: Array<(event: PiSessionEvent) => void> = [];

const mockSession = {
  prompt: mockPrompt,
  steer: mockSteer,
  followUp: mockFollowUp,
  abort: mockAbort,
  dispose: mockDispose,
  getLastAssistantText: mockGetLastAssistantText,
  executeBash: mockExecuteBash,
  subscribe: (listener: (event: PiSessionEvent) => void) => {
    eventListeners.push(listener);
    return () => {
      eventListeners = eventListeners.filter((l) => l !== listener);
    };
  },
  get sessionId() {
    return "mock-session-id";
  },
  get isStreaming() {
    return false;
  },
  get messages() {
    return [];
  },
};

const mockCreateAgentSession = vi.fn<() => Promise<{ session: typeof mockSession }>>()
  .mockResolvedValue({ session: mockSession });
const mockResourceLoaderReload = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockDefaultResourceLoader = vi.fn(function MockDefaultResourceLoader() {
  return {
    reload: mockResourceLoaderReload,
  };
});
const mockSessionManagerInMemory = vi.fn(() => ({ kind: "session-manager" }));
const mockSettingsManagerInMemory = vi.fn(() => ({ kind: "settings-manager" }));
const mockCreateCodingTools = vi.fn((cwd: string, options?: Record<string, unknown>) => [`coding:${cwd}`, options ?? null]);
const mockCreateReadOnlyTools = vi.fn((cwd: string, options?: Record<string, unknown>) => [`readonly:${cwd}`, options ?? null]);
const mockSecureBashOperations = { exec: vi.fn() };
const mockSecureBackendDispose = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockCreateSecureBashBackend = vi.fn(async (options?: { mode?: string }) => {
  if (options?.mode === "local") {
    return null;
  }
  return {
    operations: mockSecureBashOperations,
    dispose: mockSecureBackendDispose,
    promptNote: "secure sandbox note",
  };
});

vi.mock("@mariozechner/pi-coding-agent", () => ({
  createAgentSession: (...args: unknown[]) => mockCreateAgentSession(...args),
  DefaultResourceLoader: mockDefaultResourceLoader,
  AuthStorage: {
    create: () => ({}),
  },
  ModelRegistry: class {
    getAll() { return []; }
    find() { return undefined; }
    getApiKey() { return Promise.resolve(null); }
  },
  SessionManager: {
    inMemory: mockSessionManagerInMemory,
  },
  SettingsManager: {
    inMemory: mockSettingsManagerInMemory,
  },
  createCodingTools: mockCreateCodingTools,
  createReadOnlyTools: mockCreateReadOnlyTools,
  codingTools: ["coding-default"],
  readOnlyTools: ["readonly-default"],
}));

vi.mock("../piSecureSandbox", () => ({
  createSecureBashBackend: (...args: unknown[]) => mockCreateSecureBashBackend(...args),
}));

// Import AFTER mock is installed
import { createPiSession, PiSessionHandle } from "../piWrapper";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Emit an event to all subscribed listeners. */
function emitEvent(event: PiSessionEvent): void {
  for (const listener of [...eventListeners]) {
    listener(event);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPrompt.mockReset();
  mockSteer.mockReset();
  mockFollowUp.mockReset();
  mockAbort.mockReset();
  mockDispose.mockReset();
  mockGetLastAssistantText.mockReset();
  mockExecuteBash.mockReset();
  mockCreateAgentSession.mockReset();
  mockCreateAgentSession.mockResolvedValue({ session: mockSession });
  mockResourceLoaderReload.mockReset();
  mockResourceLoaderReload.mockResolvedValue(undefined);
  mockDefaultResourceLoader.mockClear();
  mockSessionManagerInMemory.mockClear();
  mockSettingsManagerInMemory.mockClear();
  mockCreateCodingTools.mockClear();
  mockCreateReadOnlyTools.mockClear();
  mockCreateSecureBashBackend.mockClear();
  mockSecureBackendDispose.mockClear();
  eventListeners = [];
});

afterEach(() => {
  eventListeners = [];
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_PROJECT_NAME;
  delete process.env.AZURE_OPENAI_RESOURCE_NAME;
  delete process.env.AZURE_OPENAI_BASE_URL;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP;
});

describe("PiSessionHandle", () => {
  describe("prompt()", () => {
    test("happy path — returns output on agent_end", async () => {
      mockGetLastAssistantText.mockReturnValue("Hello from Pi!");
      mockPrompt.mockImplementation(async () => {
        // Simulate agent completing
        emitEvent({ type: "agent_end" });
      });

      const session = createPiSession();
      const result = await session.prompt("say hello");

      expect(result.success).toBe(true);
      expect(result.output).toBe("Hello from Pi!");
      expect(result.exitCode).toBe(0);
      expect(typeof result.duration).toBe("number");
      expect(mockPrompt).toHaveBeenCalledWith("say hello");
    });

    test("waits for the underlying prompt promise to settle after agent_end", async () => {
      mockGetLastAssistantText.mockReturnValue("Hello from Pi!");
      let resolvePrompt: (() => void) | undefined;
      mockPrompt.mockImplementation(() => {
        emitEvent({ type: "agent_end" });
        return new Promise<void>((resolve) => {
          resolvePrompt = resolve;
        });
      });

      const session = createPiSession();
      let settled = false;
      const pending = session.prompt("say hello").then((result) => {
        settled = true;
        return result;
      });

      await vi.waitFor(() => {
        expect(resolvePrompt).toBeTypeOf("function");
      });
      expect(settled).toBe(false);

      resolvePrompt?.();
      const result = await pending;

      expect(settled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.output).toBe("Hello from Pi!");
    });

    test("prompt error returns success=false with error message", async () => {
      mockPrompt.mockRejectedValue(new Error("model rate limited"));

      const session = createPiSession();
      const result = await session.prompt("crash please");

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("model rate limited");
    });

    test("treats assistant-side provider errors at agent_end as prompt failures", async () => {
      mockGetLastAssistantText.mockReturnValue("");
      mockPrompt.mockImplementation(async () => {
        emitEvent({
          type: "agent_end",
          messages: [
            {
              role: "assistant",
              stopReason: "error",
              errorMessage: "404 Resource not found",
            },
          ],
        });
      });

      const session = createPiSession();
      const result = await session.prompt("use provider");

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.output).toBe("404 Resource not found");
    });

    test("timeout exceeded rejects with PiTimeoutError", async () => {
      // prompt never resolves, no agent_end emitted
      mockPrompt.mockImplementation(
        () => new Promise(() => { /* hang forever */ }),
      );
      mockAbort.mockResolvedValue(undefined);

      const session = createPiSession();
      await expect(session.prompt("slow task", 50)).rejects.toThrow(
        /timed out/,
      );
    });

    test("passes options to createAgentSession", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({
        workspace: "/tmp/project",
        thinkingLevel: "high",
        agentDir: "/custom/agent",
      });
      await session.prompt("do stuff");

      expect(mockCreateAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          cwd: "/tmp/project",
          thinkingLevel: "high",
          agentDir: "/custom/agent",
        }),
      );
    });

    test("synthesizes an Azure model entry when a plain model id is provided with Azure env", async () => {
      process.env.AZURE_OPENAI_API_KEY = "azure-key";
      process.env.AZURE_OPENAI_PROJECT_NAME = "demo-resource";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5.4";

      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({
        workspace: "/tmp/project",
        model: "gpt-5.4",
      });
      await session.prompt("do azure work");

      expect(process.env.AZURE_OPENAI_RESOURCE_NAME).toBe("demo-resource");
      expect(process.env.AZURE_OPENAI_BASE_URL).toBe("https://demo-resource.openai.azure.com/openai/v1");
      expect(process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP).toBe("gpt-5.4=gpt-5.4");
      expect(mockCreateAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            id: "gpt-5.4",
            provider: "azure-openai-responses",
            api: "openai-responses",
            baseUrl: "https://demo-resource.openai.azure.com/openai/v1",
          }),
        }),
      );
    });

    test("normalizes Azure base URLs that omit the responses v1 path", async () => {
      process.env.AZURE_OPENAI_API_KEY = "azure-key";
      process.env.AZURE_OPENAI_BASE_URL = "https://demo-resource.openai.azure.com";

      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({
        workspace: "/tmp/project",
        model: "gpt-5.4",
      });
      await session.prompt("do azure work");

      expect(process.env.AZURE_OPENAI_BASE_URL).toBe("https://demo-resource.openai.azure.com/openai/v1");
      expect(mockCreateAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            baseUrl: "https://demo-resource.openai.azure.com/openai/v1",
          }),
        }),
      );
    });

    test("builds isolated ephemeral sessions with readonly tools and native local bash by default", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({
        workspace: "/tmp/project",
        toolsMode: "readonly",
        isolated: true,
        ephemeral: true,
        appendSystemPrompt: ["extra instructions"],
      });
      await session.prompt("inspect");

      expect(mockSessionManagerInMemory).toHaveBeenCalledTimes(1);
      expect(mockSettingsManagerInMemory).toHaveBeenCalledTimes(1);
      expect(mockCreateSecureBashBackend).toHaveBeenCalledWith({
        workspace: "/tmp/project",
        mode: "local",
      });
      expect(mockDefaultResourceLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          cwd: "/tmp/project",
          noExtensions: true,
          noSkills: true,
          noPromptTemplates: true,
          noThemes: true,
        }),
      );
      expect(mockCreateReadOnlyTools).toHaveBeenCalledWith(
        "/tmp/project",
        undefined,
      );
      expect(mockCreateAgentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: ["readonly:/tmp/project", null],
        }),
      );
      expect(mockSettingsManagerInMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          compaction: expect.objectContaining({
            enabled: true,
          }),
        }),
      );
    });

    test("wires the secure sandbox only when explicitly requested", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({
        workspace: "/tmp/project",
        toolsMode: "coding",
        bashSandbox: "secure",
      });
      await session.prompt("inspect");

      expect(mockCreateSecureBashBackend).toHaveBeenCalledWith({
        workspace: "/tmp/project",
        mode: "secure",
      });
      expect(mockCreateCodingTools).toHaveBeenCalledWith(
        "/tmp/project",
        expect.objectContaining({
          bash: expect.objectContaining({
            operations: mockSecureBashOperations,
          }),
        }),
      );
      expect(mockSecureBackendDispose).not.toHaveBeenCalled();
    });

    test("skips secure sandbox bootstrap when no explicit tool mode is requested", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      await session.prompt("hello");

      expect(mockCreateSecureBashBackend).not.toHaveBeenCalled();
    });

    test("lazy initialization — session created on first prompt", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      expect(session.isInitialized).toBe(false);

      await session.prompt("hello");
      expect(session.isInitialized).toBe(true);
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1);
    });

    test("reuses session across multiple prompts", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      await session.prompt("first");
      await session.prompt("second");

      // createAgentSession called only once
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1);
    });

    test("recovers from init failure on retry", async () => {
      mockCreateAgentSession
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce({ session: mockSession });
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();

      // First attempt fails
      await expect(session.prompt("hello")).rejects.toThrow("network error");
      expect(session.isInitialized).toBe(false);

      // Second attempt succeeds (initPromise was reset)
      const result = await session.prompt("hello again");
      expect(result.success).toBe(true);
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(2);
    });

    test("concurrent prompt calls only create one session", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      const [r1, r2] = await Promise.all([
        session.prompt("first"),
        session.prompt("second"),
      ]);

      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("steer()", () => {
    test("delegates to session.steer()", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");
      mockSteer.mockResolvedValue(undefined);

      const session = createPiSession();
      await session.prompt("start");
      await session.steer("change direction");

      expect(mockSteer).toHaveBeenCalledWith("change direction");
    });

    test("throws when session not initialized", async () => {
      const session = createPiSession();
      await expect(session.steer("nope")).rejects.toThrow(
        /not been initialized/,
      );
    });
  });

  describe("followUp()", () => {
    test("delegates to session.followUp()", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");
      mockFollowUp.mockResolvedValue(undefined);

      const session = createPiSession();
      await session.prompt("start");
      await session.followUp("and another thing");

      expect(mockFollowUp).toHaveBeenCalledWith("and another thing");
    });
  });

  describe("executeBash()", () => {
    test("delegates to session.executeBash()", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");
      mockExecuteBash.mockResolvedValue({
        output: "file1.txt\nfile2.txt",
        exitCode: 0,
        cancelled: false,
        truncated: false,
      });

      const session = createPiSession();
      await session.prompt("start");
      const result = await session.executeBash("ls");

      expect(result.output).toBe("file1.txt\nfile2.txt");
      expect(result.exitCode).toBe(0);
      expect(result.cancelled).toBe(false);
      expect(mockExecuteBash).toHaveBeenCalledWith("ls", undefined);
    });

    test("lazy-initializes the session before executing bash", async () => {
      mockExecuteBash.mockResolvedValue({
        output: "ok",
        exitCode: 0,
        cancelled: false,
        truncated: false,
      });

      const session = createPiSession();
      const result = await session.executeBash("pwd");

      expect(result.output).toBe("ok");
      expect(session.isInitialized).toBe(true);
      expect(mockCreateAgentSession).toHaveBeenCalledTimes(1);
      expect(mockExecuteBash).toHaveBeenCalledWith("pwd", undefined);
    });
  });

  describe("subscribe()", () => {
    test("forwards events from the agent session", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "message_start", message: {} });
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      await session.initialize();

      const events: PiSessionEvent[] = [];
      session.subscribe((event) => events.push(event));

      await session.prompt("hello");

      expect(events.some((e) => e.type === "message_start")).toBe(true);
    });
  });

  describe("dispose()", () => {
    test("calls dispose on the underlying session", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession({ toolsMode: "coding", bashSandbox: "secure" });
      await session.prompt("start");
      session.dispose();

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(mockSecureBackendDispose).toHaveBeenCalledTimes(1);
      expect(session.isInitialized).toBe(false);
    });

    test("is a no-op when not initialized", () => {
      const session = createPiSession();
      session.dispose(); // should not throw
      expect(mockDispose).not.toHaveBeenCalled();
    });
  });

  describe("sessionId", () => {
    test("returns session ID when initialized", async () => {
      mockPrompt.mockImplementation(async () => {
        emitEvent({ type: "agent_end" });
      });
      mockGetLastAssistantText.mockReturnValue("ok");

      const session = createPiSession();
      await session.prompt("start");
      expect(session.sessionId).toBe("mock-session-id");
    });

    test("returns undefined when not initialized", () => {
      const session = createPiSession();
      expect(session.sessionId).toBeUndefined();
    });
  });

  describe("createPiSession()", () => {
    test("returns a PiSessionHandle instance", () => {
      const session = createPiSession();
      expect(session).toBeInstanceOf(PiSessionHandle);
    });

    test("accepts options", () => {
      const session = createPiSession({
        model: "test-model",
        timeout: 5000,
        thinkingLevel: "medium",
      });
      expect(session).toBeInstanceOf(PiSessionHandle);
    });
  });
});
