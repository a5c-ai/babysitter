# Babysitter Plugins

## What Makes This Plugin System Different

Most plugin systems work like this: there's a host application with predefined extension points (hooks, APIs, lifecycle events), and plugins slot into those points. The plugin can only do what the host lets it do.

Babysitter plugins don't work like that.

A babysitter plugin is a **set of natural language instructions** (markdown files) or **deterministic coded processes** (js files) -- that an AI agent reads and executes to install or configure a modular set of capabilities. The SDK doesn't "run" the plugin. It stores, versions, and distributes the instructions. The AI agent is the runtime.

This means a plugin can do *anything an AI agent can do*:

- **Modify your project** -- install npm packages, add ESLint rules, create Terraform configs, set up Playwright, generate Helm charts, write CI/CD pipelines
- **Modify your environment** -- configure Claude Code hooks, set up git hooks, install sound effects, change how Claude talks to you
- **Modify your workflow** -- copy babysitter processes, skills, and agents into your project so future babysitter runs use them
- **Research and adapt** -- web search for theme resources, analyze your codebase to pick the right testing framework, detect your cloud provider from existing configs

There are no predefined extension points, no plugin API, no sandboxing. The `install.md` (or `install.js`) for a plugin is a prompt or autonomous process. The "integration" is whatever the AI agent does after reading it.

### What the SDK Actually Manages

The SDK handles the parts that need to be deterministic and reliable:

| Concern | How the SDK handles it |
|---------|----------------------|
| **Distribution** | Marketplaces are git repos cloned with `--depth 1`. The SDK reads `marketplace.json` to list available plugins. |
| **Versioning** | The registry tracks installed versions. Migration files (`1.0.0_to_1.1.0.md`) describe upgrade steps -- the SDK finds the shortest upgrade path via BFS. |
| **Registry** | A JSON file (`plugin-registry.json`) tracks what's installed, where it came from, and when. Atomic writes for crash safety. |
| **Instruction delivery** | The CLI reads `install.md`, `configure.md`, or `uninstall.md` from the plugin package and hands them to the AI agent. |

Everything else -- the actual installation, configuration, project modification -- is done by the AI agent interpreting the instructions.

### The Two Scopes

Plugins can be stored globally (`~/.a5c/`) or per-project (`<project>/.a5c/`). But even globally-installed plugins often create project-level artifacts. The themes plugin, for example, writes to `.a5c/themes/`, `.claude/settings.json`, and `CLAUDE.md` -- all project-level. The scope mostly determines where the registry and marketplace clones live.

---

## How a Plugin Install Actually Works

Here's what happens when you run `babysitter plugin:install testing-suite`:

1. The CLI finds the `testing-suite` package in the marketplace
2. It reads `install.md` from the package directory
3. The AI agent receives the markdown instructions
4. The agent **analyzes your project** -- reads `package.json`, checks for existing test configs, detects your framework
5. The agent **interviews you** -- asks which testing layers you want, which frameworks to use, what coverage thresholds to set
6. The agent **installs frameworks** -- runs `npm install -D vitest @playwright/test`, generates config files
7. The agent **sets up linting** -- creates or updates `eslint.config.mjs`, adds test-specific rules
8. The agent **configures git hooks** -- installs husky, creates pre-commit and pre-push hooks
9. The agent **creates CI/CD pipelines** -- writes `.github/workflows/test.yml` with lint, test, and coverage jobs
10. The agent **copies babysitter processes** -- puts TDD and quality gate processes in `.a5c/processes/testing/`
11. The agent **runs an initial check** -- executes the test suite, reports coverage
12. The agent **registers the plugin** -- calls `babysitter plugin:update-registry`

Steps 4-11 are the agent interpreting markdown. The SDK was only involved in steps 1-3 and 12.

Compare this to a conventional plugin system where "install" means "load a module and call its `activate()` function." Here, "install" means "restructure this project's testing infrastructure based on an AI agent's understanding of the codebase and the user's preferences."

