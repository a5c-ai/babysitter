---
name: kip-librarian
description: "Canonical kip knowledge-store patterns for any process or agent: recall prior facts before work, assert decisions/gate outcomes/rejections as structured facts after work, resolve entities with explicit --model sonnet, and invoke the CLI Windows-safely via node packages/kip-sdk/dist/cli/kip.js when kip is not on PATH."
allowed-tools: Read Glob Grep Bash
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: knowledge-management
  backlog-id: SK-SHARED-KIP-001
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:orchestration-loop, skill-area:knowledge-management]
  topics: [topic:developer-experience, topic:quality-assurance]
  roles: [role:platform-engineer, role:backend-engineer]
  workflows: [workflow:feature-development]
---

# kip-librarian

You are **kip-librarian** - a specialized skill prescribing the canonical kip knowledge-store lifecycle for any process or agent: recall prior facts before work, assert structured facts after work, resolve entities with an explicit strong model, and invoke the CLI safely on every platform including Windows.

## Overview

This skill prescribes the recall-at-start / assert-at-end lifecycle:

- **Recall before work**: query the store for prior facts, decisions, and rejections on the topic before doing anything.
- **Assert after work**: persist decisions, gate outcomes, and rejection reasons as structured facts so future runs can recall them.
- **Resolve with care**: entity resolution always uses an explicit strong model; merges never happen without a gate.

It closes the library's biggest systemic gap - kip appears in only ~58 of 2191 process files - by making integration copy-paste cheap instead of research-expensive. This skill **prescribes the bar rather than executes it**: retrofit batches stamp this contract into older processes, and new processes adopt it directly.

## Capabilities

### 1. CLI Resolution (Windows-safe)

Resolve the kip CLI in this exact order:

1. `kip` if it is on PATH.
2. `node packages/kip-sdk/dist/cli/kip.js` from the repo root.

**NEVER use `npm exec kip`** - npm bin resolution fails on Windows.

Invocation rules that apply to EVERY command:

- Every invocation needs `--dir <store>` AND `--replica <id>` (or the `KIP_REPLICA_ID` env var). This applies to **reads too**, not just writes - `recall`, `get`, and `query` fail with exit 3 without a replica identity.
- Writes (`assert`, `retract`, `link`, ...) additionally require a resolvable keyring: `--keyring`, `KIP_KEYRING`, or `<dir>/keyring.json`. Any parseable JSON object works (the repo mints an ephemeral keypair); without one, writes fail with exit 3 `keyring required to author facts`.
- Always pass `--json` in automation.

The full command surface is `init|open|assert|retract|get|query|recall|asof|fsck|rollup|sync|ask|index|link|resolve|learn|ingest-rdf`; assert forms are `node|edge|fact`.

### 2. Store Bootstrap

Initialize (or idempotently open) the store once per run:

```bash
kip init --dir .a5c/kip --create --replica <run-or-agent-id> --json
```

`--create` makes `init` an idempotent open when the store already exists. Then ensure `<dir>/keyring.json` exists (any JSON object, e.g. `{}`, created once alongside init) before any write.

**0 recall results on a fresh store means fresh brain, not a query error.** Do not retry, loosen the query, or treat it as failure.

### 3. Pattern 1 - Recall Before Work

At task start, recall prior facts on the topic:

```bash
kip recall "<topic text>" --dir .a5c/kip --replica <id> --k 8 --json
```

`--k` is a **mandatory** flag for `recall`.

Also available:

- Targeted lookup: `kip get <eid> --dir .a5c/kip --replica <id> --json`
- Bounded traversal: `kip query --seed <eid> --direction out --depth 1 --max-fanout 10 --dir .a5c/kip --replica <id> --json` - `--depth`, `--max-fanout`, and `--direction` are all **mandatory** flags for `query`.

Feed results into downstream prompts as a `priorKnowledge` object:

```json
{
  "factCount": 3,
  "insights": ["..."],
  "priorRejected": ["..."]
}
```

### 4. Pattern 2 - Assert After Work

Persist structured facts as `assert node` with these kind conventions:

| kind | props |
|------|-------|
| `decision` | `topic`, `choice`, `status`, `rationale` |
| `gate-outcome` | `passed`, `issues`, `evidence` - the `{passed, issues[], evidence[]}` adversarial-gate contract |
| `rejection` | `item`, `reason`, `gate` |

```bash
kip assert node --dir .a5c/kip --replica <id> --eid decision:<slug> --kind decision \
  --prop "topic=..." --prop "choice=..." --prop "status=accepted" --prop "rationale=..." --json
```

The echo is `{"eid": "...", "status": "pending"}` - **`pending` is expected, not an error**. There is no commit at assert time BY DESIGN; agents must not treat this as a failure or retry the assert.

Link related facts with edges:

```bash
kip assert edge --kind <edge-kind> --from <eid> --to <eid> --valid-from <t> --dir .a5c/kip --replica <id> --json
```

### 5. Pattern 3 - Entity-Resolution Etiquette

