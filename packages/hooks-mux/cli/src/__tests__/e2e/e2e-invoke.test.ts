/**
 * E2E integration tests for the `invoke` command.
 *
 * These tests exercise the full CLI pipeline with real child processes,
 * real adapter resolution, real session store, and real handler subprocesses.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempSessionRoot,
  runCli,
  readSessionFile,
  writeHandlerScript,
  cleanupLaunchers,
} from './helpers';

describe('invoke — full CLI pipeline (e2e)', { timeout: 30000 }, () => {
  let tmpRoot: string;
  let sessionDir: string;
  let cleanup: () => Promise<void>;
  let envFilePath: string;

  beforeEach(async () => {
    const result = await createTempSessionRoot();
    tmpRoot = result.tmpRoot;
    sessionDir = result.sessionDir;
    cleanup = result.cleanup;
    // Create a temp file for CLAUDE_ENV_FILE
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

  function codexInvokeArgs(
    nativeEventName: string,
    extraArgs: string[] = [],
  ): string[] {
    return [
      'invoke',
      '--adapter', 'codex',
      '--native-event', nativeEventName,
      ...extraArgs,
    ];
  }

  it('session-start bootstrap-only creates session file', async () => {
    const sessionId = 'e2e-bootstrap-sess-1';
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--bootstrap-only',
        '--json',
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.status).toBe('bootstrapped');
    expect(output.sessionId).toBe(sessionId);

    // Verify session file was created on disk
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();

    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['sessionId']).toBe(sessionId);
    expect(session['adapter']).toBe('claude');
    expect(session['persistedEnv']).toEqual(expect.objectContaining({
      AGENT_SESSION_ID: sessionId,
    }));

    const envFileContent = await fs.promises.readFile(envFilePath, 'utf-8');
    expect(envFileContent).toContain(`export AGENT_SESSION_ID="${sessionId}"`);
  });

  it('session-start with handler that adds persistEnv', async () => {
    const sessionId = 'e2e-handler-env-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'persist-env-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { MY_CUSTOM_VAR: 'hello_world' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    // Verify CLAUDE_ENV_FILE was written to
    const envFileContent = await fs.promises.readFile(envFilePath, 'utf-8');
    expect(envFileContent).toContain('export MY_CUSTOM_VAR="hello_world"');

    // Verify session was updated with persistedEnv
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const persistedEnv = session['persistedEnv'] as Record<string, string>;
    expect(persistedEnv['MY_CUSTOM_VAR']).toBe('hello_world');
  });

  it('exports persisted env through CLAUDE_ENV_FILE to downstream child processes', async () => {
    const sessionId = 'e2e-child-inherit-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'child-inherit-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { DOWNSTREAM_VISIBLE: 'yes' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const stdout = execFileSync(
      'bash',
      [
        '-lc',
        'source "$CLAUDE_ENV_FILE" && node -e \'process.stdout.write(process.env.DOWNSTREAM_VISIBLE ?? "")\'',
      ],
      {
        env: {
          ...process.env,
          CLAUDE_ENV_FILE: envFilePath,
        },
        encoding: 'utf-8',
      },
    );

    expect(stdout).toBe('yes');
  });

  it('tool.before deny decision from handler', async () => {
    const sessionId = 'e2e-deny-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'deny-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'deny',
        reason: 'blocked by policy'
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf /' },
    });

    const result = await runCli(
      claudeInvokeArgs('PreToolUse', [
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.decision).toBe('deny');
    expect(output.reason).toContain('blocked by policy');
  });

  it('multiple handlers fan-out merges env from both', async () => {
    const sessionId = 'e2e-fanout-sess';

    const handler1 = await writeHandlerScript(tmpRoot, 'handler1', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { HANDLER1_VAR: 'value1' }
      }));
    `);
    const handler2 = await writeHandlerScript(tmpRoot, 'handler2', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { HANDLER2_VAR: 'value2' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handler1,
        '--handler', handler2,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    // Verify session was updated with both env vars
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const persistedEnv = session['persistedEnv'] as Record<string, string>;
    expect(persistedEnv['HANDLER1_VAR']).toBe('value1');
    expect(persistedEnv['HANDLER2_VAR']).toBe('value2');
  });

  it('handler receives execution context env vars', async () => {
    const sessionId = 'e2e-exec-ctx-sess';

    // Handler that echoes execution-context env vars back through Claude-native output.
    const handlerCmd = await writeHandlerScript(tmpRoot, 'ctx-echo-handler', `
      const result = {
        decision: 'allow',
        additionalContext: JSON.stringify({
          AGENT_SESSION_ID: process.env.AGENT_SESSION_ID || '',
          AGENT_ADAPTER: process.env.AGENT_ADAPTER || ''
        })
      };
      process.stdout.write(JSON.stringify(result));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = parseOutput(result.stdout);
    const ctx = JSON.parse(String(output.additionalContext));
    expect(ctx.AGENT_SESSION_ID).toBe(sessionId);
    expect(ctx.AGENT_ADAPTER).toBe('claude');
  });

  it('Claude SessionStart invoke renders reloadSkills and sessionTitle hook output', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-sessionstart-reload-skills', `
      process.stdout.write(JSON.stringify({
        reloadSkills: true,
        sessionTitle: 'Skills ready'
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-sessionstart-reload-skills',
          source: 'startup',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      additionalContext: '',
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        reloadSkills: true,
        sessionTitle: 'Skills ready',
      },
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-sessionstart-reload-skills',
      },
    });
  });

  it('Claude MessageDisplay invoke normalizes and renders displayContent', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-message-display', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          displayContent: JSON.stringify({
            phase: event.phase,
            payload: event.payload,
          })
        }));
      });
    `);

    const result = await runCli(
      claudeInvokeArgs('MessageDisplay', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-message-display',
          turn_id: 'turn-1',
          message_id: 'message-1',
          index: 0,
          final: false,
          delta: 'hello\\n',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      hookSpecificOutput: {
        hookEventName: 'MessageDisplay',
        displayContent: JSON.stringify({
          phase: 'message.received',
          payload: {
            turnId: 'turn-1',
            messageId: 'message-1',
            index: 0,
            final: false,
            delta: 'hello\\n',
          },
        }),
      },
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-message-display',
      },
    });
  });

  it('invoke with no handlers produces noop output', async () => {
    const stdinPayload = JSON.stringify({
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart'),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = parseOutput(result.stdout);
    expect(output).toEqual({
      additionalContext: '',
      metadata: {
        AGENT_ADAPTER: 'claude',
      },
    });
  });

  it('invoke with explicit session-id flag overrides stdin session_id', async () => {
    const explicitId = 'e2e-explicit-id';
    const stdinPayload = JSON.stringify({
      session_id: 'stdin-id-should-be-ignored',
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--bootstrap-only',
        '--session-id', explicitId,
        '--json',
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output.sessionId).toBe(explicitId);

    // Verify the session file was saved with the explicit ID
    const sessionData = await readSessionFile(sessionDir, explicitId);
    expect(sessionData).not.toBeNull();
  });

  it('handler that crashes is handled by fail-open policy', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'crash-handler', `
      process.exit(1);
    `);

    const stdinPayload = JSON.stringify({
    });

    // session.start phase defaults to fail-open, so this should not crash the CLI
    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    const output = parseOutput(result.stdout);
    expect(output).toEqual({
      additionalContext: '',
      metadata: {
        AGENT_ADAPTER: 'claude',
      },
    });
  });

  it('handler with contextVars updates session contextVars', async () => {
    const sessionId = 'e2e-ctxvars-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'ctxvars-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'noop',
        contextVars: { myKey: 'myValue', anotherKey: 'anotherValue' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const result = await runCli(
      claudeInvokeArgs('SessionStart', [
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const contextVars = session['contextVars'] as Record<string, string>;
    expect(contextVars['myKey']).toBe('myValue');
    expect(contextVars['anotherKey']).toBe('anotherValue');
  });

  it('Claude invoke resolves canonical phases from --native-event without env fallback', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'phase-echo-handler', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          decision: 'allow',
          additionalContext: JSON.stringify({
            phase: event.phase,
            rawEventName: event.rawEventName,
          }),
        }));
      });
    `);

    const cases = [
      {
        nativeEventName: 'SessionStart',
        expectedPhase: 'session.start',
        stdin: {
          session_id: 'e2e-phase-session-start',
          source: 'startup',
        },
      },
      {
        nativeEventName: 'PreToolUse',
        expectedPhase: 'tool.before',
        stdin: {
          session_id: 'e2e-phase-pre-tool',
          tool_name: 'Bash',
          tool_input: { command: 'npm test' },
        },
      },
      {
        nativeEventName: 'PostToolUse',
        expectedPhase: 'tool.after',
        stdin: {
          session_id: 'e2e-phase-post-tool',
          tool_name: 'Bash',
          tool_input: { command: 'npm test' },
          tool_response: 'ok',
        },
      },
      {
        nativeEventName: 'Stop',
        expectedPhase: 'turn.stop',
        stdin: {
          session_id: 'e2e-phase-stop',
          reason: 'end_turn',
          last_assistant_message: 'Done.',
        },
      },
    ] as const;

    for (const testCase of cases) {
      const result = await runCli(
        claudeInvokeArgs(testCase.nativeEventName, [
          '--handler', handlerCmd,
        ]),
        {
          stdin: JSON.stringify(testCase.stdin),
          env: baseEnv(),
        },
      );

      expect(result.exitCode).toBe(0);

      const output = parseOutput(result.stdout);
      const normalized = JSON.parse(String(output.additionalContext));
      expect(normalized).toEqual({
        phase: testCase.expectedPhase,
        rawEventName: testCase.nativeEventName,
      });
    }
  });

  it('Claude invoke passes normalized payload shape to portable handlers', async () => {
    const sessionId = 'e2e-normalized-payload';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'normalized-payload-handler', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          decision: 'allow',
          additionalContext: JSON.stringify({
            phase: event.phase,
            payload: event.payload,
            execution: {
              sessionId: event.execution.sessionId,
              toolName: event.execution.toolName,
              toolCallId: event.execution.toolCallId,
              cwd: event.execution.cwd,
            },
          }),
        }));
      });
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      cwd: '/workspace/project',
      tool_name: 'Bash',
      tool_call_id: 'tool-call-123',
      tool_input: { command: 'npm test', description: 'Run tests' },
    });

    const result = await runCli(
      claudeInvokeArgs('PreToolUse', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = parseOutput(result.stdout);
    const normalized = JSON.parse(String(output.additionalContext));
    expect(normalized.phase).toBe('tool.before');
    expect(normalized.payload).toEqual({
      toolName: 'Bash',
      toolCallId: 'tool-call-123',
      toolInput: { command: 'npm test', description: 'Run tests' },
    });
    expect(normalized.execution).toEqual({
      sessionId,
      toolName: 'Bash',
      toolCallId: 'tool-call-123',
      cwd: '/workspace/project',
    });
  });

  it('Claude PreToolUse invoke renders native output fields', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-pretool-renderer', `
      process.stdout.write(JSON.stringify({
        decision: 'ask',
        reason: 'Need confirmation',
        additionalContext: 'context from handler',
        persistEnv: { SHOULD_NOT_RENDER: '1' }
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('PreToolUse', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-pretool-renderer',
          tool_name: 'Bash',
          tool_input: { command: 'npm test' },
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      decision: 'ask',
      reason: 'Need confirmation',
      additionalContext: 'context from handler',
      persistEnv: { SHOULD_NOT_RENDER: '1' },
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-pretool-renderer',
      },
    });
  });

  it('Claude PostToolUse invoke renders native output fields', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-posttool-renderer', `
      process.stdout.write(JSON.stringify({
        reason: 'ignored by renderer',
        additionalContext: 'post-tool context',
        metadata: { ignored: true }
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('PostToolUse', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-posttool-renderer',
          tool_name: 'Bash',
          tool_input: { command: 'npm test' },
          tool_response: 'ok',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(parseOutput(result.stdout)).toEqual({
      additionalContext: 'post-tool context',
      metadata: {
        AGENT_ADAPTER: 'claude',
        AGENT_SESSION_ID: 'e2e-posttool-renderer',
      },
    });
  });

  it('Claude Stop invoke renders native output fields', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-stop-renderer', `
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
          session_id: 'e2e-stop-renderer',
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
        AGENT_SESSION_ID: 'e2e-stop-renderer',
      },
    });
  });

  it('Claude Stop recursion guard suppresses continue during stop-hook recursion', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'claude-stop-recursion', `
      process.stdout.write(JSON.stringify({
        continueSession: true,
        followUpMessage: 'This should be suppressed'
      }));
    `);

    const result = await runCli(
      claudeInvokeArgs('Stop', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: 'e2e-stop-recursion',
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
        AGENT_SESSION_ID: 'e2e-stop-recursion',
      },
    });
  });

  it('Codex bootstrap-only persists session cwd from adapter-specific normalization', async () => {
    const sessionId = 'e2e-codex-bootstrap-sess';

    const result = await runCli(
      codexInvokeArgs('SessionStart', [
        '--bootstrap-only',
        '--json',
      ]),
      {
        stdin: JSON.stringify({
          session_id: sessionId,
          cwd: '/workspace/codex-from-stdin',
          model: 'o3',
          source: 'startup',
        }),
        env: {
          ...baseEnv(),
          PWD: '/env/fallback-cwd',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.status).toBe('bootstrapped');
    expect(output.sessionId).toBe(sessionId);

    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();

    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['adapter']).toBe('codex');
    expect(session['cwd']).toBe('/workspace/codex-from-stdin');
  });

  it('Codex invoke uses adapter normalizer and renderer through the real loader path', async () => {
    const sessionId = 'e2e-codex-loader-path';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'codex-loader-path-handler', `
      const chunks = [];
      process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      process.stdin.on('end', () => {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        process.stdout.write(JSON.stringify({
          decision: 'deny',
          reason: JSON.stringify({
            phase: event.phase,
            payload: event.payload,
            execution: {
              sessionId: event.execution.sessionId,
              cwd: event.execution.cwd,
              model: event.execution.model,
              source: event.execution.source,
              toolName: event.execution.toolName,
              toolCallId: event.execution.toolCallId
            }
          }),
          continueSession: false,
          suppressOutput: true,
          additionalContext: 'should-be-dropped',
          systemMessage: 'should-be-dropped'
        }));
      });
    `);

    const result = await runCli(
      codexInvokeArgs('PreToolUse', [
        '--handler', handlerCmd,
      ]),
      {
        stdin: JSON.stringify({
          session_id: sessionId,
          cwd: '/workspace/codex-tool',
          model: 'o3',
          source: 'user',
          tool_name: 'bash',
          tool_call_id: 'codex-tool-123',
          tool_input: { command: 'npm test' },
        }),
        env: {
          ...baseEnv(),
          PWD: '/env/fallback-cwd',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = parseOutput(result.stdout);
    expect(output).toEqual({
      decision: 'deny',
      reason: expect.any(String),
      metadata: {
        AGENT_ADAPTER: 'codex',
        AGENT_SESSION_ID: 'e2e-codex-loader-path',
      },
    });

    const normalized = JSON.parse(String(output.reason));
    expect(normalized).toEqual({
      phase: 'tool.before',
      payload: {
        session_id: sessionId,
        cwd: '/workspace/codex-tool',
        model: 'o3',
        source: 'user',
        tool_name: 'bash',
        tool_call_id: 'codex-tool-123',
        tool_input: { command: 'npm test' },
      },
      execution: {
        sessionId,
        cwd: '/workspace/codex-tool',
        model: 'o3',
        source: 'user',
        toolName: 'bash',
        toolCallId: 'codex-tool-123',
      },
    });
  });
});
