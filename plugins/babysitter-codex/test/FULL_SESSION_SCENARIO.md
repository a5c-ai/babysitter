# Full Babysitter Session Scenario

This scenario validates end-to-end Babysitter behavior in Codex, including:

- All 15 Babysitter modes (`call`, `yolo`, `resume`, `plan`, `forever`, `doctor`, `observe`, `retrospect`, `model`, `issue`, `help`, `project-install`, `team-install`, `user-install`, `assimilate`)
- Process creation and execution
- Breakpoint generation and breakpoint output acceptance by the run
- Core SDK orchestration flow (`run:create`, `run:iterate`, `task:list`, `task:post`, `run:status`)
- Skill/process library presence and optional upstream import reachability check

## 1. Automated Core Scenario

Run from repo root:

```bash
node test/full-session-scenario.js
```

Optional upstream repository reachability check:

```bash
node test/full-session-scenario.js --upstream-url https://github.com/a5c-ai/babysitter.git
```

### Automated pass criteria

- Required SDK commands exist.
- All 15 local skill directories contain `SKILL.md`.
- A new process is created under `.a5c/processes/full-session-scenario-process.js`.
- A run is created and reaches `completed`.
- At least one `breakpoint` task is emitted.
- Breakpoint output (`approved: true`) is posted and accepted.
- Process output is written to `.a5c/runs/<runId>/state/output.json`.

## 1b. Long-Run Build Scenario (Recommended)

This is the strict end-to-end test that builds a simple artifact and enforces a perfect score.

Run (cross-platform):

```bash
npm run test:long-scenario
```

Windows-only legacy runner (optional):

```powershell
powershell -ExecutionPolicy Bypass -File ./test/full-session-long-run.ps1
```

### Long-run guarantees

- Creates a real process that builds a simple HTML artifact.
- Uses at least 3 interview breakpoints.
- Includes at least one interview breakpoint with 4 distinct questions.
- Validates that user choices (e.g., colors/text) are reflected in generated artifact.
- Simulates at least 60 minutes of AI work (`simulatedAiMinutes >= 60`).
- Produces a strict score out of 100 and fails if score < 100.

## 2. Manual Codex Mode Coverage (All Commands)

Run these prompts in a Codex session and verify expected behavior.

| Mode | Prompt | Expected result |
|------|--------|-----------------|
| help | `babysitter help` | Help response contains available modes and usage |
| call | `babysitter call implement a small change with tests` | New run is created; interactive behavior for breakpoints |
| yolo | `babysitter yolo fix lint in this repo` | Run executes with auto-approved breakpoints/no interaction |
| resume | `babysitter resume latest run` | Existing waiting/executed run continues |
| plan | `babysitter plan backend refactor workflow` | Process plan artifacts created, no execution run |
| forever | `babysitter forever monitor run health every 30m` | Looping periodic process created with sleep gates |
| doctor | `babysitter doctor latest run` | Health diagnostics output with pass/warn/fail checks |
| observe | `babysitter observe workspace` | Observer dashboard starts (or clear unsupported message) |
| model | `babysitter model set execute=gpt-5` | Model routing policy is shown/updated |
| issue | `babysitter issue 123 --repo owner/repo` | Issue context is fetched and converted to execution plan |
| project-install | `babysitter project-install this repo` | Project profile/setup flow executes |
| user-install | `babysitter user-install for backend work` | User profile/setup flow executes |
| assimilate | `babysitter assimilate https://github.com/a5c-ai/babysitter.git` | Assimilation flow starts; generated process/skills/agents or clear fallback message |

## 3. Breakpoint Contract Validation

For at least one run, verify a pending breakpoint task exists and that posting this payload resolves it:

```json
{
  "approved": true,
  "response": "Approved in test scenario"
}
```

Expected: `task:post` succeeds and the run progresses to the next effect.

## 4. Artifact Checklist

- `.a5c/processes/full-session-scenario-process.js`
- `.a5c/processes/full-session-scenario-inputs.json`
- `.a5c/runs/<runId>/tasks/<effectId>/output.json`
- `.a5c/runs/<runId>/state/output.json`
- `.a5c/runs/<runId>/run-trace.jsonl` (if tracing enabled)

## 5. Failure Triage

- If `task:post` fails with missing file: ensure `--value` points to run-relative path `tasks/<effectId>/output.json`.
- If session/profile/health commands are missing: expected in `compat-core` mode; core run/task flow should still pass.
- If PowerShell blocks `npx`: use `npx.cmd`.
