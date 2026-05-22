import * as net from 'node:net';

import { formatHookResult } from '@a5c-ai/agent-mux-core';
import type { RuntimeHookDispatcher } from '@a5c-ai/agent-mux-core';

const HOOK_EVENT_MAP = {
  PreToolUse: { kind: 'preToolUse', mode: 'blocking' },
  PostToolUse: { kind: 'postToolUse', mode: 'nonblocking' },
  UserPromptSubmit: { kind: 'userPromptSubmit', mode: 'blocking' },
  SessionStart: { kind: 'sessionStart', mode: 'nonblocking' },
  SessionEnd: { kind: 'sessionEnd', mode: 'nonblocking' },
  Stop: { kind: 'stop', mode: 'nonblocking' },
} as const;

type HookEventName = keyof typeof HOOK_EVENT_MAP;

export interface ClaudeHookSocketServer {
  close(): Promise<void>;
}

export async function startClaudeHookSocketServer(options: {
  socketPath: string;
  secret: string;
  dispatcher: RuntimeHookDispatcher;
}): Promise<ClaudeHookSocketServer> {
  const server = net.createServer((socket) => {
    let body = '';
    let settled = false;
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      body += chunk;
      if (settled || !body.includes('\n')) {
        return;
      }
      settled = true;
      const line = body.slice(0, body.indexOf('\n')).trim();
      void handleRequest(line).then((response) => {
        socket.end(JSON.stringify(response));
      });
    });
    socket.on('error', () => {});
  });

  const handleRequest = async (
    rawBody: string,
  ): Promise<{ stdout: string; exitCode: number }> => {
    try {
      const request = rawBody.trim().length > 0
        ? JSON.parse(rawBody) as { secret?: string; event?: string; payload?: unknown }
        : {};
      if (request.secret !== options.secret) {
        return formatHookResult('claude', 'UnknownHook', {
          decision: 'deny',
          message: 'Invalid runtime hook secret',
        });
      }

      const eventName = request.event as HookEventName | undefined;
      if (!eventName || !(eventName in HOOK_EVENT_MAP)) {
        return formatHookResult('claude', request.event ?? 'UnknownHook', {
          decision: 'allow',
        });
      }

      const hookSpec = HOOK_EVENT_MAP[eventName];
      const result = await options.dispatcher.dispatch(
        hookSpec.kind,
        request.payload ?? {},
        new AbortController().signal,
        hookSpec.mode,
      );
      if (hookSpec.mode === 'blocking') {
        const decision = result ?? { decision: 'allow' as const };
        return formatHookResult('claude', eventName, {
          decision: decision.decision,
          message: decision.decision === 'deny' ? decision.reason : undefined,
        });
      }

      return formatHookResult('claude', eventName, { decision: 'allow' });
    } catch (error) {
      return formatHookResult('claude', 'UnknownHook', {
        decision: 'deny',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.socketPath, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    close: async () => {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
