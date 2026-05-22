"""Audit connectivity / completeness of agent-stack, capabilities, stack-layers.

Reports:
1. Per-product coverage: which agent-version has which of {core,runtime,platform,ui} impl
2. Realizes/realized_by edges between {core,runtime,platform,ui}-impl <-> Layer
3. Capability records vs agent-version supports edges
4. Stack-layers completeness (layer-N coverage)
"""
import os, glob, yaml
from collections import defaultdict

ROOT = r"C:/work/v6/graph"

def load_docs(pattern):
    out = []
    for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
        with open(path, "r", encoding="utf-8") as f:
            for d in yaml.safe_load_all(f):
                if isinstance(d, dict) and d.get("id"):
                    d["__file"] = path
                    out.append(d)
    return out

products  = load_docs("graph/agent-stack/products/*.yaml")
versions  = load_docs("graph/agent-stack/versions/*.yaml")
cores     = load_docs("graph/agent-stack/core-impls/*.yaml")
runtimes  = load_docs("graph/agent-stack/runtime-impls/*.yaml")
platforms = load_docs("graph/agent-stack/platform-impls/*.yaml")
uis       = load_docs("graph/agent-stack/ui-impls/*.yaml")
caps      = load_docs("graph/capabilities/capabilities/*.yaml")
layers    = load_docs("graph/stack-layers/layers/*.yaml")
sublayers = load_docs("graph/stack-layers/sub-layers/*.yaml")

print(f"\n== INVENTORY ==")
print(f"Products:    {len(products)}")
print(f"Versions:    {len(versions)}")
print(f"Cores:       {len(cores)}")
print(f"Runtimes:    {len(runtimes)}")
print(f"Platforms:   {len(platforms)}")
print(f"UIs:         {len(uis)}")
print(f"Capabilities:{len(caps)}")
print(f"Layers:      {len(layers)}")
print(f"Sublayers:   {len(sublayers)}")

# -- Per-version 4-layer coverage
def base(version_id):
    # version: agent-version:claude-code@1.x  -> product key claude-code
    return version_id.replace("agent-version:", "").split("@")[0]

ver_ids = {v["id"] for v in versions}

# Pull composed_of edges + agentProductId attribute
ver_links = {}
for v in versions:
    a = v.get("attributes", {}) or {}
    composed = (v.get("edges") or {}).get("composed_of") or []
    by_role = {}
    for e in composed:
        if isinstance(e, dict):
            t = e.get("target"); r = e.get("role")
            if t and r: by_role[r] = t
            elif t and t.startswith("agent-core-impl:"):    by_role["core"]=t
            elif t and t.startswith("agent-runtime-impl:"): by_role["runtime"]=t
            elif t and t.startswith("agent-platform-impl:"):by_role["platform"]=t
            elif t and t.startswith("agent-ui-impl:"):      by_role["ui"]=t
    ver_links[v["id"]] = {
        "core":     by_role.get("core"),
        "runtime":  by_role.get("runtime"),
        "platform": by_role.get("platform"),
        "ui":       by_role.get("ui"),
        "productId": a.get("agentProductId"),
        "stackScope": a.get("stackScope"),
        "productKind": a.get("productKind"),
    }

# index impls
core_ids = {c["id"] for c in cores}
runtime_ids = {r["id"] for r in runtimes}
platform_ids = {p["id"] for p in platforms}
ui_ids = {u["id"] for u in uis}

print(f"\n== AGENT-VERSION 4-LAYER WIRING ==")
print(f"{'version':45s}  {'core':5s} {'runt':5s} {'plat':5s} {'ui':5s}  scope")
for vid in sorted(ver_ids):
    v = ver_links[vid]
    def mark(layer_id, idset):
        if not layer_id: return "  -  "
        return " OK  " if layer_id in idset else " MISS"
    c = mark(v["core"], core_ids)
    r = mark(v["runtime"], runtime_ids)
    p = mark(v["platform"], platform_ids)
    u = mark(v["ui"], ui_ids)
    print(f"{vid:45s}  {c} {r} {p} {u}  {v['stackScope'] or '?'}")

# -- realizes/realized_by edges between impls and Layers
print(f"\n== REALIZES EDGE COVERAGE ==")
def has_realizes(d):
    return bool((d.get("edges") or {}).get("realizes"))
print(f"Cores with realizes:     {sum(has_realizes(c) for c in cores):3d} / {len(cores)}")
print(f"Runtimes with realizes:  {sum(has_realizes(r) for r in runtimes):3d} / {len(runtimes)}")
print(f"Platforms with realizes: {sum(has_realizes(p) for p in platforms):3d} / {len(platforms)}")
print(f"UIs with realizes:       {sum(has_realizes(u) for u in uis):3d} / {len(uis)}")

# -- Layer NodeKinds that exist
print(f"\n== STACK-LAYER COVERAGE ==")
print("Layers found:")
for l in layers:
    print(f"  {l['id']}   layerNumber={l.get('attributes',{}).get('layerNumber')}")
print(f"\nSublayers found: {len(sublayers)}")

# -- Capabilities coverage
print(f"\n== CAPABILITIES ==")
cap_ids = {c["id"] for c in caps}
print(f"Capability nodes: {len(cap_ids)}")
# Count incoming `supports`/`requires_capability` edges from ALL sources
support_counts = defaultdict(int)
all_docs = products + versions + cores + runtimes + platforms + uis
# Also include providers, models, runtime/platform-impls
import os, glob
for path in glob.glob(os.path.join(ROOT, "graph", "**", "*.yaml"), recursive=True):
    with open(path, "r", encoding="utf-8") as f:
        for d in yaml.safe_load_all(f):
            if not isinstance(d, dict): continue
            for ek_name, edges in (d.get("edges") or {}).items():
                if ek_name in ("supports", "requires_capability"):
                    for e in edges or []:
                        t = e.get("target") if isinstance(e, dict) else e
                        if t and isinstance(t, str) and t.startswith("capability:"):
                            support_counts[t] += 1
print(f"Capabilities with at least one incoming supports/requires_capability edge: {len(support_counts)}")
unsup = sorted(cap_ids - set(support_counts.keys()))
print(f"Capabilities with NO incoming edges: {len(unsup)}")
for u in unsup[:30]:
    print(f"  - {u}")

# -- Products vs versions consistency
print(f"\n== PRODUCT <-> VERSION CONSISTENCY ==")
prod_ids = set()
for p in products:
    if isinstance(p.get("id"), str):
        prod_ids.add(p["id"])
ver_product_refs = {ver_links[v]["productId"] for v in ver_ids if ver_links[v]["productId"]}
missing_products = ver_product_refs - prod_ids
print(f"Products: {len(prod_ids)}, Versions reference {len(ver_product_refs)} unique productIds")
if missing_products:
    print(f"Versions point to MISSING product:")
    for m in sorted(missing_products): print(f"  - {m}")
orphan_products = prod_ids - ver_product_refs
if orphan_products:
    print(f"Products with NO version pointing back:")
    for o in sorted(orphan_products): print(f"  - {o}")
