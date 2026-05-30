import { describe, it, expect, beforeAll } from 'vitest';
import { createAdapter } from '../adapter';
import { CLAUDE_PHASE_MAPPINGS, getClaudePhaseMapping, getSupportedPhases } from '../mappings';
import { normalizeClaude, setAdapterName, parseStdin, buildPayload, isStopHookRecursion } from '../normalizer';
import { renderClaudeOutput } from '../renderer';
import { resolveSessionId } from '../session-resolver';
import * as fixtures from './fixtures/claude-payloads';

beforeAll(() => {
  setAdapterName('claude');
});

// ---------------------------------------------------------------------------
// Adapter capabilities
// ---------------------------------------------------------------------------

describe('createAdapter', () => {
  it('returns correct capability descriptor', () => {
    const caps = createAdapter('claude');

    expect(caps.name).toBe('claude');
    expect(caps.family).toBe('shell-hook');
    expect(caps.sessionIdQuality).toBe('native');
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(true);
    expect(caps.supportsToolInputMutation).toBe(false);
    expect(caps.supportsToolResultMutation).toBe(false);
    expect(caps.supportsPersistedEnv).toBe(true);
    expect(caps.envPersistenceMode).toBe('native_env_file');
    expect(caps.supportsNativeAdditionalContext).toBe(true);
    expect(caps.toolInterceptionScope).toBe('all');
    expect(caps.hostTools?.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep']),
    );
    expect(caps.hostTools?.find((tool) => tool.name === 'Bash')).toMatchObject({
      category: 'shell',
      availability: 'built-in',
    });
  });
});

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

describe('mappings', () => {
  it('maps all Claude events to canonical phases', () => {
    const expected: Record<string, string> = {
      SessionStart: 'session.start',
      Setup: 'session.setup',
      SessionEnd: 'session.end',
      PreCompact: 'session.compact.before',
      UserPromptSubmit: 'turn.user_prompt_submitted',
      UserPromptExpansion: 'turn.prompt_expansion',
      PreToolUse: 'tool.before',
      PostToolUse: 'tool.after',
      PostToolUseFailure: 'tool.after_failure',
      PostToolBatch: 'tool.after_batch',
      Stop: 'turn.stop',
      StopFailure: 'turn.stop_failure',
      SubagentStop: 'subagent.end',
      TaskCreated: 'task.created',
      TaskCompleted: 'task.completed',
      TeammateIdle: 'team.idle',
      ConfigChange: 'session.config_changed',
      InstructionsLoaded: 'session.instructions_loaded',
      Notification: 'notification',
      MessageDisplay: 'message.received',
    };

    for (const [native, canonical] of Object.entries(expected)) {
      const mapping = getClaudePhaseMapping(native);
      expect(mapping, `mapping for ${native}`).toBeDefined();
      expect(mapping!.canonicalPhase).toBe(canonical);
    }
  });

  it('maps all Claude native events from the graph with valid support levels', () => {
    // The core Claude events that MUST always be present
    const REQUIRED_EVENTS = [
      'SessionStart',
      'PreToolUse',
      'PostToolUse',
      'Stop',
    ];

    // Every required event must be in the mapping table
    for (const eventName of REQUIRED_EVENTS) {
      const mapping = getClaudePhaseMapping(eventName);
      expect(mapping, `missing required mapping for ${eventName}`).toBeDefined();
    }

    // All mappings must have valid support levels (data comes from atlas graph)
    for (const mapping of CLAUDE_PHASE_MAPPINGS) {
      expect(
        ['native', 'lossy', 'emulated', 'unsupported'],
        `invalid supportLevel '${mapping.supportLevel}' for ${mapping.nativeHook}`,
      ).toContain(mapping.supportLevel);
    }

    // Mapping table must have at least the required events
    expect(CLAUDE_PHASE_MAPPINGS.length).toBeGreaterThanOrEqual(REQUIRED_EVENTS.length);
  });

  it('returns undefined for unknown event names', () => {
    expect(getClaudePhaseMapping('UnknownEvent')).toBeUndefined();
  });

  it('marks PreToolUse as blockable', () => {
    const mapping = getClaudePhaseMapping('PreToolUse');
    expect(mapping!.blockCapability).toBe(true);
  });

  it('marks Stop as blockable', () => {
    const mapping = getClaudePhaseMapping('Stop');
    expect(mapping!.blockCapability).toBe(true);
  });

  it('marks PostToolUse as non-blockable', () => {
    const mapping = getClaudePhaseMapping('PostToolUse');
    expect(mapping!.blockCapability).toBe(false);
  });

  it('marks issue #636 blockable Claude events as blockable', () => {
    for (const eventName of [
      'PostToolBatch',
      'UserPromptExpansion',
      'TaskCreated',
      'TaskCompleted',
      'TeammateIdle',
      'ConfigChange',
    ]) {
      expect(getClaudePhaseMapping(eventName)?.blockCapability, eventName).toBe(true);
    }
  });

  it('marks issue #636 non-blocking Claude events as non-blocking', () => {
    for (const eventName of [
      'PostToolUseFailure',
      'StopFailure',
      'Setup',
      'InstructionsLoaded',
      'MessageDisplay',
    ]) {
      expect(getClaudePhaseMapping(eventName)?.blockCapability, eventName).toBe(false);
    }
  });

  it('getSupportedPhases returns all mapped phases', () => {
    const phases = getSupportedPhases();
    expect(phases).toContain('session.start');
    expect(phases).toContain('session.setup');
    expect(phases).toContain('session.instructions_loaded');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
    expect(phases).toContain('tool.after_failure');
    expect(phases).toContain('tool.after_batch');
    expect(phases).toContain('turn.stop');
    expect(phases).toContain('turn.stop_failure');
    expect(phases).toContain('turn.prompt_expansion');
    expect(phases).toContain('task.created');
    expect(phases).toContain('task.completed');
    expect(phases).toContain('team.idle');
    expect(phases).toContain('session.config_changed');
    expect(phases).not.toContain('session.config_change');
    expect(phases.length).toBe(CLAUDE_PHASE_MAPPINGS.length);
  });
});

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

