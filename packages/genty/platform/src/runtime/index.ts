/**
 * Runtime barrel — intentionally empty.
 *
 * The deprecated SDK re-exports (createRun, orchestrateIteration,
 * commitEffectResult, etc.) were removed.  Production code already
 * imports directly from @a5c-ai/babysitter-sdk or uses the
 * OrchestrationProvider registry.  Types live in ../types.
 */

// This subpath is published (`exports["./runtime"]`), so it must still be a
// module: a declaration file with no top-level export is not one, and a
// consumer's `import ... from '@a5c-ai/genty-platform/runtime'` fails to
// typecheck with TS2306. The empty export marks it as an ES module without
// re-introducing any of the removed re-exports.
export {};
