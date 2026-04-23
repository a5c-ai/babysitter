---
# Session end hook - saves session state

## Usage
This hook is automatically called when a session ends.

## Implementation
```bash
#!/bin/bash

# Get session ID from environment
session_id="${SESSION_ID:-unknown}"

# Construct state file path with 'state/' subdirectory
state_dir="${SESSION_STATE_DIR:-.}"
state_file="${state_dir}/state/${session_id}.md"

# Create state directory if it doesn't exist
mkdir -p "${state_dir}/state"

# Save session state to file
cat > "$state_file" << EOF
SESSION_ID=$session_id
SESSION_END=$(date +%s)
# Additional session state can be saved here
EOF

echo "Session $session_id state saved to $state_file"
```
```

```file:commands/run-create.md