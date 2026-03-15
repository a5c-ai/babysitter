# References

## Source Attribution

The Planning with Files babysitter process definitions are adapted from the Planning with Files open-source project.

- **Repository:** https://github.com/OthmanAdi/planning-with-files
- **Author:** OthmanAdi
- **License:** See source repository for license terms

## Planning with Files Components Referenced

### Three-File Pattern
- `task_plan.md` - Phases, goals, and progress checkboxes
- `findings.md` - Research, discoveries, and decision rationale
- `progress.md` - Session logs, test results, and error records

### 5 Manus Principles (from Manus AI context engineering)
1. Filesystem as Memory - Store in files, not context window
2. Attention Manipulation - Re-read plan before every decision
3. Error Persistence - Log all failures in plan file
4. Goal Tracking - Checkboxes show progress at a glance
5. Completion Verification - Stop hook checks all phases complete

### Commands Referenced
- `/plan` - Start planning session
- `/plan:status` - Show progress at a glance
- `/planning` - Original start command

### Hook System Referenced
- `PreToolUse` - Re-read plan before decisions
- `PostToolUse` - Remind status updates after writes
- `Stop` - Verify all phases complete before exit

### Key Rules Referenced
1. Create plan first - never start without task_plan.md
2. 2-Action Rule - save findings after every 2 view/browser operations
3. Log ALL errors - avoid repetition
4. Never repeat failures - track attempts, mutate approach

### Session Recovery Referenced
- Checks `~/.claude/projects/` for previous session data
- Finds last planning file update timestamp
- Extracts post-update conversation (lost context)
- Shows catchup report for manual sync

### Supported Platforms Referenced
- 16 IDEs + BoxLite sandbox

## Adaptation Notes

This babysitter adaptation translates Planning with Files concepts into the babysitter SDK process definition format:
- The three-file pattern becomes structured task outputs managed by agent tasks
- Manus principles become process flow patterns (re-read before decide, log before continue)
- Hook system (PreToolUse, PostToolUse, Stop) maps to `ctx.breakpoint()` gates and convergence loops
- Commands (/plan, /plan:status) map to separate process files (orchestrator, verification)
- Session recovery maps to the planning-session.js process with detect/recover/merge tasks
- 2-Action Rule maps to action counting in planning-execution.js with batch persistence
- Quality gates map to weighted scoring in planning-verification.js
