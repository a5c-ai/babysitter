#!/bin/bash
# Compatibility stub only.
#
# Codex does not expose a native blocking SessionStart hook contract for this
# package. Keep this file as a no-op so older installs fail safe instead of
# routing Codex through the Claude-style SDK hook path.

echo "{}"
echo "[babysitter-codex] SessionStart hook is not supported on Codex; use explicit session binding in the external supervisor." >&2
exit 0
