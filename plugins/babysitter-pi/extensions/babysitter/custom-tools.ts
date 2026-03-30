/**
 * Custom tool registrations for the babysitter oh-my-pi extension.
 *
 * Registers babysitter-specific tools with oh-my-pi so that agents (and
 * users, if they are feeling adventurous) can inspect run status, post
 * results for pending effects, and manually trigger iterations — all
 * without leaving the oh-my-pi session.
 *
 * @module custom-tools
 */

import { getActiveRun } from './session-binder';
import { getRunStatus, postResult, iterate } from './sdk-bridge';

// ---------------------------------------------------------------------------
// Tool: babysitter_run_status
// ---------------------------------------------------------------------------

/**
 * Builds and returns the run-status tool definition.
 *
 * Retrieves the current babysitter run state including status, iteration
 * count, and pending effects.  Requires an active run bound via the
 * session binder; returns a helpful message when no run is active.
 */
function buildRunStatusTool() {
  return {
    name: 'babysitter_run_status',
    label: 'Babysitter Run Status',
    description:
      'Get the current babysitter run status including run state, iteration count, and pending effects.',
    parameters: {},
    execute: async (
      _toolCallId: string,
      _params: Record<string, unknown>,
      _signal: unknown,
      _onUpdate: unknown,
      _ctx: unknown,
    ) => {
      const activeRun = getActiveRun();

      if (!activeRun) {
        return {
          content: 'No active babysitter run found.',
          details: { active: false },
        };
      }

      const status = await getRunStatus(activeRun.runDir);

      return {
        content: [
          `Run: ${status.runId}`,
          `Process: ${status.processId}`,
          `Status: ${status.status}`,
          `Iteration: ${activeRun.iteration}`,
          `Pending effects: ${status.pendingEffects.length}`,
        ].join('\n'),
        details: {
          active: true,
          runId: status.runId,
          processId: status.processId,
          status: status.status,
          iteration: activeRun.iteration,
          pendingEffects: status.pendingEffects,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Tool: babysitter_post_result
// ---------------------------------------------------------------------------

/**
 * Builds and returns the post-result tool definition.
 *
 * Posts a result (ok or error) for a pending effect back into the run
 * journal.  Delegates directly to {@link postResult} from the SDK bridge.
 */
function buildPostResultTool() {
  return {
    name: 'babysitter_post_result',
    label: 'Babysitter Post Result',
    description:
      'Post a result for a pending babysitter effect. Requires an effectId and status ("ok" or "error"). Optionally accepts a value string.',
    parameters: {
      type: 'object',
      properties: {
        effectId: { type: 'string', description: 'The effect identifier to resolve.' },
        status: {
          type: 'string',
          enum: ['ok', 'error'],
          description: 'Whether the effect succeeded or failed.',
        },
        value: {
          type: 'string',
          description: 'Optional result value to attach to the resolution.',
        },
      },
      required: ['effectId', 'status'],
    },
    execute: async (
      _toolCallId: string,
      params: Record<string, unknown>,
      _signal: unknown,
      _onUpdate: unknown,
      _ctx: unknown,
    ) => {
      const activeRun = getActiveRun();

      if (!activeRun) {
        return {
          content: 'No active babysitter run. Cannot post result.',
          details: { posted: false },
        };
      }

      const effectId = params.effectId as string;
      const status = params.status as 'ok' | 'error';
      const value = params.value as string | undefined;

      const artifacts = await postResult({
        runDir: activeRun.runDir,
        effectId,
        status,
        value,
        error: status === 'error' ? value : undefined,
      });

      return {
        content: `Result posted for effect ${effectId} (status: ${status}).`,
        details: {
          posted: true,
          effectId,
          status,
          artifacts,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Tool: babysitter_iterate
// ---------------------------------------------------------------------------

/**
 * Builds and returns the iterate tool definition.
 *
 * Manually triggers the next orchestration iteration for the active run.
 * Useful when the automatic loop is paused or when an agent wants
 * explicit control over iteration timing.
 */
function buildIterateTool() {
  return {
    name: 'babysitter_iterate',
    label: 'Babysitter Iterate',
    description:
      'Manually trigger the next babysitter orchestration iteration for the active run.',
    parameters: {},
    execute: async (
      _toolCallId: string,
      _params: Record<string, unknown>,
      _signal: unknown,
      _onUpdate: unknown,
      _ctx: unknown,
    ) => {
      const activeRun = getActiveRun();

      if (!activeRun) {
        return {
          content: 'No active babysitter run. Cannot iterate.',
          details: { iterated: false },
        };
      }

      const result = await iterate(activeRun.runDir);

      return {
        content: `Iteration completed. Status: ${(result as Record<string, unknown>).status ?? 'unknown'}.`,
        details: {
          iterated: true,
          result,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Public registration function
// ---------------------------------------------------------------------------

/**
 * Register all babysitter custom tools with the oh-my-pi host.
 *
 * @param pi - The oh-my-pi extension API handle (typed as `any` to
 *             accommodate the `registerTool` overload that accepts
 *             the extended tool shape with `label` and `execute`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCustomTools(pi: any): void {
  pi.registerTool(buildRunStatusTool());
  pi.registerTool(buildPostResultTool());
  pi.registerTool(buildIterateTool());
}
