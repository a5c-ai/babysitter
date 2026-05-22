#!/usr/bin/env python3
"""
Phase-1.5 stub validator for the v6 graph.

Reads ontology + attribute-types + invariants YAMLs, walks
graph/**/*.yaml, runs a subset of the V-rules from
../../schema/validation-rules.md, and emits a structured JSON report.

This is a STUB:
  - implemented rule families: V-1.1, V-1.4, V-1.5, V-1.6, V-1.7 (basic), V-1.8,
    V-1.9 (NodeKind origin presence, graph-level), V-2.1 (structural-only),
    V-3.1 (structural-only), V-12.5 (count-only),
    plus a dangling-ref pass.
  - rules requiring graph-wide reasoning (V-3.2 inverse pairing, V-3.4 overlap,
    V-4.1 acyclicity, V-5.2, V-8.1, V-9.1, V-10.x, V-12.1 isolation, V-12.3
    global uniqueness, freshness V-2.2 etc.) are NOT implemented in Phase-1.5
    and are listed in knownLimitations.

Read-only: this script never modifies any input file.
"""

from __future__ import annotations

import json
import os
import re
import sys
import traceback
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Paths (hard-coded relative to the v6 graph layout)
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
SCHEMA_ROOT = SCRIPT_DIR.parent.parent  # graph/
SCHEMA_DIR = SCHEMA_ROOT / "schema"
EXCLUDED_EXAMPLE_DIRS = {"schema", "tools", "wiki", "migration", "process", "tests"}
NODE_KINDS_MD_DIR = SCHEMA_DIR / "node-kinds"

ONTOLOGY_YAML = SCHEMA_DIR / "ontology-schema.yaml"
ATTRIBUTE_TYPES_YAML = SCHEMA_DIR / "attribute-types.yaml"
INVARIANTS_YAML = SCHEMA_DIR / "invariants.yaml"

V6_ROOT = SCHEMA_ROOT.parent  # C:/work/v6
ARTIFACTS_DIR = V6_ROOT / ".a5c" / "artifacts"
REPORT_PATH = ARTIFACTS_DIR / ".validator-report.json"
BUILD_REPORT_PATH = ARTIFACTS_DIR / ".validator-build-report.json"

VERSION_QUALIFIED_KINDS = {
    "AgentVersion",
    "ModelVersion",
    "ModelProviderVersion",
}

ID_PATTERN = re.compile(r"^[a-z][a-z0-9-]*:([a-z0-9][a-z0-9@.\-]*[a-z0-9]|[a-z0-9])$")
SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$")
URL_PATTERN = re.compile(r"^https?://[^\s]+$")
SEMVER_PATTERN = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.]+)?(\+[a-z0-9.]+)?$")
ISO_DATE_PATTERN = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
ISO_TS_PATTERN = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$"
)

