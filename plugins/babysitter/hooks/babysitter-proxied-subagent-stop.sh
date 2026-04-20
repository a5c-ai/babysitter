#!/bin/bash
set -euo pipefail
babysitter hook:run --harness unified --hook-type subagent-stop --json
