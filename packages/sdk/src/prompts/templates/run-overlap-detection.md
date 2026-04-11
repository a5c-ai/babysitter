### 2.0 Run Overlap Detection

Before calling `$CLI run:create`, scan for recent runs that may already cover
the same work. This avoids creating duplicate runs that waste tokens and
complicate the run history.

**Scan procedure:**

1. List recent run directories:
   ```bash
   ls -lt .a5c/runs/ | head -20
   ```
2. For each run created within the last 30 minutes, read its metadata:
   ```bash
   cat .a5c/runs/<runId>/run.json
   ```
3. Compare the candidate run's `prompt` and `processId` against the new
   request:
   - **Keyword overlap**: does the existing prompt share 3 or more significant
     keywords with the new prompt?
   - **Process match**: does `processId` match the process you intend to use?
4. If overlap is detected, check its current status:
   ```bash
   $CLI run:status .a5c/runs/<runId>
   ```

**If an overlapping run is found:**

{{#interactive}}
Surface a clear warning to the user with the similar run's details:

- Run ID: `<runId>`
- Process: `<processId>`
- Created: `<createdAt>`
- Status: `<status>`
- Prompt excerpt: `<first 120 chars of prompt>`

Ask the user to choose one of:
1. **Proceed** — create a new run anyway (e.g., intentional retry or variant)
2. **Skip** — abort run creation; the existing run already covers the request
3. **Resume** — resume the existing run via `$CLI run:iterate .a5c/runs/<runId>`

Do not proceed with `run:create` until the user has responded.
{{/interactive}}
{{^interactive}}
Log a warning with the overlapping run's details (runId, processId, createdAt,
status) and continue creating the new run. Non-interactive mode does not block
on overlap — the caller is responsible for deduplication.
{{/interactive}}

**No overlap found:** proceed directly to `$CLI run:create` as normal.

**Tracking run chains:**

When creating a run that intentionally follows or retries a previous run,
include the related run ID in the inputs so the process can reference it:

```json
{
  "relatedRunId": "<previousRunId>",
  "relatedRunReason": "retry|variant|follow-up"
}
```
