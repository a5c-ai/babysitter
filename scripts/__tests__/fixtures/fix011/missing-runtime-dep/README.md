# fix011-missing-runtime-dep

Test fixture for `scripts/verify-release-artifacts.mjs` (FIX-011). Models the
FIX-002 class of defect: a runtime `require` of a package that is missing from
`dependencies`. The verifier must FAIL this fixture at the import step of the
fresh temporary consumer.
