# References and Attribution

## Source Repository

- **Repository:** https://github.com/automazeio/ccpm
- **Organization:** Automaze.io
- **License:** See source repository for license terms
- **Description:** Claude Code PM (CCPM) - A spec-driven project management methodology for Claude Code

## Original Work

CCPM enforces spec-driven development: "Every line of code must trace back to a specification." The methodology provides five strict workflow phases with zero shortcuts.

## CCPM Components Referenced

### Command Groups (from original CCPM)

#### PRD Commands
- `prd-new` - Create new PRD through brainstorming
- `prd-parse` - Transform PRD into technical epic
- `prd-list` - List all PRDs
- `prd-edit` - Edit existing PRD
- `prd-status` - Check PRD status

#### Epic Commands
- `epic-decompose` - Break epic into tasks
- `epic-sync` - Sync epic to GitHub
- `epic-oneshot` - Create and sync in one step
- `epic-list` - List all epics
- `epic-show` - Show epic details
- `epic-close` - Close completed epic
- `epic-edit` - Edit existing epic
- `epic-refresh` - Refresh epic from GitHub

#### Issue Commands
- `issue-show` - Show issue details
- `issue-status` - Check issue status
- `issue-start` - Start working on issue
- `issue-sync` - Sync issue with GitHub
- `issue-close` - Close issue
- `issue-reopen` - Reopen issue
- `issue-edit` - Edit issue

#### Workflow Commands
- `next` - Get next recommended action
- `status` - Overall project status
- `standup` - Generate standup report
- `blocked` - Show blocked tasks
- `in-progress` - Show in-progress tasks

#### Sync Commands
- `sync` - Bidirectional GitHub sync
- `import` - Import from GitHub

#### Maintenance Commands
- `validate` - Validate project structure
- `clean` - Clean stale artifacts
- `search` - Search across artifacts

### File Structure (from original CCPM)
```
.claude/
  agents/          # Task-oriented agents
  commands/        # Command definitions (context/, pm/, testing/)
  context/         # Project-wide context
  epics/           # Local workspace (gitignored)
    [epic-name]/   (epic.md, [#].md, updates/)
  prds/            # PRD files
  rules/           # Reference rules
  scripts/         # Utility scripts
```

### Key Patterns Preserved
- Spec-driven development: no implementation without specification
- Five-phase workflow: PRD -> Epic -> Tasks -> GitHub -> Execution
- Parallel execution: 4-5 work streams (database, API, UI, testing, docs)
- 5-12 parallel agents per issue
- Agent specialization per domain
- Issue state machine: open -> in-progress -> blocked -> review -> closed
- Full traceability: PRD -> Epic -> Task -> Issue -> Code Commit
- Persistent context: no session information lost
- Transparent audit trail: GitHub issues as source of truth
- Seamless human-AI handoffs

## Adaptation Notes

This babysitter adaptation translates CCPM concepts into the babysitter SDK process definition format:
- CCPM slash commands become process functions with `ctx.task()` calls
- PRD/Epic/Task creation uses `kind: 'agent'` tasks with specialized agents
- GitHub sync uses agent tasks that invoke `gh` CLI
- Parallel execution uses `ctx.parallel.all()` for independent streams
- Human approval gates use `ctx.breakpoint()`
- Quality convergence loops enforce configurable thresholds
- CCPM file structure (.claude/prds/, .claude/epics/) is preserved
- Issue states are tracked through the project-tracker agent
