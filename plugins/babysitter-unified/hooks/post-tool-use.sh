#!/bin/bash
set -euo pipefail
babysitter hook:run --harness unified --hook-type post-tool-use --json
