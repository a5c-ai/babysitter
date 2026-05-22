/**
 * Programmatic engine integration for the OpenClaw adapter.
 *
 * Creates a pre-configured HooksEngine wired to the OpenClaw adapter's
 * capabilities and phase mappings, ready for in-process hook execution.
 *
 * OpenClaw has a dual-layer hook system (gateway + plugin). The configured
 * engine includes both mapping sets so that plugin hooks map to canonical
 * phases and gateway hooks are available for observability.
 *
 * Usage:
 * ```typescript
 * import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-openclaw';
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
 *   nativeEventName: 'plugin.tool.before',
 *   payload: { toolName: 'Bash' },
 * });
 * ```
 */

import { createHooksEngine, type HooksEngine } from '@a5c-ai/hooks-mux-core';
import { createAdapter } from './adapter';
import { OPENCLAW_PHASE_MAPPINGS } from './mappings';

/**
 * Create a pre-configured hooks engine for the OpenClaw adapter.
 * Ready to register handlers and process events.
 */
export function createConfiguredEngine(options: { sessionDir?: string; adapterName: string }): HooksEngine {
  const name = options.adapterName;
  return createHooksEngine({
    adapter: name,
    capabilities: createAdapter(name),
    phaseMappings: OPENCLAW_PHASE_MAPPINGS,
    sessionDir: options?.sessionDir,
  });
}
