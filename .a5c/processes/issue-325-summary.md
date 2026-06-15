Implemented the GitHub Copilot CLI 1.0.54 assimilation on branch `agent/issue-325`.

What changed:
- Retargeted current Copilot CLI graph references from `agentVersion:copilot:ge-1-0-51` to `agentVersion:copilot:ge-1-0-54`.
- Added release metadata for stdin-safe `plugin`/`mcp`/`help`/`version` subcommands, saved-cwd resume with `-C <dir>` override, relative `--attachment`/`--log-dir` handling, MCP OAuth key migration to `oauthClientId` / `auth.redirectPort`, custom-agent `deferred-tool-loading`, and context tier enforcement for compaction/truncation/token display.
- Added a repo-local Babysitter process for this assimilation run.

Verification:
- `git diff --check`
- `npm run verify:metadata`

Residual note: the worktree had unrelated local plugin/Codex setup changes and package-lock churn from dependency installation; the commit intentionally stages only the issue #325 graph/process files.
