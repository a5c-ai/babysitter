#!/usr/bin/env bash
#
# health-check.sh - Runtime diagnostics for babysitter plugin
# Checks plugin health status and provides recovery suggestions
#
# Exit codes:
#   0 - Healthy (all checks pass)
#   1 - Unhealthy (critical failures)
#   2 - Degraded (warnings but functional)
#

set -euo pipefail

# Script version
VERSION="1.0.0"

# Color codes (disabled if not a terminal or NO_COLOR is set)
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    BOLD=''
    NC=''
fi

# Output format flags
JSON_OUTPUT=false
VERBOSE=false

# Results tracking
declare -a CHECK_RESULTS=()
declare -a CHECK_NAMES=()
declare -a CHECK_MESSAGES=()
declare -a CHECK_RECOVERY=()
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Determine plugin root (directory containing scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Determine repository root
REPO_ROOT="${REPO_ROOT:-}"
if [[ -z "$REPO_ROOT" ]]; then
    current_dir="$PWD"
    while [[ "$current_dir" != "/" ]]; do
        if [[ -d "$current_dir/.git" ]] || [[ -d "$current_dir/.a5c" ]]; then
            REPO_ROOT="$current_dir"
            break
        fi
        current_dir=$(dirname "$current_dir")
    done
    REPO_ROOT="${REPO_ROOT:-$PWD}"
fi

# Print usage information
usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Runtime diagnostics for the babysitter plugin.

Options:
    --json      Output results in JSON format (machine-readable)
    --verbose   Show detailed diagnostics information
    --version   Show script version
    -h, --help  Show this help message

Exit Codes:
    0   Healthy - all checks passed
    1   Unhealthy - critical failures detected
    2   Degraded - warnings present but functional

Checks Performed:
    - Skills are loaded (skill files exist in skills/)
    - Hooks are discoverable and executable
    - Session state directory is writable
    - .a5c/runs directory is accessible
    - Environment variables are set correctly
    - No orphaned state files

EOF
}

# Log functions for results
log_check() {
    local status="$1"
    local name="$2"
    local message="$3"
    local recovery="${4:-}"

    CHECK_NAMES+=("$name")
    CHECK_MESSAGES+=("$message")
    CHECK_RESULTS+=("$status")
    CHECK_RECOVERY+=("$recovery")
    ((TOTAL_CHECKS++))

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        return
    fi

    case "$status" in
        "pass")
            echo -e "${GREEN}✓${NC} ${name}: ${message}"
            ((PASSED_CHECKS++))
            ;;
        "fail")
            echo -e "${RED}✗${NC} ${name}: ${message}"
            ((FAILED_CHECKS++))
            if [[ -n "$recovery" ]] && [[ "$VERBOSE" == "true" ]]; then
                echo -e "  ${YELLOW}Recovery:${NC} $recovery"
            fi
            ;;
        "warn")
            echo -e "${YELLOW}⚠${NC} ${name}: ${message}"
            ((WARNINGS++))
            if [[ -n "$recovery" ]] && [[ "$VERBOSE" == "true" ]]; then
                echo -e "  ${YELLOW}Suggestion:${NC} $recovery"
            fi
            ;;
    esac
}

# Verbose logging
log_verbose() {
    if [[ "$VERBOSE" == "true" ]] && [[ "$JSON_OUTPUT" != "true" ]]; then
        echo -e "  ${BLUE}→${NC} $1"
    fi
}

# Print a section header
print_header() {
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        return
    fi
    echo ""
    echo -e "${BOLD}${BLUE}=== $1 ===${NC}"
    echo ""
}