describe('normalizeClaude', () => {
  describe('parseStdin', () => {
    it('parses JSON string input', () => {
      const result = parseStdin('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('handles object input directly', () => {
      const result = parseStdin({ key: 'value' });
      expect(result).toEqual({ key: 'value' });
    });

    it('wraps non-object JSON in raw field', () => {
      const result = parseStdin('"just a string"');
      expect(result).toEqual({ raw: 'just a string' });
    });

    it('wraps unparseable string in raw field', () => {
      const result = parseStdin('not json');
      expect(result).toEqual({ raw: 'not json' });
    });

    it('returns empty object for null/undefined', () => {
      expect(parseStdin(null)).toEqual({});
      expect(parseStdin(undefined)).toEqual({});
    });
  });

  describe('SessionStart normalization', () => {
    it('normalizes startup SessionStart', () => {
      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_STARTUP);

      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('claude');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('SessionStart');
      expect(event.supportLevel).toBe('native');
      expect(event.execution.sessionId).toBe('sess_abc123def456');
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('claude-sonnet-4-20250514');
      expect(event.execution.source).toBe('startup');
      expect(event.payload.source).toBe('startup');
      expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
    });

    it('normalizes resume SessionStart', () => {
      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_RESUME);
      expect(event.payload.source).toBe('resume');
    });

    it('normalizes compact SessionStart', () => {
      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_COMPACT);
      expect(event.payload.source).toBe('compact');
    });

    it('normalizes clear SessionStart', () => {
      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_CLEAR);
      expect(event.payload.source).toBe('clear');
    });
  });

  describe('PreToolUse normalization', () => {
    it('normalizes Bash tool use', () => {
      const event = normalizeClaude('PreToolUse', fixtures.PRE_TOOL_USE_BASH);

      expect(event.phase).toBe('tool.before');
      expect(event.execution.toolName).toBe('Bash');
      expect(event.execution.toolCallId).toBe('tc_001');
      expect(event.payload.toolName).toBe('Bash');
      expect(event.payload.toolInput).toEqual({ command: 'npm test', description: 'Run tests' });
    });

    it('normalizes Edit tool use', () => {
      const event = normalizeClaude('PreToolUse', fixtures.PRE_TOOL_USE_EDIT);

      expect(event.execution.toolName).toBe('Edit');
      expect(event.payload.toolName).toBe('Edit');
    });
  });

  describe('PostToolUse normalization', () => {
    it('normalizes post-tool-use with response', () => {
      const event = normalizeClaude('PostToolUse', fixtures.POST_TOOL_USE_BASH);

      expect(event.phase).toBe('tool.after');
      expect(event.payload.toolName).toBe('Bash');
      expect(event.payload.toolResponse).toBe('All 42 tests passed.');
    });
  });

  describe('Issue #636 extended event normalization', () => {
    it('normalizes PostToolUseFailure payload fields', () => {
      const event = normalizeClaude('PostToolUseFailure', {
        session_id: 'sess_failure',
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
        error: 'Command failed',
        exit_code: 1,
      });

      expect(event.phase).toBe('tool.after_failure');
      expect(event.execution.toolName).toBe('Bash');
      expect(event.payload).toMatchObject({
        toolName: 'Bash',
        toolInput: { command: 'npm test' },
        error: 'Command failed',
        exitCode: 1,
      });
    });

    it('normalizes PostToolBatch payload fields', () => {
      const event = normalizeClaude('PostToolBatch', {
        session_id: 'sess_batch',
        batch_results: [
          { tool_name: 'Bash', tool_input: { command: 'npm test' }, success: true, output: 'ok' },
        ],
      });

      expect(event.phase).toBe('tool.after_batch');
      expect(event.payload.batchResults).toEqual([
        { tool_name: 'Bash', tool_input: { command: 'npm test' }, success: true, output: 'ok' },
      ]);
    });

    it('normalizes StopFailure payload fields', () => {
      const event = normalizeClaude('StopFailure', {
        session_id: 'sess_stop_failure',
        error_type: 'rate_limit',
        error_message: 'Too many requests',
        retry_after: 60,
      });

      expect(event.phase).toBe('turn.stop_failure');
      expect(event.payload).toMatchObject({
        errorType: 'rate_limit',
        errorMessage: 'Too many requests',
        retryAfter: 60,
      });
    });

    it('normalizes UserPromptExpansion payload fields', () => {
      const event = normalizeClaude('UserPromptExpansion', {
        session_id: 'sess_prompt_expansion',
        expansion_type: 'slash_command',
        command_name: 'review',
        command_args: ['--quick'],
        command_source: 'project',
        prompt: '/review --quick',
      });

      expect(event.phase).toBe('turn.prompt_expansion');
      expect(event.payload).toMatchObject({
        expansionType: 'slash_command',
        commandName: 'review',
        commandArgs: ['--quick'],
        commandSource: 'project',
        prompt: '/review --quick',
      });
    });

    it('normalizes task, team, setup, instructions, and config events', () => {
      expect(normalizeClaude('TaskCreated', {
        task_id: 'task-1',
        task_kind: 'agent',
        task_title: 'Implement hook',
        task_labels: ['hooks-mux'],
      }).payload).toMatchObject({
        taskId: 'task-1',
        taskKind: 'agent',
        taskTitle: 'Implement hook',
        taskLabels: ['hooks-mux'],
      });

      expect(normalizeClaude('TaskCompleted', {
        task_id: 'task-1',
        task_kind: 'agent',
        task_status: 'ok',
        task_result: { passed: true },
      }).phase).toBe('task.completed');

      expect(normalizeClaude('TeammateIdle', {
        agent_id: 'agent-1',
        agent_type: 'worker',
        idle_reason: 'queue_empty',
      }).payload).toMatchObject({
        agentId: 'agent-1',
        agentType: 'worker',
        idleReason: 'queue_empty',
      });

      expect(normalizeClaude('Setup', { trigger: 'init' }).phase).toBe('session.setup');
      expect(normalizeClaude('InstructionsLoaded', {
        file_path: 'AGENTS.md',
        memory_type: 'project',
        load_reason: 'session_start',
        globs: ['**/AGENTS.md'],
        trigger_file_path: 'src/index.ts',
        parent_file_path: 'AGENTS.md',
      }).payload).toMatchObject({
        filePath: 'AGENTS.md',
        memoryType: 'project',
        loadReason: 'session_start',
        globs: ['**/AGENTS.md'],
        triggerFilePath: 'src/index.ts',
        parentFilePath: 'AGENTS.md',
      });

      expect(normalizeClaude('ConfigChange', {
        config_path: '.claude/settings.json',
        change_type: 'update',
        setting_key: 'hooks',
      }).phase).toBe('session.config_changed');
    });
  });

  describe('Stop normalization', () => {
    it('normalizes stop event', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_END_TURN);

      expect(event.phase).toBe('turn.stop');
      expect(event.payload.reason).toBe('end_turn');
      expect(event.payload.lastAssistantMessage).toBe('I have completed the refactoring.');
      expect(event.payload.stopHookActive).toBe(false);
    });

    it('surfaces stop_hook_active in metadata for recursion guard', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_RECURSIVE_GUARD);

      expect(event.payload.stopHookActive).toBe(true);
      expect(event.execution.metadata.stop_hook_active).toBe(true);
    });
  });

  describe('isStopHookRecursion', () => {
    it('returns true when stop_hook_active is true in metadata', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_RECURSIVE_GUARD);
      expect(isStopHookRecursion(event)).toBe(true);
    });

    it('returns false when stop_hook_active is false in metadata', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_END_TURN);
      expect(isStopHookRecursion(event)).toBe(false);
    });

    it('returns false when stop_hook_active is absent from metadata', () => {
      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_STARTUP);
      expect(isStopHookRecursion(event)).toBe(false);
    });
  });

  describe('UserPromptSubmit normalization', () => {
    it('normalizes user prompt submission', () => {
      const event = normalizeClaude('UserPromptSubmit', fixtures.USER_PROMPT_SUBMIT);

      expect(event.phase).toBe('turn.user_prompt_submitted');
      expect(event.payload.prompt).toBe('Now add tests for the auth module');
    });
  });

  describe('SubagentStop normalization', () => {
    it('normalizes subagent stop', () => {
      const event = normalizeClaude('SubagentStop', fixtures.SUBAGENT_STOP);

      expect(event.phase).toBe('subagent.end');
      expect(event.payload.agentType).toBe('code-reviewer');
      expect(event.payload.reason).toBe('end_turn');
    });
  });

  describe('Other events', () => {
    it('normalizes Notification', () => {
      const event = normalizeClaude('Notification', fixtures.NOTIFICATION);
      expect(event.phase).toBe('notification');
      expect(event.payload.message).toBe('The build completed successfully in 12.3s.');
    });

    it('normalizes MessageDisplay display deltas', () => {
      const event = normalizeClaude('MessageDisplay', {
        session_id: 'sess_abc123def456',
        turn_id: 'turn_123',
        message_id: 'display_msg_123',
        index: 2,
        final: false,
        delta: 'Newly completed line\\n',
      });

      expect(event.phase).toBe('message.received');
      expect(event.rawEventName).toBe('MessageDisplay');
      expect(event.payload).toMatchObject({
        turnId: 'turn_123',
        messageId: 'display_msg_123',
        index: 2,
        final: false,
        delta: 'Newly completed line\\n',
      });
    });

    it('normalizes PreCompact', () => {
      const event = normalizeClaude('PreCompact', fixtures.PRE_COMPACT);
      expect(event.phase).toBe('session.compact.before');
    });

    it('normalizes SessionEnd', () => {
      const event = normalizeClaude('SessionEnd', fixtures.SESSION_END);
      expect(event.phase).toBe('session.end');
    });
  });

  describe('Unknown events', () => {
    it('handles unknown event names gracefully', () => {
      const event = normalizeClaude('FutureEvent', { session_id: 'sess_x', custom_field: 'data' });

      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
      expect(event.payload.custom_field).toBe('data');
    });
  });

  describe('Environment handling', () => {
    it('splits env into input and persisted buckets', () => {
      const env = {
        HOOKS_PROXY_SESSION_ID: 'sess_override',
        HOOKS_PROXY_PERSIST_MY_KEY: 'my_value',
        PATH: '/usr/bin',
      };

      const event = normalizeClaude('SessionStart', fixtures.SESSION_START_STARTUP, env);

      expect(event.env.input.HOOKS_PROXY_SESSION_ID).toBe('sess_override');
      expect(event.env.persisted.HOOKS_PROXY_PERSIST_MY_KEY).toBe('my_value');
      expect(event.env.input['PATH']).toBeUndefined();
    });
  });

  describe('Raw preservation', () => {
    it('preserves raw stdin in the raw field', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_END_TURN);
      expect(event.raw).toBe(fixtures.STOP_END_TURN);
    });
  });
});

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

