---
description: help and documentation for babysitter command usage, processes, skills, agents, and methodologies. use this command to understand how to use babysitter effectively.
argument-hint: Specific command, process, skill, agent, or methodology you want help with (e.g. "help command doctor" or "help process retrospect").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

## if no arguments provided:

show this message:

```
Welcome to the Babysitter Help Center! Here you can find documentation and guidance on how to use Babysitter effectively.

Documentation: Explore our comprehensive documentation to understand Babysitter's features, processes, skills, agents, and methodologies. Read the Docs: https://github.com/a5c-ai/babysitter

Or ask specific questions about commands, processes, skills, agents, methodologies, domains, specialities to get targeted help.

Just type /babysitter:help followed by your question or the topic you want to learn more about.


PRIMARY COMMANDS
================

/babysitter:call [input]
  Start a babysitter-orchestrated run. Babysitter analyzes your request, interviews you
  to gather requirements, selects or creates the best process definition (from 50+
  domain-specific processes covering science, business, engineering, and more), then
  executes it step by step with breakpoints where you can steer direction.

  How it works: The babysitter skill reads your input, explores the process library to
  find matching processes, interviews you to refine scope, creates an SDK run with
  run:create, and orchestrates iterations with run:iterate -- dispatching tasks,
  handling breakpoints, and posting results until the run completes or you pause it.

  Example: /babysitter:call migrate our Express.js REST API to Fastify, keeping all
  existing routes and middleware behavior identical, with integration tests proving
  parity


/babysitter:resume [run id or name]
  Resume a paused or interrupted babysitter run. If you don't specify a run, babysitter
  discovers all runs under .a5c/runs/, shows their status (created, waiting, completed,
  failed), and suggests which incomplete run to pick up based on its process, pending
  effects, and last activity.

  How it works: Reads run metadata and journal, rebuilds state cache if stale, identifies
  pending effects (breakpoints awaiting approval, tasks needing results), and continues
  orchestration from exactly where it left off -- no work is repeated thanks to the
  replay engine.

  Example: /babysitter:resume
  (discovers runs and offers: "Run abc123 is waiting on a breakpoint in the 'review
  test results' phase of your API migration -- resume this one?")


/babysitter:yolo [input]
  Start a babysitter run in fully autonomous mode. Identical to /call but all breakpoints
  are auto-approved and no user interaction is requested. The babysitter makes every
  decision on its own until the run completes or hits a critical failure it can't recover
  from. Best for well-understood tasks where you trust the process.

  How it works: Same orchestration as /call, but the process context is configured to
  skip breakpoint effects -- instead of pausing for human approval, each breakpoint
  resolves immediately with an auto-approve result.

  Example: /babysitter:yolo add comprehensive unit tests for all functions in
  src/utils/ using vitest with >90% branch coverage


/babysitter:plan [input]
  Generate a detailed execution plan without running anything. Babysitter goes through
  the full interview and process selection flow, designs the process definition with
  all tasks, breakpoints, and dependencies, but stops before creating the actual SDK run.
  You get a complete plan you can review, modify, or execute later with /call.

  How it works: Runs the babysitter skill's planning phase only -- analyzes input,
  matches to domain processes, interviews for requirements, then outputs the process
  definition file and a human-readable execution plan showing each phase, task, and
  decision point.

  Example: /babysitter:plan redesign our database schema to support multi-tenancy,
  migrate existing data, and update all queries -- I want to review the plan before
  we touch anything


/babysitter:forever [input]
  Start a babysitter run that loops indefinitely with sleep intervals. Designed for
  ongoing operational tasks: monitoring, periodic maintenance, continuous improvement,
  or recurring workflows. The process uses an infinite loop with ctx.sleepUntil() to
  pause between iterations.

  How it works: Creates a process definition with a while(true) loop. Each cycle performs
  the task (e.g., check metrics, process tickets, run audits), then calls ctx.sleepUntil()
  to pause for a configured interval. The run stays in "waiting" state during sleep and
  resumes automatically when the sleep expires on the next orchestration iteration.

  Example: /babysitter:forever every 4 hours, check our GitHub issues labeled "bug",
  attempt to reproduce and fix any that look straightforward, and submit PRs for the fixes


SECONDARY COMMANDS
==================

/babysitter:doctor [issue]
  Run a comprehensive 10-point health check on a babysitter run. Inspects journal
  integrity (checksum verification, sequence gaps, timestamp ordering), state cache
  consistency, stuck/errored effects, stale locks, session state, log files, disk usage,
  process validation, and hook execution health. Produces a structured diagnostic report
  with PASS/WARN/FAIL status per check and specific fix commands.

  If no run ID is provided, automatically targets the most recent run. Can also diagnose
  environment-wide issues like missing CLI, unregistered hooks, or plugin problems.

  Example: /babysitter:doctor
  (checks the latest run: "CRITICAL -- Check 5 Lock Status: FAIL -- stale lock detected,
  process 12847 is no longer running. Fix: rm .a5c/runs/abc123/run.lock")


/babysitter:assimilate [target]
  Convert an external methodology, AI coding harness, or specification into native
  babysitter process definitions. Takes a GitHub repo URL, harness name, or spec file
  and produces a complete process package with skills/ and agents/ directories.

  Two workflows available:
  - Methodology assimilation: clones the repo, learns its procedures and commands,
    converts manual flows into babysitter processes with refactored skills and agents
  - Harness integration: wires babysitter's SDK into a specific AI coding tool
    (codex, opencode, gemini-cli, antigravity, etc.) so it can orchestrate runs

  Example: /babysitter:assimilate https://github.com/some-org/their-deployment-playbook
  (clones the repo, analyzes their deployment procedures, and generates babysitter
  processes that replicate the same workflow with proper task definitions and breakpoints)


/babysitter:user-install
  First-time onboarding for new babysitter users. Installs dependencies, runs an
  interactive interview about your development specialties, preferred tools, coding
  style, and how much autonomy you want babysitter to have. Builds a user profile
  stored at ~/.a5c/user-profile.json that personalizes future runs.

  Uses the cradle/user-install process which covers: dependency verification, user
  interview (expertise areas, preferred languages, IDE, terminal setup), profile
  generation, tool configuration, and optional global plugin installation.

  Example: /babysitter:user-install
  (walks you through: "What's your primary programming language? What frameworks do
  you use most? Do you prefer babysitter to auto-approve routine tasks or always ask?")


/babysitter:project-install
  Onboard a new or existing project for babysitter orchestration. Researches the
  codebase (reads package.json, scans directory structure, identifies frameworks and
  patterns), interviews you about project goals and workflows, generates a project
  profile at .a5c/project-profile.json, and optionally sets up CI/CD integration.

  Uses the cradle/project-install process which covers: codebase analysis, project
  interview, profile creation, recommended plugin installation, hook configuration,
  and optional CI pipeline setup.

  Example: /babysitter:project-install
  (scans your repo: "I see this is a Next.js 16 app with Tailwind, using vitest for
  tests and PostgreSQL. What are your main development goals for this project?")


/babysitter:retrospect [run id or name]
  Analyze a completed run to extract lessons and improve future runs. Reviews what
  happened (journal events, task results, timing, errors), evaluates the process that
  was followed, and suggests concrete improvements to process definitions, skills,
  and agents. Interactive -- multiple breakpoints let you steer the analysis and
  decide which improvements to implement.

  Covers: run result analysis, process effectiveness review, improvement suggestions,
  implementation of changes, and routing to /contrib if improvements belong in the
  shared process library.

  Example: /babysitter:retrospect
  (analyzes the last run: "The API migration run completed but the 'verify parity'
  phase took 8 iterations because test assertions were too brittle. Suggestion: add
  a fuzzy comparison step before strict assertion. Implement this fix?")


/babysitter:plugins [action]
  Manage babysitter plugins: list installed plugins, browse marketplaces, install,
  update, configure, uninstall, or create new plugins. Plugins are version-managed
  instruction packages (not executable code) that guide the agent through install,
  configure, and uninstall steps via markdown files.

  Without arguments: shows installed plugins (name, version, marketplace, dates) and
  available marketplaces. With arguments: routes to the specific action.

  Key actions:
  - install <name> --global|--project: fetch install.md from marketplace and execute
  - configure <name> --global|--project: fetch configure.md and walk through options
  - update <name> --global|--project: resolve migration chain via BFS and apply steps
  - uninstall <name> --global|--project: fetch uninstall.md and execute removal
  - create: scaffold a new plugin package with the meta/plugin-creation process

  Example: /babysitter:plugins install sound-hooks --project
  (fetches sound-hooks from marketplace, reads install.md, walks you through player
  detection, sound selection, hook configuration, and registers in plugin-registry.json)


/babysitter:contrib [feedback]
  Submit feedback or contribute to the babysitter project. Routes to the appropriate
  workflow based on what you want to do:

  Issue-based (opens GitHub issue in a5c-ai/babysitter):
  - Bug report: describe a bug in the SDK, CLI, or process library
  - Feature request: propose a new feature or enhancement
  - Documentation question: flag undocumented behavior or missing docs

  PR-based (forks repo, creates branch, submits PR):
  - Bugfix: you already have a fix ready
  - Feature implementation: you've built a new feature
  - Library contribution: new or improved process/skill/agent for the library
  - Harness integration: CI/CD or IDE integration

  Without arguments: shows all contribution types and helps you pick the right one.
  Breakpoints are placed before all GitHub actions (fork, star, PR, issue) so you
  can review before anything is submitted.

  Example: /babysitter:contrib bug report: plugin:update-registry fails when the
  marketplace hasn't been cloned yet, even though the registry update doesn't need
  marketplace access


/babysitter:observe
  Launch the babysitter observer dashboard -- a real-time web UI that monitors active
  and past runs. Displays task progress, journal events, orchestration state, and
  effect status in your browser. Useful when running /yolo or /forever to watch
  progress without interrupting the run.

  How it works: Runs npx @yoavmayer/babysitter-observer-dashboard@latest which watches
  the .a5c/runs/ directory (or a parent directory containing multiple projects) and
  serves a live dashboard. The process is blocking -- it runs until you stop it.

  Example: /babysitter:observe
  (opens browser showing all runs with live-updating task
  status, journal event stream, and effect resolution timeline)
```

## if arguments provided:

if the argument is "command [command name]", "process [process name]", "skill [skill name]", "agent [agent name]", or "methodology [methodology name]", then show the detailed documentation for that specific command, process, skill, agent, or methodology after reading the relevant files.
