---
name: getopts-parser-generator
description: Generate getopts-based argument parsing for shell scripts with short/long options and validation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Getopts Parser Generator

Generate getopts-based argument parsing for shell scripts.

## Capabilities

- Generate getopts parsing code
- Support short and long options
- Implement option validation
- Create help text generation
- Handle required arguments
- Generate usage documentation

## Usage

Invoke this skill when you need to:
- Add argument parsing to shell scripts
- Support short and long options
- Validate argument values
- Generate help text

## Generated Patterns

### Getopts with Long Options

```bash
#!/usr/bin/env bash

# Default values
VERBOSE=false
OUTPUT=""
FORMAT="text"
FORCE=false

# Usage function
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] <input>

Options:
    -h, --help              Show this help
    -v, --verbose           Enable verbose output
    -o, --output FILE       Output file (default: stdout)
    -f, --format FORMAT     Output format: text, json, csv (default: text)
    -F, --force             Force overwrite existing files

Arguments:
    input                   Input file to process
EOF
}

# Parse options
parse_options() {
    # Transform long options to short ones
    for arg in "$@"; do
        shift
        case "$arg" in
            '--help')    set -- "$@" '-h' ;;
            '--verbose') set -- "$@" '-v' ;;
            '--output')  set -- "$@" '-o' ;;
            '--format')  set -- "$@" '-f' ;;
            '--force')   set -- "$@" '-F' ;;
            *)           set -- "$@" "$arg" ;;
        esac
    done

    # Parse short options
    local OPTIND opt
    while getopts ":hvo:f:F" opt; do
        case "$opt" in
            h) usage; exit 0 ;;
            v) VERBOSE=true ;;
            o) OUTPUT="$OPTARG" ;;
            f)
                case "$OPTARG" in
                    text|json|csv) FORMAT="$OPTARG" ;;
                    *) die "Invalid format: $OPTARG" ;;
                esac
                ;;
            F) FORCE=true ;;
            :) die "Option -$OPTARG requires an argument" ;;
            \?) die "Unknown option: -$OPTARG" ;;
        esac
    done

    shift $((OPTIND - 1))

    # Remaining arguments
    if [[ $# -lt 1 ]]; then
        usage
        die "Missing required argument: input"
    fi

    INPUT="$1"
    shift

    # Extra arguments
    EXTRA_ARGS=("$@")
}

die() {
    echo "Error: $*" >&2
    exit 1
}

# Parse and validate
parse_options "$@"

# Validation
[[ -f "$INPUT" ]] || die "Input file not found: $INPUT"
[[ -n "$OUTPUT" && -f "$OUTPUT" && "$FORCE" != true ]] && \
    die "Output file exists: $OUTPUT (use --force to overwrite)"
```

## Target Processes

- shell-script-development
- shell-completion-scripts
- argument-parser-setup
