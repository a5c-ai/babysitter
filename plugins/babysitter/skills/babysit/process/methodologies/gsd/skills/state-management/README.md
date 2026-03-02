# state-management

STATE.md CRUD operations and cross-session memory persistence for GSD projects.

## Quick Start

STATE.md is the living memory of your GSD project. This skill reads, writes, and updates it.

### Read Current State

```bash
cat .planning/STATE.md
```

### Update Current Task

Edit the "Current Work" section to reflect what is being worked on now.

### Add a Blocker

Append to the Blockers section:
```markdown
- [ ] [HIGH] Description of blocker (@owner, 2026-03-02)
```

### Resolve a Blocker

Change `[ ]` to `[x]` and append resolution date.

### Log a Decision

Append a row to the Decisions table:
```markdown
| 2026-03-02 | Decision text | Rationale text |
```

## Examples

### Fresh State After New Project

```markdown
---
last_updated: 2026-03-02T14:30:00Z
session_count: 1
current_milestone: v1.0
---

# Project State

## Current Work
- **Phase**: none
- **Task**: none
- **Status**: initialized

## Completed Phases
(none yet)

## Blockers
(none)

## Decisions
| Date | Decision | Rationale |
|------|----------|-----------|

## Quick Tasks
| # | Task | Status | Date |
|---|------|--------|------|
```

### Mid-Project State

The state fills in as phases are planned, executed, and verified.

## Troubleshooting

### STATE.md is missing
- Run gsd-tools initialization to create from template
- Or create manually following the format above

### Edits failing (non-unique match)
- STATE.md edits use exact string matching
- Provide more surrounding context in the edit operation
- Avoid duplicate text in different sections

### Session count not incrementing
- Session count updates on first read per session
- Check frontmatter YAML is valid

### Blocker not showing as resolved
- Ensure the checkbox syntax changed from `- [ ]` to `- [x]`
- Append the resolution date after the blocker text
