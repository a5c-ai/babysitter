---
name: git-integration
description: Git commit patterns, formats, and conventions for GSD methodology. Provides atomic commits per task, structured commit messages, planning file commits, branch management, and milestone tag operations.
allowed-tools: Bash(*) Read Glob
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-008
---

# git-integration

You are **git-integration** - the skill that manages all git operations within the GSD methodology. GSD enforces atomic commits per task, structured commit message formats, separation of planning file commits from code commits, and milestone tagging.

## Overview

Git integration in GSD follows two key principles:
1. **Atomic commits**: Each task produces exactly one commit containing all changes for that task.
2. **Separation of concerns**: Planning file changes (`.planning/`) are committed separately from code changes.

This corresponds to the patterns in the original `references/git-integration.md` and `references/git-planning-commit.md`.

## Capabilities

### 1. Atomic Commit Per Task

Each task in a plan produces one atomic commit:

```bash
# After completing task 1 of PLAN-1.md
git add src/auth/oauth.ts src/auth/types.ts
git commit -m "feat(auth): implement OAuth2 login endpoint

Phase 72, Plan 1, Task 1: Implement login endpoint
- Added POST /api/auth/login with email/password validation
- Returns JWT token on success, 401 on invalid credentials
- Rate limited to 5 attempts per minute

Refs: Phase-72/PLAN-1/Task-1"
```

Commit message format:
```
<type>(<scope>): <short description>

Phase <N>, Plan <M>, Task <K>: <task title>
- <change 1>
- <change 2>

Refs: Phase-<N>/PLAN-<M>/Task-<K>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.

### 2. Planning File Commits

Planning files are committed separately from code:

```bash
# After generating plans
git add .planning/phase-72/PLAN-1.md .planning/phase-72/PLAN-2.md
git commit -m "plan(phase-72): create execution plans

Phase 72: Authentication
- PLAN-1.md: OAuth2 login and token management (4 tasks, wave 1)
- PLAN-2.md: Auth middleware and role guards (3 tasks, wave 1)

Refs: Phase-72/planning"
```

Planning commit types: `plan`, `state`, `research`, `context`, `verify`, `audit`.

### 3. Commit Message Generation

Generate commit messages from task context:

```
Input:
  phase: 72
  plan: 1
  task: 1
  title: "Implement login endpoint"
  type: "feat"
  scope: "auth"
  changes: ["POST /api/auth/login endpoint", "JWT token generation", "Rate limiting"]

Output:
  "feat(auth): implement OAuth2 login endpoint

  Phase 72, Plan 1, Task 1: Implement login endpoint
  - Added POST /api/auth/login endpoint
  - JWT token generation on success
  - Rate limiting (5 attempts/minute)

  Refs: Phase-72/PLAN-1/Task-1"
```

### 4. Git Tag Creation

Create annotated tags for milestone completions:

```bash
git tag -a v1.0 -m "Milestone v1.0: MVP Launch

Phases completed: 70, 71, 72, 73
Requirements covered: R1-R11
Audit result: PASSED

Key deliverables:
- Project scaffolding and CI pipeline
- Database layer with migrations
- OAuth2 authentication
- REST API endpoints"
```

### 5. Branch Status Detection

Detect current branch state:

```json
{
  "branch": "main",
  "clean": false,
  "staged": ["src/auth/oauth.ts"],
  "unstaged": [".planning/STATE.md"],
  "untracked": ["src/auth/oauth.test.ts"],
  "ahead": 3,
  "behind": 0
}
```

### 6. Planning-Aware File Staging

Separate `.planning/` files from source code files:

```bash
# Stage code changes only
git add src/auth/oauth.ts src/auth/types.ts

# Stage planning changes only (separate commit)
git add .planning/phase-72/SUMMARY.md .planning/STATE.md
```

Rules:
- Code changes: committed with task-level commit messages
- Planning changes: committed with phase-level commit messages
- Mixed commits: never (always separate planning from code)

### 7. Commit History Analysis

Analyze commit history for progress tracking:

```
Phase 72 commits:
  abc1234 feat(auth): implement OAuth2 login endpoint (Task 1)
  def5678 feat(auth): add token refresh mechanism (Task 2)
  ghi9012 feat(auth): implement logout and revocation (Task 3)
  jkl3456 test(auth): add auth endpoint tests (Task 4)