# V-1.10 — version-spec after @ in version-qualified ids.
# Allowed forms: current | latest | next | <int>.x[.x] | <int>.<int>.x |
# full semver \d+\.\d+\.\d+(-prerelease)? | date-pin YYYY-MM[-DD].
VERSION_SPEC_PATTERN = re.compile(
    r"^(?:current|latest|next"
    r"|[0-9]+\.x(?:\.x)?"
    r"|[0-9]+\.[0-9]+\.x"
    r"|[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.]+)?"
    r"|[0-9]{4}-[0-9]{2}(?:-[0-9]{2})?"
    r")$"
)


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def safe_load_yaml(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def load_ontology() -> dict:
    """Build the schema indices we need.

    ontology-schema.yaml is a thin manifest pointing at per-cluster
    NodeKind files (`nodeKindFiles:`) and a single edge file
    (`edgeKindFile:`). Inline `nodeKinds:` / `edgeKinds:` blocks are not
    part of the current schema contract.
    """
    raw = safe_load_yaml(ONTOLOGY_YAML)
    node_kinds: list = []
    edge_kinds: list = []

    node_kind_files = raw.get("nodeKindFiles") or []
    if isinstance(node_kind_files, list):
        for rel in node_kind_files:
            if not isinstance(rel, str):
                continue
            p = (SCHEMA_ROOT / rel).resolve()
            sub = safe_load_yaml(p) or {}
            for nk in sub.get("nodeKinds") or []:
                node_kinds.append(nk)

    edge_kind_file = raw.get("edgeKindFile")
    if isinstance(edge_kind_file, str):
        p = (SCHEMA_ROOT / edge_kind_file).resolve()
        sub = safe_load_yaml(p) or {}
        for ek in sub.get("edgeKinds") or []:
            edge_kinds.append(ek)

    by_name: dict[str, dict] = {}
    by_prefix: dict[str, dict] = {}
    for nk in node_kinds:
        name = nk.get("name")
        prefix = nk.get("prefix")
        if name:
            by_name[name] = nk
        if prefix:
            by_prefix[prefix] = nk

    edge_by_name: dict[str, dict] = {}
    for ek in edge_kinds:
        n = ek.get("name")
        if n:
            edge_by_name[n] = ek

    return {
        "nodeKinds": node_kinds,
        "edgeKinds": edge_kinds,
        "byName": by_name,
        "byPrefix": by_prefix,
        "edgeByName": edge_by_name,
    }


def load_attribute_types() -> dict[str, dict]:
    raw = safe_load_yaml(ATTRIBUTE_TYPES_YAML)
    out: dict[str, dict] = {}
    for entry in raw.get("primitiveTypes", []) or []:
        n = entry.get("name")
        if n:
            out[n] = entry
    return out


def load_invariants() -> list[dict]:
    raw = safe_load_yaml(INVARIANTS_YAML)
    return raw.get("invariants", []) or []


# ---------------------------------------------------------------------------
# Type helpers
# ---------------------------------------------------------------------------

def base_type(t: str) -> str:
    """Strip parameterization: list<X> -> list, ref<Y> -> ref, enum<a,b> -> enum."""
    if not isinstance(t, str):
        return ""
    m = re.match(r"^([a-zA-Z\-]+)\s*<", t)
    if m:
        return m.group(1)
    return t


def ref_target_kind(t: str) -> str | None:
    if not isinstance(t, str):
        return None
    m = re.match(r"^ref<\s*([A-Za-z0-9_]+)\s*>$", t)
    return m.group(1) if m else None


def list_inner(t: str) -> str | None:
    if not isinstance(t, str):
        return None
    m = re.match(r"^list<\s*(.+)\s*>$", t)
    return m.group(1) if m else None


def enum_values(t: str) -> list[str] | None:
    if not isinstance(t, str):
        return None
    m = re.match(r"^enum<\s*(.+)\s*>$", t)
    if not m:
        return None
    return [v.strip() for v in m.group(1).split(",") if v.strip()]


def value_type_check(value: Any, declared: str, attr_types: dict[str, dict]) -> bool:
    """Lightweight type check. Returns True if value plausibly matches `declared`.

    This is intentionally loose: rules that can't be checked cheaply return True
    rather than fabricating failures (per task guidance — TODO marked in script).
    """
    if value is None:
        # Missing required is handled separately (V-1.4).
        return True
    bt = base_type(declared)
    try:
        if bt == "string" or bt == "markdown" or bt == "code":
            return isinstance(value, str)
        if bt == "slug":
            return isinstance(value, str) and bool(SLUG_PATTERN.match(value))
        if bt == "id":
            return isinstance(value, str) and ":" in value
        if bt == "semver":
            return isinstance(value, str) and bool(SEMVER_PATTERN.match(value))
        if bt == "versionRange":
            return isinstance(value, str)  # too loose to validate npm semver here
        if bt == "iso-date":
            return isinstance(value, str) and bool(ISO_DATE_PATTERN.match(value))
        if bt == "iso-timestamp":
            return isinstance(value, str) and bool(ISO_TS_PATTERN.match(value))
        if bt == "url":
            return isinstance(value, str) and bool(URL_PATTERN.match(value))
        if bt == "bool":
            return isinstance(value, bool)
        if bt == "int":
            return isinstance(value, int) and not isinstance(value, bool)
        if bt == "float":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        if bt == "tokens":
            return isinstance(value, int) and not isinstance(value, bool) and value >= 0
        if bt == "cost-per-million-tokens":
            return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0
        if bt == "list":
            inner = list_inner(declared)
            if not isinstance(value, list):
                return False
            if inner is None:
                return True
            return all(value_type_check(v, inner, attr_types) for v in value)
        if bt == "set":
            return isinstance(value, list)
        if bt == "map":
            return isinstance(value, dict)
        if bt == "ref":
            # Detailed resolvability is V-1.6 — here just shape-check.
            return isinstance(value, str) and ":" in value
        if bt == "enum":
            vals = enum_values(declared)
            if vals is None:
                return True
            return value in vals
        if bt == "evidence-bound":
            inner = re.match(r"^evidence-bound<\s*(.+)\s*>$", declared)
            if inner:
                return value_type_check(value, inner.group(1), attr_types)
            return True
        if bt == "any":
            return True
    except Exception:
        return True
    return True  # unknown type -> tolerant


# ---------------------------------------------------------------------------
# Example loading
# ---------------------------------------------------------------------------

def walk_examples() -> list[Path]:
    return sorted(
        p for p in SCHEMA_ROOT.rglob("*.yaml")
        if p.is_file()
        and p.relative_to(SCHEMA_ROOT).parts
        and p.relative_to(SCHEMA_ROOT).parts[0] not in EXCLUDED_EXAMPLE_DIRS
    )


def parse_example(path: Path) -> tuple[Any | None, str | None]:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            docs = [d for d in yaml.safe_load_all(fh) if d is not None]
        if not docs:
            return None, None
        if len(docs) == 1:
            return docs[0], None
        return docs, None
    except Exception as exc:
        return None, f"YAML parse error: {exc}"


# ---------------------------------------------------------------------------
# partial-node: Partial-node-representation (merge mode + sidecar mode)
# ---------------------------------------------------------------------------

def _is_sidecar(doc: Any) -> bool:
    return (
        isinstance(doc, dict)
        and isinstance(doc.get("extendsNode"), dict)
        and "id" in doc["extendsNode"]
    )


def _is_canonical_node(doc: Any) -> bool:
    return (
        isinstance(doc, dict)
        and isinstance(doc.get("nodeKind"), str)
        and isinstance(doc.get("id"), str)
    )


def _deep_merge_attrs(
    base: dict, addition: dict, base_file: str, add_file: str, node_id: str,
    structural: list,
) -> dict:
    """Deep-merge attribute dicts per partial-node rules.

    - scalar attrs MUST match across files (else V-1.14 fail)
    - list attrs concatenate (de-duplicated, preserving order)
    - map (dict) attrs deep-merge with no overlapping keys
    - displayName/description: first non-empty wins
    """
    out = dict(base) if isinstance(base, dict) else {}
    soft_first_wins = {"displayName", "description"}
    for k, v_add in (addition or {}).items():
        if k not in out:
            out[k] = v_add
            continue
        v_base = out[k]
        if k in soft_first_wins:
            if not v_base and v_add:
                out[k] = v_add
            continue
        if isinstance(v_base, list) and isinstance(v_add, list):
            seen = []
            seen_keys: set = set()
            for item in list(v_base) + list(v_add):
                key = json.dumps(item, sort_keys=True, default=str) if not isinstance(item, (str, int, float, bool)) else item
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                seen.append(item)
            out[k] = seen
        elif isinstance(v_base, dict) and isinstance(v_add, dict):
            overlap = set(v_base) & set(v_add)
            real_overlap = [ok for ok in overlap if v_base[ok] != v_add[ok]]
            if real_overlap:
                _add(structural, file=add_file, rule="V-1.14",
                     severity="fail",
                     message=(f"merge-mode attr conflict on id={node_id!r}: map attr "
                              f"{k!r} has overlapping keys {sorted(real_overlap)} between "
                              f"{base_file} and {add_file}"))
            merged = dict(v_base)
            merged.update(v_add)
            out[k] = merged
        else:
            # scalar (or mixed) — must match
            if v_base != v_add:
                _add(structural, file=add_file, rule="V-1.14",
                     severity="fail",
                     message=(f"merge-mode scalar attr conflict on id={node_id!r}: "
                              f"attr {k!r} differs between {base_file} (={v_base!r}) "
                              f"and {add_file} (={v_add!r})"))
                # keep base; don't overwrite
            # else identical: keep
    return out


def _merge_edges(
    base_edges: dict, add_edges: dict,
) -> dict:
    """Concatenate edge lists, de-duplicating by `target`."""
    out = {k: list(v) if isinstance(v, list) else v for k, v in (base_edges or {}).items()}
    for ename, entries in (add_edges or {}).items():
        if not isinstance(entries, list):
            continue
        existing = out.get(ename)
        if not isinstance(existing, list):
            out[ename] = list(entries)
            continue
        existing_targets: set = set()
        for e in existing:
            tgt = e.get("target") if isinstance(e, dict) else (e if isinstance(e, str) else None)
            if isinstance(tgt, str):
                existing_targets.add(tgt)
        for entry in entries:
            tgt = entry.get("target") if isinstance(entry, dict) else (entry if isinstance(entry, str) else None)
            if isinstance(tgt, str) and tgt in existing_targets:
                continue
            existing.append(entry)
            if isinstance(tgt, str):
                existing_targets.add(tgt)
    return out


def merge_partial_nodes(
    raw_pairs: list[tuple[Path, Any]],
    structural: list,
) -> list[tuple[Path, Any]]:
    """Apply partial-node partial-node-representation merging.

    Takes (path, doc) pairs (one per YAML doc) and returns merged
    (path, doc) pairs where:
      - any (nodeKind, id) appearing in multiple full-canonical docs is
        merged (merge mode), with V-1.14 fired on scalar conflicts.
      - any sidecar doc (envelope `extendsNode:`) is merged into its
        canonical node, with V-1.13 fired if the canonical id is missing
        or if the sidecar tries to redefine attributes.
    The returned list contains exactly one entry per canonical id (using
    the canonical doc's path), plus any docs that are not nodes (kept
    as-is). Sidecar source paths are tracked under doc["_sidecarFiles"]
    so later passes can attribute issues back to authored files.
    """
    canonical: dict[str, dict] = {}  # id -> {file, doc, _sidecarFiles}
    sidecars: dict[str, list[tuple[Path, dict]]] = {}
    non_node_pairs: list[tuple[Path, Any]] = []

    for path, doc in raw_pairs:
        if _is_sidecar(doc):
            sid = doc["extendsNode"].get("id")
            if isinstance(sid, str):
                sidecars.setdefault(sid, []).append((path, doc))
            continue
        if _is_canonical_node(doc):
            nid = doc["id"]
            if nid not in canonical:
                canonical[nid] = {"file": str(path), "doc": dict(doc), "_sidecarFiles": []}
            else:
                # merge-mode: another canonical declaration of same id
                base = canonical[nid]
                if base["doc"].get("nodeKind") != doc.get("nodeKind"):
                    _add(structural, file=str(path), rule="V-1.14",
                         severity="fail",
                         message=(f"merge-mode nodeKind conflict on id={nid!r}: "
                                  f"{base['doc'].get('nodeKind')!r} in {base['file']} "
                                  f"vs {doc.get('nodeKind')!r} in {path}"))
                    continue
                merged_attrs = _deep_merge_attrs(
                    base["doc"].get("attributes") or {},
                    doc.get("attributes") or {},
                    base["file"], str(path), nid, structural,
                )
                merged_edges = _merge_edges(
                    base["doc"].get("edges") or {},
                    doc.get("edges") or {},
                )
                base["doc"]["attributes"] = merged_attrs
                if merged_edges:
                    base["doc"]["edges"] = merged_edges
                # First non-empty displayName/description (already in attrs).
                base["_sidecarFiles"].append(str(path))
            continue
        non_node_pairs.append((path, doc))

    # Apply sidecars in file-name-sorted order.
    for nid, scs in sidecars.items():
        scs_sorted = sorted(scs, key=lambda t: str(t[0]).lower())
        if nid not in canonical:
            for path, doc in scs_sorted:
                _add(structural, file=str(path), rule="V-1.13",
                     severity="fail",
                     message=(f"extendsNode references undefined id {nid!r} "
                              f"(no canonical declaration found)"))
            continue
        base = canonical[nid]
        ext_kind = scs_sorted[0][1]["extendsNode"].get("nodeKind")
        if isinstance(ext_kind, str) and ext_kind != base["doc"].get("nodeKind"):
            _add(structural, file=str(scs_sorted[0][0]), rule="V-1.13",
                 severity="fail",
                 message=(f"sidecar extendsNode.nodeKind={ext_kind!r} disagrees "
                          f"with canonical {base['doc'].get('nodeKind')!r} for id {nid!r}"))
        for path, doc in scs_sorted:
            if isinstance(doc.get("attributes"), dict) and doc.get("attributes"):
                _add(structural, file=str(path), rule="V-1.13",
                     severity="fail",
                     message=(f"sidecar for id {nid!r} declares `attributes:`; "
                              f"sidecars are edge-only (cannot redefine attributes)"))
            base["doc"]["edges"] = _merge_edges(
                base["doc"].get("edges") or {},
                doc.get("edges") or {},
            )
            base["_sidecarFiles"].append(str(path))

    out: list[tuple[Path, Any]] = []
    for nid, info in canonical.items():
        merged_doc = info["doc"]
        if info["_sidecarFiles"]:
            merged_doc["_sidecarFiles"] = info["_sidecarFiles"]
        out.append((Path(info["file"]), merged_doc))
    out.extend(non_node_pairs)
    return out


# ---------------------------------------------------------------------------
# partial-node Part B: file-size soft warn
# ---------------------------------------------------------------------------

FILE_SIZE_WARN_BYTES = 30 * 1024
FILE_SIZE_WARN_LINES = 800


def run_file_size_check(example_paths: list[Path]) -> list[dict]:
    """Return list of {path, sizeBytes, lineCount, suggestion} for files
    above the soft thresholds (>30 KB or >800 lines)."""
    out: list[dict] = []
    for p in example_paths:
        try:
            size = p.stat().st_size
        except OSError:
            continue
        try:
            with open(p, "r", encoding="utf-8", errors="replace") as fh:
                lines = sum(1 for _ in fh)
        except OSError:
            continue
        if size > FILE_SIZE_WARN_BYTES or lines > FILE_SIZE_WARN_LINES:
            chunks = max(2, min(6,
                ((size + FILE_SIZE_WARN_BYTES - 1) // FILE_SIZE_WARN_BYTES) or 2))
            out.append({
                "path": str(p),
                "sizeBytes": size,
                "lineCount": lines,
                "suggestion": f"split into {chunks} chunks (partial-node partial-node-representation pattern)",
            })
    out.sort(key=lambda r: r["sizeBytes"], reverse=True)
    return out


# ---------------------------------------------------------------------------
# Validation passes
# ---------------------------------------------------------------------------

def _add(report_section: list, **fields):
    report_section.append(fields)


def collect_id_index(examples: list[tuple[Path, Any]]) -> dict[str, dict]:
    """id -> { file, nodeKind, doc }"""
    idx: dict[str, dict] = {}
    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        if isinstance(doc.get("id"), str) and isinstance(doc.get("nodeKind"), str):
            idx[doc["id"]] = {
                "file": str(path),
                "nodeKind": doc["nodeKind"],
                "doc": doc,
            }
    return idx


def run_structural(
    path: Path,
    doc: Any,
    ontology: dict,
    attr_types: dict,
    structural: list,
):
    if not isinstance(doc, dict):
        _add(structural, file=str(path), rule="V-1.0",
             severity="fail", message="document is not a YAML mapping")
        return

    nk_name = doc.get("nodeKind")
    node_id = doc.get("id")
    by_name = ontology["byName"]

    # V-1.1
    if not isinstance(nk_name, str):
        _add(structural, file=str(path), rule="V-1.1",
             severity="fail", message="missing nodeKind")
        return
    nk = by_name.get(nk_name)
    if nk is None:
        _add(structural, file=str(path), rule="V-1.1",
             severity="fail", message=f"unknown nodeKind: {nk_name}")
        return

    prefix = nk.get("prefix")
    # V-1.5 + V-1.8
    if not isinstance(node_id, str):
        _add(structural, file=str(path), rule="V-1.5",
             severity="fail", message="missing or non-string id")
    else:
        if not ID_PATTERN.match(node_id):
            _add(structural, file=str(path), rule="V-1.5",
                 severity="fail",
                 message=f"id not well-formed: {node_id!r}")
        elif prefix and not node_id.startswith(prefix + ":"):
            _add(structural, file=str(path), rule="V-1.5",
                 severity="fail",
                 message=f"id prefix mismatch: expected {prefix!r}, got {node_id!r}")
        if nk_name in VERSION_QUALIFIED_KINDS:
            after_prefix = node_id.split(":", 1)[1] if ":" in node_id else ""
            if "@" not in after_prefix or after_prefix.split("@", 1)[1] == "":
                _add(structural, file=str(path), rule="V-1.8",
                     severity="fail",
                     message=f"version-qualified id missing @<version-spec>: {node_id!r}")
            else:
                vspec = after_prefix.split("@", 1)[1]
                if not VERSION_SPEC_PATTERN.match(vspec):
                    _add(structural, file=str(path), rule="V-1.10",
                         severity="fail",
                         message=f"invalid version-spec {vspec!r} in id {node_id!r}; must be current|latest|next|<n>.x[.x]|<n>.<n>.x|full-semver|YYYY-MM[-DD]")

    # V-1.4 / V-1.7
    attrs = doc.get("attributes", {}) or {}
    if not isinstance(attrs, dict):
        _add(structural, file=str(path), rule="V-1.4",
             severity="fail", message="`attributes` is not a mapping")
        attrs = {}

    declared_attrs = nk.get("attributes", []) or []
    declared_by_name = {
        a.get("name"): a for a in declared_attrs if isinstance(a, dict) and a.get("name")
    }

    for a in declared_attrs:
        if not isinstance(a, dict):
            continue
        name = a.get("name")
        if not name:
            continue
        if a.get("required") is True:
            # `id` is on the doc top-level, not under attributes
            if name == "id":
                if not isinstance(node_id, str):
                    _add(structural, file=str(path), rule="V-1.4",
                         severity="fail", message="required attr `id` missing")
                continue
            if name not in attrs or attrs[name] in (None, ""):
                _add(structural, file=str(path), rule="V-1.4",
                     severity="fail",
                     message=f"required attr missing: {name}")

    for name, value in attrs.items():
        decl = declared_by_name.get(name)
        if decl is None:
            # Unknown attribute = warn (could be markdown-vs-yaml drift)
            _add(structural, file=str(path), rule="V-1.4",
                 severity="warn",
                 message=f"unknown attribute on {nk_name}: {name}")
            continue
        declared_type = decl.get("type")
        if isinstance(declared_type, str):
            ok = value_type_check(value, declared_type, attr_types)
            if not ok:
                _add(structural, file=str(path), rule="V-1.7",
                     severity="fail",
                     message=f"attr {name!r} fails type check ({declared_type})")


def run_ref_resolution(
    path: Path,
    doc: Any,
    ontology: dict,
    id_index: dict[str, dict],
    dangling: list,
    structural: list,
):
    """V-1.6 + dangling refs (attribute-level + edges)."""
    if not isinstance(doc, dict):
        return
    nk_name = doc.get("nodeKind")
    nk = ontology["byName"].get(nk_name) if isinstance(nk_name, str) else None
    known_node_kind_names = set(ontology.get("byName", {}).keys())

    # Attribute-level ref<...> values
    attrs = doc.get("attributes", {}) or {}
    if isinstance(attrs, dict) and nk:
        decls = {a.get("name"): a for a in (nk.get("attributes") or []) if isinstance(a, dict)}
        for name, value in attrs.items():
            decl = decls.get(name)
            if not decl:
                continue
            t = decl.get("type")
            if not isinstance(t, str):
                continue
            target_kind = ref_target_kind(t)
            inner = list_inner(t)
            if target_kind:
                _check_one_ref(path, name, value, target_kind, id_index, dangling, structural,
                               known_node_kind_names)
            elif inner:
                target_kind = ref_target_kind(inner)
                if target_kind and isinstance(value, list):
                    for v in value:
                        _check_one_ref(path, name, v, target_kind, id_index, dangling, structural,
                                       known_node_kind_names)

    # Edge target refs
    edges = doc.get("edges", {}) or {}
    if isinstance(edges, dict):
        for edge_name, entries in edges.items():
            if not isinstance(entries, list):
                continue
            for entry in entries:
                target_id: str | None = None
                if isinstance(entry, str):
                    target_id = entry
                elif isinstance(entry, dict):
                    target_id = entry.get("target") or entry.get("targetId") or entry.get("to")
                if not target_id or not isinstance(target_id, str):
                    continue
                if target_id not in id_index:
                    _add(dangling,
                         sourceFile=str(path),
                         ref=target_id,
                         expected=f"resolvable node id (edge {edge_name})")


def _check_one_ref(path, name, value, target_kind, id_index, dangling, structural,
                   known_node_kind_names=None):
    if not isinstance(value, str):
        return
    # Skip authoring-time TODO/pending sentinels — these are intentional
    # placeholders awaiting Phase-2 evidence binding, not real refs.
    stripped = value.strip()
    if (stripped.startswith("# TODO") or stripped.startswith("#TODO")
            or stripped in ("TODO", "pending", "tbd")
            or stripped.endswith("-tbd")):
        return
    found = id_index.get(value)
    if not found:
        _add(dangling, sourceFile=str(path), ref=value,
             expected=f"{target_kind} (attr {name})")
        return
    # Meta-sentinel: ref<NodeKind> means "id of an entity of any known NodeKind"
    # OR a meta-reference to a NodeKind itself (NodeKind:Foo / node-kind:Foo).
    # Both cases are accepted: the resolved entity may be of any kind whose
    # name is a registered NodeKind (including "NodeKind" itself for meta-refs
    # seeded from ontology-schema.yaml).
    if target_kind == "NodeKind":
        resolved_kind = found.get("nodeKind")
        if resolved_kind == "NodeKind":
            return  # meta-reference to a NodeKind definition
        if known_node_kind_names is None or resolved_kind in known_node_kind_names:
            return  # any well-formed instance of a known NodeKind
        _add(structural, file=str(path), rule="V-1.6",
             severity="fail",
             message=f"attr {name!r} ref<NodeKind> points to {resolved_kind} {value!r}, "
                     f"which is not a registered NodeKind")
        return
    if found["nodeKind"] != target_kind:
        _add(structural, file=str(path), rule="V-1.6",
             severity="fail",
             message=f"attr {name!r} ref points to {found['nodeKind']} {value!r}, "
                     f"expected {target_kind}")


def run_evidence_check(
    path: Path,
    doc: Any,
    ontology: dict,
    id_index: dict[str, dict],
    claim_index: dict[tuple[str, str], list[dict]],
    evidence_violations: list,
):
    """V-2.1 (structural) — every evidence-bound or `evidence: ...` attr should
    have at least one Claim record on (subjectId=node, attribute=attr-name).
    """
    if not isinstance(doc, dict):
        return
    nk_name = doc.get("nodeKind")
    if nk_name == "Claim":
        return  # claims themselves aren't checked here
    nk = ontology["byName"].get(nk_name) if isinstance(nk_name, str) else None
    if not nk:
        return
    node_id = doc.get("id")
    if not isinstance(node_id, str):
        return
    attrs = doc.get("attributes", {}) or {}
    if not isinstance(attrs, dict):
        return

    for a in (nk.get("attributes") or []):
        if not isinstance(a, dict):
            continue
        name = a.get("name")
        t = a.get("type", "")
        evidence_marker = a.get("evidence")
        is_evidence_bound = (
            isinstance(t, str) and t.startswith("evidence-bound<")
        )
        needs_evidence = is_evidence_bound or bool(evidence_marker)
        if not needs_evidence:
            continue
        if name not in attrs:
            continue  # not authored = caught by V-1.4 if required
        if (node_id, name) not in claim_index:
            _add(evidence_violations,
                 file=str(path),
                 attribute=name,
                 expected_level=str(evidence_marker or "evidence-bound"))


def run_versioning_check(
    path: Path,
    doc: Any,
    ontology: dict,
    id_index: dict[str, dict],
    structural: list,
):
    """V-3.1 partial + current V-rule for `supports` edge attributes.

    After the current remodel, `supports` is the canonical direct edge for
    capability bindings (replaced the reified CapabilitySupport NodeKind).
    Allowed source NodeKinds widen to any version-bearing entity that can
    claim a capability — see edge:supports.source in ontology-schema.yaml.

    Per-entry rules checked here:
      - `target` (the capabilityId) MUST be present.
      - `versionRange` MUST be present.
      - `level` MUST be one of: full, partial, experimental, unsupported, degraded.
      - `evidenceSourceIds`, when present, MUST be a list of strings.
    """
    if not isinstance(doc, dict):
        return
    edges = doc.get("edges", {}) or {}
    if not isinstance(edges, dict):
        return
    if "supports" not in edges:
        return
    nk_name = doc.get("nodeKind")
    entries = edges.get("supports") or []
    if not isinstance(entries, list):
        return

    allowed_sources = {
        "AgentVersion", "ModelVersion", "AgentRuntimeImpl", "AgentPlatformImpl",
        "AgentCoreImpl", "AgentProduct", "ToolServer", "Plugin", "Provider",
        "ProviderVersion", "TransportRuntime",
    }
    allowed_levels = {"full", "partial", "experimental", "unsupported", "degraded", "none"}

    for e in entries:
        if not isinstance(e, dict):
            continue
        if not e.get("target"):
            _add(structural, file=str(path), rule="V-3.1",
                 severity="fail",
                 message="supports edge missing target (capability id)")
        if "versionRange" not in e:
            _add(structural, file=str(path), rule="V-3.1",
                 severity="fail",
                 message="supports edge missing versionRange")
        level = e.get("level")
        if level is not None and level not in allowed_levels:
            _add(structural, file=str(path), rule="V-3.1",
                 severity="fail",
                 message=f"supports edge has invalid level {level!r} "
                         f"(allowed: {sorted(allowed_levels)})")
        ev = e.get("evidenceSourceIds")
        if ev is not None and not (isinstance(ev, list) and all(isinstance(x, str) for x in ev)):
            _add(structural, file=str(path), rule="V-3.1",
                 severity="fail",
                 message="supports edge evidenceSourceIds must be a list of strings")
    if nk_name and nk_name not in allowed_sources:
        _add(structural, file=str(path), rule="V-3.1",
             severity="fail",
             message=f"supports edge originates from {nk_name}, "
                     f"not in allowed source kinds ({sorted(allowed_sources)})")




# ---------------------------------------------------------------------------
# V-12.5 markdown <-> yaml parity (count-only)
# ---------------------------------------------------------------------------

def run_origin_check(ontology: dict, structural: list):
    """V-1.9: every NodeKind in ontology-schema.yaml MUST declare a top-level
    `origin` field (standard | universal | a5c | derived).

    V-1.12 (current): NodeKinds with `origin: derived` MUST carry connected
    evidence (originContext / originDate / evidenceRefs).

    This is a graph-level rule (one pass over the ontology), not per-example.
    """
    allowed = {"standard", "universal", "a5c", "derived"}
    for nk in ontology.get("nodeKinds", []) or []:
        if not isinstance(nk, dict):
            continue
        name = nk.get("name") or "(unnamed)"
        nk_id = nk.get("id") or name
        origin = nk.get("origin")
        if origin is None:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.9",
                 severity="fail",
                 message=f"NodeKind {name!r} ({nk_id}) missing required `origin` field")
        elif origin not in allowed:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.9",
                 severity="fail",
                 message=f"NodeKind {name!r} has invalid origin {origin!r}; "
                         f"must be one of {sorted(allowed)}")
        elif origin == "derived":
            # V-1.12: derived origin requires connected evidence.
            has_ctx = bool((nk.get("originContext") or "").strip()) if isinstance(nk.get("originContext"), str) else bool(nk.get("originContext"))
            has_date = bool(nk.get("originDate"))
            ev = nk.get("evidenceRefs")
            has_ev = isinstance(ev, list) and len(ev) > 0
            if not (has_ctx or has_date or has_ev):
                _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.12",
                     severity="fail",
                     message=f"NodeKind {name!r} declares origin: derived but lacks "
                             f"connected evidence (originContext / originDate / evidenceRefs)")
        # Change H: NodeKinds may declare `cluster` (single) OR `clusters` (list);
        # exactly one of the two MUST be present.
        has_single = "cluster" in nk
        has_list = "clusters" in nk
        if has_single and has_list:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.11",
                 severity="warn",
                 message=f"NodeKind {name!r} declares both `cluster` and `clusters`; pick one")
        elif not has_single and not has_list:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.11",
                 severity="warn",
                 message=f"NodeKind {name!r} missing cluster/clusters")
        if has_list:
            cl = nk.get("clusters")
            if not (isinstance(cl, list) and cl and all(isinstance(x, str) for x in cl)):
                _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.11",
                     severity="warn",
                     message=f"NodeKind {name!r} `clusters` must be a non-empty list of strings")

    # V-1.12 also applies to EdgeKinds carrying origin: derived.
    for ek in ontology.get("edgeKinds", []) or []:
        if not isinstance(ek, dict):
            continue
        ename = ek.get("name") or "(unnamed)"
        eorigin = ek.get("origin")
        if eorigin == "derived":
            has_ctx = bool((ek.get("originContext") or "").strip()) if isinstance(ek.get("originContext"), str) else bool(ek.get("originContext"))
            has_date = bool(ek.get("originDate"))
            ev = ek.get("evidenceRefs")
            has_ev = isinstance(ev, list) and len(ev) > 0
            if not (has_ctx or has_date or has_ev):
                _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.12",
                     severity="fail",
                     message=f"EdgeKind {ename!r} declares origin: derived but lacks "
                             f"connected evidence (originContext / originDate / evidenceRefs)")
        elif eorigin is not None and eorigin not in {"standard", "universal", "a5c", "derived"}:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-1.9",
                 severity="fail",
                 message=f"EdgeKind {ename!r} has invalid origin {eorigin!r}; "
                         f"must be one of ['a5c', 'derived', 'standard', 'universal']")


