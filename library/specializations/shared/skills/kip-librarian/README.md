# kip-librarian

Canonical kip knowledge-store patterns for processes and agents in the babysitter library.

## Why this skill exists

kip appears in only ~58 of 2191 process files - the library's biggest systemic integration gap. Most processes neither recall prior knowledge before working nor persist their decisions afterward, so every run starts with a fresh brain and repeats past mistakes. This skill makes kip integration copy-paste cheap instead of research-expensive: every command line in it is proven (executed live on Windows against `packages/kip-sdk/dist/cli/kip.js`), so processes can adopt the patterns verbatim.

## The recall/assert contract

This is the contract retrofit batches will stamp into older processes, making this skill a direct dependency of all future kip retrofits:

1. **Recall before work** - at task start, `kip recall "<topic>" --k 8 --json` (plus targeted `get` / bounded `query`) and feed results into prompts as `priorKnowledge {factCount, insights, priorRejected}`.
2. **Assert after work** - persist decisions (`kind=decision`), gate outcomes (`kind=gate-outcome` with the `{passed, issues[], evidence[]}` contract), and rejections (`kind=rejection`) as structured facts. The `{"status":"pending"}` echo is by design, not an error.
3. **Resolve carefully** - `kip resolve` always with explicit `--model sonnet`; entity merges, destructive retractions, and cross-run conflicts route human breakpoints; routine asserts/recalls never do.

## Install / usage notes

- Cross-domain asset: lives in `library/specializations/shared/skills/` per the placement policy (cross-domain assets go to `specializations/shared`).
- CLI resolution is Windows-safe: use `kip` if on PATH, else `node packages/kip-sdk/dist/cli/kip.js` from the repo root. Never `npm exec kip` (bin resolution fails on Windows).
- Every command - reads included - needs `--dir <store>` and `--replica <id>` (or `KIP_REPLICA_ID`). Writes also need `<dir>/keyring.json` (any JSON object) or they exit 3.
- Bootstrap once per run: `kip init --dir .a5c/kip --create --replica <run-or-agent-id> --json` (idempotent open when the store exists).
- Reference the skill from tasks via `skill: { name: 'kip-librarian' }`.

## Proven-invocation transcript requirement

The worked examples in [SKILL.md](./SKILL.md) use only commands actually executed against a scratch store (transcript of 2026-07-23), including the two observed failure modes (exit 3 missing replica, exit 3 missing keyring) in the troubleshooting table. When updating this skill, keep that bar: an adversarial critic must verify every documented CLI invocation actually executes with evidence transcripts before changes pass. Do not add speculative or unverified command lines.
