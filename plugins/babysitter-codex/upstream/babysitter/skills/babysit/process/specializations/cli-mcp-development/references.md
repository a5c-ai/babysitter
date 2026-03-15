# CLI and MCP Development - References

Comprehensive reference materials for Command Line Interface development, Model Context Protocol implementation, terminal applications, and developer tools.

## CLI Development Fundamentals

### Design Principles and Guidelines

- **GNU Coding Standards - Command Line Interfaces**: https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html
- **POSIX Utility Conventions**: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html
- **Command Line Interface Guidelines**: https://clig.dev/
- **12 Factor CLI Apps**: https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46
- **Heroku CLI Style Guide**: https://devcenter.heroku.com/articles/cli-style-guide

### Books

- **"Build Your Own Command Line with ANSI Escape Codes"** - Jamis Buck
- **"The Linux Command Line"** by William Shotts - https://linuxcommand.org/tlcl.php
- **"Data Science at the Command Line"** by Jeroen Janssens - https://datascienceatthecommandline.com/

## Argument Parsing Libraries

### Node.js/TypeScript

#### Commander.js
- **Overview**: Complete solution for node.js command-line interfaces
- **Documentation**: https://github.com/tj/commander.js
- **npm**: https://www.npmjs.com/package/commander
- **Features**:
  - Automatic help generation
  - Subcommand support
  - Option parsing with validation
  - TypeScript support

#### Yargs
- **Overview**: Yargs helps you build interactive command line tools
- **Documentation**: https://yargs.js.org/
- **npm**: https://www.npmjs.com/package/yargs
- **Features**:
  - Powerful option parsing
  - Command hierarchy
  - Middleware support
  - Completion scripts

#### Oclif
- **Overview**: Framework for building CLIs by Salesforce
- **Documentation**: https://oclif.io/
- **npm**: https://www.npmjs.com/package/@oclif/core
- **Features**:
  - Plugin architecture
  - Auto-documentation
  - Testing utilities
  - TypeScript-first

#### Meow
- **Overview**: CLI app helper
- **npm**: https://www.npmjs.com/package/meow
- **Features**: Minimal, focused on simplicity

#### Citty
- **Overview**: Elegant CLI builder by UnJS
- **Documentation**: https://github.com/unjs/citty
- **Features**: Modern, TypeScript-native, subcommands

### Python

#### Click
- **Overview**: Python composable command line interface toolkit
- **Documentation**: https://click.palletsprojects.com/
- **PyPI**: https://pypi.org/project/click/
- **Features**:
  - Decorator-based command definition
  - Automatic help generation
  - Nested commands
  - Parameter types and validation

#### Typer
- **Overview**: FastAPI for CLI, based on Click and type hints
- **Documentation**: https://typer.tiangolo.com/
- **PyPI**: https://pypi.org/project/typer/
- **Features**:
  - Type hint-based argument parsing
  - Automatic completion
  - Rich terminal output
  - Async support

#### Argparse
- **Overview**: Python standard library argument parser
- **Documentation**: https://docs.python.org/3/library/argparse.html
- **Features**:
  - No dependencies
  - Subparsers
  - Custom types and actions

#### Fire
- **Overview**: Automatically generate CLIs from Python objects
- **Documentation**: https://github.com/google/python-fire
- **PyPI**: https://pypi.org/project/fire/
- **Features**: Zero-config CLI from any Python object

### Go

#### Cobra
- **Overview**: Library for creating powerful modern CLI applications
- **Documentation**: https://cobra.dev/
- **GitHub**: https://github.com/spf13/cobra
- **Features**:
  - Nested subcommands
  - Intelligent suggestions
  - Automatic help
  - Shell completions

#### Viper
- **Overview**: Configuration management for Cobra
- **Documentation**: https://github.com/spf13/viper
- **Features**:
  - Environment variables
  - Config files (JSON, YAML, TOML)
  - Remote config
  - Live watching

#### urfave/cli
- **Overview**: Fast and fun way to build CLI apps in Go
- **Documentation**: https://cli.urfave.org/
- **GitHub**: https://github.com/urfave/cli

### Rust

#### Clap
- **Overview**: Command Line Argument Parser for Rust
- **Documentation**: https://docs.rs/clap/
- **GitHub**: https://github.com/clap-rs/clap
- **Features**:
  - Derive macros
  - Subcommands
  - Shell completions
  - Color output

