# Getting Started with Babysitter Plugin

> Get your first orchestrated workflow running in under 20 minutes.

This guide walks you through installing the Babysitter plugin and running your first successful orchestration. By the end, you will understand how to use the Babysitter skill to manage complex, multi-step workflows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Installation (5 minutes)](#quick-installation-5-minutes)
3. [First Orchestration (10 minutes)](#first-orchestration-10-minutes)
4. [Understanding the Output](#understanding-the-output)
5. [Troubleshooting](#troubleshooting)
6. [Next Steps](#next-steps)

---

## Prerequisites

Before installing, verify your system has the required dependencies.

### Required Software

| Software | Minimum Version | Check Command |
|----------|-----------------|---------------|
| Node.js | v18+ | `node --version` |
| npm | Any recent | `npm --version` |
| Git | Any recent | `git --version` |
| jq | Any version | `jq --version` |

### Verify Prerequisites

Run the verification script to check all dependencies at once:

```bash
# From your project directory containing the plugin
bash plugins/babysitter/scripts/verify-install.sh
```

**Expected output when all checks pass:**

```
Babysitter Plugin Installation Verification
============================================

=== Environment Checks ===
✓ Environment: Linux/macOS/Windows detected

=== Required Dependencies ===
✓ Node.js: Version 20.x.x (>=18 required)
✓ npm: Version 10.x.x
✓ git: Version 2.x.x
✓ jq: Version 1.x

=== Plugin Checks ===
✓ Plugin Structure: All required directories and files present
✓ SDK CLI: Version x.x.x

=== Summary ===
All checks passed! The babysitter plugin is ready to use.
```

> **Tip:** Run `bash plugins/babysitter/scripts/verify-install.sh --json` for machine-readable output.

### Install Missing Dependencies

**Node.js and npm:**
- Download from [nodejs.org](https://nodejs.org/) (v18 LTS or later recommended)

**jq (required for hooks):**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (using Chocolatey)
choco install jq
```

---

## Quick Installation (5 minutes)

Choose one of three installation methods:

### Option A: Via Claude Code Marketplace (Recommended)

In Claude Code, run:

```
/plugin marketplace add a5c-ai/babysitter
/plugin install babysitter@a5c.ai
```

After installation:
1. Restart Claude Code if prompted
2. Verify with `/skills` - look for "babysitter" in the list

### Option B: Manual Installation (Global)

```bash
# Clone to Claude Code plugins directory
git clone https://github.com/a5c-ai/babysitter.git ~/.claude/plugins/babysitter
```

### Option C: Project-Local Installation

For project-specific plugin usage:

```bash
# Create plugin directory in your project
mkdir -p .claude/plugins

# Clone the plugin
git clone https://github.com/a5c-ai/babysitter.git .claude/plugins/babysitter
```

### Verify Installation

In Claude Code, verify the skill is loaded:

```
/skills
```

You should see `babysitter:babysit` and `babysitter:call` in the list.

---

## First Orchestration (10 minutes)

The Babysitter plugin is used through **skill invocation** - you ask Claude to use the babysitter skill, and Claude handles all the orchestration internally.

### Method 1: Direct Skill Invocation

Use the slash command to invoke the skill:

```
/babysitter:call implement a Hello World function with TDD targeting 80% quality
```

### Method 2: Natural Language Request

Simply ask Claude to use the babysitter skill:

```
Use the babysitter skill to implement a Hello World function.
Requirements:
- Create a function that returns "Hello, World!"
- Function accepts an optional name parameter
- Returns "Hello, {name}!" when name is provided
- Include unit tests
- Use TDD methodology
```

### What Happens Next

When you invoke the skill, Claude will:

1. **Interview Phase** - Claude may ask clarifying questions about your requirements, scope, and preferred methodology

2. **Process Creation** - Claude creates a custom process tailored to your request

3. **Run Setup** - Claude initializes the orchestration run (you'll see a message about the run being activated)

4. **Iteration Loop** - Claude executes the workflow step by step:
   - Executes tasks (code generation, testing, refactoring)
   - Posts results to the run
   - Handles quality gates automatically

5. **Breakpoints** - If human approval is needed, Claude will ask you directly (in interactive mode) before continuing

6. **Completion** - When done, Claude reports the final results

### Example Session

Here's what a typical session looks like:

```
You: /babysitter:call create a calculator module with add and subtract functions using TDD

Claude: I'll orchestrate this using the babysitter skill. Let me first understand your requirements...

Claude: What programming language would you prefer?
- TypeScript (Recommended)
- JavaScript
- Python

You: TypeScript

Claude: 🔄 Babysitter run activated in this session!
Creating process for TDD calculator implementation...

[Claude creates the process and begins orchestration]

Claude: Phase 1: Writing failing tests for add function...
[Shows test code]

Claude: Phase 2: Implementing add function to pass tests...
[Shows implementation]

Claude: Phase 3: Quality gate - Tests passing: ✓
Current quality score: 75%

[Continues iterating until quality threshold is met]

Claude: ✅ Run completed successfully!
- All tests passing
- Quality score: 85%
- Files created: src/calculator.ts, tests/calculator.test.ts
```

### Choosing a Methodology

You can specify which methodology to use:

```
/babysitter:call use GSD methodology to quickly prototype a REST API

/babysitter:call use TDD Quality Convergence to implement user authentication

/babysitter:call use Spec-Kit for implementing the requirements in spec.md
```

See [PROCESS_SELECTION.md](./PROCESS_SELECTION.md) for help choosing the right methodology.

---

## Understanding the Output

### Run Directory Structure

Babysitter creates a run directory with all artifacts:

```
.a5c/runs/<runId>/
├── run.json           # Run metadata
├── inputs.json        # Your inputs
├── journal.jsonl      # Event log (append-only)
├── state.json         # Current state cache
├── code/              # Process implementation
│   └── main.js        # Process entry point
├── tasks/             # Task execution artifacts
│   └── <effectId>/
│       ├── input.json
│       ├── result.json
│       ├── stdout.log
│       └── stderr.log
└── artifacts/         # Human-readable outputs
    └── *.md
```

### Iteration Status Values

| Status | Meaning | What Claude Does |
|--------|---------|------------------|
| `executed` | Tasks were executed | Continues iterating |
| `waiting` | Breakpoint or sleep gate | Asks for your approval |
| `completed` | Run finished successfully | Reports final results |
| `failed` | Run encountered an error | Reports error and recovery options |

### Quality Gates

Babysitter uses quality gates to ensure work meets standards:

- **Quality Score**: A 0-100 score based on test coverage, code quality, and requirements coverage
- **Quality Threshold**: The minimum score required (default: 80%)
- **Convergence**: Babysitter iterates until the threshold is met or max iterations reached

---

## Troubleshooting

### Common First-Time Issues

#### Issue: Skill not found

**Symptom:** `/babysitter:call` doesn't work or skill not in `/skills` list

**Solution:** Verify plugin installation:
1. Check plugin directory exists: `ls ~/.claude/plugins/babysitter/`
2. Restart Claude Code
3. Run `/skills` again

#### Issue: "jq: command not found" during execution

**Solution:** Install jq (required for hooks):

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows
choco install jq
```

#### Issue: Run seems stuck

**Cause:** Usually waiting for your approval at a breakpoint.

**Solution:** Check if Claude is asking you a question. In interactive mode, breakpoints require your response to continue.

#### Issue: Quality threshold never reached

**Cause:** The implementation may need significant changes to meet the threshold.

**Solutions:**
- Lower the quality threshold: "targeting 70% quality"
- Increase max iterations: "with up to 10 iterations"
- Simplify requirements

#### Issue: Permission denied errors

**Solution:** Make hook scripts executable:

```bash
chmod +x plugins/babysitter/hooks/*.sh
chmod +x plugins/babysitter/scripts/*.sh
```

### Health Check

Run the health check script to diagnose issues:

```bash
bash plugins/babysitter/scripts/health-check.sh --verbose
```

**Health status meanings:**

| Status | Exit Code | Meaning |
|--------|-----------|---------|
| HEALTHY | 0 | All checks passed |
| DEGRADED | 2 | Warnings present but functional |
| UNHEALTHY | 1 | Critical failures detected |

---

## Next Steps

Now that you understand how to use Babysitter, explore these resources:

### Choose Your Methodology

See [PROCESS_SELECTION.md](./PROCESS_SELECTION.md) for a guide on choosing the right methodology:

| Methodology | Best For |
|-------------|----------|
| **GSD** | Quick prototypes, getting things done fast |
| **TDD Quality Convergence** | Quality-focused development with tests |
| **Spec-Kit** | Projects with formal specifications |
| **Scrum/Agile** | Sprint-based team workflows |
| **BDD** | Behavior-driven development |

### Example Invocations

```
# Quick prototype
/babysitter:call use GSD to create a CLI tool for converting CSV to JSON

# Quality-focused
/babysitter:call implement user authentication with TDD, 85% quality threshold

# Spec-driven
/babysitter:call use Spec-Kit to implement the API defined in openapi.yaml

# Feature development
/babysitter:call add dark mode support to the React app using iterative development
```

### Advanced Topics

- **[Plugin Specification](./BABYSITTER_PLUGIN_SPECIFICATION.md)** - Complete architecture documentation
- **[Advanced Patterns](./skills/babysit/reference/ADVANCED_PATTERNS.md)** - Agent tasks, parallel execution
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Comprehensive problem-solving

### Utility Scripts

- **[verify-install.sh](./scripts/verify-install.sh)** - Validate installation
- **[health-check.sh](./scripts/health-check.sh)** - Runtime diagnostics

---

**Need help?** Just ask Claude: "Use the babysitter skill to help me with..." and describe what you want to build.
