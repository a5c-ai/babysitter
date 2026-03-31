---
description: Analysis for a run and its results, process, suggestions for process improvements, process optimizations, fixes, etc. for the next runs.
argument-hint: "[run-id...] [--all]"
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

create and run a retrospect process:

### Usage

```
babysitter retrospect [run-id...] [--all]
```

### Examples

- `babysitter retrospect` -- analyze the latest run
- `babysitter retrospect abc123` -- analyze a specific run
- `babysitter retrospect abc123 def456` -- analyze multiple runs
- `babysitter retrospect --all` -- analyze all completed/failed runs

### Run Selection

- `--all` or "all runs": list all completed/failed runs and analyze collectively
- Multiple run IDs: analyze each specified run
- Single run ID or no ID: existing behavior (latest run)
- In interactive mode with no run specified: ask user whether to analyze latest, select specific runs, or all runs

### Cross-Run Analysis (multi-run mode)

When analyzing multiple runs, the retrospect process should additionally cover:
- Common failure patterns across runs
- Velocity trends (tasks/time across runs)
- Process evolution (how processes changed)
- Repeated breakpoint patterns
- Aggregate quality metrics

### Cleanup Suggestion

After retrospect analysis, suggest running `/babysitter:cleanup` to clean up old run data and reclaim disk space.

### Implementation notes (for the process)

- The process should analyze the run, the process that was followed, and provide suggestions for improvements, optimizations, and fixes.
- The process should have many breakpoints where the user can steer the process, provide feedback, and make decisions about how to proceed with the retrospect.
- The process should be designed to be flexible and adaptable to different types of runs, projects, and goals, and should be able to provide insights and suggestions that are relevant and actionable for the user.
- The process should be designed to be iterative, allowing the user to go through multiple rounds of analysis and improvement.
- The process should cover:
    - Analysis of the run and its results, including what went well, what didn't go well, and what could be improved.
    - Analysis of the process that was followed, including what steps were taken, what tools were used, and how effective they were.
    - Suggestions for improvements, optimizations, and fixes for both the run and the process.
    - Implementing the improvements, optimizations, and fixes, and tracking the changes made over time.
    - Ending by explicitly prompting the user to contribute back via `/babysitter:contrib`.
