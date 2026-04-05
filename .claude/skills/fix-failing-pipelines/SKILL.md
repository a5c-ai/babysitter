---
name: fix-failing-pipelines
description: This skill should be used when the user asks to "fix pipelines", "fix CI", "check staging pipelines", "fix failing workflows", "fix failing actions", or wants to find and fix failing GitHub Actions workflows on the staging branch of the babysitter repo.
---

# Fix Failing Pipelines

Check GitHub Actions workflows on the `staging` branch of https://github.com/a5c-ai/babysitter/actions, identify workflows whose most recent run is failing, and dispatch `/babysitter:yolo` to fix each one.

## Workflow

### Step 1: Fetch Most Recent Run Per Workflow

Use the `gh` CLI to list recent workflow runs on the `staging` branch:

```bash
gh run list --repo a5c-ai/babysitter --branch staging --limit 50 --json databaseId,workflowName,status,conclusion,createdAt,headBranch
```

Group the results by `workflowName`. For each workflow, keep only the **most recent** run (by `createdAt`). Discard workflows where the most recent run is still `in_progress` -- we only care about completed runs.

### Step 2: Identify Failures

From the grouped results, select only workflows where the most recent completed run has `conclusion: "failure"`. Skip workflows whose latest run succeeded, was cancelled, or is still running.

If no workflows have a failing most-recent run, report that all staging pipelines are green and stop.

### Step 3: Get Failure Details

For each failing workflow run, fetch the failed job and step details:

```bash
gh run view <run_id> --repo a5c-ai/babysitter --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {name, conclusion, steps: [.steps[] | select(.conclusion == "failure") | .name]}'
```

Then fetch the logs to understand the actual error:

```bash
gh run view <run_id> --repo a5c-ai/babysitter --log-failed 2>&1 | tail -100
```

### Step 4: Present Failures

Display the list of failing workflows to the user with:
- Workflow name
- Run ID and link
- Failed job name(s) and failed step name(s)
- Brief summary of the error from the logs

### Step 5: Fix via Babysitter

For each failing workflow, invoke the `babysitter:yolo` skill with a prompt that includes the failure context:

```
/babysitter:yolo fix the failing "<workflow_name>" pipeline on staging. The most recent run (<run_id>) failed in job "<job_name>" at step "<step_name>". Error details: <brief_error_summary>. Investigate the failure, fix the root cause, and push a fix to the staging branch. Do not create a new branch -- commit directly to staging.
```

If multiple workflows are failing, process them sequentially -- complete one before starting the next. Present a summary after each fix attempt.

### Step 6: Verify Fixes

After pushing a fix for each workflow, wait briefly then check if a new run was triggered:

```bash
gh run list --repo a5c-ai/babysitter --branch staging --workflow "<workflow_file>" --limit 1 --json databaseId,status,conclusion
```

Report whether a new run was triggered and its current status. Do not wait for it to complete -- just confirm it was triggered.

### Step 7: Summary

After all failing workflows have been addressed, provide a summary:
- Which workflows were failing
- What was fixed for each
- Whether new runs were triggered
- Any workflows that could not be fixed (with reason)

## Notes

- Only the **most recent** run per workflow type matters. Older failures that have since been superseded by a success are not actionable.
- Runs that are `in_progress` are skipped entirely -- they haven't concluded yet.
- Cancelled runs are not treated as failures.
- The `gh` CLI must be authenticated. If authentication fails, prompt the user to run `gh auth login`.
- Each fix is handed off to `/babysitter:yolo` which handles the actual implementation work non-interactively.
- Fixes are committed directly to `staging` -- no feature branches or PRs for pipeline fixes.
- The entire workflow should be without any user interaction or breakpoints in the run, allowing for seamless pipeline repair.
