# fix011-missing-surface-target

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). Declares
`main`, `types`, and a `bin` under `dist/` but has no `dist/` output and no
build script, so the packed tarball omits every declared surface target. The
verifier must FAIL this fixture at the tarball surface check.
