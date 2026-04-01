# Contributing to Babysitter

Thank you for your interest in contributing! This document explains how to contribute to the project and how to use the Babysitter plugin commands during development.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Plugin Commands for Contributors](#plugin-commands-for-contributors)
- [SDK CLI Commands](#sdk-cli-commands)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Ways to Contribute

- **Report bugs**: [Open an issue](https://github.com/a5c-ai/babysitter/issues) with steps to reproduce
- **Suggest features**: [Start a discussion](https://github.com/a5c-ai/babysitter/discussions) or open a feature request issue
- **Submit pull requests**: Fix bugs, add features, or improve documentation
- **Improve documentation**: Help make docs clearer and more complete
- **Share processes**: Contribute reusable process definitions to the library

---

## Development Setup

### Prerequisites

- **Node.js**: 20.0.0+ (22.x LTS recommended)
- **Claude Code**: Latest version
- **Git**: Required for cloning and contributing

### 1. Clone the Repository

```bash
git clone https://github.com/a5c-ai/babysitter.git
cd babysitter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install the Plugin in Claude Code

```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c-ai
```

Then restart Claude Code. Verify installation by typing `/skills` — "babysit" should appear.

### 4. Set Up Your Profile

```bash
/babysitter:user-install
```

### 5. Set Up Your Project

From the cloned repository root:

```bash
/babysitter:project-install
```

### 6. Run Diagnostics

```bash
/babysitter:doctor
```

---

## Plugin Commands for Contributors

The Babysitter plugin provides slash commands for orchestrating development workflows. These are especially useful when contributing new features or processes.

### Core Orchestration Modes

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/babysitter:call <task>` | Interactive orchestration with human approval at breakpoints | Implementing features, fixing bugs with oversight |
| `/babysitter:yolo <task>` | Full autonomous execution, no breakpoints | Trusted, well-understood tasks |
| `/babysitter:plan <task>` | Generate and review a process plan without executing | Before committing to an implementation approach |
| `/babysitter:forever <task>` | Continuous orchestration loop for periodic tasks | Monitoring workflows, background processes |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/babysitter:user-install` | Configure your profile and preferences |
| `/babysitter:project-install` | Onboard the project for babysitting |
| `/babysitter:doctor` | Diagnose run health and issues |
| `/babysitter:observe` | Launch real-time monitoring dashboard |
| `/babysitter:resume` | Continue an interrupted run |
| `/babysitter:help` | Documentation and usage guidance |

### Example: Implementing a Feature with TDD

```bash
/babysitter:call implement <your-feature> with TDD
```

### Example: Planning Before Implementing

```bash
/babysitter:plan add support for <your-feature>
```

---

## SDK CLI Commands

The Babysitter SDK CLI (`babysitter`) is used to drive the orchestration loop and inspect run state. Install it globally if you need it in your terminal:

```bash
npm install -g @a5c-ai/babysitter-sdk@latest
```

### Run Management

```bash
babysitter run:create --process-id <id> --entry <file>#process --inputs <inputs.json>
babysitter run:status <runDir>
babysitter run:events <runDir> --limit 20 --reverse
babysitter run:iterate <runDir> --json
```

### Task Commands

```bash
babysitter task:list <runDir> --pending --json
babysitter task:show <runDir> <effectId> --json
babysitter task:post <runDir> <effectId> --status ok --value <result.json>
```

### Plugin Management

```bash
babysitter plugin:install <plugin-name> --marketplace-name <name> --global
babysitter plugin:list-installed --global
babysitter plugin:uninstall <plugin-name> --global
```

### Harness Commands

```bash
babysitter harness:discover --json
babysitter harness:invoke <name> --prompt "<text>"
```

See the full [CLI Reference](docs/user-guide/reference/cli-reference.md) and [Slash Commands Reference](docs/user-guide/reference/slash-commands.md) for details.

---

## Development Workflow

### Running Tests

```bash
# SDK unit tests
npm run test:sdk

# E2E tests (requires Docker)
npm run test:e2e:docker

# Single test file
cd packages/sdk && npx vitest run src/runtime/__tests__/someFile.test.ts
```

### Building the SDK

```bash
npm run build:sdk
```

### Linting

```bash
npm run lint --workspace=@a5c-ai/babysitter-sdk
npm run lint --workspace=@a5c-ai/babysitter-sdk -- --fix
```

---

## Code Style

- **TypeScript**: Strict mode enabled. No `any` types — use `unknown` and narrow.
- **Promises**: No floating promises — always `await` or handle rejections.
- **Imports**: Use workspace package names (`@a5c-ai/babysitter-sdk`), never relative paths across package boundaries.
- **Variables**: Prefix unused variables with `_` (ESLint enforced).
- **Tests**: Use `*.test.ts` naming, co-located in `__tests__/` directories.
- **Circular deps**: No circular dependencies between packages.

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`.
2. **Make your changes** following the code style guidelines above.
3. **Add or update tests** to cover your changes.
4. **Run the tests** to make sure nothing is broken:
   ```bash
   npm run test:sdk
   npm run lint --workspace=@a5c-ai/babysitter-sdk
   ```
5. **Commit** with a clear message describing what changed and why.
6. **Open a pull request** against `main` with a description of your changes.

### Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Reference any related issues in the PR description (e.g., `Fixes #123`).
- Ensure all CI checks pass before requesting review.
- Respond to review comments promptly.

---

## Community

- **Discord**: [Join the community](https://discord.gg/dHGkzxf48a)
- **GitHub Issues**: [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/a5c-ai/babysitter/discussions)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
