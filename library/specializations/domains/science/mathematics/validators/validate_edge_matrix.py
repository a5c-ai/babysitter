#!/usr/bin/env python3
"""Validate complete edge coverage and emit a content-bound manifest."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("edge")
parser.add_argument("--profile", required=True)
parser.add_argument("--strict", choices=["review", "publication"], default="review")
parser.add_argument("--applicable-modules-json", required=True)
parser.add_argument("--manifest")
args = parser.parse_args()
errors = []
try:
    raw = Path(args.edge).read_bytes()
    data = json.loads(raw.decode("utf-8-sig", errors="strict"))
    profile = json.loads(Path(args.profile).read_text(encoding="utf-8", errors="strict"))
    classifications = json.loads(args.applicable_modules_json)
except Exception as exc:
    print(f"ERROR: {exc}", file=sys.stderr)
    raise SystemExit(2)
rows = data.get("rows") if isinstance(data, dict) else None
if not isinstance(rows, list):
    errors.append("edge matrix requires rows array")
    rows = []
row_ids = [row.get("id") for row in rows if isinstance(row, dict)]
by_id = {row.get("id"): row for row in rows if isinstance(row, dict)}
if len(row_ids) != len(set(row_ids)):
    errors.append("edge row IDs must be unique")
module_ids = profile.get("moduleSelection", {}).get("modules", [])
by_module = {row.get("id"): row for row in classifications if isinstance(row, dict)} if isinstance(classifications, list) else {}
if not isinstance(classifications, list) or len(classifications) != len(module_ids) or set(by_module) != set(module_ids):
    errors.append("applicableModules must classify every profile module exactly once")
for module_id in module_ids:
    classification = by_module.get(module_id, {})
    if not isinstance(classification.get("applicable"), bool) or not str(classification.get("rationale", "")).strip():
        errors.append(f"invalid applicability classification for {module_id}")
for expected in profile.get("edgeRows", []):
    row = by_id.get(expected.get("id"))
    if not row:
        errors.append(f"missing edge row {expected.get('id')}")
        continue
    for field in ("domain", "expected", "disposition", "reason", "obligationIds", "evidence"):
        if field not in row:
            errors.append(f"{expected.get('id')}: missing {field}")
    if row.get("domain") != expected.get("domain") or row.get("expected") != expected.get("expected"):
        errors.append(f"{expected.get('id')}: profile identity fields changed")
    if "moduleId" in row and row.get("moduleId") != expected.get("moduleId", "common"):
        errors.append(f"{expected.get('id')}: module identity differs from profile")
    if row.get("disposition") not in ("covered", "not-applicable", "open"):
        errors.append(f"{expected.get('id')}: invalid disposition")
    if row.get("disposition") == "not-applicable" and not str(row.get("reason", "")).strip():
        errors.append(f"{expected.get('id')}: N/A requires reason")
    if row.get("disposition") == "covered" and not row.get("evidence"):
        errors.append(f"{expected.get('id')}: covered requires evidence")
    module_id = expected.get("moduleId", "common")
    if module_id != "common" and module_id in by_module:
        classification = by_module[module_id]
        if classification.get("applicable") is True and row.get("disposition") == "not-applicable":
            errors.append(f"{expected.get('id')}: applicable module edge cannot be not-applicable")
        if classification.get("applicable") is False:
            if row.get("disposition") != "not-applicable":
                errors.append(f"{expected.get('id')}: inapplicable module edge must be not-applicable")
            if row.get("reason") != classification.get("rationale"):
                errors.append(f"{expected.get('id')}: N/A reason must exactly match module rationale")
    if args.strict == "publication" and row.get("disposition") == "open":
        errors.append(f"{expected.get('id')}: open edge cannot publish")
extra = set(by_id) - {row.get("id") for row in profile.get("edgeRows", [])}
if extra:
    errors.append(f"unknown edge rows: {sorted(extra)}")
manifest = {
    "status": "fail" if errors else "pass",
    "strictness": args.strict,
    "edgePath": str(Path(args.edge).resolve()),
    "edgeSha256": hashlib.sha256(raw).hexdigest(),
    "profileId": profile.get("id"),
    "profileVersion": profile.get("version"),
    "rowCount": len(rows),
    "requiredRows": len(profile.get("edgeRows", [])),
    "openRows": sorted(row.get("id") for row in rows if isinstance(row, dict) and row.get("disposition") == "open"),
    "errors": errors,
}
if args.manifest:
    Path(args.manifest).write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
for error in errors:
    print("ERROR: " + error, file=sys.stderr)
print(json.dumps(manifest, sort_keys=True))
raise SystemExit(bool(errors))
