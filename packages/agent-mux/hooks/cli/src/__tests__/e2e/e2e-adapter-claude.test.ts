import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempSessionRoot,
  runCli,
  readSessionFile,
  writeHandlerScript,
  cleanupLaunchers,
} from './helpers';

describe('adapter-claude integration via CLI (e2e)', { timeout: 30000 }, () => {
  let tmpRoot: string;
  let sessionDir: string;
  let cleanup: () => Promise<void>;
  let envFilePath: string;

  beforeEach(async () => {
    const result = await createTempSessionRoot();
    tmpRoot = result.tmpRoot;
    sessionDir = result.sessionDir;
    cleanup = result.cleanup;
    envFilePath = path.join(tmpRoot, 'claude-env.txt');
    await fs.promises.writeFile(envFilePath, '', 'utf-8');
  });

  afterEach(async () => {
    await cleanupLaunchers(tmpRoot);
    await cleanup();
  });

  function baseEnv(): Record<string, string> {
    return {
      XDG_STATE_HOME: tmpRoot,
      CLAUDE_ENV_FILE: envFilePath,
    };
  }

  function parseOutput(stdout: string): Record<string, unknown> {
    return JSON.parse(stdout.trim()) as Record<string, unknown>;
  }

  function claudeInvokeArgs(
    nativeEventName: string,
    extraArgs: string[] = [],
  ): string[] {
    return [
      'invoke',
      '--adapter', 'claude',
      '--native-event', nativeEventName,
      ...extraArgs,
    ];
  }

  it('normalizes Claude native payload fields before invoking portable handlers', async () => {
    const sessionId = 'e2e-claude-native-payload';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-payload-normalizer', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          decision: 'allow',
          additionalContext: JSON.stringify({
            phase: event.phase,
            rawEventName: event.rawEventName,
            payload: event.payload,
            execution: {
              sessionId: event.execution.sessionId,
              cwd: event.execution.cwd,
              model: event.execution.model,
              toolName: event.execution.toolName,
              toolCallId: event.execution.toolCallId
            }
          })
        }));
      });
    `);

    const result = await runCli(
      claudeInvokeArgs('PreToolUse', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: sessionId,
          cwd: '/workspace/claude-normalized',
          model: 'claude-sonnet-4-20250514',
          tool_name: 'Bash',
          tool_call_id: 'claude-tool-123',
          tool_input: { command: 'npm test', description: 'Run tests' },
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = parseOutput(result.stdout);
    const normalized = JSON.parse(String(output.additionalContext));
    expect(normalized).toEqual({
      phase: 'tool.before',
      rawEventName: 'PreToolUse',
      payload: {
        toolName: 'Bash',
        toolCallId: 'claude-tool-123',
        toolInput: { command: 'npm test', description: 'Run tests' },
      },
      execution: {
        sessionId,
        cwd: '/workspace/claude-normalized',
        model: 'claude-sonnet-4-20250514',
        toolName: 'Bash',
        toolCallId: 'claude-tool-123',
      },
    });
  });

  it('renders Claude PreToolUse native output for allow, deny, and ask decisions', async () => {
    const cases = [
      {
        name: 'allow',
        handlerOutput: {
          decision: 'allow',
          reason: 'safe to proceed',
          additionalContext: 'allow context',
        },
        expected: {
          decision: 'allow',
          reason: 'safe to proceed',
          additionalContext: 'allow context',
          metadata: {
            AGENT_ADAPTER: 'claude',
            AGENT_SESSION_ID: 'e2e-render-allow',
          },
        },
      },
      {
        name: 'deny',
        handlerOutput: {
          decision: 'deny',
          reason: 'blocked by policy',
          additionalContext: 'deny context',
        },
        expected: {
          decision: 'deny',
          reason: 'blocked by policy',
          additionalContext: 'deny context',
          metadata: {
            AGENT_ADAPTER: 'claude',
            AGENT_SESSION_ID: 'e2e-render-deny',
          },
        },
      },
      {
        name: 'ask',
        handlerOutput: {
          decision: 'ask',
          reason: 'needs approval',
          additionalContext: 'ask context',
        },
        expected: {
          decision: 'ask',
          reason: 'needs approval',
          additionalContext: 'ask context',
          metadata: {
            AGENT_ADAPTER: 'claude',
            AGENT_SESSION_ID: 'e2e-render-ask',
          },
        },
      },
    ] as const;

    for (const testCase of cases) {
      const handlerCmd = await writeHandlerScript(tmpRoot, `claude-render-${testCase.name}`, `
        process.stdout.write(JSON.stringify(${JSON.stringify(testCase.handlerOutput)}));
      `);

      const result = await runCli(
        claudeInvokeArgs('PreToolUse', [
          '--handler', handlerCmd,
        ]),
        {
          stdin: JSON.stringify({
            session_id: `e2e-render-${testCase.name}`,
            tool_name: 'Bash',
            tool_input: { command: 'npm test' },
          }),
          env: baseEnv(),
        },
      );

      expect(result.exitCode).toBe(0);
      expect(parseOutput(result.stdout)).toEqual(testCase.expected);
    }
  });

  it('renders Claude Stop output natively and preserves stop-specific fields', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-stop-native-render', `
      process.stdout.write(JSON.stringify({
        continueSession: true,
        stopReason: 'Need one more turn',
        reason: 'fallback reason',
        followUpMessage: 'Continue and fix tests',
        additionalContext: 'stop context'
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('Stop', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-claude-stop',
          reason: 'end_turn',
          last_assistant_message: 'Done.',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      continue: true,
      reason: 'Need one more turn',
      followUpMessage: 'Continue and fix tests',
      additionalContext: 'stop context',
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-claude-stop',
      },
    });
  });

  it('emits a safe Claude Stop no-op during stop-hook recursion', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-stop-recursion-noop', `
      process.stdout.write(JSON.stringify({
        continueSession: true,
        stopReason: 'should be suppressed',
        followUpMessage: 'should be suppressed',
        additionalContext: 'should be suppressed'
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('Stop', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-claude-stop-recursive',
          reason: 'end_turn',
          stop_hook_active: true,
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      continue: false,
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-claude-stop-recursive',
      },
    });
  });

  it('preserves Claude bootstrap continuity across later invoke calls', async () => {
    const sessionId = 'e2e-claude-bootstrap-continuity';
    const bootstrapPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
      cwd: '/workspace/bootstrap-continuity',
    });

    const bootstrapResult = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        stdin: bootstrapPayload,
        env: baseEnv(),
      },
    );

    expect(bootstrapResult.exitCode).toBe(0);
    expect(JSON.parse(bootstrapResult.stdout.trim()).sessionId).toBe(sessionId);

    const firstSessionData = await readSessionFile(sessionDir, sessionId);
    expect(firstSessionData).not.toBeNull();
    const firstSession = firstSessionData!['session'] as Record<string, unknown>;
    const firstCreatedAt = String(firstSession['createdAt']);

    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-bootstrap-continuity-handler', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          decision: 'noop',
          persistEnv: { ADDED_BY_INVOKE: 'yes' },
          additionalContext: JSON.stringify({
            executionSessionId: event.execution.sessionId,
            adapter: event.adapter
          })
        }));
      });
    `);

    const invokeResult = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: sessionId,
          source: 'resume',
        }),
        env: baseEnv(),
      },
    );

    expect(invokeResult.exitCode).toBe(0);
    expect(JSON.parse(String(parseOutput(invokeResult.stdout).additionalContext))).toEqual({
      executionSessionId: sessionId,
      adapter: 'claude',
    });

    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['createdAt']).toBe(firstCreatedAt);
    expect(session['cwd']).toBe('/workspace/bootstrap-continuity');
    expect((session['persistedEnv'] as Record<string, string>)['ADDED_BY_INVOKE']).toBe('yes');
  });
});
