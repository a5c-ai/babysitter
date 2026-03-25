---
name: shellcheck-config-generator
description: Generate .shellcheckrc configuration with appropriate rules, exclusions, and severity settings for shell script linting.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# ShellCheck Config Generator

Generate ShellCheck configuration for shell script linting.

## Capabilities

- Generate .shellcheckrc files
- Configure rule exclusions
- Set shell dialect
- Configure severity levels
- Document rule decisions
- Create project-specific configs

## Usage

Invoke this skill when you need to:
- Set up ShellCheck for a project
- Configure linting rules
- Exclude specific warnings
- Document rule decisions

## Generated Configuration

```ini
# .shellcheckrc - ShellCheck configuration
# https://www.shellcheck.net/wiki/

# Default shell dialect (sh, bash, dash, ksh)
shell=bash

# Source path for sourced files
source-path=SCRIPTDIR
source-path=lib/

# External sources (follow source commands)
external-sources=true

# Severity level: error, warning, info, style
severity=warning

# Disable specific warnings

# SC1090: Can't follow non-constant source
disable=SC1090

# SC1091: Not following (sourced file not found)
disable=SC1091

# SC2034: Variable appears unused (often used in sourced scripts)
# disable=SC2034

# SC2086: Double quote to prevent globbing (sometimes intentional)
# disable=SC2086

# SC2155: Declare and assign separately
# disable=SC2155

# Enable optional checks

# Check for unquoted variables that could be empty
enable=check-unassigned-uppercase

# Check for extra masking of return values
enable=check-extra-masked-returns
```

## Rule Categories

### Critical (Never Disable)
- SC2094: File read and written in same pipeline
- SC2095: Add < /dev/null to prevent ssh from eating stdin
- SC2096: Script requires shebang
- SC2148: Missing shebang

### Important (Disable Carefully)
- SC2086: Double quote to prevent globbing
- SC2046: Quote to prevent word splitting
- SC2035: Use ./* to avoid globbing issues
- SC2012: Use find instead of ls

### Style (Project Decision)
- SC2034: Variable appears unused
- SC2155: Declare and assign separately
- SC2164: Use cd ... || exit

## Target Processes

- shell-script-development
- cli-unit-integration-testing
- cross-platform-cli-compatibility
