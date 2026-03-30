---
name: shell-completion-generator
description: Generate shell completion scripts for bash, zsh, and fish from CLI command definitions. Creates intelligent completions with argument suggestions, file completions, and dynamic values.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Shell Completion Generator

Generate comprehensive shell completion scripts for bash, zsh, and fish shells from CLI command definitions.

## Capabilities

- Generate bash completion scripts
- Generate zsh completion with descriptions
- Generate fish completion scripts
- Support for subcommands and nested commands
- Dynamic completion for arguments
- File/directory path completion
- Custom completion functions

## Usage

Invoke this skill when you need to:
- Add shell completions to a CLI application
- Generate completions from command schemas
- Create custom completion logic
- Support multiple shells

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cliName | string | Yes | Name of the CLI executable |
| commands | array | Yes | Command definitions with options |
| shells | array | No | Target shells (default: all) |
| outputDir | string | No | Output directory for scripts |
| dynamic | object | No | Dynamic completion configurations |

### Command Definition Structure

```json
{
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy application to environment",
      "options": [
        {
          "flags": ["-e", "--env"],
          "description": "Target environment",
          "type": "choice",
          "choices": ["dev", "staging", "prod"]
        },
        {
          "flags": ["-c", "--config"],
          "description": "Config file path",
          "type": "file",
          "extensions": [".json", ".yaml", ".yml"]
        }
      ],
      "arguments": [
        {
          "name": "service",
          "description": "Service to deploy",
          "type": "dynamic",
          "source": "services-list"
        }
      ],
      "subcommands": [
        {
          "name": "status",
          "description": "Check deployment status"
        }
      ]
    }
  ]
}
```

## Output Structure

```
completions/
├── bash/
│   └── <cliName>.bash       # Bash completion script
├── zsh/
│   └── _<cliName>           # Zsh completion function
├── fish/
│   └── <cliName>.fish       # Fish completion script
└── install.sh               # Installation helper script
```

## Generated Code Patterns

### Bash Completion Script

```bash
#!/bin/bash
# Completion script for mycli

_mycli_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="deploy rollback status config"

    case "${prev}" in
        mycli)
            COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
            return
            ;;
        deploy)
            COMPREPLY=($(compgen -W "--env --config --dry-run" -- "${cur}"))
            return
            ;;
        --env|-e)
            COMPREPLY=($(compgen -W "dev staging prod" -- "${cur}"))
            return
            ;;
        --config|-c)
            _filedir '@(json|yaml|yml)'
            return
            ;;
    esac

    # Handle subcommands
    if [[ ${words[1]} == "deploy" ]]; then
        case "${prev}" in
            status)
                # Dynamic completion for services
                local services=$(_mycli_get_services)
                COMPREPLY=($(compgen -W "${services}" -- "${cur}"))
                return
                ;;
        esac
    fi

    COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
}

# Dynamic completion helper
_mycli_get_services() {
    mycli services list --quiet 2>/dev/null
}

complete -F _mycli_completions mycli
```

### Zsh Completion Script

```zsh
#compdef mycli

_mycli() {
    local -a commands
    commands=(
        'deploy:Deploy application to environment'
        'rollback:Rollback to previous version'
        'status:Check deployment status'
        'config:Manage configuration'
    )

    local -a deploy_options
    deploy_options=(
        '(-e --env)'{-e,--env}'[Target environment]:environment:(dev staging prod)'
        '(-c --config)'{-c,--config}'[Config file path]:config file:_files -g "*.{json,yaml,yml}"'
        '--dry-run[Preview changes without applying]'
    )

    _arguments -C \
        '1: :->command' \
        '*:: :->args'

    case $state in
        command)
            _describe -t commands 'mycli commands' commands
            ;;
        args)
            case $words[1] in
                deploy)
                    _arguments $deploy_options \
                        '1:service:_mycli_services'
                    ;;
                rollback)
                    _arguments \
                        '(-v --version)'{-v,--version}'[Version to rollback]:version:_mycli_versions'
                    ;;
            esac
            ;;
    esac
}

# Dynamic completion for services
_mycli_services() {
    local -a services
    services=(${(f)"$(mycli services list --quiet 2>/dev/null)"})
    _describe -t services 'services' services
}

_mycli "$@"
```

### Fish Completion Script

