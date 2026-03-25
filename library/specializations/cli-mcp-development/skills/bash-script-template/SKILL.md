---
name: bash-script-template
description: Generate bash script templates with best practices including error handling, argument parsing, logging, and portability considerations.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Bash Script Template

Generate bash script templates with best practices.

## Capabilities

- Generate robust bash script templates
- Set up proper error handling
- Implement argument parsing with getopts
- Create logging utilities
- Configure strict mode settings
- Generate reusable function libraries

## Usage

Invoke this skill when you need to:
- Create new bash scripts with best practices
- Set up proper error handling patterns
- Implement argument parsing
- Create portable shell scripts

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scriptName | string | Yes | Script name |
| description | string | Yes | Script description |
| arguments | array | No | Script arguments |
| functions | array | No | Functions to include |

## Generated Template

```bash
#!/usr/bin/env bash
#
# <scriptName> - <description>
#
# Usage: <scriptName> [options] <arguments>
#

set -euo pipefail
IFS=$'\n\t'

# Script directory
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Colors (if terminal supports)
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[0;33m'
    readonly BLUE='\033[0;34m'
    readonly NC='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die() { log_error "$*"; exit 1; }

# Cleanup on exit
cleanup() {
    # Add cleanup tasks here
    :
}
trap cleanup EXIT

# Usage
usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [options] <argument>

<description>

Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    -d, --dry-run   Show what would be done
    -f, --force     Force operation
    -o, --output    Output file path

Arguments:
    argument        Required argument description

Examples:
    ${SCRIPT_NAME} -v input.txt
    ${SCRIPT_NAME} --output result.txt input.txt
EOF
}

# Parse arguments
parse_args() {
    local OPTIND opt
    while getopts ":hvdfo:-:" opt; do
        case "${opt}" in
            h) usage; exit 0 ;;
            v) VERBOSE=true ;;
            d) DRY_RUN=true ;;
            f) FORCE=true ;;
            o) OUTPUT="${OPTARG}" ;;
            -)
                case "${OPTARG}" in
                    help) usage; exit 0 ;;
                    verbose) VERBOSE=true ;;
                    dry-run) DRY_RUN=true ;;
                    force) FORCE=true ;;
                    output=*) OUTPUT="${OPTARG#*=}" ;;
                    *) die "Unknown option: --${OPTARG}" ;;
                esac
                ;;
            :) die "Option -${OPTARG} requires an argument" ;;
            ?) die "Unknown option: -${OPTARG}" ;;
        esac
    done
    shift $((OPTIND - 1))

    # Required arguments
    if [[ $# -lt 1 ]]; then
        usage
        die "Missing required argument"
    fi

    ARGUMENT="$1"
}

# Defaults
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}
OUTPUT=${OUTPUT:-}

# Main function
main() {
    parse_args "$@"

    if [[ "${VERBOSE}" == true ]]; then
        log_info "Verbose mode enabled"
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        log_warn "Dry run mode - no changes will be made"
    fi

    log_info "Processing: ${ARGUMENT}"

    # Main logic here

    log_success "Done!"
}

main "$@"
```

## Target Processes

- shell-script-development
- cross-platform-cli-compatibility
- cli-application-bootstrap
