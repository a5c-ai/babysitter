/**
 * @a5c-ai/tula — Unified agent product
 *
 * Re-exports the full public API surface from every layer:
 *   L4  agent-core     — loop, subagent, context, synthesis
 *   L5  agent-runtime  — daemon, session, cost, observability, telemetry
 *   L6  agent-platform — harness, governance, CLI, interaction, storage
 *
 * agent-platform sits at the top of the dependency chain and already
 * re-exports key symbols from core and runtime, so it is the primary
 * barrel.  The lower layers are additionally available under namespaces
 * (`core`, `runtime`) for consumers that need unambiguous access.
 */

// L6 — primary barrel (re-exports overlapping symbols from L4/L5)
export * from "@a5c-ai/tula-platform";

// L4 and L5 — namespaced for unambiguous access
import * as core from "@a5c-ai/tula-core";
import * as runtime from "@a5c-ai/tula-runtime";
export { core, runtime };