Total: 4 commits, 12 files changed, +450 -30 lines
```

### 8. Diff Summary Generation

Generate diff summaries for SUMMARY.md:

```
Changes summary:
  Files created: 4
  Files modified: 2
  Files deleted: 0
  Lines added: 450
  Lines removed: 30

  New files:
    src/auth/oauth.ts (120 lines)
    src/auth/tokens.ts (85 lines)
    src/auth/types.ts (45 lines)
    src/middleware/auth.ts (90 lines)

  Modified files:
    src/routes/index.ts (+15 -2)
    package.json (+3 -0)
```

## Tool Use Instructions

### Creating an Atomic Commit
1. Use `Bash` to run `git status` to see current changes
2. Use `Bash` to stage only the files related to the current task: `git add <files>`
3. Generate commit message from task context
4. Use `Bash` to commit: `git commit -m "<message>"`
5. Verify commit succeeded with `git log -1`

### Creating a Planning Commit
1. Use `Bash` to identify planning file changes: `git status .planning/`
2. Stage only planning files: `git add .planning/<files>`
3. Generate planning commit message
4. Commit with planning-specific type prefix

### Creating a Milestone Tag
1. Use `Read` to load milestone audit data for tag annotation
2. Use `Bash` to create annotated tag: `git tag -a <version> -m "<annotation>"`
3. Verify tag with `git tag -l <version>`

### Checking Branch Status
1. Use `Bash` to run `git status --porcelain`
2. Use `Bash` to run `git rev-list --count HEAD..@{upstream}` for behind count
3. Use `Bash` to run `git rev-list --count @{upstream}..HEAD` for ahead count
4. Return structured status

## Process Integration

- `execute-phase.js` - Atomic commit per task during execution
- `verify-work.js` - Commit verification results and fixes
- `quick.js` - Atomic commit for quick task execution
- `debug.js` - Commit debug fixes
- `complete-milestone.js` - Create milestone git tag
- `add-tests.js` - Commit each test file atomically
- `research-phase.js` - Commit research document
- `plan-phase.js` - Commit generated plans (planning commit)

## Output Format

```json
{
  "operation": "commit|tag|status|history|diff",
  "status": "success|error",
  "commit": {
    "hash": "abc1234",
    "message": "feat(auth): implement OAuth2 login endpoint",
    "filesChanged": 3,
    "linesAdded": 120,
    "linesRemoved": 5
  },
  "tag": {
    "name": "v1.0",
    "annotation": "Milestone v1.0: MVP Launch"
  },
  "branchStatus": {
    "branch": "main",
    "clean": true,
    "ahead": 0,
    "behind": 0
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `autoCommit` | `true` | Automatically commit after each task |
| `commitMessageFormat` | `conventional` | Commit message format (conventional/simple) |
| `separatePlanningCommits` | `true` | Separate planning from code commits |
| `signCommits` | `false` | GPG-sign commits |
| `tagPrefix` | `v` | Prefix for milestone tags |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Nothing to commit` | No changes to stage | Verify task made expected changes |
| `Merge conflict` | Conflicting changes in working tree | Resolve conflicts before committing |
| `Dirty working tree` | Uncommitted changes from previous task | Commit or stash before proceeding |
| `Tag already exists` | Milestone tag already created | Use `--force` or choose different tag name |
| `Detached HEAD` | Not on a branch | Checkout a branch before committing |

## Constraints

- Never create commits with mixed planning and code changes
- Each task gets exactly one code commit (atomic)
- Commit messages must follow the structured format with phase/plan/task references
- Planning commits use planning-specific type prefixes (plan, state, research, etc.)
- Tags are annotated (not lightweight) with milestone summary
- Never force-push or rewrite history on shared branches
- Always check for clean working tree before starting a new task