def run_parity_check(ontology: dict, parity: list):
    """Parity: NodeKinds documented in markdown headings vs. those declared in YAML.

    The established documentation convention in schema/node-kinds/*.md uses
    ``## NodeKind: `Foo``` (or ``### NodeKind: `Foo` (origin: …)``) for single
    specs, and ``## NodeKinds: `A`, `B`, `C``` for grouped specs that introduce
    several kinds. We also recognize the historical bare ``## CamelCase`` form
    for files that still use it (e.g., ``stack-layers.md``: ``## Layer``).

    Wave-104 (2026-05-05): regex hardened from the original stub form
    ``^#{2,4}\\s+([A-Z][A-Za-z0-9]+)\\s*$`` (which only matched bare-CamelCase
    headings — none of the cluster files use that, so almost every YAML
    NodeKind looked like drift). The remaining drift after this hardening is
    the genuine set of NodeKinds with no markdown spec at all.
    """
    md_names: set[str] = set()
    if NODE_KINDS_MD_DIR.exists():
        # 1. Bare CamelCase heading: ``## Foo``
        bare_re = re.compile(r"^#{2,4}\s+([A-Z][A-Za-z0-9]+)\s*$", re.MULTILINE)
        # 2. Single NodeKind heading: ``## NodeKind: `Foo` (origin: …)``
        single_re = re.compile(
            r"^#{1,5}\s+NodeKind:\s+`([A-Z][A-Za-z0-9]+)`",
            re.MULTILINE,
        )
        # 3. Grouped NodeKinds heading: ``# NodeKinds: `A`, `B`, `C` …``
        group_re = re.compile(
            r"^#{1,5}\s+NodeKinds?:\s+(.+)$",
            re.MULTILINE,
        )
        # 5. Backtick-only heading: ``## `Foo``` (used in benchmarks.md etc.)
        backtick_only_re = re.compile(
            r"^#{1,5}\s+`([A-Z][A-Za-z0-9]+)`\s*$",
            re.MULTILINE,
        )
        # 4. Cluster-index table row: ``| `Foo` | purpose |`` — the README and
        #    cluster files use these as the canonical NodeKind catalog. A row
        #    starting with ``| `CamelCase` `` is treated as documentation of
        #    that NodeKind for parity purposes.
        table_row_re = re.compile(
            r"^\|\s*`([A-Z][A-Za-z0-9]+)`\s*\|",
            re.MULTILINE,
        )
        backtick_id_re = re.compile(r"`([A-Z][A-Za-z0-9]+)`")
        ignore = {"Attributes", "Edges", "Notes", "Examples", "Invariants",
                  "Purpose", "TODO", "Cluster", "Overview", "Summary",
                  "Rationale", "Definition", "Related", "Evidence",
                  "Example", "Relationships"}
        for md in NODE_KINDS_MD_DIR.glob("*.md"):
            try:
                txt = md.read_text(encoding="utf-8")
            except Exception:
                continue
            for m in bare_re.finditer(txt):
                tok = m.group(1)
                if tok in ignore:
                    continue
                md_names.add(tok)
            for m in single_re.finditer(txt):
                md_names.add(m.group(1))
            for m in group_re.finditer(txt):
                for tok in backtick_id_re.findall(m.group(1)):
                    md_names.add(tok)
            for m in table_row_re.finditer(txt):
                md_names.add(m.group(1))
            for m in backtick_only_re.finditer(txt):
                md_names.add(m.group(1))

    yaml_names = set(ontology["byName"].keys())
    only_md = md_names - yaml_names
    only_yaml = yaml_names - md_names

    for n in sorted(only_md):
        _add(parity, name=n, in_md=True, in_yaml=False)
    for n in sorted(only_yaml):
        _add(parity, name=n, in_md=False, in_yaml=True)


