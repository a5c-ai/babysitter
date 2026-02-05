#!/usr/bin/env bash
#
# error-codes.sh - Standardized error code system for babysitter plugin
#
# This script provides helper functions for consistent error reporting
# across all babysitter shell scripts.
#
# Error Code Format: BSIT-XXXX
#   1XXX = Installation/Setup errors
#   2XXX = Configuration errors
#   3XXX = Runtime/Execution errors
#   4XXX = State/Journal errors
#   5XXX = Hook errors
#   9XXX = Unknown/Internal errors
#
# Usage:
#   source "$PLUGIN_ROOT/scripts/error-codes.sh"
#   bsit_error "1002" "jq" "/usr/local/bin"
#   bsit_warn "2003" "verbose"
#   msg=$(get_error_message "3001")
#

# Prevent multiple sourcing
if [[ -n "${_BSIT_ERROR_CODES_LOADED:-}" ]]; then
    return 0
fi
_BSIT_ERROR_CODES_LOADED=1

# Version
BSIT_ERROR_CODES_VERSION="1.0.0"

# =============================================================================
# Color Configuration
# =============================================================================

# Color codes (disabled if not a terminal or NO_COLOR is set)
if [[ -t 2 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    _BSIT_RED='\033[0;31m'
    _BSIT_YELLOW='\033[0;33m'
    _BSIT_BLUE='\033[0;34m'
    _BSIT_CYAN='\033[0;36m'
    _BSIT_BOLD='\033[1m'
    _BSIT_NC='\033[0m' # No Color
else
    _BSIT_RED=''
    _BSIT_YELLOW=''
    _BSIT_BLUE=''
    _BSIT_CYAN=''
    _BSIT_BOLD=''
    _BSIT_NC=''
fi

# =============================================================================
# Error Code Definitions
# =============================================================================

# Error names indexed by code
declare -A BSIT_ERROR_NAMES=(
    # Installation/Setup (1XXX)
    ["1001"]="Node.js Version Mismatch"
    ["1002"]="jq Not Found"
    ["1003"]="Plugin Not Installed"
    ["1004"]="SDK CLI Not Found"
    ["1005"]="Git Not Available"

    # Configuration (2XXX)
    ["2001"]="Invalid Configuration"
    ["2002"]="Missing Runs Directory"
    ["2003"]="Invalid Log Level"
    ["2004"]="Configuration File Not Found"
    ["2005"]="Permission Denied"

    # Runtime/Execution (3XXX)
    ["3001"]="Process Not Found"
    ["3002"]="Task Execution Failed"
    ["3003"]="Breakpoint Timeout"
    ["3004"]="Run Already Active"
    ["3005"]="Maximum Iterations Exceeded"
    ["3006"]="Agent Communication Failed"

    # State/Journal (4XXX)
    ["4001"]="Journal Corrupted"
    ["4002"]="State File Missing"
    ["4003"]="State File Invalid"
    ["4004"]="Checkpoint Not Found"
    ["4005"]="State Lock Acquisition Failed"

    # Hook (5XXX)
    ["5001"]="Hook Not Found"
    ["5002"]="Hook Not Executable"
    ["5003"]="Hook Execution Failed"
    ["5004"]="Hook Output Invalid"
    ["5005"]="Hook Timeout"

    # Unknown/Internal (9XXX)
    ["9001"]="Unknown Error"
    ["9002"]="Internal Error"
    ["9003"]="Feature Not Implemented"
)

# Error descriptions indexed by code
declare -A BSIT_ERROR_DESCRIPTIONS=(
    # Installation/Setup (1XXX)
    ["1001"]="The installed Node.js version does not meet the minimum requirements"
    ["1002"]="The jq command-line JSON processor is not installed or not in PATH"
    ["1003"]="The babysitter plugin is not properly installed or registered"
    ["1004"]="The babysitter SDK CLI is not available"
    ["1005"]="Git is not installed or not accessible in the current environment"

    # Configuration (2XXX)
    ["2001"]="The configuration file contains invalid or malformed data"
    ["2002"]="The .a5c/runs directory does not exist and cannot be created"
    ["2003"]="The specified log level is not recognized"
    ["2004"]="The expected configuration file does not exist"
    ["2005"]="Cannot read or write to a required file or directory due to permissions"

    # Runtime/Execution (3XXX)
    ["3001"]="The expected process file or definition could not be located"
    ["3002"]="A task failed to execute successfully"
    ["3003"]="A breakpoint wait exceeded the maximum allowed time"
    ["3004"]="Attempted to start a new run while another is already active"
    ["3005"]="The run exceeded the maximum number of allowed iterations"
    ["3006"]="Failed to communicate with the AI agent"

    # State/Journal (4XXX)
    ["4001"]="The run journal file is corrupted or contains invalid data"
    ["4002"]="A required state file is missing from the run directory"
    ["4003"]="The state file exists but contains invalid or inconsistent data"
    ["4004"]="The requested checkpoint does not exist"
    ["4005"]="Could not acquire lock on state files for writing"

    # Hook (5XXX)
    ["5001"]="The specified hook file does not exist"
    ["5002"]="The hook file exists but is not executable"
    ["5003"]="The hook script exited with a non-zero status"
    ["5004"]="The hook produced output that could not be parsed or was invalid"
    ["5005"]="The hook execution exceeded the maximum allowed time"

    # Unknown/Internal (9XXX)
    ["9001"]="An unexpected error occurred that doesn't match any known error pattern"
    ["9002"]="An internal error occurred in the babysitter code"
    ["9003"]="The requested feature is not yet implemented"
)

# Recovery steps indexed by code
declare -A BSIT_ERROR_RECOVERY=(
    # Installation/Setup (1XXX)
    ["1001"]="Install Node.js 18.x or later from https://nodejs.org. If using nvm: nvm install 18 && nvm use 18"
    ["1002"]="Install jq: macOS: brew install jq, Ubuntu: apt-get install jq, Windows: choco install jq"
    ["1003"]="Run 'claude plugins add babysitter' to install, then restart Claude Code session"
    ["1004"]="Install with: npm install -g @a5c-ai/babysitter, or use: npx @a5c-ai/babysitter"
    ["1005"]="Install git from https://git-scm.com and ensure it's in your PATH"

    # Configuration (2XXX)
    ["2001"]="Validate syntax with 'jq . .a5c/config.json', or reset with 'bsit config reset'"
    ["2002"]="Create with: mkdir -p .a5c/runs, check disk space and permissions"
    ["2003"]="Use valid log levels: debug, info, warn, error, silent"
    ["2004"]="Initialize with 'bsit init' or create default config with 'bsit config reset'"
    ["2005"]="Check ownership with 'ls -la', fix with chmod/chown as needed"

    # Runtime/Execution (3XXX)
    ["3001"]="Run 'bsit process list' to see available processes, check spelling"
    ["3002"]="Check logs with 'bsit logs --run <run-id>', verify dependencies, retry with 'bsit retry'"
    ["3003"]="Resume with 'bsit resume --run <run-id>', or increase timeout in configuration"
    ["3004"]="Stop active run with 'bsit stop', or force with 'bsit stop --force'"
    ["3005"]="Review process for infinite loops, check convergence criteria, increase max iterations"
    ["3006"]="Check network, verify API credentials, wait for rate limit reset"

    # State/Journal (4XXX)
    ["4001"]="Restore from backup, or repair with 'bsit repair --run <run-id>'"
    ["4002"]="Check run directory exists, restore from backup, or reinitialize state"
    ["4003"]="Validate with 'bsit validate --run <run-id>', rollback to checkpoint"
    ["4004"]="List checkpoints with 'bsit checkpoints --run <run-id>', verify ID"
    ["4005"]="Check for other processes, remove stale lock, increase lock timeout"

    # Hook (5XXX)
    ["5001"]="Verify hook path, check hooks directory exists, reinstall plugin if needed"
    ["5002"]="Add execute permission: chmod +x <hook-file>"
    ["5003"]="Run hook manually with 'bash -x <hook>', check dependencies"
    ["5004"]="Ensure hook outputs valid JSON to stdout, redirect debug to stderr"
    ["5005"]="Add timeouts to external calls, increase hook timeout, make async"

    # Unknown/Internal (9XXX)
    ["9001"]="Check logs with 'bsit logs --verbose', report issue if persists"
    ["9002"]="Update to latest version, report bug at https://github.com/a5c-ai/babysitter/issues"
    ["9003"]="Check documentation for feature availability, update to latest version"
)

# =============================================================================
# Helper Functions
# =============================================================================

# Get the full error code with prefix
# Usage: _bsit_full_code "1001" -> "BSIT-1001"
_bsit_full_code() {
    local code="$1"
    echo "BSIT-${code}"
}

# Get category name from code
# Usage: _bsit_category "1001" -> "Installation"
_bsit_category() {
    local code="$1"
    local prefix="${code:0:1}"

    case "$prefix" in
        1) echo "Installation" ;;
        2) echo "Configuration" ;;
        3) echo "Runtime" ;;
        4) echo "State" ;;
        5) echo "Hook" ;;
        9) echo "Internal" ;;
        *) echo "Unknown" ;;
    esac
}

