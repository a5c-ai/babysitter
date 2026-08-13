# fix011-fix004-extensions-replica

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). Replicates
the broken `@a5c-ai/extensions-adapter@6.0.0` artifact (FIX-004): the manifest
declares `dist/index.js`, `dist/cli.js`, and the `dist/extensions-adapter.js`
compatibility bin, but the packed tarball contains only `package.json` and
`README.md`. The verifier must FAIL this fixture at the tarball surface check,
proving it would have caught FIX-004 before publication.
