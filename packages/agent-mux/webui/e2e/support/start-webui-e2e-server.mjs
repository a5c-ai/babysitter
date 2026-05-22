import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { RunHandleImpl } from "../../../core/dist/index.js";

const execFile = promisify(execFileCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../..");
const webuiRoot = path.join(packageRoot, "dist");
const gatewayPort = Number.parseInt(process.env.AMUX_WEBUI_E2E_PORT ?? "4175", 10);
const gatewayHost = "127.0.0.1";
const baseUrl = `http://${gatewayHost}:${gatewayPort}`;
const tempRoot = path.join(packageRoot, ".tmp", `amux-webui-e2e-fixture-${gatewayPort}`);
const stateFile = path.join(packageRoot, ".tmp", `amux-webui-e2e-state-${gatewayPort}.json`);
const workspacePath = path.join(tempRoot, "workspaces", "kanban-gap-007");
const workspaceRegistryPath = path.join(tempRoot, "kanban-workspaces.json");
const backlogFilePath = path.join(tempRoot, "kanban-backlog.json");
const eventLogDir = path.join(tempRoot, "gateway-events");
const sessionId = "session-e2e";
const codexSessionId = "codex-session-e2e";
const unexpectedCodexResumeSessionId = "codex-session-unexpected-new-id";
const issueId = "KANBAN-GAP-007";
const issueKey = "KANBAN-GAP-007";
const adminUsername = "e2e-admin";
const adminPassword = "e2e-password";
const transcriptText = "Workspace association is visible from the linked session chat.";
const codexTranscriptText = "Codex session is ready to resume without forking.";
const sessionTitle = "Workspace association review";
const codexSessionTitle = "Codex workspace review";
const sessionModel = "gpt-5.4-mini";
const codexSessionModel = "gpt-5.4-codex-mini";
const sessionAgent = "claude";
const codexSessionAgent = "codex";
const sessionCreatedAt = "2026-04-30T12:00:00.000Z";
const sessionUpdatedAt = "2026-04-30T12:05:00.000Z";
const codexSessionCreatedAt = "2026-04-30T11:00:00.000Z";
const codexSessionUpdatedAt = "2026-04-30T11:04:00.000Z";
const sessionCost = {
  totalUsd: 0.0132,
  inputTokens: 802,
  outputTokens: 224,
  thinkingTokens: 128,
  cachedTokens: 64,
};
const codexSessionCost = {
  totalUsd: 0.0091,
  inputTokens: 611,
  outputTokens: 171,
  thinkingTokens: 0,
  cachedTokens: 52,
};

process.env.KANBAN_WORKSPACE_REGISTRY_PATH = workspaceRegistryPath;
process.env.KANBAN_BACKLOG_FILE = backlogFilePath;

const { createGateway, MemoryTokenStore } = await import("../../../gateway/dist/index.js");

function ensureBuiltArtifacts() {
  const required = [
    path.join(webuiRoot, "index.html"),
    path.join(packageRoot, "../gateway/dist/index.js"),
  ];
  for (const filePath of required) {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Expected absolute path, got ${filePath}`);
    }
  }
  return Promise.all(
    required.map(async (filePath) => {
      await fs.access(filePath);
    }),
  );
}

async function execGit(args, cwd) {
  await execFile("git", args, { cwd });
}

async function initializeWorkspaceRepo() {
  await fs.rm(tempRoot, { recursive: true, force: true });
  await fs.mkdir(workspacePath, { recursive: true });

  await fs.writeFile(
    path.join(workspacePath, "README.md"),
    "# agent-mux webui e2e fixture\n\nThis workspace is used by the Playwright browser suite.\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(workspacePath, "src.txt"),
    "Workspace-linked issue context should stay visible beside the session chat.\n",
    "utf8",
  );

  try {
    await execGit(["init", "-b", "main"], workspacePath);
  } catch {
    await execGit(["init"], workspacePath);
    await execGit(["checkout", "-b", "main"], workspacePath);
  }
  await execGit(["config", "user.email", "e2e@example.com"], workspacePath);
  await execGit(["config", "user.name", "Agent Mux E2E"], workspacePath);
  await execGit(["add", "."], workspacePath);
  await execGit(["commit", "-m", "Seed agent-mux webui e2e fixture"], workspacePath);
  await execGit(["checkout", "-b", "vk/kanban-gap-007"], workspacePath);

  await fs.mkdir(path.dirname(workspaceRegistryPath), { recursive: true });
  await fs.writeFile(
    workspaceRegistryPath,
    `${JSON.stringify(
      {
        version: 1,
        workspaces: {
          [workspacePath]: {
            path: workspacePath,
            name: issueKey,
            gitRoot: workspacePath,
            branch: "vk/kanban-gap-007",
            notes: "Fixture workspace linked to KANBAN-GAP-007 for browser e2e coverage.",
          },
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function waitFor(read, timeoutMs = 5_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await read();
    if (value != null) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Timed out waiting for fixture state.");
}

class FakeGatewayRunClient {
  constructor() {
    this.runs = new Map();
    this.nativeSessions = new Map();
    this.nativeSessionDetails = new Map();
    this.lastRunOptions = null;
    this.codexResumeBehaviorEnabled = true;
    this.adapters = {
      list: () => [
        { agent: sessionAgent, displayName: "Claude" },
        { agent: codexSessionAgent, displayName: "OpenAI Codex" },
      ],
      installed: async () => [
        { agent: sessionAgent, installed: true, meetsMinVersion: true },
        { agent: codexSessionAgent, installed: true, meetsMinVersion: true },
      ],
      get: (agent) => {
        if (agent === sessionAgent) {
          return {
            adapterType: "subprocess",
            capabilities: {
              structuredSessionTransport: "persistent",
              sessionControlPlane: "self-managed",
              supportsInteractiveMode: true,
              canResume: true,
            },
          };
        }
        if (agent === codexSessionAgent) {
          return {
            adapterType: "subprocess",
            capabilities: {
              structuredSessionTransport: "restart-per-turn",
              sessionControlPlane: "self-managed",
              supportsInteractiveMode: false,
              canResume: true,
            },
          };
        }
        return undefined;
      },
    };
    this.sessions = {
      list: async (agent) =>
        (this.nativeSessions.get(agent) ?? []).map((session) => ({
          agent,
          sessionId: String(session.sessionId),
          unifiedId: `${agent}:${String(session.sessionId)}`,
          title: String(session.title ?? session.sessionId),
          createdAt: new Date(String(session.createdAt)),
          updatedAt: new Date(String(session.updatedAt)),
          turnCount: Number(session.turnCount ?? 0),
          messageCount: Number(session.messageCount ?? 0),
          model: typeof session.model === "string" ? session.model : undefined,
          cost: typeof session.cost === "object" ? session.cost : undefined,
          tags: [],
          cwd: typeof session.cwd === "string" ? session.cwd : undefined,
        })),
      get: async (agent, requestedSessionId) => {
        const detail = this.nativeSessionDetails.get(`${agent}:${requestedSessionId}`);
        if (!detail) {
          throw new Error("SESSION_NOT_FOUND");
        }
        return {
          agent,
          sessionId: requestedSessionId,
          unifiedId: `${agent}:${requestedSessionId}`,
          title: String(detail.title ?? requestedSessionId),
          createdAt: new Date(String(detail.createdAt)),
          updatedAt: new Date(String(detail.updatedAt)),
          turnCount: Number(detail.turnCount ?? 0),
          model: typeof detail.model === "string" ? detail.model : undefined,
          cost: typeof detail.cost === "object" ? detail.cost : undefined,
          tags: [],
          cwd: typeof detail.cwd === "string" ? detail.cwd : undefined,
          messages: Array.isArray(detail.messages) ? detail.messages : [],
          raw: detail,
        };
      },
    };
  }

  seedNativeSessions() {
    const claudeNativeRecord = {
      sessionId,
      title: sessionTitle,
      createdAt: sessionCreatedAt,
      updatedAt: sessionUpdatedAt,
      turnCount: 2,
      messageCount: 2,
      model: sessionModel,
      cost: sessionCost,
      cwd: workspacePath,
    };
    const codexNativeRecord = {
      sessionId: codexSessionId,
      title: codexSessionTitle,
      createdAt: codexSessionCreatedAt,
      updatedAt: codexSessionUpdatedAt,
      turnCount: 3,
      messageCount: 4,
      model: codexSessionModel,
      cost: codexSessionCost,
      cwd: workspacePath,
    };
    this.nativeSessions.set(sessionAgent, [claudeNativeRecord]);
    this.nativeSessions.set(codexSessionAgent, [codexNativeRecord]);
    this.nativeSessionDetails.set(`${sessionAgent}:${sessionId}`, {
      ...claudeNativeRecord,
      messages: [
        { role: "user", content: "Show the linked workspace context." },
        { role: "assistant", content: transcriptText, thinking: "Checking workspace association." },
      ],
    });
    this.nativeSessionDetails.set(`${codexSessionAgent}:${codexSessionId}`, {
      ...codexNativeRecord,
      messages: [
        { role: "user", content: "Review the linked workspace before the next turn." },
        { role: "assistant", content: codexTranscriptText },
      ],
    });
  }

  appendNativeSessionMessages(agent, targetSessionId, messages) {
    const key = `${agent}:${targetSessionId}`;
    const detail = this.nativeSessionDetails.get(key);
    if (!detail || !Array.isArray(detail.messages)) {
      return;
    }
    const updatedAt = new Date().toISOString();
    const nextMessages = [...detail.messages, ...messages];
    const nextTurnCount = Number(detail.turnCount ?? 0) + 1;
    const nextMessageCount = nextMessages.length;
    const nextDetail = {
      ...detail,
      updatedAt,
      turnCount: nextTurnCount,
      messageCount: nextMessageCount,
      messages: nextMessages,
    };
    this.nativeSessionDetails.set(key, nextDetail);

    const sessions = [...(this.nativeSessions.get(agent) ?? [])];
    const sessionIndex = sessions.findIndex((session) => String(session.sessionId) === targetSessionId);
    if (sessionIndex >= 0) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        updatedAt,
        turnCount: nextTurnCount,
        messageCount: nextMessageCount,
      };
      this.nativeSessions.set(agent, sessions);
    }
  }

  emitAssistantReply(runId, text, agent = sessionAgent, cost = sessionCost) {
    const active = this.runs.get(runId);
    if (!active) {
      return;
    }

    const timestamp = Date.now();
    active.handle.emit({
      type: "thinking_delta",
      runId,
      agent,
      timestamp,
      delta: "Reviewing linked workspace context.",
    });
    active.handle.emit({
      type: "text_delta",
      runId,
      agent,
      timestamp: timestamp + 1,
      delta: text,
      accumulated: text,
    });
    active.handle.emit({
      type: "cost",
      runId,
      agent,
      timestamp: timestamp + 2,
      cost,
    });
    active.handle.emit({
      type: "message_stop",
      runId,
      agent,
      timestamp: timestamp + 3,
      text,
    });
  }

  run(options) {
    this.lastRunOptions = options;
    const runId = options.runId ?? `fixture-run-${this.runs.size + 1}`;
    const handle = new RunHandleImpl({
      runId,
      agent: options.agent,
      model: options.model,
      collectEvents: false,
    });
    const inputs = [];
    handle.bindInputTransport(async (text) => {
      inputs.push(text);
      this.emitAssistantReply(runId, `Follow-up captured for the linked workspace: ${text}`);
    });

    const activeRun = {
      handle,
      inputs,
      aborted: false,
    };

    const originalAbort = handle.abort.bind(handle);
    handle.abort = async () => {
      await originalAbort();
      activeRun.aborted = true;
      handle.complete("aborted", null, "SIGTERM");
    };

    this.runs.set(runId, activeRun);
    if (this.codexResumeBehaviorEnabled && options.agent === codexSessionAgent && options.sessionId === codexSessionId) {
      setTimeout(() => {
        const active = this.runs.get(runId);
        if (!active) {
          return;
        }
        active.handle.emit({
          type: "session_start",
          runId,
          agent: codexSessionAgent,
          timestamp: Date.now(),
          sessionId: unexpectedCodexResumeSessionId,
          resumed: true,
          cwd: workspacePath,
        });
        const text = `Codex resumed the existing session: ${String(options.prompt ?? "")}`;
        this.emitAssistantReply(runId, text, codexSessionAgent, codexSessionCost);
        this.appendNativeSessionMessages(codexSessionAgent, codexSessionId, [
          { role: "user", content: String(options.prompt ?? "") },
          { role: "assistant", content: text },
        ]);
        active.handle.complete("completed", 0, null);
      }, 0);
    }
    return handle;
  }
}

async function linkWorkspace(issueWorkspacePath) {
  const response = await fetch(`${baseUrl}/api/backlog`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "link-issue-workspace",
      issueId,
      workspacePath: issueWorkspacePath,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to link workspace fixture: ${response.status} ${await response.text()}`);
  }
}

async function seedRunningSession(gateway, fakeClient) {
  fakeClient.seedNativeSessions();
  const run = await gateway.runManager.start(
    {
      agent: sessionAgent,
      model: sessionModel,
      prompt: "Show the linked workspace context.",
      cwd: workspacePath,
      sessionId,
    },
    {
      tokenId: "fixture-owner",
      name: "fixture-owner",
      remoteAddress: null,
    },
  );

  await waitFor(() => fakeClient.runs.get(run.runId));
  const timestamp = Date.now();
  const activeRun = fakeClient.runs.get(run.runId);
  activeRun.handle.emit({
    type: "session_start",
    runId: run.runId,
    agent: sessionAgent,
    timestamp,
    sessionId,
    cwd: workspacePath,
  });
  fakeClient.emitAssistantReply(run.runId, transcriptText);
  await waitFor(
    async () =>
      (await gateway.runManager.listSessions()).find(
        (session) => session.sessionId === sessionId && session.activeRunId === run.runId,
      ),
    10_000,
  );
}

async function seedCompletedCodexSession(gateway, fakeClient) {
  fakeClient.codexResumeBehaviorEnabled = false;
  try {
    const run = await gateway.runManager.start(
      {
        agent: codexSessionAgent,
        model: codexSessionModel,
        prompt: "Review the linked workspace before the next turn.",
        cwd: workspacePath,
        sessionId: codexSessionId,
      },
      {
        tokenId: "fixture-owner",
        name: "fixture-owner",
        remoteAddress: null,
      },
    );

    await waitFor(() => fakeClient.runs.get(run.runId));
    const timestamp = Date.now();
    const activeRun = fakeClient.runs.get(run.runId);
    activeRun.handle.emit({
      type: "session_start",
      runId: run.runId,
      agent: codexSessionAgent,
      timestamp,
      sessionId: codexSessionId,
      resumed: false,
      cwd: workspacePath,
    });
    fakeClient.emitAssistantReply(run.runId, codexTranscriptText, codexSessionAgent, codexSessionCost);
    activeRun.handle.complete("completed", 0, null);
    await waitFor(() => gateway.runManager.get(run.runId)?.status === "completed", 10_000);
  } finally {
    fakeClient.codexResumeBehaviorEnabled = true;
  }
}

async function writeState() {
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(
    stateFile,
    `${JSON.stringify(
      {
        baseUrl,
        adminUsername,
        adminPassword,
        sessionId,
        issueId,
        issueKey,
        workspacePath,
        transcriptText,
        codexSessionId,
        codexTranscriptText,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function main() {
  await ensureBuiltArtifacts();
  await initializeWorkspaceRepo();

  const tokenStore = new MemoryTokenStore();
  const fakeClient = new FakeGatewayRunClient();
  const gateway = createGateway({
    host: gatewayHost,
    port: gatewayPort,
    tokenStore,
    tokenStoreKind: "memory",
    eventLogDir,
    enableWebui: true,
    webuiRoot,
    client: fakeClient,
    shutdownGraceMs: 1_000,
    bootstrapAuth: {
      mode: "local-dev",
      adminUsername,
      adminPassword,
      tokenSeed: null,
      bootstrapTokenName: "playwright-bootstrap",
    },
  });

  await gateway.start();
  await linkWorkspace(workspacePath);
  await seedRunningSession(gateway, fakeClient);
  await seedCompletedCodexSession(gateway, fakeClient);
  await writeState();

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) {
      return;
    }
    stopping = true;
    try {
      await gateway.stop();
    } finally {
      await fs.rm(stateFile, { force: true });
      process.exit(signal ? 0 : 1);
    }
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  console.log(`agent-mux webui e2e gateway ready at ${baseUrl}`);
  setInterval(() => {}, 60_000).unref();
}

main().catch(async (error) => {
  console.error(error);
  await fs.rm(stateFile, { force: true }).catch(() => {});
  process.exit(1);
});