## Model Context Protocol (MCP)

### Official Resources

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP Documentation**: https://modelcontextprotocol.io/
- **MCP GitHub Organization**: https://github.com/modelcontextprotocol
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Python SDK**: https://github.com/modelcontextprotocol/python-sdk

### SDK Documentation

#### TypeScript/Node.js SDK
- **npm**: https://www.npmjs.com/package/@modelcontextprotocol/sdk
- **API Reference**: https://modelcontextprotocol.io/docs/typescript-sdk
- **Getting Started**: https://modelcontextprotocol.io/docs/quickstart

#### Python SDK
- **PyPI**: https://pypi.org/project/mcp/
- **Documentation**: https://modelcontextprotocol.io/docs/python-sdk

### MCP Server Examples

- **Official MCP Servers Repository**: https://github.com/modelcontextprotocol/servers
- **Filesystem Server**: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- **GitHub Server**: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- **Postgres Server**: https://github.com/modelcontextprotocol/servers/tree/main/src/postgres

### MCP Architecture

- **Protocol Overview**: https://modelcontextprotocol.io/docs/concepts/architecture
- **Transport Layers**: https://modelcontextprotocol.io/docs/concepts/transports
- **Tools Definition**: https://modelcontextprotocol.io/docs/concepts/tools
- **Resources**: https://modelcontextprotocol.io/docs/concepts/resources
- **Prompts**: https://modelcontextprotocol.io/docs/concepts/prompts

## Terminal User Interface (TUI) Libraries

### Node.js/TypeScript

#### Ink
- **Overview**: React for interactive command-line apps
- **Documentation**: https://github.com/vadimdemedes/ink
- **npm**: https://www.npmjs.com/package/ink
- **Features**:
  - React components for CLI
  - Flexbox layout
  - Focus management
  - Testing utilities

#### Blessed
- **Overview**: Curses-like library with high-level terminal interface
- **Documentation**: https://github.com/chjj/blessed
- **npm**: https://www.npmjs.com/package/blessed
- **Features**:
  - Full-screen applications
  - Mouse support
  - Unicode support
  - Shadow DOM

#### Blessed-contrib
- **Overview**: Build terminal dashboards with blessed
- **GitHub**: https://github.com/yaronn/blessed-contrib
- **Features**: Graphs, charts, tables, maps

### Python

#### Textual
- **Overview**: TUI framework for Python inspired by modern web development
- **Documentation**: https://textual.textualize.io/
- **PyPI**: https://pypi.org/project/textual/
- **Features**:
  - CSS-like styling
  - Widget system
  - Async support
  - DevTools

#### Rich
- **Overview**: Python library for rich text and beautiful formatting
- **Documentation**: https://rich.readthedocs.io/
- **PyPI**: https://pypi.org/project/rich/
- **Features**:
  - Syntax highlighting
  - Tables, panels, markdown
  - Progress bars
  - Logging handler

#### Prompt Toolkit
- **Overview**: Library for building powerful interactive command lines
- **Documentation**: https://python-prompt-toolkit.readthedocs.io/
- **Features**:
  - Auto-completion
  - Syntax highlighting
  - Multi-line editing
  - Vi/Emacs key bindings

### Go

#### Bubble Tea
- **Overview**: TUI framework based on The Elm Architecture
- **Documentation**: https://github.com/charmbracelet/bubbletea
- **Features**:
  - Elm-inspired architecture
  - Testable
  - Composable components

#### Lip Gloss
- **Overview**: Style definitions for Bubble Tea
- **Documentation**: https://github.com/charmbracelet/lipgloss
- **Features**: CSS-like styling for terminals

#### Bubbles
- **Overview**: TUI components for Bubble Tea
- **Documentation**: https://github.com/charmbracelet/bubbles
- **Features**: Spinners, text inputs, viewports, lists

#### Charm Libraries
- **Homepage**: https://charm.sh/
- **Glow**: Markdown reader - https://github.com/charmbracelet/glow
- **Glamour**: Markdown rendering - https://github.com/charmbracelet/glamour

### Rust

#### Ratatui
- **Overview**: Library for building terminal user interfaces
- **Documentation**: https://ratatui.rs/
- **GitHub**: https://github.com/ratatui-org/ratatui

