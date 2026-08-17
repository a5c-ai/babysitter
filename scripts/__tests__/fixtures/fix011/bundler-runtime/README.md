# fix011-bundler-runtime

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). The package
declares a bundler runtime through the standard `"react-native"` manifest field
and ships an entrypoint bare Node cannot parse. The verifier must skip only the
Node `imports` step, name the declaration in the recorded reason, and still run
`surfaces`, `install` and `typecheck`.