```fish
# Completions for mycli

# Disable file completions by default
complete -c mycli -f

# Main commands
complete -c mycli -n __fish_use_subcommand -a deploy -d 'Deploy application to environment'
complete -c mycli -n __fish_use_subcommand -a rollback -d 'Rollback to previous version'
complete -c mycli -n __fish_use_subcommand -a status -d 'Check deployment status'
complete -c mycli -n __fish_use_subcommand -a config -d 'Manage configuration'

# Deploy options
complete -c mycli -n '__fish_seen_subcommand_from deploy' -s e -l env -d 'Target environment' -xa 'dev staging prod'
complete -c mycli -n '__fish_seen_subcommand_from deploy' -s c -l config -d 'Config file path' -r -F
complete -c mycli -n '__fish_seen_subcommand_from deploy' -l dry-run -d 'Preview changes'

# Deploy subcommands
complete -c mycli -n '__fish_seen_subcommand_from deploy' -a status -d 'Check deployment status'

# Dynamic service completion
function __mycli_services
    mycli services list --quiet 2>/dev/null
end

complete -c mycli -n '__fish_seen_subcommand_from deploy; and not __fish_seen_subcommand_from status' -a '(__mycli_services)' -d 'Service'
```

## Completion Types

| Type | Description | Example |
|------|-------------|---------|
| choice | Fixed list of values | environments, formats |
| file | File path completion | config files |
| directory | Directory path completion | output paths |
| dynamic | Runtime-generated values | services, branches |
| command | Subcommand completion | nested commands |
| none | No completion | free-form text |

## Dynamic Completion Sources

```json
{
  "dynamic": {
    "services-list": {
      "command": "mycli services list --quiet",
      "cache": 60
    },
    "git-branches": {
      "command": "git branch --format='%(refname:short)'",
      "cache": 10
    },
    "docker-images": {
      "command": "docker images --format '{{.Repository}}:{{.Tag}}'",
      "cache": 30
    }
  }
}
```

## Installation Script

```bash
#!/bin/bash
# install.sh - Install shell completions for mycli

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install_bash() {
    local dest="${BASH_COMPLETION_USER_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/bash-completion}/completions"
    mkdir -p "$dest"
    cp "$SCRIPT_DIR/bash/mycli.bash" "$dest/mycli"
    echo "Installed bash completion to $dest/mycli"
}

install_zsh() {
    local dest="${ZDOTDIR:-$HOME}/.zfunc"
    mkdir -p "$dest"
    cp "$SCRIPT_DIR/zsh/_mycli" "$dest/_mycli"
    echo "Add 'fpath=(~/.zfunc \$fpath)' to .zshrc if not present"
    echo "Installed zsh completion to $dest/_mycli"
}

install_fish() {
    local dest="${XDG_CONFIG_HOME:-$HOME/.config}/fish/completions"
    mkdir -p "$dest"
    cp "$SCRIPT_DIR/fish/mycli.fish" "$dest/mycli.fish"
    echo "Installed fish completion to $dest/mycli.fish"
}

case "$1" in
    bash) install_bash ;;
    zsh) install_zsh ;;
    fish) install_fish ;;
    all|"")
        install_bash
        install_zsh
        install_fish
        ;;
    *)
        echo "Usage: $0 [bash|zsh|fish|all]"
        exit 1
        ;;
esac
```

## Workflow

1. **Parse command definitions** - Extract commands, options, arguments
2. **Identify completion types** - Map types to shell completion methods
3. **Generate bash script** - Create complete-function based script
4. **Generate zsh script** - Create _compdef function with descriptions
5. **Generate fish script** - Create complete commands
6. **Create install script** - Helper for users to install

## Best Practices Applied

- Descriptions in zsh completions
- File extension filtering
- Caching for dynamic completions
- Subcommand handling
- Option grouping (-e|--env)
- Context-aware completions

## References

- Bash Completion Guide: https://github.com/scop/bash-completion
- Zsh Completion System: https://zsh.sourceforge.io/Doc/Release/Completion-System.html
- Fish Completions: https://fishshell.com/docs/current/completions.html
- Carapace: https://github.com/carapace-sh/carapace-bin

## Target Processes

- shell-completion-scripts
- cli-documentation-generation
- cli-application-bootstrap
