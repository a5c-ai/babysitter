#!/usr/bin/env python3
"""Inject process-owned registry identity and policy fields from the selected profile."""
import argparse
import json
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("registry")
parser.add_argument("--profile", required=True)
parser.add_argument("--applicable-modules-json", required=True)
args = parser.parse_args()
try:
    registry_path = Path(args.registry)
    registry = json.loads(registry_path.read_text(encoding="utf-8", errors="strict"))
    profile = json.loads(Path(args.profile).read_text(encoding="utf-8", errors="strict"))
    applicable_modules = json.loads(args.applicable_modules_json)
    expected_ids = profile["moduleSelection"]["modules"]
    if not isinstance(applicable_modules, list) or len(applicable_modules) != len(expected_ids):
        raise ValueError("applicableModules must classify every profile module exactly once")
    by_id = {row.get("id"): row for row in applicable_modules if isinstance(row, dict)}
    if set(by_id) != set(expected_ids) or len(by_id) != len(applicable_modules):
        raise ValueError("applicableModules IDs must exactly match profile modules")
    for module_id in expected_ids:
        row = by_id[module_id]
        if not isinstance(row.get("applicable"), bool) or not isinstance(row.get("rationale"), str) or not row["rationale"].strip():
            raise ValueError(f"invalid applicability classification for {module_id}")
    registry["contractVersion"] = profile["contractVersion"]
    registry["profileId"] = profile["id"]
    registry["profileVersion"] = profile["version"]
    registry["profileCoverageRequired"] = True
    registry["semanticDetailsRequired"] = True
    registry["applicableModules"] = [by_id[module_id] for module_id in expected_ids]
    registry_path.write_text(json.dumps(registry, indent=2, sort_keys=True) + "\n", encoding="utf-8")
except Exception as exc:
    print(f"ERROR: cannot inject registry policy: {exc}", file=sys.stderr)
    raise SystemExit(2)
print(json.dumps({"status": "pass", "registry": str(registry_path.resolve()), "profileId": registry["profileId"], "profileVersion": registry["profileVersion"]}, sort_keys=True))
