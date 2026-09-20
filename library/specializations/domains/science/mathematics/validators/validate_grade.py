#!/usr/bin/env python3
"""Recompute adversarial grade arithmetic and cross-check registry/hash invariants."""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from schema_gate import validate as validate_schema

MAXIMA = {
    "coreMathematicalValidity": 35,
    "lemmaUseSiteClosure": 15,
    "domainEdgeCompleteness": 20,
    "exactReductionComplexity": 15,
    "expositionAmbiguity": 5,
    "deterministicArtifactSemantics": 10,
}
LENSES = {"dependency-use-site", "reconstruction-counterexample", "boundary-exact-complexity", "ambiguity-theorem-reference"}


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig", errors="strict"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("grade")
    parser.add_argument("--schema", required=True)
    parser.add_argument("--registry", required=True)
    parser.add_argument("--artifact-sha256", required=True)
    parser.add_argument("--artifact")
    parser.add_argument("--round-id")
    parser.add_argument("--lens", choices=sorted(LENSES))
    parser.add_argument("--gate-manifest-json")
    parser.add_argument("--edge-binding-json")
    args = parser.parse_args()
    errors = []
    try:
        grade, registry = load(args.grade), load(args.registry)
        errors.extend(validate_schema(grade, args.schema))
    except Exception as exc:
        print(f"cannot read input: {exc}", file=sys.stderr)
        return 2
    if not re.fullmatch(r"[0-9a-f]{64}", args.artifact_sha256):
        errors.append("invalid expected artifact hash")
    if args.artifact:
        try:
            actual_digest = hashlib.sha256(Path(args.artifact).read_bytes()).hexdigest()
            if actual_digest != args.artifact_sha256:
                errors.append("actual artifact bytes do not match expected hash")
        except Exception as exc:
            errors.append(f"cannot hash artifact: {exc}")
    if grade.get("artifactSha256") != args.artifact_sha256:
        errors.append("grade artifact hash is stale or different")
    if args.round_id and grade.get("roundId") != args.round_id:
        errors.append("grade roundId is stale or different")
    if args.lens and grade.get("lens") != args.lens:
        errors.append("grade lens is different from assigned lens")
    if registry.get("artifactSha256") != args.artifact_sha256:
        errors.append("registry artifact hash is stale or different")
    if grade.get("lens") not in LENSES:
        errors.append("unknown grading lens")
    if args.gate_manifest_json:
        try:
            expected_gate_manifest = json.loads(args.gate_manifest_json)
            if grade.get("gateManifest") != expected_gate_manifest:
                errors.append("grade gateManifest differs from deterministic gate evidence")
        except Exception as exc:
            errors.append(f"invalid expected gate manifest: {exc}")
    if args.edge_binding_json:
        try:
            expected_edge_binding = json.loads(args.edge_binding_json)
            if grade.get("edgeBinding") != expected_edge_binding:
                errors.append("grade edgeBinding differs from deterministic edge evidence")
        except Exception as exc:
            errors.append(f"invalid expected edge binding: {exc}")
    binding = grade.get("edgeBinding", {})
    if binding.get("strictness") not in {"review", "publication"}:
        errors.append("edge binding strictness missing or invalid")
    if not re.fullmatch(r"[0-9a-f]{64}", binding.get("edgeSha256", "")):
        errors.append("edge binding hash missing or invalid")
    if not binding.get("profileId") or not binding.get("profileVersion"):
        errors.append("edge binding profile identity missing")
    if not isinstance(binding.get("openRows"), list):
        errors.append("edge binding open inventory missing")
    scores = grade.get("categoryScores", {})
    for key, maximum in MAXIMA.items():
        value = scores.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= maximum:
            errors.append(f"invalid category score {key}={value!r}")
    computed_score = sum(scores.get(key, -1000) for key in MAXIMA)
    if grade.get("totalScore") != computed_score:
        errors.append(f"totalScore {grade.get('totalScore')} != category sum {computed_score}")
    findings = grade.get("findings", [])
    if not isinstance(findings, list):
        errors.append("findings must be an array")
        findings = []
    finding_ids = [item.get("id") for item in findings]
    if len(finding_ids) != len(set(finding_ids)):
        errors.append("duplicate finding IDs")
    obligation_ids = {item.get("id") for item in registry.get("obligations", [])}
    finding_deductions = 0
    for finding in findings:
        fid = finding.get("id", "<unknown>")
        for field in ("category", "severity", "location", "failureScenario", "repair"):
            if not finding.get(field):
                errors.append(f"{fid}: missing {field}")
        if not isinstance(finding.get("deduction"), int) or finding.get("deduction", 0) <= 0:
            errors.append(f"{fid}: deduction must be a positive integer")
        else:
            finding_deductions += finding["deduction"]
        refs = finding.get("obligationIds", [])
        if not refs:
            errors.append(f"{fid}: no obligation IDs")
        for oid in refs:
            if oid not in obligation_ids:
                errors.append(f"{fid}: unresolved obligation {oid}")
        location = finding.get("location", {})
        if not location.get("path") or not location.get("locator"):
            errors.append(f"{fid}: incomplete location")
    deductions = grade.get("deductions", [])
    deduction_map = {}
    for item in deductions:
        deduction_map[item.get("findingId")] = deduction_map.get(item.get("findingId"), 0) + item.get("points", 0)
    if sum(deduction_map.values()) != 100 - computed_score:
        errors.append("deduction total does not equal 100 - score")
    if finding_deductions != sum(deduction_map.values()):
        errors.append("finding deductions do not equal deduction entries")
    if set(deduction_map) != set(finding_ids):
        errors.append("deductions and findings do not map one-to-one by root finding ID")
    gate_results = grade.get("gateManifest", {}).get("gateResults", [])
    failed_gates = [g for g in gate_results if g.get("required", True) and g.get("status") != "pass"]
    open_required = [o for o in registry.get("obligations", []) if o.get("required", True) and o.get("status") in {"open", "failed", "stale", "waived"}]
    ledger_names = ["hypotheses", "useSites", "boundaries", "randomDistributions", "convergenceChecks", "exactArithmetic", "theoremReferences"]
    open_required_ledgers = [r for name in ledger_names for r in registry.get(name, []) if r.get("required", True) and r.get("status") in {"open", "failed", "stale", "waived"}]
    uncovered = [r for r in registry.get("boundaries", []) if r.get("required", True) and r.get("status") not in {"covered", "verified", "not-applicable"}]
    perfect = grade.get("perfectScoreDefensible") is True
    blockers = grade.get("blockingIssues", [])
    if perfect and (computed_score != 100 or findings or blockers or failed_gates or open_required or open_required_ledgers or uncovered or binding.get("openRows")):
        errors.append("perfectScoreDefensible conflicts with findings, blockers, gates, obligations, ledgers, boundaries, open edges, or score")
    if computed_score == 100 and (findings or blockers):
        errors.append("score 100 conflicts with findings or blockers")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"status":"pass","score":computed_score,"findings":len(findings),"lens":grade.get("lens")}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
