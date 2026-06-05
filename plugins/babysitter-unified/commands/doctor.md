---
description: Diagnose babysitter run health - journal integrity, state cache, effects, locks, sessions, logs, and disk usage
argument-hint: "[run-id] Optional run ID to diagnose. If omitted, uses the most recent run."
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

You are a diagnostic agent for the babysitter runtime. Your job is to perform a comprehensive health check across 14 areas and produce a structured diagnostic report. Follow each section methodically. Track results as you go and produce the final summary at the end.

Initialize a results tracker with these 14 checks, all starting as PENDING. Valid final check statuses are PASS, WARN, FAIL, ERROR, INFO, and N/A. Treat N/A as neutral: it must never contribute to WARNING or CRITICAL health.
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
11. Session-ID Provenance
12. Ancestor Liveness
13. Concurrent Session Detection
14. Windows Ancestor-Walk Strategy

## Phase 0. Harness Capability Detection

**Goal:** Identify the active harness and whether stop-hook diagnostics apply before evaluating hook health.

- Run this detection before section 1 and save the result for sections 7, 10, 11, 12, 13, and escalation guidance.
- Prefer SDK-owned capability truth. Use `detectCallerHarness()` first, then `detectAdapter()` / `getAdapterByName()` as a fallback. A direct Node probe is acceptable:

```bash
node - <<'NODE'
const sdk = require('@a5c-ai/babysitter-sdk');
const caller = sdk.detectCallerHarness?.() ?? null;
const explicit = process.env.BABYSITTER_HARNESS || process.env.BABYSITTER_HARNESS_NAME;
const adapter = explicit
  ? sdk.getAdapterByName?.(explicit)
  : caller?.name
    ? sdk.getAdapterByName?.(caller.name)
    : sdk.detectAdapter?.();
const capabilities = (adapter?.getCapabilities?.() ?? caller?.capabilities ?? []).map(String);
const supportsStopHook = adapter?.supportsHookType?.('stop')
  ?? (capabilities.length ? capabilities.includes(String(sdk.HarnessCapability.StopHook)) : null);
const supportsSessionStartHook = adapter?.supportsHookType?.('session-start') ?? null;
console.log(JSON.stringify({
  harness: explicit ?? caller?.name ?? adapter?.name ?? 'unknown',
  source: explicit ? 'env' : caller ? 'detectCallerHarness' : adapter ? 'detectAdapter' : 'fallback',
  matchedEnvVars: caller?.matchedEnvVars ?? [],
  capabilities,
  supportsStopHook,
  supportsSessionStartHook,
}, null, 2));
NODE
```

- This probe must use SDK-owned harness truth (`detectCallerHarness`, `getAdapterByName`, `getCapabilities`, and `supportsHookType`) rather than a local capability table in the doctor guidance.
- If the Node probe cannot import the SDK, record the failure and try again after `npm run build:sdk`. If it still fails, use `npx babysitter session:whoami --json`, `run.json`, and harness env vars as low-confidence evidence. Record the fallback and confidence level.
- Display the detected harness, matched evidence, capabilities, and `supportsStopHook` value near the top of the report.
- If the detected harness is known and does not advertise `HarnessCapability.StopHook`, section 10 must be marked `N/A` with a harness-aware explanation. Do not inspect Claude hook files, `hooks.json`, hook shell scripts, or `~/.claude` settings for that harness.
- If the harness is `pi`, explicitly note that Pi uses command-backed skills and extension/session events rather than Claude Code StopHook registration.
- If the harness is unknown and no StopHook capability evidence is available, do not turn missing Claude hook files into a FAIL. Mark section 10 as N/A unless there is explicit evidence that the current harness should provide StopHook hooks.
- Any check may report `N/A` when a capability is explicitly unsupported. `N/A` is neutral: it must not count as PASS, WARN, FAIL, or ERROR for the overall health verdict.

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

**Goal:** Analyze babysitter log files for errors, warnings, and stop hook decisions.

