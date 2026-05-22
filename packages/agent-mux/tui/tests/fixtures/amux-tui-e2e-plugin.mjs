import fs from 'node:fs';
import path from 'node:path';

const sessions = [
  {
    agent: 'tui-e2e',
    sessionId: 'sess-beta',
    title: 'beta transcript',
    turnCount: 2,
    createdAt: '2026-04-24T08:02:00.000Z',
    updatedAt: '2026-04-24T08:03:00.000Z',
    messages: [
      {
        role: 'assistant',
        content: 'beta transcript',
        timestamp: '2026-04-24T08:02:30.000Z',
      },
      {
        role: 'user',
        content: 'resume me',
        timestamp: '2026-04-24T08:02:40.000Z',
      },
    ],
  },
];

function sessionDir() {
  const dir = process.env.AMUX_TUI_E2E_STATE_DIR || path.join(process.cwd(), '.tmp-amux-tui-e2e');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function eventsFile() {
  return path.join(sessionDir(), 'events.jsonl');
}

function appendEvent(event) {
  fs.appendFileSync(eventsFile(), `${JSON.stringify({ recordedAt: new Date().toISOString(), ...event })}\n`);
}

function ensureSessionFiles() {
  const dir = sessionDir();
  for (const session of sessions) {
    const filePath = path.join(dir, `${session.sessionId}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ sessionId: session.sessionId }, null, 2));
    }
  }
  return dir;
}

function sessionForPath(filePath) {
  const sessionId = path.basename(filePath, path.extname(filePath));
  const session = sessions.find((entry) => entry.sessionId === sessionId);
  if (!session) {
    throw new Error(`Unknown session fixture: ${filePath}`);
  }
  appendEvent({ type: 'parse', sessionId });
  return session;
}

function createRun(options) {
  const prompt = Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt;
  const sessionId = options.sessionId || 'sess-created';
  appendEvent({ type: 'execute', sessionId, prompt });
  const events = [
    {
      type: 'session_start',
      runId: `run-${sessionId}`,
      agent: 'tui-e2e',
      timestamp: Date.now(),
      sessionId,
      resumed: Boolean(options.sessionId),
    },
    {
      type: 'text_delta',
      runId: `run-${sessionId}`,
      agent: 'tui-e2e',
      timestamp: Date.now() + 1,
      delta: `reply:${sessionId}:${prompt}\n`,
      accumulated: `reply:${sessionId}:${prompt}\n`,
    },
  ];

  let index = 0;
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (index >= events.length) {
        return { value: undefined, done: true };
      }
      return { value: events[index++], done: false };
    },
  };
}

const adapter = {
  agent: 'tui-e2e',
  displayName: 'TUI E2E Adapter',
  cliCommand: 'tui-e2e',
  adapterType: 'programmatic',
  minVersion: '0.0.0',
  capabilities: {
    agent: 'tui-e2e',
    displayName: 'TUI E2E Adapter',
    streaming: true,
    thinking: false,
    thinkingEffort: false,
    thinkingEffortLevels: [],
    thinkingBudget: false,
    maxTurns: false,
    systemPrompt: false,
    systemPromptMode: [],
    temperature: false,
    temperatureRange: undefined,
    topP: false,
    topK: false,
    maxOutputTokens: false,
    outputFormats: ['text'],
    attachments: false,
    imageAttachments: false,
    sessionPersistence: false,
    canResume: true,
    canFork: false,
    supportsMCP: false,
    approvalModes: ['prompt'],
    interactiveInput: false,
    agentDocs: false,
    outputChannel: 'stdout',
    authMethods: [],
    authFiles: [],
    pluginFormats: [],
    pluginRegistry: undefined,
    installMethods: [],
  },
  models: [],
  configSchema: {
    agent: 'tui-e2e',
    version: 1,
    fields: [],
    configFormat: 'json',
    supportsProjectConfig: false,
  },
  buildSpawnArgs() {
    return {
      command: 'tui-e2e',
      args: [],
      env: {},
      cwd: process.cwd(),
      usePty: false,
    };
  },
  parseEvent() {
    return null;
  },
  async detectAuth() {
    return { status: 'authenticated' };
  },
  getAuthGuidance() {
    return { steps: [], envVars: [], links: [] };
  },
  sessionDir() {
    return ensureSessionFiles();
  },
  async parseSessionFile(filePath) {
    return sessionForPath(filePath);
  },
  async listSessionFiles() {
    const dir = ensureSessionFiles();
    appendEvent({ type: 'list', sessionIds: sessions.map((session) => session.sessionId) });
    return sessions.map((session) => path.join(dir, `${session.sessionId}.json`));
  },
  async readConfig() {
    return {};
  },
  async writeConfig() {},
  execute(options) {
    return createRun(options);
  },
};

export default {
  name: 'tui-e2e-plugin',
  register(ctx) {
    ensureSessionFiles();
    ctx.client.adapters.register(adapter);
  },
};