# ---------------------------------------------------------------------------
# Island detection (informational, Part B) — informational only
# ---------------------------------------------------------------------------

# reference-data: NodeKinds whose instances are reference data BY DESIGN (glossaries,
# lookup tables, catalogs). Orphan instances of these kinds are EXPECTED — they
# are not graph islands. They are reported under `referenceDataExamples:` and
# excluded from the `orphanExamples:` count so genuine wiring gaps stay visible.
#
# zero-edge expansion: NodeKinds with ZERO defined edges in edge-kinds.yaml
# (InteractionPattern / DecisionVerb / RunJournalEvent) are structurally
# reference-data — schema offers no way to wire them; their instances cite
# them by id from attributes. Added to allowlist so they don't appear as
# false-positive orphans.
REFERENCE_DATA_NODE_KINDS = {
    "Term",
    "SourceRef",
    "PathDescriptor",
    "Language",
    "Topic",
    "InstallMethod",
    "EvidenceSource",
    "Acronym",
    "Synonym",
    # zero-edge — zero-edge NodeKinds (pure reference data by schema design)
    "InteractionPattern",
    "DecisionVerb",
    "RunJournalEvent",
    # zero-edge — additional zero-edge NodeKinds discovered via tail audit
    "ProcessLibrary",
    "RetryPolicy",
    "EndUser",
    "HookMergeDiagnostic",
    # zero-edge — further zero-edge tail
    "HarnessHardeningGuidance",
    "DeploymentTarget",
    "SharedContextSpec",
    "PartialStateRecovery",
    # lifecycle-state — LifecycleState is excluded from real_example_ids by design
    # (orphan-edge bookkeeping line 1045) so its instances cannot accumulate
    # incoming/outgoing edges. Allowlist mirrors that exclusion.
    "LifecycleState",
}