Read the last 50 lines of each of these log files (if they exist):
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/hooks.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-stop-hook.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-stop-hook-stderr.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-session-start-hook.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-session-start-hook-stderr.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter.log`
- `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/` and relevant run/session specific logs there


For each log file:
- If the file does not exist, note it as "Not found (OK if hooks have not run yet)."
- If the file exists, analyze its content.

**Stop hook analysis (babysitter-stop-hook.log):**
- Count lines containing "approve" vs "block" decisions (case-insensitive).
- Display the approve/block ratio.
- Show the last 20 stop hook decision entries (lines containing "approve" or "block").
- Count and display CLI exit codes from lines containing "CLI exit code=".

**Stderr analysis (babysitter-stop-hook-stderr.log, babysitter-session-start-hook-stderr.log):**
- If stderr logs contain content, display the last 20 lines from each.
- Look for common failure patterns: "command not found", "MODULE_NOT_FOUND", "ENOENT", "EACCES", "permission denied", "npm ERR", "Cannot find module".
- Flag any stderr content as a potential issue.

**Error/Warning detection (all logs):**
- Count and list lines containing "ERROR" or "WARN" (case-insensitive).
- Display the last 10 error/warning lines from each log.

Mark as PASS if no ERROR lines found and stderr logs are empty. Mark as WARN if WARN lines found or stderr has content but no ERROR. Mark as FAIL if ERROR lines found.

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

**Goal:** Verify stop-hook health only for harnesses that support StopHook. If the active harness does not support StopHook, report a neutral N/A instead of a failure.

Before running 10a, inspect the Phase 0 harness detection result:

- If `supportsStopHook` is `false`, mark check 10 as `N/A` and skip 10a-10f.
- The N/A detail must say: `N/A - harness <harness> does not advertise HarnessCapability.StopHook; stop-hook registration and Claude-style hook files are not required for this harness.`
- Include the detected capability list and matched evidence in the N/A detail.
- For Pi and Oh My Pi, also note that these harnesses use command-backed skills and extension/session events instead of Claude-style `hooks.json`, `CLAUDE_PLUGIN_ROOT`, hook shell scripts, or `~/.claude` plugin settings.
- Do not mark missing `CLAUDE_PLUGIN_ROOT`, `hooks.json`, `babysitter-stop-hook.sh`, `babysitter-session-start-hook.sh`, or `~/.claude` files as FAIL when `supportsStopHook` is `false`.
- If harness detection is inconclusive but the environment exposes non-StopHook markers such as `PI_SESSION_ID` or `PI_PLUGIN_ROOT`, treat stop-hook execution health as `N/A` for the same reason.
- If `supportsStopHook` is `null` or unknown and there is no explicit evidence that the current harness should provide StopHook hooks, mark check 10 as `N/A` instead of turning missing Claude-style hook files into FAIL.
- Continue with 10a-10f only when `supportsStopHook` is `true` or there is explicit evidence that the current harness should provide StopHook hooks.

### 10a. Hook Registration

- Locate the StopHook-capable plugin root. For Claude Code, check `CLAUDE_PLUGIN_ROOT` first. Otherwise, search for a babysitter `hooks.json` by walking up from the current directory or use the harness-specific plugin root env var from Phase 0.
- If found, read `hooks.json` and verify:
  - A `Stop` hook entry exists with a command referencing `babysitter-stop-hook.sh`.
  - A `SessionStart` hook entry exists with a command referencing `babysitter-session-start-hook.sh`.
- If `hooks.json` is not found for a StopHook-capable harness, mark as FAIL ("Hook registration file not found -- hooks are not registered for the detected StopHook-capable harness").

### 10b. Hook Script Availability

- Locate the hook scripts relative to the plugin root:
  - `hooks/babysitter-stop-hook.sh`
  - `hooks/babysitter-session-start-hook.sh`
- For each script:
  - Check if the file exists.
  - Check if it is executable (`test -x <path>`).
- If any script is missing or not executable, mark as FAIL and list which scripts are missing/not-executable.

### 10c. CLI Availability (babysitter command)

The hooks delegate to the `babysitter` CLI. Check if it is available:
- Run: `command -v babysitter 2>/dev/null && babysitter --version 2>/dev/null`
- If the command is found, display its path and version. Mark sub-check as PASS.
- If not found, check the user-local prefix: `$HOME/.local/bin/babysitter --version 2>/dev/null`
- If neither is found, mark sub-check as FAIL ("babysitter CLI not found — hooks will fail with exit code 127. Install with: `npm i -g @a5c-ai/babysitter-sdk`").

### 10d. Stop Hook Execution Evidence

Check whether the stop hook has actually been invoked during this run's lifetime:

**From log files:**
- Read `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-stop-hook.log` (if it exists).
- Count the number of "Hook script invoked" lines. This is the total invocation count.
- Count the number of "CLI exit code=" lines and extract exit codes.
- If the log file does not exist or has zero invocations, the stop hook has NOT been running.

**From journal events:**
- Search the run's journal events for `STOP_HOOK_INVOKED` type events (using the run:events output from section 2 if available).
- Count the number of STOP_HOOK_INVOKED events.
- If present, display the last 5 with their timestamps and decision data.
- If no STOP_HOOK_INVOKED events exist in the journal, note that the stop hook has not recorded any decisions for this run.

**From stderr:**
- Read `${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}/babysitter-stop-hook-stderr.log`.
- If it contains error output, display it and diagnose:
  - "command not found" or exit code 127 → CLI not installed (see 10c)
  - "MODULE_NOT_FOUND" or "Cannot find module" → SDK package corrupted or not built
  - "ENOENT" → Missing file referenced by the hook
  - "EACCES" or "permission denied" → Permission issue on hook script or CLI
  - "npm ERR" → npm installation failure during hook execution

### 10e. Stop Hook Not Running — Root Cause Diagnosis

If the stop hook shows NO evidence of execution (no log entries, no journal events, zero invocations):

Perform these diagnostic steps in order and report the first failure found:

1. **Plugin not installed**: For Claude Code, check if `CLAUDE_PLUGIN_ROOT` is set. For other StopHook-capable harnesses, check the harness-specific plugin root from Phase 0. Also check if a babysitter plugin directory exists relative to the project root. If none exist, report: "Plugin not installed -- the babysitter plugin directory is missing."

2. **Plugin not enabled**: For Claude Code only, check Claude settings files:
   - `~/.claude/settings.json` — look for `babysitter` in `enabledPlugins`.
   - `~/.claude/plugins/installed_plugins.json` — look for `babysitter` in the plugins list.
   - If not found in either, report: "Plugin not enabled in Claude Code settings."
   For non-Claude StopHook-capable harnesses, use that harness's plugin enablement file or extension registration mechanism instead of `~/.claude`.

3. **hooks.json not registered**: If `hooks.json` doesn't contain a `Stop` hook entry (checked in 10a), report: "Stop hook not registered in hooks.json."

4. **Hook script missing or not executable**: If the stop hook script doesn't exist or isn't executable (checked in 10b), report with the specific file path.

5. **CLI not available**: If `babysitter` CLI is not found (checked in 10c), report: "babysitter CLI not installed — hook script will fail silently."

6. **Hook running but failing silently**: If the log file exists but shows exit codes other than 0, or if stderr has content, report: "Stop hook is being invoked but failing — see stderr log for details."

7. **No active session**: If no session state files exist (from section 6), report: "No active babysitter session — the stop hook only activates when a session is bound to a run."

8. **All checks pass but hook still not running**: Report: "All prerequisites are met but the stop hook shows no evidence of execution. Possible causes: Claude Code may not be invoking plugin hooks (check Claude Code version), or the session may have ended before the hook could fire."

### 10f. Verdict

Mark as PASS if:
- Hook registration is correct (10a)
- Hook scripts exist and are executable (10b)
- CLI is available (10c)
- There is evidence of stop hook execution (10d) with exit code 0

Mark as WARN if:
- Hooks are registered and scripts exist, but there's no evidence of execution yet
- Stop hook ran but had non-zero exit codes

Mark as FAIL if:
- Hook registration is missing
- Hook scripts are missing or not executable
- CLI is not available
- Stop hook is failing (consistent non-zero exit codes or stderr errors)

Mark as N/A if:
- The Phase 0 SDK harness capability probe shows `supportsStopHook: false`
- The detected harness lacks `HarnessCapability.StopHook`

`N/A` is terminal for check 10 and neutral for the final verdict.

---

## 11. Session-ID Provenance

**Goal:** Verify how the current babysitter session ID was resolved and flag stale or shadowed values.

- Invoke: `npx babysitter session:whoami --json`
- Parse the output and inspect the `resolvedFrom` field. Classify as follows:
  - `resolvedFrom: "pid-marker"` → mark as PASS ("Session ID derives from the live harness ancestor process -- authoritative").
  - `resolvedFrom: "env-file"` → mark as PASS with a note ("A harness env file was used; typically healthy. For Claude Code this is commonly `CLAUDE_ENV_FILE`.").
  - `resolvedFrom: "env-var"` → mark as WARN ("`AGENT_SESSION_ID` is set without a corroborating PID marker. Likely stale from a prior harness session -- see GitHub issue #130").
    - Remediation: run `babysitter session:cleanup` and start a fresh harness session, or `unset AGENT_SESSION_ID` before invoking babysitter.
  - `resolvedFrom: "none"` → mark as ERROR ("No session ID resolvable. Either no session-start hook fired, or the ancestor walk failed").

**Env-var shadow check:**
- Independently inspect `envVarPresent` and `envVarMatches` in the output.
- If `envVarPresent && !envVarMatches`, mark as WARN ("`AGENT_SESSION_ID` in env does not match the resolved session ID; a stale value is shadowing the authoritative one. Unset the env var").

---

## 12. Ancestor Liveness

**Goal:** Confirm the PID marker references a live harness process.

- Reuse the `session:whoami --json` output from check 11.
- Inspect the `ancestorAlive` field.
- If `ancestorAlive === false`, mark as ERROR ("The PID marker references a dead harness process").
  - Remediation: `babysitter session:cleanup`.
- Otherwise mark as PASS.

---

## 13. Concurrent Session Detection

**Goal:** Surface multiple live harness sessions that may compete for the same session ID.

- Enumerate files in `~/.a5c/` matching the pattern `current-session-*-pid-*`.
- Count markers per harness (derived from the filename).
- If more than one live marker exists for the same harness, mark as INFO ("Multiple live harness sessions detected; ensure each shell scopes `AGENT_SESSION_ID` appropriately -- the PID marker handles this automatically").
- Otherwise mark as PASS.

---

## 14. Windows Ancestor-Walk Strategy

**Goal:** Verify the ancestor-walk strategy works on Windows, where `wmic` is no longer guaranteed to be present.

- Only run this check when `process.platform === 'win32'`. On other platforms, mark as PASS ("Not applicable -- non-Windows platform").
- Attempt the ancestor walk by invoking `npx babysitter session:whoami --json` (reuse output from check 11 if available).
- If resolution succeeded (any `resolvedFrom` other than `none`), mark as PASS.
- If `resolvedFrom: "none"` on Windows:
  - Test `wmic` availability: `where wmic` via shell.
  - If absent, document that Windows 11 24H2 removed `wmic`; the fallback PowerShell CIM path should handle this.
  - If the PowerShell ancestor walk also failed, mark as ERROR with remediation: ensure PowerShell is available (`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter ProcessId=$PID"` should work).
