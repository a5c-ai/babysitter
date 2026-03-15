#!/bin/bash
set -e

# Check for API key (support both direct Anthropic and Azure Foundry)
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$ANTHROPIC_FOUNDRY_API_KEY" ] && [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY, ANTHROPIC_FOUNDRY_API_KEY, or AZURE_OPENAI_API_KEY environment variable is required"
    exit 1
fi

# Set working directory
cd /workspace 2>/dev/null || cd /app

# Output format (default to text for non-interactive, can be overridden)
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"

# Plugin directory — discover from cache (single entry created at build time)
PLUGIN_DIR=$(ls -d /home/claude/.claude/plugins/cache/a5c-ai/babysitter/*/ 2>/dev/null | head -1)
PLUGIN_DIR="${PLUGIN_DIR%/}" # strip trailing slash
if [ -z "$PLUGIN_DIR" ] || [ ! -d "$PLUGIN_DIR" ]; then
    echo "Error: babysitter plugin not found in cache"
    exit 1
fi

# If PROMPT is set, run babysitter skill with it
# If arguments are provided, use those instead
# If neither, start interactive Claude session
if [ $# -gt 0 ]; then
    # Arguments provided - invoke babysitter:babysit skill with the prompt
    exec claude --plugin-dir "$PLUGIN_DIR" --dangerously-skip-permissions --output-format "$OUTPUT_FORMAT" -p "/babysitter:babysit $*"
elif [ -n "$PROMPT" ]; then
    # PROMPT env var set - invoke babysitter:babysit skill
    exec claude --plugin-dir "$PLUGIN_DIR" --dangerously-skip-permissions --output-format "$OUTPUT_FORMAT" -p "/babysitter:babysit $PROMPT"
else
# No prompt - start interactive session (no output format for interactive)
    exec claude --plugin-dir "$PLUGIN_DIR" --dangerously-skip-permissions
fi
