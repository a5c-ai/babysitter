# Shell Completion Generator Skill

Generate intelligent shell completion scripts for bash, zsh, and fish from CLI command definitions.

## Overview

Shell completions dramatically improve CLI usability by providing intelligent suggestions as users type. This skill generates completion scripts for all major shells from a unified command definition format.

## When to Use

- Adding tab completion to a CLI application
- Supporting multiple shells (bash, zsh, fish)
- Creating dynamic completions with runtime values
- Improving CLI developer experience

## Quick Start

### Basic CLI

```json
{
  "cliName": "myapp",
  "commands": [
    {
      "name": "build",
      "description": "Build the project",
      "options": [
        { "flags": ["-o", "--output"], "description": "Output directory", "type": "directory" },
        { "flags": ["--release"], "description": "Build in release mode", "type": "flag" }
      ]
    },
    {
      "name": "test",
      "description": "Run tests",
      "options": [
        { "flags": ["--coverage"], "description": "Generate coverage report" }
      ]
    }
  ]
}
```

### Complex CLI with Subcommands

```json
{
  "cliName": "cloudctl",
  "commands": [
    {
      "name": "cluster",
      "description": "Manage clusters",
      "subcommands": [
        {
          "name": "create",
          "description": "Create a new cluster",
          "options": [
            { "flags": ["-n", "--name"], "description": "Cluster name", "required": true },
            { "flags": ["-r", "--region"], "description": "AWS region", "type": "choice", "choices": ["us-east-1", "us-west-2", "eu-west-1"] },
            { "flags": ["-s", "--size"], "description": "Node count", "type": "number" }
          ]
        },
        {
          "name": "delete",
          "description": "Delete a cluster",
          "arguments": [
            { "name": "name", "description": "Cluster name", "type": "dynamic", "source": "clusters" }
          ]
        },
        {
          "name": "scale",
          "description": "Scale cluster nodes",
          "arguments": [
            { "name": "cluster", "description": "Cluster name", "type": "dynamic", "source": "clusters" }
          ],
          "options": [
            { "flags": ["--nodes"], "description": "Target node count", "type": "number" }
          ]
        }
      ]
    },
    {
      "name": "deploy",
      "description": "Deploy application",
      "options": [
        { "flags": ["-f", "--file"], "description": "Deployment file", "type": "file", "extensions": [".yaml", ".yml"] },
        { "flags": ["--cluster"], "description": "Target cluster", "type": "dynamic", "source": "clusters" },
        { "flags": ["--dry-run"], "description": "Preview changes" }
      ]
    }
  ],
  "dynamic": {
    "clusters": {
      "command": "cloudctl cluster list --format name",
      "cache": 30
    }
  }
}
```

## Generated Output

```
completions/
├── bash/
│   └── cloudctl.bash
├── zsh/
│   └── _cloudctl
├── fish/
│   └── cloudctl.fish
└── install.sh
```

## Completion Types

### Static Choices

```json
{
  "flags": ["--format"],
  "description": "Output format",
  "type": "choice",
  "choices": ["json", "yaml", "table", "csv"]
}
```

Generates:
- Bash: `COMPREPLY=($(compgen -W "json yaml table csv" -- "${cur}"))`
- Zsh: `'--format[Output format]:format:(json yaml table csv)'`
- Fish: `complete -c mycli -l format -xa 'json yaml table csv'`

### File Completions

```json
{
  "flags": ["--config"],
  "description": "Configuration file",
  "type": "file",
  "extensions": [".json", ".yaml"]
}
```

Generates:
- Bash: `_filedir '@(json|yaml)'`
- Zsh: `'--config[Configuration file]:config:_files -g "*.{json,yaml}"'`
- Fish: `complete -c mycli -l config -rF`

### Directory Completions

```json
{
  "flags": ["--output"],
  "description": "Output directory",
  "type": "directory"
}
```

Generates:
- Bash: `_filedir -d`
- Zsh: `'--output[Output directory]:directory:_directories'`
- Fish: `complete -c mycli -l output -xa '(__fish_complete_directories)'`

### Dynamic Completions

```json
{
  "name": "cluster",
  "description": "Target cluster",
  "type": "dynamic",
  "source": "clusters"
}
```

With dynamic source:
```json
{
  "dynamic": {
    "clusters": {
      "command": "cloudctl cluster list --quiet",
      "cache": 60,
      "description": "Available clusters"
    }
  }
}
```

## Shell-Specific Features

### Bash
- `_init_completion` for word splitting
- `compgen` for generating matches
- `_filedir` for file/directory completion
- Function-based completion

### Zsh
- Description support in completions
- Grouped completions with `_describe`
- State machine for subcommands
- File globbing patterns

### Fish
- Built-in subcommand detection
- Condition-based completions
- Function integration
- No caching required (re-evaluated)

## Installation

### Manual Installation

```bash
# Bash
cp completions/bash/myapp.bash ~/.local/share/bash-completion/completions/myapp

# Zsh
cp completions/zsh/_myapp ~/.zfunc/
# Add to .zshrc: fpath=(~/.zfunc $fpath); autoload -Uz compinit && compinit

# Fish
cp completions/fish/myapp.fish ~/.config/fish/completions/
```

### Using Install Script

```bash
./completions/install.sh all      # Install for all shells
./completions/install.sh bash     # Bash only
./completions/install.sh zsh      # Zsh only
./completions/install.sh fish     # Fish only
```

### Package Integration

For npm packages:
```json
{
  "scripts": {
    "postinstall": "node scripts/install-completions.js"
  }
}
```

## Testing Completions

### Bash
```bash
source completions/bash/myapp.bash
myapp <TAB><TAB>
```

### Zsh
```zsh
source completions/zsh/_myapp
myapp <TAB>
```

### Fish
```fish
source completions/fish/myapp.fish
myapp <TAB>
```

## Integration with Frameworks

### Commander.js
```javascript
program
  .command('completion')
  .description('Generate shell completions')
  .option('--shell <shell>', 'Target shell')
  .action((opts) => {
    // Output completion script
  });
```

### Cobra (Go)
```go
rootCmd.AddCommand(&cobra.Command{
    Use:   "completion [bash|zsh|fish]",
    Short: "Generate completion script",
    Run: func(cmd *cobra.Command, args []string) {
        // Generate completion
    },
})
```

## Best Practices

1. **Always include descriptions** - Helps users understand options
2. **Cache dynamic completions** - Avoid slow lookups
3. **Group related options** - Improves discoverability
4. **Test all shells** - Behavior varies between shells
5. **Document installation** - Include clear instructions

## References

- [Bash Completion](https://github.com/scop/bash-completion)
- [Zsh Completion System](https://zsh.sourceforge.io/Doc/Release/Completion-System.html)
- [Fish Completions](https://fishshell.com/docs/current/completions.html)
- [Carapace](https://github.com/carapace-sh/carapace-bin)
