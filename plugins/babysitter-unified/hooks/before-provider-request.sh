#!/bin/bash
set -euo pipefail
babysitter hook:run --harness unified --hook-type before-provider-request --json
