#!/usr/bin/env bash
#
# verify-install.sh - Installation verification script for babysitter plugin
# Checks all required dependencies and validates plugin structure
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

# Output format flag
JSON_OUTPUT=false

# Results tracking
declare -a CHECK_RESULTS=()
declare -a CHECK_NAMES=()
declare -a CHECK_MESSAGES=()
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Print usage information
usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Verify the installation of the babysitter plugin for Claude Code.

Options:
    --json      Output results in JSON format (machine-readable)
    --version   Show script version
    -h, --help  Show this help message

Exit Codes:
    0   All checks passed
    1   One or more checks failed

EOF
}

# Log functions for human-readable output
log_check() {
    local status="$1"
    local name="$2"
    local message="$3"

    CHECK_NAMES+=("$name")
    CHECK_MESSAGES+=("$message")
    CHECK_RESULTS+=("$status")
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
            ;;
        "warn")
            echo -e "${YELLOW}⚠${NC} ${name}: ${message}"
            ((WARNINGS++))
            ;;
    esac
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

# Compare version numbers
# Returns 0 if $1 >= $2
version_gte() {
    local v1="$1"
    local v2="$2"

    # Extract major version
    local v1_major="${v1%%.*}"
    local v2_major="${v2%%.*}"

    if [[ "$v1_major" -gt "$v2_major" ]]; then
        return 0
    elif [[ "$v1_major" -lt "$v2_major" ]]; then
        return 1
    fi

    # Extract minor version
    local v1_rest="${v1#*.}"
    local v2_rest="${v2#*.}"
    local v1_minor="${v1_rest%%.*}"
    local v2_minor="${v2_rest%%.*}"

    # Handle cases where there's no minor version
    v1_minor="${v1_minor:-0}"
    v2_minor="${v2_minor:-0}"

    if [[ "$v1_minor" -ge "$v2_minor" ]]; then
        return 0
    else
        return 1
    fi
}

# Check Node.js version
check_nodejs() {
    local required_version="18"

    if ! command -v node &> /dev/null; then
        log_check "fail" "Node.js" "Not installed. Install Node.js ${required_version}+ from https://nodejs.org/"
        return 1
    fi

    local node_version
    node_version=$(node --version 2>/dev/null | sed 's/^v//')

    if version_gte "$node_version" "$required_version"; then
        log_check "pass" "Node.js" "Version ${node_version} (>=${required_version} required)"
        return 0
    else
        log_check "fail" "Node.js" "Version ${node_version} is below minimum ${required_version}. Upgrade at https://nodejs.org/"
        return 1
    fi
}

# Check npm availability
check_npm() {
    if ! command -v npm &> /dev/null; then
        log_check "fail" "npm" "Not installed. npm is included with Node.js - reinstall Node.js from https://nodejs.org/"
        return 1
    fi

    local npm_version
    npm_version=$(npm --version 2>/dev/null)
    log_check "pass" "npm" "Version ${npm_version}"
    return 0
}

# Check git availability
check_git() {
    if ! command -v git &> /dev/null; then
        log_check "fail" "git" "Not installed. Install from https://git-scm.com/downloads"
        return 1
    fi

    local git_version
    git_version=$(git --version 2>/dev/null | sed 's/git version //')
    log_check "pass" "git" "Version ${git_version}"
    return 0
}

# Check jq availability (required for hooks)
check_jq() {
    if ! command -v jq &> /dev/null; then
        log_check "fail" "jq" "Not installed. Required for hooks. Install:"
        if [[ "$JSON_OUTPUT" != "true" ]]; then
            echo "      macOS:   brew install jq"
            echo "      Ubuntu:  sudo apt-get install jq"
            echo "      Windows: choco install jq (or download from https://stedolan.github.io/jq/)"
        fi
        return 1
    fi

    local jq_version
    jq_version=$(jq --version 2>/dev/null | sed 's/jq-//')
    log_check "pass" "jq" "Version ${jq_version}"
    return 0
}

