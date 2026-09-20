#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd); PYTHON_BIN=${PYTHON_BIN:-python}
pass(){ "$@" >/dev/null; }
fail(){ if "$@" >/dev/null 2>&1; then echo "expected failure: $*" >&2; exit 1; fi; }
RS="$ROOT/schemas/proof-obligation-registry.schema.json"; GS="$ROOT/schemas/adversarial-grade.schema.json"; P="$ROOT/profiles/submodular-optimization.json"
MODULES='[{"id":"multilinear-extension","applicable":true,"rationale":"fixture exercises multilinear extension"},{"id":"matroid-maximization","applicable":true,"rationale":"fixture exercises matroid maximization"},{"id":"density-reduction","applicable":true,"rationale":"fixture exercises density reduction"},{"id":"graphical-specialization","applicable":false,"rationale":"fixture is not a graphical specialization"}]'
pass "$PYTHON_BIN" "$ROOT/validators/validate_math_artifact.py" "$ROOT/validators/fixtures/latex/valid.tex" --required-section Theorem --required-section Proof
fail "$PYTHON_BIN" "$ROOT/validators/validate_math_artifact.py" "$ROOT/validators/fixtures/latex/referenced-starred-lemma.tex"
fail "$PYTHON_BIN" "$ROOT/validators/validate_math_artifact.py" "$ROOT/validators/fixtures/latex/undefined-ref.tex"
pass "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/valid-registry.json" --schema "$RS" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/invalid-open-registry.json" --schema "$RS" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/path-mismatch-registry.json" --schema "$RS" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/unknown-registry-field.json" --schema "$RS" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/module-template-mismatch-registry.json" --schema "$RS" --profile "$P" --strict publication
for fixture in empty-hypotheses-ledger empty-use-sites-ledger empty-boundaries-ledger empty-random-distributions-ledger empty-convergence-checks-ledger empty-exact-arithmetic-ledger empty-theorem-references-ledger; do
  fail "$PYTHON_BIN" "$ROOT/validators/validate_registry.py" "$ROOT/validators/fixtures/contracts/$fixture.json" --schema "$RS" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
done
pass "$PYTHON_BIN" "$ROOT/validators/validate_edge_matrix.py" "$ROOT/validators/fixtures/contracts/valid-edge-matrix.json" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_edge_matrix.py" "$ROOT/validators/fixtures/contracts/open-edge-matrix.json" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
fail "$PYTHON_BIN" "$ROOT/validators/validate_edge_matrix.py" "$ROOT/validators/fixtures/contracts/module-disposition-mismatch-edge-matrix.json" --profile "$P" --strict publication --applicable-modules-json "$MODULES"
pass "$PYTHON_BIN" "$ROOT/validators/validate_examples.py"
pass "$PYTHON_BIN" "$ROOT/validators/validate_grade.py" "$ROOT/validators/fixtures/contracts/valid-grade.json" --schema "$GS" --registry "$ROOT/validators/fixtures/contracts/valid-registry.json" --artifact-sha256 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
fail "$PYTHON_BIN" "$ROOT/validators/validate_grade.py" "$ROOT/validators/fixtures/contracts/invalid-perfect-grade.json" --schema "$GS" --registry "$ROOT/validators/fixtures/contracts/valid-registry.json" --artifact-sha256 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
fail "$PYTHON_BIN" "$ROOT/validators/validate_grade.py" "$ROOT/validators/fixtures/contracts/unknown-grade-field.json" --schema "$GS" --registry "$ROOT/validators/fixtures/contracts/valid-registry.json" --artifact-sha256 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
pass "$PYTHON_BIN" "$ROOT/validators/validate_registry_evolution.py" "$ROOT/validators/fixtures/contracts/valid-registry.json" "$ROOT/validators/fixtures/contracts/valid-registry.json"
S=$(mktemp); H=$($PYTHON_BIN -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" "$ROOT/validators/fixtures/latex/valid.tex"); pass "$PYTHON_BIN" "$ROOT/validators/validate_sources.py" --source "$ROOT/validators/fixtures/latex/valid.tex" --expected-sha256 "$H" --metadata '{"sourcePath":"fixture.pdf","mediaType":"application/pdf","extractionTool":"fixture-extractor","extractionVersion":"1"}' --manifest "$S"; fail "$PYTHON_BIN" "$ROOT/validators/validate_sources.py" --source "$ROOT/validators/fixtures/latex/valid.tex" --expected-sha256 "$H" --metadata '{"mediaType":"application/pdf"}' --manifest "$S"; rm -f "$S"
M=$(mktemp); pass "$PYTHON_BIN" "$ROOT/validators/validate_tex.py" "$ROOT/validators/fixtures/latex/valid.tex" --policy off --unavailable fail --manifest "$M"; rm -f "$M"
printf '%s\n' '{"status":"pass","schemaGates":true,"profileCoverage":true,"requiredLedgers":true,"edgeMatrix":true,"examples":true,"extractionMetadata":true,"positiveFixtures":9,"negativeFixtures":18}'
