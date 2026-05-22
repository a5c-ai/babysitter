#!/usr/bin/env python3
"""
Split ontology-schema.yaml into per-cluster NodeKind files +
single edge-kinds.yaml + thin manifest.

One-shot mechanical script. Read-only on the existing schema until the
final write phase. Idempotent on the manifest (will overwrite outputs).
"""
from __future__ import annotations

import sys
from collections import OrderedDict
from pathlib import Path

import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
SCHEMA_ROOT = SCRIPT_DIR.parent.parent  # graph/
SCHEMA_DIR = SCHEMA_ROOT / "schema"
ONTOLOGY_YAML = SCHEMA_DIR / "ontology-schema.yaml"
NODE_KINDS_DIR = SCHEMA_DIR / "node-kinds"
EDGE_KINDS_OUT = SCHEMA_DIR / "edge-kinds.yaml"

# Cluster name normalization: variant -> canonical
CLUSTER_NORMALIZE = {
    "5-communication": "5-communication-primitives",
    "5-communication-primitives": "5-communication-primitives",
    "5-channels-hooks": "5-communication-primitives",
    "7-extensions": "7-extensions",
    "7-extension-primitives": "7-extensions",
    "12-security": "12-trust",
    "12-trust": "12-trust",
    "15-provenance": "15-catalog-provenance",
    "15-catalog-provenance": "15-catalog-provenance",
    # Unprefixed clusters: number them.
    "cost-quota": "16-cost-quota",
    "observability-pipeline": "17-observability-pipeline",
    "vcs-ci": "18-vcs-ci",
    "compliance-safety": "19-compliance-safety",
    "context-engineering": "20-context-engineering",
}

# Canonical cluster -> filename slug (no numeric prefix).
CLUSTER_FILE = {
    "1-stack-layers": "stack-layers",
    "2-compute-path": "compute-path",
    "3-agent-stack": "agent-stack",
    "4-surfacing-path": "surfacing-path",
    "5-communication-primitives": "communication-primitives",
    "6-lifecycle": "lifecycle",
    "7-extensions": "extensions",
    "8-capabilities": "capabilities",
    "9-domain": "domain",
    "10-roles": "roles",
    "11-benchmarks": "benchmarks",
    "12-trust": "trust",
    "13-catalog-meta": "catalog-meta",
    "14-terminology": "terminology",
    "15-catalog-provenance": "catalog-provenance",
    "16-cost-quota": "cost-quota",
    "17-observability-pipeline": "observability-pipeline",
    "18-vcs-ci": "vcs-ci",
    "19-compliance-safety": "compliance-safety",
    "20-context-engineering": "context-engineering",
}

# Manifest order (numeric).
MANIFEST_ORDER = sorted(
    CLUSTER_FILE.keys(),
    key=lambda k: int(k.split("-", 1)[0]),
)


def normalize_cluster_value(v):
    return CLUSTER_NORMALIZE.get(v, v)


