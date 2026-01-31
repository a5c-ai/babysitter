# Getting Started with Babysitter

**Welcome to Babysitter!** This guide will help you go from zero to running your first AI-orchestrated development workflow in just a few minutes.

---

## 30-Second Overview

**Babysitter = Claude Code + autopilot + quality control**

Instead of:
```
You: "Build me a login page"
Claude: *builds something*
You: "Make it better"
Claude: *tweaks it*
You: "Run the tests"
Claude: *tests fail*
You: "Fix the tests"
... (repeat for hours)
```

You just say:
```
/babysitter:call build a login page with 90% quality target
```

Babysitter handles the iteration, testing, and quality checks automatically. Come back later, it's still working (or waiting for your approval).

---

## Choose Your Path

| If you are... | Start here |
|--------------|------------|
| **Impatient** (just want to try it) | [Quickstart](./quickstart.md) - 10 minutes to first run |
| **Thorough** (want to understand first) | Keep reading this page, then [Installation](./installation.md) |
| **Already installed** | [First Run Deep Dive](./first-run.md) to understand what happened |
| **Coming back** | Jump to the [Tutorials](../tutorials/) for deeper projects |

---

## What is Babysitter?

Babysitter is an **orchestration framework** for Claude Code that transforms how you work with AI-assisted development. Instead of manually iterating with Claude until your code is "good enough," Babysitter automates the entire process with:

- **Automatic quality convergence** - Set a quality target (like 85%), and Babysitter iterates until it's achieved
- **Session persistence** - Close your laptop, come back tomorrow, and pick up exactly where you left off
- **Human-in-the-loop approval** - Add approval gates (breakpoints) for critical decisions before they execute
- **Complete audit trails** - Every decision, iteration, and change is recorded in an event journal

Think of Babysitter as a project manager for your AI coding sessions - it keeps track of progress, ensures quality standards are met, and never loses context.

### Why You Will Love Babysitter

| Without Babysitter | With Babysitter |
|-------------------|-----------------|
| "Claude, can you improve that?" (repeat 10x) | Set quality target once, iterate automatically |
| Lose all context when session ends | Resume from any point, even days later |
| Hope the AI made good decisions | Review and approve at key decision points |
| No record of what happened | Complete journal of every action |
| Run tasks one at a time | Parallel execution for faster results |

---

## Key Benefits

### 1. Quality Convergence
Stop manually asking Claude to "make it better." Define your quality target (test coverage, code standards, etc.) and Babysitter iterates until it's achieved.

```
# Example: Iterate until 85% quality score
claude "/babysitter:call implement user auth with TDD, 85% quality target"
```

### 2. Never Lose Progress
Every action is recorded in an event-sourced journal. Session interrupted? No problem.

```
# Resume exactly where you left off
claude "Resume the babysitter run for the auth feature"
```

### 3. Human-in-the-Loop Control
Add approval gates for critical decisions. Review context, approve or reject, and only then does execution continue.

```
# Babysitter will pause for approval before deploying
claude "/babysitter:call deploy to production with breakpoint approval"
```

### 4. Structured Workflows
Choose from built-in methodologies (TDD, Spec-Kit, GSD) or create your own. Consistent, repeatable processes across your team.

---

## Quick Navigation

| I want to... | Go to... |
|-------------|----------|
| Install Babysitter | [Installation Guide](./installation.md) |
| Run my first workflow (5 min) | [Quickstart](./quickstart.md) |
| Understand what happened | [First Run Deep Dive](./first-run.md) |
| See all commands | [CLI Reference](../reference/cli-reference.md) |
| Learn about Quality Convergence | [Quality Convergence Guide](../features/quality-convergence.md) |

---

## Prerequisites

Before you begin, ensure you have the following:

### Required Software

| Software | Version | How to Check | Installation Guide |
|----------|---------|--------------|-------------------|
| **Node.js** | 20.0.0+ (22.x recommended) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 8.0.0+ | `npm --version` | Comes with Node.js |
| **Claude Code** | Latest | `claude --version` | [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code) |

### Recommended (for best experience)

