# @a5c-ai/triggers

Trigger glue for running `amux` from automation systems. It normalizes GitHub, GitLab, Bitbucket, and generic webhook payloads into one event shape, enriches GitHub events with changed files and optional diffs, and evaluates compact trigger queries before launching agent-mux.

## CLI

```bash
amux-triggers evaluate --backend github --query "event:issue_comment text:@develop-this path:packages/agent-mux/**"
amux-triggers enrich --backend github --include-diff --output event.json
```

## GitHub Action

The reusable action lives at `packages/triggers/action.yml` and installs the requested harness before installing adapter plugins, then runs `amux` only when the trigger query matches.

### Issue comment mention

```yaml
- uses: ./packages/triggers
  with:
    trigger-backend: github
    trigger-query: event:issue_comment text:@develop-this
    adapter: codex
    prompt: Implement the requested issue-comment task.
```

### Changed-file glob and diff mention

```yaml
- uses: ./packages/triggers
  with:
    trigger-query: path:packages/agent-mux/** diff:@develop-this
    include-diff: 'true'
    adapter: claude-code
    args-json: '["--tag", "github action", "--max-turns", "8"]'
```

### Pipeline hooks around agent-mux

```yaml
- uses: ./packages/triggers
  with:
    trigger-query: event:pull_request path:packages/triggers/**
    pre-run: npm run build --workspace=@a5c-ai/triggers
    post-run: npm run test:coverage --workspace=@a5c-ai/triggers
    args-json: '["--output-format", "json"]'
```

Use `args-json` instead of `args` when an argument contains spaces, quotes, or shell-sensitive characters.