---

## The Marketplace Plugins

The official a5c.ai marketplace includes seven plugins. Each one illustrates a different way plugins can reshape a project.

### basic-security

Adds security processes, skills, agents, lint rules, and git hooks to your project.

**What the AI agent does during install:**
- Interviews you about which security categories to install (DevSecOps, Compliance, Incident Response, Infrastructure Security, etc.)
- Copies selected process files from the babysitter library to `.a5c/processes/security/`
- Copies matching skills and agents to `.a5c/skills/security/` and `.a5c/agents/security/`
- Installs security ESLint plugins (`eslint-plugin-security`, `eslint-plugin-no-secrets`) and configures rules -- different rules for React vs Express vs Python vs Go projects
- Sets up gitleaks as a pre-commit hook for secrets detection
- Adds sensitive file patterns to `.gitignore`
- Creates slash commands (`.a5c/commands/security-commands.md`) for running security scans
- Runs an initial codebase security audit and presents findings

**What this means for the project:** After installation, every commit is scanned for secrets, every push audits dependencies, and you have `/security-audit`, `/pentest`, `/threat-model`, and other commands available for on-demand security processes.

### testing-suite

Sets up comprehensive testing infrastructure tailored to your stack.

**What the AI agent does during install:**
- Detects your language, framework, and existing test setup
- Interviews you across 8 stages: testing scope, framework selection, coverage requirements, CI/CD integration, linting, git hooks, test strategy
- Installs the right frameworks for your stack (Vitest/Jest, Playwright/Cypress, pytest, Storybook 8+, etc.)
- Generates config files (`vitest.config.ts`, `playwright.config.ts`, `.eslintrc`, `.prettierrc`)
- Creates git hooks: pre-commit runs lint-staged, pre-push runs the full test suite
- Writes a complete CI/CD pipeline with lint, typecheck, unit test, E2E, Storybook, and coverage gate jobs
- Creates example test files as working templates
- Copies QA processes and TDD methodology from the babysitter library

**What this means for the project:** You get a fully configured test pyramid with enforcement at every level -- staged files are linted on commit, tests run on push, coverage is gated in CI.

### project-deployment

Sets up deployment infrastructure, CI/CD, and cloud provisioning.

**What the AI agent does during install:**
- Analyzes your project for existing deployment configs (Docker, Terraform, Helm, Vercel, etc.)
- Interviews you about deployment approach (Enterprise Cloud / Managed Platform / Container / Serverless), cloud provider, CI/CD platform, environment strategy
- Generates infrastructure config: Terraform files, Kubernetes manifests, Helm charts, Dockerfiles, `vercel.json`, `serverless.yml` -- whatever matches your choices
- Creates CI/CD pipelines with build, push, and deploy stages per environment
- Copies relevant DevOps processes and skills from the babysitter library
- Runs validation (Terraform plan, kubectl dry-run) to verify the generated configs

**What this means for the project:** Your project gets production-ready deployment infrastructure -- IaC, container orchestration, multi-environment pipelines -- generated from an interview rather than weeks of manual setup.

### themes

Applies a complete thematic identity to your project -- sounds, design system, conversational personality, and decorative assets.

**What the AI agent does during install:**
- Asks you to name *any* concept -- "Blade Runner", "Art Deco", "cozy autumn", "GLaDOS", literally anything
- Researches the theme: web searches for visual language, color palettes, typography, sound effects, speech patterns
- Discovers existing UI frameworks that match (Arwes for sci-fi, NES.css for retro gaming, Augmented UI for cyberpunk)
- Downloads themed sound effects for Claude Code lifecycle events
- Writes a complete design system document with palette, typography, component guidelines, and immersive UI instructions
- Modifies `CLAUDE.md` to give Claude a themed conversational personality and design awareness
- Sets up sound hooks in `.claude/settings.json`
- Creates a symlink-based theme system (`.a5c/theme` -> `.a5c/themes/<name>/`) for switching between themes