# Check 1: Skills are loaded
check_skills_loaded() {
    local skills_dir="$PLUGIN_ROOT/skills"
    local skill_count=0
    local missing_skills=()

    log_verbose "Checking skills directory: $skills_dir"

    if [[ ! -d "$skills_dir" ]]; then
        log_check "fail" "Skills Loaded" "Skills directory not found: $skills_dir" \
            "Create the skills directory or reinstall the plugin"
        return 1
    fi

    # Check for skill directories with SKILL.md files
    while IFS= read -r -d '' skill_dir; do
        local skill_name=$(basename "$skill_dir")
        if [[ -f "$skill_dir/SKILL.md" ]]; then
            ((skill_count++))
            log_verbose "Found skill: $skill_name (has SKILL.md)"
        else
            missing_skills+=("$skill_name")
            log_verbose "Skill missing SKILL.md: $skill_name"
        fi
    done < <(find "$skills_dir" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)

    if [[ $skill_count -eq 0 ]]; then
        log_check "fail" "Skills Loaded" "No valid skills found in $skills_dir" \
            "Ensure at least one skill directory contains a SKILL.md file"
        return 1
    elif [[ ${#missing_skills[@]} -gt 0 ]]; then
        log_check "warn" "Skills Loaded" "$skill_count skill(s) loaded, ${#missing_skills[@]} incomplete" \
            "Add SKILL.md to: ${missing_skills[*]}"
        return 0
    else
        log_check "pass" "Skills Loaded" "$skill_count skill(s) loaded and valid"
        return 0
    fi
}

# Check 2: Hooks are discoverable and executable
check_hooks_discoverable() {
    local hooks_dir="$PLUGIN_ROOT/hooks"
    local hook_count=0
    local non_executable=()
    local hook_types=()

    log_verbose "Checking hooks directory: $hooks_dir"

    if [[ ! -d "$hooks_dir" ]]; then
        log_check "fail" "Hooks Discoverable" "Hooks directory not found: $hooks_dir" \
            "Create the hooks directory or reinstall the plugin"
        return 1
    fi

    # Check main hooks.json
    if [[ ! -f "$hooks_dir/hooks.json" ]]; then
        log_check "warn" "Hooks Discoverable" "hooks.json not found in hooks directory" \
            "Create hooks.json to register hooks with Claude Code"
    else
        log_verbose "Found hooks.json configuration"
    fi

    # Check hook dispatcher
    if [[ -f "$hooks_dir/hook-dispatcher.sh" ]]; then
        if [[ -x "$hooks_dir/hook-dispatcher.sh" ]]; then
            log_verbose "hook-dispatcher.sh is executable"
        else
            non_executable+=("hook-dispatcher.sh")
        fi
    fi

    # Check hook type directories
    while IFS= read -r -d '' hook_type_dir; do
        local hook_type=$(basename "$hook_type_dir")
        hook_types+=("$hook_type")

        # Check for executable .sh files in each hook type directory
        while IFS= read -r -d '' hook_file; do
            local hook_name=$(basename "$hook_file")
            ((hook_count++))
            if [[ ! -x "$hook_file" ]]; then
                non_executable+=("$hook_type/$hook_name")
            fi
            log_verbose "Found hook: $hook_type/$hook_name"
        done < <(find "$hook_type_dir" -maxdepth 1 -name "*.sh" -type f -print0 2>/dev/null)
    done < <(find "$hooks_dir" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)

    if [[ $hook_count -eq 0 ]]; then
        log_check "warn" "Hooks Discoverable" "No hook scripts found in hook type directories" \
            "Add .sh scripts to hook type directories (e.g., on-run-start/, on-task-complete/)"
        return 0
    elif [[ ${#non_executable[@]} -gt 0 ]]; then
        log_check "warn" "Hooks Discoverable" "$hook_count hook(s) found, ${#non_executable[@]} not executable" \
            "Run: chmod +x ${non_executable[*]}"
        return 0
    else
        log_check "pass" "Hooks Discoverable" "$hook_count hook(s) found across ${#hook_types[@]} hook types"
        return 0
    fi
}

# Check 3: Session state directory is writable
check_session_state_writable() {
    local state_dirs=(
        "$PLUGIN_ROOT/state"
        "${XDG_STATE_HOME:-$HOME/.local/state}/babysitter"
        "/tmp/babysitter-state"
    )
    local writable_found=false
    local first_writable=""

    log_verbose "Checking session state directory writability"

    for state_dir in "${state_dirs[@]}"; do
        if [[ -d "$state_dir" ]]; then
            if [[ -w "$state_dir" ]]; then
                writable_found=true
                first_writable="$state_dir"
                log_verbose "Writable state directory: $state_dir"
                break
            else
                log_verbose "State directory not writable: $state_dir"
            fi
        else
            log_verbose "State directory does not exist: $state_dir"
        fi
    done

    # Try to create a test file in the first potential location
    if [[ "$writable_found" != "true" ]]; then
        local test_dir="$PLUGIN_ROOT/state"
        if mkdir -p "$test_dir" 2>/dev/null; then
            local test_file="$test_dir/.health-check-test-$$"
            if touch "$test_file" 2>/dev/null && rm -f "$test_file" 2>/dev/null; then
                writable_found=true
                first_writable="$test_dir"
                log_verbose "Created and verified writable state directory: $test_dir"
            fi
        fi
    fi

    if [[ "$writable_found" == "true" ]]; then
        log_check "pass" "Session State Writable" "State directory writable: $first_writable"
        return 0
    else
        log_check "fail" "Session State Writable" "No writable state directory found" \
            "Create state directory with: mkdir -p $PLUGIN_ROOT/state && chmod 755 $PLUGIN_ROOT/state"
        return 1
    fi
}

# Check 4: .a5c/runs directory is accessible
check_runs_directory() {
    local runs_dir="${BABYSITTER_RUNS_DIR:-$REPO_ROOT/.a5c/runs}"
    local run_count=0

    log_verbose "Checking runs directory: $runs_dir"

    if [[ ! -d "$runs_dir" ]]; then
        # Try to create it
        if mkdir -p "$runs_dir" 2>/dev/null; then
            log_check "pass" "Runs Directory" "Created runs directory: $runs_dir"
            return 0
        else
            log_check "warn" "Runs Directory" "Runs directory does not exist: $runs_dir" \
                "Create with: mkdir -p $runs_dir"
            return 0
        fi
    fi

    if [[ ! -r "$runs_dir" ]]; then
        log_check "fail" "Runs Directory" "Runs directory not readable: $runs_dir" \
            "Fix permissions with: chmod 755 $runs_dir"
        return 1
    fi

    if [[ ! -w "$runs_dir" ]]; then
        log_check "fail" "Runs Directory" "Runs directory not writable: $runs_dir" \
            "Fix permissions with: chmod 755 $runs_dir"
        return 1
    fi

    # Count existing runs
    run_count=$(find "$runs_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    log_verbose "Found $run_count existing run(s)"

    log_check "pass" "Runs Directory" "Runs directory accessible: $runs_dir ($run_count existing runs)"
    return 0
}

# Check 5: Environment variables are set correctly
check_environment_variables() {
    local missing_vars=()
    local set_vars=()
    local env_vars=(
        "BABYSITTER_RUNS_DIR"
        "CLAUDE_PLUGIN_ROOT"
        "CLAUDE_SESSION_ID"
    )

    log_verbose "Checking environment variables"

    for var in "${env_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            set_vars+=("$var=${!var}")
            log_verbose "$var is set: ${!var}"
        else
            missing_vars+=("$var")
            log_verbose "$var is not set"
        fi
    done

    # Check if critical variables are set
    local critical_missing=0
    if [[ -z "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
        # This is expected when run outside of Claude Code
        log_verbose "CLAUDE_PLUGIN_ROOT not set (expected outside Claude Code context)"
    fi

    if [[ ${#missing_vars[@]} -eq ${#env_vars[@]} ]]; then
        log_check "warn" "Environment Variables" "No babysitter environment variables set" \
            "These are typically set by Claude Code or can be configured in your shell profile"
        return 0
    elif [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_check "warn" "Environment Variables" "${#set_vars[@]}/${#env_vars[@]} variables set, missing: ${missing_vars[*]}" \
            "Set missing variables in your shell profile or let Claude Code configure them"
        return 0
    else
        log_check "pass" "Environment Variables" "All ${#env_vars[@]} environment variables set"
        return 0
    fi
}

# Check 6: No orphaned state files
check_orphaned_state_files() {
    local runs_dir="${BABYSITTER_RUNS_DIR:-$REPO_ROOT/.a5c/runs}"
    local orphaned_count=0
    local orphaned_files=()

    log_verbose "Checking for orphaned state files in: $runs_dir"

    if [[ ! -d "$runs_dir" ]]; then
        log_check "pass" "Orphaned State Files" "No runs directory to check"
        return 0
    fi

    # Check for runs with state files but no run.json (orphaned state)
    while IFS= read -r -d '' run_dir; do
        local run_id=$(basename "$run_dir")
        local has_run_json=false
        local has_state_files=false

        if [[ -f "$run_dir/run.json" ]]; then
            has_run_json=true
        fi

        if [[ -d "$run_dir/state" ]] && [[ -n "$(ls -A "$run_dir/state" 2>/dev/null)" ]]; then
            has_state_files=true
        fi

        # Check for lock files that might indicate abandoned runs
        if [[ -f "$run_dir/.lock" ]]; then
            # Check if lock file is stale (older than 1 hour)
            local lock_age=$(( $(date +%s) - $(stat -c %Y "$run_dir/.lock" 2>/dev/null || stat -f %m "$run_dir/.lock" 2>/dev/null || echo 0) ))
            if [[ $lock_age -gt 3600 ]]; then
                orphaned_files+=("$run_id/.lock (stale)")
                ((orphaned_count++))
                log_verbose "Stale lock file: $run_dir/.lock (age: ${lock_age}s)"
            fi
        fi

        # Orphaned state: has state but no run.json
        if [[ "$has_state_files" == "true" ]] && [[ "$has_run_json" != "true" ]]; then
            orphaned_files+=("$run_id/state (no run.json)")
            ((orphaned_count++))
            log_verbose "Orphaned state directory: $run_dir/state"
        fi

    done < <(find "$runs_dir" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)

    if [[ $orphaned_count -gt 0 ]]; then
        log_check "warn" "Orphaned State Files" "$orphaned_count orphaned state file(s) found" \
            "Clean up with: rm -rf ${orphaned_files[*]}"
        return 0
    else
        log_check "pass" "Orphaned State Files" "No orphaned state files detected"
        return 0
    fi
}

# Output results as JSON
output_json() {
    local overall_status="healthy"
    local exit_code=0
    local i

    # Determine overall status
    for i in "${!CHECK_RESULTS[@]}"; do
        if [[ "${CHECK_RESULTS[$i]}" == "fail" ]]; then
            overall_status="unhealthy"
            exit_code=1
            break
        elif [[ "${CHECK_RESULTS[$i]}" == "warn" ]]; then
            if [[ "$overall_status" != "unhealthy" ]]; then
                overall_status="degraded"
                exit_code=2
            fi
        fi
    done

    # Build JSON output
    echo "{"
    echo "  \"version\": \"${VERSION}\","
    echo "  \"status\": \"${overall_status}\","
    echo "  \"exitCode\": ${exit_code},"
    echo "  \"pluginRoot\": \"${PLUGIN_ROOT}\","
    echo "  \"repoRoot\": \"${REPO_ROOT}\","
    echo "  \"summary\": {"
    echo "    \"total\": ${TOTAL_CHECKS},"
    echo "    \"passed\": ${PASSED_CHECKS},"
    echo "    \"failed\": ${FAILED_CHECKS},"
    echo "    \"warnings\": ${WARNINGS}"
    echo "  },"
    echo "  \"checks\": ["

    for i in "${!CHECK_NAMES[@]}"; do
        local comma=""
        if [[ $i -lt $((${#CHECK_NAMES[@]} - 1)) ]]; then
            comma=","
        fi

        # Escape quotes and special characters in messages
        local escaped_msg="${CHECK_MESSAGES[$i]//\\/\\\\}"
        escaped_msg="${escaped_msg//\"/\\\"}"
        escaped_msg="${escaped_msg//$'\n'/\\n}"

        local escaped_recovery="${CHECK_RECOVERY[$i]//\\/\\\\}"
        escaped_recovery="${escaped_recovery//\"/\\\"}"
        escaped_recovery="${escaped_recovery//$'\n'/\\n}"

        echo "    {"
        echo "      \"name\": \"${CHECK_NAMES[$i]}\","
        echo "      \"status\": \"${CHECK_RESULTS[$i]}\","
        echo "      \"message\": \"${escaped_msg}\","
        echo "      \"recovery\": \"${escaped_recovery}\""
        echo "    }${comma}"
    done

    echo "  ]"
    echo "}"
}

# Print summary for human-readable output
print_summary() {
    echo ""
    echo -e "${BOLD}=== Summary ===${NC}"
    echo ""
    echo "Plugin Root: $PLUGIN_ROOT"
    echo "Repo Root:   $REPO_ROOT"
    echo ""
    echo "Total checks: ${TOTAL_CHECKS}"
    echo -e "  ${GREEN}Passed:${NC}   ${PASSED_CHECKS}"
    echo -e "  ${RED}Failed:${NC}   ${FAILED_CHECKS}"
    echo -e "  ${YELLOW}Warnings:${NC} ${WARNINGS}"
    echo ""

    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo -e "${RED}${BOLD}Status: UNHEALTHY${NC}"
        echo "Critical issues detected. Please fix the failures above."
        if [[ "$VERBOSE" != "true" ]]; then
            echo "Run with --verbose for recovery suggestions."
        fi
    elif [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}${BOLD}Status: DEGRADED${NC}"
        echo "Plugin is functional but some issues were detected."
        if [[ "$VERBOSE" != "true" ]]; then
            echo "Run with --verbose for improvement suggestions."
        fi
    else
        echo -e "${GREEN}${BOLD}Status: HEALTHY${NC}"
        echo "All checks passed! The babysitter plugin is ready to use."
    fi
}

# Determine exit code
get_exit_code() {
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo 1
    elif [[ $WARNINGS -gt 0 ]]; then
        echo 2
    else
        echo 0
    fi
}

# Main function
main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --version)
                echo "health-check.sh version ${VERSION}"
                exit 0
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    if [[ "$JSON_OUTPUT" != "true" ]]; then
        echo -e "${BOLD}Babysitter Plugin Health Check${NC}"
        echo "==============================="
    fi

    # Run all checks
    print_header "Skills Check"
    check_skills_loaded || true

    print_header "Hooks Check"
    check_hooks_discoverable || true

    print_header "State Directory Check"
    check_session_state_writable || true

    print_header "Runs Directory Check"
    check_runs_directory || true

    print_header "Environment Check"
    check_environment_variables || true

    print_header "State Files Check"
    check_orphaned_state_files || true

    # Count results for JSON output
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        for result in "${CHECK_RESULTS[@]}"; do
            case "$result" in
                "pass") PASSED_CHECKS=$((PASSED_CHECKS + 1));;
                "fail") FAILED_CHECKS=$((FAILED_CHECKS + 1));;
                "warn") WARNINGS=$((WARNINGS + 1));;
            esac
        done
        output_json
    else
        print_summary
    fi

    # Exit with appropriate code
    exit $(get_exit_code)
}

# Run main function
main "$@"
