/**
 * Example extension entry point for a Babysitter Pi plugin.
 *
 * Demonstrates the core patterns for building an oh-my-pi extension:
 *   - Subscribing to lifecycle events (session_start, agent_end, tool_call, session_shutdown)
 *   - Registering custom tools
 *   - Registering slash commands
 *   - Registering custom message renderers
 *   - Managing TUI widgets and status bar
 *   - Injecting messages into the conversation
 *
 * Place this file at: extensions/<extension-name>/index.ts
 * The directory name becomes the extension identifier.
 *
 * @module activate
 */

// ---------------------------------------------------------------------------
// ExtensionAPI type definition (subset)
//
// In a real plugin, import from your types module or reference the
// @mariozechner/pi-coding-agent type definitions.
// ---------------------------------------------------------------------------

interface ExtensionAPI {
  on(
    event:
      | 'session_start'
      | 'agent_end'
      | 'session_shutdown'
      | 'before_agent_start'
      | 'tool_call'
      | 'tool_result'
      | 'context'
      | 'input'
      | 'turn_start'
      | 'turn_end',
    handler: (...args: unknown[]) => unknown,
  ): void;

  registerTool(toolDef: {
    name: string;
    label?: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (
      toolCallId: string,
      params: Record<string, unknown>,
      signal: unknown,
      onUpdate: unknown,
      ctx: unknown,
    ) => Promise<{ content: string; details?: Record<string, unknown> }>;
  }): void;

  registerCommand(
    name: string,
    options: {
      description?: string;
      handler: (...args: unknown[]) => unknown;
    },
  ): void;

  registerMessageRenderer(type: string, renderer: (payload: unknown) => string): void;

  setWidget(key: string, lines: string[]): void;
  setStatus(key: string, text: string): void;
  appendEntry(entry: { type: string; content: unknown }): void;
  sendMessage(msg: { role: string; content: string }): void;
  sendUserMessage(msg: { role: string; content: string }): void;
}

// ---------------------------------------------------------------------------
// Extension state
// ---------------------------------------------------------------------------

/** Simple state tracker for the extension. */
interface ExtensionState {
  sessionId: string | null;
  isActive: boolean;
  iterationCount: number;
}

const state: ExtensionState = {
  sessionId: null,
  isActive: false,
  iterationCount: 0,
};

// ---------------------------------------------------------------------------
// activate — the extension entry point
// ---------------------------------------------------------------------------

/**
 * Activate the extension.
 *
 * This is the function that Pi calls when loading the extension. It receives
 * the ExtensionAPI instance and must register all hooks, tools, commands,
 * and renderers synchronously (or return a Promise that resolves once
 * setup is complete).
 */
export async function activate(pi: ExtensionAPI): Promise<void> {
  // ----- 1. Subscribe to lifecycle events -----

  // session_start: fires once when a new Pi session begins
  pi.on('session_start', (event: unknown) => {
    const evt = event as { sessionId?: string };
    state.sessionId = evt.sessionId ?? 'default';
    state.isActive = true;
    state.iterationCount = 0;

    pi.setStatus('my-extension', 'My Extension: ready');
    pi.appendEntry({
      type: 'info',
      content: `[my-extension] Session started: ${state.sessionId}`,
    });
  });

  // agent_end: fires after every LLM turn — the primary hook for
  // driving orchestration loops or post-processing agent output
  pi.on('agent_end', (event: unknown) => {
    const evt = event as { output?: string; text?: string };
    const output = evt.output ?? evt.text ?? '';

    state.iterationCount += 1;

    // Update the TUI widget with current state
    pi.setWidget('my-extension:status', [
      `My Extension`,
      `  Iterations: ${state.iterationCount}`,
      `  Output length: ${output.length} chars`,
    ]);

    // Example: inject a follow-up message to continue a loop
    // pi.sendUserMessage({ role: 'user', content: 'Continue...' });
  });

  // tool_call: fires before any tool executes — return { block, reason }
  // to prevent execution
  pi.on('tool_call', (toolName: unknown, _params: unknown) => {
    const name = toolName as string;

    // Example: block a specific tool during active state
    if (state.isActive && name === 'dangerous_tool') {
      return {
        block: true,
        reason: 'This tool is blocked while my-extension is active.',
      };
    }

    return null; // Allow all other tools
  });

  // session_shutdown: clean up resources
  pi.on('session_shutdown', () => {
    state.isActive = false;
    state.sessionId = null;
    pi.setWidget('my-extension:status', []);
    pi.setStatus('my-extension', '');
  });

  // context: inject state into the agent's context window
  pi.on('context', () => {
    if (state.isActive) {
      pi.sendMessage({
        role: 'system',
        content: `[my-extension] Active session. Iteration: ${state.iterationCount}.`,
      });
    }
  });

  // ----- 2. Register custom tools -----

  pi.registerTool({
    name: 'my_extension_status',
    label: 'My Extension Status',
    description: 'Returns the current state of the my-extension plugin.',
    parameters: {},
    execute: async (_toolCallId, _params, _signal, _onUpdate, _ctx) => {
      return {
        content: [
          `Session: ${state.sessionId ?? 'none'}`,
          `Active: ${state.isActive}`,
          `Iterations: ${state.iterationCount}`,
        ].join('\n'),
        details: {
          sessionId: state.sessionId,
          isActive: state.isActive,
          iterationCount: state.iterationCount,
        },
      };
    },
  });

  pi.registerTool({
    name: 'my_extension_greet',
    label: 'Greet User',
    description: 'Greets the user by name.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name to greet' },
      },
      required: ['name'],
    },
    execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
      const name = params.name as string;
      return {
        content: `Hello, ${name}! Iteration ${state.iterationCount}.`,
        details: { greeted: name },
      };
    },
  });

  // ----- 3. Register slash commands -----

  pi.registerCommand('my-extension:reset', {
    description: 'Reset the my-extension state counters',
    handler: () => {
      state.iterationCount = 0;
      pi.appendEntry({
        type: 'info',
        content: '[my-extension] State reset.',
      });
    },
  });

  // ----- 4. Register custom message renderers -----

  pi.registerMessageRenderer('my-extension:result', (payload: unknown) => {
    const data = (payload ?? {}) as Record<string, unknown>;
    const status = data['status'] ?? 'unknown';
    const message = data['message'] ?? '';
    return `[My Extension] ${status}: ${message}`;
  });

  // ----- 5. Set initial widget state -----

  pi.setWidget('my-extension:status', [
    'My Extension',
    '  Waiting for session start...',
  ]);
}
