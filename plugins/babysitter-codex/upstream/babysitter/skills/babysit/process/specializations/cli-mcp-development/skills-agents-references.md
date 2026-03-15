# CLI and MCP Development - Skills and Agents References

This document provides links to community-created Claude skills, agents, plugins, MCP servers, and related tools that match the skills and agents identified in the backlog for the CLI and MCP Development specialization.

---

## Phase 5: External Resources and References

### Table of Contents

1. [MCP Development Resources](#1-mcp-development-resources)
2. [CLI Framework Resources](#2-cli-framework-resources)
3. [Terminal UI Resources](#3-terminal-ui-resources)
4. [Shell Scripting Resources](#4-shell-scripting-resources)
5. [Configuration Management Resources](#5-configuration-management-resources)
6. [Distribution and Packaging Resources](#6-distribution-and-packaging-resources)
7. [Testing Resources](#7-testing-resources)
8. [Plugin Architecture Resources](#8-plugin-architecture-resources)
9. [Claude Skills and Plugins](#9-claude-skills-and-plugins)
10. [Cross-Platform Resources](#10-cross-platform-resources)

---

## 1. MCP Development Resources

### Official MCP SDKs and Tools

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| MCP TypeScript SDK | Official TypeScript SDK for MCP servers and clients (11.4k stars) | https://github.com/modelcontextprotocol/typescript-sdk | S013 |
| MCP Python SDK | Official Python SDK for MCP (21.3k stars) | https://github.com/modelcontextprotocol/python-sdk | S014 |
| MCP Go SDK | Official Go SDK for MCP | https://github.com/modelcontextprotocol/go-sdk | S013-S021 |
| MCP Rust SDK | Official Rust SDK (2.9k stars) | https://github.com/modelcontextprotocol/rust-sdk | S013-S021 |
| MCP Java SDK | Java SDK with Spring AI collaboration (3.1k stars) | https://github.com/modelcontextprotocol/java-sdk | S013-S021 |
| MCP Inspector | Visual testing tool for MCP servers (8.4k stars) | https://github.com/modelcontextprotocol/inspector | S021 |
| MCP Specification | Protocol specification and documentation | https://github.com/modelcontextprotocol/modelcontextprotocol | S013-S021 |
| MCP Registry | Community-driven registry for MCP servers | https://github.com/modelcontextprotocol/registry | S016 |

### MCP Reference Servers

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| MCP Servers Repository | Official reference implementations | https://github.com/modelcontextprotocol/servers | S013-S021 |
| Filesystem Server | Secure file operations with configurable access | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem | S016 |
| Git Server | Tools to read, search, and manipulate Git repos | https://github.com/modelcontextprotocol/servers/tree/main/src/git | S016 |
| Memory Server | Knowledge graph-based persistent memory | https://github.com/modelcontextprotocol/servers/tree/main/src/memory | S016 |
| Fetch Server | Web content fetching and conversion | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch | S016 |
| Sequential Thinking | Dynamic problem-solving through thought sequences | https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking | S015 |

### Community MCP Servers

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| GitHub MCP Server | Official GitHub integration for MCP | https://github.com/github/github-mcp-server | S016, S017 |
| Microsoft MCP Servers | Azure, Azure DevOps, AKS integrations | https://github.com/microsoft/mcp | S016-S018 |
| Postgres MCP Pro | PostgreSQL with performance analysis | https://github.com/crystaldba/postgres-mcp | S016 |
| PostgreSQL MCP Server | 14 consolidated database management tools | https://github.com/HenkDz/postgresql-mcp-server | S016 |
| Claude Code MCP | Claude Code as MCP server | https://github.com/auchenberg/claude-code-mcp | S013-S021 |
| Claude Context MCP | Code search MCP for Claude Code | https://github.com/zilliztech/claude-context | S016 |
| AWS Aurora Postgres MCP | Amazon Aurora PostgreSQL integration | https://awslabs.github.io/mcp/servers/postgres-mcp-server | S016 |

### MCP Development Guides

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| MCP Documentation | Official protocol documentation | https://modelcontextprotocol.io/ | S013-S021, A004-A007 |
| MCP Example Servers | Official example implementations | https://modelcontextprotocol.io/examples | S013-S021 |
| MCP Inspector Guide | How to use MCP Inspector | https://modelcontextprotocol.io/docs/tools/inspector | S021 |

---

## 2. CLI Framework Resources

### JavaScript/TypeScript CLI Frameworks

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Commander.js | Complete solution for node.js CLI | https://github.com/tj/commander.js | S001 |
| Yargs | Interactive command line tools | https://github.com/yargs/yargs | S002 |
| oclif | Open CLI Framework by Salesforce | https://github.com/oclif/oclif | S006 |
| oclif CLI | CLI for generating oclif applications | https://github.com/oclif/oclif | S006 |
| Gluegun | Toolkit for building TypeScript CLIs | https://github.com/infinitered/gluegun | S001-S007 |
| Clipanion | Type-safe CLI library (used by Yarn) | https://github.com/arcanis/clipanion | S001-S007 |
| Stricli | Type-safe CLI framework by Bloomberg | https://github.com/bloomberg/stricli | S001-S007 |

### Python CLI Frameworks

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Click | Composable command line interface toolkit | https://github.com/pallets/click | S003 |
| Typer | FastAPI for CLIs (built on Click) | https://github.com/tiangolo/typer | S003 |
| argparse | Built-in Python argument parser | https://docs.python.org/3/library/argparse.html | S007 |
| Fire | Automatically generate CLIs from objects | https://github.com/google/python-fire | S003, S007 |

### Go CLI Frameworks

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Cobra | Commander for modern Go CLI | https://github.com/spf13/cobra | S004 |
| Cobra CLI | Tool to generate Cobra applications | https://github.com/spf13/cobra-cli | S004 |
| Viper | Configuration solution for Go | https://github.com/spf13/viper | S004, S043 |
| Kong | Command-line parser for Go | https://github.com/alecthomas/kong | S004 |

### Rust CLI Frameworks

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Clap | Command Line Argument Parser for Rust | https://github.com/clap-rs/clap | S005 |
| clap_complete | Shell completion generation for Clap | https://github.com/clap-rs/clap/tree/master/clap_complete | S005, S010 |

### CLI Framework Comparisons

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Awesome CLI Frameworks | Collection of CLI tools by language | https://github.com/shadawck/awesome-cli-frameworks | S001-S007, A001 |

---

## 3. Terminal UI Resources

### JavaScript/TypeScript TUI

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Ink | React for interactive CLI apps | https://github.com/vadimdemedes/ink | S022 |
| Ink UI | UI components for Ink | https://github.com/vadimdemedes/ink-ui | S022 |
| Blessed | Curses-like terminal interface | https://github.com/chjj/blessed | S025 |
| neo-blessed | Maintained fork of blessed | https://github.com/embarklabs/neo-blessed | S025 |

### Go TUI

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Bubble Tea | Functional TUI framework | https://github.com/charmbracelet/bubbletea | S023 |
| Bubbles | TUI components for Bubble Tea | https://github.com/charmbracelet/bubbles | S023 |
| Lip Gloss | Style definitions for terminal UIs | https://github.com/charmbracelet/lipgloss | S023 |

### Python TUI

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Textual | TUI framework for Python | https://github.com/Textualize/textual | S024 |
| Rich | Rich text and formatting in terminal | https://github.com/Textualize/rich | S024, S029 |
| pyTermTk | Python Terminal Toolkit | https://github.com/ceccopierangiolieugenio/pyTermTk | S024 |

### Rust TUI

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Ratatui | Terminal user interfaces in Rust | https://github.com/ratatui-org/ratatui | S022-S025 |
| iocraft | Declarative TUI library for Rust | https://github.com/ccbrown/iocraft | S022-S025 |

### Interactive Prompts and Progress

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Inquirer.js | Interactive command line prompts | https://github.com/SBoudrias/Inquirer.js | S028 |
| @inquirer/prompts | Modern Inquirer.js API | https://www.npmjs.com/package/@inquirer/prompts | S028 |
| Enquirer | Stylish CLI prompts | https://github.com/enquirer/enquirer | S028 |
| Ora | Elegant terminal spinners | https://github.com/sindresorhus/ora | S026 |
| cli-progress | Progress bars for CLI | https://github.com/npkgz/cli-progress | S027 |
| Chalk | Terminal string styling | https://github.com/chalk/chalk | S029 |
| cli-table3 | Unicode tables for CLI | https://github.com/cli-table/cli-table3 | S030 |

### Awesome TUI Lists

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Awesome TUIs | List of TUI projects | https://github.com/rothgar/awesome-tuis | S022-S030, A008-A010 |

---

## 4. Shell Scripting Resources

### Shell Testing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Bats-core | Bash Automated Testing System | https://github.com/bats-core/bats-core | S034 |
| bash_shell_mock | Shell script mocking for BATS | https://github.com/capitalone/bash_shell_mock | S034 |
| ShellSpec | BDD testing for shell scripts | https://github.com/shellspec/shellspec | S034 |

### Shell Linting and Quality

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| ShellCheck | Static analysis for shell scripts | https://github.com/koalaman/shellcheck | S032, S033 |
| ShellCheck Online | Web-based shell script analysis | https://www.shellcheck.net/ | S032, S033 |

### Shell Completion

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| zsh-autosuggestions | Fish-like suggestions for zsh | https://github.com/zsh-users/zsh-autosuggestions | S010 |
| git-flow-completion | Bash/Zsh/Fish completion for git-flow | https://github.com/bobthecow/git-flow-completion | S010 |
| Carapace | Completions for 1000+ commands | https://github.com/carapace-sh/carapace-bin | S010, A013 |
| complete-alias | Completion for bash aliases | https://github.com/cykerway/complete-alias | S010 |

---

## 5. Configuration Management Resources

### Configuration Loading

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| cosmiconfig | Find and load configuration | https://github.com/cosmiconfig/cosmiconfig | S042 |
| Cosmic | cosmiconfig with env var fallback | https://github.com/AnandChowdhary/cosmic | S042, S044 |
| dotenv | Load environment variables | https://github.com/motdotla/dotenv | S044 |
| Saffron | Yargs + Cosmiconfig for CLIs | https://github.com/darkobits/saffron | S042, S002 |
| Configuru | Multiple-environment config manager | https://github.com/AckeeCZ/configuru | S042-S047 |

### Go Configuration

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Viper | Complete configuration solution | https://github.com/spf13/viper | S043 |

### Schema Validation

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Zod | TypeScript-first schema validation | https://github.com/colinhacks/zod | S045 |
| Yup | JavaScript schema validation | https://github.com/jquense/yup | S045 |
| Ajv | JSON Schema validator | https://github.com/ajv-validator/ajv | S045 |

---

## 6. Distribution and Packaging Resources

### Node.js Binary Distribution

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| pkg (Vercel) | Package Node.js into executables | https://github.com/vercel/pkg | S048 |
| pkg (Tetrate fork) | Maintained fork of pkg | https://github.com/tetratelabs/node-pkg | S048 |
| nexe | Compile Node.js apps to executable | https://github.com/nexe/nexe | S048 |

### Python Binary Distribution

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| PyInstaller | Bundle Python apps into executables | https://github.com/pyinstaller/pyinstaller | S049 |
| cx_Freeze | Create standalone executables | https://github.com/marcelotduarte/cx_Freeze | S049 |

### Go Release Automation

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| GoReleaser | Release automation for Go | https://github.com/goreleaser/goreleaser | S050 |
| GoReleaser Action | GitHub Action for GoReleaser | https://github.com/goreleaser/goreleaser-action | S050 |

### Package Manager Publishing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Homebrew | Package manager for macOS/Linux | https://github.com/Homebrew/brew | S051 |
| Homebrew Tap Guide | Creating Homebrew formulas | https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap | S051 |
| Scoop | Windows command-line installer | https://github.com/ScoopInstaller/Scoop | S053 |
| Chocolatey | Windows package manager | https://github.com/chocolatey/choco | S054 |
| winget-cli | Windows Package Manager | https://github.com/microsoft/winget-cli | S053, S054 |
| WinGet Manifest Creator | Tool to create winget manifests | https://github.com/microsoft/winget-create | S053 |
| UniGetUI | Unified GUI for package managers | https://github.com/marticliment/UniGetUI | S053, S054 |

### Code Signing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Apple Developer Codesigning | macOS code signing guide | https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/ | S055 |
| SignTool | Windows code signing tool | https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool | S055 |

---

## 7. Testing Resources

### CLI Testing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| oclif/test | Testing utilities for oclif | https://github.com/oclif/test | S056, S059 |
| jest-mock-stdin | Mock stdin for Jest tests | https://github.com/axetroy/jest-mock-stdin | S057 |
| mock-stdin | Mock process.stdin | https://github.com/caitp/node-mock-stdin | S057 |

### MCP Testing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| MCP Inspector | Visual testing for MCP servers | https://github.com/modelcontextprotocol/inspector | S058, A018 |
| MCP Conformance | Conformance tests for MCP | https://github.com/modelcontextprotocol/conformance | S058 |

### Snapshot Testing

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| Jest Snapshots | Snapshot testing in Jest | https://jestjs.io/docs/snapshot-testing | S056 |
| Vitest Snapshots | Snapshot testing in Vitest | https://vitest.dev/guide/snapshot.html | S056 |

---

## 8. Plugin Architecture Resources

### Plugin Systems

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| oclif Plugins | Plugin architecture for oclif | https://oclif.io/docs/plugins | S061-S065, A020 |
| Pluggy | Plugin system for Python | https://github.com/pytest-dev/pluggy | S061-S065 |

### Sandboxing and Security

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| isolated-vm | Secure JS environments for Node.js | https://github.com/laverdet/isolated-vm | S063 |
| vm2 (deprecated) | Advanced vm/sandbox (migrate to isolated-vm) | https://github.com/patriksimek/vm2 | S063 |
| vm2-fixed | Transitional fork of vm2 | https://github.com/sanyamkamat/vm2-fixed | S063 |

---

## 9. Claude Skills and Plugins

### Awesome Collections

| Resource | Description | URL | Related Skills/Agents |
|----------|-------------|-----|----------------------|
| Awesome Claude Code Plugins | Official curated plugin collection | https://github.com/ccplugins/awesome-claude-code-plugins | All |
| Awesome Claude Skills (travisvn) | Claude Skills resources | https://github.com/travisvn/awesome-claude-skills | All |
| Awesome Claude Skills (ComposioHQ) | Claude workflows and tools | https://github.com/ComposioHQ/awesome-claude-skills | All |
| Awesome Claude Skills (VoltAgent) | Collection of Claude Skills | https://github.com/VoltAgent/awesome-claude-skills | All |
| Awesome Claude Code (jqueryscript) | Tools and integrations | https://github.com/jqueryscript/awesome-claude-code | All |
| Awesome Claude Code (hesreallyhim) | Skills, hooks, slash-commands | https://github.com/hesreallyhim/awesome-claude-code | All |
| Awesome Claude Plugins (quemsah) | Plugin adoption metrics | https://github.com/quemsah/awesome-claude-plugins | All |
| Awesome Claude (karanb192) | 50+ verified skills | https://github.com/karanb192/awesome-claude-skills | All |
| Awesome Claude Directory | Curated AI resources | https://awesomeclaude.ai | All |

### Claude Code Specific

| Resource | Description | URL | Related Skills/Agents |
|----------|-------------|-----|----------------------|
| Claude Code Showcase | Comprehensive project configuration | https://github.com/ChrisWiles/claude-code-showcase | All |
| Claude Code Plugins Dev | Plugin discovery documentation | https://code.claude.com/docs/en/discover-plugins | S061-S065 |

---

## 10. Cross-Platform Resources

### Path Handling

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| path (Node.js) | Cross-platform path handling | https://nodejs.org/api/path.html | S037 |
| upath | Universal path manipulation | https://github.com/anodynos/upath | S037 |
| slash | Convert Windows paths to Unix | https://github.com/sindresorhus/slash | S037 |

### Terminal Detection

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| supports-color | Detect terminal color support | https://github.com/chalk/supports-color | S038 |
| is-unicode-supported | Check Unicode support | https://github.com/sindresorhus/is-unicode-supported | S038 |
| term-size | Get terminal size | https://github.com/sindresorhus/term-size | S038 |
| is-interactive | Check if stdin/stdout is interactive | https://github.com/sindresorhus/is-interactive | S038 |

### Environment Variables

| Resource | Description | URL | Related Skills |
|----------|-------------|-----|----------------|
| cross-env | Cross-platform env vars | https://github.com/kentcdodds/cross-env | S041 |
| env-cmd | Execute with env from file | https://github.com/toddbluhm/env-cmd | S041 |

---

## Skills-to-Resources Mapping Summary

| Skill ID | Skill Name | Primary Resources |
|----------|------------|-------------------|
| S001 | commander-js-scaffolder | Commander.js, oclif |
| S002 | yargs-scaffolder | Yargs, Saffron |
| S003 | click-scaffolder | Click, Typer |
| S004 | cobra-scaffolder | Cobra, Viper |
| S005 | clap-scaffolder | Clap, clap_complete |
| S006 | oclif-scaffolder | oclif |
| S007 | argparse-scaffolder | argparse, Fire |
| S008-S012 | Argument parsing | Zod, Yup, completion tools |
| S013 | mcp-sdk-typescript-bootstrapper | MCP TypeScript SDK |
| S014 | mcp-sdk-python-bootstrapper | MCP Python SDK |
| S015-S021 | MCP tools | MCP servers, Inspector |
| S022 | ink-component-generator | Ink, Ink UI |
| S023 | bubble-tea-scaffolder | Bubble Tea, Bubbles |
| S024 | textual-scaffolder | Textual, Rich |
| S025 | blessed-widget-generator | Blessed, neo-blessed |
| S026-S030 | CLI output | Ora, cli-progress, Chalk |
| S031-S036 | Shell scripting | Bats-core, ShellCheck |
| S037-S041 | Cross-platform | cross-env, supports-color |
| S042-S047 | Configuration | cosmiconfig, Viper, dotenv |
| S048-S055 | Distribution | pkg, GoReleaser, Homebrew |
| S056-S060 | Testing | Jest, MCP Inspector |
| S061-S065 | Plugin architecture | oclif plugins, isolated-vm |

---

## Agents-to-Resources Mapping Summary

| Agent ID | Agent Name | Primary Resources |
|----------|------------|-------------------|
| A001 | cli-ux-architect | Commander.js, Click, Cobra docs |
| A002 | argument-schema-designer | Zod, Yup, JSON Schema |
| A003 | cli-error-message-expert | Chalk, error handling guides |
| A004 | mcp-protocol-expert | MCP Documentation, SDKs |
| A005 | mcp-tool-designer | MCP specification, JSON Schema |
| A006 | mcp-security-auditor | MCP security docs, isolated-vm |
| A007 | mcp-transport-architect | MCP transport docs, SDKs |
| A008 | tui-component-architect | Ink, Bubble Tea, Textual |
| A009 | terminal-accessibility-expert | Rich, accessibility guides |
| A010 | dashboard-designer | Bubble Tea, blessed dashboards |
| A011 | shell-portability-expert | ShellCheck, POSIX guides |
| A012 | shell-security-auditor | ShellCheck, security guides |
| A013 | completion-script-expert | Carapace, clap_complete |
| A014 | binary-packaging-expert | pkg, PyInstaller, GoReleaser |
| A015 | package-manager-publisher | Homebrew, npm, Chocolatey |
| A016 | release-automation-expert | GoReleaser, semantic-release |
| A017 | cli-testing-architect | Bats-core, oclif/test |
| A018 | mcp-testing-expert | MCP Inspector, Conformance |
| A019 | config-system-architect | cosmiconfig, Viper |
| A020 | plugin-system-architect | oclif plugins, Pluggy |
| A021 | cli-docs-writer | Documentation tools |
| A022 | mcp-tool-documenter | MCP documentation guides |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total References Found** | 127 |
| **MCP Development Resources** | 23 |
| **CLI Framework Resources** | 18 |
| **Terminal UI Resources** | 22 |
| **Shell Scripting Resources** | 9 |
| **Configuration Resources** | 11 |
| **Distribution Resources** | 17 |
| **Testing Resources** | 8 |
| **Plugin Architecture Resources** | 6 |
| **Claude Skills/Plugins Collections** | 10 |
| **Cross-Platform Resources** | 10 |
| **Categories Covered** | 10 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - External Resources Identified
**Previous Step**: Phase 4 - Skills/Agents Backlog
**Next Step**: Phase 6 - Implementation of high-priority skills and agents