def run_island_check(
    examples: list[tuple[Path, Any]],
    ontology: dict,
    id_index: dict[str, dict],
) -> dict:
    """Detect orphan example records, dead NodeKinds, and dead EdgeKinds.

    Severities (informational; do NOT fail validation):
      - Orphan example with description/context citing a source -> INFO
      - NodeKind with 0 example instances                                -> INFO
      - EdgeKind declared but never used in examples                     -> WARN

    Returns a dict suitable for embedding under `islands:` in the report.
    """
    # Tally NodeKind instances and edge usages.
    node_kind_instance_count: dict[str, int] = {}
    edge_kind_usage_count: dict[str, int] = {}

    # incoming/outgoing edge sets keyed by example id (only counting edges
    # that point at real example ids, not synthetic ontology refs).
    real_example_ids = {
        eid for eid, info in id_index.items()
        if info.get("nodeKind") not in ("NodeKind", "EdgeKind", "LifecycleState")
        and not str(info.get("file", "")).endswith("ontology-schema.yaml")
    }
    incoming: dict[str, set[str]] = {}
    outgoing: dict[str, set[str]] = {}

    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        nk = doc.get("nodeKind")
        nid = doc.get("id")
        if isinstance(nk, str):
            node_kind_instance_count[nk] = node_kind_instance_count.get(nk, 0) + 1
        edges = doc.get("edges") or {}
        if not isinstance(edges, dict) or not isinstance(nid, str):
            continue
        for ename, entries in edges.items():
            if not isinstance(entries, list):
                continue
            edge_kind_usage_count[ename] = edge_kind_usage_count.get(ename, 0) + len(entries)
            for entry in entries:
                tgt: str | None = None
                if isinstance(entry, str):
                    tgt = entry
                elif isinstance(entry, dict):
                    tgt = entry.get("target") or entry.get("targetId") or entry.get("to")
                if not isinstance(tgt, str):
                    continue
                if tgt in real_example_ids and nid in real_example_ids:
                    outgoing.setdefault(nid, set()).add(tgt)
                    incoming.setdefault(tgt, set()).add(nid)

    # 1. Orphan examples — example records with no incoming AND no outgoing
    # edges to other example records.
    orphan_allowed_kinds = set()
    for nk in ontology.get("nodeKinds", []) or []:
        if isinstance(nk, dict) and nk.get("isolatedAllowed") is True:
            n = nk.get("name")
            if n:
                orphan_allowed_kinds.add(n)

    orphan_examples: list[dict] = []
    reference_data_examples: list[dict] = []
    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        nid = doc.get("id")
        nk = doc.get("nodeKind")
        if not isinstance(nid, str) or not isinstance(nk, str):
            continue
        if nk in orphan_allowed_kinds:
            continue
        if nid in incoming or nid in outgoing:
            continue
        # Severity heuristic: description/comment citing source -> info
        desc = ""
        attrs = doc.get("attributes") or {}
        if isinstance(attrs, dict):
            d = attrs.get("description") or attrs.get("displayName") or ""
            if isinstance(d, str):
                desc = d
        source_hint = bool(re.search(r"sourced from|claude-code|symphony|pi-mono|vibe-kanban",
                                   desc, re.IGNORECASE))
        record = {
            "id": nid,
            "nodeKind": nk,
            "file": str(path),
            "severity": "info" if source_hint else "info",
            "hint": "source-cited" if source_hint else "no-context",
        }
        # reference-data: reference-data kinds are orphan-by-design — segregate them.
        if nk in REFERENCE_DATA_NODE_KINDS:
            reference_data_examples.append(record)
        else:
            orphan_examples.append(record)

    # 2. Dead NodeKinds — declared in schema but 0 example instances.
    dead_node_kinds: list[dict] = []
    for nk in ontology.get("nodeKinds", []) or []:
        if not isinstance(nk, dict):
            continue
        name = nk.get("name")
        if not name:
            continue
        if node_kind_instance_count.get(name, 0) == 0:
            dead_node_kinds.append({
                "name": name,
                "origin": nk.get("origin"),
                "cluster": nk.get("cluster") or nk.get("clusters"),
                "severity": "info",
            })

    # 3. Dead EdgeKinds — declared in schema but never used in any example.
    # inverse-usage: credit inverse usage. If an EdgeKind's declared `inverse` (or any
    # EdgeKind that names this one as its inverse) has >0 usage, the relation IS
    # represented in the graph (we author the forward direction only). Marking
    # the inverse-name as dead would mislead authors into spurious wiring.
    inverse_index: dict[str, set[str]] = {}
    for ek in ontology.get("edgeKinds", []) or []:
        if not isinstance(ek, dict):
            continue
        name = ek.get("name")
        inv = ek.get("inverse")
        alias_of = ek.get("aliasOf")
        if name and inv:
            inverse_index.setdefault(name, set()).add(inv)
            inverse_index.setdefault(inv, set()).add(name)
        # lifecycle-state: credit alias_of as well — if a→aliasOf:b, then usage of b
        # implies a is alive (and vice versa). Aliased edges share semantics.
        if name and alias_of:
            inverse_index.setdefault(name, set()).add(alias_of)
            inverse_index.setdefault(alias_of, set()).add(name)
    dead_edge_kinds: list[dict] = []
    for ek in ontology.get("edgeKinds", []) or []:
        if not isinstance(ek, dict):
            continue
        name = ek.get("name")
        if not name:
            continue
        if edge_kind_usage_count.get(name, 0) > 0:
            continue
        # Credit inverse — if any inverse name has usage, this relation is alive.
        partners = inverse_index.get(name) or set()
        if any(edge_kind_usage_count.get(p, 0) > 0 for p in partners):
            continue
        dead_edge_kinds.append({
            "name": name,
            "origin": ek.get("origin"),
            "aliasOf": ek.get("aliasOf"),
            "severity": "warn",
        })

    return {
        "orphanExamples": orphan_examples,
        "referenceDataExamples": reference_data_examples,
        "deadNodeKinds": dead_node_kinds,
        "deadEdgeKinds": dead_edge_kinds,
    }


