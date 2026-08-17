# fix011-good-package

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). A healthy
package: every declared surface exists in the packed tarball, the bin has a
shebang and exits 0 on `--help`, types typecheck, and there are no undeclared
runtime imports. The verifier must PASS this fixture.