# yaml: keep insertion order, no aliases, sane indent.
class NoAliasDumper(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True


def represent_dict_preserve(dumper, data):
    return dumper.represent_mapping("tag:yaml.org,2002:map", data.items())


NoAliasDumper.add_representer(dict, represent_dict_preserve)
NoAliasDumper.add_representer(OrderedDict, represent_dict_preserve)


def dump_yaml(obj):
    return yaml.dump(
        obj,
        Dumper=NoAliasDumper,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
        width=10000,
    )


def main() -> int:
    with open(ONTOLOGY_YAML, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)

    node_kinds = data.get("nodeKinds") or []
    edge_kinds = data.get("edgeKinds") or []

    print(f"loaded NodeKinds={len(node_kinds)} EdgeKinds={len(edge_kinds)}",
          file=sys.stderr)

    # Normalize cluster values + group.
    by_cluster: dict[str, list] = {c: [] for c in CLUSTER_FILE}
    norm_count = 0
    for nk in node_kinds:
        if not isinstance(nk, dict):
            continue
        # Single cluster
        if "cluster" in nk:
            old = nk["cluster"]
            new = normalize_cluster_value(old)
            if new != old:
                norm_count += 1
            nk["cluster"] = new
            target = new
        elif "clusters" in nk:
            old_list = list(nk["clusters"] or [])
            new_list = []
            for v in old_list:
                nv = normalize_cluster_value(v)
                if nv != v:
                    norm_count += 1
                new_list.append(nv)
            nk["clusters"] = new_list
            target = new_list[0] if new_list else None
        else:
            target = None

        if target is None:
            print(f"WARN: NodeKind {nk.get('name')!r} has no cluster",
                  file=sys.stderr)
            continue
        if target not in by_cluster:
            print(f"FATAL: unknown canonical cluster {target!r} for "
                  f"NodeKind {nk.get('name')!r}", file=sys.stderr)
            return 2
        by_cluster[target].append(nk)

    print(f"normalized cluster values: {norm_count}", file=sys.stderr)

    # Write per-cluster YAMLs.
    NODE_KINDS_DIR.mkdir(parents=True, exist_ok=True)
    sizes = []
    for cluster in MANIFEST_ORDER:
        slug = CLUSTER_FILE[cluster]
        out = NODE_KINDS_DIR / f"{slug}.yaml"
        nks = by_cluster[cluster]
        body = {"nodeKinds": nks}
        header = (
            f"# NodeKinds for cluster {cluster}.\n"
            f"# Loaded by tools/validator/validate.py via the manifest in "
            f"../ontology-schema.yaml.\n"
            f"# Current-only graph contract.\n\n"
        )
        text = header + dump_yaml(body)
        with open(out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        sizes.append((cluster, slug, len(nks), text.count("\n")))

    # Write edges.
    edges_body = {"edgeKinds": edge_kinds}
    edges_header = (
        "# All EdgeKinds (single file — edges span clusters).\n"
        "# Loaded by tools/validator/validate.py via the manifest in "
        "ontology-schema.yaml.\n\n"
    )
    edges_text = edges_header + dump_yaml(edges_body)
    with open(EDGE_KINDS_OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(edges_text)
    edge_lines = edges_text.count("\n")

    # Write thin manifest.
    manifest_header = (
        "# Catalog ontology manifest.\n"
        "# NodeKinds are split per-cluster under schema/node-kinds/*.yaml.\n"
        "# EdgeKinds live in schema/edge-kinds.yaml (single file — edges span clusters).\n"
        "# The validator (tools/validator/validate.py) composes these at load time.\n"
        "# Markdown <-> YAML parity is enforced by V-12.5.\n\n"
    )
    manifest = OrderedDict()
    manifest["catalogSchemaVersion"] = data.get("catalogSchemaVersion", "1.0.0")
    manifest["metaSchemaVersion"] = data.get("metaSchemaVersion", "1.0.0")
    manifest["generatedAt"] = data.get("generatedAt", "2026-04-29T00:00:00Z")
    # Preserve attributeTypes block if present (was {} before).
    manifest["attributeTypes"] = data.get("attributeTypes", {}) or {}
    manifest["nodeKindFiles"] = [
        f"schema/node-kinds/{CLUSTER_FILE[c]}.yaml" for c in MANIFEST_ORDER
    ]
    manifest["edgeKindFile"] = "schema/edge-kinds.yaml"
    manifest_text = manifest_header + dump_yaml(manifest)
    with open(ONTOLOGY_YAML, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(manifest_text)
    manifest_lines = manifest_text.count("\n")

    # Summary
    print()
    print("=" * 60)
    print("WAVE-41 SPLIT SUMMARY")
    print("=" * 60)
    for cluster, slug, count, lines in sizes:
        print(f"  {slug:30s} ({cluster:30s})  {count:3d} kinds, {lines:5d} lines")
    print(f"  edge-kinds.yaml                {len(edge_kinds):3d} kinds, {edge_lines:5d} lines")
    print(f"  ontology-schema.yaml (manifest)            {manifest_lines:5d} lines")
    print(f"  cluster-value normalizations applied: {norm_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