# ---------------------------------------------------------------------------
# Coverage statistics (informational, Part C) — informational only
# ---------------------------------------------------------------------------

def run_coverage_stats(
    examples: list[tuple[Path, Any]],
    ontology: dict,
) -> dict:
    """Per-NodeKind coverage statistics.

    For each NodeKind reports:
      - declared attribute count
      - declared incoming/outgoing edge-type counts
      - example instance count
      - avg attribute population fraction (across instances)
      - avg incoming-edge-types-populated fraction
      - avg outgoing-edge-types-populated fraction
    """
    # Build edge directionality map for the schema.
    incoming_types_for_kind: dict[str, set[str]] = {}
    outgoing_types_for_kind: dict[str, set[str]] = {}
    for ek in ontology.get("edgeKinds", []) or []:
        if not isinstance(ek, dict):
            continue
        ename = ek.get("name")
        if not ename:
            continue
        for s in ek.get("source") or []:
            if isinstance(s, str):
                outgoing_types_for_kind.setdefault(s, set()).add(ename)
        for t in ek.get("target") or []:
            if isinstance(t, str):
                incoming_types_for_kind.setdefault(t, set()).add(ename)

    # Index examples by NodeKind, and gather per-instance edge usage.
    instances_by_kind: dict[str, list[dict]] = {}
    # For incoming-edge counting we need to know which nodes are referenced
    # by each example (and what edge name was used).
    incoming_seen_per_id: dict[str, set[str]] = {}  # target id -> edge names
    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        nk = doc.get("nodeKind")
        nid = doc.get("id")
        if isinstance(nk, str):
            instances_by_kind.setdefault(nk, []).append(doc)
        edges = doc.get("edges") or {}
        if not isinstance(edges, dict):
            continue
        for ename, entries in edges.items():
            if not isinstance(entries, list):
                continue
            for entry in entries:
                tgt: str | None = None
                if isinstance(entry, str):
                    tgt = entry
                elif isinstance(entry, dict):
                    tgt = entry.get("target") or entry.get("targetId") or entry.get("to")
                if isinstance(tgt, str):
                    incoming_seen_per_id.setdefault(tgt, set()).add(ename)

    per_node_kind: list[dict] = []
    for nk in ontology.get("nodeKinds", []) or []:
        if not isinstance(nk, dict):
            continue
        name = nk.get("name")
        if not name:
            continue
        declared_attrs = nk.get("attributes") or []
        attr_names = [a.get("name") for a in declared_attrs
                      if isinstance(a, dict) and a.get("name")]
        declared_attr_count = len(attr_names)
        declared_in = incoming_types_for_kind.get(name, set())
        declared_out = outgoing_types_for_kind.get(name, set())
        instances = instances_by_kind.get(name, [])
        instance_count = len(instances)

        if instance_count == 0:
            per_node_kind.append({
                "name": name,
                "instanceCount": 0,
                "declaredAttrs": declared_attr_count,
                "declaredIncomingEdgeTypes": len(declared_in),
                "declaredOutgoingEdgeTypes": len(declared_out),
                "attrCoverage": 0.0,
                "incomingEdgeCoverage": 0.0,
                "outgoingEdgeCoverage": 0.0,
            })
            continue

        attr_pop = 0.0
        out_pop = 0.0
        in_pop = 0.0
        for doc in instances:
            attrs = doc.get("attributes") or {}
            present = 0
            if isinstance(attrs, dict) and declared_attr_count > 0:
                for an in attr_names:
                    v = attrs.get(an)
                    if v not in (None, "", [], {}):
                        present += 1
                attr_pop += present / declared_attr_count
            edges = doc.get("edges") or {}
            if isinstance(edges, dict) and declared_out:
                used = sum(1 for ename in declared_out
                           if isinstance(edges.get(ename), list) and len(edges.get(ename)) > 0)
                out_pop += used / len(declared_out)
            nid = doc.get("id")
            if isinstance(nid, str) and declared_in:
                seen = incoming_seen_per_id.get(nid, set())
                used_in = len([e for e in declared_in if e in seen])
                in_pop += used_in / len(declared_in)

        per_node_kind.append({
            "name": name,
            "instanceCount": instance_count,
            "declaredAttrs": declared_attr_count,
            "declaredIncomingEdgeTypes": len(declared_in),
            "declaredOutgoingEdgeTypes": len(declared_out),
            "attrCoverage": round(attr_pop / instance_count, 3) if declared_attr_count else 0.0,
            "incomingEdgeCoverage": round(in_pop / instance_count, 3) if declared_in else 0.0,
            "outgoingEdgeCoverage": round(out_pop / instance_count, 3) if declared_out else 0.0,
        })

    return {"perNodeKind": per_node_kind}


