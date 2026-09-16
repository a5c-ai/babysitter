#!/usr/bin/env python3
"""Validate text sources and conditionally require non-text extraction provenance."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--source", action="append", default=[])
parser.add_argument("--expected-sha256", action="append", default=[])
parser.add_argument("--metadata", action="append", default=[])
parser.add_argument("--manifest", required=True)
args = parser.parse_args()
errors = []
items = []
if not (len(args.source) == len(args.expected_sha256) == len(args.metadata)):
    errors.append("each source requires an expected hash token and metadata object")
for name, expected, metadata_json in zip(args.source, args.expected_sha256, args.metadata):
    try:
        metadata = json.loads(metadata_json)
    except Exception as exc:
        errors.append(f"invalid extraction metadata for {name}: {exc}")
        continue
    media_type = metadata.get("mediaType", "")
    direct_text = metadata.get("directText") is True
    if not direct_text:
        for field in ("sourcePath", "mediaType", "extractionTool", "extractionVersion"):
            if not isinstance(metadata.get(field), str) or not metadata[field].strip():
                errors.append(f"non-text extraction for {name} requires {field}")
        if media_type.startswith("text/"):
            errors.append(f"extraction metadata for {name} must identify a non-text media type")
        if expected == "recompute":
            errors.append(f"non-text extraction for {name} requires a declared SHA-256")
    elif media_type and not media_type.startswith("text/"):
        errors.append(f"direct source {name} is not text media")
    source = Path(name)
    try:
        raw = source.read_bytes()
        text = raw.decode("utf-8", errors="strict")
    except Exception as exc:
        errors.append(f"cannot read strict UTF-8 source {name}: {exc}")
        continue
    digest = hashlib.sha256(raw).hexdigest()
    if not raw:
        errors.append(f"empty source {name}")
    if "�" in text:
        errors.append(f"replacement character in {name}")
    if expected != "recompute" and expected != digest:
        errors.append(f"extraction hash mismatch for {name}: declared {expected}, recomputed {digest}")
    items.append({
        "path": str(source.resolve()),
        "bytes": len(raw),
        "sha256": digest,
        "declaredSha256": None if expected == "recompute" else expected,
        "hashRecomputed": True,
        "metadata": metadata,
    })
manifest = {"status": "fail" if errors else "pass", "artifacts": items, "complete": len(items) == len(args.source), "errors": errors}
Path(args.manifest).write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
for error in errors:
    print("ERROR: " + error, file=sys.stderr)
print(json.dumps(manifest, sort_keys=True))
raise SystemExit(bool(errors))
