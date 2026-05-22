/**
 * Programmatic engine integration for the OpenCode adapter.
 *
 * Creates a pre-configured HooksEngine wired to the OpenCode adapter's
 * capabilities and phase mappings, ready for in-process hook execution.
 *
 * Usage:
 * ```typescript
 * import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-opencode';
 *
 * const engine = createConfiguredEngine();
 *
 * engine.registerHandler({
 *   id: 'my-handler',
 *   pluginId: 'my-plugin',
 *   phase: 'tool.before',
 *   priority: 10,
 *   handler: async (event) => ({
 *     decision: 'allow',
 *   }),
 * });
 *
 * const result = await engine.processEvent({
 *   nativeEventName: 'tool.execute.before',
 *   payload: { toolName: 'Bash', command: 'ls' },
 * });
 * ```
 */

import { createHooksEngine, type HooksEngine } from '@a5c-ai/hooks-mux-core';
import { createAdapter } from './adapter';
import { OPENCODE_PHASE_MAPPINGS } from './mappings';

/**
 * Create a pre-configured hooks engine for the OpenCode adapter.
 * Ready to register handlers and process events.
 */
export function createConfiguredEngine(options: { sessionDir?: string; adapterName: string }): HooksEngine {
  const name = options.adapterName;
  return createHooksEngine({
    adapter: name,
    capabilities: createAdapter(name),
    phaseMappings: OPENCODE_PHASE_MAPPINGS,
    sessionDir: options?.sessionDir,
  });
}
