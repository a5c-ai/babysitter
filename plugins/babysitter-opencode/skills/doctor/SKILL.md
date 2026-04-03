---
name: doctor
description: Diagnose babysitter run health - journal integrity, state cache, effects, locks, sessions, logs, and disk usage
---

# doctor

You are a diagnostic agent for the babysitter runtime. Your job is to perform a comprehensive health check across 10 areas and produce a structured diagnostic report. Follow each section methodically. Track results as you go and produce the final summary at the end.

Initialize a results tracker with these 10 checks, all starting as PENDING:
1. Run Discovery
2. Journal Integrity
3. State Cache Consistency
4. Effect Status
5. Lock Status
6. Session State
7. Log Analysis
8. Disk Usage
9. Process Validation
10. Hook Execution Health

---

## 1. Run Discovery

**Goal:** Identify the target run and display its metadata.

- List all runs by running: `ls -lt .a5c/runs/`
- If the user provided a run ID argument, use that as the run ID. Otherwise, use the most recent run directory (the first entry from the listing).
- Store the resolved run ID and construct the run directory path: `.a5c/runs/<runId>`
- Verify the run directory exists. If it does not exist, report FAIL for this check and stop the entire diagnostic (no run to diagnose).
- Show run metadata by running: `npx babysitter run:status .a5c/runs/<runId> --json`
- Parse and display: runId, processId, entrypoint/importPath, createdAt, current state.
- Mark this check as PASS.

---

## 2. Journal Integrity

**Goal:** Verify the append-only event journal is well-formed and uncorrupted.

- List all journal events by running: `npx babysitter run:events .a5c/runs/<runId> --json`
- List all files in `.a5c/runs/<runId>/journal/` sorted by name.
- If the journal directory is empty or missing, mark as FAIL and note "No journal entries found."

For each journal file (named `<seq>.<ulid>.json`):

**Sequential numbering check:**
- Extract the sequence number prefix from each filename (e.g., `000001` from `000001.01JAXYZ.json`).
- Verify sequence numbers are contiguous starting from 000001 with no gaps.
- If gaps found, mark as WARN and list the missing sequence numbers.

**Checksum verification:**

The SDK computes checksums as follows: it first builds the event payload **without** the `checksum` field (`{ type, recordedAt, data }`), serializes it with `JSON.stringify(payload, null, 2) + "\n"` (pretty-printed with a trailing newline), then computes SHA256 of that string. To verify:

- Read each journal file as JSON.
- Extract and remove the `checksum` field from the parsed object.
- Re-serialize the remaining object with `JSON.stringify(remaining, null, 2) + "\n"` — **must** use 2-space indentation and a trailing newline to match the SDK.
- Compute SHA256 (hex) of that exact string.
- Compare computed checksum with the stored checksum.
- If any mismatch, mark as FAIL and list the corrupt files.

Example bash one-liner for a single file:
```bash
node -e "const fs=require('fs'); const f=process.argv[1]; const obj=JSON.parse(fs.readFileSync(f,'utf8')); const stored=obj.checksum; delete obj.checksum; const expected=require('crypto').createHash('sha256').update(JSON.stringify(obj,null,2)+'\n').digest('hex'); console.log(stored===expected?'OK':'MISMATCH',f)" <file>
```

**Timestamp monotonicity check:**
- Extract `recordedAt` from each event.
- Verify each timestamp is >= the previous one.
- If any timestamp goes backward, mark as WARN and list the offending entries.

**Event type summary:**
- Count events by type: RUN_CREATED, EFFECT_REQUESTED, EFFECT_RESOLVED, STOP_HOOK_INVOKED, RUN_COMPLETED, RUN_FAILED, and any other types encountered.
- Display the counts in a table.

**Orphan detection:**
- Flag any files in the journal directory that do not match the expected `<seq>.<ulid>.json` naming pattern.

If all sub-checks pass, mark as PASS. If any sub-check is WARN, mark as WARN. If any sub-check is FAIL, mark as FAIL.

---

## 3. State Cache Consistency

**Goal:** Verify the derived state cache matches the current journal.

- Check if `.a5c/runs/<runId>/state/state.json` exists.
- If it does not exist, mark as WARN and recommend: `npx babysitter run:rebuild-state .a5c/runs/<runId>`

If it exists:
- Read `state.json` and extract the `journalHead` field (contains `seq`, `ulid`, and `checksum`).
- Determine the actual last journal entry by reading the last file in `.a5c/runs/<runId>/journal/` (highest sequence number).
- Extract the sequence number and ULID from the last journal filename, and the checksum from its content.
- Compare:
  - `journalHead.seq` should match the last journal file's sequence number.
  - `journalHead.ulid` should match the last journal file's ULID.
  - `journalHead.checksum` should match the last journal file's checksum.
