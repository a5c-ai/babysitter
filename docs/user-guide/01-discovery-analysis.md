# Babysitter User Documentation - Discovery Analysis

**Version:** 1.0
**Date:** 2026-01-25
**Author:** Technical Documentation Analyst
**Status:** Discovery Phase Complete

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience Segments](#2-target-audience-segments)
3. [Prerequisites](#3-prerequisites)
4. [Installation Steps](#4-installation-steps)
5. [Quick Win Scenarios](#5-quick-win-scenarios)
6. [User Journeys](#6-user-journeys)
7. [Key Terminology and Concepts](#7-key-terminology-and-concepts)
8. [Common Issues and Pain Points](#8-common-issues-and-pain-points)
9. [Documentation Recommendations](#9-documentation-recommendations)

---

## 1. Product Overview

### 1.1 What is Babysitter?

Babysitter is an **event-sourced orchestration framework** for Claude Code that enables deterministic, resumable, and human-in-the-loop workflow management. It transforms how developers interact with AI-assisted coding by providing:

- **Structured multi-step workflows** with built-in quality gates
- **Human approval checkpoints** (breakpoints) for critical decisions
- **Iterative quality convergence** until targets are met
- **Complete audit trails** via append-only event journals
- **Session persistence and resumability** across interruptions

### 1.2 Core Value Proposition

| Traditional AI Coding | With Babysitter |
|----------------------|-----------------|
| Run once, hope it works | Iterate until quality target met |
| Manual approval via chat | Structured breakpoints with context |
| State lost on session end | Event-sourced, fully resumable |
| Single task execution | Parallel execution with dependencies |
| No audit trail | Complete journal of all events |
| Ad-hoc workflows | Process-driven, customizable methodologies |

### 1.3 Key Components

1. **Babysitter SDK** (`@a5c-ai/babysitter-sdk`) - Core orchestration runtime and CLI
2. **Babysitter Plugin** (`babysitter@a5c.ai`) - Claude Code integration
3. **Breakpoints Service** (`@a5c-ai/babysitter-breakpoints`) - Human approval UI and API
4. **Process Library** - Built-in methodologies (TDD, Spec-Kit, GSD, etc.)

### 1.4 Architecture Summary

```
User Request --> Claude Code --> Babysitter Skill --> SDK CLI
                                      |
                     +----------------+----------------+
                     |                |                |
              Process Engine    Journal System    Breakpoints
                     |                |                |
              Task Execution    Event Log        Human Approval
```

---

## 2. Target Audience Segments

### 2.1 Primary Audience

#### Segment A: Claude Code Power Users
- **Profile:** Developers already using Claude Code for complex tasks
- **Pain Point:** Losing context, manual iteration, no quality assurance
- **Key Need:** Structured workflows that persist across sessions
- **Technical Level:** Intermediate to Advanced
- **Expected Interaction:** Daily use for feature development

#### Segment B: Team Leads / Tech Leads
- **Profile:** Technical leaders managing AI-assisted development
- **Pain Point:** Lack of audit trails, no approval gates for critical changes
- **Key Need:** Human-in-the-loop controls, compliance, traceability
- **Technical Level:** Advanced
- **Expected Interaction:** Setting up processes, reviewing breakpoints

#### Segment C: DevOps / Automation Engineers
- **Profile:** Engineers building CI/CD and automation pipelines
- **Pain Point:** Non-deterministic AI behavior, hard to integrate
- **Key Need:** Deterministic execution, CLI interface, scriptability
- **Technical Level:** Advanced
- **Expected Interaction:** CI/CD integration, custom hooks

### 2.2 Secondary Audience

#### Segment D: Developers New to Claude Code
- **Profile:** Developers exploring AI-assisted coding
- **Pain Point:** Overwhelming complexity, don't know where to start
- **Key Need:** Simple onboarding, quick wins, clear documentation
- **Technical Level:** Beginner to Intermediate
- **Expected Interaction:** Learning, experimentation

#### Segment E: Enterprise Teams
- **Profile:** Organizations with compliance requirements
- **Pain Point:** Auditability, security, governance
- **Key Need:** Complete audit trails, approval workflows, access control
- **Technical Level:** Varied
- **Expected Interaction:** Production workflows with approval gates

---

## 3. Prerequisites

### 3.1 Required Software

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 20.0.0+ (recommend 22.x LTS) | Use nvm for version management |
| **Claude Code** | Latest | Must be installed and configured |
| **npm** | 8.0.0+ | Comes with Node.js |

### 3.2 Optional Software

| Requirement | Purpose | Notes |
|-------------|---------|-------|
| **Git** | Version control | Required for cloning, recommended for workflows |
| **ngrok** | Expose breakpoints service | Alternative: Telegram integration |
| **jq** | JSON processing | Helpful for CLI output parsing |
| **Telegram** | Mobile notifications | Optional alternative to ngrok |

### 3.3 Knowledge Prerequisites

| Level | What You Should Know | Documentation Section |
|-------|---------------------|----------------------|
| **Required** | Basic command line usage | N/A |
| **Required** | Claude Code basics (prompting, tools) | External: Claude Code docs |
| **Helpful** | JavaScript/TypeScript fundamentals | For custom processes |
| **Helpful** | Event sourcing concepts | For understanding journal system |
| **Optional** | TDD/BDD methodologies | For quality-focused workflows |

### 3.4 Account Requirements

- **Claude API access** (via Claude Code subscription)
- **GitHub account** (for plugin marketplace access)
- **Telegram account** (optional, for mobile notifications)

---

## 4. Installation Steps

### 4.1 Quick Installation (Recommended)

**Step 1: Install SDK and Packages**
```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

**Step 2: Install Claude Code Plugin**
```bash
# Add the plugin repository
claude plugin marketplace add a5c-ai/babysitter

# Install the plugin
claude plugin install --scope user babysitter@a5c.ai

# Enable the plugin
claude plugin enable --scope user babysitter@a5c.ai
```

**Step 3: Restart Claude Code**

**Step 4: Verify Installation**
```bash
# Check SDK version
babysitter --version

# In Claude Code, verify skill is available
/skills  # Should list "babysit"
```

**Step 5: Start Breakpoints Service**
```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
# Service runs at http://localhost:3184
```

### 4.2 Installation Verification Checklist

- [ ] `babysitter --version` returns version number
- [ ] Claude Code `/skills` command shows "babysit"
- [ ] `http://localhost:3184` displays breakpoints UI
- [ ] Can create a test run with `babysitter run:create --help`

### 4.3 Keeping Updated

```bash
# Update SDK packages
npm update -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints

# Update Claude Code plugin
claude plugin marketplace update a5c.ai
claude plugin update babysitter@a5c.ai
```

---

## 5. Quick Win Scenarios

### 5.1 First Quick Win: Simple TDD Feature (10-15 minutes)

**Goal:** Build a small feature using TDD methodology with quality gates.

**Command:**
```bash
claude "/babysitter:call implement a simple calculator module with TDD and 80% quality target"
```

**What Happens:**
1. Babysitter creates a run with TDD quality convergence
2. Research phase analyzes codebase
3. Writes tests first, then implementation
4. Iterates until 80% quality score achieved
5. Requests approval via breakpoint before completion

**Success Criteria:**
- Working calculator module created
- Tests passing
- Quality score >= 80%
- Full event history in `.a5c/runs/`

### 5.2 Second Quick Win: Resume Interrupted Work (5 minutes)

**Goal:** Demonstrate session persistence by resuming a paused run.

**Steps:**
1. Start a run: `claude "/babysitter:call build a todo API --max-iterations 10"`
2. Close Claude Code mid-execution
3. Reopen Claude Code
4. Resume: `claude "/babysitter:call resume the babysitter run and continue"`

**Success Criteria:**
- Run continues from exact point of interruption
- No work is lost
- Journal shows complete history

### 5.3 Third Quick Win: Human Approval Workflow (5-10 minutes)

**Goal:** Experience the human-in-the-loop breakpoint system.

**Setup:** Ensure breakpoints service is running at `http://localhost:3184`

**Command:**
```bash
claude "/babysitter:call refactor the auth module with breakpoint approval before changes"
```

**What Happens:**
1. Babysitter creates refactoring plan
2. Breakpoint triggers for human approval
3. Open `http://localhost:3184` to review and approve
4. Refactoring proceeds after approval

**Success Criteria:**
- Breakpoint appears in web UI
- Can review context files
- Approval releases the workflow
- Changes applied after approval

### 5.4 Quick Win Difficulty Progression

| Scenario | Time | Complexity | Prerequisites |
|----------|------|------------|---------------|
| Simple TDD feature | 10-15 min | Low | Basic installation |
| Resume interrupted work | 5 min | Low | Completed first scenario |
| Human approval workflow | 5-10 min | Medium | Breakpoints service running |
| Custom process definition | 30+ min | High | JavaScript knowledge |
| CI/CD integration | 60+ min | High | DevOps experience |

---

## 6. User Journeys

### 6.1 Journey Map: Getting Started to Mastery

```
Level 1: First Use (Day 1)
    |
    +---> Install babysitter
    +---> Run first /babysitter:call command
    +---> Observe automatic iteration
    +---> See quality convergence in action
    |
Level 2: Regular Use (Week 1-2)
    |
    +---> Use TDD methodology for features
    +---> Experience session resumption
    +---> Configure breakpoints service
    +---> Approve breakpoints via web UI
    |
Level 3: Proficient Use (Month 1)
    |
    +---> Explore different methodologies (GSD, Spec-Kit)
    +---> Customize quality targets
    +---> Use parallel execution for efficiency
    +---> Analyze journal events for debugging
    |
Level 4: Advanced Use (Month 2+)
    |
    +---> Create custom process definitions
    +---> Build custom hooks
    +---> Integrate with CI/CD pipelines
    +---> Contribute to process library
    |
Level 5: Expert Use (Ongoing)
    |
    +---> Architect complex multi-phase workflows
    +---> Enterprise deployment with compliance
    +---> Team-wide adoption and governance
    +---> Custom methodology development
```

### 6.2 Detailed User Journey: Developer Building a Feature

**Persona:** Sarah, a full-stack developer working on a new API feature

**Journey:**

1. **Awareness** (0-5 min)
   - Sarah hears about Babysitter from a colleague
   - Reviews README for value proposition
   - Decides to try it for her next feature

2. **Installation** (10-15 min)
   - Follows installation guide
   - Installs SDK and plugin
   - Verifies installation works

3. **First Run** (15-30 min)
   - Uses `/babysitter:call` with simple prompt
   - Observes automatic iteration
   - Sees quality convergence working
   - Feature delivered with tests

4. **Growing Confidence** (Week 1)
   - Uses Babysitter for multiple features
   - Learns to specify quality targets
   - Experiences session resumption
   - Starts using breakpoints for critical changes

5. **Customization** (Week 2-4)
   - Explores different methodologies
   - Adjusts iteration limits
   - Reviews journal for debugging
   - Shares experience with team

6. **Advanced Usage** (Month 2+)
   - Creates custom processes for team workflows
   - Integrates with team CI/CD
   - Advocates for team adoption

### 6.3 Critical User Journey Moments

| Moment | User Emotion | Risk | Mitigation |
|--------|--------------|------|------------|
| First installation | Cautious excitement | Installation failure | Clear prerequisites, verification steps |
| First /babysitter:call command | Curious | Nothing happens | Immediate feedback, progress indicators |
| First breakpoint | Confused | Don't know how to approve | Clear instructions in CLI output |
| Session interruption | Frustrated | Fear of lost work | Clear messaging about resumability |
| Quality not converging | Frustrated | Wasted iterations | Guidance on adjusting targets |
| Custom process creation | Challenged | Steep learning curve | Examples, templates, documentation |

---

## 7. Key Terminology and Concepts

### 7.1 Core Concepts

| Term | Definition | Example |
|------|------------|---------|
| **Run** | A single execution of a process, identified by a run ID | `run-20260125-143012` |
| **Process** | A JavaScript function that orchestrates workflow logic | `tdd-quality-convergence.js` |
| **Journal** | Append-only event log recording all state changes | `.a5c/runs/<runId>/journal/` |
| **Iteration** | One pass through the orchestration loop | `run:iterate` command |
| **Effect** | A side-effect request (task, breakpoint, sleep) | Task execution, human approval |

### 7.2 Task Types

| Task Type | Description | Use Case |
|-----------|-------------|----------|
| **Agent** | LLM-powered task | Planning, scoring, analysis |
| **Skill** | Claude Code skill invocation | Code refactoring, search |
| **Node** | JavaScript/Node.js script | Build, test, deploy scripts |
| **Shell** | System shell command | File operations, git commands |
| **Breakpoint** | Human approval gate | Critical decisions, deployments |

### 7.3 Workflow Concepts

| Term | Definition | Context |
|------|------------|---------|
| **Quality Convergence** | Iterating until quality score meets target | TDD workflows with 85% target |
| **Breakpoint** | Pause point requiring human approval | Before production deployment |
| **Deterministic Replay** | Same inputs + journal = same execution path | Session resumption |
| **Event Sourcing** | State derived from replaying events | Journal-based state reconstruction |
| **In-Session Loop** | Continuous iteration within a single Claude session | `/babysitter:call` command with max iterations |

### 7.4 File Structure Glossary

| Path | Purpose |
|------|---------|
| `.a5c/runs/<runId>/` | Run directory containing all run artifacts |
| `journal/` | Append-only event log (one file per event) |
| `state/state.json` | Derived state cache (gitignored, rebuildable) |
| `tasks/<effectId>/` | Task artifacts (inputs, results, logs) |
| `code/main.js` | Process implementation |
| `artifacts/` | Generated artifacts (plans, specs, reports) |

### 7.5 Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `executed` | Tasks ran successfully | Continue iterating |
| `waiting` | Breakpoint or sleep active | Wait for resolution |
| `completed` | Run finished successfully | Exit loop, review results |
| `failed` | Run failed with error | Debug, possibly retry |
| `none` | No pending effects | May indicate completion |

---

## 8. Common Issues and Pain Points

### 8.1 Installation Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CLI not found after install | Global npm path not in PATH | Add npm global bin to PATH, or use `npx` |
| Plugin not appearing in Claude Code | Plugin not enabled | Run `claude plugin enable --scope user babysitter@a5c.ai` |
| Version mismatch errors | Mixed versions of packages | Update all packages to latest |
| Permission denied on hooks | Hook files not executable | Run `chmod +x` on hook files |

### 8.2 Runtime Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Breakpoint not resolving | Breakpoints service not running | Start with `npx @a5c-ai/babysitter-breakpoints@latest start` |
| Session ended unexpectedly | Network issue, Claude Code crash | Resume with `/babysitter:call resume --run-id <id>` |
| Quality score not improving | Unrealistic target or blocking issues | Lower target, review iteration logs |
| Agent task timeout | Large context, API issues | Reduce task scope, check API status |
| Journal conflict | Concurrent operations | Avoid multiple instances, use resume to recover |

### 8.3 Conceptual Pain Points

| Pain Point | User Confusion | Resolution Strategy |
|------------|----------------|---------------------|
| Event sourcing mental model | "Why is there a journal?" | Explain benefits: audit trail, resumability, debugging |
| Breakpoint workflow | "How do I approve things?" | Step-by-step breakpoint tutorial with screenshots |
| Process definitions | "How do I customize workflows?" | Templates, examples, progressive complexity |
| Quality scoring | "What determines the score?" | Document scoring criteria, show how to customize |
| In-session loop vs run orchestration | "What's the difference?" | Clear comparison table, use case guidance |

### 8.4 Error Messages and Solutions

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `Run encountered an error` | Journal or state corruption | Analyze journal, recover from last good state |
| `Breakpoint not resolving` | Service unreachable or timeout | Check service status, verify network |
| `ENOENT: no such file or directory` | Missing file in task | Verify paths, check dependencies installed |
| `Cannot find module '@a5c-ai/babysitter-sdk'` | SDK not installed | Run `npm install -g @a5c-ai/babysitter-sdk` |
| `Plugin not found: babysitter@a5c.ai` | Plugin not installed in Claude Code | Follow plugin installation steps |

### 8.5 Performance Pain Points

| Issue | Symptom | Optimization |
|-------|---------|--------------|
| Slow iterations | Each iteration takes minutes | Use parallel execution, reduce agent task scope |
| Large journal files | Disk usage grows quickly | Clean old runs, archive completed work |
| Memory issues | Out of memory errors | Limit concurrent tasks, increase Node.js heap |
| Runaway loops | Iterations don't converge | Set iteration limits, review quality criteria |

---

## 9. Documentation Recommendations

### 9.1 Recommended Documentation Structure

```
docs/user-guide/
|
+-- 01-discovery-analysis.md       (THIS DOCUMENT)
|
+-- 02-getting-started/
|   +-- installation.md            (Detailed installation guide)
|   +-- first-run.md               (Your first babysitter run)
|   +-- quick-reference.md         (Command cheat sheet)
|
+-- 03-core-concepts/
|   +-- event-sourcing.md          (Understanding the journal)
|   +-- process-definitions.md     (How processes work)
|   +-- task-types.md              (Agent, skill, node, etc.)
|   +-- breakpoints.md             (Human-in-the-loop approval)
|   +-- quality-convergence.md     (Iterative quality improvement)
|
+-- 04-workflows/
|   +-- tdd-development.md         (Test-driven development)
|   +-- feature-implementation.md  (End-to-end feature workflow)
|   +-- code-review.md             (Review and refactoring)
|
+-- 05-methodologies/
|   +-- tdd-quality-convergence.md
|   +-- gsd-get-shit-done.md
|   +-- spec-kit.md
|   +-- custom-methodologies.md
|
+-- 06-advanced/
|   +-- custom-processes.md        (Writing process definitions)
|   +-- custom-hooks.md            (Hook development)
|   +-- parallel-execution.md      (Optimizing with parallelism)
|   +-- troubleshooting.md         (Debug and recovery)
|
+-- 07-reference/
|   +-- cli-reference.md           (Complete CLI documentation)
|   +-- api-reference.md           (SDK API documentation)
|   +-- configuration.md           (Environment variables, settings)
|   +-- glossary.md                (Terminology reference)
|
+-- 08-tutorials/
|   +-- tutorial-todo-app.md       (Build a todo app step-by-step)
|   +-- tutorial-auth-feature.md   (Add authentication with TDD)
|   +-- tutorial-ci-integration.md (GitHub Actions integration)
```

### 9.2 Priority Documentation by Audience

#### For Beginners (Priority 1)
1. Installation guide with troubleshooting
2. First run tutorial (step-by-step)
3. Quick reference / cheat sheet
4. Glossary of terms

#### For Regular Users (Priority 2)
1. Methodology guides (TDD, GSD, Spec-Kit)
2. Breakpoints workflow guide
3. Session resumption guide
4. Quality target configuration

#### For Advanced Users (Priority 3)
1. Custom process development
2. Hook development guide
3. CI/CD integration patterns
4. Performance optimization

### 9.3 Content Format Recommendations

| Content Type | Format | Reason |
|--------------|--------|--------|
| Installation | Step-by-step numbered lists | Easy to follow, verify completion |
| Tutorials | Progressive complexity | Build confidence gradually |
| Reference | Tables, code blocks | Quick lookup, copy-paste |
| Concepts | Diagrams, flowcharts | Visual understanding |
| Troubleshooting | Problem-solution tables | Fast resolution |

### 9.4 Documentation Gaps Identified

Based on analysis of existing documentation:

| Gap | Current State | Recommendation |
|-----|---------------|----------------|
| Visual diagrams | ASCII art only | Add flowcharts, architecture diagrams |
| Video tutorials | None | Create getting started video |
| Interactive examples | Static code only | Add CodeSandbox/Replit examples |
| Error message catalog | Scattered in troubleshooting | Centralized error reference |
| Upgrade guides | None | Document breaking changes between versions |
| Best practices compilation | Scattered throughout | Dedicated best practices guide |

### 9.5 Documentation Maintenance Recommendations

1. **Version Sync:** Keep documentation versions aligned with SDK versions
2. **Example Verification:** All code examples should be tested automatically
3. **Link Validation:** Regular broken link checking
4. **User Feedback:** Add feedback mechanism to documentation pages
5. **Analytics:** Track most-visited pages to prioritize updates
6. **Community Contributions:** Accept documentation PRs with clear guidelines

### 9.6 Immediate Next Steps

1. **Week 1:** Create installation guide with screenshots
2. **Week 2:** Build "First Run" tutorial with complete walkthrough
3. **Week 3:** Document TDD workflow with real example
4. **Week 4:** Create CLI quick reference card
5. **Month 2:** Develop advanced tutorials (custom processes, CI/CD)

---

## Appendix A: Source Documents Analyzed

| Document | Path | Key Insights |
|----------|------|--------------|
| Main README | `/README.md` | Value proposition, installation, examples |
| Plugin Specification | `/plugins/babysitter/BABYSITTER_PLUGIN_SPECIFICATION.md` | Technical architecture, hooks |
| Skill Documentation | `/plugins/babysitter/skills/babysit/SKILL.md` | Orchestration workflow |
| CLI Spec | `/notes/babysitter_cli_surface_spec.md` | CLI commands and behavior |
| CLI Examples | `/docs/cli-examples.md` | Usage patterns |
| Breakpoints README | `/packages/breakpoints/README.md` | Human approval system |
| Process README | `/plugins/babysitter/skills/babysit/process/README.md` | Methodologies overview |
| SDK Package.json | `/packages/sdk/package.json` | Version, dependencies |

## Appendix B: Key Metrics for Documentation Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first successful run | < 30 minutes | User testing |
| Installation success rate | > 95% | Support tickets |
| Documentation satisfaction | > 4.0/5.0 | User surveys |
| Support ticket reduction | 50% in 6 months | Ticket tracking |
| Community contribution | 5+ PRs/month | GitHub metrics |

---

**Document Status:** Complete
**Next Phase:** Create detailed user guide documents per Section 9.1 structure
**Review Date:** 2026-02-01
