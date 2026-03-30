---
name: trap-handler-generator
description: Generate trap handlers for cleanup, signal handling, and graceful shutdown in shell scripts.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Trap Handler Generator

Generate trap handlers for shell scripts.

## Capabilities

- Generate cleanup trap handlers
- Implement signal handling
- Create graceful shutdown logic
- Set up resource cleanup
- Handle nested traps
- Generate error handlers

## Generated Patterns

```bash
#!/usr/bin/env bash

# Temporary resources to clean up
declare -a CLEANUP_ITEMS=()
CLEANUP_DONE=false

# Register cleanup item
register_cleanup() {
    CLEANUP_ITEMS+=("$1")
}

# Cleanup function
cleanup() {
    if [[ "$CLEANUP_DONE" == true ]]; then
        return
    fi
    CLEANUP_DONE=true

    local exit_code=$?
    echo "Cleaning up..."

    for item in "${CLEANUP_ITEMS[@]}"; do
        if [[ -d "$item" ]]; then
            rm -rf "$item" 2>/dev/null
        elif [[ -f "$item" ]]; then
            rm -f "$item" 2>/dev/null
        elif [[ -n "$item" ]]; then
            # Command to run
            eval "$item" 2>/dev/null
        fi
    done

    return $exit_code
}

# Error handler
on_error() {
    local exit_code=$?
    local line_no=$1
    echo "Error on line ${line_no}: command exited with ${exit_code}" >&2
    cleanup
    exit $exit_code
}

# Signal handlers
on_sigint() {
    echo -e "\nInterrupted by user"
    cleanup
    exit 130
}

on_sigterm() {
    echo "Terminated"
    cleanup
    exit 143
}

# Set up traps
trap cleanup EXIT
trap 'on_error ${LINENO}' ERR
trap on_sigint INT
trap on_sigterm TERM

# Usage
TEMP_DIR=$(mktemp -d)
register_cleanup "$TEMP_DIR"

TEMP_FILE=$(mktemp)
register_cleanup "$TEMP_FILE"

register_cleanup "docker stop mycontainer"
```

## Target Processes

- shell-script-development
- error-handling-user-feedback
- cross-platform-cli-compatibility
