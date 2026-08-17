# fix011-bin-only-metapackage

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011) and
`scripts/verify-published-release.mjs` (FIX-010).

A **bin-only metapackage**, modelled on `@a5c-ai/babysitter`: it declares no
`main`, no `module` and no `exports`, and ships only `bin/` plus this README.
Its entire consumer surface is the `fix011-bin-only` executable.

Both release gates must PASS it. Before the fix, `runtimeImportSpecs()`
synthesized a root import specifier for any manifest without an `exports`
field, so Node fell back to legacy main resolution, looked for an `index.js`
this package deliberately never ships, and failed the release with
`ERR_MODULE_NOT_FOUND` — a false positive that would have blocked channel
promotion for the real metapackage.
