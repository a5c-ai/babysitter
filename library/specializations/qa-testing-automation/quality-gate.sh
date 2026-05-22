#!/usr/bin/env bash
# library/specializations/qa-testing-automation/quality-gate.sh
#
# Pipefail-safe quality gate for shell tasks in babysitter processes.
# Parses pass/fail counts from a test-suite log file independently of any
# pipefail-affected upstream exit code, computes the pass-rate in basis
# points, and exits 0/1 against a configurable threshold.
#
# See library/specializations/qa-testing-automation/quality-gate.md for
# the canonical usage pattern and the greedy-regex bug narrative — DO NOT
# "simplify" the grep+awk pipeline to a sed regex with `.*([0-9]+) passed.*`
# without reading that section first.
#
# Usage: source path/to/quality-gate.sh, then call:
#   bash quality-gate.sh <log-path> [min-bps=9500]
#
# Or invoke directly:
#   .a5c/processes/lib/quality-gate.sh /tmp/playwright.log 9500
#
# Output: a single line "QUALITY_GATE pass=X fail=Y ratio_bps=Z threshold_bps=T"
# followed by QUALITY_GATE_PASS (exit 0) or QUALITY_GATE_FAIL (exit 1).

set -euo pipefail
LOG="${1:?usage: quality-gate.sh <log-path> [min-bps=9500]}"
MIN_BPS="${2:-9500}"
[ -f "$LOG" ] || { echo "QUALITY_GATE_FAIL: log not found at $LOG"; exit 1; }
PASS=$(grep -Eo "[0-9]+ passed" "$LOG" | tail -1 | awk '{print $1}')
FAIL=$(grep -Eo "[0-9]+ failed" "$LOG" | tail -1 | awk '{print $1}')
PASS=${PASS:-0}; FAIL=${FAIL:-0}
TOTAL=$((PASS+FAIL))
[ "$TOTAL" -gt 0 ] || { echo "QUALITY_GATE_PARSE_FAIL: could not parse pass/fail counts from $LOG"; exit 1; }
RATIO=$((PASS*10000/TOTAL))
echo "QUALITY_GATE pass=$PASS fail=$FAIL ratio_bps=$RATIO threshold_bps=$MIN_BPS"
if [ "$RATIO" -ge "$MIN_BPS" ]; then echo "QUALITY_GATE_PASS"; exit 0; else echo "QUALITY_GATE_FAIL"; exit 1; fi
