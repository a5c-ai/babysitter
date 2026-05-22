import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const RUNTIME_HOOK_DIR_PREFIX = 'amux-run-';
const STALE_RUNTIME_HOOK_AGE_MS = 24 * 60 * 60 * 1000;
const CLAUDE_HOOK_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'Stop',
] as const;
const CLAUDE_HOOK_SHIM_SOURCE = [
  "import fs from 'node:fs/promises';",
  "import net from 'node:net';",
  "import path from 'node:path';",
  "import { fileURLToPath } from 'node:url';",
  '',
  "const eventName = process.argv[2] ?? 'UnknownHook';",
  "const configDir = path.dirname(fileURLToPath(import.meta.url));",
  "const socketPath = process.env.AMUX_CLAUDE_HOOK_SOCKET;",
  "const secretPath = path.join(configDir, 'secret');",
  '',
  'function readStdin() {',
  '  return new Promise((resolve, reject) => {',
  "    let input = '';",
  "    process.stdin.setEncoding('utf8');",
  "    process.stdin.on('data', (chunk) => {",
  '      input += chunk;',
  '    });',
  "    process.stdin.on('end', () => resolve(input));",
  "    process.stdin.on('error', reject);",
  '  });',
  '}',
  '',
  'try {',
  '  if (!socketPath) {',
  "    throw new Error('AMUX_CLAUDE_HOOK_SOCKET is not set');",
  '  }',
  '',
  '  const [secret, rawInput] = await Promise.all([',
  "    fs.readFile(secretPath, 'utf8'),",
  '    readStdin(),',
  '  ]);',
  '',
  "  const payload = rawInput.trim().length > 0 ? JSON.parse(rawInput) : {};",
  '  const response = await new Promise((resolve, reject) => {',
  '    const socket = net.createConnection(socketPath);',
  "    let body = '';",
  "    socket.setEncoding('utf8');",
  "    socket.on('connect', () => {",
  '      socket.write(',
  '        JSON.stringify({',
  '          secret: secret.trim(),',
  '          event: eventName,',
  '          payload,',
  "        }) + '\\n',",
  '      );',
  '    });',
  "    socket.on('data', (chunk) => {",
  '      body += chunk;',
  '    });',
  "    socket.on('end', () => resolve(body));",
  "    socket.on('error', reject);",
  '  });',
  '',
  '  const parsed = response ? JSON.parse(String(response)) : {};',
  "  if (typeof parsed.stdout === 'string' && parsed.stdout.length > 0) {",
  '    process.stdout.write(parsed.stdout);',
  '  }',
  '  process.exit(Number.isInteger(parsed.exitCode) ? parsed.exitCode : 0);',
  '} catch (error) {',
  '  const message = error instanceof Error ? error.message : String(error);',
  "  process.stderr.write(`${message}\\n`);",
  '  process.exit(1);',
  '}',
  '',
].join('\n');

export interface ClaudeRuntimeHookConfig {
  dir: string;
  secret: string;
  secretPath: string;
  settingsPath: string;
  shimPath: string;
  socketPath: string;
}

function buildSocketPath(runId: string): string {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\amux-claude-${runId}-${crypto.randomBytes(4).toString('hex')}`;
  }
  return path.join(os.tmpdir(), `${RUNTIME_HOOK_DIR_PREFIX}${runId}`, 'hooks.sock');
}

export async function cleanupStaleClaudeRuntimeHookDirs(): Promise<void> {
  const root = os.tmpdir();
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const now = Date.now();

  await Promise.all(entries.map(async (entry) => {
    if (!entry.isDirectory() || !entry.name.startsWith(RUNTIME_HOOK_DIR_PREFIX)) {
      return;
    }
    const fullPath = path.join(root, entry.name);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) return;
    if (now - stat.mtimeMs < STALE_RUNTIME_HOOK_AGE_MS) return;
    await fs.rm(fullPath, { recursive: true, force: true }).catch(() => {});
  }));
}

export async function removeClaudeRuntimeHookConfig(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

export async function createClaudeRuntimeHookConfig(runId: string): Promise<ClaudeRuntimeHookConfig> {
  await cleanupStaleClaudeRuntimeHookDirs();

  const dir = path.join(os.tmpdir(), `${RUNTIME_HOOK_DIR_PREFIX}${runId}`);
  const secret = crypto.randomBytes(24).toString('hex');
  const secretPath = path.join(dir, 'secret');
  const settingsPath = path.join(dir, 'settings.json');
  const shimPath = path.join(dir, 'hook-shim.mjs');
  const socketPath = buildSocketPath(runId);

  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(secretPath, secret, { encoding: 'utf8', mode: 0o600 });
  await fs.writeFile(shimPath, CLAUDE_HOOK_SHIM_SOURCE, { encoding: 'utf8', mode: 0o700 });

  const hooks = Object.fromEntries(
    CLAUDE_HOOK_EVENTS.map((eventName) => [
      eventName,
      [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `${JSON.stringify(process.execPath)} ${JSON.stringify(shimPath)} ${eventName}`,
            },
          ],
        },
      ],
    ]),
  );

  await fs.writeFile(
    settingsPath,
    JSON.stringify({ hooks }, null, 2),
    { encoding: 'utf8', mode: 0o600 },
  );

  return {
    dir,
    secret,
    secretPath,
    settingsPath,
    shimPath,
    socketPath,
  };
}