**What this means for the project:** Claude speaks in the theme's voice, generates UI using the themed design system, and plays thematic sounds on every action. Your dev environment *feels* different.

### github-actions-cicd

Sets up babysitter-powered GitHub Actions workflows.

**What the AI agent does:** Interviews you about which workflow triggers to enable (issue comments, PR events, schedules, manual dispatch), creates up to 8 workflow templates in `.github/workflows/`, configures GitHub secrets, and sets up artifact preservation.

### rate-limit-handler

Configures hooks to detect and handle API rate limits with exponential backoff.

**What the AI agent does:** Interviews you about backoff strategy (exponential-jitter, linear, fixed), creates detection and retry scripts, integrates them as Claude Code hooks that trigger on PostToolUseFailure and Notification events.

---

## Using Plugins

### Quick Start

```bash
# Add the official marketplace
babysitter plugin:add-marketplace \
  --marketplace-url https://github.com/a5c-ai/babysitter \
  --marketplace-path plugins/a5c/marketplace \
  --global

# See what's available
babysitter plugin:list-plugins --marketplace-name babysitter --global

# Install a plugin (starts the AI-driven interview)
babysitter plugin:install testing-suite --marketplace-name babysitter --global

# Reconfigure later
babysitter plugin:configure testing-suite --marketplace-name babysitter --project

# Remove it
babysitter plugin:uninstall testing-suite --global
```

### CLI Commands Reference

All commands accept `--json` for machine-readable output.

**Marketplace management:**

```bash
babysitter plugin:add-marketplace --marketplace-url <url> [--marketplace-path <path>] --global
babysitter plugin:update-marketplace --marketplace-name <name> --global
babysitter plugin:list-plugins --marketplace-name <name> --global
```

**Plugin lifecycle:**

```bash
babysitter plugin:install <name> --marketplace-name <mp> --global
babysitter plugin:update <name> --marketplace-name <mp> --global
babysitter plugin:configure <name> --marketplace-name <mp> --global
babysitter plugin:uninstall <name> --global
```

**Registry management:**

```bash
babysitter plugin:list-installed --global
babysitter plugin:update-registry <name> --plugin-version <ver> --marketplace-name <mp> --global
babysitter plugin:remove-from-registry <name> --global
```

Replace `--global` with `--project` for project-scoped operations.

---

## Creating Plugins

### Plugin Package Structure

A plugin is a directory with markdown instruction files:

```
my-plugin/
  install.md           # What the AI agent does when someone installs this plugin
  uninstall.md         # How to reverse the installation
  configure.md         # How to reconfigure after install
  plugin.json          # Optional manifest (name, version)
  migrations/          # Version upgrade instructions
    1.0.0_to_1.1.0.md
    1.1.0_to_2.0.0.md
  process/             # Optional babysitter process definitions
```

Only `install.md` is required.

### Writing install.md

This is the core of your plugin. It's a markdown document that an AI agent will read and execute. Write it as instructions for the agent, not documentation for a human.

**Effective patterns from the built-in plugins:**

1. **Start with project analysis.** Have the agent inspect the codebase before asking questions. The testing-suite plugin checks for existing test configs, linters, CI/CD, and git hooks *before* presenting options.

2. **Interview in stages.** Don't dump all questions at once. The project-deployment plugin asks about deployment approach first, then cloud provider (only if relevant), then CI/CD, then environments, then add-ons.

3. **Be stack-aware.** Provide different instructions for different stacks. The basic-security plugin has separate ESLint rule blocks for React, Express, Python (ruff), and Go (gosec).

4. **Copy from the babysitter library.** Plugins typically copy processes, skills, and agents from `plugins/babysitter/skills/babysit/process/specializations/` into the project's `.a5c/` directories. This seeds the project with domain-specific babysitter capabilities.

