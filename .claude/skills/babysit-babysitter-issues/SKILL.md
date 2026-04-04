---
name: babysit-babysitter-issues
description: This skill should be used when the user asks to "babysit issues", "work on assigned issues", "check a5c-agent issues", "process babysitter issues", or wants to find and work on open GitHub issues assigned to a5c-agent in the babysitter repo.
---

# Babysit Babysitter Issues

Fetch open GitHub issues from https://github.com/a5c-ai/babysitter/issues assigned to `a5c-agent`, then orchestrate work on each issue via `/babysitter:call`.

## Workflow

### Step 1: Fetch Assigned Issues

Use the `gh` CLI to list open issues assigned to `a5c-agent`:

```bash
gh issue list --repo a5c-ai/babysitter --assignee a5c-agent --state open --json number,title,url,labels --limit 50
```

If no issues are found, report that there are no open issues assigned to `a5c-agent` and stop.

### Step 2: Present Issues

Display the list of open issues to the user with their number, title, labels, and URL. Ask the user which issue(s) to work on, or whether to process all of them.

### Step 3: Orchestrate via Babysitter

For each selected issue, invoke the `babysitter:call` skill with a prompt that includes the issue URL and context:

```
/babysitter:call work on this GitHub issue: <issue_url>
```

If multiple issues are selected, process them sequentially -- complete one before starting the next. Present a summary after each issue is processed.

### Step 4: Summary

After all selected issues have been processed, provide a summary of what was done for each issue.

## Notes

- Only issues assigned to `a5c-agent` are fetched. Other assignees are ignored.
- The `gh` CLI must be authenticated. If authentication fails, prompt the user to run `gh auth login`.
- Each issue is handed off to `/babysitter:call` which handles the actual implementation work.