describe('renderClaudeOutput', () => {
  describe('PreToolUse rendering', () => {
    it('renders allow decision', () => {
      const output = renderClaudeOutput({ decision: 'allow' }, 'PreToolUse');
      expect(output).toEqual({ decision: 'allow' });
    });

    it('renders deny decision with reason', () => {
      const output = renderClaudeOutput(
        { decision: 'deny', reason: 'Dangerous command' },
        'PreToolUse',
      );
      expect(output).toEqual({ decision: 'deny', reason: 'Dangerous command' });
    });

    it('renders ask decision', () => {
      const output = renderClaudeOutput({ decision: 'ask', reason: 'Confirm?' }, 'PreToolUse');
      expect(output).toEqual({ decision: 'ask', reason: 'Confirm?' });
    });

    it('renders additional context', () => {
      const output = renderClaudeOutput(
        { decision: 'allow', additionalContext: 'Use caution with this tool.' },
        'PreToolUse',
      );
      expect(output).toEqual({
        decision: 'allow',
        additionalContext: 'Use caution with this tool.',
      });
    });

    it('renders empty object for noop decision', () => {
      const output = renderClaudeOutput({ decision: 'noop' }, 'PreToolUse');
      expect(output).toEqual({});
    });

    it('renders defer as no native decision', () => {
      const output = renderClaudeOutput({ decision: 'defer' as any }, 'PreToolUse');
      expect(output).toEqual({});
    });

    it('renders block through Claude deny decision', () => {
      const output = renderClaudeOutput(
        { decision: 'block' as any, reason: 'Blocked by hook policy' },
        'PreToolUse',
      );
      expect(output).toEqual({ decision: 'deny', reason: 'Blocked by hook policy' });
    });

    it('renders toolMutation as Claude updatedInput', () => {
      const output = renderClaudeOutput(
        { toolMutation: { mode: 'replace', value: { command: 'npm test' } } },
        'PreToolUse',
      );
      expect(output).toEqual({ updatedInput: { command: 'npm test' } });
    });
  });

  describe('PostToolUse rendering', () => {
    it('renders additional context', () => {
      const output = renderClaudeOutput(
        { additionalContext: 'Tool produced warnings.' },
        'PostToolUse',
      );
      expect(output).toEqual({ additionalContext: 'Tool produced warnings.' });
    });

    it('renders empty object when no additional context', () => {
      const output = renderClaudeOutput({}, 'PostToolUse');
      expect(output).toEqual({});
    });

    it('does not falsely render unsupported block or retry decisions', () => {
      expect(renderClaudeOutput({ decision: 'block' as any, reason: 'no' }, 'PostToolUse')).toEqual({});
      expect(renderClaudeOutput({ decision: 'retry' as any, reason: 'again' }, 'PostToolUse')).toEqual({});
    });
  });

  describe('Issue #636 extended event rendering', () => {
    it('renders non-blocking additional context for PostToolUseFailure, StopFailure, Setup, and InstructionsLoaded', () => {
      for (const eventName of ['PostToolUseFailure', 'StopFailure', 'Setup', 'InstructionsLoaded']) {
        expect(renderClaudeOutput({
          decision: 'deny',
          reason: 'ignored for non-blocking event',
          additionalContext: 'diagnostic context',
        }, eventName)).toEqual({ additionalContext: 'diagnostic context' });
      }
    });

    it('renders blockable decisions for PostToolBatch, UserPromptExpansion, task/team, and ConfigChange', () => {
      for (const eventName of [
        'PostToolBatch',
        'UserPromptExpansion',
        'TaskCreated',
        'TaskCompleted',
        'TeammateIdle',
        'ConfigChange',
      ]) {
        expect(renderClaudeOutput({ decision: 'deny', reason: 'blocked by policy' }, eventName)).toEqual({
          decision: 'deny',
          reason: 'blocked by policy',
        });
      }
    });
  });

  describe('Stop rendering', () => {
    it('renders continue session', () => {
      const output = renderClaudeOutput(
        { continueSession: true, followUpMessage: 'Please also run the linter.' },
        'Stop',
      );
      expect(output).toEqual({
        continue: true,
        followUpMessage: 'Please also run the linter.',
      });
    });

    it('renders stop reason', () => {
      const output = renderClaudeOutput({ stopReason: 'Hook decided to stop' }, 'Stop');
      expect(output).toEqual({ reason: 'Hook decided to stop' });
    });

    it('prefers stopReason over reason', () => {
      const output = renderClaudeOutput(
        { stopReason: 'specific stop', reason: 'generic' },
        'Stop',
      );
      expect(output).toEqual({ reason: 'specific stop' });
    });
  });

  describe('SessionStart rendering', () => {
    it('renders additional context', () => {
      const output = renderClaudeOutput(
        { additionalContext: 'Session initialized with project context.' },
        'SessionStart',
      );
      expect(output).toEqual({
        additionalContext: 'Session initialized with project context.',
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: 'Session initialized with project context.',
        },
      });
    });

    it('renders reloadSkills and sessionTitle hook-specific output', () => {
      const output = renderClaudeOutput(
        { reloadSkills: true, sessionTitle: 'Prepared workspace' },
        'SessionStart',
      );

      expect(output).toEqual({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          reloadSkills: true,
          sessionTitle: 'Prepared workspace',
        },
      });
    });
  });

  describe('MessageDisplay rendering', () => {
    it('renders transformed display content', () => {
      const output = renderClaudeOutput(
        { displayContent: 'Replacement display text\\n' },
        'MessageDisplay',
      );

      expect(output).toEqual({
        hookSpecificOutput: {
          hookEventName: 'MessageDisplay',
          displayContent: 'Replacement display text\\n',
        },
      });
    });

    it('renders empty display content when suppressed', () => {
      const output = renderClaudeOutput({ suppressOutput: true }, 'MessageDisplay');

      expect(output).toEqual({
        hookSpecificOutput: {
          hookEventName: 'MessageDisplay',
          displayContent: '',
        },
      });
    });
  });

  describe('Stop recursion guard', () => {
    it('returns safe no-op when event has stopHookActive true', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_RECURSIVE_GUARD);
      // Even though the handler result says continueSession: true, the
      // recursion guard must override that to prevent infinite loops.
      const output = renderClaudeOutput(
        { continueSession: true, followUpMessage: 'keep going' },
        'Stop',
        event,
      );
      expect(output).toEqual({ continue: false });
    });

    it('does not interfere when stopHookActive is false', () => {
      const event = normalizeClaude('Stop', fixtures.STOP_END_TURN);
      const output = renderClaudeOutput(
        { continueSession: true, followUpMessage: 'keep going' },
        'Stop',
        event,
      );
      expect(output).toEqual({
        continue: true,
        followUpMessage: 'keep going',
      });
    });

    it('does not interfere when no event is provided', () => {
      const output = renderClaudeOutput(
        { continueSession: true, followUpMessage: 'keep going' },
        'Stop',
      );
      expect(output).toEqual({
        continue: true,
        followUpMessage: 'keep going',
      });
    });
  });

  describe('Generic event rendering', () => {
    it('renders additional context for unknown events', () => {
      const output = renderClaudeOutput(
        { additionalContext: 'Some context.' },
        'Notification',
      );
      expect(output).toEqual({ additionalContext: 'Some context.' });
    });
  });
});

// ---------------------------------------------------------------------------
// Session resolver
// ---------------------------------------------------------------------------

describe('resolveSessionId', () => {
  it('prefers explicit flag over everything', () => {
    const result = resolveSessionId(
      { session_id: 'native_id' },
      { AGENT_SESSION_ID: 'env_id' },
      'flag_id',
    );
    expect(result).toEqual({ sessionId: 'flag_id', source: 'explicit_flag' });
  });

  it('prefers env over native session_id', () => {
    const result = resolveSessionId(
      { session_id: 'native_id' },
      { AGENT_SESSION_ID: 'env_id' },
    );
    expect(result).toEqual({ sessionId: 'env_id', source: 'explicit_env' });
  });

  it('falls back to native session_id', () => {
    const result = resolveSessionId({ session_id: 'native_id' }, {});
    expect(result).toEqual({ sessionId: 'native_id', source: 'native' });
  });

  it('returns null when no session ID is available', () => {
    const result = resolveSessionId({}, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });

  it('ignores empty native session_id', () => {
    const result = resolveSessionId({ session_id: '' }, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });
});