- If the cascade works but is slow (>5s on first probe), add an INFO note on first-probe latency.

---

## Final Report

After completing all 14 checks, produce the diagnostic report in this format:

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
| 11 | Session-ID Provenance    | <status> |
| 12 | Ancestor Liveness        | <status> |
| 13 | Concurrent Session Detection | <status> |
| 14 | Windows Ancestor-Walk Strategy | <status> |

--------------------------------------------
  ISSUES & RECOMMENDATIONS
--------------------------------------------

<For each WARN, FAIL, or ERROR check, list. Do not list N/A checks here unless the user asks for skipped capability checks:>
- [WARN|FAIL|ERROR] <Check name>: <description of issue>
  Fix: <specific actionable command or instruction>
- Do not add this N/A to warnings, failures, or recommendations.

--------------------------------------------
```

**Overall health determination:**
- **HEALTHY**: All 14 checks are PASS or N/A (INFO notes are acceptable).
- **WARNING**: At least one check is WARN but none are FAIL or ERROR.
- **CRITICAL**: At least one check is FAIL or ERROR.
- **N/A is neutral**: Do not count N/A as PASS, WARN, FAIL, or ERROR. A report with PASS checks plus N/A-only capability skips is HEALTHY.

Present the full detailed findings for each check BEFORE the summary table, so the user can see the evidence. End with the summary table and recommendations. Also, create a single HTML report file with all the findings that uses the arwes UI framework and open it for the user in the browser.

---

## Escalation

If the detected harness is `claude-code` and any check results in FAIL with an unclear root cause after your own analysis -- especially for environment issues, hook execution failures, CLI availability problems, or permission errors that may relate to the Claude Code runtime itself -- invoke the built-in Claude `/debug` command to get additional diagnostic context from the Claude Code environment. This is particularly useful for:
- Hook scripts that should be running but show no evidence of execution (check 10)
- Permission or path resolution issues that don't match expected behavior
- Unexpected CLI behavior that might be a Claude Code environment issue rather than a babysitter issue

Call `/debug` with a summary of the failing check and what you've already ruled out, so it can focus on environment-level causes.

For non-Claude harnesses, do not suggest `/debug`; use the harness's native diagnostics if available, or `/babysitter:contrib` when the issue should be reported upstream.

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

---

## Self-Heal Suggestions

If any of checks 11-14 surface issues (stale env vars, dead ancestor PIDs, shadowed session IDs, or Windows ancestor-walk failures), suggest the following remediation sequence, in order. Present it as an actionable block:

```bash
# 1. Cleanup dead markers and orphaned state files
babysitter session:cleanup --dry-run   # preview
babysitter session:cleanup             # apply

# 2. Unset a stale env var
unset AGENT_SESSION_ID

# 3. Re-bind a run explicitly if needed
babysitter session:resume --session-id <fresh-id> --state-dir ~/.a5c --run-id <runId> --runs-dir .a5c/runs

# 4. Start a fresh harness session (closes and reopens the session)
```

Run steps 1 and 2 first; re-run `/babysitter:doctor` after each step to confirm the session-provenance checks return to PASS. Step 3 is only needed when a specific run must be re-bound to the fresh session. If the issue persists after step 4, escalate via Claude `/debug` only on Claude Code; otherwise use the harness's native diagnostics or `/babysitter:contrib`.