5. **Modify project config files.** Plugins routinely edit `.eslintrc`, `tsconfig.json`, `package.json`, `.gitignore`, `CLAUDE.md`, `.claude/settings.json`, and CI/CD pipelines. Use merge semantics (append, don't overwrite) and check for existing content.

6. **Verify at the end.** Run the installed tools, check that hooks work, confirm configs are valid. The testing-suite plugin runs the full test suite and reports coverage.

7. **Register the plugin.** Always end with `babysitter plugin:update-registry` so the system tracks what was installed.

### Writing Migration Files

When you release a new version, add migration files to `migrations/`:

```
migrations/
  1.0.0_to_1.1.0.md    # Markdown instructions for the upgrade
  1.1.0_to_2.0.0.md    # Another step
```

**Filename format:** `<from>_to_<to>.md` (or `.js` for executable process files)

The SDK builds a directed graph of all migrations and uses BFS to find the shortest path from the user's current version to the target. If you have `1.0.0 -> 1.1.0` and `1.1.0 -> 2.0.0`, a user on 1.0.0 upgrading to 2.0.0 gets both in sequence automatically.

### Publishing to a Marketplace

Create a `marketplace.json` in a git repository:

```json
{
  "name": "My Marketplace",
  "description": "A collection of plugins",
  "url": "https://github.com/org/repo",
  "owner": "org",
  "plugins": {
    "my-plugin": {
      "name": "my-plugin",
      "description": "Does something useful",
      "latestVersion": "1.0.0",
      "versions": ["1.0.0"],
      "packagePath": "plugins/my-plugin",
      "tags": ["utility"],
      "author": "org"
    }
  }
}
```

The `packagePath` is relative to the directory containing `marketplace.json`. Users add your marketplace with:

```bash
babysitter plugin:add-marketplace --marketplace-url <url> --global
```

---

## Under the Hood

### Registry Format

```json
{
  "schemaVersion": "2026.01.plugin-registry-v1",
  "updatedAt": "2026-01-15T10:00:00.000Z",
  "plugins": {
    "testing-suite": {
      "name": "testing-suite",
      "version": "1.0.0",
      "marketplace": "babysitter",
      "scope": "project",
      "installedAt": "2026-01-10T08:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z",
      "packagePath": "/path/to/package",
      "metadata": {}
    }
  }
}
```

All writes use the SDK's atomic write protocol (temp file + fsync + rename).

### Marketplace Resolution

When reading a marketplace manifest, the SDK searches in order:
1. Custom path from `.babysitter-manifest-path` (set via `--marketplace-path` at clone time)
2. Root `marketplace.json`
3. `.claude-plugin/marketplace.json` (legacy)

A legacy array-format manifest is auto-normalized.

### SDK Module Map

| Module | What it does |
|--------|-------------|
| `types.ts` | Interfaces: `PluginRegistry`, `MarketplaceManifest`, `MigrationDescriptor`, `PluginPackageInfo` |
| `paths.ts` | Resolves filesystem paths based on scope (`~/.a5c/` vs `<project>/.a5c/`) |
| `registry.ts` | CRUD on the registry JSON with atomic writes |
| `marketplace.ts` | Git clone/pull, manifest reading, plugin path resolution |
| `packageReader.ts` | Reads `install.md`, `configure.md`, `uninstall.md`, collects process files |
| `migrations.ts` | Parses migration filenames, builds version graph, BFS shortest path |

---

## Further Reading

- [CLI Reference](plugins/cli-reference.md) -- Complete command syntax, flags, and output schemas
- [Marketplace Format](plugins/marketplace-format.md) -- Full `marketplace.json` specification
- [Migration Guide](plugins/migration-guide.md) -- Detailed migration system documentation
- [Plugin Author Guide](plugins/plugin-author-guide.md) -- Step-by-step plugin creation guide
- [SDK Plugin Module](../packages/sdk/src/plugins/PLUGINS.md) -- Internal developer reference
