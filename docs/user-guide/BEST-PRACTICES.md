# Babysitter Best Practices

Babysitter is Claude Code with superpowers. Everything you already know about Claude Code works here. This guide covers the extra capabilities you get and when to use them.

---

## Table of Contents

- [Key Ideas](#key-ideas)
- [The Basics](#the-basics)
- [Profile Configuration](#profile-configuration)
- [Process Selection](#process-selection)
  - [Skills vs Processes](#skills-vs-processes)
- [Quality Targets](#quality-targets)
- [Iterative Work](#iterative-work)
- [Human in the Loop](#human-in-the-loop)
  - [Reviewing Plans](#reviewing-plans)
  - [Full Control Mode](#full-control-mode)
  - [When to Use Breakpoints](#when-to-use-breakpoints)
- [Working with Existing Projects](#working-with-existing-projects)
- [Parallel vs Serial Work](#parallel-vs-serial-work)
- [Sessions](#sessions)
  - [Resuming](#resuming)
  - [Context Issues](#context-issues)
  - [Run IDs](#run-ids)
  - [When Things Go Wrong](#when-things-go-wrong)
- [Security](#security)
- [Token Usage](#token-usage)
- [Debugging](#debugging)
- [The .a5c Directory](#the-a5c-directory)
- [Common Mistakes](#common-mistakes)
- [Quick Reference](#quick-reference)
- [Troubleshooting Quick Reference](#troubleshooting-quick-reference)
- [Links](#links)

---

## Key Ideas

> **Evidence over assertions** - If you can't measure it, it's not done.

> **Explicit over implicit** - Specify what you want. Name your process. Set quality targets. Request breakpoints. The clearer you are, the better the results.

---

## The Basics

You talk to Babysitter the same way you talk to Claude Code. Just describe what you want done.

The difference is what happens behind the scenes: Babysitter adds structured processes, quality gates, and iterative improvement loops. Your work gets done properly - not just 80%.

**Model**: Use Opus 4.6 or later for best results. Babysitter automatically uses Haiku for simple summarization tasks.

**First steps**: Start with simple tasks to learn the workflow. Watch the `.a5c/runs` directory to understand how runs are tracked. Practice resumption early - you'll need it when you hit rate limits.

**Beyond code**: Babysitter works for any workflow that benefits from structured phases, quality checkpoints, and iterative improvement - research, documentation, data processing, and more.

---

## Profile Configuration

Babysitter uses profiles to personalize your experience:

### User Profile

Run `/babysitter:user-install` once to configure:
- **Breakpoint tolerance**: How many approval gates you want
- **Skip topics**: Areas where you don't need confirmation (e.g., "don't ask about framework choices")
- **Communication style**: Verbosity, tone, preferred formats

Your profile persists across sessions in `~/.a5c/user-profile.json`.

### Project Profile

Run `/babysitter:project-install` per project to configure:
- Tech stack and testing frameworks
- CI/CD integration settings
- Project-specific workflows

Stored in `.a5c/project-profile.json`.

### Tips

> **Community tip (Klein)**: If you ever said 'continue' at a breakpoint, that becomes the default for that repo. Reset between tasks if needed.

> **Community tip (Yedidia)**: If Claude tries to skip Babysitter, add explicit instructions in CLAUDE.md.

---

## Process Selection

By default, Babysitter picks a process that fits your task. It pulls from its library, adapts what it finds, and sometimes combines several processes together.

If you want more control, you have options:

1. **Name a process style in your prompt** - Something like "use a top-down approach" or "follow a TDD workflow"

2. **Browse the process library** - See what's available at the [Process Library](https://github.com/a5c-ai/babysitter/blob/staging/docs/user-guide/features/process-library.md) and reference one by name

3. **Create your own** - Use the meta process to define a custom workflow, or simply complete a run and then tell Babysitter: *"turn what we just did into a reusable process"*

Most of the time, letting Babysitter choose works great.

**Discovery order**: Babysitter searches for processes first in your repository, then in its internal library, then online. Place custom processes in your repo for automatic discovery.

### Skills vs Processes

**Skills** are instruction sets in markdown. Good for flexibility.

**Processes** are code. Every step executes exactly as defined. Use these for workflows where you can't afford skipped steps.

---

## Quality Targets

Babysitter uses quality scores internally. You can set expectations by including a target in your prompt:

| Score | When to use |
|-------|-------------|
| **0.7** | Works well for most tasks |
| **0.9** | When you need thorough testing and refinement |
| **1.0** | Avoid - theoretical maximum that causes infinite loops |

Example: *"converge to quality of 0.7"*

For more thorough assessment, you can ask for scoring across dimensions like accuracy, completeness, clarity, actionability, organization, and relevance.

**Tips**:
- If you don't want to think about which dimensions to use, just tell Babysitter: *"iterate until you reach a score of 0.9 in at least 7 different dimensions"* - it will figure out the right dimensions for your task.
- If you want to pick the dimensions yourself, ask Babysitter to *"let me choose the dimensions as part of the initial interview"* - you'll be able to select or define what matters most for your specific task.

---

## Iterative Work

If you want Babysitter to keep improving until something is really done, say so:

> *"iterate until convergence"*
>
> *"keep improving until tests pass"*
>
> *"loop until quality score reaches 0.9"*

This engages the convergence loop instead of stopping after the first pass.

---

## Human in the Loop

### Reviewing Plans

Want to see the plan before implementation starts?

Just ask:
> *"Add a breakpoint after you create the plan. I want to review it as an md file."*

You'll get a chance to check the approach and make adjustments before any code gets written.

### Full Control Mode

For maximum oversight, tell Babysitter:
> *"Don't make any decisions without asking for my approval as a breakpoint."*

This puts you in control of every significant choice. Useful when you're learning how Babysitter works, or when the stakes are high.

### When to Use Breakpoints

- Before production deployments
- After planning (to review the approach)
- Before irreversible operations
- At critical decision points
- When you want to learn from the process

For routine work, breakpoints slow things down. Let the quality gates handle it.

---

## Working with Existing Projects

For established codebases, a two-phase approach helps:

**Phase 1 - Preparation** (gives the agent context it needs):
- Reach 90% test coverage in areas you'll modify
- Add full e2e tests for the workflows involved
- Set up UI tests if relevant
- Fill documentation gaps

**Phase 2 - Implementation** with quality gates.

The wider the feedback loop, the better. Structure your quality gates from narrow to wide: linting → building → unit tests → integration tests → e2e tests → real usage validation. Each layer catches different issues.

**Visual work**: For UI validation, mention "pixel perfect" in your prompt to engage visual verification loops (make sure you have playwright plugin installed).

---

## Parallel vs Serial Work

Babysitter handles parallelization based on what's defined in the process. Some processes run tasks in parallel for speed, others run them serially for safety.

If you need specific behavior, mention it in your prompt or use a process that matches your needs.

For large projects, organize work into milestone files (milestone1.md, milestone2.md), then call Babysitter separately for each milestone in order.

---

## Sessions

### Resuming

If a session stops (rate limits, crashes), pick up where you left off:

> *"resume the last uncompleted run"*

The journal preserves your state.

### Context Issues

If Claude gets into a weird state, open a fresh session and resume the run. Your progress is in the journal, not the conversation.

### When Things Go Wrong

If a run gets into a bad state, you can often recover by analyzing the journal events and rolling back to the last known good state. The journal uses event sourcing - all state changes are recorded as immutable events.

**Design for resumability**: Make tasks idempotent (safe to re-execute). Insert breakpoints at natural decision points. This makes recovery straightforward.

---

## Security

| Topic | Guidance |
|-------|----------|
| **Credentials** | Put them in .env files and reference them. Never paste directly in chat. |
| **YOLO mode** | (dangerously-skip-permissions) Use carefully. Agents installing npm packages is a real attack surface. If you use it, work in an isolated environment where you can roll back. |
| **Production access** | Use service accounts through CI/CD, not personal credentials. |
| **Pre-commit hooks** | Add secret scanning to every project. Catches credentials before they reach the model. |

---

## Token Usage

MCP burns tokens fast and adds security surface area. For GitHub work, the gh CLI is more efficient and works better out of the box. CLI commands and Python scripts often work just as well without the added complexity.

Babysitter processes run longer than typical Claude Code sessions, but the planning investment (up to 10x more than Claude Code's plan mode) means fewer iterations and faster convergence overall. Trust the process.

**Cost tip**: All three major cloud providers (AWS, GCP, Azure) let you use credits for Claude inference - often more reliable than direct API access.

---

## Debugging

| When | How |
|------|-----|
| **Real-time** | Press `Ctrl+O` to see what's currently executing |
| **After the fact** | Everything logs to `.a5c/runs/<runId>/journal/` - that's your source of truth |
| **In CI** | Upload `.a5c` as an artifact - the journal tells the whole story |
| **Machine-readable** | Use the `--json` flag for programmatic output instead of parsing stdout |

---

## The .a5c Directory

Keep .a5c/processes/ in git - that's the important part. Your custom processes are institutional knowledge. They encode how your team does things, and they give Babysitter context about your preferred workflows. Losing them means rebuilding that knowledge from scratch.

Add node_modules and optionally .a5c/runs/ to .gitignore if they're noisy.

**For teams**: Committing processes to git means shared context across the team. New team members get the same workflows and quality standards automatically.

---

## Common Mistakes

| Area | Pitfalls |
|------|----------|
| **Quality** | Aiming for 1.0 (infinite loops), not using multi-dimensional scoring when needed |
| **Prompts** | Being vague about what "done" means, not requesting iteration when you need it |
| **Security** | Pasting credentials directly, using YOLO mode on sensitive machines |
| **Resumption** | Manually editing run.json or journals - let the system manage these files |
| **Process design** | Breaking tasks too granular (adds overhead), not planning for failure recovery |

---

## Quick Reference

| Want to... | Do this |
|------------|---------|
| Use a specific process | Name it in your prompt or pick from the process library |
| Ensure thorough work | "iterate until convergence" or set a quality target |
| Review the plan first | "add a breakpoint after the plan, save as plan.md" |
| Full control | "don't make decisions without asking for my approval" |
| Multi-dimensional quality | "iterate until 0.9 in at least 7 dimensions" |
| Resume a stopped run | "resume the last uncompleted run" |
| Turn a run into a process | "turn what we just did into a reusable process" |
| Debug | Check .a5c/runs/<runId>/journal/ |

---

## Troubleshooting Quick Reference

| Symptom | Solution |
|---------|----------|
| Run seems stuck | `/babysitter:doctor` to diagnose |
| Breakpoints being skipped | Update to latest version; check if you previously said "continue" |
| Want to see what's happening | `/babysitter:observe` for real-time dashboard |
| Need to continue interrupted run | `/babysitter:call resume` |
| Claude suggests skipping Babysitter | Add explicit instructions in CLAUDE.md |
| Plugin update issues | `claude plugin marketplace update a5c.ai && claude plugin update babysitter@a5c.ai` |

---

## Links

- [Process Library](https://github.com/a5c-ai/babysitter/tree/main/packages/sdk/src/processes)
- [GitHub](https://github.com/a5c-ai/babysitter)
- [a5c.ai](https://a5c.ai)
