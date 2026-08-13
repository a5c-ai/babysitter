# fix011-hoist-only

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). Requires
`typescript`, which resolves inside this monorepo only because of the
repository root `node_modules` (workspace hoisting). In a fresh temporary
consumer with no workspace links the import must fail, so the verifier must
FAIL this fixture at the import step.
