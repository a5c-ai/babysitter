#!/usr/bin/env python3
"""Dangling reference audit for graph examples."""
import os
import re
import sys
import json
from collections import defaultdict, Counter

ROOT = r"C:/work/v6/graph/schema/examples"

# Collect all defined ids: scan for `^id: <prefix>:<rest>` lines.
defined_ids = {}  # id -> file
ref_locations = defaultdict(list)  # id -> [files]

ID_LINE = re.compile(r"^\s*id:\s*([A-Za-z][A-Za-z0-9_-]*:[A-Za-z0-9_./:@<>=-]+)\s*$")
# Refs: any value that looks like `prefix:rest` where prefix is a known kind.
# We'll collect all `<word>:<word>` occurrences from values and post-filter.
REF_TOKEN = re.compile(r"\b([a-z][a-z0-9-]+):([A-Za-z0-9_./@<>=:-]+)")
# Skip URL-like (http:, https:, file:, etc.)
URL_PREFIXES = {"http", "https", "file", "git", "ssh", "ftp", "mailto", "data", "ws", "wss"}

# Walk all yaml files
all_files = []
for dirpath, _, filenames in os.walk(ROOT):
    for fn in filenames:
        if fn.endswith(".yaml") or fn.endswith(".yml"):
            all_files.append(os.path.join(dirpath, fn))

# Pass 1: collect ids
for f in all_files:
    try:
        with open(f, encoding="utf-8") as fh:
            for line in fh:
                m = ID_LINE.match(line)
                if m:
                    defined_ids[m.group(1)] = f
    except Exception as e:
        print(f"err reading {f}: {e}", file=sys.stderr)

# Pass 2: collect refs.
# Strategy: scan all lines for `prefix:value` tokens, but exclude:
#  - the `id:` line of the file itself (definitions)
#  - URL schemes
#  - YAML keys (lines like `id: foo`, `nodeKind: Foo`)
# Strip comments first.
ref_count = Counter()
ref_first_file = {}

for f in all_files:
    try:
        with open(f, encoding="utf-8") as fh:
            for lineno, raw in enumerate(fh, 1):
                # strip comments
                line = re.sub(r"#.*$", "", raw)
                # skip the `id:` definition line
                if ID_LINE.match(raw):
                    continue
                # skip nodeKind: and other type-tagging
                if re.match(r"^\s*nodeKind:\s", line):
                    continue
                for m in REF_TOKEN.finditer(line):
                    pfx, rest = m.group(1), m.group(2)
                    if pfx in URL_PREFIXES:
                        continue
                    # Skip yaml keys before colon (like `attributes:` etc) — REF_TOKEN requires a value after, so OK
                    full = f"{pfx}:{rest}"
                    # Skip if this matches the file's own id
                    ref_count[full] += 1
                    ref_locations[full].append((f, lineno))
                    if full not in ref_first_file:
                        ref_first_file[full] = f
    except Exception as e:
        print(f"err reading {f}: {e}", file=sys.stderr)

# Compute dangling
dangling = {}
for ref, count in ref_count.items():
    if ref in defined_ids:
        continue
    dangling[ref] = count

# Group by prefix
by_prefix = defaultdict(list)
for ref, count in dangling.items():
    pfx = ref.split(":", 1)[0]
    by_prefix[pfx].append((ref, count))

# Severity: high if count >= 5, medium if >=2, else low
def severity(count):
    if count >= 5:
        return "high"
    if count >= 2:
        return "medium"
    return "low"

result = {
    "definedCount": len(defined_ids),
    "refsTotal": sum(ref_count.values()),
    "uniqueRefsTotal": len(ref_count),
    "danglingUnique": len(dangling),
    "danglingByPrefix": {pfx: len(items) for pfx, items in by_prefix.items()},
    "dangling": [],
}

for ref, count in sorted(dangling.items(), key=lambda x: (-x[1], x[0])):
    locs = ref_locations[ref][:3]
    result["dangling"].append({
        "id": ref,
        "expectedNodeKind": ref.split(":", 1)[0],
        "count": count,
        "severity": severity(count),
        "sampleRefencingFiles": [l[0].replace("\\", "/") for l in locs],
    })

with open(r"C:/work/v6/.dangling-audit.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print(f"defined={len(defined_ids)} refsUnique={len(ref_count)} dangling={len(dangling)}")
for pfx, items in sorted(by_prefix.items(), key=lambda x: -len(x[1])):
    print(f"  {pfx}: {len(items)} dangling")
