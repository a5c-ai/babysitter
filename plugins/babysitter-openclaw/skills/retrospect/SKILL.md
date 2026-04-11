---
name: retrospect
description: Analysis for a run and its results, process, suggestions for process improvements, process optimizations, fixes, etc. for the next runs.
---

# retrospect

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

create and run a retrospect process:

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

implementations notes (for the process):
- The process should analyze the run, the process that was followed, and provide suggestions for improvements, optimizations, and fixes.
- The process should such have many breakpoints where the user can steer the process, provide feedback, and make decisions about how to proceed with the retrospect.
- The process should be designed to be flexible and adaptable to different types of runs, projects, and goals, and should be able to provide insights and suggestions that are relevant and actionable for the user. (modification to the process, skills, etc.)
- The process should be designed to be iterative, allowing the user to go through multiple rounds of analysis and improvement, and should be able to track the changes and improvements made over time.
- The process should cover:
    - Analysis of the run and its results, including what went well, what didn't go well, and what could be improved.
    - Analysis of the process that was followed, including what steps were taken, what tools were used, and how effective they were.
    - Suggestions for improvements, optimizations, and fixes for both the run and the process.
    - Implementing the improvements, optimizations, and fixes, and tracking the changes made over time.
### Cleanup Suggestion

After retrospect analysis, suggest running `/babysitter:cleanup` to clean up old run data and reclaim disk space.

    - Ending by explicitly prompting the user to contribute back -- even just reporting an issue is valuable, they don't need to implement the fix themselves. After analysis, display a clear call-to-action:

      "You've identified [specific insight/improvement]. This could help other babysitter users too. Run `/babysitter:contrib` to share it upstream -- you can either report it as an issue or submit a PR with the fix."

      Route to the specific contrib workflow based on what the user wants to do:

      **Just reporting (no code changes needed):**
      - Found a bug or weakness in a process -> `/babysitter:contrib bug report: [description of what went wrong]`
      - Found missing or confusing documentation -> `/babysitter:contrib documentation question: [what was unclear]`
      - Have an idea for improvement but don't want to implement it -> `/babysitter:contrib feature request: [description]`

      **Contributing code changes:**
      - Process/skill/agent improvements -> `/babysitter:contrib library contribution: [description]`
      - Bug fixes in SDK or CLI -> `/babysitter:contrib bugfix: [description]`
      - Plugin instruction improvements -> `/babysitter:contrib library contribution: improved [plugin-name] [install|configure|uninstall] instructions`
