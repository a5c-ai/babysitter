# fix011-failing-verify-release

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). Every packed
surface is healthy, but the package declares a `verify:release` gate that
rejects the artifact. The verifier must run that package-specific gate (the same
one `scripts/publish-package-from-tag.mjs` runs before publishing) and fail the
package at the `verifyRelease` step. FIX-004 relies on this wiring for the
extensions adapter's compiler/bin release gate.
