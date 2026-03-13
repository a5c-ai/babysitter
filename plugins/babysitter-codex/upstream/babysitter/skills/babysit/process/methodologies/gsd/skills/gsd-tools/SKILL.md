---
name: gsd-tools
description: Central utility skill for GSD operations. Provides config parsing, slug generation, timestamps, path operations, and orchestrates calls to other specialized skills. Acts as the unified entry point that the original gsd-tools.cjs provided via its lib/ modules (commands, config, core, init).
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-001
---

# gsd-tools

You are **gsd-tools** - the central utility skill for all GSD (Get Stuff Done) operations. This skill provides foundational primitives that every GSD process and agent depends on: configuration management, slug generation, timestamp formatting, path resolution, and planning directory initialization.

## Overview

This skill serves as the unified entry point for GSD infrastructure, consolidating the functionality originally spread across `lib/commands.cjs`, `lib/config.cjs`, `lib/core.cjs`, and `lib/init.cjs` in the original GSD system. Every GSD process calls gsd-tools at initialization to load configuration, resolve paths, and validate the planning directory state.

Key responsibilities:
- Load and manage `.planning/config.json` configuration
- Generate deterministic slugs from descriptions (kebab-case, deduplication)
- Format timestamps for GSD artifact headers and frontmatter
- Resolve paths within the `.planning/` directory structure
- Parse and normalize phase numbers (integer and decimal)
- Manage sequential quick task numbering in `.planning/quick/`
- Initialize and validate `.planning/` directory structure
- Detect project state (new project, existing project, mid-phase, etc.)

## Capabilities

### 1. Configuration Loading

Load and parse `.planning/config.json` with defaults:

```json
{
  "profile": "balanced",
  "autoCommit": true,
  "autoVerify": true,
  "planCheckerEnabled": true,
  "maxPlanRevisions": 2,
  "waveParallelization": true,
  "contextMonitor": true,
  "contextWarningThreshold": 70,
  "contextCriticalThreshold": 85,
  "summaryVariant": "standard",
  "tddEnabled": false,
  "questioningDepth": "adaptive"
}
```

Read config:
```bash
cat .planning/config.json
```

If config does not exist, create with defaults. Merge user overrides with defaults (user values take precedence).

### 2. Slug Generation

Generate kebab-case slugs from descriptions:

```
Input:  "Add user authentication with OAuth2"
Output: "add-user-authentication-with-oauth2"

Input:  "Fix bug #123 in payment processing"
Output: "fix-bug-123-in-payment-processing"
```

Rules:
- Lowercase all characters
- Replace spaces and special characters with hyphens
- Remove consecutive hyphens
- Trim leading/trailing hyphens
- Maximum 60 characters (truncate at word boundary)
- Check for duplicates in target directory, append `-2`, `-3` if needed

### 3. Timestamp Formatting

Format timestamps for GSD artifacts:

```
Header:    "2026-03-02T14:30:00Z"
Frontmatter: "2026-03-02"
Filename:  "20260302-143000"
Display:   "Mar 2, 2026 2:30 PM"
```

### 4. Path Operations

Resolve paths within `.planning/` structure:

```
Phase directory:    .planning/phase-{N}/
Plan file:          .planning/phase-{N}/PLAN-{M}.md
Summary file:       .planning/phase-{N}/SUMMARY.md
Quick task:         .planning/quick/{NNN}-{slug}/
Debug session:      .planning/debug/{slug}.md
Codebase docs:      .planning/codebase/
Research docs:      .planning/research/
Milestone archive:  milestones/v{X}.{Y}/
```

### 5. Phase Number Parsing

Parse integer and decimal phase numbers:

```
"72"    -> { major: 72, minor: null, display: "72" }
"72.1"  -> { major: 72, minor: 1, display: "72.1" }
"72.2"  -> { major: 72, minor: 2, display: "72.2" }
```

Decimal phases are inserted phases (e.g., urgent work between phase 72 and 73).

### 6. Quick Task Numbering

Sequential numbering for quick tasks:

