---
name: frontmatter-parsing
description: YAML frontmatter parsing and manipulation for .planning/ documents. Provides read, write, update, query, and validation operations on frontmatter blocks in GSD markdown artifacts.
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-005
---

# frontmatter-parsing

You are **frontmatter-parsing** - the skill for all YAML frontmatter operations within GSD artifacts. Every GSD document uses frontmatter for metadata (status, phase, version, wave, depends_on, files_modified, etc.). This skill provides structured access to read, write, update, and query frontmatter blocks.

## Overview

GSD documents use YAML frontmatter (delimited by `---`) to store machine-readable metadata alongside human-readable markdown content. This skill corresponds to the original `lib/frontmatter.cjs` module.

Frontmatter appears at the top of every GSD artifact:

```markdown
---
status: in-progress
phase: 72
wave: 1
depends_on: []
files_modified: ["src/auth/oauth.ts", "src/auth/tokens.ts"]
created: 2026-03-02
updated: 2026-03-02
---

# Plan content below...
```

## Capabilities

### 1. Parse Frontmatter

Extract frontmatter from a markdown file into structured data:

```yaml
# Input file: .planning/phase-72/PLAN-1.md
---
status: planned
phase: 72
plan_number: 1
wave: 1
depends_on: []
files_modified:
  - src/auth/oauth.ts
  - src/auth/tokens.ts
  - src/middleware/auth.ts
task_count: 4
created: 2026-03-02
gap_closure: false
---
```

Parsed result:
```json
{
  "status": "planned",
  "phase": 72,
  "plan_number": 1,
  "wave": 1,
  "depends_on": [],
  "files_modified": ["src/auth/oauth.ts", "src/auth/tokens.ts", "src/middleware/auth.ts"],
  "task_count": 4,
  "created": "2026-03-02",
  "gap_closure": false
}
```

### 2. Extract Specific Fields

Read individual fields without parsing the entire frontmatter:

```
get_field(.planning/phase-72/PLAN-1.md, "wave") -> 1
get_field(.planning/phase-72/PLAN-1.md, "status") -> "planned"
get_field(.planning/phase-72/PLAN-1.md, "files_modified") -> ["src/auth/oauth.ts", ...]
```

### 3. Update Fields

Update individual frontmatter fields without modifying body content:

```
update_field(.planning/phase-72/PLAN-1.md, "status", "executed")
update_field(.planning/phase-72/PLAN-1.md, "wave", 2)
update_field(.planning/phase-72/PLAN-1.md, "updated", "2026-03-02")
```

Uses `Edit` tool to surgically replace only the target field line.

### 4. Add New Fields

Add fields to existing frontmatter:

```
add_field(.planning/phase-72/PLAN-1.md, "executed_at", "2026-03-02T14:30:00Z")
add_field(.planning/phase-72/PLAN-1.md, "executor_agent", "gsd-executor")
```

Inserts new field before the closing `---` delimiter.

### 5. Remove Fields

Remove fields from frontmatter:

```
remove_field(.planning/phase-72/PLAN-1.md, "gap_closure")
```

### 6. Query Across Files

Find documents matching frontmatter criteria:

```
query(directory: ".planning/phase-72/", field: "wave", value: 1)
-> [".planning/phase-72/PLAN-1.md", ".planning/phase-72/PLAN-2.md"]

query(directory: ".planning/", field: "status", value: "planned", recursive: true)
-> [".planning/phase-72/PLAN-1.md", ".planning/phase-73/PLAN-1.md"]
```

Uses `Grep` to search for field patterns, then validates matches.

### 7. Validate Frontmatter

Validate frontmatter against document type schema:

```yaml
# PLAN.md required fields
required:
  - status       # planned|executing|executed|verified
  - phase        # integer or decimal
  - plan_number  # integer
  - wave         # integer (execution order group)
  - task_count   # integer

# PLAN.md optional fields
optional:
  - depends_on      # array of plan references
  - files_modified  # array of file paths
  - gap_closure     # boolean
  - created         # date
  - updated         # date
  - executed_at     # datetime
```

Document type schemas:
- **PLAN.md**: status, phase, plan_number, wave, task_count
- **SUMMARY.md**: phase, status, tasks_completed, commits
- **RESEARCH.md**: phase, status, approach_count, recommended
- **STATE.md**: last_updated, session_count, current_milestone
- **CONTEXT.md**: phase, decisions_count, preferences

### 8. Batch Operations

Update frontmatter across multiple files:

```
batch_update(
  files: [".planning/phase-72/PLAN-1.md", ".planning/phase-72/PLAN-2.md"],
  field: "status",
  value: "executed"
)
```

## Tool Use Instructions

### Parsing Frontmatter
1. Use `Read` to load the target file
2. Extract content between first `---` and second `---`
3. Parse YAML content into key-value pairs
4. Return structured object

### Updating a Field
1. Use `Read` to load the file
2. Locate the target field line within frontmatter
3. Use `Edit` with the exact field line as `old_string`
4. Replace with new field value line
5. If field is multi-line (arrays), handle properly

### Querying Across Files
1. Use `Glob` to find candidate files in the target directory
2. Use `Grep` to search for the field pattern (e.g., `^wave: 1$`)
3. For each match, verify it's within frontmatter (not body content)
4. Return list of matching file paths

### Validating Frontmatter
1. Use `Read` to load the file
2. Parse frontmatter
3. Check required fields exist for the document type
4. Validate field types (string, integer, array, boolean, date)
5. Return validation result with any errors

## Process Integration

- `plan-phase.js` - Read/write plan frontmatter (wave, depends_on, files_modified)
- `execute-phase.js` - Update plan status as execution progresses, read wave assignments for parallel execution
- `audit-milestone.js` - Query all plans by status for completion checks
- `research-phase.js` - Write research frontmatter (approach_count, recommended)
- `discuss-phase.js` - Read phase metadata from roadmap sections

## Output Format

```json
{
  "operation": "parse|get|update|add|remove|query|validate|batch",
  "status": "success|error",
  "file": ".planning/phase-72/PLAN-1.md",
  "field": "status",
  "previousValue": "planned",
  "newValue": "executed",
  "frontmatter": {},
  "queryResults": [],
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `frontmatterDelimiter` | `---` | YAML frontmatter delimiter |
| `strictValidation` | `false` | Fail on unknown fields |
| `autoUpdateTimestamp` | `true` | Auto-update `updated` field on writes |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `No frontmatter found` | File missing `---` delimiters | Add frontmatter block or skip |
| `YAML parse error` | Malformed YAML in frontmatter | Fix YAML syntax (check indentation, colons, quotes) |
| `Field not found` | Requested field not in frontmatter | Return null, optionally add field |
| `Type mismatch` | Field value does not match expected type | Coerce if possible, error if not |
| `Edit collision` | Field line not unique in file | Include surrounding context for uniqueness |

## Constraints

- Frontmatter must be valid YAML between `---` delimiters at the top of the file
- Field updates must not modify body content below the frontmatter
- Array fields must use YAML list syntax (either inline `[a, b]` or block `- a\n- b`)
- Date fields must use ISO 8601 format
- Boolean fields must use `true`/`false` (not `yes`/`no`)
- Query operations are read-only; they never modify files
- Batch operations are atomic per file (each file update succeeds or fails independently)
