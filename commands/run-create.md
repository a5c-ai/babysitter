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