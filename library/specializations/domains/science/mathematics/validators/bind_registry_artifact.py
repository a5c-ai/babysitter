#!/usr/bin/env python3
"""Copy a registry for an immutable round and bind it to the artifact SHA-256."""
import argparse
import hashlib
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("registry")
    parser.add_argument("artifact")
    parser.add_argument("output")
    parser.add_argument("--hash-output", required=True)
    args = parser.parse_args()
    try:
        data = json.loads(Path(args.registry).read_text(encoding="utf-8", errors="strict"))
        digest = hashlib.sha256(Path(args.artifact).read_bytes()).hexdigest()
        data["artifactSha256"] = digest
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        Path(args.hash_output).write_text(digest + "\n", encoding="ascii")
    except Exception as exc:
        print(f"ERROR: cannot bind registry to artifact: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"status":"pass","artifactSha256":digest,"registryPath":args.output}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