#### Crossterm
- **Overview**: Cross-platform terminal manipulation library
- **Documentation**: https://docs.rs/crossterm/
- **GitHub**: https://github.com/crossterm-rs/crossterm

## CLI Output and Formatting

### Colors and Styling

#### Node.js
- **Chalk**: https://github.com/chalk/chalk
- **Kleur**: https://github.com/lukeed/kleur (smaller alternative)
- **Picocolors**: https://github.com/alexeyraspopov/picocolors (minimal)

#### Python
- **Colorama**: https://pypi.org/project/colorama/
- **Termcolor**: https://pypi.org/project/termcolor/
- **Rich**: https://rich.readthedocs.io/ (comprehensive)

#### Go
- **Fatih/color**: https://github.com/fatih/color
- **Gookit/color**: https://github.com/gookit/color

### Progress Indicators

#### Node.js
- **Ora**: Spinners - https://github.com/sindresorhus/ora
- **cli-progress**: Progress bars - https://github.com/npkgz/cli-progress
- **Listr2**: Task lists - https://github.com/listr2/listr2
- **Progress**: Simple progress bar - https://github.com/visionmedia/node-progress

#### Python
- **tqdm**: Progress bars - https://tqdm.github.io/
- **alive-progress**: Animated progress - https://github.com/rsalmei/alive-progress
- **Halo**: Spinners - https://github.com/manrajgrover/halo

#### Go
- **schollz/progressbar**: https://github.com/schollz/progressbar
- **cheggaaa/pb**: https://github.com/cheggaaa/pb

### Tables and Structured Output

#### Node.js
- **cli-table3**: https://github.com/cli-table/cli-table3
- **console-table-printer**: https://github.com/nicknisi/console-table-printer
- **Table**: https://github.com/gajus/table

#### Python
- **Tabulate**: https://pypi.org/project/tabulate/
- **PrettyTable**: https://pypi.org/project/prettytable/
- **Rich tables**: https://rich.readthedocs.io/en/stable/tables.html

#### Go
- **tablewriter**: https://github.com/olekukonko/tablewriter
- **go-pretty**: https://github.com/jedib0t/go-pretty

## Interactive Prompts

### Node.js
- **Inquirer.js**: https://github.com/SBoudrias/Inquirer.js
- **Enquirer**: https://github.com/enquirer/enquirer
- **Prompts**: https://github.com/terkelg/prompts

### Python
- **Questionary**: https://github.com/tmbo/questionary
- **InquirerPy**: https://github.com/kazhala/InquirerPy
- **Pick**: https://github.com/wong2/pick

### Go
- **Survey**: https://github.com/AlecAivazis/survey
- **Promptui**: https://github.com/manifoldco/promptui
- **Huh**: https://github.com/charmbracelet/huh

## Shell Scripting

### Bash/Shell References

- **Bash Reference Manual**: https://www.gnu.org/software/bash/manual/
- **POSIX Shell Specification**: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html
- **ShellCheck**: Static analysis - https://www.shellcheck.net/
- **Bash Hackers Wiki**: https://wiki.bash-hackers.org/
- **Pure Bash Bible**: https://github.com/dylanaraps/pure-bash-bible

### Shell Script Testing

- **Bats**: Bash testing framework - https://github.com/bats-core/bats-core
- **ShellSpec**: BDD testing - https://shellspec.info/
- **Shunit2**: xUnit for shell - https://github.com/kward/shunit2

### Shell Utilities

- **ShellJS**: Unix commands in Node.js - https://github.com/shelljs/shelljs
- **Zx**: Google's script writing - https://github.com/google/zx
- **Bun Shell**: Bun's shell API - https://bun.sh/docs/runtime/shell

## CLI Testing

### Testing Frameworks

#### Node.js
- **oclif/test**: Testing for oclif CLIs - https://github.com/oclif/test
- **mock-stdin**: Mock stdin - https://github.com/caitp/node-mock-stdin
- **stdout-stderr**: Capture output - https://github.com/jdx/stdout-stderr

#### Python
- **Click Testing**: https://click.palletsprojects.com/en/8.1.x/testing/
- **Typer Testing**: https://typer.tiangolo.com/tutorial/testing/
- **pytest-console-scripts**: https://github.com/kvas-it/pytest-console-scripts