- If all match, mark as PASS.
- If any mismatch, mark as WARN and recommend: `npx babysitter run:rebuild-state .a5c/runs/<runId>`
- Also verify `schemaVersion` field is present and report its value.

---

## 4. Effect Status

**Goal:** Identify stuck, errored, or pending effects.

- Run: `npx babysitter task:list .a5c/runs/<runId> --json`
- Run: `npx babysitter task:list .a5c/runs/<runId> --pending --json`
- Parse the JSON output from both commands.

**All effects summary:**
- Count total effects, resolved effects, and pending effects.
- Group and count effects by `kind` (node, breakpoint, orchestrator_task, sleep, etc.).

**Stuck effect detection:**
- For each pending effect, check its `requestedAt` timestamp.
- If any pending effect was requested more than 30 minutes ago, flag it as STUCK.
- List stuck effects with their effectId, kind, taskId, and age.

**Error detection:**
- Identify any effects with error status in their results.
- List errored effects with their effectId and error message.

**Pending summary:**
- Summarize pending effects grouped by kind with count per kind.

Mark as PASS if no stuck or errored effects. Mark as WARN if there are pending effects older than 30 minutes. Mark as FAIL if there are errored effects.

---

## 5. Lock Status

**Goal:** Detect stale or orphaned run locks.

- Check if `.a5c/runs/<runId>/run.lock` exists.
- If it does not exist, mark as PASS ("No lock held -- run is not actively being iterated").

If it exists:
- Read the lock file (JSON with `pid`, `owner`, `acquiredAt`).
- Display the lock info: PID, owner, acquired time, and age of the lock.
- Check if the PID is still alive by running: `kill -0 <pid> 2>/dev/null; echo $?` (exit code 0 means alive, non-zero means dead). On Windows/MINGW, use `tasklist //FI "PID eq <pid>" 2>/dev/null` or equivalent.
- If the process is alive, mark as PASS ("Lock held by active process").
- If the process is dead, mark as FAIL ("Stale lock detected -- process <pid> is no longer running").
  - Recommend: `rm .a5c/runs/<runId>/run.lock`

---

## 6. Session State

**Goal:** Inspect babysitter session files for health and detect runaway loops.

- Search for session state files using Glob:
  - `.a5c/state/*.md`
  - `.a5c/state/*.json`
- For each session state file found:
  - Read the file and extract available information: iteration count, associated runId, timestamps, session status.
  - Display: filename, iteration count, runId (if present), last activity time.

**Runaway loop detection:**
- If any session file contains iteration timing data, compute the average time between iterations.
- If the average iteration time is less than 3 seconds, flag as WARN ("Possible runaway loop detected -- average iteration time is under 3 seconds").

**Session classification:**
- Active: session has recent activity (within last 30 minutes).
- Stale: session has no activity for more than 30 minutes.
- Display counts of active vs stale sessions.

Mark as PASS if no issues. Mark as WARN if runaway loops or stale sessions detected.

---

## 7. Log Analysis

**Goal:** Analyze babysitter log files for errors, warnings, and hook decisions.

Read the last 50 lines of each of these log files (if they exist):
- `.a5c/logs/hooks.log`
- `.a5c/logs/babysitter-opencode-stop-hook.log`
- `.a5c/logs/babysitter-opencode-session-start-hook.log`
- `.a5c/logs/babysitter.log`
- `$HOME/.a5c/logs/` and relevant logs and run/session specific logs there

For each log file:
- If the file does not exist, note it as "Not found (OK if hooks have not run yet)."
- If the file exists, analyze its content.

**Error/Warning detection (all logs):**
- Count and list lines containing "ERROR" or "WARN" (case-insensitive).
- Display the last 10 error/warning lines from each log.

Mark as PASS if no ERROR lines found. Mark as WARN if WARN lines found but no ERROR. Mark as FAIL if ERROR lines found.

---

## 8. Disk Usage

**Goal:** Report disk consumption and identify oversized files.

- Run `du -sh .a5c/runs/<runId>` for the total run directory size.
- Run `du -sh` on each subdirectory:
  - `.a5c/runs/<runId>/journal/`
  - `.a5c/runs/<runId>/tasks/`
  - `.a5c/runs/<runId>/blobs/`
  - `.a5c/runs/<runId>/state/`
  - `.a5c/runs/<runId>/process/` (if it exists)

- Display results in a table: directory, size.

**Large file detection:**
- Find individual files larger than 10MB within the run directory: `find .a5c/runs/<runId> -type f -size +10M -exec ls -lh {} \;`
- If any found, list them with their paths and sizes.

- Report the total run directory size prominently.

Mark as PASS if total size < 500MB and no files > 10MB. Mark as WARN if total size > 500MB or any files > 10MB. Mark as FAIL if total size > 2GB.

---

## 9. Process Validation

**Goal:** Verify the process entrypoint and SDK dependency are valid.