| Software | Purpose | Installation |
|----------|---------|--------------|
| **nvm** | Manage Node.js versions easily | [nvm-sh/nvm](https://github.com/nvm-sh/nvm) |
| **Git** | Version control for your projects | [git-scm.com](https://git-scm.com/) |
| **jq** | Parse JSON output from CLI | `brew install jq` (macOS) |

### Knowledge Prerequisites

| Level | What You Should Know |
|-------|---------------------|
| **Required** | Basic command line usage (cd, ls, npm) |
| **Required** | How to use Claude Code (basic prompting) |
| **Helpful** | JavaScript/TypeScript basics (for custom processes) |
| **Optional** | Test-driven development concepts |

### Verify Your Environment

Run these commands to confirm you're ready:

```bash
# Check Node.js (need 20.0.0+)
node --version
# Expected: v20.x.x or v22.x.x

# Check npm
npm --version
# Expected: 8.x.x or higher

# Check Claude Code
claude --version
# Expected: Claude Code version info
```

If any command fails, install the missing software before continuing.

---

## Installation Overview

Getting Babysitter running involves three steps:

1. **Install the Babysitter plugin** (via Claude Code's plugin system)
2. **Install the CLI packages** (npm global install for orchestration commands)
3. **Start the breakpoints service** (optional, for human approval features)

**Estimated time:** 5-10 minutes

Ready? Head to the [Installation Guide](./installation.md) for step-by-step instructions.

---

## Your Learning Path

### Day 1: Get Started (Today!)

1. [x] Read this introduction (you are here)
2. [ ] [Install Babysitter](./installation.md) (5 min)
3. [ ] [Complete the Quickstart](./quickstart.md) (10 min)
4. [ ] [Understand your first run](./first-run.md) (10 min)

### Week 1: Build Confidence

5. [ ] Try different quality targets (80%, 90%, 95%)
6. [ ] Experience session resumption (close and resume a run)
7. [ ] Use breakpoints for approval workflows
8. [ ] Explore the [TDD methodology](../features/quality-convergence.md)

### Week 2+: Level Up

9. [ ] Compare methodologies (TDD, GSD, Spec-Kit)
10. [ ] Customize quality targets and iteration limits
11. [ ] Learn about parallel execution
12. [ ] Create your first custom process (advanced)

---

## How Babysitter Works (The Big Picture)

```
You: "Build a todo API with TDD"
         |
         v
+------------------+
|  Babysitter      |
|  Orchestration   |
|                  |
|  1. Research     |---> Analyze codebase
|  2. Plan         |---> Create specifications
|  3. Implement    |---> TDD iterations
|  4. Quality      |---> Score and improve
|  5. Approve      |---> Human checkpoint
|  6. Complete     |---> Deliver result
+------------------+
         |
         v
Everything logged to .a5c/runs/<runId>/journal/
```

### The Magic: Event-Sourced Persistence

Every action Babysitter takes is recorded as an event in a journal:

```jsonl
{"type":"RUN_STARTED","runId":"01KFFTSF8TK8C9GT3YM9QYQ6WG","timestamp":"2026-01-25T10:30:00Z"}
{"type":"TASK_STARTED","taskId":"research-001","timestamp":"2026-01-25T10:30:01Z"}
{"type":"TASK_COMPLETED","taskId":"research-001","result":{...},"timestamp":"2026-01-25T10:30:45Z"}
```

This means:
- **Crash recovery:** Replay the journal to restore exact state
- **Audit trail:** Complete history of every decision
- **Debugging:** Trace exactly what happened and when

---

## What You Will Build

In this getting started guide, you will:

### Quickstart Tutorial (10 minutes)
Build a simple calculator module with TDD:
- Write tests first
- Implement code to pass tests
- Achieve 80% quality score
- See automatic iteration in action

### Expected Outcome
```
calculator/
  calculator.js      # Implementation
  calculator.test.js # Test suite
  README.md         # Generated documentation

Quality Score: 85/100
Tests: 12 passing
Coverage: 92%
```

---

## Getting Help

### Stuck? Try These Resources

| Resource | Best For |
|----------|----------|
| [Troubleshooting Guide](./installation.md#troubleshooting) | Installation issues |
| [FAQ](../reference/faq.md) | Common questions |
| [GitHub Issues](https://github.com/a5c-ai/babysitter/issues) | Bug reports |
| [GitHub Discussions](https://github.com/a5c-ai/babysitter/discussions) | Questions and ideas |

### Common First-Time Issues

| Problem | Solution |
|---------|----------|
| "command not found: babysitter" | Run `npm install -g @a5c-ai/babysitter-sdk` |
| Plugin not appearing | Restart Claude Code after installation |
| Breakpoint not resolving | Start the breakpoints service |

---

## Ready to Begin?

Your journey starts with installation. Let's get Babysitter running on your machine.

**Next Step:** [Installation Guide](./installation.md)

---

## Quick Reference Card

Keep these commands handy:

```bash
# Start a new run
claude "/babysitter:call <your request>"

# Resume an existing run
claude "/babysitter:call resume the babysitter run"

# Start breakpoints service
npx -y @a5c-ai/babysitter-breakpoints@latest start

# Check available skills
/skills

# View run history
ls .a5c/runs/
```

---

<div align="center">

**Ready to transform your AI-assisted development?**

[Start Installation](./installation.md)

</div>