def run_alias_check(ontology: dict, structural: list):
    """V-3.5: every EdgeKind that declares `aliasOf: <canonical>` MUST point
    at a canonical EdgeKind that exists in the schema, and the canonical edge
    MUST NOT itself declare `aliasOf` (single-hop only)."""
    edge_by_name = ontology.get("edgeByName", {}) or {}
    for ek in ontology.get("edgeKinds", []) or []:
        if not isinstance(ek, dict):
            continue
        alias_of = ek.get("aliasOf")
        if not alias_of:
            continue
        name = ek.get("name") or "(unnamed)"
        canonical = edge_by_name.get(alias_of)
        if canonical is None:
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-3.5",
                 severity="fail",
                 message=f"EdgeKind {name!r} declares aliasOf={alias_of!r} but no such EdgeKind exists")
            continue
        if canonical.get("aliasOf"):
            _add(structural, file=str(ONTOLOGY_YAML), rule="V-3.5",
                 severity="fail",
                 message=f"EdgeKind {name!r} aliases {alias_of!r} which is itself an alias (single-hop only)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    print(f"[validator] schema root: {SCHEMA_ROOT}", file=sys.stderr)
    ontology = load_ontology()
    attr_types = load_attribute_types()
    invariants = load_invariants()  # loaded for reference; not all enforced

    structural: list = []
    dangling: list = []
    parity: list = []
    evidence_violations: list = []
    parse_errors: list = []

    example_paths = walk_examples()
    raw_pairs: list[tuple[Path, Any]] = []
    for p in example_paths:
        doc, err = parse_example(p)
        if err:
            parse_errors.append({"file": str(p), "error": err})
            _add(structural, file=str(p), rule="V-0",
                 severity="fail", message=err)
            continue
        if doc is None:
            continue
        if isinstance(doc, list):
            for sub in doc:
                raw_pairs.append((p, sub))
        else:
            raw_pairs.append((p, doc))

    # partial-node: merge partial-node-representation declarations (merge mode)
    # and apply sidecars (extendsNode envelopes) before validation runs.
    examples: list[tuple[Path, Any]] = merge_partial_nodes(raw_pairs, structural)

    # partial-node Part B: file-size soft warn (informational; non-fatal).
    large_files = run_file_size_check(example_paths)

    # First pass: id index and claim index
    id_index = collect_id_index(examples)
    # Seed synthetic ontology-level refs so that ref<NodeKind>, edge-kind,
    # and inline lifecycle-state lookups resolve. NodeKinds/EdgeKinds are
    # only declared in ontology-schema.yaml and are not authored as example
    # entities, but example documents legitimately reference them.
    for nk in ontology.get("nodeKinds", []) or []:
        name = nk.get("name")
        prefix = nk.get("prefix")
        if name:
            id_index.setdefault(f"NodeKind:{name}", {
                "file": str(ONTOLOGY_YAML), "nodeKind": "NodeKind", "doc": nk,
            })
            id_index.setdefault(f"node-kind:{name}", {
                "file": str(ONTOLOGY_YAML), "nodeKind": "NodeKind", "doc": nk,
            })
        if prefix:
            id_index.setdefault(f"node-kind:{prefix}", {
                "file": str(ONTOLOGY_YAML), "nodeKind": "NodeKind", "doc": nk,
            })
    for ek in ontology.get("edgeKinds", []) or []:
        name = ek.get("name")
        if name:
            id_index.setdefault(f"edge-kind:{name}", {
                "file": str(ONTOLOGY_YAML), "nodeKind": "EdgeKind", "doc": ek,
            })
    # Inline lifecycle-state ids defined within StateMachine.states[] (Change J).
    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        if doc.get("nodeKind") not in ("StateMachine", "PhaseMachine"):
            continue
        attrs = doc.get("attributes") or {}
        states = attrs.get("states") or []
        if not isinstance(states, list):
            continue
        for st in states:
            if not isinstance(st, dict):
                continue
            sid = st.get("id")
            if not isinstance(sid, str):
                continue
            id_index.setdefault(f"lifecycle-state:{sid}", {
                "file": str(path), "nodeKind": "LifecycleState", "doc": st,
            })
            # Also register the bare slug form for inline transitions.
            id_index.setdefault(sid, {
                "file": str(path), "nodeKind": "LifecycleState", "doc": st,
            })
    claim_index: dict[tuple[str, str], list[dict]] = {}
    for path, doc in examples:
        if not isinstance(doc, dict):
            continue
        if doc.get("nodeKind") == "Claim":
            attrs = doc.get("attributes", {}) or {}
            sid = attrs.get("subjectId")
            attr_name = attrs.get("attribute")
            if isinstance(sid, str) and isinstance(attr_name, str):
                claim_index.setdefault((sid, attr_name), []).append(doc)

    # Second pass: per-example checks
    for path, doc in examples:
        run_structural(path, doc, ontology, attr_types, structural)
        run_ref_resolution(path, doc, ontology, id_index, dangling, structural)
        run_evidence_check(path, doc, ontology, id_index, claim_index, evidence_violations)
        run_versioning_check(path, doc, ontology, id_index, structural)

    # Origin (V-1.9, graph-level)
    run_origin_check(ontology, structural)

    # V-3.5 — edge alias formalization (graph-level)
    run_alias_check(ontology, structural)

    # Parity (global)
    run_parity_check(ontology, parity)

    # informational: islands + coverage (informational; do not fail validation)
    islands = run_island_check(examples, ontology, id_index)
    coverage_stats = run_coverage_stats(examples, ontology)

    failed_files: set[str] = set()
    warn_files: set[str] = set()
    for issue in structural:
        if issue.get("severity") == "fail":
            failed_files.add(issue["file"])
        elif issue.get("severity") == "warn":
            warn_files.add(issue["file"])
    for d in dangling:
        failed_files.add(d["sourceFile"])
    for e in evidence_violations:
        failed_files.add(e["file"])

    total = len(example_paths)
    passed = sum(1 for p in example_paths if str(p) not in failed_files)
    failed = len(failed_files)
    warnings = len(warn_files - failed_files)

    summary = {
        "total": total,
        "passed": passed,
        "failed": failed,
        "warnings": warnings,
    }

    report = {
        "summary": summary,
        "structural": structural,
        "dangling": dangling,
        "parity": parity,
        "evidenceViolations": evidence_violations,
        "islands": islands,
        "coverageStats": coverage_stats,
        "largeFiles": large_files,
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=False)

    # Top-line summary to stdout for human glance
    print()
    print("=" * 60)
    print(f"v6 graph validator — Phase 1.5 stub")
    print("=" * 60)
    print(f"examples scanned       : {total}")
    print(f"  passed               : {passed}")
    print(f"  failed (>=1 fail)    : {failed}")
    print(f"  warn-only            : {warnings}")
    print(f"structural issues      : {len(structural)}")
    print(f"dangling refs          : {len(dangling)}")
    print(f"parity drift entries   : {len(parity)}")
    print(f"evidence violations    : {len(evidence_violations)}")
    print(f"parse errors           : {len(parse_errors)}")
    print()
    print("--- islands (informational) ---")
    print(f"  orphan examples      : {len(islands['orphanExamples'])}")
    print(f"  reference-data ex.   : {len(islands.get('referenceDataExamples', []))}")
    print(f"  dead NodeKinds       : {len(islands['deadNodeKinds'])}")
    print(f"  dead EdgeKinds       : {len(islands['deadEdgeKinds'])}")

    # Coverage summary: top 10 most-covered + bottom 10 least-covered
    # NodeKinds (ranked by mean of attr/in/out coverage), excluding 0-instance.
    populated = [r for r in coverage_stats["perNodeKind"] if r["instanceCount"] > 0]
    def _coverage_score(r: dict) -> float:
        return (r["attrCoverage"] + r["incomingEdgeCoverage"] + r["outgoingEdgeCoverage"]) / 3.0
    populated_sorted = sorted(populated, key=_coverage_score, reverse=True)
    print()
    print("--- coverage (top 10 most-covered NodeKinds) ---")
    for r in populated_sorted[:10]:
        print(f"  {r['name']:<32} n={r['instanceCount']:<3} "
              f"attr={r['attrCoverage']:.2f} in={r['incomingEdgeCoverage']:.2f} "
              f"out={r['outgoingEdgeCoverage']:.2f}")
    print()
    print("--- coverage (bottom 10 least-covered NodeKinds, excl. 0-instance) ---")
    for r in populated_sorted[-10:]:
        print(f"  {r['name']:<32} n={r['instanceCount']:<3} "
              f"attr={r['attrCoverage']:.2f} in={r['incomingEdgeCoverage']:.2f} "
              f"out={r['outgoingEdgeCoverage']:.2f}")
    print()
    print("--- large files (file-size soft warn, >30KB or >800 lines) ---")
    if not large_files:
        print("  (none)")
    else:
        for r in large_files[:10]:
            print(f"  {r['path']}  size={r['sizeBytes']}B  lines={r['lineCount']}")
        if len(large_files) > 10:
            print(f"  ... and {len(large_files) - 10} more")
    print()
    print(f"report                 : {REPORT_PATH}")
    print()

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(2)

