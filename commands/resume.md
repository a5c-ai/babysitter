# FILE: commands/resume.md
---
# Resume a previously stopped session

## Usage
```bash
session:resume --state-dir <path> --session-id <id>
```

## Description
Resumes a session from its saved state. The state file is located at `<state-dir>/state/<session-id>.md`.

## Implementation
```bash
#!/bin/bash

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --state-dir)
            state_dir="$2"
            shift 2
            ;;
        --session-id)
            session_id="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Construct state file path with 'state/' subdirectory
state_file="${state_dir}/state/${session_id}.md"

# Check if state file exists
if [[ ! -f "$state_file" ]]; then
    echo "Error: State file not found at $state_file"
    exit 1
fi

# Load state from file
source "$state_file"

# Resume session
echo "Resuming session $session_id from $state_file"
# Session resume logic here
```
```

```file:hooks/session-end.sh
# FILE: hooks/session-end.sh
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
# FILE: commands/run-create.md
---
# Create a new session

## Usage
```bash
session:create --state-dir <path>
```

## Description
Creates a new session and initializes the state directory structure.

## Implementation
```bash
#!/bin/bash

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --state-dir)
            state_dir="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create state directory structure
mkdir -p "${state_dir}/state"

# Generate session ID
session_id=$(date +%s)-$$

# Initialize session state file
state_file="${state_dir}/state/${session_id}.md"
cat > "$state_file" << EOF
SESSION_ID=$session_id
SESSION_START=$(date +%s)
# Session state will be updated during execution
EOF

echo "Created new session $session_id with state file at $state_file"
```
```