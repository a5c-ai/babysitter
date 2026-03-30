---
name: posix-shell-validator
description: Validate scripts for POSIX compliance with portability checks, bashism detection, and cross-platform compatibility.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# POSIX Shell Validator

Validate scripts for POSIX compliance and portability.

## Capabilities

- Detect bashisms in shell scripts
- Validate POSIX compliance
- Check cross-platform compatibility
- Identify non-portable constructs
- Generate compliance reports
- Suggest portable alternatives

## Usage

Invoke this skill when you need to:
- Validate scripts for POSIX compliance
- Detect bashisms before deployment
- Ensure cross-platform compatibility
- Generate compliance reports

## Common Bashisms to Avoid

```bash
# Bashism → POSIX Alternative

# Arrays
arr=(a b c)           # Use: set -- a b c; or newline-separated
${arr[0]}             # Use: $1 (after set --)

# [[ ]] test
[[ $x == y ]]         # Use: [ "$x" = "y" ]
[[ $x =~ regex ]]     # Use: case or expr

# String substitution
${var/old/new}        # Use: $(echo "$var" | sed 's/old/new/')
${var,,}              # Use: $(echo "$var" | tr '[:upper:]' '[:lower:]')
${var^^}              # Use: $(echo "$var" | tr '[:lower:]' '[:upper:]')

# Arithmetic
((x++))               # Use: x=$((x + 1))
$((x**2))             # Use: $(expr $x \* $x) or awk

# Here strings
cat <<< "$var"        # Use: echo "$var" | cat

# Process substitution
diff <(cmd1) <(cmd2)  # Use: temp files

# Brace expansion
{1..10}               # Use: seq 1 10
file.{txt,md}         # Use: file.txt file.md

# Local variables
local var             # Use: var= (function-scoped in many shells)

# Source
source file           # Use: . file

# Function syntax
function name { }     # Use: name() { }
```

## Validation Script

```bash
#!/bin/sh
# POSIX compliance validator

check_file() {
    file="$1"
    errors=0

    # Check shebang
    head -1 "$file" | grep -q '^#!/bin/bash' && {
        echo "WARNING: $file uses bash shebang"
        errors=$((errors + 1))
    }

    # Check for bashisms
    bashisms='
        \[\[
        \(\(
        \$\{[^}]*//
        \$\{[^}]*,,
        \$\{[^}]*\^\^
        \$\{[^}]*:[-+=?][^}]*\}
        <<<
        <\(
        >\(
        \{[0-9]+\.\.[0-9]+\}
        function[[:space:]]+[a-zA-Z_]
        source[[:space:]]
        declare[[:space:]]
        local[[:space:]]
        readonly[[:space:]]
    '

    for pattern in $bashisms; do
        if grep -En "$pattern" "$file" 2>/dev/null; then
            echo "BASHISM: $file contains: $pattern"
            errors=$((errors + 1))
        fi
    done

    return $errors
}

# Run checkbashisms if available
if command -v checkbashisms >/dev/null 2>&1; then
    checkbashisms -f "$1"
else
    check_file "$1"
fi
```

## Target Processes

- shell-script-development
- cross-platform-cli-compatibility
- cli-unit-integration-testing
