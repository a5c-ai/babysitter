---
name: clap-scaffolder
description: Generate Clap-based Rust CLI applications with derive macros, subcommands, and modern Rust patterns. Creates production-ready Rust CLI with proper cargo structure.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Clap Scaffolder

Generate a complete Clap CLI application with Rust, derive macros, and best practices.

## Capabilities

- Generate Rust-based Clap CLI projects using derive macros
- Create subcommand hierarchies with nested enums
- Set up argument parsing with type validation
- Configure shell completion generation
- Implement colored output with anyhow error handling
- Set up cargo workspace and build configurations

## Usage

Invoke this skill when you need to:
- Bootstrap a new CLI application using Clap
- Create a Rust CLI with type-safe argument parsing
- Leverage derive macros for declarative command definitions
- Build fast, native cross-platform binaries

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| deriveFeatures | array | No | Clap derive features to enable |
| colorOutput | boolean | No | Enable colored output (default: true) |

### Command Structure

```json
{
  "commands": [
    {
      "name": "run",
      "description": "Run the application",
      "args": [
        { "name": "target", "help": "Target to run", "required": true }
      ],
      "options": [
        { "long": "watch", "short": "w", "help": "Watch for changes" },
        { "long": "port", "short": "p", "value_name": "PORT", "default": "3000" }
      ]
    }
  ]
}
```

## Output Structure

```
<projectName>/
├── Cargo.toml
├── Cargo.lock
├── README.md
├── .gitignore
├── src/
│   ├── main.rs              # Entry point
│   ├── cli.rs               # Clap definitions
│   ├── commands/
│   │   ├── mod.rs           # Command exports
│   │   └── <command>.rs     # Individual commands
│   ├── config.rs            # Configuration
│   └── error.rs             # Error types
├── tests/
│   └── cli.rs               # CLI integration tests
└── completions/
    ├── _<projectName>       # Zsh completions
    ├── <projectName>.bash   # Bash completions
    └── <projectName>.fish   # Fish completions
```

## Generated Code Patterns

### CLI Definition (src/cli.rs)

```rust
use clap::{Parser, Subcommand, Args};

#[derive(Parser)]
#[command(name = "<projectName>")]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    /// Enable verbose output
    #[arg(short, long, global = true)]
    pub verbose: bool,

    /// Configuration file path
    #[arg(short, long, global = true)]
    pub config: Option<PathBuf>,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Run the application
    Run(RunArgs),
    /// Build the project
    Build(BuildArgs),
    /// Generate shell completions
    Completions {
        /// Shell to generate completions for
        #[arg(value_enum)]
        shell: clap_complete::Shell,
    },
}

#[derive(Args)]
pub struct RunArgs {
    /// Target to run
    pub target: String,

    /// Watch for changes
    #[arg(short, long)]
    pub watch: bool,

    /// Port to use
    #[arg(short, long, default_value = "3000")]
    pub port: u16,
}
```

### Main Entry (src/main.rs)

```rust
use anyhow::Result;
use clap::Parser;
use colored::Colorize;

mod cli;
mod commands;
mod config;
mod error;

use cli::{Cli, Commands};

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Setup logging based on verbosity
    if cli.verbose {
        env_logger::Builder::from_env(
            env_logger::Env::default().default_filter_or("debug")
        ).init();
    }

    match cli.command {
        Commands::Run(args) => commands::run::execute(args)?,
        Commands::Build(args) => commands::build::execute(args)?,
        Commands::Completions { shell } => {
            generate_completions(shell);
        }
    }

    Ok(())
}
```

### Command Implementation

```rust
use anyhow::Result;
use colored::Colorize;

use crate::cli::RunArgs;

pub fn execute(args: RunArgs) -> Result<()> {
    println!("{} Running target: {}", "→".blue(), args.target.green());

    if args.watch {
        println!("{} Watch mode enabled", "!".yellow());
    }

    println!("{} Listening on port {}", "✓".green(), args.port);

    Ok(())
}
```

## Dependencies

```toml
[package]
name = "<projectName>"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4.4", features = ["derive", "env"] }
clap_complete = "4.4"
anyhow = "1.0"
thiserror = "1.0"
colored = "2.0"
env_logger = "0.10"
log = "0.4"

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.0"
```

## Workflow

1. **Validate inputs** - Check project name, commands structure
2. **Create directory structure** - Set up Rust project layout
3. **Generate Cargo.toml** - Configure dependencies and metadata
4. **Create CLI definition** - Clap derive structs
5. **Generate commands** - Individual command modules
6. **Create utilities** - Config, error handling
7. **Generate completions** - Shell completion scripts
8. **Set up tests** - CLI integration tests

## Best Practices Applied

- Derive macros for declarative definitions
- Anyhow for error handling
- Colored output for user feedback
- Environment variable support
- Built-in completion generation
- Cross-platform compatible

## References

- Clap Documentation: https://docs.rs/clap/
- Clap GitHub: https://github.com/clap-rs/clap
- Rust CLI Book: https://rust-cli.github.io/book/

## Target Processes

- cli-application-bootstrap
- argument-parser-setup
- shell-completion-scripts