# Check plugin directory structure
check_plugin_structure() {
    local plugin_dir
    plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

    local required_dirs=("hooks" "skills" "commands" "agents" ".claude-plugin")
    local required_files=("plugin.json" "README.md")
    local missing_dirs=()
    local missing_files=()

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "${plugin_dir}/${dir}" ]]; then
            missing_dirs+=("$dir")
        fi
    done

    for file in "${required_files[@]}"; do
        if [[ ! -f "${plugin_dir}/${file}" ]]; then
            missing_files+=("$file")
        fi
    done

    if [[ ${#missing_dirs[@]} -eq 0 ]] && [[ ${#missing_files[@]} -eq 0 ]]; then
        log_check "pass" "Plugin Structure" "All required directories and files present"
        return 0
    else
        local msg="Missing:"
        if [[ ${#missing_dirs[@]} -gt 0 ]]; then
            msg+=" dirs=[${missing_dirs[*]}]"
        fi
        if [[ ${#missing_files[@]} -gt 0 ]]; then
            msg+=" files=[${missing_files[*]}]"
        fi
        log_check "fail" "Plugin Structure" "$msg"
        return 1
    fi
}

# Check SDK CLI availability
check_sdk_cli() {
    local sdk_version

    # Try to get version from SDK CLI
    if sdk_version=$(npx -y @a5c-ai/babysitter-sdk@latest --version 2>/dev/null); then
        log_check "pass" "SDK CLI" "Version ${sdk_version}"
        return 0
    else
        log_check "fail" "SDK CLI" "Unable to run SDK CLI. Check npm/network connectivity."
        if [[ "$JSON_OUTPUT" != "true" ]]; then
            echo "      Try: npx -y @a5c-ai/babysitter-sdk@latest --version"
        fi
        return 1
    fi
}

# Check if running in a supported environment
check_environment() {
    local os_type=""

    case "$(uname -s)" in
        Linux*)     os_type="Linux";;
        Darwin*)    os_type="macOS";;
        CYGWIN*|MINGW*|MSYS*) os_type="Windows (WSL/Git Bash)";;
        *)          os_type="Unknown";;
    esac

    if [[ "$os_type" == "Unknown" ]]; then
        log_check "warn" "Environment" "Unknown OS: $(uname -s). Script may not work correctly."
        return 0
    else
        log_check "pass" "Environment" "${os_type} detected"
        return 0
    fi
}

# Output results as JSON
output_json() {
    local overall_status="pass"
    local i

    # Determine overall status
    for i in "${!CHECK_RESULTS[@]}"; do
        if [[ "${CHECK_RESULTS[$i]}" == "fail" ]]; then
            overall_status="fail"
            break
        fi
    done

    # Build JSON output
    echo "{"
    echo "  \"version\": \"${VERSION}\","
    echo "  \"status\": \"${overall_status}\","
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

        # Escape quotes in messages
        local escaped_msg="${CHECK_MESSAGES[$i]//\"/\\\"}"

        echo "    {"
        echo "      \"name\": \"${CHECK_NAMES[$i]}\","
        echo "      \"status\": \"${CHECK_RESULTS[$i]}\","
        echo "      \"message\": \"${escaped_msg}\""
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
    echo "Total checks: ${TOTAL_CHECKS}"
    echo -e "  ${GREEN}Passed:${NC} ${PASSED_CHECKS}"
    echo -e "  ${RED}Failed:${NC} ${FAILED_CHECKS}"
    echo -e "  ${YELLOW}Warnings:${NC} ${WARNINGS}"
    echo ""

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}All checks passed! The babysitter plugin is ready to use.${NC}"
    else
        echo -e "${RED}${BOLD}Some checks failed. Please fix the issues above before using the plugin.${NC}"
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
            --version)
                echo "verify-install.sh version ${VERSION}"
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
        echo -e "${BOLD}Babysitter Plugin Installation Verification${NC}"
        echo "============================================"
    fi

    # Run all checks
    print_header "Environment Checks"
    check_environment || true

    print_header "Required Dependencies"
    check_nodejs || true
    check_npm || true
    check_git || true
    check_jq || true

    print_header "Plugin Checks"
    check_plugin_structure || true
    check_sdk_cli || true

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
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
