#!/bin/bash
# Compatibility stub only.
#
# Codex does not expose a native blocking Stop hook contract for this package.
# Keep this file as a no-op so older installs fail safe instead of pretending
# Codex can stay in the babysitter orchestration loop through a stop hook.

echo "{}"
echo "[babysitter-codex] Stop hook is not supported on Codex; continuation must stay in the external supervisor." >&2
exit 0
