/**
 * Programmatic engine integration for the Pi adapter.
 *
 * Creates a pre-configured HooksEngine wired to the Pi adapter's
 * capabilities and phase mappings, ready for in-process hook execution.
 *
 * Usage:
 * ```typescript
 * import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-pi';
 *
 * const engine = createConfiguredEngine();
 *
 * engine.registerHandler({
 *   id: 'my-handler',
 *   pluginId: 'my-plugin',
 *   phase: 'session.start',
 *   priority: 10,
 *   handler: async (event) => ({
 *     persistEnv: { MY_PLUGIN_READY: '1' },
 *   }),
 * });
 *
 * // When Pi fires a session_start event:
 * const result = await engine.processEvent({
 *   nativeEventName: 'session_start',
 *   payload: { sessionId: 'abc', cwd: '/project' },
 * });
 * ```
 */

import { createHooksEngine, type HooksEngine } from '@a5c-ai/hooks-mux-core';
import { createAdapter } from './adapter';
import { PI_PHASE_MAPPINGS } from './mappings';

/**
 * Create a pre-configured hooks engine for the Pi adapter.
 * Ready to register handlers and process events.
 */
export function createConfiguredEngine(options: { sessionDir?: string; adapterName: string }): HooksEngine {
  const name = options.adapterName;
  return createHooksEngine({
    adapter: name,
    capabilities: createAdapter(name),
    phaseMappings: PI_PHASE_MAPPINGS,
    sessionDir: options?.sessionDir,
  });
}
