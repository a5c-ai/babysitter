# In-Session Loop Mechanism - Technical Documentation

**Component:** Babysitter In-Session Orchestration Loop
**Version:** 4.0
**Date:** 2026-01-20

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Components](#3-components)
4. [Data Flow](#4-data-flow)
5. [State Management](#5-state-management)
6. [Stop Hook Mechanism](#6-stop-hook-mechanism)
7. [Completion Detection](#7-completion-detection)
8. [Error Handling](#8-error-handling)
9. [Security](#9-security)
10. [Examples](#10-examples)

---

## 1. Overview

### 1.1 Purpose

The in-session loop mechanism allows Claude to work on a task continuously within a single Claude Code session, with automatic iteration and self-improvement. Instead of Claude finishing and exiting, the system:

1. Prevents Claude from exiting
2. Analyzes Claude's output
3. Feeds the same prompt back to Claude
4. Creates a self-referential loop for iterative improvement

### 1.2 Key Features

- **Self-Referential:** Claude sees its previous work in files and git history
- **Iterative Improvement:** Each iteration can refine the previous attempt
- **Automatic Loop:** No manual intervention needed between iterations
- **Controlled Termination:** Via max iterations or completion promise
- **Session Isolation:** Each Claude Code session has its own loop state

### 1.3 Use Cases

**Good for:**
- Tasks requiring refinement and iteration
- Learning and experimentation
- Tasks where you want to see incremental progress
- Building complex features step-by-step

**Not recommended for:**
- Simple one-shot tasks
- Tasks with clear completion criteria (use external orchestration instead)
- Production automation (risk of infinite loops)

---

## 2. Architecture

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User: /babysitter:babysit Build a REST API                │ │
│  │         --max-iterations 20                             │ │
│  │                                                         │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Executes: setup-babysitter-run.sh $ARGUMENTS          │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Creates State File:                                   │ │
│  │  $CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md            │ │
│  │                                                         │ │
│  │  ---                                                    │ │
│  │  active: true                                           │ │
│  │  iteration: 1                                           │ │
│  │  max_iterations: 20                                     │ │
│  │  run_id: "<run-id>"                                     │ │
│  │  ---                                                    │ │
│  │  Build a REST API                                       │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Claude works on task...                               │ │
│  │  - Edits files                                          │ │
│  │  - Runs commands                                        │ │
│  │  - Makes commits                                        │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
│                        │ Claude tries to exit                │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Claude Code: Trigger Stop Hook                        │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Stop Hook: babysitter-stop-hook.sh                        │
│                                                             │
│  Input:  {"session_id": "...", "transcript_path": "..."}   │
│                                                             │
│  1. Load state file: $STATE_DIR/${SESSION_ID}.md           │
│  2. Parse YAML frontmatter (iteration, max, promise)       │
│  3. Check max iterations: ITERATION >= MAX_ITERATIONS?     │
│  4. Read last assistant message from transcript            │
│  5. Check completion promise: <promise>DONE</promise>?     │
│  6. If not complete:                                        │
│     - Increment iteration counter                          │
│     - Update state file                                     │
│     - Block exit with JSON: {"decision": "block"}          │
│     - Feed original prompt back to Claude                  │
│                                                             │
│  Output: {"decision": "block", "reason": "<prompt>"}       │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Claude Code: Inject prompt as new user message            │
│                                                             │
│  System Message: "🔄 Babysitter iteration 2 | ..."         │
│  User Message: "Build a REST API"                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Loop continues...
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Claude works on task again (iteration 2)                  │
│  - Sees previous work in files and git history             │
│  - Can improve or refine previous attempt                  │
│  - Continues until max iterations or promise detected      │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction

```
setup-babysitter-run.sh → Creates state file
          │
          ▼
Claude works on task
          │
          ▼
Claude tries to exit → Stop Hook triggered
          │
          ▼
babysitter-stop-hook.sh → Reads state file
          │               Checks completion
          ▼               Increments iteration
     Complete?
      /     \
    Yes      No
     │        │
     │        ▼
     │   Block exit & feed prompt back
     │        │
     │        └──────────┐
     │                   │
     ▼                   ▼
  Exit loop      Claude continues (next iteration)
```

---

## 3. Components

### 3.1 Slash Commands

**Location:** `plugins/babysitter/commands/`

**Available Commands:**

#### /babysitter:babysit

**File:** `run.md`

**Frontmatter:**
```yaml
---
description: "Start babysitter run in current session"
argument-hint: "PROMPT [--max-iterations N] [--run-id ID]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run.sh:*)"]
hide-from-slash-command-tool: "true"
---
```

**Execution:**
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run.sh" $ARGUMENTS
```

#### /babysitter:babysit resume

**File:** `resume.md`

**Frontmatter:**
```yaml
---
description: "Start babysitter run in current session"
argument-hint: "PROMPT [--max-iterations N]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run-resume.sh:*)", "Bash(${CLAUDE_PLUGIN_ROOT}/state/*:*)"]
hide-from-slash-command-tool: "true"
---
```

**Execution:**
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run-resume.sh" $ARGUMENTS
```

### 3.2 Setup Scripts

**Location:** `plugins/babysitter/skills/babysit/scripts/`

#### setup-babysitter-run.sh

**Purpose:** Initialize a new in-session loop

**Responsibilities:**
1. Parse command-line arguments (prompt, --max-iterations, optional --run-id)
2. Validate inputs
3. Check BABYSITTER_SESSION_ID is available
4. Create state file with YAML frontmatter and prompt
5. Display setup message and warnings

**Arguments:**
- `PROMPT...` - Task description (multiple words without quotes)
- `--max-iterations <n>` - Maximum iterations (0 = unlimited)
- `--run-id <id>` - Optional run ID to store in state (if already known)
- `--help` - Show help message

**State File Creation:**
```bash
cat > "$BABYSITTER_STATE_FILE" <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
run_id: "$RUN_ID"
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$PROMPT
EOF
```

**State File Location:**
```
$CLAUDE_PLUGIN_ROOT/state/${BABYSITTER_SESSION_ID}.md
```

#### setup-babysitter-run-resume.sh

**Purpose:** Resume an existing babysitter run in in-session mode

**Responsibilities:**
1. Parse run ID argument
2. Validate run exists via `run:status` CLI command
3. Prevent resuming completed runs
4. Create state file for in-session loop
5. Display resume information

**Differences from setup-babysitter-run.sh:**
- Takes run ID instead of prompt
- Checks run status via CLI
- Creates prompt from run metadata
- Includes run ID in state file

### 3.3 Claude Code Hooks

**Location:** `plugins/babysitter/hooks/`

**Hook Registration:** `hooks.json`

```json
{
  "description": "Babysitter plugin stop hook for continuous orchestration loops",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-session-start-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/babysitter-stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

#### babysitter-session-start-hook.sh

**Purpose:** Persist BABYSITTER_SESSION_ID for use in setup scripts

**Execution:** Triggered when Claude Code session starts

**Input Schema:**
```json
{
  "session_id": "abc-xyz-123"
}
```

**Implementation:**
```bash
# Read hook input from stdin
HOOK_INPUT=$(cat)

# Extract session_id
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')

# Persist to CLAUDE_ENV_FILE (provided by Claude Code)
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  echo "export BABYSITTER_SESSION_ID=\"$SESSION_ID\"" >> "$CLAUDE_ENV_FILE"
fi
```

**Effect:** Makes `$BABYSITTER_SESSION_ID` available to bash scripts in the session

#### babysitter-stop-hook.sh

**Purpose:** Intercept Claude Code exit attempts and continue the loop

**Execution:** Triggered when Claude tries to exit the session

**Input Schema:**
```json
{
  "session_id": "abc-xyz-123",
  "transcript_path": "/path/to/transcript.jsonl"
}
```

**Output Schema:**

**Allow exit:**
```json
{
  "decision": "allow"
}
```

**Block exit and continue loop:**
```json
{
  "decision": "block",
  "reason": "<prompt-text>",
  "systemMessage": "🔄 Babysitter iteration 2 | ..."
}
```

**Implementation:** See [Section 6](#6-stop-hook-mechanism) for detailed algorithm

---

## 4. Data Flow

### 4.1 Initialization Flow

```
User runs /babysitter:babysit
         │
         ▼
Command file parsed (run.md)
         │
         ▼
Execute setup-babysitter-run.sh with $ARGUMENTS
         │
         ▼
Parse arguments (prompt, --max-iterations, optional --run-id)
         │
         ▼
Validate inputs
         │
         ▼
Check BABYSITTER_SESSION_ID exists
         │
         ▼
Create state file: $CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md
         │
         │  ---
         │  active: true
         │  iteration: 1
         │  max_iterations: <n>
        │  run_id: "<run-id>"
         │  started_at: "<timestamp>"
         │  ---
         │  <PROMPT>
         │
         ▼
Display setup message
         │
         ▼
Output prompt to Claude
         │
         ▼
Claude starts working on task
```

### 4.2 Iteration Flow

```
Claude working on task
         │
         ▼
Claude completes work and tries to exit
         │
         ▼
Claude Code triggers Stop hook
         │
         ▼
babysitter-stop-hook.sh receives:
  {
    "session_id": "...",
    "transcript_path": "..."
  }
         │
         ▼
Load state file: $STATE_DIR/${SESSION_ID}.md
         │
         ▼
Parse YAML frontmatter:
  - iteration: 1
  - max_iterations: 20
  - run_id: "<run-id>"
         │
         ▼
Check max iterations: 1 >= 20? NO
         │
         ▼
Read transcript file
         │
         ▼
Extract last assistant message (JSONL format):
  grep '"role":"assistant"' | tail -1 | jq '.message.content'
         │
         ▼
Check completion proof (from run:status):
  Does output contain <promise>SECRET</promise>? NO
         │
         ▼
NOT COMPLETE - Continue loop:
  - Increment iteration: 2
  - Update state file
  - Extract original prompt
         │
         ▼
Output JSON:
  {
    "decision": "block",
    "reason": "<original-prompt>",
    "systemMessage": "🔄 Babysitter iteration 2 | ..."
  }
         │
         ▼
Claude Code injects prompt as new user message
         │
         ▼
Claude sees:
  - System message with iteration number
  - Original prompt again
  - Previous work in files/git
         │
         ▼
Claude continues working (iteration 2)
```

### 4.3 Completion Flow

```
Claude completes work and outputs: <promise>SECRET</promise>
         │
         ▼
Claude tries to exit
         │
         ▼
Stop hook triggered
         │
         ▼
Load state file
         │
         ▼
Read run:status completionProof
         │
         ▼
Extract last assistant message
         │
         ▼
Check for <promise> tags:
  perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s'
         │
         ▼
Extracted: "SECRET"
         │
         ▼
Compare: "SECRET" = "SECRET"? YES
         │
         ▼
COMPLETE - Allow exit:
  - Delete state file
  - Output message: "✅ Babysitter run: Detected <promise>DONE</promise>"
  - Return exit code 0 (allow exit)
         │
         ▼
Claude Code exits normally
```

---

## 5. State Management

### 5.1 State File Format

**Location:** `$CLAUDE_PLUGIN_ROOT/state/${BABYSITTER_SESSION_ID}.md`

**Format:** Markdown with YAML frontmatter

**Structure:**
```yaml
---
active: true
iteration: <current-iteration-number>
max_iterations: <max-iterations-or-0>
started_at: "<ISO-8601-timestamp>"
run_id: "<run-id-or-empty>"
---

<PROMPT-TEXT>
```

**Example:**
```yaml
---
active: true
iteration: 3
max_iterations: 20
started_at: "2026-01-20T10:15:30Z"
run_id: "run-20260120-example"
---

Build a REST API for managing todos with the following features:
- Create, read, update, delete todos
- User authentication
- Database persistence
```

### 5.2 State File Lifecycle

**Creation:**
- Created by `setup-babysitter-run.sh` or `setup-babysitter-run-resume.sh`
- Stored in session-isolated directory
- Contains initial values (iteration=1)

**Updates:**
- Updated by `babysitter-stop-hook.sh` on each iteration
- Only `iteration` field is updated
- Atomic update using temp file + mv

**Deletion:**
- Deleted when max iterations reached
- Deleted when completion promise detected
- Deleted on corruption errors

**Isolation:**
- Each session has its own state file
- File name includes session ID
- No cross-session interference

### 5.3 State File Parsing

**YAML Frontmatter Extraction:**
```bash
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$BABYSITTER_STATE_FILE")
```

**Field Extraction:**
```bash
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
RUN_ID=$(echo "$FRONTMATTER" | grep '^run_id:' | sed 's/run_id: *//' | sed 's/^"\(.*\)"$/\1/')
```

**Prompt Extraction:**
```bash
# Everything after second ---
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$BABYSITTER_STATE_FILE")
```

**Atomic Update:**
```bash
TEMP_FILE="${BABYSITTER_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$BABYSITTER_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$BABYSITTER_STATE_FILE"
```

---

## 6. Stop Hook Mechanism

### 6.1 Algorithm

**Input:** JSON payload from Claude Code via stdin
```json
{
  "session_id": "abc-xyz-123",
  "transcript_path": "/path/to/session/transcript.jsonl"
}
```

**Steps:**

1. **Read hook input**
   ```bash
   HOOK_INPUT=$(cat)
   ```

2. **Extract session ID**
   ```bash
   SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')
   ```

3. **Check if loop is active**
   ```bash
   BABYSITTER_STATE_FILE="$STATE_DIR/${SESSION_ID}.md"
   if [[ ! -f "$BABYSITTER_STATE_FILE" ]]; then
     exit 0  # Allow exit - no active loop
   fi
   ```

4. **Parse state file**
   ```bash
   FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$BABYSITTER_STATE_FILE")
   ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
   MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
   COMPLETION_PROMISE=$(...)
   ```

5. **Validate numeric fields**
   ```bash
   if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
     echo "⚠️  Babysitter run: State file corrupted" >&2
     rm "$BABYSITTER_STATE_FILE"
     exit 0  # Allow exit
   fi
   ```

6. **Check max iterations**
   ```bash
   if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
     echo "🛑 Babysitter run: Max iterations ($MAX_ITERATIONS) reached."
     rm "$BABYSITTER_STATE_FILE"
     exit 0  # Allow exit
   fi
   ```

7. **Extract transcript path**
   ```bash
   TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')
   ```

8. **Read last assistant message**
   ```bash
   LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
   LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
     .message.content |
     map(select(.type == "text")) |
     map(.text) |
     join("\n")
   ')
   ```

9. **Check completion promise**
   ```bash
   if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
     PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g')

     if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
       echo "✅ Babysitter run: Detected <promise>$COMPLETION_PROMISE</promise>"
       rm "$BABYSITTER_STATE_FILE"
       exit 0  # Allow exit
     fi
   fi
   ```

10. **Not complete - continue loop**
    ```bash
    NEXT_ITERATION=$((ITERATION + 1))
    PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$BABYSITTER_STATE_FILE")

    # Update iteration
    TEMP_FILE="${BABYSITTER_STATE_FILE}.tmp.$$"
    sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$BABYSITTER_STATE_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$BABYSITTER_STATE_FILE"

    # Build system message
    SYSTEM_MSG="🔄 Babysitter iteration $NEXT_ITERATION | ..."

    # Block exit and feed prompt back
    jq -n \
      --arg prompt "$PROMPT_TEXT" \
      --arg msg "$SYSTEM_MSG" \
      '{
        "decision": "block",
        "reason": $prompt,
        "systemMessage": $msg
      }'
    ```

### 6.2 Exit Conditions

**Allow exit when:**
1. No state file exists (no active loop)
2. Max iterations reached: `ITERATION >= MAX_ITERATIONS`
3. Completion promise detected: `<promise>TEXT</promise>` matches exactly
4. State file corrupted (safety exit)
5. Transcript unavailable or invalid (safety exit)

**Block exit when:**
1. State file exists
2. Iterations remaining: `ITERATION < MAX_ITERATIONS` (or unlimited)
3. No completion promise detected

### 6.3 Output Format

**Allow exit:**
```bash
# Simply exit with code 0
exit 0
```

**Block exit:**
```json
{
  "decision": "block",
  "reason": "<original-prompt-text>",
  "systemMessage": "🔄 Babysitter iteration N | To stop: output <promise>TEXT</promise> (ONLY when TRUE!)"
}
```

---

## 7. Completion Detection

### 7.1 Completion Promise Mechanism

**Purpose:** Allow Claude to signal completion programmatically

**Format:** XML-like tags
```xml
<promise>COMPLETION_TEXT</promise>
```

**Requirements:**
- Must use exact tags: `<promise>` and `</promise>`
- Promise text must match exactly (case-sensitive, whitespace-normalized)
- Promise statement must be TRUE (not aspirational)

**Example:**
```
Run completes; CLI emits completionProof: "b1c2..."

Claude outputs:
<promise>b1c2...</promise>
```

### 7.2 Promise Extraction

**Algorithm:**
```bash
# Extract text between <promise> tags using Perl
# -0777: slurp entire input
# s flag: . matches newlines
# .*?: non-greedy match
# Whitespace normalization
PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe '
  s/.*?<promise>(.*?)<\/promise>.*/$1/s;
  s/^\s+|\s+$//g;
  s/\s+/ /g
' 2>/dev/null || echo "")
```

**Why Perl?**
- Supports multiline matching (Bash regex doesn't)
- Non-greedy matching for first `<promise>` tag
- Reliable across platforms

### 7.3 Promise Comparison

**Implementation:**
```bash
# Use = for literal string comparison (not == which does glob matching)
if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
  # Complete!
fi
```

**Security Considerations:**
- Uses `=` not `==` (no glob pattern matching)
- Prevents exploitation with `*`, `?`, `[` characters
- Exact match only

### 7.4 Max Iterations

**Purpose:** Prevent infinite loops

**Behavior:**
- `0` = unlimited (loop forever)
- `N > 0` = stop after N iterations

**Check:**
```bash
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION >= $MAX_ITERATIONS ]]; then
  echo "🛑 Babysitter run: Max iterations ($MAX_ITERATIONS) reached."
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi
```

**Iteration Counting:**
- Starts at 1
- Incremented before feeding prompt back
- Displayed in system message

---

## 8. Error Handling

### 8.1 State File Corruption

**Detection:**
```bash
# Validate numeric fields
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Babysitter run: State file corrupted" >&2
  echo "   Problem: 'iteration' field is not a valid number" >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0  # Allow exit
fi
```

**Response:**
- Display user-friendly error message
- Delete corrupted state file
- Allow exit (safety measure)

### 8.2 Missing Session ID

**Detection:**
```bash
if [[ -z "$SESSION_ID" ]]; then
  exit 0  # Allow exit
fi
```

**Response:**
- Silent exit (no error message)
- Allow exit

### 8.3 Missing Transcript

**Detection:**
```bash
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "⚠️  Babysitter run: Transcript file not found" >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi
```

**Response:**
- Display error message
- Delete state file (can't continue without transcript)
- Allow exit

### 8.4 JSON Parsing Errors

**Detection:**
```bash
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '...' 2>&1)

if [[ $? -ne 0 ]]; then
  echo "⚠️  Babysitter run: Failed to parse assistant message JSON" >&2
  echo "   Error: $LAST_OUTPUT" >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi
```

**Response:**
- Display error with jq error message
- Delete state file
- Allow exit

### 8.5 Empty Prompt

**Detection:**
```bash
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$BABYSITTER_STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
  echo "⚠️  Babysitter run: State file corrupted or incomplete" >&2
  echo "   Problem: No prompt text found" >&2
  rm "$BABYSITTER_STATE_FILE"
  exit 0
fi
```

**Response:**
- Display error message
- Delete state file
- Allow exit

### 8.6 Error Philosophy

**Fail-safe approach:**
- When in doubt, allow exit
- Delete corrupted state to prevent retry loops
- Provide clear error messages
- Never leave session in broken state

---

## 9. Security

### 9.1 Session Isolation

**Mechanism:**
- Each session has unique `BABYSITTER_SESSION_ID`
- State file named with session ID
- No cross-session access

**Benefits:**
- Multiple Claude Code windows can run independently
- No state leakage between sessions
- Clean separation of concerns

### 9.2 Completion Proof Security

**Threat:** Malicious or accidental glob pattern exploitation

**Example Attack:**
```bash
# If using == (glob matching):
completion_proof: "DONE"
claude_output: "<promise>D*</promise>"  # Would match!
```

**Mitigation:**
```bash
# Use = (literal string comparison, not ==)
if [[ "$PROMISE_TEXT" = "$COMPLETION_PROOF" ]]; then
  # Only exact match
fi
```

**Additional Protections:**
- Whitespace normalization (prevent space-based bypass)
- XML tags required (can't accidentally match)
- Case-sensitive matching

### 9.3 Input Validation

**Numeric Fields:**
```bash
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  # Reject - not a valid number
fi
```

**Path Validation:**
- Transcript path from Claude Code (trusted source)
- State file in controlled directory

**JSON Validation:**
- Use jq for parsing (prevents injection)
- Check jq exit code
- Handle parse errors gracefully

### 9.4 File Operations

**Atomic Updates:**
```bash
# Use temp file + mv (atomic on POSIX)
TEMP_FILE="${BABYSITTER_STATE_FILE}.tmp.$$"
sed "..." "$BABYSITTER_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$BABYSITTER_STATE_FILE"
```

**File Deletion:**
```bash
# Always delete state file on exit/error
rm "$BABYSITTER_STATE_FILE"
```

**Directory Permissions:**
- State directory created with default permissions
- No special privileges needed

---

## 10. Examples

### 10.1 Simple Task with Max Iterations

**Command:**
```bash
/babysitter:babysit Fix the authentication bug --max-iterations 10
```

**Flow:**
1. Iteration 1: Claude analyzes code, identifies bug
2. Iteration 2: Claude implements fix
3. Iteration 3: Claude adds tests
4. Iteration 4: Claude refines tests based on failures
5. Iteration 5: Claude improves error messages
6. ...
10. Iteration 10: Max iterations reached, loop exits

**Output:**
```
🛑 Babysitter run: Max iterations (10) reached.
```

### 10.2 Task with Completion Proof

**Command:**
```bash
/babysitter:babysit Build a REST API for todos \
  --max-iterations 50
```

**Flow:**
1. Iterations 1-5: Claude builds basic API structure
2. Iterations 6-10: Claude adds endpoints
3. Iterations 11-15: Claude adds tests
4. Iterations 16-20: Claude fixes test failures
5. Iteration 21: All tests pass!
6. CLI emits completionProof on completion
7. Claude outputs: `<promise><completionProof></promise>`
8. Loop exits

**Output:**
```
✅ Babysitter run: Detected <promise><completionProof></promise>
```

### 10.3 Infinite Loop (No Limits)

**Command:**
```bash
/babysitter:babysit Improve code quality
```

**Flow:**
- Loop runs indefinitely
- Claude continuously refines code
- Never exits (user must manually stop)

**Warning:**
```
⚠️  WARNING: This loop cannot be stopped manually! It will run infinitely
    unless you set --max-iterations or the run completes.
```

### 10.4 Resume Existing Run

**Command:**
```bash
/babysitter:babysit resume run-20260120-example --max-iterations 20
```

**Flow:**
1. Script checks run exists via `run:status`
2. Creates in-session loop state
3. Loop continues from current run state
4. Each iteration calls `run:iterate` (not shown in this mechanism)

---

## Appendix A: State File Examples

### Example 1: Active Loop

```yaml
---
active: true
iteration: 5
max_iterations: 20
started_at: "2026-01-20T10:15:30Z"
run_id: "run-20260120-example"
---

Build a REST API for managing todos with the following features:
- Create, read, update, delete todos
- User authentication
- Database persistence
```

### Example 2: Unlimited Loop

```yaml
---
active: true
iteration: 42
max_iterations: 0
started_at: "2026-01-20T09:00:00Z"
run_id: ""
---

Improve the codebase quality by refactoring and adding tests.
```

### Example 3: Resume Mode

```yaml
---
active: true
iteration: 1
max_iterations: 15
started_at: "2026-01-20T14:30:00Z"
run_id: "run-20260120-example"
---

Resume Babysitter run: run-20260120-example

Process: dev/build
Current state: running

Continue orchestration using run:iterate loop.
```

---

## Appendix B: Hook Input/Output Examples

### SessionStart Hook Input

```json
{
  "session_id": "abc-xyz-123-456-789"
}
```

### SessionStart Hook Output

No output (writes to `$CLAUDE_ENV_FILE`)

### Stop Hook Input

```json
{
  "session_id": "abc-xyz-123-456-789",
  "transcript_path": "/Users/user/.claude/projects/my-project/abc-xyz.jsonl"
}
```

### Stop Hook Output (Allow Exit)

```bash
exit 0
```

### Stop Hook Output (Block Exit)

```json
{
  "decision": "block",
  "reason": "Build a REST API for todos",
  "systemMessage": "🔄 Babysitter iteration 6 | To stop: output <promise>DONE</promise> (ONLY when TRUE!)"
}
```

---

## Appendix C: Transcript Format

**File:** Claude Code stores conversation as JSONL (JSON Lines)

**Format:** One JSON object per line, each representing a message

**Example:**
```jsonl
{"type":"message","role":"user","message":{"type":"message","content":[{"type":"text","text":"Build a REST API"}]}}
{"type":"message","role":"assistant","message":{"type":"message","content":[{"type":"text","text":"I'll build a REST API..."}]}}
{"type":"message","role":"assistant","message":{"type":"message","content":[{"type":"text","text":"Implementation complete!\n\n<promise>DONE</promise>"}]}}
```

**Extraction:**
```bash
# Get last assistant message
LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)

# Parse JSON and extract text content
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
')
```

---

**END OF TECHNICAL DOCUMENTATION**

**Document Metadata:**
- Created: 2026-01-20
- Component: In-Session Loop Mechanism
- Related: babysitter-stop-hook.sh, setup-babysitter-run.sh
- Status: Production