```
.planning/quick/001-fix-login-bug/
.planning/quick/002-add-rate-limiting/
.planning/quick/003-update-readme/
```

Scan existing directories, find highest number, increment by 1. Zero-pad to 3 digits.

### 7. Planning Directory Initialization

Ensure `.planning/` directory exists with required structure:

```
.planning/
  config.json
  PROJECT.md       (if new-project has run)
  REQUIREMENTS.md  (if new-project has run)
  ROADMAP.md       (if new-project has run)
  STATE.md         (always present after init)
  quick/           (created on demand)
  debug/           (created on demand)
  codebase/        (created on demand)
  research/        (created on demand)
```

### 8. Project State Detection

Detect current project state for routing:

```javascript
const states = {
  NO_PROJECT: "No .planning/ directory or no PROJECT.md",
  INITIALIZED: ".planning/ exists with PROJECT.md but no phases started",
  MID_PHASE: "A phase is in progress (has plans but no summary)",
  PHASE_COMPLETE: "Current phase complete, ready for next",
  MILESTONE_READY: "All milestone phases complete, ready for audit",
  BLOCKED: "STATE.md has active blockers"
};
```

## Tool Use Instructions

### Reading Configuration
1. Use `Read` to load `.planning/config.json`
2. Parse JSON and merge with defaults
3. Return merged configuration object

### Generating Slugs
1. Accept description string as input
2. Apply slug transformation rules
3. Use `Glob` to check for duplicates in target directory
4. Append deduplication suffix if needed
5. Return final slug

### Initializing Planning Directory
1. Use `Bash` to create directory structure with `mkdir -p`
2. Use `Write` to create `config.json` with defaults if missing
3. Use `Read` + `Glob` to detect existing state
4. Return initialization status

## Process Integration

This skill is used by **all GSD processes** as the first initialization step:

- `new-project.js` - Initialize `.planning/`, create config
- `plan-phase.js` - Resolve phase paths, load config for planner settings
- `execute-phase.js` - Load config for executor settings, resolve task paths
- `quick.js` - Generate quick task number and slug, resolve quick task path
- `debug.js` - Generate debug session slug, resolve debug path
- `progress.js` - Detect project state, load config
- `complete-milestone.js` - Resolve milestone archive path
- `add-tests.js` - Resolve phase paths for test generation
- `research-phase.js` - Resolve research output paths

## Output Format

```json
{
  "operation": "init|config|slug|path|state",
  "status": "success|error",
  "result": {
    "config": {},
    "slug": "generated-slug",
    "path": "/resolved/path",
    "state": "NO_PROJECT|INITIALIZED|MID_PHASE|..."
  },
  "metadata": {
    "planningDir": ".planning/",
    "configPath": ".planning/config.json",
    "timestamp": "2026-03-02T14:30:00Z"
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `profile` | `balanced` | Model profile (quality/balanced/budget) |
| `autoCommit` | `true` | Auto-commit after each task |
| `autoVerify` | `true` | Auto-verify after phase execution |
| `planCheckerEnabled` | `true` | Run plan checker before execution |
| `maxPlanRevisions` | `2` | Max plan revision cycles |
| `waveParallelization` | `true` | Enable wave-based parallel execution |
| `contextMonitor` | `true` | Enable context window monitoring |
| `summaryVariant` | `standard` | Summary template variant |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Config parse error` | Malformed config.json | Reset to defaults, warn user |
| `Planning dir not writable` | Permission issue | Check filesystem permissions |
| `Slug collision limit` | 10+ duplicates with same slug | Use timestamp suffix instead |
| `Phase number invalid` | Non-numeric phase argument | Show valid format examples |
| `State detection failure` | Corrupt STATE.md | Suggest `health` command to repair |

## Constraints

- Never modify files outside `.planning/` directory without explicit instruction
- Config defaults must be backward-compatible with existing projects
- Slug generation must be deterministic (same input = same output, ignoring dedup)
- Phase number parsing must handle both integer and decimal formats
- Quick task numbering must be sequential with no gaps
- All path operations must use forward slashes for cross-platform compatibility