#### Go
- **Cobra Testing**: https://github.com/spf13/cobra#testing

### Snapshot Testing

- **Jest Snapshots**: https://jestjs.io/docs/snapshot-testing
- **Insta (Rust)**: https://insta.rs/

## CLI Distribution and Packaging

### Multi-Platform Binaries

#### Node.js
- **pkg**: Package Node.js into executable - https://github.com/vercel/pkg
- **nexe**: Create single executable - https://github.com/nexe/nexe
- **caxa**: Package for distribution - https://github.com/leafac/caxa
- **ncc**: Simple Node.js compiler - https://github.com/vercel/ncc

#### Python
- **PyInstaller**: https://pyinstaller.org/
- **cx_Freeze**: https://cx-freeze.readthedocs.io/
- **Nuitka**: Python compiler - https://nuitka.net/
- **Shiv**: Zipapps - https://github.com/linkedin/shiv

#### Go
- **goreleaser**: Release automation - https://goreleaser.com/
- **go build**: Native cross-compilation

### Package Managers

- **npm**: Node.js packages - https://www.npmjs.com/
- **PyPI**: Python packages - https://pypi.org/
- **Homebrew**: macOS/Linux - https://brew.sh/
- **Chocolatey**: Windows - https://chocolatey.org/
- **Scoop**: Windows - https://scoop.sh/
- **winget**: Windows Package Manager - https://github.com/microsoft/winget-cli
- **Snapcraft**: Linux snaps - https://snapcraft.io/

### Documentation Generation

- **oclif README generation**: https://oclif.io/docs/commands#readme-generation
- **Cobra doc generation**: https://github.com/spf13/cobra/blob/main/doc/README.md
- **Click documentation**: https://click.palletsprojects.com/en/8.1.x/documentation/
- **Man page generation**: Various tools per language

## Terminal Protocols and Standards

### ANSI Escape Codes

- **ANSI Escape Sequences**: https://en.wikipedia.org/wiki/ANSI_escape_code
- **XTerm Control Sequences**: https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
- **Terminal Codes Reference**: https://wiki.bash-hackers.org/scripting/terminalcodes

### Terminal Emulators

- **VT100 Reference**: https://vt100.net/
- **Terminal Capabilities Database**: https://invisible-island.net/ncurses/ncurses.html

### Cross-Platform Terminal

- **Supports-color**: Detect color support - https://github.com/chalk/supports-color
- **Is-unicode-supported**: Unicode detection - https://github.com/sindresorhus/is-unicode-supported
- **Terminal-link**: Clickable links - https://github.com/sindresorhus/terminal-link

## Developer Tools CLI Examples

### Notable CLIs for Inspiration

- **GitHub CLI (gh)**: https://cli.github.com/
- **Vercel CLI**: https://vercel.com/docs/cli
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Fly.io CLI (flyctl)**: https://fly.io/docs/flyctl/
- **Deno CLI**: https://deno.land/manual/tools
- **npm CLI**: https://docs.npmjs.com/cli
- **Docker CLI**: https://docs.docker.com/engine/reference/commandline/cli/
- **kubectl**: https://kubernetes.io/docs/reference/kubectl/
- **AWS CLI**: https://aws.amazon.com/cli/
- **gcloud CLI**: https://cloud.google.com/sdk/gcloud
- **Azure CLI**: https://docs.microsoft.com/en-us/cli/azure/

## Community Resources

### Forums and Discussions

- **CLI Development Reddit**: https://www.reddit.com/r/commandline/
- **Terminal Enthusiasts**: https://www.reddit.com/r/unixporn/
- **DevOps/CLI discussions**: Various Discord servers

### Conferences and Talks

- **Charm Blog**: https://charm.sh/blog/
- **Console.dev**: https://console.dev/

### Newsletters

- **Console Weekly**: CLI and developer tools - https://console.dev/
- **Terminal Trove**: https://terminaltrove.com/

## Security Considerations

### Input Validation

- **OWASP Command Injection**: https://owasp.org/www-community/attacks/Command_Injection
- **Shell Injection Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html

### Secure Coding

- **Secure Shell Scripting**: https://wiki.bash-hackers.org/howto/security
- **Node.js Security Best Practices**: https://nodejs.org/en/docs/guides/security/

---

**Last Updated**: 2026-01-24
**Version**: 1.0.0
