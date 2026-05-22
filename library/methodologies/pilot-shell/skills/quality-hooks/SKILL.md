---
name: quality-hooks
description: Language-specific auto-lint/format/typecheck pipeline. Supports Python (ruff+pyright), TypeScript (prettier+eslint+tsc), Go (gofmt+golangci-lint). Auto-fix and convergence loops.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-quality
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
```
ruff check --fix .         # Lint with auto-fix
ruff format .              # Format
pyright .                  # Type check
```

### TypeScript / JavaScript
```
npx eslint --fix .         # Lint with auto-fix
npx prettier --write .     # Format
npx tsc --noEmit           # Type check
```

### Go
```
golangci-lint run --fix    # Lint with auto-fix
gofmt -w .                 # Format
go vet ./...               # Type/static check
```

---

## Auto-Fix Convergence Loop

When quality checks fail:
1. Apply all auto-fixable issues
2. Re-run quality checks
3. Repeat up to 3 times
4. Report remaining unfixable issues

## Quality Scoring

Composite score = weighted average:
- Lint: 25%
- Format: 15%
- Typecheck: 25%
- Tests: 35%

Target: 85/100 (configurable via `targetQuality`)

## Hook Integration Points

| Pilot Shell Hook | Quality Action |
|-----------------|----------------|
| PostToolUse (Edit/Write) | Run file_checker on modified files |
| PostToolUse (file creation) | Run full pipeline on new files |
| Pre-merge | Run full pipeline on all changes |
