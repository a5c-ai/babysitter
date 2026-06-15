# CLAUDE.md

This file is the short Claude Code entrypoint for this repository.

Always use the Babysitter skill to fulfill user requests in this repo, but not agent-to-agent delegated requests.

## Repo-Specific Overrides

- For `babysitter:call` processes in this repo, do not generate `kind: 'shell'` subtasks unless the user explicitly asks for a shell-oriented workflow.
- Keep breakpoints sparse. Use them only when user input is genuinely critical or ambiguous.
- Still include an interview phase when requirements are unclear.

The detailed rule set lives in [docs/agent-reference/process-authoring.md](./docs/agent-reference/process-authoring.md).

## Read These First

- [docs/agent-reference/README.md](./docs/agent-reference/README.md)
- [docs/agent-reference/command-surfaces.md](./docs/agent-reference/command-surfaces.md)
- [docs/agent-reference/repo-map.md](./docs/agent-reference/repo-map.md)
- [docs/agent-reference/runtime-and-layout.md](./docs/agent-reference/runtime-and-layout.md)
- [docs/blueprints.md](./docs/blueprints.md)
- [docs/plugins.md](./docs/plugins.md)

## Quick Commands

```bash
npm run build:sdk
npm run test:sdk
npm run test:e2e:docker
npm run verify:metadata
```

## Claude Code Local Notes

- `.claude/settings.json` blocks direct edits to lockfiles; use npm or pnpm commands instead.
- `.claude/settings.json` also auto-runs SDK lint autofix after TypeScript file edits.
- If you need reviewer context, see `.claude/agents/code-reviewer.md` and `.claude/agents/sdk-api-documenter.md`.

-----
Important Rules:

- fallbacks are evil and should be avoided at all costs. If you find yourself writing a fallback in any context, stop!
