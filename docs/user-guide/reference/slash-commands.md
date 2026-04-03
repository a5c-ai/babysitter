# Babysitter Slash Commands Reference

**Version:** 1.0 | **Last Updated:** 2026-03-05

Complete reference for Babysitter slash commands in Claude Code.

---

## Quick Overview

Babysitter provides two tiers of slash commands:

**Core Modes** — Four ways to run orchestration, each with different levels of autonomy:

| Mode | Command | Autonomy | Best For |
|------|---------|----------|----------|
| **Interactive** | `/babysitter:call` | You approve at breakpoints | Learning, critical workflows |
| **YOLO** | `/babysitter:yolo` | Full auto, no breakpoints | Trusted tasks, shipping fast |
| **Forever** | `/babysitter:forever` | Continuous loop with sleep | Monitoring, periodic tasks |
| **Plan** | `/babysitter:plan` | Planning only, no execution | Review before committing |

**Utility Commands** — Setup, diagnostics, and tools:

| Command | Purpose |
|---------|---------|
| `/babysitter:user-install` | Set up your profile and preferences |
| `/babysitter:project-install` | Onboard a project for babysitting |
| `/babysitter:doctor` | Diagnose run health and issues |
| `/babysitter:observe` | Launch real-time monitoring dashboard |
| `/babysitter:assimilate` | Import external methodologies |
| `/babysitter:help` | Documentation and guidance |

---

## Core Modes

These are the primary ways to invoke Babysitter. Same engine, different behaviors.

---

### `/babysitter:call`

**The default mode.** Interactive orchestration with human-in-the-loop approval.

```
/babysitter:call build a REST API with authentication using TDD
```

**What it does:**
1. Interviews you to understand requirements
2. Creates a custom process tailored to your request
3. Asks for confirmation before executing
4. Pauses at breakpoints for your approval
5. Iterates until quality targets are met

**When to use:**
- First time using Babysitter
- Critical workflows where you want oversight
- Learning how processes work
- Any task where you want to steer decisions

**Breakpoint behavior:** Pauses and asks you to approve/reject before continuing.

---

### `/babysitter:yolo`

**Ship while you sleep.** Full autonomous execution without breakpoints.

```
/babysitter:yolo add dark mode to the entire frontend
```

**What it does:**
1. Parses your request directly (no interview)
2. Creates and executes the process
3. Auto-approves all breakpoints
4. Iterates until completion or failure

**When to use:**
- Tasks you trust Babysitter to handle
- Overnight or background work
- When you don't want interruptions
- After you've validated the approach with `/babysitter:plan`

**Breakpoint behavior:** Auto-approves everything. No human interaction required.

**The name says it all.** YOLO mode is for when you trust the process and want results without babysitting the babysitter.

---

### `/babysitter:forever`

**Set it and forget it.** Never-ending orchestration for continuous tasks.

```
/babysitter:forever monitor support tickets and auto-respond to common questions
```

**What it does:**
1. Creates a process with an infinite loop
2. Uses `ctx.sleep()` between iterations
3. Runs continuously until manually stopped
4. Perfect for periodic, ongoing work

**Example use cases:**
- Monitor and process support tickets every 4 hours
- Daily code review of new PRs
- Continuous security scanning
- Periodic dependency updates
- Log analysis and alerting

**How it works internally:**

```javascript
// Forever mode creates processes like this:
while (true) {
  await processTickets();
  await ctx.sleep({ hours: 4 }); // Wake up in 4 hours
}
```

**To stop a forever run:** Close the session or use Ctrl+C.

---

### `/babysitter:plan`

**Look before you leap.** Create and review the process without executing it.

```
/babysitter:plan migrate the database from MySQL to PostgreSQL
```

**What it does:**
1. Interviews you about requirements (same as `/call`)
2. Creates the complete process definition
3. Generates `.mermaid.md` and `.process.md` visualizations
4. **Stops there** — no run is created or executed

**When to use:**
- Complex migrations or refactors
- When you want to review the approach first
- Team discussions about workflow
- Understanding what Babysitter would do

**After planning:**
- Review the generated process files
- Modify if needed
- Run with `/babysitter:call` when ready

---

## Utility Commands

Setup, diagnostics, and tools to support your workflow.

---

### `/babysitter:user-install`

**First-time setup.** Creates your personal profile for better orchestration.

```
/babysitter:user-install
```

**What it does:**
1. Installs dependencies (SDK, jq, etc.)
2. Interviews you about your specialties and preferences
3. Creates `~/.a5c/user-profile.json` with:
   - Your expertise areas
   - Breakpoint tolerance (how much oversight you want)
   - Tool preferences
   - Communication style
4. Configures optimal settings for your workflow

**Run this once** when you first start using Babysitter. Your profile personalizes every future run — fewer questions, better-matched processes.

---

### `/babysitter:project-install`

**Onboard a project.** Set up a codebase for babysitting.

```
/babysitter:project-install
```

