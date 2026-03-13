# git-integration

Git commit patterns, structured messages, and milestone tagging for GSD methodology.

## Quick Start

GSD enforces atomic commits per task with structured messages, and separates planning commits from code commits.

### Atomic Task Commit

```bash
git add <task-related-files>
git commit -m "feat(auth): implement login endpoint

Phase 72, Plan 1, Task 1: Implement login endpoint
- POST /api/auth/login endpoint
- JWT token on success

Refs: Phase-72/PLAN-1/Task-1"
```

### Planning Commit

```bash
git add .planning/phase-72/PLAN-1.md
git commit -m "plan(phase-72): create execution plans

Refs: Phase-72/planning"
```

### Milestone Tag

```bash
git tag -a v1.0 -m "Milestone v1.0: MVP Launch
Phases: 70-73, All requirements covered"
```

## Examples

### Commit Message Types

| Type | Use |
|------|-----|
| `feat` | New feature code |
| `fix` | Bug fix |
| `test` | Test files |
| `plan` | Planning documents |
| `state` | STATE.md updates |
| `research` | Research documents |
| `verify` | Verification results |

### Branch Status Check

```json
{
  "branch": "main",
  "clean": true,
  "ahead": 3,
  "behind": 0
}
```

## Troubleshooting

### "Nothing to commit"
- Verify the task actually created or modified files
- Check that files are not gitignored
- Use `git status` to see current state

### Mixed planning and code files staged
- Unstage all files: `git reset HEAD`
- Stage code files first, commit
- Then stage planning files, commit separately

### Tag creation fails
- Check if tag already exists: `git tag -l v1.0`
- Delete existing tag if re-tagging: `git tag -d v1.0`
- Ensure you are on the correct commit