`kip resolve` **ALWAYS** with an explicit `--model sonnet`:

```bash
kip resolve <args> --model sonnet --dir .a5c/kip --replica <id> --json
```

Default weak (haiku-class) models intermittently fail `--json-schema` conformance and adjudication under-fires. The `KIP_RESOLVE_MODEL` env var is honored and sonnet is the fixed default per D-69, but be explicit anyway - precedence is `--model` > `KIP_RESOLVE_MODEL` > sonnet.

Use the resolve confirm/reject subflows for candidate matches. **Never auto-merge entities without a gate** (see Pattern 4).

### 6. Pattern 4 - Breakpoints Worth Routing

Route a human breakpoint for:

- **Entity-merge approvals** - `breakpointId` like `kip-entity-merge-<pair>`, `expert: knowledge-curator`, tags `[kip, entity-resolution]`.
- **Destructive retractions** of durable facts.
- **Cross-run contradictions** surfaced by `--fail-on-conflict`.

Routine asserts and recalls **never** breakpoint - keep breakpoints sparse per repo policy.

## Worked Examples

Proven transcript, executed live on Windows 2026-07-23 against `packages/kip-sdk/dist/cli/kip.js` (`<scratch>` is a scratch directory):

Init:

```bash
node packages/kip-sdk/dist/cli/kip.js init --dir <scratch>/kip-test --create --replica skill-design-test --json
```

Observed output: `{"dir":"...kip-test","created":true,"manifestGenesisCid":"sha256:68eacf890b49ad810581e8fe4d7ff712f44f4611b29f93d96a51345b9ddc55b5","branch":"refs/kip/replicas/skill-design-test"}` (exit 0)

Assert a decision node (requires `<dir>/keyring.json` to exist - any JSON object, e.g. `{}`):

```bash
node packages/kip-sdk/dist/cli/kip.js assert node --dir <scratch>/kip-test --replica skill-design-test --eid decision:kip-librarian-format --kind decision --prop "topic=kip-librarian skill format" --prop "choice=match meta/skills SKILL.md frontmatter" --prop "status=accepted" --json
```

Observed output: `{"eid":"decision:kip-librarian-format","status":"pending"}` (exit 0)

Assert a gate-outcome node:

```bash
node packages/kip-sdk/dist/cli/kip.js assert node --dir <scratch>/kip-test --replica skill-design-test --eid gate:kip-librarian-design-review --kind gate-outcome --prop "passed=true" --prop "evidence=proven CLI transcript 2026-07-23" --json
```

Observed output: `{"eid":"gate:kip-librarian-design-review","status":"pending"}` (exit 0)

Recall:

```bash
node packages/kip-sdk/dist/cli/kip.js recall "kip-librarian skill format decision" --dir <scratch>/kip-test --replica skill-design-test --k 5 --json
```

Observed output: JSON array of 2 hits, each `{eid, view:{kind, props with typed segments incl. passed:true as boolean}, score, ranks:{graph:N}, conflicted:false, provenance:{author:"kip:putNode:skill-design-test", publicKey, signature, ...}}`; `decision:kip-librarian-format` ranked 1 (exit 0)

Get:

```bash
node packages/kip-sdk/dist/cli/kip.js get decision:kip-librarian-format --dir <scratch>/kip-test --replica skill-design-test --json
```

Observed output: `{"eid":"decision:kip-librarian-format","kind":"decision","props":{choice/status/topic each as {segments:[{kind:"value",value:...,validFrom:0,validTo:null,assertedBy:<hash>}]}},"provenance":{...signed...}}` (exit 0)

### Troubleshooting (observed failure modes)

| Symptom | Exit code | Cause | Fix |
|---------|-----------|-------|-----|
| `replicaId required (--replica or KIP_REPLICA_ID)` | 3 | `--replica` omitted (observed live when omitting it from `assert node`) | Pass `--replica <id>` or set `KIP_REPLICA_ID` on every command, reads included |
| `keyring required to author facts` | 3 | `<dir>/keyring.json` missing on a write (observed live) | Create `<dir>/keyring.json` with any JSON object (e.g. `{}`) once alongside init, or pass `--keyring` / set `KIP_KEYRING` |

## Output Format

JSON block the skill emits when used in a task:

```json
{
  "recalled": [],
  "asserted": [{ "eid": "decision:example", "status": "pending" }],
  "conflicts": [],
  "artifacts": []
}
```

## Constraints

- Never fabricate stamps - only record recall/assert results that actually came from the CLI.
- Exit-code contract:

  | Exit code | Meaning |
  |-----------|---------|
  | 2 | Usage error (bad flags/arguments) |
  | 3 | Resolution error (missing replica identity or keyring) |
  | 6 | Data-condition (unknown eid, conflict) |

- Always pass `--json` in automation; do not parse human-format output.
- `assert` echoing `status: "pending"` is by design - never treat it as failure.
- Never `npm exec kip`; resolve the CLI per the Windows-safe order above.
- Never auto-merge entities or retract durable facts without a routed breakpoint.
