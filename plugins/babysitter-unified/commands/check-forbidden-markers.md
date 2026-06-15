---
description: Pre-deploy gate that scans built JS chunks for forbidden substring markers (saga-era / obsolete code paths) listed in a project-local forbidden-markers.txt
argument-hint: "[--markers-file <path>] [--chunks-dir <path>] [--json] Optional overrides; defaults are project-relative."
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Compose the gate from the shared helper at `library/processes/shared/forbidden-markers-scanner.js` (issue #477).

## What this gate does

Reads a list of literal substring markers from `scripts/forbidden-markers.txt` (blank lines and `#`-prefixed comments stripped) and greps every `.js` chunk under `.vercel/output/static/_next/static/chunks/` (Next.js / Vercel default; configurable) for any occurrence. Reports structured hits per `(marker, chunk)` pair with occurrence counts. Designed to chain between `vercel build --prod` and `vercel deploy --prod`.

Use this gate when a refactor or restart-from-baseline replaced load-bearing code paths and you need a structural guarantee the obsolete symbols never re-ship. Burned-in evidence: cookbook VI-9 / VI-12 near-miss revivals during the 2026-05 iOS-Safari saga; the prototype lives at `cookbook/scripts/check-no-forbidden.mjs` and shipped two upstream contributions before being generalized as this gate.

## When to use

- **Pre-deploy.** Insert after build, before deploy. Block the deploy when `ok: false`.
- **Post-restart.** After a baseline rollback + step-by-step re-add, snapshot the saga-era markers in `forbidden-markers.txt` and let CI hold the line.
- **Post-refactor.** When old helper / handler / module names must not coexist with the new ones in the same bundle.

## Expected config locations

- `scripts/forbidden-markers.txt` — one marker per line, `#` for comments. The list is the contract; the gate is mechanical. Commit this file to source control.
- `.vercel/output/static/_next/static/chunks/` — default scan target. Override for non-Vercel frameworks via the `--chunks-dir` flag or the `chunksDir` task input.

A missing markers file is a no-op (`ok: true`, `reason: 'missing-markers-file'`) — misconfiguration is never a deploy block. A missing chunks directory is likewise a no-op (`reason: 'missing-chunks-dir'`) so the gate is safe to chain into `check:all` before the build runs.

## Exit semantics

| Reason                  | `ok`   | Deploy decision                |
|-------------------------|--------|--------------------------------|
| `missing-markers-file`  | true   | Pass (no gate active)          |
| `missing-chunks-dir`    | true   | Pass (run before build)        |
| `empty-markers`         | true   | Pass (list is empty)           |
| `no-chunks`             | true   | Pass (nothing to scan)         |
| `clean`                 | true   | Pass — proceed to deploy       |
| `hits`                  | false  | **BLOCK** — surface hits, ask for triage |

For each hit, the gate emits `{ marker, chunk, count }` so the operator sees the exact marker string, the absolute chunk path, and the number of occurrences in that chunk. Multiple hits across chunks for the same marker are reported separately.

## Programmatic surface

```js
import { scanForbiddenMarkers, checkForbiddenMarkersTask } from '@a5c-ai/babysitter-library/processes/shared';

// Direct call:
const result = await scanForbiddenMarkers({
  markersFile: 'scripts/forbidden-markers.txt',
  chunksDir:   '.vercel/output/static/_next/static/chunks',
});
if (!result.ok) {
  // result.hits: Array<{ marker, chunk, count }>
  // result.reason === 'hits'
  process.exit(1);
}

// Or dispatched as a babysitter task:
const gate = await ctx.task(checkForbiddenMarkersTask, {
  projectDir: '.',
  // markersFile / chunksDir are inferred from projectDir if omitted
});
```

## Reference

- Issue: https://github.com/a5c-ai/babysitter/issues/477
- Helper module: `library/processes/shared/forbidden-markers-scanner.js`
- Origin (cookbook prototype): `cookbook/scripts/check-no-forbidden.mjs` (81 lines)
