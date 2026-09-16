#!/usr/bin/env python3
"""Validate documented JSON ledger examples against authoritative schema definitions."""
import json
import re
import sys
from pathlib import Path
from schema_gate import validate as validate_schema

root = Path(__file__).resolve().parent.parent
registry_schema = json.loads((root / "schemas" / "proof-obligation-registry.schema.json").read_text(encoding="utf-8"))
grade_schema = json.loads((root / "schemas" / "adversarial-grade.schema.json").read_text(encoding="utf-8"))
cases = [
    (root / "examples" / "proof-quality-convergence" / "matroid-monotone-maximization" / "README.md", registry_schema, "distribution"),
    (root / "examples" / "proof-quality-convergence" / "density-minimization" / "README.md", registry_schema, "arithmetic"),
    (root / "references" / "proof-obligation-registry.md", registry_schema, "obligation"),
    (root / "references" / "adversarial-proof-rubric.md", grade_schema, "gradeFinding"),
]
errors = []
for readme, schema, definition in cases:
    text = readme.read_text(encoding="utf-8", errors="strict")
    match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if not match:
        errors.append(f"{readme}: missing JSON example")
        continue
    try:
        instance = json.loads(match.group(1))
    except Exception as exc:
        errors.append(f"{readme}: invalid JSON example: {exc}")
        continue
    wrapper_schema = {
        "$schema": schema["$schema"],
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    temporary = root / "validators" / f".example-{definition}.schema.json"
    try:
        temporary.write_text(json.dumps(wrapper_schema), encoding="utf-8")
        errors.extend(f"{readme.name}/{definition}: {error}" for error in validate_schema(instance, temporary))
    finally:
        temporary.unlink(missing_ok=True)
for error in errors:
    print("ERROR: " + error, file=sys.stderr)
print(json.dumps({"status": "fail" if errors else "pass", "examples": len(cases), "errors": errors}, sort_keys=True))
raise SystemExit(bool(errors))
