# fix011-no-consumer-surface

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011) and
`scripts/verify-published-release.mjs` (FIX-010).

This package declares no `main`, no `module`, no `exports` and no `bin`. Nothing
about it is importable or executable by a consumer.

Omitting the synthesized root import for bin-only packages must NOT turn this
case into a silent pass: "there was nothing to check" is not evidence that a
release artifact works. Both gates must fail it with an explicit
no-consumer-surface diagnostic.