**What it does:**
1. Researches your codebase structure
2. Interviews you about project goals and workflows
3. Creates `.a5c/project-profile.json` with:
   - Project architecture
   - Tech stack
   - Testing frameworks
   - CI/CD configuration
4. Installs SDK dependencies in `.a5c/`
5. Optionally configures CI/CD integration

**Run this once per project.** The project profile helps Babysitter make better decisions about testing, deployment, and code style.

---

### `/babysitter:doctor`

**Diagnose issues.** Comprehensive health check for babysitter runs.

```
/babysitter:doctor
/babysitter:doctor run-20260125-143012
```

**What it does:**

Performs 10 diagnostic checks:

1. **Run Discovery** — Finds and validates run metadata
2. **Journal Integrity** — Verifies checksums, sequence, timestamps
3. **State Cache Consistency** — Checks state matches journal
4. **Effect Status** — Identifies stuck or errored tasks
5. **Lock Status** — Detects stale or orphaned locks
6. **Session State** — Finds active sessions, detects runaway loops
7. **Log Analysis** — Scans for errors and warnings
8. **Disk Usage** — Reports size, finds oversized files
9. **Process Validation** — Verifies entrypoint and SDK dependency
10. **Hook Execution Health** — Confirms hooks are running

**Output:** Detailed report with PASS/WARN/FAIL for each check, plus specific fix commands.

**When to use:**
- Run seems stuck or broken
- After unexpected errors
- Before resuming an old run
- When hooks aren't firing

---

### `/babysitter:observe`

**Real-time visibility.** Launch a dashboard to watch what Babysitter is doing.

```
/babysitter:observe
```

**What it does:**

Opens a web-based dashboard showing:
- Active runs and their status
- Task progress in real-time
- Journal events as they happen
- Orchestration state visualization

**Built by the community:** This tool was created by [@yoavmayer](https://github.com/yoavmayer) as an observability solution for watching babysitter and agent activity. It launches the `@yoavmayer/babysitter-observer-dashboard` package.

**Technical:** Runs a local server and opens your browser. Blocking process — runs until stopped.

---

### `/babysitter:assimilate`

**Resistance is futile.** Import external methodologies into Babysitter.

```
/babysitter:assimilate harness codex
/babysitter:assimilate https://github.com/example/cool-methodology
```

**What it does:**

Converts external AI coding tools and methodologies into Babysitter process definitions:
- **Harness integration** — Generate SDK bindings for other AI agents (Codex, Gemini CLI, etc.)
- **Methodology import** — Transform procedural docs into executable processes with skills and agents

**This is for advanced users** who want to extend Babysitter and contribute back to the community.

**Example workflow:**

```
/babysitter:assimilate harness codex
```

This generates the integration code for OpenAI Codex. Once working, contribute it back so everyone benefits.

**Open opportunities** — Who's claiming these?
- OpenAI Codex
- Google Gemini
- GitHub Copilot
- Cursor IDE
- Windsurf IDE
- OpenCode

**Join the Hall of Fame:** [a5c.ai/hall-of-fame](https://www.a5c.ai/hall-of-fame)

Your credit stays there forever. Who's going to be first?

---

### `/babysitter:help`

**Documentation hub.** Get help on any command, process, or concept.

```
/babysitter:help
/babysitter:help command doctor
/babysitter:help process tdd-quality-convergence
/babysitter:help methodology bmad
```

**What it does:**
- No args: Shows all available commands with descriptions
- With args: Shows detailed documentation for the specific topic

**Argument patterns:**
- `command <name>` — Help on a slash command
- `process <name>` — Help on a process definition
- `skill <name>` — Help on a skill
- `agent <name>` — Help on an agent
- `methodology <name>` — Help on a methodology

---

## Mode Selection Guide

Not sure which mode to use? Here's a decision tree:

```
Start here
    │
    ├─ First time or unfamiliar task?
    │   └─ Use /babysitter:call (interactive mode)
    │
    ├─ Want to review before executing?
    │   └─ Use /babysitter:plan
    │
    ├─ Trusted task, want hands-off?
    │   └─ Use /babysitter:yolo
    │
    ├─ Continuous/periodic task?
    │   └─ Use /babysitter:forever
    │
    └─ Something's broken?
        └─ Use /babysitter:doctor
```

---

## Common Patterns

### Quality-targeted development

```
/babysitter:call build a user auth system with TDD targeting 90% quality
```

### Overnight autonomous work

```
/babysitter:yolo refactor the entire codebase to use TypeScript strict mode
```

### Daily automation

```
/babysitter:forever check for security vulnerabilities in dependencies every 24 hours
```

### Plan-then-execute

```
/babysitter:plan migrate from Express to Fastify
# Review the generated process...
/babysitter:call proceed with the migration
```

---

## See Also

- [CLI Reference](./cli-reference.md) — SDK command-line interface
- [Quickstart](../getting-started/quickstart.md) — Your first run
- [Process Library](../features/process-library.md) — 2,000+ pre-built processes
- [Troubleshooting](./troubleshooting.md) — Common issues and solutions
