#!/bin/bash
# Babysitter Session Start Hook - delegates to SDK CLI
# If babysitter CLI is not installed yet, succeed silently.
command -v babysitter &>/dev/null || { echo "{}"; exit 0; }
exec babysitter hook:run --hook-type session-start --json < /dev/stdin