# =============================================================================
# Public API Functions
# =============================================================================

# Get error name by code
# Usage: get_error_name "1001" -> "Node.js Version Mismatch"
get_error_name() {
    local code="$1"
    echo "${BSIT_ERROR_NAMES[$code]:-Unknown Error}"
}

# Get error description/message by code
# Usage: get_error_message "1001" -> "The installed Node.js version..."
get_error_message() {
    local code="$1"
    echo "${BSIT_ERROR_DESCRIPTIONS[$code]:-An unknown error occurred}"
}

# Get recovery steps by code
# Usage: get_recovery_steps "1001" -> "Install Node.js 18.x..."
get_recovery_steps() {
    local code="$1"
    echo "${BSIT_ERROR_RECOVERY[$code]:-Check logs and try again}"
}

# Output a formatted error message
# Usage: bsit_error "1002" [context...]
# Example: bsit_error "1002" "jq" "/usr/local/bin"
bsit_error() {
    local code="$1"
    shift
    local context=("$@")

    local full_code=$(_bsit_full_code "$code")
    local name=$(get_error_name "$code")
    local message=$(get_error_message "$code")
    local recovery=$(get_recovery_steps "$code")

    # Build context string if provided
    local context_str=""
    if [[ ${#context[@]} -gt 0 ]]; then
        context_str=" (${context[*]})"
    fi

    echo -e "${_BSIT_RED}${_BSIT_BOLD}ERROR${_BSIT_NC} [${full_code}] ${_BSIT_BOLD}${name}${_BSIT_NC}${context_str}" >&2
    echo -e "  ${message}" >&2
    echo -e "  ${_BSIT_CYAN}Recovery:${_BSIT_NC} ${recovery}" >&2
}

# Output a formatted warning message
# Usage: bsit_warn "2003" [context...]
# Example: bsit_warn "2003" "verbose" "debug, info, warn, error"
bsit_warn() {
    local code="$1"
    shift
    local context=("$@")

    local full_code=$(_bsit_full_code "$code")
    local name=$(get_error_name "$code")
    local message=$(get_error_message "$code")
    local recovery=$(get_recovery_steps "$code")

    # Build context string if provided
    local context_str=""
    if [[ ${#context[@]} -gt 0 ]]; then
        context_str=" (${context[*]})"
    fi

    echo -e "${_BSIT_YELLOW}${_BSIT_BOLD}WARNING${_BSIT_NC} [${full_code}] ${_BSIT_BOLD}${name}${_BSIT_NC}${context_str}" >&2
    echo -e "  ${message}" >&2
    echo -e "  ${_BSIT_CYAN}Suggestion:${_BSIT_NC} ${recovery}" >&2
}

# Output a formatted info message
# Usage: bsit_info "3001" [context...]
bsit_info() {
    local code="$1"
    shift
    local context=("$@")

    local full_code=$(_bsit_full_code "$code")
    local name=$(get_error_name "$code")
    local message=$(get_error_message "$code")

    # Build context string if provided
    local context_str=""
    if [[ ${#context[@]} -gt 0 ]]; then
        context_str=" (${context[*]})"
    fi

    echo -e "${_BSIT_BLUE}${_BSIT_BOLD}INFO${_BSIT_NC} [${full_code}] ${_BSIT_BOLD}${name}${_BSIT_NC}${context_str}" >&2
    echo -e "  ${message}" >&2
}

# Output error in JSON format
# Usage: bsit_error_json "1002" "jq" "command not found"
bsit_error_json() {
    local code="$1"
    shift
    local context_msg="$*"

    local full_code=$(_bsit_full_code "$code")
    local name=$(get_error_name "$code")
    local message=$(get_error_message "$code")
    local recovery=$(get_recovery_steps "$code")
    local category=$(_bsit_category "$code")

    # Escape strings for JSON
    name="${name//\"/\\\"}"
    message="${message//\"/\\\"}"
    recovery="${recovery//\"/\\\"}"
    context_msg="${context_msg//\"/\\\"}"

    cat <<EOF
{
  "error": {
    "code": "${full_code}",
    "name": "${name}",
    "category": "${category}",
    "message": "${message}",
    "context": "${context_msg}",
    "recovery": "${recovery}"
  }
}
EOF
}

# Check if a code is valid
# Usage: bsit_is_valid_code "1001" && echo "valid"
bsit_is_valid_code() {
    local code="$1"
    [[ -n "${BSIT_ERROR_NAMES[$code]:-}" ]]
}

# List all error codes
# Usage: bsit_list_codes
bsit_list_codes() {
    echo "Babysitter Error Codes (v${BSIT_ERROR_CODES_VERSION})"
    echo "========================================"
    echo ""

    local prev_category=""
    for code in $(echo "${!BSIT_ERROR_NAMES[@]}" | tr ' ' '\n' | sort -n); do
        local category=$(_bsit_category "$code")
        local full_code=$(_bsit_full_code "$code")
        local name="${BSIT_ERROR_NAMES[$code]}"

        if [[ "$category" != "$prev_category" ]]; then
            echo ""
            echo "${_BSIT_BOLD}${category} Errors:${_BSIT_NC}"
            prev_category="$category"
        fi

        printf "  %-12s %s\n" "$full_code" "$name"
    done
}

# Exit with error code
# Usage: bsit_exit "1002" "jq not found"
# This outputs the error and exits with code 1
bsit_exit() {
    local code="$1"
    shift
    bsit_error "$code" "$@"
    exit 1
}

# Assert a command exists, exit with appropriate error if not
# Usage: bsit_require_cmd "jq" "1002"
bsit_require_cmd() {
    local cmd="$1"
    local error_code="${2:-9001}"

    if ! command -v "$cmd" &>/dev/null; then
        bsit_exit "$error_code" "$cmd"
    fi
}

# Assert a file exists, exit with appropriate error if not
# Usage: bsit_require_file "/path/to/file" "4002"
bsit_require_file() {
    local filepath="$1"
    local error_code="${2:-4002}"

    if [[ ! -f "$filepath" ]]; then
        bsit_exit "$error_code" "$filepath"
    fi
}

# Assert a directory exists, exit with appropriate error if not
# Usage: bsit_require_dir "/path/to/dir" "2002"
bsit_require_dir() {
    local dirpath="$1"
    local error_code="${2:-2002}"

    if [[ ! -d "$dirpath" ]]; then
        bsit_exit "$error_code" "$dirpath"
    fi
}

# =============================================================================
# Self-test (when run directly)
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Running directly, show help or run self-test
    case "${1:-}" in
        --list|-l)
            bsit_list_codes
            ;;
        --test|-t)
            echo "Running error-codes.sh self-test..."
            echo ""

            echo "Testing get_error_name:"
            echo "  1001 -> $(get_error_name "1001")"
            echo "  9999 -> $(get_error_name "9999")"
            echo ""

            echo "Testing get_error_message:"
            echo "  3002 -> $(get_error_message "3002")"
            echo ""

            echo "Testing get_recovery_steps:"
            echo "  5002 -> $(get_recovery_steps "5002")"
            echo ""

            echo "Testing bsit_error output:"
            bsit_error "1002" "jq" "/usr/local/bin"
            echo ""

            echo "Testing bsit_warn output:"
            bsit_warn "2003" "verbose"
            echo ""

            echo "Testing bsit_info output:"
            bsit_info "3001" "custom-process"
            echo ""

            echo "Testing bsit_error_json output:"
            bsit_error_json "4001" "journal.json parse error"
            echo ""

            echo "Testing bsit_is_valid_code:"
            bsit_is_valid_code "1001" && echo "  1001 is valid"
            bsit_is_valid_code "9999" || echo "  9999 is invalid"
            echo ""

            echo "Self-test complete!"
            ;;
        --json)
            # Output all codes as JSON
            echo "["
            _json_first=true
            for code in $(echo "${!BSIT_ERROR_NAMES[@]}" | tr ' ' '\n' | sort -n); do
                if [[ "$_json_first" != "true" ]]; then
                    echo ","
                fi
                _json_first=false
                _json_full_code=$(_bsit_full_code "$code")
                _json_name="${BSIT_ERROR_NAMES[$code]//\"/\\\"}"
                _json_desc="${BSIT_ERROR_DESCRIPTIONS[$code]//\"/\\\"}"
                _json_recovery="${BSIT_ERROR_RECOVERY[$code]//\"/\\\"}"
                _json_category=$(_bsit_category "$code")
                printf '  {"code": "%s", "name": "%s", "category": "%s", "description": "%s", "recovery": "%s"}' \
                    "$_json_full_code" "$_json_name" "$_json_category" "$_json_desc" "$_json_recovery"
            done
            echo ""
            echo "]"
            ;;
        --version|-v)
            echo "error-codes.sh version ${BSIT_ERROR_CODES_VERSION}"
            ;;
        --help|-h|*)
            cat <<EOF
error-codes.sh - Babysitter Plugin Error Code System

Usage:
  source error-codes.sh     # Source in your script
  ./error-codes.sh [option] # Run directly for utilities

Options:
  --list, -l      List all error codes
  --test, -t      Run self-test
  --json          Output all codes as JSON
  --version, -v   Show version
  --help, -h      Show this help

When sourced, provides these functions:
  bsit_error CODE [context...]    Output formatted error to stderr
  bsit_warn CODE [context...]     Output formatted warning to stderr
  bsit_info CODE [context...]     Output formatted info to stderr
  bsit_error_json CODE context    Output error as JSON to stdout
  get_error_name CODE             Get error name
  get_error_message CODE          Get error description
  get_recovery_steps CODE         Get recovery suggestions
  bsit_exit CODE [context...]     Output error and exit 1
  bsit_require_cmd CMD CODE       Assert command exists
  bsit_require_file PATH CODE     Assert file exists
  bsit_require_dir PATH CODE      Assert directory exists
  bsit_is_valid_code CODE         Check if code is valid
  bsit_list_codes                 List all error codes

Error Code Format: BSIT-XXXX
  1XXX = Installation/Setup errors
  2XXX = Configuration errors
  3XXX = Runtime/Execution errors
  4XXX = State/Journal errors
  5XXX = Hook errors
  9XXX = Unknown/Internal errors

Examples:
  source "\$PLUGIN_ROOT/scripts/error-codes.sh"
  bsit_error "1002" "jq" "/usr/local/bin"
  bsit_warn "2003" "verbose"
  bsit_require_cmd "jq" "1002"

EOF
            ;;
    esac
fi
