/**
 * @a5c-ai/babysitter-tui-plugins
 *
 * Agent-mux TUI plugins for babysitter orchestration visibility.
 *
 * Three plugins:
 * - babysitter:status  -- Run status, effects, iteration tracking
 * - babysitter:cost    -- Cost and token usage tracking
 * - babysitter:governance -- Breakpoint/approval governance decisions
 *
 * Usage:
 *   import { babysitterPlugins } from '@a5c-ai/babysitter-tui-plugins';
 *   // or import individual plugins:
 *   import { babysitterStatusPlugin, babysitterCostPlugin, babysitterGovernancePlugin }
 *     from '@a5c-ai/babysitter-tui-plugins';
 */

export { babysitterStatusPlugin } from './status-plugin.js';
export { babysitterCostPlugin } from './cost-plugin.js';
export { babysitterGovernancePlugin } from './governance-plugin.js';

// Re-export types for consumers
export type {
  RunSummary,
  RunState,
  EffectSummary,
  EffectKind,
  EffectStatus,
  CostEntry,
  CostSummary,
  GovernanceDecision,
} from './types.js';

// Re-export data utilities for advanced usage
export {
  scanRuns,
  loadRunJournal,
  extractEffects,
  extractGovernanceDecisions,
  scanRunCosts,
  resolveRunsDir,
} from './data.js';

// Convenience: all plugins as an array for bulk registration
import { babysitterStatusPlugin } from './status-plugin.js';
import { babysitterCostPlugin } from './cost-plugin.js';
import { babysitterGovernancePlugin } from './governance-plugin.js';
import type { TuiPlugin } from '@a5c-ai/agent-mux-tui/plugin';

export const babysitterPlugins: TuiPlugin[] = [
  babysitterStatusPlugin,
  babysitterCostPlugin,
  babysitterGovernancePlugin,
];
