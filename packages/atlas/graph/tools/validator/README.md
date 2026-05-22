# Atlas graph validator (Phase 1.5 stub)

A read-only Python script that loads the atlas ontology and walks
`graph/**/*.yaml`, running a subset of the V-rules from
[`../../schema/validation-rules.md`](../../schema/validation-rules.md) and emitting a
structured JSON report.

It is intentionally a **stub** — the goal is to surface today's gaps
between examples and schema so Phase 2 can fix them, not to enforce every
invariant. See `knownLimitations` in the build report for what is *not*
covered.

## Usage

From any working directory:

```bash
python3 C:/work/v6/graph/tools/validator/validate.py
```

Requirements: Python 3.10+ and PyYAML (`pip install pyyaml`).

The script:

1. Loads `schema/ontology-schema.yaml`, `schema/attribute-types.yaml`, and
   `schema/invariants.yaml`.
2. Walks every YAML under `graph/`.
3. Builds id and claim indices.
4. Per example: runs structural, ref-resolution, evidence, and versioning passes.
5. Writes a JSON report and prints a one-screen summary to stdout.

It **never modifies** any input file.

## Rules implemented

| Rule    | Coverage                                                                        |
| ------- | ------------------------------------------------------------------------------- |
| V-1.1   | `nodeKind` exists in `ontology-schema.yaml`                                     |
| V-1.4   | Required attrs present (fail); unknown attrs flagged (warn)                     |
| V-1.5   | id well-formed and matches the NodeKind's declared prefix                       |
| V-1.6   | `ref<NodeKind>` attribute resolves to a node of the declared kind               |
| V-1.7   | Light type-check against `attribute-types.yaml` validators                      |
| V-1.8   | `AgentVersion` / `ModelVersion` / `ModelProviderVersion` ids contain `@<version-spec>` |
| V-2.1   | Structural: every evidence-bound or `evidence:`-tagged attribute has a backing Claim record |
| V-3.1   | Partial: `supports` edge entries declare `versionRange` and originate from `AgentVersion` |
| V-12.5  | Count-only parity between `../../schema/node-kinds/*.md` headings and YAML NodeKind names |
| —       | Dangling-ref pass over edges and `ref<...>` attributes                          |

Rules **not** implemented in this stub: V-1.2/V-1.3 (edge kind / cardinality),
all of V-2.2..V-2.7, V-3.2 + V-3.4, V-4..V-11, V-12.1, V-12.3, full V-12.5
two-way attribute parity. See [`.a5c/artifacts/.validator-build-report.json`](../../../.a5c/artifacts/.validator-build-report.json)
`knownLimitations` for details.

## Output

Two files are produced under `C:/work/v6/`:

- `.a5c/artifacts/.validator-report.json` — the per-run findings, grouped:

  ```json
  {
    "summary": {"total": int, "passed": int, "failed": int, "warnings": int},
    "structural":         [{"file": "...", "rule": "V-1.x", "severity": "fail|warn", "message": "..."}],
    "dangling":           [{"sourceFile": "...", "ref": "...", "expected": "..."}],
    "parity":             [{"name": "...", "in_md": bool, "in_yaml": bool}],
    "evidenceViolations": [{"file": "...", "attribute": "...", "expected_level": "..."}]
  }
  ```

- `.a5c/artifacts/.validator-build-report.json` — written once when this stub was authored;
  documents implemented rules, top findings, and known limitations.

## Exit codes

- `0` — script ran to completion (regardless of findings)
- `2` — script crashed (Python traceback printed)

This is deliberate: a non-zero exit is reserved for *validator* failures, not
*content* failures. Phase 2 should add a `--strict` flag that exits non-zero
when any `severity=fail` finding exists.

## Layout

```
tools/validator/
├── README.md      — this file
└── validate.py    — single-file entry point (~530 lines)
```

The `rules/` sub-directory mentioned in the original spec was not split out:
the rule logic is short enough to live in one file, and splitting it now would
add structure without a real reuse benefit. Phase 2 can break it apart when a
graph-build / DAG-check module appears.

