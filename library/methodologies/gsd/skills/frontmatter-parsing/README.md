# frontmatter-parsing

YAML frontmatter parsing and manipulation for GSD markdown documents.

## Quick Start

All GSD documents use YAML frontmatter for metadata. This skill reads, writes, and queries frontmatter fields.

### Parse Frontmatter

Read a file and extract the YAML block between `---` delimiters at the top.

### Update a Field

```
Before: status: planned
After:  status: executed
```

Only the target field line is modified; body content is untouched.

### Query by Field

Find all PLAN.md files where `wave: 1`:

```bash
# Searches .planning/ recursively for files with matching frontmatter
```

## Examples

### Plan Frontmatter

```yaml
---
status: planned
phase: 72
plan_number: 1
wave: 1
depends_on: []
files_modified:
  - src/auth/oauth.ts
  - src/auth/tokens.ts
task_count: 4
created: 2026-03-02
---
```

### State Frontmatter

```yaml
---
last_updated: 2026-03-02T14:30:00Z
session_count: 12
current_milestone: v1.0
---
```

### Batch Status Update

Update all plans in a phase to "executed" status after phase completion.

## Troubleshooting

### YAML parse errors
- Check for missing colons after field names
- Ensure arrays use consistent syntax (inline or block)
- Verify no tabs are used (YAML requires spaces)
- Check for unquoted special characters in values

### Field update changes wrong line
- Ensure the field is within the frontmatter block (between `---` delimiters)
- If the same text appears in the body, provide more context for uniqueness
- Use `Edit` with surrounding lines for disambiguation

### Query returns no results
- Verify the field name and value match exactly (case-sensitive)
- Check that files in the directory actually have frontmatter
- Ensure the search is recursive if files are in subdirectories
