import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { PhaseMapping } from '../types/lifecycle';
import type { UnifiedHookEvent } from '../types/event';
import { normalizeEvent } from '../normalizer/normalize';
import { clearAsyncHandlerRecords, getAsyncHandlerRecords, runHandler, runPlan } from '../normalizer/runner';
import { HandlerTimeoutError } from '../normalizer/errors';

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
];

function makeEvent(): UnifiedHookEvent {
  return normalizeEvent({
    adapter: 'claude',
    rawEventName: 'PreToolUse',
    stdinPayload: { tool_name: 'Bash' },
    adapterMappings: CLAUDE_MAPPINGS,
  });
}

describe('Handler timeout enforcement', () => {
  it('should throw HandlerTimeoutError when handler exceeds timeout', async () => {
    const event = makeEvent();

    // Handler that sleeps for 5 seconds but timeout is 500ms
    await expect(
      runHandler(
        event,
        {
          source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
          handler: 'slow-handler',
          priority: 1,
        },
        500,
      ),
    ).rejects.toThrow(HandlerTimeoutError);
  }, 10000);

  it('should succeed when handler completes within timeout', async () => {
    const event = makeEvent();

    const result = await runHandler(
      event,
      {
        source: 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'fast\'}))"',
        handler: 'fast-handler',
        priority: 1,
      },
      5000,
    );

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('fast');
  });

  describe('runPlan with entry-level timeoutMs', () => {
    it('should use entry timeoutMs to kill slow handler (fail-open)', async () => {
      const event = makeEvent();

      const results = await runPlan(
        event,
        [
          {
            id: 'slow',
            pluginId: 'plugin-slow',
            phase: 'tool.before',
            priority: 1,
            timeoutMs: 500,
            handler: {
              source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
              handler: 'slow-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].metadata?.errorCode).toBe('HANDLER_TIMEOUT');
    }, 10000);

    it('should preserve statusMessage metadata when a handler fails open', async () => {
      const event = makeEvent();

      const results = await runPlan(
        event,
        [
          {
            id: 'slow-status',
            pluginId: 'plugin-slow',
            phase: 'tool.before',
            priority: 1,
            timeoutMs: 500,
            statusMessage: 'Checking policy',
            handler: {
              source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
              handler: 'slow-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].metadata).toMatchObject({
        error: true,
        errorCode: 'HANDLER_TIMEOUT',
        handlerId: 'slow-status',
        statusMessage: 'Checking policy',
      });
    }, 10000);

    it('should propagate HandlerTimeoutError under fail-closed policy', async () => {
      const event = makeEvent();

      await expect(
        runPlan(
          event,
          [
            {
              id: 'slow',
              pluginId: 'plugin-slow',
              phase: 'tool.before',
              priority: 1,
              timeoutMs: 500,
              handler: {
                source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
                handler: 'slow-handler',
                priority: 1,
              },
            },
          ],
          { defaultPolicy: 'fail-closed' },
        ),
      ).rejects.toThrow(HandlerTimeoutError);
    }, 10000);

    it('should use global handlerTimeoutMs when entry has no timeoutMs', async () => {
      const event = makeEvent();

      const results = await runPlan(
        event,
        [
          {
            id: 'slow',
            pluginId: 'plugin-slow',
            phase: 'tool.before',
            priority: 1,
            // no timeoutMs on entry
            handler: {
              source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
              handler: 'slow-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open', handlerTimeoutMs: 500 },
      );

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].metadata?.errorCode).toBe('HANDLER_TIMEOUT');
    }, 10000);

    it('should prefer entry timeoutMs over global handlerTimeoutMs', async () => {
      const event = makeEvent();

      // Global timeout is very short (100ms) but entry has generous timeout
      const result = await runPlan(
        event,
        [
          {
            id: 'fast',
            pluginId: 'plugin-fast',
            phase: 'tool.before',
            priority: 1,
            timeoutMs: 5000, // generous entry timeout overrides global
            handler: {
              source: 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'ok\'}))"',
              handler: 'fast-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open', handlerTimeoutMs: 100 },
      );

      expect(result).toHaveLength(1);
      expect(result[0].decision).toBe('allow');
    });
  });

  it('uses entry shell selection when provided', async () => {
    const event = makeEvent();
    const marker = path.join(os.tmpdir(), `hooks-shell-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const shellPath = path.join(os.tmpdir(), `hooks-custom-shell-${Date.now()}-${Math.random().toString(36).slice(2)}.sh`);
    await fs.promises.writeFile(
      shellPath,
      `#!/bin/sh\necho custom-shell > "${marker}"\nexec /bin/sh "$@"\n`,
      'utf-8',
    );
    await fs.promises.chmod(shellPath, 0o755);

    try {
      const result = await runPlan(
        event,
        [
          {
            id: 'custom-shell',
            pluginId: 'plugin-shell',
            phase: 'tool.before',
            priority: 1,
            shell: shellPath,
            handler: {
              source: 'printf \'{"decision":"noop","metadata":{"shellRan":true}}\'',
              handler: 'shell-handler',
              priority: 1,
            },
          },
        ],
      );

      expect(result).toHaveLength(1);
      expect(result[0].metadata?.shellRan).toBe(true);
      expect(await fs.promises.readFile(marker, 'utf-8')).toContain('custom-shell');
    } finally {
      await fs.promises.rm(shellPath, { force: true }).catch(() => {/* ignore */});
      await fs.promises.rm(marker, { force: true }).catch(() => {/* ignore */});
    }
  });

  it('passes only Claude compatibility persisted env and preserves AGENT precedence', async () => {
    const event = makeEvent();
    event.execution.sessionId = 'runtime-session';
    event.execution.cwd = '/workspace/root';
    event.execution.persistedEnv = {
      CLAUDE_ENV_FILE: '/tmp/claude-env',
      CLAUDE_EFFORT: 'high',
      CLAUDE_PLUGIN_DATA: '{"ok":true}',
      CLAUDE_PROJECT_DIR: '/persisted/project',
      RANDOM_SECRET: 'do-not-leak',
      AGENT_SESSION_ID: 'stale-session',
    };

    const result = await runHandler(
      event,
      {
        source: [
          'node -e \'console.log(JSON.stringify({',
          'decision:"noop",',
          'metadata:{',
          'agentSession:process.env.AGENT_SESSION_ID,',
          'claudeEffort:process.env.CLAUDE_EFFORT,',
          'claudePluginData:process.env.CLAUDE_PLUGIN_DATA,',
          'claudeProjectDir:process.env.CLAUDE_PROJECT_DIR,',
          'secret:process.env.RANDOM_SECRET',
          '}}))\'',
        ].join(''),
        handler: 'env-handler',
        priority: 1,
      },
    );

    expect(result.metadata).toMatchObject({
      agentSession: 'runtime-session',
      claudeEffort: 'high',
      claudePluginData: '{"ok":true}',
      claudeProjectDir: '/persisted/project',
    });
    expect(result.metadata?.secret).toBeUndefined();
  });

  it('returns statusMessage metadata for async handlers without awaiting process exit', async () => {
    const event = makeEvent();
    const marker = path.join(os.tmpdir(), `hooks-async-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const startedAt = Date.now();

    const result = await runPlan(
      event,
      [
        {
          id: 'async-handler',
          pluginId: 'plugin-async',
          phase: 'tool.before',
          priority: 1,
          async: true,
          statusMessage: 'Indexing workspace',
          handler: {
            source: `node -e "setTimeout(() => require('fs').writeFileSync('${marker}', 'done'), 800)"`,
            handler: 'async-handler',
            priority: 1,
          },
        },
      ],
    );

    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(result).toHaveLength(1);
    expect(result[0].decision).toBe('noop');
    expect(result[0].metadata).toMatchObject({
      async: true,
      statusMessage: 'Indexing workspace',
      handlerId: 'async-handler',
    });
    expect(fs.existsSync(marker)).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(await fs.promises.readFile(marker, 'utf-8')).toBe('done');
    await fs.promises.rm(marker, { force: true }).catch(() => {/* ignore */});
  }, 5000);

  it('suppresses once handlers when session context already marks the entry as executed', async () => {
    const event = makeEvent();
    event.execution.sessionId = 'session-once';
    event.execution.contextVars = { 'hooksMux.once.plugin-once.once-handler': '1' };

    const results = await runPlan(
      event,
      [
        {
          id: 'once-handler',
          pluginId: 'plugin-once',
          phase: 'tool.before',
          priority: 1,
          once: true,
          handler: {
            source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{ran:true}}))"',
            handler: 'once-handler',
            priority: 1,
          },
        },
      ],
    );

    expect(results).toHaveLength(1);
    expect(results[0].metadata).toMatchObject({
      once: true,
      duplicateSuppressed: true,
      handlerId: 'once-handler',
    });
    expect(results[0].metadata?.ran).toBeUndefined();
  });

  it('records asyncRewake as dependency-deferred metadata for exit code 2', async () => {
    clearAsyncHandlerRecords();
    const event = makeEvent();

    const results = await runPlan(
      event,
      [
        {
          id: 'rewake-handler',
          pluginId: 'plugin-rewake',
          phase: 'tool.before',
          priority: 1,
          async: true,
          asyncRewake: true,
          handler: {
            source: 'node -e "process.stderr.write(\'needs follow-up\'); process.exit(2)"',
            handler: 'rewake-handler',
            priority: 1,
          },
        },
      ],
    );

    expect(results[0].metadata).toMatchObject({
      async: true,
      asyncRewake: true,
      rewakeDeferred: true,
      handlerId: 'rewake-handler',
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const records = getAsyncHandlerRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      handlerId: 'rewake-handler',
      pluginId: 'plugin-rewake',
      status: 'exited',
      exitCode: 2,
      stderr: 'needs follow-up',
      asyncRewake: true,
      rewakeDeferred: true,
    });
  });
});
