#!/usr/bin/env python3
"""Re-audit edges in graph examples vs schema/ontology-schema.yaml.

Outputs a JSON summary mirroring .v19-and-edge-audit.json structure.
"""
import os, sys, json, re
from collections import defaultdict, Counter

try:
    import yaml
except ImportError:
    sys.exit("PyYAML required")

ROOT = "C:/work/v6/graph"
SCHEMA = os.path.join(ROOT, "schema/ontology-schema.yaml")
EXAMPLES = os.path.join(ROOT, "schema/examples")

with open(SCHEMA, "r", encoding="utf-8") as f:
    schema = yaml.safe_load(f)

# Build edge declarations
declared = {}  # name -> {source: set, target: set, cardinality}
for ek in schema.get("edgeKinds", []):
    name = ek.get("name")
    if not name:
        continue
    # if multiple edges share name, merge
    src = set(ek.get("source", []) or [])
    tgt = set(ek.get("target", []) or [])
    if name in declared:
        declared[name]["source"] |= src
        declared[name]["target"] |= tgt
    else:
        declared[name] = {"source": src, "target": tgt, "cardinality": ek.get("cardinality")}

# Walk examples, collect (file, source_kind, source_id, edge_name, target_id) records
edge_usage = []  # (file, source_kind, edge_name, target_id)
files_per_edge = defaultdict(set)

# Build id -> kind map by scanning examples
id_to_kind = {}
all_files = []
for dp, _, fns in os.walk(EXAMPLES):
    for fn in fns:
        if fn.endswith((".yaml", ".yml")):
            all_files.append(os.path.join(dp, fn))

for path in all_files:
    try:
        with open(path, "r", encoding="utf-8") as f:
            doc = yaml.safe_load(f)
    except Exception:
        continue
    if not isinstance(doc, dict):
        continue
    nk = doc.get("nodeKind")
    nid = doc.get("id")
    if nk and nid:
        id_to_kind[nid] = nk

# Also pull id->kind from schema nodeKinds examples (for ids not embedded)
# Pattern: id prefix maps to NodeKind. Build a heuristic.
PREFIX_TO_KIND = {}
for nk in schema.get("nodeKinds", []):
    name = nk.get("name")
    # Try to derive prefix from id pattern in examples - we'll rely on observed.

def resolve_kind(target_id):
    if not isinstance(target_id, str):
        return None
    if target_id in id_to_kind:
        return id_to_kind[target_id]
    # heuristic: prefix before ':'
    return None

# Scan example files for edges
for path in all_files:
    try:
        with open(path, "r", encoding="utf-8") as f:
            doc = yaml.safe_load(f)
    except Exception:
        continue
    if not isinstance(doc, dict):
        continue
    src_kind = doc.get("nodeKind")
    edges = doc.get("edges")
    if not isinstance(edges, dict):
        continue
    for ename, refs in edges.items():
        if not isinstance(refs, list):
            continue
        files_per_edge[ename].add(path)
        for ref in refs:
            if isinstance(ref, dict):
                tgt = ref.get("target") or ref.get("targetId")
            elif isinstance(ref, str):
                tgt = ref
            else:
                tgt = None
            edge_usage.append((path, src_kind, ename, tgt))

# Undeclared edges
undeclared = []
for ename, fileset in files_per_edge.items():
    if ename not in declared:
        undeclared.append({"name": ename, "files": len(fileset)})
undeclared.sort(key=lambda x: -x["files"])

# Source/target mismatches
mismatch_count = 0
mismatch_by_edge = Counter()
mismatch_examples = defaultdict(list)
for (path, src_kind, ename, tgt) in edge_usage:
    if ename not in declared:
        continue
    decl = declared[ename]
    src_ok = (not decl["source"]) or (src_kind in decl["source"]) or ("any" in decl["source"]) or ("Any" in decl["source"])
    tgt_kind = resolve_kind(tgt)
    tgt_ok = True
    if tgt_kind and decl["target"]:
        tgt_ok = (tgt_kind in decl["target"]) or ("any" in decl["target"]) or ("Any" in decl["target"])
    if not (src_ok and tgt_ok):
        mismatch_count += 1
        mismatch_by_edge[ename] += 1
        if len(mismatch_examples[ename]) < 3:
            mismatch_examples[ename].append({
                "file": os.path.relpath(path, ROOT),
                "src_kind": src_kind,
                "tgt_kind": tgt_kind,
                "tgt_id": tgt,
                "declared_source": sorted(decl["source"]),
                "declared_target": sorted(decl["target"]),
            })

# Passing examples = examples that have no edge issues (undeclared or mismatch)
passing = 0
problematic_files = set()
for (path, src_kind, ename, tgt) in edge_usage:
    if ename not in declared:
        problematic_files.add(path)
        continue
    decl = declared[ename]
    src_ok = (not decl["source"]) or (src_kind in decl["source"])
    tgt_kind = resolve_kind(tgt)
    if tgt_kind and decl["target"]:
        if tgt_kind not in decl["target"]:
            problematic_files.add(path)
            continue
    if not src_ok:
        problematic_files.add(path)

files_with_edges = set(p for (p, _, _, _) in edge_usage)
passing = len(files_with_edges - problematic_files)

result = {
    "totalUndeclared": len(undeclared),
    "undeclaredEdges": undeclared,
    "totalMismatches": mismatch_count,
    "mismatchByEdge": mismatch_by_edge.most_common(20),
    "mismatchExamples": dict(mismatch_examples),
    "filesWithEdges": len(files_with_edges),
    "passing": passing,
}

out = sys.argv[1] if len(sys.argv) > 1 else "C:/work/v6/.edge-audit-rerun.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, default=list)
print(f"Total undeclared: {len(undeclared)}")
print(f"Total mismatches: {mismatch_count}")
print(f"Files with edges: {len(files_with_edges)}")
print(f"Passing: {passing}")
print(f"Top undeclared: {undeclared[:10]}")
print(f"Top mismatch by edge: {mismatch_by_edge.most_common(10)}")
print(f"Wrote {out}")