- Read `.a5c/runs/<runId>/run.json` and extract the `importPath` (or `entrypoint`) field.
- Check if the referenced process file exists on disk. Use Glob or file read to verify.
- If the file does not exist, mark as FAIL ("Process entrypoint not found on disk").

**SDK dependency check:**
- Read `.a5c/package.json` (if it exists) or the project root `package.json`.
- Check for `@a5c-ai/babysitter-sdk` in `dependencies` or `devDependencies`.
- Report the installed version.
- If the dependency is missing, mark as WARN.
- If present, verify it looks like a valid semver version and mark as PASS.

---

## 10. Hook Execution Health

**Goal:** Verify that the babysitter CLI is available and the OpenCode plugin is properly configured.

### 10a. Plugin Configuration

- Check if `.opencode/plugins/babysitter/` directory exists in the project.
- If found, verify that the plugin entry point (`index.js` or `index.ts`) exists.
- If the plugin directory doesn't exist, mark as WARN ("OpenCode babysitter plugin not installed in .opencode/plugins/").

### 10b. CLI Availability (babysitter command)

The orchestration loop delegates to the `babysitter` CLI. Check if it is available:
- Run: `command -v babysitter 2>/dev/null && babysitter --version 2>/dev/null`
- If the command is found, display its path and version. Mark sub-check as PASS.
- If not found, check the user-local prefix: `$HOME/.local/bin/babysitter --version 2>/dev/null`
- If neither is found, mark sub-check as FAIL ("babysitter CLI not found — orchestration will fail. Install with: `npm i -g @a5c-ai/babysitter-sdk`").

### 10c. OpenCode-Specific Notes

OpenCode does NOT have a native blocking stop hook. The `session.idle` event is fire-and-forget. Orchestration must use the in-turn loop model (agent drives `run:iterate` repeatedly within a single turn). This is expected behavior, not a failure.

### 10d. Verdict

Mark as PASS if:
- CLI is available (10b)
- Plugin is configured (10a)

Mark as WARN if:
- CLI is available but plugin is not configured

Mark as FAIL if:
- CLI is not available

---

## Final Report

After completing all 10 checks, produce the diagnostic report in this format:

```
============================================
  BABYSITTER DIAGNOSTIC REPORT
  Run: <runId>
  Time: <current timestamp>
============================================

OVERALL HEALTH: <HEALTHY | WARNING | CRITICAL>

--------------------------------------------
  CHECK RESULTS
--------------------------------------------

| #  | Check                    | Status |
|----|--------------------------|--------|
| 1  | Run Discovery            | <status> |
| 2  | Journal Integrity        | <status> |
| 3  | State Cache Consistency  | <status> |
| 4  | Effect Status            | <status> |
| 5  | Lock Status              | <status> |
| 6  | Session State            | <status> |
| 7  | Log Analysis             | <status> |
| 8  | Disk Usage               | <status> |
| 9  | Process Validation       | <status> |
| 10 | Hook Execution Health    | <status> |

--------------------------------------------
  ISSUES & RECOMMENDATIONS
--------------------------------------------

<For each WARN or FAIL check, list:>
- [WARN|FAIL] <Check name>: <description of issue>
  Fix: <specific actionable command or instruction>

--------------------------------------------
```

**Overall health determination:**
- **HEALTHY**: All 10 checks are PASS.
- **WARNING**: At least one check is WARN but none are FAIL.
- **CRITICAL**: At least one check is FAIL.

Present the full detailed findings for each check BEFORE the summary table, so the user can see the evidence. End with the summary table and recommendations. Also, create a single HTML report file with all the findings that uses the arwes UI framework and open it for the user in the browser.

---

## After Diagnosis: Contribute Back

After diagnosing issues, prompt the user to report or fix what was found -- they don't need to fix the bug themselves, just reporting it is valuable. Suggest `/babysitter:contrib` based on the situation:

- **Found a bug but didn't fix it**: `/babysitter:contrib bug report: [what the doctor found, e.g. "state cache rebuild silently drops EFFECT_RESOLVED events when journal has duplicate invocation keys"]`
- **Found and fixed a bug**: `/babysitter:contrib bugfix: [description of the fix]`
- **Found confusing or missing docs that made diagnosis harder**: `/babysitter:contrib documentation question: [what was unclear or missing]`
- **Found an issue in a plugin**: `/babysitter:contrib bug report: [plugin-name] [description]`
- **Improved a process or skill during diagnosis**: `/babysitter:contrib library contribution: [description]`

Example prompt after diagnosis:

> "Diagnosis found a stale lock -- process 12847 crashed without cleanup. This is a known edge case in the orchestration loop. Even if you don't want to fix it yourself, reporting it helps: run `/babysitter:contrib bug report: orchestration loop doesn't release lock on unhandled rejection` to open an issue."
